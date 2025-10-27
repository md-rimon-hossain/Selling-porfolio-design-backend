import mongoose from "mongoose";
import { Request, Response } from "express";
import {
  uploadBufferToCloudinary,
  deleteByPublicId,
} from "../../utils/cloudinary";
import { Design } from "./design.model";
import { Category } from "../category/category.model";

interface AuthRequest extends Request {
  user?: {
    id: mongoose.Types.ObjectId; // Or string, depending on User model
  };
}

const getAllDesigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      mainCategory,
      subCategory,
      complexityLevel,
      status = "Active",
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };

    if (status) filter.status = status;
    if (complexityLevel) filter.complexityLevel = complexityLevel;

    // Validate provided categories (if any) and build filter
    if (mainCategory) {
      if (!mongoose.Types.ObjectId.isValid(mainCategory as string)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid mainCategory ID" });
        return;
      }

      const mainExists = await Category.exists({
        _id: new mongoose.Types.ObjectId(mainCategory as string),
        isActive: true,
        isDeleted: false,
      });

      if (!mainExists) {
        res.status(400).json({
          success: false,
          message: "Main category not found or inactive",
        });
        return;
      }

      filter.mainCategory = new mongoose.Types.ObjectId(mainCategory as string);
    }

    if (subCategory) {
      if (!mongoose.Types.ObjectId.isValid(subCategory as string)) {
        res
          .status(400)
          .json({ success: false, message: "Invalid subCategory ID" });
        return;
      }

      const subDoc = await Category.findOne({
        _id: new mongoose.Types.ObjectId(subCategory as string),
        isActive: true,
        isDeleted: false,
      }).lean();

      if (!subDoc) {
        res.status(400).json({
          success: false,
          message: "Sub category not found or inactive",
        });
        return;
      }

      // If mainCategory provided, ensure relationship
      if (mainCategory) {
        const mainId = (mainCategory as string).toString();
        const parentId = subDoc.parentCategory?.toString();
        if (!parentId || parentId !== mainId) {
          res.status(400).json({
            success: false,
            message:
              "mainCategory and subCategory mismatch - provide matching categories",
          });
          return;
        }
      }

      filter.subCategory = new mongoose.Types.ObjectId(subCategory as string);
    }

    // Price range filter mapped to basePrice
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.basePrice = {} as { $gte?: number; $lte?: number };
      if (minPrice !== undefined) {
        (filter.basePrice as { $gte?: number; $lte?: number }).$gte =
          parseFloat(minPrice as string);
      }
      if (maxPrice !== undefined) {
        (filter.basePrice as { $gte?: number; $lte?: number }).$lte =
          parseFloat(maxPrice as string);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Count total matching documents (before pagination)
    const totalDesigns = await Design.countDocuments(filter);
    const totalPages = Math.ceil(totalDesigns / limitNum);

    // Aggregation pipeline to populate categories and reviews, and ensure categories are active
    const designsWithRating = await Design.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "categories",
          localField: "mainCategory",
          foreignField: "_id",
          as: "mainCategory",
        },
      },
      { $unwind: { path: "$mainCategory", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "mainCategory.isDeleted": false,
          "mainCategory.isActive": true,
          "subCategory.isDeleted": false,
          "subCategory.isActive": true,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "design",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
          totalReviews: { $size: "$reviews" },
        },
      },
      {
        $project: {
          reviews: 0,
          "mainCategory.isDeleted": 0,
          "mainCategory.__v": 0,
          "subCategory.isDeleted": 0,
          "subCategory.__v": 0,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    res.status(200).json({
      success: true,
      message: "Designs retrieved successfully",
      data: designsWithRating,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: totalDesigns,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      filters: {
        mainCategory: mainCategory || null,
        subCategory: subCategory || null,
        complexityLevel: complexityLevel || null,
        status: status || "Active",
        priceRange: {
          min: minPrice ? parseFloat(minPrice as string) : null,
          max: maxPrice ? parseFloat(maxPrice as string) : null,
        },
        search: search || null,
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get designs",
      error: errorMessage,
    });
  }
};

const getSingleDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findById(req.params.id).populate(
      "mainCategory subCategory designer",
      "name description",
    );

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design retrieved successfully",
      data: design,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to get design",
      error: errorMessage,
    });
  }
};

const createNewDesign = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  // 1. Pre-Check for Designer ID
  if (!req.user || !req.user.id) {
    res.status(401).json({
      success: false,
      message: "Authentication error: Designer ID not found in request.",
    });
    return;
  }

  // 2. Start a Mongoose Session for Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  // Track uploaded Cloudinary public IDs so we can cleanup on error
  const uploadedPublicIds: string[] = [];

  try {
    // Validate mainCategory/subCategory relationship before creating
    const { mainCategory, subCategory } = req.body as Record<string, unknown>;

    if (!mainCategory || !subCategory) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: "mainCategory and subCategory are required",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(String(mainCategory)) ||
      !mongoose.Types.ObjectId.isValid(String(subCategory))
    ) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(400)
        .json({ success: false, message: "Invalid category id(s)" });
      return;
    }

    const mainCat = await Category.findOne({
      _id: String(mainCategory),
      isActive: true,
      isDeleted: false,
    }).lean();
    const subCat = await Category.findOne({
      _id: String(subCategory),
      isActive: true,
      isDeleted: false,
    }).lean();

    if (!mainCat || !subCat) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: "Main category or sub category not found or inactive",
      });
      return;
    }

    // Ensure parent-child relationship
    if (
      !subCat.parentCategory ||
      subCat.parentCategory.toString() !== mainCat._id.toString()
    ) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message:
          "mainCategory and subCategory mismatch - provide matching categories",
      });
      return;
    }

    // Handle file uploads (if any)
    // req.files provided by multer.fields middleware in routes
    type UploadedFile = {
      buffer: Buffer;
      mimetype: string;
      size: number;
      originalname?: string;
    };
    type UploadedFiles = Record<string, UploadedFile[] | undefined> | undefined;
    const files = (req as unknown as { files?: UploadedFiles }).files;
    const previewFiles = files?.previewImages || [];
    const downloadableFiles = files?.files || [];

    // per-request uploadedPublicIds will push into outer-scoped array
    const previewImageUrls: string[] = [];
    let downloadableFileObj: Record<string, unknown> | undefined = undefined;

    // validate & upload preview images
    if (previewFiles.length > 0) {
      if (previewFiles.length > 5) {
        await session.abortTransaction();
        session.endSession();
        res
          .status(400)
          .json({ success: false, message: "Max 5 preview images allowed" });
        return;
      }

      for (const f of previewFiles) {
        if (!f.mimetype.startsWith("image/")) {
          await session.abortTransaction();
          session.endSession();
          res
            .status(400)
            .json({ success: false, message: "Invalid preview image type" });
          return;
        }

        const up = await uploadBufferToCloudinary(f.buffer, `designs/previews`);
        uploadedPublicIds.push(up.public_id);
        previewImageUrls.push(up.secure_url);
      }
    }

    // validate & upload downloadable file(s) - keep single downloadableFile object for now (first file)
    if (downloadableFiles.length > 0) {
      // limit to 5 files to avoid abuse
      if (downloadableFiles.length > 5) {
        await session.abortTransaction();
        session.endSession();
        res
          .status(400)
          .json({
            success: false,
            message: "Max 5 downloadable files allowed",
          });
        return;
      }

      const allowedMimes = [
        "application/zip",
        "application/x-zip-compressed",
        "application/pdf",
        "application/octet-stream",
        "image/vnd.adobe.photoshop",
      ];

      // Pick the first file as the primary downloadable file
      const primary = downloadableFiles[0];
      if (primary) {
        if (primary.size <= 0) {
          await session.abortTransaction();
          session.endSession();
          res
            .status(400)
            .json({ success: false, message: "Empty downloadable file" });
          return;
        }

        // allow image types and known archive/pdf types; if unknown, still allow but log
        const mimeOK =
          primary.mimetype.startsWith("image/") ||
          allowedMimes.includes(primary.mimetype);
        if (!mimeOK) {
          await session.abortTransaction();
          session.endSession();
          res
            .status(400)
            .json({
              success: false,
              message: "Unsupported downloadable file type",
            });
          return;
        }

        const up = await uploadBufferToCloudinary(
          primary.buffer,
          `designs/files`,
        );
        uploadedPublicIds.push(up.public_id);
        downloadableFileObj = {
          public_id: up.public_id,
          secure_url: up.secure_url,
          file_format: up.file_format,
          file_size: up.bytes,
        };
      }
    }

    const designData: Record<string, unknown> = {
      ...req.body,
      // Assign the designer ID from the authenticated user
      designer: req.user.id,
    };

    if (previewImageUrls.length) designData.previewImageUrls = previewImageUrls;
    if (downloadableFileObj) designData.downloadableFile = downloadableFileObj;

    // 3. Create and Save the new Design
    // Mongoose validation runs here. If validation fails, it throws an error.
    const [newDesign] = await Design.create([designData], { session });

    // 4. Populate the newly created document for the response
    const populatedDesign = await Design.findById(newDesign._id)
      .session(session) // Important: use the session for the read operation as well
      .populate("designer", "name email")
      .populate("mainCategory", "name description")
      .populate("subCategory", "name description")
      .lean(); // Convert Mongoose Document to plain JavaScript object for performance

    // 5. Commit the transaction
    await session.commitTransaction();

    if (!populatedDesign) {
      // This is a safety check; should only happen if a subsequent read fails inexplicably.
      res.status(500).json({
        success: false,
        message: "Failed to fetch design details after successful creation.",
      });
      return;
    }

    // 6. Success Response
    res.status(201).json({
      success: true,
      message: "Design created successfully! 🎉",
      data: populatedDesign,
    });
  } catch (error: unknown) {
    // 7. Abort the transaction on error
    await session.abortTransaction();

    // Try cleaning up any uploaded Cloudinary assets
    if (uploadedPublicIds.length > 0) {
      try {
        for (const pid of uploadedPublicIds) {
          // best-effort cleanup
          // resource_type defaults to auto
          // don't await serially for long lists in prod; here it's fine for small counts
          await deleteByPublicId(pid);
        }
      } catch {
        // ignore cleanup errors
      }
    }

    let statusCode = 500;
    let errorMessage = "An unknown error occurred.";

    // Mongoose Validation/Casting Error Handling
    if (
      error instanceof mongoose.Error.ValidationError ||
      error instanceof mongoose.Error.CastError
    ) {
      statusCode = 400; // Bad Request for validation errors
      errorMessage = (error as Error).message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // eslint-disable-next-line no-console
    console.error("Design creation error:", error);
    res.status(statusCode).json({
      success: false,
      message: "Failed to create design. Please check the data provided.",
      error: errorMessage,
    });
  } finally {
    // 9. End the session
    session.endSession();
  }
};

// Update design (Admin only)
const updateDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await Design.findById(req.params.id).lean();
    if (!existing) {
      res.status(404).json({ success: false, message: "Design not found" });
      return;
    }

    // If mainCategory/subCategory provided, validate relationship
    const { mainCategory, subCategory } = req.body as Record<string, unknown>;
    const mainToCheck = mainCategory
      ? String(mainCategory)
      : existing.mainCategory?.toString();
    const subToCheck = subCategory
      ? String(subCategory)
      : existing.subCategory?.toString();

    if (mainToCheck && subToCheck) {
      if (
        !mongoose.Types.ObjectId.isValid(mainToCheck) ||
        !mongoose.Types.ObjectId.isValid(subToCheck)
      ) {
        res
          .status(400)
          .json({ success: false, message: "Invalid category id(s)" });
        return;
      }

      const mainCat = await Category.findOne({
        _id: mainToCheck,
        isActive: true,
        isDeleted: false,
      }).lean();
      const subCat = await Category.findOne({
        _id: subToCheck,
        isActive: true,
        isDeleted: false,
      }).lean();

      if (!mainCat || !subCat) {
        res.status(400).json({
          success: false,
          message: "Main category or sub category not found or inactive",
        });
        return;
      }

      if (
        !subCat.parentCategory ||
        subCat.parentCategory.toString() !== mainCat._id.toString()
      ) {
        res.status(400).json({
          success: false,
          message:
            "mainCategory and subCategory mismatch - provide matching categories",
        });
        return;
      }
    }

    const design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("mainCategory", "name description isActive")
      .populate("subCategory", "name description isActive")
      .populate("designer", "name email");

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design updated successfully",
      data: design,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    // eslint-disable-next-line no-console
    console.error("Design update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update design",
      error: errorMessage,
    });
  }
};

// Delete design (Admin only)
const deleteDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true },
    );

    if (!design) {
      res.status(404).json({
        success: false,
        message: "Design not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Design deleted successfully",
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to delete design",
      error: errorMessage,
    });
  }
};

export {
  getAllDesigns,
  getSingleDesign,
  createNewDesign,
  updateDesign,
  deleteDesign,
};
