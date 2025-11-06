# 📮 Postman Collection Guide - Payment System

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman
2. Click **Import** button
3. Select `Ecommerce Design Selling API.postman_collection.json`
4. Collection will appear in your sidebar

### 2. Set Up Environment (Optional but Recommended)

Create a new environment with these variables:

```
base_url: http://localhost:5000/api
admin_token: (will be auto-populated after login)
customer_token: (will be auto-populated after login)
design_id: (will be auto-populated after creating design)
pricing_plan_id: (will be auto-populated after creating plan)
payment_intent_id: (will be auto-populated after creating payment)
```

---

## 📁 Collection Structure

### 💳 **Payments (Stripe Integration)** - NEW!

Complete payment implementation with 15 endpoints:

#### ✅ Main Endpoints

1. **Create Payment Intent for Design** - Start payment for a design
2. **Create Payment Intent for Course** - Start payment for a course
3. **Create Payment Intent for Subscription** - Start payment for subscription
4. **Get Payment Status** - Check payment status by Intent ID
5. **Get My Payments** - User's payment history
6. **Refund Payment (Admin Only)** - Full refund
7. **Partial Refund Payment (Admin Only)** - Partial refund
8. **Webhook Handler** - Stripe webhook endpoint (testing only)

#### ❌ Error Test Cases

9. Create Payment Without Authentication
10. Create Payment with Invalid Product Type
11. Create Payment with Invalid Product ID
12. Create Payment for Non-existent Product
13. Get Payment Status - Unauthorized
14. Refund as Customer (Should Fail)
15. Refund with Invalid Payment Intent ID

### 🧪 **Payment Flow Testing** - NEW!

Complete end-to-end testing scenarios:

#### 1️⃣ Complete Flow: Design Purchase

- Step 1: Create Payment Intent
- Step 2: Check Payment Status (Pending)
- Step 3: Simulate Webhook (Payment Success)
- Step 4: Verify Payment Succeeded
- Step 5: Verify Download Access

#### 2️⃣ Stripe CLI Testing Guide

- README with complete Stripe CLI instructions
- Local testing setup
- Production deployment guide

---

## 🎯 Testing Payment System

### Method 1: Quick Test (Postman Only)

1. **Login as Customer**

   ```
   Authentication → Login Customer
   ```

2. **Create Payment Intent**

   ```
   Payments → Create Payment Intent for Design
   ```

   - Automatically saves `payment_intent_id` to environment
   - Returns `clientSecret` for frontend

3. **Check Payment Status**

   ```
   Payments → Get Payment Status
   ```

   - Should show status: "pending"

4. **View Payment History**
   ```
   Payments → Get My Payments
   ```

### Method 2: Complete Flow Test (With Stripe CLI)

**Prerequisites:**

- Stripe CLI installed
- Webhook listener running
- Server running on localhost:5000

**Steps:**

1. **Start Webhook Listener** (in terminal)

   ```powershell
   stripe listen --forward-to http://localhost:5000/api/payments/webhook
   ```

2. **Run Complete Flow** (in Postman)

   ```
   Payment Flow Testing → Complete Flow: Design Purchase
   ```

   - Run each step sequentially
   - Watch server logs for webhook events

3. **Or Trigger Webhook Manually** (in terminal)

   ```powershell
   stripe trigger payment_intent.succeeded
   ```

4. **Verify Results** (in Postman)
   ```
   Payments → Get Payment Status
   Purchases → Get My Purchases
   Downloads → Get My Downloads
   ```

---

## 📊 Collection Variables

These are automatically set by test scripts:

| Variable                         | Description             | Set By                        |
| -------------------------------- | ----------------------- | ----------------------------- |
| `payment_intent_id`              | Main payment intent ID  | Create Payment Intent         |
| `client_secret`                  | Stripe client secret    | Create Payment Intent         |
| `course_payment_intent_id`       | Course payment ID       | Create Payment (Course)       |
| `subscription_payment_intent_id` | Subscription payment ID | Create Payment (Subscription) |
| `test_payment_intent_id`         | Testing flow payment ID | Complete Flow Test            |

---

## 🔑 Authentication Flow

### 1. Register & Login

```
1. Authentication → Register Customer User
2. Authentication → Login Customer
   (Token auto-saved to customer_token)
```

### 2. Admin Access

```
1. Authentication → Register Admin User
2. Authentication → Login Admin
   (Token auto-saved to admin_token)
```

### 3. Use Tokens

All protected endpoints automatically use the appropriate token based on the request type.

---

## 🧪 Test Scenarios

### Scenario 1: Basic Payment Flow

```
1. Login Customer
2. Create Payment Intent for Design
3. Get Payment Status (pending)
4. [Stripe processes payment via webhook]
5. Get Payment Status (succeeded)
6. Get My Purchases (verify purchase created)
7. Download Design (verify access granted)
```

### Scenario 2: Refund Flow

```
1. Login Admin
2. Get All Payments (find payment to refund)
3. Refund Payment
4. Get Payment Status (verify refunded status)
5. Get Purchase (verify purchase status updated)
```

### Scenario 3: Error Handling

```
1. Try Create Payment Without Auth → 401
2. Try Invalid Product Type → 400
3. Try Non-existent Product → 404
4. Try Refund as Customer → 403
```

---

## 🎨 Payment Types Supported

### 1. Design Purchase

```json
{
  "productType": "design",
  "productId": "{{design_id}}",
  "currency": "usd"
}
```

### 2. Course Purchase

```json
{
  "productType": "course",
  "productId": "{{course_id}}",
  "currency": "usd"
}
```

### 3. Subscription Purchase

```json
{
  "productType": "subscription",
  "productId": "{{pricing_plan_id}}",
  "currency": "usd"
}
```

---

## 💡 Pro Tips

### 1. Use Test Scripts

All payment endpoints have test scripts that:

- Validate responses
- Auto-save IDs to variables
- Log important information

### 2. Watch Console Output

Enable Postman Console (View → Show Postman Console) to see:

- Saved variable values
- Test results
- API responses

### 3. Run Folders

You can run entire folders:

- Right-click folder → Run Folder
- Tests all endpoints in sequence
- Great for regression testing

### 4. Environment Variables

Create multiple environments for:

- Local Development
- Staging
- Production

### 5. Collection Runner

Use Collection Runner for:

- Automated testing
- Sequential execution
- Performance testing

---

## 🔍 Debugging Tips

### Payment Not Found

- Ensure you ran "Create Payment Intent" first
- Check that `payment_intent_id` variable is set
- Verify you're logged in as the correct user

### Webhook Not Working

- Ensure Stripe CLI is running
- Check `STRIPE_WEBHOOK_SECRET` in .env
- Restart server after updating webhook secret
- Check server logs for webhook events

### Authentication Errors

- Login first to get fresh token
- Check token is saved to correct variable
- Tokens expire after 7 days (default)

### Product Not Found

- Create design/course/pricing plan first
- Ensure IDs are saved to variables
- Check product is active (not deleted)

---

## 📖 Additional Resources

- **Payment Testing Guide**: `PAYMENT_TESTING_GUIDE.md`
- **Implementation Status**: `PAYMENT_IMPLEMENTATION_STATUS.md`
- **API Documentation**: `DOWNLOADS_API_DOCUMENTATION.md`
- **Architecture**: `DOWNLOADS_ARCHITECTURE.md`

---

## 🎉 Ready to Test!

1. ✅ Import collection to Postman
2. ✅ Start your development server
3. ✅ Start Stripe webhook listener
4. ✅ Run authentication endpoints
5. ✅ Test payment creation
6. ✅ Trigger webhook events
7. ✅ Verify purchases created

**Your complete payment system is ready for testing!** 🚀
