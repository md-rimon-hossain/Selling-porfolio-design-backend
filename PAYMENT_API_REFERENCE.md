# 💳 Payment API Quick Reference

## Base URL

```
http://localhost:5000/api/payments
```

---

## 🔓 Public Endpoints

### Webhook Handler

```http
POST /webhook
Content-Type: application/json
Stripe-Signature: t=xxx,v1=xxx

# Body: Raw Stripe event data

# Response:
{
  "received": true,
  "eventType": "payment_intent.succeeded"
}
```

---

## 🔒 Authenticated Endpoints

### 1. Create Payment Intent

**Endpoint**: `POST /create`

**Headers**:

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Body**:

```json
{
  "productType": "design", // "design" | "course" | "subscription"
  "productId": "507f1f77bcf86cd799439011",
  "currency": "usd" // Optional, defaults to "usd"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Payment intent created successfully",
  "data": {
    "clientSecret": "pi_3ABC123_secret_xyz789",
    "paymentIntentId": "pi_3ABC123xyz789"
  }
}
```

**Error Responses**:

400 - Validation Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "code": "invalid_enum_value",
      "path": ["productType"],
      "message": "Product type must be design, course, or subscription"
    }
  ]
}
```

401 - Unauthorized:

```json
{
  "success": false,
  "message": "User not authenticated"
}
```

500 - Server Error:

```json
{
  "success": false,
  "message": "Design not found or not available for purchase"
}
```

---

### 2. Get Payment Status

**Endpoint**: `GET /status/:paymentIntentId`

**Headers**:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "_id": "672abc123def456",
    "userId": {
      "_id": "672abc000def000",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "productType": "design",
    "designId": {
      "_id": "672abc111def111",
      "title": "Modern Logo Design",
      "basePrice": 49.99
    },
    "amount": 49.99,
    "currency": "USD",
    "status": "succeeded",
    "paymentIntentId": "pi_3ABC123xyz789",
    "purchaseId": "672abc222def222",
    "succeededAt": "2025-11-04T10:30:00.000Z",
    "createdAt": "2025-11-04T10:28:00.000Z",
    "updatedAt": "2025-11-04T10:30:00.000Z"
  }
}
```

**Error Responses**:

403 - Forbidden:

```json
{
  "success": false,
  "message": "Not authorized to view this payment"
}
```

404 - Not Found:

```json
{
  "success": false,
  "message": "Payment not found"
}
```

---

### 3. Get My Payment History

**Endpoint**: `GET /my-payments`

**Headers**:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "data": [
    {
      "_id": "672abc123def456",
      "productType": "design",
      "designId": {
        "title": "Modern Logo Design",
        "basePrice": 49.99,
        "previewImageUrls": ["https://..."]
      },
      "amount": 49.99,
      "currency": "USD",
      "status": "succeeded",
      "paymentIntentId": "pi_3ABC123xyz789",
      "createdAt": "2025-11-04T10:28:00.000Z"
    },
    {
      "_id": "672abc789ghi012",
      "productType": "subscription",
      "pricingPlanId": {
        "name": "Premium Monthly",
        "price": 29.99,
        "duration": "1 month"
      },
      "amount": 29.99,
      "currency": "USD",
      "status": "succeeded",
      "paymentIntentId": "pi_3DEF456abc123",
      "createdAt": "2025-10-01T08:15:00.000Z"
    }
  ]
}
```

---

## 👑 Admin Only Endpoints

### Process Refund

**Endpoint**: `POST /refund`

**Headers**:

```
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json
```

**Body**:

```json
{
  "paymentIntentId": "pi_3ABC123xyz789",
  "amount": 25.0, // Optional: for partial refund
  "reason": "Customer requested refund" // Optional
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "status": "succeeded",
    "refundId": "re_3XYZ789abc456"
  }
}
```

**Error Responses**:

403 - Forbidden:

```json
{
  "success": false,
  "message": "Only admins can process refunds"
}
```

400 - Validation Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [...]
}
```

500 - Server Error:

```json
{
  "success": false,
  "message": "Only succeeded payments can be refunded"
}
```

---

## 🔄 Payment Flow

### Complete Integration Example

#### Step 1: Backend - Create Payment Intent

```javascript
// Backend API Call
const response = await fetch("http://localhost:5000/api/payments/create", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${userToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    productType: "design",
    productId: designId,
    currency: "usd",
  }),
});

const { data } = await response.json();
// data.clientSecret -> Use this in frontend
```

#### Step 2: Frontend - Collect Payment

```javascript
import { loadStripe } from "@stripe/stripe-js";

const stripe = await loadStripe("pk_test_YOUR_PUBLISHABLE_KEY");

// Confirm payment with Stripe
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: "John Doe",
      email: "john@example.com",
    },
  },
});

if (error) {
  console.error("Payment failed:", error.message);
} else if (paymentIntent.status === "succeeded") {
  console.log("Payment successful!");
  // Redirect to success page
}
```

#### Step 3: Webhook - Auto Confirm (Automatic)

```
Stripe automatically sends webhook to: /api/payments/webhook
↓
Server verifies signature
↓
Updates Payment status to "succeeded"
↓
Creates Purchase record
↓
User can now download the design
```

#### Step 4: Verify Purchase (Optional)

```javascript
// Check if purchase was created
const purchaseResponse = await fetch(
  "http://localhost:5000/api/purchases/my-purchases",
  {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  },
);

const purchases = await purchaseResponse.json();
// Verify purchase exists for the design
```

---

## 🧪 Testing with Stripe Test Cards

### Success Cards

| Card Number         | Description                |
| ------------------- | -------------------------- |
| 4242 4242 4242 4242 | Visa - Success             |
| 5555 5555 5555 4444 | Mastercard - Success       |
| 3782 822463 10005   | American Express - Success |

### Decline Cards

| Card Number         | Decline Reason     |
| ------------------- | ------------------ |
| 4000 0000 0000 0002 | Generic decline    |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 9987 | Lost card          |
| 4000 0000 0000 9979 | Stolen card        |

### Special Cards

| Card Number         | Behavior               |
| ------------------- | ---------------------- |
| 4000 0025 0000 3155 | Requires 3D Secure     |
| 4000 0000 0000 3220 | 3D Secure - Auth fails |

**Note**: Use any future expiry date, any 3-digit CVC, and any 5-digit ZIP code.

---

## 📊 Payment Statuses

| Status      | Description                                   |
| ----------- | --------------------------------------------- |
| `pending`   | Payment intent created, awaiting confirmation |
| `succeeded` | Payment successful, purchase created          |
| `failed`    | Payment attempt failed                        |
| `refunded`  | Payment was refunded                          |
| `canceled`  | Payment was canceled before completion        |

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Get token by logging in:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

## ⚠️ Important Notes

### Webhook Configuration

1. **Raw Body Required**: Webhook endpoint must receive raw body (not JSON parsed)
2. **Signature Verification**: Always verify Stripe-Signature header
3. **Idempotency**: Handle duplicate webhook events gracefully
4. **Response**: Always respond with 200 OK to acknowledge receipt

### Payment Security

1. **Never trust client**: Always validate product price on server
2. **Use webhooks**: Don't rely on client-side payment confirmation
3. **Verify signatures**: Always verify webhook signatures
4. **Store securely**: Never log full card numbers or sensitive data

### Error Handling

1. **Retry logic**: Implement retry for failed webhooks
2. **Monitoring**: Monitor webhook success rate in Stripe dashboard
3. **Logging**: Log all payment attempts for debugging
4. **User feedback**: Provide clear error messages to users

---

## 🐛 Common Errors

### "No signature provided"

- **Cause**: Webhook signature header missing
- **Fix**: Ensure request includes `Stripe-Signature` header

### "Webhook signature verification failed"

- **Cause**: Invalid webhook secret or body modification
- **Fix**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

### "Design not found or not available"

- **Cause**: Design doesn't exist or status is not "Active"
- **Fix**: Check design exists and has status "Active"

### "Not authorized to view this payment"

- **Cause**: User trying to access another user's payment
- **Fix**: Ensure payment belongs to authenticated user

---

## 📞 Support

For issues or questions:

- Check server logs for detailed errors
- View Stripe dashboard for payment details
- Check webhook logs in Stripe dashboard
- Review `PAYMENT_IMPLEMENTATION_GUIDE.md` for setup instructions

---

**Version**: 1.0.0  
**Last Updated**: November 4, 2025  
**Status**: ✅ Production Ready
