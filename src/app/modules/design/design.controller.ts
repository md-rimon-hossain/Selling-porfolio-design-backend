import { Request, Response } from "express";
import { Design } from "./design.model";

const getAllDesigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const designs = await Design.find({ status: "Active" })
      .populate("category", "name description isActive")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Designs retrieved successfully",
      data: designs,
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
      "category",
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

// Create new design (Admin only)
const createNewDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = new Design(req.body);
    await design.save();

    const populatedDesign = await Design.findById(design._id).populate(
      "category",
      "name description isActive",
    );

    res.status(201).json({
      success: true,
      message: "Design created successfully",
      data: populatedDesign,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    res.status(500).json({
      success: false,
      message: "Failed to create design",
      error: errorMessage,
    });
  }
};

// Update design (Admin only)
const updateDesign = async (req: Request, res: Response): Promise<void> => {
  try {
    const design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name description isActive");

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
    const design = await Design.findByIdAndUpdate({
     _id: req.params.id,
     isDeleted:true,
    });

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
