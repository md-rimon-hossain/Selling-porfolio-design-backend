"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDesign = exports.updateDesign = exports.createNewDesign = exports.getSingleDesign = exports.getAllDesigns = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cloudinary_1 = require("../../utils/cloudinary");
const path_1 = __importDefault(require("path"));
const design_model_1 = require("./design.model");
const category_model_1 = require("../category/category.model");
// Helpers to coerce form-data string fields into expected types
function parseArrayField(val) {
    if (val === undefined || val === null)
        return undefined;
    if (Array.isArray(val))
        return val.map(String);
    if (typeof val === "string") {
        const s = val.trim();
        if (!s)
            return undefined;
        // Try JSON parse first (client may send JSON string)
        try {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed))
                return parsed.map(String);
        }
        catch (_a) {
            // fallback: comma separated
            return s
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
        }
    }
    return undefined;
}
function parseNumberField(val) {
    if (val === undefined || val === null)
        return undefined;
    if (typeof val === "number")
        return val;
    if (typeof val === "string") {
        const n = Number(val);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}
const getAllDesigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { mainCategory, subCategory, complexityLevel, tags, status = "Active", minPrice, maxPrice, page = 1, limit = 10, search, } = req.query;
        // helper: normalize comma-separated or array query params into string[]
        const toArray = (val) => {
            if (val === undefined || val === null)
                return undefined;
            if (Array.isArray(val))
                return val
                    .map(String)
                    .map((s) => s.trim())
                    .filter(Boolean);
            if (typeof val === "string")
                return val
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
            return undefined;
        };
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        // complexityLevel can be single or multi (comma-separated or array)
        const complexityArr = toArray(complexityLevel);
        if (complexityArr && complexityArr.length > 0)
            filter.complexityLevel = { $in: complexityArr };
        else if (complexityLevel)
            filter.complexityLevel = complexityLevel;
        // tags filter (frontend may send tags=logo,vector or tags[]=logo&tags[]=vector)
        const tagsArr = toArray(tags);
        if (tagsArr && tagsArr.length > 0)
            filter.tags = { $in: tagsArr };
        // Validate provided categories (if any) and build filter
        if (mainCategory) {
            const mc = String(mainCategory);
            // If value is an ObjectId, use it. Otherwise treat as slug and resolve to id.
            if (mongoose_1.default.Types.ObjectId.isValid(mc)) {
                const mainExists = yield category_model_1.Category.exists({
                    _id: new mongoose_1.default.Types.ObjectId(mc),
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
                filter.mainCategory = new mongoose_1.default.Types.ObjectId(mc);
            }
            else {
                // treat as slug
                const mainDoc = yield category_model_1.Category.findOne({
                    slug: mc,
                    isActive: true,
                    isDeleted: false,
                }).lean();
                if (!mainDoc) {
                    res.status(400).json({
                        success: false,
                        message: "Main category (slug) not found or inactive",
                    });
                    return;
                }
                filter.mainCategory = mainDoc._id;
            }
        }
        if (subCategory) {
            const sc = String(subCategory);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let subDoc = null;
            if (mongoose_1.default.Types.ObjectId.isValid(sc)) {
                subDoc = yield category_model_1.Category.findOne({
                    _id: new mongoose_1.default.Types.ObjectId(sc),
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
            }
            else {
                // treat as slug
                subDoc = yield category_model_1.Category.findOne({
                    slug: sc,
                    isActive: true,
                    isDeleted: false,
                }).lean();
                if (!subDoc) {
                    res.status(400).json({
                        success: false,
                        message: "Sub category (slug) not found or inactive",
                    });
                    return;
                }
            }
            // If mainCategory provided, ensure relationship
            if (mainCategory) {
                // resolve mainCategory id if it was a slug
                let mainIdToCompare = String(mainCategory);
                if (!mongoose_1.default.Types.ObjectId.isValid(mainIdToCompare)) {
                    const mainDoc = yield category_model_1.Category.findOne({
                        slug: mainIdToCompare,
                        isActive: true,
                        isDeleted: false,
                    }).lean();
                    mainIdToCompare = (_b = (_a = mainDoc === null || mainDoc === void 0 ? void 0 : mainDoc._id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : mainIdToCompare;
                }
                const parentId = (_c = subDoc.parentCategory) === null || _c === void 0 ? void 0 : _c.toString();
                if (!parentId || parentId !== mainIdToCompare) {
                    res.status(400).json({
                        success: false,
                        message: "mainCategory and subCategory mismatch - provide matching categories",
                    });
                    return;
                }
            }
            filter.subCategory = subDoc._id;
        }
        // Price range filter mapped to basePrice
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.discountedPrice = {};
            if (minPrice !== undefined) {
                filter.discountedPrice.$gte =
                    parseFloat(minPrice);
            }
            if (maxPrice !== undefined) {
                filter.discountedPrice.$lte =
                    parseFloat(maxPrice);
            }
        }
        // Search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $in: [new RegExp(search, "i")] } },
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Count total matching documents (before pagination)
        const totalDesigns = yield design_model_1.Design.countDocuments(filter);
        const totalPages = Math.ceil(totalDesigns / limitNum);
        // Aggregation pipeline to populate categories and reviews, and ensure categories are active
        const designsWithRating = yield design_model_1.Design.aggregate([
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
            // ✅ Populate designer (User)
            {
                $lookup: {
                    from: "users",
                    localField: "designer",
                    foreignField: "_id",
                    as: "designer",
                },
            },
            { $unwind: { path: "$designer", preserveNullAndEmptyArrays: true } },
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
                    min: minPrice ? parseFloat(minPrice) : null,
                    max: maxPrice ? parseFloat(maxPrice) : null,
                },
                search: search || null,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get designs",
            error: errorMessage,
        });
    }
});
exports.getAllDesigns = getAllDesigns;
const getSingleDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = yield design_model_1.Design.findById(req.params.id)
            .populate("mainCategory subCategory designer", "name description")
            .select("-isDeleted -downloadableFile.secure_url");
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to get design",
            error: errorMessage,
        });
    }
});
exports.getSingleDesign = getSingleDesign;
const createNewDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // 1. Pre-Check for Designer ID
    if (!req.user || !req.user.id) {
        res.status(401).json({
            success: false,
            message: "Authentication error: Designer ID not found in request.",
        });
        return;
    }
    // 2. Start a Mongoose Session for Transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    // Track uploaded Cloudinary public IDs so we can cleanup on error
    const uploadedPublicIds = [];
    try {
        // Validate mainCategory/subCategory relationship before creating
        // Parse and coerce form-data values (multipart sends everything as strings)
        const rawBody = req.body;
        const parsedBody = Object.assign({}, rawBody);
        // Arrays that might arrive as JSON strings or comma-separated strings
        const maybeArrayFields = [
            "includedFormats",
            "usedTools",
            "effectsUsed",
            "tags",
            "previewImageUrls",
        ];
        for (const f of maybeArrayFields) {
            const parsed = parseArrayField(rawBody[f]);
            if (parsed !== undefined)
                parsedBody[f] = parsed;
        }
        // Numeric fields
        const maybeNumberFields = ["basePrice", "discountedPrice"];
        for (const f of maybeNumberFields) {
            const parsed = parseNumberField(rawBody[f]);
            if (parsed !== undefined)
                parsedBody[f] = parsed;
        }
        const { mainCategory, subCategory } = parsedBody;
        if (!mainCategory || !subCategory) {
            yield session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: "mainCategory and subCategory are required",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(String(mainCategory)) ||
            !mongoose_1.default.Types.ObjectId.isValid(String(subCategory))) {
            yield session.abortTransaction();
            session.endSession();
            res
                .status(400)
                .json({ success: false, message: "Invalid category id(s)" });
            return;
        }
        const mainCat = yield category_model_1.Category.findOne({
            _id: String(mainCategory),
            isActive: true,
            isDeleted: false,
        }).lean();
        const subCat = yield category_model_1.Category.findOne({
            _id: String(subCategory),
            isActive: true,
            isDeleted: false,
        }).lean();
        if (!mainCat || !subCat) {
            yield session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: "Main category or sub category not found or inactive",
            });
            return;
        }
        // Ensure parent-child relationship
        if (!subCat.parentCategory ||
            subCat.parentCategory.toString() !== mainCat._id.toString()) {
            yield session.abortTransaction();
            session.endSession();
            res.status(400).json({
                success: false,
                message: "mainCategory and subCategory mismatch - provide matching categories",
            });
            return;
        }
        const files = req.files;
        const previewFiles = (files === null || files === void 0 ? void 0 : files.previewImages) || [];
        const downloadableFiles = (files === null || files === void 0 ? void 0 : files.files) || [];
        // per-request uploadedPublicIds will push into outer-scoped array
        const previewImageUrls = [];
        let downloadableFileObj = undefined;
        // validate & upload preview images
        if (previewFiles.length > 0) {
            if (previewFiles.length > 5) {
                yield session.abortTransaction();
                session.endSession();
                res
                    .status(400)
                    .json({ success: false, message: "Max 5 preview images allowed" });
                return;
            }
            for (const f of previewFiles) {
                if (!f.mimetype.startsWith("image/")) {
                    yield session.abortTransaction();
                    session.endSession();
                    res
                        .status(400)
                        .json({ success: false, message: "Invalid preview image type" });
                    return;
                }
                const up = yield (0, cloudinary_1.uploadBufferToCloudinary)(f.buffer, `designs/previews`, "image", {
                    originalName: f.originalname,
                    useFilename: true,
                    uniqueFilename: true,
                });
                // Debug log
                // eslint-disable-next-line no-console
                console.debug("Cloudinary preview upload:", up);
                uploadedPublicIds.push(up.public_id);
                previewImageUrls.push(up.secure_url);
            }
        }
        // validate & upload downloadable file(s) - keep single downloadableFile object for now (first file)
        if (downloadableFiles.length > 0) {
            // limit to 5 files to avoid abuse
            if (downloadableFiles.length > 5) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
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
                    yield session.abortTransaction();
                    session.endSession();
                    res
                        .status(400)
                        .json({ success: false, message: "Empty downloadable file" });
                    return;
                }
                // allow image types and known archive/pdf types; if unknown, still allow but log
                const mimeOK = primary.mimetype.startsWith("image/") ||
                    allowedMimes.includes(primary.mimetype);
                if (!mimeOK) {
                    yield session.abortTransaction();
                    session.endSession();
                    res.status(400).json({
                        success: false,
                        message: "Unsupported downloadable file type",
                    });
                    return;
                }
                // try to hint Cloudinary to use original filename so format is inferred
                const ext = primary.originalname
                    ? path_1.default.extname(primary.originalname).replace(/^[.]/, "").toLowerCase()
                    : undefined;
                const up = yield (0, cloudinary_1.uploadBufferToCloudinary)(primary.buffer, `designs/files`, "raw", {
                    originalName: primary.originalname,
                    useFilename: true,
                    uniqueFilename: true,
                    forceFormat: ext || undefined,
                });
                // Debug log
                // eslint-disable-next-line no-console
                console.debug("Cloudinary downloadable upload:", up);
                uploadedPublicIds.push(up.public_id);
                // Derive a file_format if Cloudinary returned empty
                let derivedFormat = undefined;
                try {
                    if (up.file_format && String(up.file_format).trim()) {
                        derivedFormat = String(up.file_format).trim();
                    }
                }
                catch (_b) {
                    // ignore
                }
                if (!derivedFormat && primary.originalname) {
                    const parts = String(primary.originalname).split(".");
                    if (parts.length > 1)
                        derivedFormat = (_a = parts.pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                }
                if (!derivedFormat && primary.mimetype) {
                    const mimetParts = String(primary.mimetype).split("/");
                    derivedFormat = mimetParts[mimetParts.length - 1];
                }
                if (!derivedFormat)
                    derivedFormat = "binary";
                const derivedSize = Number.isFinite(Number(up.bytes))
                    ? Number(up.bytes)
                    : primary.size || 0;
                downloadableFileObj = {
                    public_id: up.public_id,
                    secure_url: up.secure_url,
                    file_format: derivedFormat,
                    file_size: derivedSize,
                };
                // Debug
                // eslint-disable-next-line no-console
                console.debug("Derived downloadableFileObj:", downloadableFileObj);
            }
        }
        const designData = Object.assign(Object.assign({}, parsedBody), { 
            // Assign the designer ID from the authenticated user
            designer: req.user.id });
        if (previewImageUrls.length)
            designData.previewImageUrls = previewImageUrls;
        if (downloadableFileObj)
            designData.downloadableFile = downloadableFileObj;
        // 3. Create and Save the new Design
        // Mongoose validation runs here. If validation fails, it throws an error.
        const [newDesign] = yield design_model_1.Design.create([designData], { session });
        // 4. Populate the newly created document for the response
        const populatedDesign = yield design_model_1.Design.findById(newDesign._id)
            .session(session) // Important: use the session for the read operation as well
            .populate("designer", "name email")
            .populate("mainCategory", "name description")
            .populate("subCategory", "name description")
            .lean(); // Convert Mongoose Document to plain JavaScript object for performance
        // 5. Commit the transaction
        yield session.commitTransaction();
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
    }
    catch (error) {
        // 7. Abort the transaction on error
        yield session.abortTransaction();
        // Try cleaning up any uploaded Cloudinary assets
        if (uploadedPublicIds.length > 0) {
            try {
                for (const pid of uploadedPublicIds) {
                    // best-effort cleanup
                    // resource_type defaults to auto
                    // don't await serially for long lists in prod; here it's fine for small counts
                    yield (0, cloudinary_1.deleteByPublicId)(pid);
                }
            }
            catch (_c) {
                // ignore cleanup errors
            }
        }
        let statusCode = 500;
        let errorMessage = "An unknown error occurred.";
        // Mongoose Validation/Casting Error Handling
        if (error instanceof mongoose_1.default.Error.ValidationError ||
            error instanceof mongoose_1.default.Error.CastError) {
            statusCode = 400; // Bad Request for validation errors
            errorMessage = error.message;
        }
        else if (error instanceof Error) {
            errorMessage = error.message;
        }
        // eslint-disable-next-line no-console
        console.error("Design creation error:", error);
        res.status(statusCode).json({
            success: false,
            message: "Failed to create design. Please check the data provided.",
            error: errorMessage,
        });
    }
    finally {
        // 9. End the session
        session.endSession();
    }
});
exports.createNewDesign = createNewDesign;
// Update design (Admin only) - handles file uploads and deletions
const updateDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // 1. Start a Mongoose Session for Transaction
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    // Track uploaded Cloudinary public IDs so we can cleanup on error
    const uploadedPublicIds = [];
    try {
        const existing = yield design_model_1.Design.findById(req.params.id)
            .session(session)
            .lean();
        if (!existing) {
            yield session.abortTransaction();
            session.endSession();
            res.status(404).json({ success: false, message: "Design not found" });
            return;
        }
        // Parse and coerce form-data values (multipart sends everything as strings)
        const rawBody = req.body;
        const parsedBody = Object.assign({}, rawBody);
        // Arrays that might arrive as JSON strings or comma-separated strings
        const maybeArrayFields = [
            "includedFormats",
            "usedTools",
            "effectsUsed",
            "tags",
            "previewImageUrls",
        ];
        for (const f of maybeArrayFields) {
            const parsed = parseArrayField(rawBody[f]);
            if (parsed !== undefined)
                parsedBody[f] = parsed;
        }
        // Numeric fields
        const maybeNumberFields = ["basePrice", "discountedPrice"];
        for (const f of maybeNumberFields) {
            const parsed = parseNumberField(rawBody[f]);
            if (parsed !== undefined)
                parsedBody[f] = parsed;
        }
        // If mainCategory/subCategory provided, validate relationship
        const { mainCategory, subCategory } = parsedBody;
        const mainToCheck = mainCategory
            ? String(mainCategory)
            : (_a = existing.mainCategory) === null || _a === void 0 ? void 0 : _a.toString();
        const subToCheck = subCategory
            ? String(subCategory)
            : (_b = existing.subCategory) === null || _b === void 0 ? void 0 : _b.toString();
        if (mainToCheck && subToCheck) {
            if (!mongoose_1.default.Types.ObjectId.isValid(mainToCheck) ||
                !mongoose_1.default.Types.ObjectId.isValid(subToCheck)) {
                yield session.abortTransaction();
                session.endSession();
                res
                    .status(400)
                    .json({ success: false, message: "Invalid category id(s)" });
                return;
            }
            const mainCat = yield category_model_1.Category.findOne({
                _id: mainToCheck,
                isActive: true,
                isDeleted: false,
            }).lean();
            const subCat = yield category_model_1.Category.findOne({
                _id: subToCheck,
                isActive: true,
                isDeleted: false,
            }).lean();
            if (!mainCat || !subCat) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    success: false,
                    message: "Main category or sub category not found or inactive",
                });
                return;
            }
            if (!subCat.parentCategory ||
                subCat.parentCategory.toString() !== mainCat._id.toString()) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    success: false,
                    message: "mainCategory and subCategory mismatch - provide matching categories",
                });
                return;
            }
        }
        const files = req.files;
        const previewFiles = (files === null || files === void 0 ? void 0 : files.previewImages) || [];
        const downloadableFiles = (files === null || files === void 0 ? void 0 : files.files) || [];
        // Handle deletion of existing files
        const { deletePreviewImages, deleteDownloadableFile } = parsedBody;
        // Delete specific preview images
        const updatedPreviewUrls = [...(existing.previewImageUrls || [])];
        if (deletePreviewImages && Array.isArray(deletePreviewImages)) {
            const urlsToDelete = deletePreviewImages;
            for (const url of urlsToDelete) {
                const index = updatedPreviewUrls.indexOf(url);
                if (index > -1) {
                    updatedPreviewUrls.splice(index, 1);
                    // Delete from Cloudinary
                    try {
                        const urlParts = url.split("/");
                        const publicIdWithExt = urlParts[urlParts.length - 1];
                        const publicId = publicIdWithExt.split(".")[0];
                        yield (0, cloudinary_1.deleteByPublicId)(publicId);
                    }
                    catch (err) {
                        // eslint-disable-next-line no-console
                        console.error("Failed to delete preview image:", err);
                    }
                }
            }
        }
        // Delete downloadable file
        let downloadableFileToSet = existing.downloadableFile;
        if (deleteDownloadableFile === true) {
            if (existing.downloadableFile && existing.downloadableFile.public_id) {
                try {
                    yield (0, cloudinary_1.deleteByPublicId)(existing.downloadableFile.public_id);
                }
                catch (err) {
                    // eslint-disable-next-line no-console
                    console.error("Failed to delete downloadable file:", err);
                }
            }
            downloadableFileToSet = undefined; // Allow undefined for deletion
        }
        let downloadableFileObj = undefined;
        // If new preview images uploaded, upload them and add to existing
        if (previewFiles.length > 0) {
            if (updatedPreviewUrls.length + previewFiles.length > 5) {
                yield session.abortTransaction();
                session.endSession();
                res
                    .status(400)
                    .json({ success: false, message: "Max 5 preview images allowed" });
                return;
            }
            for (const f of previewFiles) {
                if (!f.mimetype.startsWith("image/")) {
                    yield session.abortTransaction();
                    session.endSession();
                    res
                        .status(400)
                        .json({ success: false, message: "Invalid preview image type" });
                    return;
                }
                const up = yield (0, cloudinary_1.uploadBufferToCloudinary)(f.buffer, `designs/previews`, "image", {
                    originalName: f.originalname,
                    useFilename: true,
                    uniqueFilename: true,
                });
                uploadedPublicIds.push(up.public_id);
                updatedPreviewUrls.push(up.secure_url);
            }
        }
        // If new downloadable file uploaded, upload it and delete old one
        if (downloadableFiles.length > 0) {
            if (downloadableFiles.length > 1) {
                yield session.abortTransaction();
                session.endSession();
                res.status(400).json({
                    success: false,
                    message: "Only one downloadable file allowed",
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
            const primary = downloadableFiles[0];
            if (primary) {
                if (primary.size <= 0) {
                    yield session.abortTransaction();
                    session.endSession();
                    res
                        .status(400)
                        .json({ success: false, message: "Empty downloadable file" });
                    return;
                }
                const mimeOK = primary.mimetype.startsWith("image/") ||
                    allowedMimes.includes(primary.mimetype);
                if (!mimeOK) {
                    yield session.abortTransaction();
                    session.endSession();
                    res.status(400).json({
                        success: false,
                        message: "Unsupported downloadable file type",
                    });
                    return;
                }
                const ext = primary.originalname
                    ? path_1.default.extname(primary.originalname).replace(/^[.]/, "").toLowerCase()
                    : undefined;
                const up = yield (0, cloudinary_1.uploadBufferToCloudinary)(primary.buffer, `designs/files`, "raw", {
                    originalName: primary.originalname,
                    useFilename: true,
                    uniqueFilename: true,
                    forceFormat: ext || undefined,
                });
                uploadedPublicIds.push(up.public_id);
                let derivedFormat = undefined;
                try {
                    if (up.file_format && String(up.file_format).trim()) {
                        derivedFormat = String(up.file_format).trim();
                    }
                }
                catch (_d) {
                    // ignore
                }
                if (!derivedFormat && primary.originalname) {
                    const parts = String(primary.originalname).split(".");
                    if (parts.length > 1)
                        derivedFormat = (_c = parts.pop()) === null || _c === void 0 ? void 0 : _c.toLowerCase();
                }
                if (!derivedFormat && primary.mimetype) {
                    const mimetParts = String(primary.mimetype).split("/");
                    derivedFormat = mimetParts[mimetParts.length - 1];
                }
                if (!derivedFormat)
                    derivedFormat = "binary";
                const derivedSize = Number.isFinite(Number(up.bytes))
                    ? Number(up.bytes)
                    : primary.size || 0;
                downloadableFileObj = {
                    public_id: up.public_id,
                    secure_url: up.secure_url,
                    file_format: derivedFormat,
                    file_size: derivedSize,
                };
                // Delete old downloadable file from Cloudinary
                if (existing.downloadableFile && existing.downloadableFile.public_id) {
                    try {
                        yield (0, cloudinary_1.deleteByPublicId)(existing.downloadableFile.public_id);
                    }
                    catch (err) {
                        // eslint-disable-next-line no-console
                        console.error("Failed to delete old downloadable file:", err);
                    }
                }
            }
        }
        // Prepare update data
        const updateData = Object.assign({}, parsedBody);
        // Remove the delete fields from updateData as they are handled separately
        delete updateData.deletePreviewImages;
        delete updateData.deleteDownloadableFile;
        // Set preview images: use updated list (after deletions and additions)
        updateData.previewImageUrls = updatedPreviewUrls;
        // Set downloadable file: new upload takes precedence, else use the possibly deleted existing
        if (downloadableFileObj) {
            updateData.downloadableFile = downloadableFileObj;
        }
        else if (downloadableFileToSet !== existing.downloadableFile) {
            // If it was deleted, set to undefined
            updateData.downloadableFile = downloadableFileToSet;
        }
        // Update the design
        const design = yield design_model_1.Design.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
            session,
        })
            .populate("mainCategory", "name description isActive")
            .populate("subCategory", "name description isActive")
            .populate("designer", "name email");
        if (!design) {
            yield session.abortTransaction();
            session.endSession();
            res.status(404).json({
                success: false,
                message: "Design not found",
            });
            return;
        }
        // Commit the transaction
        yield session.commitTransaction();
        res.status(200).json({
            success: true,
            message: "Design updated successfully",
            data: design,
        });
    }
    catch (error) {
        // Abort the transaction on error
        yield session.abortTransaction();
        // Try cleaning up any uploaded Cloudinary assets
        if (uploadedPublicIds.length > 0) {
            try {
                for (const pid of uploadedPublicIds) {
                    yield (0, cloudinary_1.deleteByPublicId)(pid);
                }
            }
            catch (_e) {
                // ignore cleanup errors
            }
        }
        let statusCode = 500;
        let errorMessage = "An unknown error occurred.";
        if (error instanceof mongoose_1.default.Error.ValidationError ||
            error instanceof mongoose_1.default.Error.CastError) {
            statusCode = 400;
            errorMessage = error.message;
        }
        else if (error instanceof Error) {
            errorMessage = error.message;
        }
        // eslint-disable-next-line no-console
        console.error("Design update error:", error);
        res.status(statusCode).json({
            success: false,
            message: "Failed to update design",
            error: errorMessage,
        });
    }
    finally {
        session.endSession();
    }
});
exports.updateDesign = updateDesign;
// Delete design (Admin only)  (soft delete by setting isDeleted flag ALSO HAVE TO WORK ON THAT LATER) TODO::: DELETE FROM CLOUDINARY TOO
const deleteDesign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const design = yield design_model_1.Design.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({
            success: false,
            message: "Failed to delete design",
            error: errorMessage,
        });
    }
});
exports.deleteDesign = deleteDesign;
