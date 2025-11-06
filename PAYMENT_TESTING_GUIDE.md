# 🧪 Payment System Testing Guide

## ✅ Current Status

- ✅ Development server running on `localhost:5000`
- ✅ Stripe webhook listener active
- ✅ Webhook secret configured
- ✅ Database connected

---

## 📋 Testing Checklist

### 1️⃣ Test Create Payment (Manual API Test)

Use Postman or any API client to test payment creation:

**Endpoint:** `POST http://localhost:5000/api/payments/create`

**Headers:**

```
Content-Type: application/json
Cookie: accessToken=<your_jwt_token>
```

**Request Body (for Design):**

```json
{
  "productType": "design",
  "productId": "<valid_design_id>",
  "amount": 2999,
  "currency": "usd"
}
```

**Request Body (for Course):**

```json
{
  "productType": "course",
  "productId": "<valid_course_id>",
  "amount": 4999,
  "currency": "usd"
}
```

**Request Body (for Subscription):**

```json
{
  "productType": "subscription",
  "pricingPlanId": "<valid_pricing_plan_id>",
  "amount": 999,
  "currency": "usd"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "paymentIntentId": "pi_xxxxx",
    "clientSecret": "pi_xxxxx_secret_xxxxx",
    "amount": 2999,
    "currency": "usd"
  }
}
```

---

### 2️⃣ Test Webhook with Stripe CLI

Open a **new PowerShell terminal** and run:

```powershell
# Trigger a successful payment
& "$env:USERPROFILE\stripe-cli\stripe.exe" trigger payment_intent.succeeded

# Trigger a failed payment
& "$env:USERPROFILE\stripe-cli\stripe.exe" trigger payment_intent.payment_failed

# Trigger a refund
& "$env:USERPROFILE\stripe-cli\stripe.exe" trigger charge.refunded
```

**Expected in Server Logs:**

```
[Webhook] Received event: payment_intent.succeeded
Payment confirmed and purchase created: <payment_id>
```

**Expected in Database:**

- ✅ New Payment record with `status: "succeeded"`
- ✅ New Purchase record linked to the payment
- ✅ User now has access to the product

---

### 3️⃣ Verify Payment Status

**Endpoint:** `GET http://localhost:5000/api/payments/status/:paymentId`

**Headers:**

```
Cookie: accessToken=<your_jwt_token>
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "_id": "payment_id",
    "userId": { ... },
    "stripePaymentIntentId": "pi_xxxxx",
    "amount": 2999,
    "currency": "usd",
    "status": "succeeded",
    "productType": "design",
    "designId": { ... },
    "purchaseId": "purchase_id",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### 4️⃣ Get User's Payments

**Endpoint:** `GET http://localhost:5000/api/payments/my-payments`

**Headers:**

```
Cookie: accessToken=<your_jwt_token>
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User payments retrieved successfully",
  "data": [
    {
      "_id": "payment_id",
      "amount": 2999,
      "status": "succeeded",
      "productType": "design",
      "designId": { ... },
      "createdAt": "..."
    }
  ]
}
```

---

### 5️⃣ Test Refund (Admin Only)

**Endpoint:** `POST http://localhost:5000/api/payments/refund`

**Headers:**

```
Content-Type: application/json
Cookie: accessToken=<admin_jwt_token>
```

**Request Body:**

```json
{
  "paymentId": "<payment_id>",
  "reason": "Customer requested refund"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Payment refunded successfully",
  "data": {
    "refundId": "re_xxxxx",
    "amount": 2999,
    "status": "refunded"
  }
}
```

---

## 🔍 What to Check in MongoDB

After a successful payment, verify in your database:

### Payment Collection

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  stripePaymentIntentId: "pi_xxxxx",
  amount: 2999,
  currency: "usd",
  status: "succeeded",
  productType: "design",
  designId: ObjectId("..."),
  purchaseId: ObjectId("..."), // ← Link to Purchase
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### Purchase Collection

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  productType: "design",
  designId: ObjectId("..."),
  paymentId: ObjectId("..."), // ← Link to Payment
  purchaseDate: ISODate("..."),
  accessGranted: true
}
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Webhook not receiving events

**Solution:** Make sure the Stripe CLI listener is running:

```powershell
& "$env:USERPROFILE\stripe-cli\stripe.exe" listen --forward-to http://localhost:5000/api/payments/webhook
```

### Issue 2: "Webhook signature verification failed"

**Solution:** Check that `STRIPE_WEBHOOK_SECRET` in `.env` matches the one from Stripe CLI output

### Issue 3: Payment created but no Purchase record

**Solution:** Check server logs for webhook errors. The webhook must successfully process `payment_intent.succeeded` event

### Issue 4: "Product not found" error

**Solution:** Make sure you're using valid product IDs from your database (Design, Course, or PricingPlan)

---

## 🎯 Complete Flow Test

1. **Create a payment** → Get `clientSecret`
2. **Simulate payment success** → Webhook triggers
3. **Check Payment record** → Status = "succeeded"
4. **Check Purchase record** → User has access
5. **Verify user can download** → Download endpoint works

---

## 📊 Monitoring Tips

Watch your server logs for:

- `[Webhook] Received event: payment_intent.succeeded`
- `Payment confirmed and purchase created: <id>`
- `[Webhook] Purchase created for payment: <id>`

Any errors will be logged with details for debugging.

---

## 🚀 Ready for Production?

Before deploying:

- [ ] Replace test Stripe keys with live keys
- [ ] Set up live webhook endpoint in Stripe Dashboard
- [ ] Update `STRIPE_WEBHOOK_SECRET` with live webhook secret
- [ ] Test with real Stripe checkout flow
- [ ] Monitor webhook delivery in Stripe Dashboard

---

**Need help?** Check server logs and Stripe Dashboard webhook logs for debugging!
