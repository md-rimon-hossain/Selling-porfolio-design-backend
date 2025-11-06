# 🎨 Frontend Integration Guide - Payment System

## 📋 Overview

Your backend payment system is now **100% ready**. Here's what your frontend needs to integrate:

---

## 🔴 REQUIRED Frontend Changes

### 1. **Add Payment Flow UI** ⚠️ CRITICAL

Your frontend **MUST** implement these new screens/flows:

#### A. **Payment Intent Creation Page**

```typescript
// Create payment intent when user clicks "Buy Now"
const response = await fetch("/api/payments/create-payment-intent", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important for cookies
  body: JSON.stringify({
    amount: 2999, // in cents ($29.99)
    currency: "USD",
    productType: "design", // or 'course' or 'subscription'
    productId: "design_id_here",
    // Optional for subscriptions:
    pricingPlanId: "plan_id_here",
  }),
});

const { clientSecret, paymentId } = await response.json();
```

#### B. **Stripe Elements Integration**

```typescript
// Install Stripe.js
npm install @stripe/stripe-js @stripe/react-stripe-js

// In your payment page
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

function CheckoutForm({ clientSecret }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentElement />
      <button onClick={handleSubmit}>Pay Now</button>
    </Elements>
  );
}
```

#### C. **Payment Confirmation Handler**

```typescript
// After Stripe confirms payment
const stripe = await stripePromise;
const { error } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: "https://yoursite.com/payment-success",
  },
});

if (error) {
  // Show error to user
  setError(error.message);
}
```

---

### 2. **Add Payment Status Checking** ⚠️ REQUIRED

```typescript
// Check payment status
const checkPaymentStatus = async (paymentId) => {
  const response = await fetch(`/api/payments/${paymentId}/status`, {
    credentials: "include",
  });

  const { status, purchase } = await response.json();

  if (status === "succeeded") {
    // Payment successful! Show purchase
    showSuccessMessage("Purchase completed!");
    redirectTo("/my-purchases");
  } else if (status === "requires_payment_method") {
    // Show payment form again
    showPaymentForm();
  }
};
```

---

### 3. **Update Purchase History Page** ⚠️ REQUIRED

Your existing purchase page needs to handle **new fields**:

```typescript
// Fetch user purchases (existing endpoint enhanced)
const response = await fetch("/api/purchases/my-purchases", {
  credentials: "include",
});

const purchases = await response.json();

// NEW FIELDS you need to display:
purchases.forEach((purchase) => {
  // Existing fields (should already work)
  console.log(purchase.purchaseType); // 'individual' or 'subscription'
  console.log(purchase.amount); // 2999 (cents)
  console.log(purchase.currency); // 'USD'

  // NEW FIELDS (add to your UI)
  console.log(purchase.currencyDisplay); // '$' or '€' or '৳'
  console.log(purchase.paymentMethod); // 'stripe'
  console.log(purchase.itemMaxDownloads); // 100 (original limit)
  console.log(purchase.remainingDownloads); // 95 (current remaining)

  // Calculate usage percentage
  const usagePercent =
    ((purchase.itemMaxDownloads - purchase.remainingDownloads) /
      purchase.itemMaxDownloads) *
    100;

  // Display: "Used 5 of 100 downloads (5%)"
});
```

---

### 4. **Add Currency Symbol Support** 🌍 NEW

```typescript
// Your frontend should now display currency symbols
function formatPrice(amount, currency, currencyDisplay) {
  // Backend provides currencyDisplay: '$', '€', '৳', '£', '¥', '₹'
  const price = (amount / 100).toFixed(2);
  return `${currencyDisplay}${price}`;
}

// Example usage:
formatPrice(2999, "USD", "$"); // → "$29.99"
formatPrice(2999, "BDT", "৳"); // → "৳29.99"
formatPrice(2999, "EUR", "€"); // → "€29.99"
```

---

### 5. **Handle Subscription Display** 📅 ENHANCED

```typescript
// For subscription purchases
if (purchase.purchaseType === 'subscription') {
  // NEW FIELDS to display
  const startDate = new Date(purchase.subscriptionStartDate);
  const endDate = new Date(purchase.subscriptionEndDate);
  const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

  // Display subscription info
  return (
    <div>
      <p>Plan: {purchase.pricingPlan.name}</p>
      <p>Active until: {endDate.toLocaleDateString()}</p>
      <p>Days remaining: {daysRemaining}</p>
      <p>Downloads: {purchase.remainingDownloads} / {purchase.itemMaxDownloads}</p>
      <ProgressBar
        value={purchase.remainingDownloads}
        max={purchase.itemMaxDownloads}
      />
    </div>
  );
}
```

---

### 6. **Add Download Tracking UI** 📊 NEW

```typescript
// Show download usage for purchases
function DownloadProgress({ purchase }) {
  const usagePercent =
    ((purchase.itemMaxDownloads - purchase.remainingDownloads) /
     purchase.itemMaxDownloads) * 100;

  return (
    <div className="download-progress">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${usagePercent}%` }}
        />
      </div>
      <p>
        {purchase.itemDownloadsUsed || 0} of {purchase.itemMaxDownloads} downloads used
      </p>
      <p>
        {purchase.remainingDownloads} downloads remaining
      </p>
    </div>
  );
}
```

---

## 🟡 OPTIONAL Frontend Enhancements

### 1. **Payment Method Selection**

```typescript
// Let users choose payment method (future: add more methods)
<select name="paymentMethod">
  <option value="stripe">Credit/Debit Card (Stripe)</option>
  {/* Future: PayPal, etc. */}
</select>
```

### 2. **Currency Selector**

```typescript
// Let users choose currency
<select name="currency" defaultValue="USD">
  <option value="USD">USD ($)</option>
  <option value="EUR">EUR (€)</option>
  <option value="GBP">GBP (£)</option>
  <option value="BDT">BDT (৳)</option>
  <option value="JPY">JPY (¥)</option>
  <option value="INR">INR (₹)</option>
  <option value="CAD">CAD ($)</option>
  <option value="AUD">AUD ($)</option>
</select>
```

### 3. **Refund Request UI**

```typescript
// Allow users to request refunds
const requestRefund = async (purchaseId, reason) => {
  const response = await fetch(`/api/payments/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      purchaseId,
      reason, // optional
    }),
  });

  if (response.ok) {
    alert("Refund requested successfully!");
  }
};
```

---

## 🔄 Updated API Endpoints for Frontend

### **New Payment Endpoints:**

```
POST   /api/payments/create-payment-intent
GET    /api/payments/:paymentId/status
POST   /api/payments/confirm-payment
POST   /api/payments/webhook (backend only - Stripe calls this)
POST   /api/payments/refund
GET    /api/payments/my-payments
```

### **Enhanced Purchase Endpoints:**

```
GET    /api/purchases/my-purchases (enhanced with new fields)
GET    /api/purchases/:id (enhanced with new fields)
```

### **Existing Endpoints (No Changes Needed):**

```
GET    /api/designs (still works)
GET    /api/courses (still works)
GET    /api/pricing-plans (still works)
POST   /api/auth/login (still works)
POST   /api/auth/register (still works)
```

---

## 📱 Example: Complete Payment Flow

### **Step 1: User clicks "Buy Design"**

```typescript
// Existing: Show design details
// NEW: Add "Buy Now" button that triggers payment

async function handleBuyNow(designId, amount) {
  // Create payment intent
  const { clientSecret, paymentId } = await createPaymentIntent({
    amount,
    currency: "USD",
    productType: "design",
    productId: designId,
  });

  // Show Stripe payment form
  showStripeForm(clientSecret, paymentId);
}
```

### **Step 2: User enters card details**

```typescript
// Use Stripe Elements (see section 1B above)
// Stripe handles card validation, security, etc.
```

### **Step 3: User clicks "Pay"**

```typescript
// Stripe processes payment
// Backend webhook creates Purchase automatically
// Frontend polls for status or redirects to success page
```

### **Step 4: Show confirmation**

```typescript
// On success page
async function loadPurchaseDetails(paymentId) {
  const { purchase } = await fetch(`/api/payments/${paymentId}/status`);

  // Show purchase confirmation
  return (
    <div className="success">
      <h1>✅ Purchase Successful!</h1>
      <p>You bought: {purchase.design?.title || purchase.course?.title}</p>
      <p>Amount: {purchase.currencyDisplay}{(purchase.amount/100).toFixed(2)}</p>
      <p>Payment Method: {purchase.paymentMethod}</p>
      <p>Date: {new Date(purchase.purchaseDate).toLocaleDateString()}</p>

      {purchase.purchaseType === 'subscription' && (
        <>
          <p>Downloads: {purchase.remainingDownloads} / {purchase.itemMaxDownloads}</p>
          <p>Valid until: {new Date(purchase.subscriptionEndDate).toLocaleDateString()}</p>
        </>
      )}

      <button onClick={() => redirectTo('/my-purchases')}>
        View My Purchases
      </button>
    </div>
  );
}
```

---

## 🎨 UI Components You Need to Add

### 1. **Payment Form Component** ⚠️ REQUIRED

- Stripe Elements integration
- Card input fields
- Submit button
- Error display

### 2. **Payment Status Component** ⚠️ REQUIRED

- Loading spinner during payment
- Success/error messages
- Redirect logic

### 3. **Purchase Card Component** (Enhanced)

- Display currency symbol (NEW)
- Show download progress (NEW)
- Show subscription dates (NEW)
- Download button (existing)

### 4. **Subscription Dashboard** (NEW)

- Active subscriptions list
- Expiry dates
- Download usage
- Renewal reminders

---

## 📦 NPM Packages to Install

```bash
# Required for Stripe integration
npm install @stripe/stripe-js @stripe/react-stripe-js

# Optional: For better date handling
npm install date-fns

# Optional: For currency formatting
npm install react-currency-format
```

---

## 🔑 Environment Variables for Frontend

```env
# Add to your .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ✅ Frontend Changes Checklist

### 🔴 **MUST IMPLEMENT** (Critical):

- [ ] Add Stripe.js library
- [ ] Create payment intent creation function
- [ ] Integrate Stripe Elements form
- [ ] Handle payment confirmation
- [ ] Add payment status checking
- [ ] Update purchase display with new fields
- [ ] Show currency symbols correctly
- [ ] Display download progress

### 🟡 **SHOULD IMPLEMENT** (Important):

- [ ] Add subscription dashboard
- [ ] Show expiry dates for subscriptions
- [ ] Add refund request UI
- [ ] Handle payment errors gracefully
- [ ] Add loading states during payment

### 🟢 **NICE TO HAVE** (Optional):

- [ ] Currency selector
- [ ] Payment method selector (for future expansion)
- [ ] Purchase history filters
- [ ] Email receipt request
- [ ] Download analytics

---

## 🚨 Breaking Changes: NONE!

**Good News:** Your existing frontend will **CONTINUE TO WORK** without any changes!

- ✅ Existing design browsing still works
- ✅ Existing course viewing still works
- ✅ Existing authentication still works
- ✅ Existing purchase history API still works (just has more fields now)

**What breaks if you don't update:**

- ❌ Users can't make new purchases (no payment flow)
- ❌ Purchase list won't show currency symbols (will show undefined)
- ❌ Download progress won't display (fields exist but not shown)
- ❌ Subscription info won't display correctly

---

## 🎯 Minimal Implementation (Quick Start)

If you want to get payments working **FAST**, implement just these 3 things:

### 1. **Payment Button**

```typescript
<button onClick={() => createPayment(design)}>
  Buy for ${(design.price / 100).toFixed(2)}
</button>
```

### 2. **Stripe Form** (using hosted checkout - easier)

```typescript
// Option A: Redirect to Stripe Checkout (easiest!)
const session = await fetch("/api/payments/create-checkout-session", {
  method: "POST",
  body: JSON.stringify({ designId }),
});
const { url } = await session.json();
window.location.href = url; // Redirect to Stripe
```

### 3. **Success Page**

```typescript
// After payment, show confirmation
<div>
  <h1>✅ Payment Successful!</h1>
  <p>Check your purchases in My Account</p>
</div>
```

---

## 📖 Documentation Links

- **Stripe.js Integration**: https://stripe.com/docs/stripe-js
- **Stripe Elements**: https://stripe.com/docs/payments/elements
- **React Stripe.js**: https://stripe.com/docs/stripe-js/react

---

## 🎉 Summary

### What Your Frontend Needs:

1. **🔴 CRITICAL** - Add payment flow (Stripe integration)
2. **🔴 CRITICAL** - Handle new Purchase model fields
3. **🟡 IMPORTANT** - Display currency symbols
4. **🟡 IMPORTANT** - Show download progress
5. **🟢 OPTIONAL** - Add refund UI, currency selector, etc.

### What Still Works Without Changes:

- ✅ Design browsing
- ✅ Course viewing
- ✅ Authentication
- ✅ Basic purchase viewing

### Estimated Development Time:

- **Minimal (Stripe Checkout)**: 2-4 hours
- **Full (Stripe Elements)**: 1-2 days
- **Complete (all features)**: 3-5 days

---

**Ready to integrate? Start with the Stripe Checkout (easiest) or Stripe Elements (more customizable)!** 🚀
