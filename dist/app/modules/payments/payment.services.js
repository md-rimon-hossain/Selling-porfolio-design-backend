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
exports.PaymentServiceInstance = void 0;
// src/app/modules/payments/payment.service.ts
const stripe_1 = __importDefault(require("stripe"));
const mongoose_1 = require("mongoose");
const payment_model_1 = require("./payment.model");
const purchase_model_1 = require("../purchase/purchase.model");
const design_model_1 = require("../design/design.model");
const course_model_1 = require("../course/course.model");
const pricingPlan_model_1 = require("../pricingPlan/pricingPlan.model");
// Stripe initialization with latest API
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-10-29.clover",
});
/**
 * Create a payment intent and save payment record
 * Validates product exists and is available for purchase
 */
const createPaymentIntentService = (userId_1, productType_1, productId_1, ...args_1) => __awaiter(void 0, [userId_1, productType_1, productId_1, ...args_1], void 0, function* (userId, productType, productId, currency = "USD") {
    // Validate inputs
    if (!mongoose_1.Types.ObjectId.isValid(userId) || !mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid user ID or product ID");
    }
    let amount = 0;
    let productName = "";
    const productData = {};
    // Validate product exists and get amount
    switch (productType) {
        case "design": {
            const design = yield design_model_1.Design.findById(productId);
            if (!design || design.status !== "Active") {
                throw new Error("Design not found or not available for purchase");
            }
            amount = Math.round((design.discountedPrice || design.basePrice) * 100); // Convert to cents
            productName = design.title;
            productData.designId = productId;
            break;
        }
        case "course": {
            const course = yield course_model_1.Course.findById(productId);
            if (!course || course.status !== "Active") {
                throw new Error("Course not found or not available for purchase");
            }
            amount = Math.round((course.discountedPrice || course.basePrice) * 100);
            productName = course.title;
            productData.courseId = productId;
            break;
        }
        case "subscription": {
            const plan = yield pricingPlan_model_1.PricingPlan.findById(productId);
            if (!plan || !plan.isActive) {
                throw new Error("Pricing plan not found or not available");
            }
            if (plan.validUntil && new Date() > plan.validUntil) {
                throw new Error("Pricing plan has expired");
            }
            amount = Math.round((plan.finalPrice || plan.price) * 100);
            productName = plan.name;
            productData.pricingPlanId = productId;
            break;
        }
        default:
            throw new Error("Invalid product type");
    }
    if (amount <= 0) {
        throw new Error("Invalid amount: must be greater than 0");
    }
    try {
        // Check for duplicate pending payment
        const existingPendingPayment = yield payment_model_1.Payment.findOne(Object.assign(Object.assign({ userId,
            productType }, productData), { status: "pending" }));
        if (existingPendingPayment) {
            // Return existing payment intent if still valid
            const existingIntent = yield stripe.paymentIntents.retrieve(existingPendingPayment.paymentIntentId);
            if (existingIntent.status === "requires_payment_method" ||
                existingIntent.status === "requires_confirmation") {
                return {
                    clientSecret: existingIntent.client_secret,
                    paymentIntentId: existingIntent.id,
                };
            }
        }
        // Create new PaymentIntent on Stripe
        const paymentIntent = yield stripe.paymentIntents.create({
            amount,
            currency: currency.toLowerCase(),
            payment_method_types: ["card"],
            metadata: {
                userId,
                productType,
                productId,
                productName,
            },
        });
        // Save payment record in MongoDB
        yield payment_model_1.Payment.create(Object.assign(Object.assign({ userId,
            productType }, productData), { amount: amount / 100, currency: currency.toUpperCase(), status: "pending", paymentIntentId: paymentIntent.id }));
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to create payment intent:", error);
        throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
});
/**
 * Confirm payment after successful charge
 * Creates Purchase record and grants access
 * Uses MongoDB transaction for atomicity
 */
const confirmPaymentService = (paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        // Retrieve payment intent from Stripe
        const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
        // Find payment record
        const payment = yield payment_model_1.Payment.findOne({ paymentIntentId }).session(session);
        if (!payment) {
            throw new Error("Payment record not found");
        }
        // Check if already processed
        if (payment.status === "succeeded" && payment.purchaseId) {
            yield session.abortTransaction();
            return {
                status: paymentIntent.status,
                purchaseId: payment.purchaseId.toString(),
            };
        }
        // Update payment status
        const updateData = {
            status: paymentIntent.status,
            paymentMethod: (_a = paymentIntent.payment_method) === null || _a === void 0 ? void 0 : _a.toString(),
        };
        if (paymentIntent.status === "succeeded") {
            updateData.succeededAt = new Date();
            // Helper function to get currency symbol
            const getCurrencySymbol = (currency) => {
                const symbols = {
                    BDT: "৳",
                    USD: "$",
                    EUR: "€",
                    GBP: "£",
                    JPY: "¥",
                    INR: "₹",
                    CAD: "$",
                    AUD: "$",
                };
                return symbols[currency.toUpperCase()] || "$";
            };
            // Create Purchase record
            const purchaseData = {
                user: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                currencyDisplay: getCurrencySymbol(payment.currency),
                paymentMethod: "stripe",
                status: "completed",
                purchaseDate: new Date(),
                activatedAt: new Date(),
                paymentDetails: {
                    paymentIntentId: paymentIntent.id,
                    paymentMethod: paymentIntent.payment_method,
                },
                // Stripe-specific fields for direct reference
                stripePaymentIntentId: paymentIntent.id,
                stripeCustomerId: (_b = paymentIntent.customer) === null || _b === void 0 ? void 0 : _b.toString(),
            };
            // Set purchase type and product reference
            if (payment.productType === "subscription") {
                purchaseData.purchaseType = "subscription";
                purchaseData.pricingPlan = payment.pricingPlanId;
                // Calculate subscription dates
                const plan = yield pricingPlan_model_1.PricingPlan.findById(payment.pricingPlanId).session(session);
                if (plan) {
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    const duration = plan.duration.toLowerCase();
                    if (duration.includes("month")) {
                        const months = parseInt(((_c = duration.match(/\d+/)) === null || _c === void 0 ? void 0 : _c[0]) || "1");
                        endDate.setMonth(endDate.getMonth() + months);
                    }
                    else if (duration.includes("year")) {
                        const years = parseInt(((_d = duration.match(/\d+/)) === null || _d === void 0 ? void 0 : _d[0]) || "1");
                        endDate.setFullYear(endDate.getFullYear() + years);
                    }
                    else {
                        endDate.setMonth(endDate.getMonth() + 1);
                    }
                    purchaseData.subscriptionStartDate = startDate;
                    purchaseData.subscriptionEndDate = endDate;
                    purchaseData.remainingDownloads = plan.maxDownloads || 999999;
                    purchaseData.itemMaxDownloads = plan.maxDownloads || 999999; // Track original max downloads
                }
            }
            else {
                purchaseData.purchaseType = "individual";
                if (payment.productType === "design") {
                    purchaseData.design = payment.designId;
                }
                else if (payment.productType === "course") {
                    purchaseData.course = payment.courseId;
                }
            }
            // Create purchase
            const purchase = yield purchase_model_1.Purchase.create([purchaseData], { session });
            updateData.purchaseId = purchase[0]._id;
            // Update payment with purchase reference
            yield payment_model_1.Payment.findByIdAndUpdate(payment._id, updateData, {
                session,
                new: true,
            });
            yield session.commitTransaction();
            return {
                status: paymentIntent.status,
                purchaseId: purchase[0]._id.toString(),
            };
        }
        else if (paymentIntent.status === "canceled" ||
            paymentIntent.status.includes("failed")) {
            updateData.failedAt = new Date();
            updateData.errorMessage = (_e = paymentIntent.last_payment_error) === null || _e === void 0 ? void 0 : _e.message;
            yield payment_model_1.Payment.findByIdAndUpdate(payment._id, updateData, { session });
            yield session.commitTransaction();
            return { status: paymentIntent.status };
        }
        // Update payment status
        yield payment_model_1.Payment.findByIdAndUpdate(payment._id, updateData, { session });
        yield session.commitTransaction();
        return { status: paymentIntent.status };
    }
    catch (error) {
        yield session.abortTransaction();
        // eslint-disable-next-line no-console
        console.error("Failed to confirm payment:", error);
        throw new Error(`Failed to confirm payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    finally {
        session.endSession();
    }
});
/**
 * Refund a payment and update Purchase record
 */
const refundPaymentService = (paymentIntentId, amount, reason) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield (0, mongoose_1.startSession)();
    session.startTransaction();
    try {
        // Find payment record
        const payment = yield payment_model_1.Payment.findOne({ paymentIntentId }).session(session);
        if (!payment) {
            throw new Error("Payment record not found");
        }
        if (payment.status !== "succeeded") {
            throw new Error("Only succeeded payments can be refunded");
        }
        // Create refund on Stripe
        const refundData = {
            payment_intent: paymentIntentId,
            reason: reason || "requested_by_customer",
        };
        if (amount) {
            refundData.amount = Math.round(amount * 100); // Convert to cents
        }
        const refund = yield stripe.refunds.create(refundData);
        // Update payment status
        yield payment_model_1.Payment.findByIdAndUpdate(payment._id, {
            status: "refunded",
            refundedAt: new Date(),
        }, { session });
        // Update purchase status
        if (payment.purchaseId) {
            yield purchase_model_1.Purchase.findByIdAndUpdate(payment.purchaseId, {
                status: "refunded",
                adminNotes: `Refund processed: ${reason || "No reason provided"}`,
            }, { session });
        }
        yield session.commitTransaction();
        return {
            status: refund.status || "succeeded",
            refundId: refund.id,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        // eslint-disable-next-line no-console
        console.error("Failed to refund payment:", error);
        throw new Error(`Failed to refund payment: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    finally {
        session.endSession();
    }
});
/**
 * Get payment status
 */
const getPaymentStatusService = (paymentIntentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield payment_model_1.Payment.findOne({ paymentIntentId })
        .populate("userId", "name email")
        .populate("designId", "title basePrice")
        .populate("courseId", "title basePrice")
        .populate("pricingPlanId", "name price duration")
        .populate("purchaseId");
    if (!payment) {
        throw new Error("Payment not found");
    }
    return payment;
});
exports.PaymentServiceInstance = {
    createPaymentIntentService,
    confirmPaymentService,
    refundPaymentService,
    getPaymentStatusService,
};
