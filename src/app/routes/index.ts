import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import designRoutes from "../modules/design/design.routes";
import categoryRoutes from "../modules/category/category.routes";
import pricingPlanRoutes from "../modules/pricingPlan/pricingPlan.routes";
import purchaseRoutes from "../modules/purchase/purchase.routes";
import reviewRoutes from "../modules/review/review.routes";
import downloadRoutes from "../modules/download/download.routes";
import likeRoutes from "../modules/like/like.routes";
import { userRoutes } from "../modules/user/user.routes";
import { PaymentRoutes } from "../modules/payments/payment.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/designs", designRoutes);
router.use("/categories", categoryRoutes);
router.use("/pricing-plans", pricingPlanRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/reviews", reviewRoutes);
router.use("/downloads", downloadRoutes);
router.use("/likes", likeRoutes);
router.use("/payments", PaymentRoutes);

export default router;
