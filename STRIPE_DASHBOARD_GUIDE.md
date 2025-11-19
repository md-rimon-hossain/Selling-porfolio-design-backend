# 🎯 Stripe Dashboard - Quick Setup Guide

## What You See in the Image

The image shows the **Stripe Webhooks page** where you need to:
1. Add your production webhook endpoint
2. Configure which events to receive
3. Get the webhook signing secret

---

## 📍 Step-by-Step: What to Click

### 1️⃣ Click "Add destination" or "Add endpoint"

The blue button in the image that says **"+ Add destination"**

---

### 2️⃣ Fill in the Webhook Configuration

You'll see a form with these fields:

#### **Endpoint URL** (required)
```
https://your-api.vercel.app/api/payments/webhook
```
⚠️ **Replace** `your-api.vercel.app` with your actual Vercel deployment URL

#### **Description** (optional)
```
Production Payment Webhook
```

#### **Events to send** (required)
Click "Select events" and choose:
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed` 
- ✅ `payment_intent.canceled`
- ✅ `charge.refunded`

💡 **Tip:** Use the search box to quickly find each event type

---

### 3️⃣ Click "Add endpoint"

After filling the form, click the button to create the webhook.

---

### 4️⃣ Get the Webhook Signing Secret

After creating the endpoint, you'll see:

```
Signing secret
whsec_********************************
            [Reveal] [Roll] [Copy]
```

1. Click **"Reveal"** to show the full secret
2. Click **"Copy"** to copy it to clipboard
3. **Save this secret** - you'll need it for Vercel environment variables

---

### 5️⃣ What It Should Look Like After Setup

Your webhook endpoint will show:
- ✅ **Status:** Active (green)
- ✅ **URL:** https://your-api.vercel.app/api/payments/webhook
- ✅ **Events:** 4 events selected
- ✅ **Recent deliveries:** Will show events as they're sent

---

## 🔍 Testing Your Webhook

### Option 1: Send Test Event

1. Click on your webhook endpoint
2. Click "Send test webhook" button
3. Select event type (e.g., `payment_intent.succeeded`)
4. Click "Send test webhook"

### Option 2: Use Stripe CLI

```powershell
# Forward to production (not recommended)
stripe listen --forward-to https://your-api.vercel.app/api/payments/webhook

# Better: Forward to local for testing
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

### Option 3: Make a Real Test Payment

Use your frontend with test card:
- **Card:** 4242 4242 4242 4242
- **Date:** 12/34 (any future date)
- **CVC:** 123 (any 3 digits)
- **ZIP:** 12345 (any 5 digits)

---

## 📊 Monitoring Webhook Deliveries

In the Stripe Dashboard, click on your webhook endpoint to see:

### Recent Events
- Shows all webhook events sent to your endpoint
- Click any event to see:
  - Request payload
  - Response from your server
  - Retry attempts (if any)
  - Timing information

### Successful Delivery
```
✅ 200 OK
Response time: 245ms
```

### Failed Delivery (needs fixing)
```
❌ 400 Bad Request
Response: Webhook signature verification failed
```

---

## 🆘 Common Issues

### Issue: Endpoint shows "Inactive" or "Failed"

**Causes:**
- Webhook URL is incorrect
- Backend not deployed or crashed
- Signature verification failing

**Fix:**
1. Verify URL is correct and accessible (test with curl/browser)
2. Check Vercel deployment status and logs
3. Ensure `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard

### Issue: Events not being received

**Causes:**
- Webhook endpoint not registered
- Wrong events selected
- Backend route not handling `/api/payments/webhook`

**Fix:**
1. Verify endpoint is created in Stripe Dashboard
2. Check selected events include the ones you're testing
3. Test endpoint directly: `curl -X POST https://your-api.vercel.app/api/payments/webhook`

### Issue: "No signature provided" error

**Causes:**
- Raw body parser not configured
- Middleware order is wrong in app.ts

**Fix:**
- ✅ Already configured correctly in your `app.ts`
- Raw body parser is set up before express.json()

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Webhook endpoint shows "Active" in Stripe Dashboard
- [ ] URL matches your Vercel deployment
- [ ] 4 events are selected
- [ ] Signing secret copied to Vercel environment variables
- [ ] Test event sent successfully (200 OK response)
- [ ] Vercel logs show webhook received
- [ ] Database shows purchase/payment records created

---

## 🎯 Next Steps After Webhook Setup

1. **Update Frontend:**
   ```bash
   # frontend/.env.production
   NEXT_PUBLIC_API_URL=https://your-api.vercel.app
   ```

2. **Deploy Frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Test End-to-End:**
   - Make a purchase from frontend
   - Verify payment succeeds
   - Check download access is granted
   - Verify email notifications (if implemented)

---

**🎉 Once you see "Active" status and successful test events, your webhook is production-ready!**
