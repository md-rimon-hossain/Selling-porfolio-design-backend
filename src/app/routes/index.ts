import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import designRoutes from "../modules/design/design.routes";
import categoryRoutes from "../modules/category/category.routes";
import pricingPlanRoutes from "../modules/pricingPlan/pricingPlan.routes";
import purchaseRoutes from "../modules/purchase/purchase.routes";
import reviewRoutes from "../modules/review/review.routes";
import downloadRoutes from "../modules/download/download.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/designs", designRoutes);
router.use("/categories", categoryRoutes);
router.use("/pricing-plans", pricingPlanRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/reviews", reviewRoutes);
router.use("/downloads", downloadRoutes);

export default router;
