# 🚀 Payment System - Production Ready Setup Guide

## ✅ What Has Been Implemented

All critical components have been implemented to make your payment system production-ready:

### 1. **Unified Payment Interface** ✅

- **File**: `payment.interface.ts`
- **Features**:
  - Support for designs, courses, and subscriptions
  - Proper TypeScript types for all payment operations
  - Refund support

### 2. **Complete Payment Service** ✅

- **File**: `payment.services.ts`
- **Features**:
  - Creates Stripe PaymentIntent for all product types
  - Validates products exist and are available
  - Uses MongoDB transactions (atomic operations)
  - Automatically creates Purchase records on successful payment
  - Handles subscription date calculations
  - Implements refund functionality
  - Prevents duplicate payments

### 3. **Webhook Handler** ✅

- **File**: `webhook.controller.ts`
- **Features**:
  - Verifies Stripe webhook signatures
  - Automatically confirms payments
  - Creates Purchase records
  - Handles payment failures
  - Logs all events

### 4. **Payment Controller** ✅

- **File**: `payment.controller.ts`
- **Features**:
  - Create payment endpoint
  - Get payment status endpoint
  - Refund endpoint (admin only)
  - User payment history endpoint
  - Proper error handling
  - Authorization checks

### 5. **Payment Routes** ✅

- **File**: `payment.routes.ts`
- **Routes**:
  - `POST /api/payments/webhook` - Stripe webhook (public)
  - `POST /api/payments/create` - Create payment (authenticated)
  - `GET /api/payments/status/:paymentIntentId` - Get payment status (authenticated)
  - `GET /api/payments/my-payments` - Get payment history (authenticated)
  - `POST /api/payments/refund` - Process refund (admin only)

### 6. **Validation Schemas** ✅

- **File**: `payment.validation.ts`
- **Schemas**:
  - `createPaymentSchema` - Validates payment creation
  - `confirmPaymentSchema` - Validates payment confirmation
  - `refundPaymentSchema` - Validates refund requests

### 7. **Payment Model** ✅

- **File**: `payment.model.ts`
- **Features**:
  - References to designs, courses, pricing plans
  - Links to Purchase records
  - Comprehensive status tracking
  - Error logging

### 8. **App Configuration** ✅

- **File**: `app.ts`
- **Changes**:
  - Webhook route configured with raw body parsing
  - Proper middleware order

---

## 🔧 Environment Variables Required

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/your_database

# JWT
JWT_SECRET=your_secret_key

# Other existing variables...
```

### How to Get Stripe Keys:

1. **STRIPE_SECRET_KEY**:

   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_`)

2. **STRIPE_WEBHOOK_SECRET**:
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`
   - Click "Add endpoint"
   - Copy the "Signing secret" (starts with `whsec_`)

---

## 📋 How the System Works Now

### Flow Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPLETE PAYMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

1. USER INITIATES PAYMENT
   ├─ POST /api/payments/create
   ├─ Body: { productType: "design", productId: "123", currency: "usd" }
   └─ System validates product exists and is available

2. CREATE STRIPE PAYMENT INTENT
   ├─ Check for duplicate pending payments
   ├─ Create PaymentIntent on Stripe
   ├─ Save Payment record in MongoDB (status: pending)
   └─ Return clientSecret to frontend

3. USER COMPLETES PAYMENT (Frontend)
   ├─ Use Stripe.js to show payment form
   ├─ User enters card details
   └─ Stripe processes payment

4. WEBHOOK CONFIRMATION (Automatic)
   ├─ Stripe → POST /api/payments/webhook
   ├─ Verify webhook signature (security)
   ├─ START MongoDB Transaction
   │   ├─ Update Payment status to "succeeded"
   │   ├─ Create Purchase record (status: "completed")
   │   ├─ For subscriptions: Calculate dates & download limits
   │   └─ Link Payment to Purchase
   ├─ COMMIT Transaction
   └─ User now has access to download

5. USER DOWNLOADS CONTENT
   ├─ GET /api/downloads/:designId
   ├─ Check Purchase record exists
   └─ Allow download
```

---

## 🧪 Testing Guide

### 1. Test Payment Creation

```bash
# Create payment for design
POST http://localhost:5000/api/payments/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "productType": "design",
  "productId": "DESIGN_ID_HERE",
  "currency": "usd"
}

# Expected Response:
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentIntentId": "pi_xxxxxxxxxxxxx"
  }
}
```

### 2. Test with Stripe Test Cards

```javascript
// SUCCESS
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits

// DECLINE
Card: 4000 0000 0000 0002

// INSUFFICIENT FUNDS
Card: 4000 0000 0000 9995

// 3D SECURE REQUIRED
Card: 4000 0025 0000 3155
```

### 3. Test Webhook Locally

```bash
# Install Stripe CLI
# Windows (using Scoop):
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payments/webhook

# This will give you a webhook secret like: whsec_xxxxx
# Add it to your .env file as STRIPE_WEBHOOK_SECRET
```

### 4. Trigger Test Payment

```bash
# Trigger a successful payment event
stripe trigger payment_intent.succeeded
```

### 5. Check Results

```bash
# Get payment status
GET http://localhost:5000/api/payments/status/pi_xxxxxxxxxxxxx
Authorization: Bearer YOUR_JWT_TOKEN

# Check if Purchase was created
GET http://localhost:5000/api/purchases/my-purchases
Authorization: Bearer YOUR_JWT_TOKEN

# Try to download the design
GET http://localhost:5000/api/downloads/:designId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔒 Security Features Implemented

### 1. **Webhook Signature Verification**

```typescript
// Prevents fake webhook requests
const event = stripe.webhooks.constructEvent(
  req.body,
  signature,
  WEBHOOK_SECRET,
);
```

### 2. **MongoDB Transactions**

```typescript
// Either all succeed or all rollback
const session = await startSession();
session.startTransaction();
try {
  await Payment.create(..., { session });
  await Purchase.create(..., { session });
  await session.commitTransaction();
} catch {
  await session.abortTransaction();
}
```

### 3. **Duplicate Prevention**

```typescript
// Prevents multiple pending payments
const existing = await Payment.findOne({
  userId,
  productType,
  productId,
  status: "pending",
});
```

### 4. **Authorization Checks**

```typescript
// Only payment owner or admin can view
if (req.user?.role !== 'admin' &&
    payment.userId !== req.user?._id) {
  return res.status(403).json({ ... });
}
```

---

## 📱 Frontend Integration Example

### Using Stripe Elements (React)

```javascript
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_test_YOUR_PUBLISHABLE_KEY");

function CheckoutForm({ productType, productId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState("");

  // Step 1: Create payment intent
  useEffect(() => {
    fetch("/api/payments/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${yourToken}`,
      },
      body: JSON.stringify({ productType, productId, currency: "usd" }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.data.clientSecret));
  }, []);

  // Step 2: Handle payment submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      },
    );

    if (error) {
      console.error("Payment failed:", error);
    } else if (paymentIntent.status === "succeeded") {
      // Payment successful! Webhook will handle the rest
      console.log("Payment successful!");
      // Redirect to success page or show success message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
}

function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm productType="design" productId="123" />
    </Elements>
  );
}
```

---

## 🐛 Troubleshooting

### Issue: Webhook not receiving events

**Solution**:

1. Check webhook is registered in Stripe dashboard
2. Verify STRIPE_WEBHOOK_SECRET is correct
3. Check server logs for errors
4. Use Stripe CLI to test locally: `stripe listen --forward-to localhost:5000/api/payments/webhook`

### Issue: Payment succeeds but Purchase not created

**Solution**:

1. Check webhook logs in Stripe dashboard
2. Verify MongoDB transaction is not failing
3. Check server logs for errors
4. Ensure product (Design/Course/PricingPlan) exists and is active

### Issue: "Invalid signature" error

**Solution**:

1. Ensure webhook route is using raw body: `express.raw()`
2. Webhook route must be registered BEFORE `express.json()`
3. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard

### Issue: Can't download after payment

**Solution**:

1. Verify Purchase record was created (check database)
2. Check Purchase status is "completed"
3. For subscriptions, verify subscriptionEndDate is in future
4. Check remainingDownloads > 0 for subscriptions

---

## 📊 Database Queries for Debugging

```javascript
// Check payment status
db.payments.find({ paymentIntentId: "pi_xxxxx" });

// Check if purchase was created
db.purchases.find({
  user: ObjectId("USER_ID"),
  status: "completed",
});

// Check active subscriptions
db.purchases.find({
  user: ObjectId("USER_ID"),
  purchaseType: "subscription",
  status: "completed",
  subscriptionEndDate: { $gt: new Date() },
});

// Check payment-purchase link
db.payments.aggregate([
  { $match: { paymentIntentId: "pi_xxxxx" } },
  {
    $lookup: {
      from: "purchases",
      localField: "purchaseId",
      foreignField: "_id",
      as: "purchase",
    },
  },
]);
```

---

## 🚀 Deployment Checklist

### Before Deploying:

- [ ] Update `.env` with production Stripe keys (sk*live*...)
- [ ] Configure production webhook URL in Stripe dashboard
- [ ] Test webhook with production URL
- [ ] Enable MongoDB transactions (requires replica set)
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure CORS for production frontend URL
- [ ] Test all payment flows in production
- [ ] Set up email notifications for failed payments
- [ ] Configure backup and recovery procedures

### After Deploying:

- [ ] Monitor webhook events in Stripe dashboard
- [ ] Check server logs for errors
- [ ] Test small payment ($0.50) to verify everything works
- [ ] Monitor database for orphaned records
- [ ] Set up alerts for failed webhooks

---

## 📈 Monitoring & Analytics

### Key Metrics to Track:

1. **Payment Success Rate**: `(successful_payments / total_attempts) * 100`
2. **Webhook Success Rate**: Check Stripe dashboard
3. **Average Transaction Value**: Total revenue / number of transactions
4. **Refund Rate**: `(refunds / successful_payments) * 100`
5. **Payment Method Distribution**: Card types, payment methods used

### Stripe Dashboard:

- View real-time payments: https://dashboard.stripe.com/payments
- View webhook logs: https://dashboard.stripe.com/webhooks
- View refunds: https://dashboard.stripe.com/refunds
- Download reports: https://dashboard.stripe.com/reports

---

## 🎯 What's Next?

### Immediate Improvements:

1. **Email Notifications**

   - Send receipt after successful payment
   - Send failed payment notifications
   - Send refund confirmations

2. **Invoice Generation**

   - Generate PDF invoices
   - Store invoices in cloud storage
   - Email invoices to customers

3. **Payment Analytics Dashboard**

   - Total revenue
   - Revenue by product type
   - Top-selling products
   - Payment method distribution

4. **Subscription Management**

   - Auto-renewal
   - Cancellation flow
   - Upgrade/downgrade plans

5. **Promo Codes**
   - Create discount codes
   - Track usage
   - Set expiration dates

---

## 💰 Cost Considerations

### Stripe Fees:

- **2.9% + $0.30** per successful card charge
- **International cards**: Additional 1.5%
- **Currency conversion**: Additional 1%
- **Disputes**: $15 per dispute

### MongoDB Atlas:

- **Free tier**: 512MB storage
- **Shared cluster**: $9/month for 2GB
- **Dedicated cluster**: Starts at $57/month

---

## 📞 Support & Resources

### Documentation:

- Stripe API: https://stripe.com/docs/api
- Stripe Webhooks: https://stripe.com/docs/webhooks
- Stripe Testing: https://stripe.com/docs/testing

### Community:

- Stripe Discord: https://discord.gg/stripe
- Stack Overflow: Tag `stripe-payments`

---

**Status**: ✅ **PRODUCTION READY**
**Last Updated**: November 4, 2025
**Version**: 1.0.0
