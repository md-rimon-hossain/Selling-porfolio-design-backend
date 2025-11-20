# 🚀 Production Deployment Guide - Stripe Webhooks

This guide walks you through deploying your backend to production with Stripe webhooks properly configured.

## ✅ Pre-Deployment Checklist

Your webhook implementation is **already complete** with:
- ✅ Webhook controller with signature verification
- ✅ Raw body parser configured in `app.ts`
- ✅ Proper route mounting
- ✅ Event handling for payment_intent.succeeded, payment_failed, canceled, and charge.refunded
- ✅ Error handling and logging

---

## 📋 Step-by-Step Production Deployment

### Step 1: Test Locally with Stripe CLI

Before deploying, test your webhook locally:

```bash
# Install Stripe CLI (if not installed)
# Windows: scoop install stripe
# Or download from: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Start local webhook forwarding
stripe listen --forward-to localhost:5000/api/payments/webhook

# In another terminal, start your backend
yarn start:dev

# In a third terminal, trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

✅ **Verify:** Check your terminal logs for webhook events being received and processed.

---

### Step 2: Build TypeScript Project

```bash
# Compile TypeScript to JavaScript
yarn build

# Verify dist folder is created
ls dist
```

✅ **Verify:** No TypeScript errors, `dist/` folder contains compiled `.js` files.

---

### Step 3: Deploy Backend to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to production
cd backend
vercel --prod
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: production-ready webhook implementation"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com):
   - Click "New Project"
   - Import your GitHub repository
   - Select the `backend` folder as root directory
   - Click "Deploy"

✅ **Verify:** Copy your production URL (e.g., `https://your-api.vercel.app`)

---

### Step 4: Configure Production Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables (set for **Production** environment):

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `DB_URI` | `mongodb+srv://...` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret | Keep secure |
| `JWT_EXPIRES_IN` | `7d` | Token expiration |
| `BCRYPT_SALT_ROUNDS` | `12` | Password hashing rounds |
| `CLOUDINARY_CLOUD_NAME` | Your cloud name | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Your API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Your API secret | From Cloudinary dashboard |
| `STRIPE_SECRET_KEY` | `sk_live_xxx` | **Use LIVE key for production** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Get this in Step 6 |
| `SUPER_ADMIN_EMAIL` | admin@example.com | Optional |
| `SUPER_ADMIN_PASSWORD` | SecurePassword | Optional |

⚠️ **Important:** 
- Use **LIVE Stripe keys** (`sk_live_...`) for production
- If you don't have live keys yet, activate your Stripe account first
- `STRIPE_WEBHOOK_SECRET` will be updated in Step 6

✅ **Verify:** After adding variables, click "Redeploy" to apply changes.

---

### Step 5: Test Production Endpoint

```bash
# Test health check
curl https://your-api.vercel.app/api/health

# Expected response:
# {"success":true,"status":"OK","message":"API is healthy and running!"}
```

✅ **Verify:** API is accessible via HTTPS.

---

### Step 6: Register Webhook in Stripe Dashboard (MOST IMPORTANT)

This is where you connect Stripe to your production webhook endpoint.

1. **Go to Stripe Dashboard:**
   - Navigate to: https://dashboard.stripe.com/webhooks
   - Click "**Add endpoint**"

2. **Configure Endpoint:**
   - **Endpoint URL:** `https://your-api.vercel.app/api/payments/webhook`
   - **Description:** "Production Payment Webhook"
   - **Events to send:** Select these events:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `payment_intent.canceled`
     - ✅ `charge.refunded`
   - Click "**Add endpoint**"

3. **Get Webhook Signing Secret:**
   - After creating the endpoint, click on it
   - In the "Signing secret" section, click "**Reveal**"
   - Copy the secret (starts with `whsec_...`)

4. **Update Vercel Environment Variable:**
   - Go back to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Find `STRIPE_WEBHOOK_SECRET`
   - Click "Edit" and paste the webhook signing secret from Stripe
   - Save and **Redeploy** the project

✅ **Verify:** Webhook endpoint shows "Active" status in Stripe dashboard.

---

### Step 7: Test Production Webhook

#### Method A: Send Test Event from Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click "**Send test webhook**"
3. Select event type (e.g., `payment_intent.succeeded`)
4. Click "Send test webhook"

#### Method B: Create a Real Test Payment

1. In your frontend (deployed or local):
   - Update `NEXT_PUBLIC_API_URL` to `https://your-api.vercel.app`
   - Make a test purchase using a test card:
     - Card: `4242 4242 4242 4242`
     - Date: Any future date
     - CVC: Any 3 digits
     - ZIP: Any 5 digits

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → View Function Logs
   - Look for webhook events:
     ```
     💰 Payment succeeded: pi_xxx
     ✅ Purchase created: 673e1234567890abcdef
     ```

3. **Check Database:**
   - Verify `Purchase` record was created in MongoDB
   - Verify `Payment` record shows status "succeeded"

✅ **Verify:** Webhook events are processed successfully, purchases are created.

---

### Step 8: Update Frontend Configuration

Update your frontend to use the production backend:

```bash
# In frontend/.env.production
NEXT_PUBLIC_API_URL=https://your-api.vercel.app
```

Deploy your frontend and test end-to-end payment flow.

---

## 🔒 Security Checklist

- ✅ **Never commit `.env` file** (already in `.gitignore`)
- ✅ **Use LIVE Stripe keys** in production (not test keys)
- ✅ **Webhook signature verification** is implemented
- ✅ **Raw body parser** is configured correctly
- ✅ **HTTPS only** (Vercel provides this automatically)
- ✅ **CORS configured** for your frontend domain
- ✅ **Rate limiting** (optional, consider adding later)

---

## 🐛 Troubleshooting

### Issue: Webhook signature verification fails

**Symptoms:** Logs show "⚠️ Webhook signature verification failed"

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard
2. Ensure raw body parser is configured **before** `express.json()` in `app.ts` (already done ✅)
3. Check webhook endpoint URL is correct in Stripe Dashboard

### Issue: Webhook endpoint not found (404)

**Symptoms:** Stripe dashboard shows "No response from endpoint"

**Solution:**
1. Verify endpoint URL: `https://your-api.vercel.app/api/payments/webhook`
2. Check Vercel deployment logs for routing issues
3. Ensure routes are properly mounted in `index.ts`

### Issue: Database not updating after webhook

**Symptoms:** Webhook receives events but no purchase records created

**Solution:**
1. Check Vercel function logs for errors
2. Verify `DB_URI` environment variable is correct
3. Check MongoDB Atlas network access allows Vercel IPs (0.0.0.0/0)
4. Verify `PaymentServiceInstance.confirmPaymentService` logic

### Issue: Stripe sending duplicate events

**Symptoms:** Same event processed multiple times

**Solution:**
- Implement idempotency: store `event.id` in database
- Check if event is already processed before handling
- See "Advanced: Idempotency" section below

---

## 🚀 Advanced: Add Idempotency (Recommended)

To prevent duplicate event processing, create a `StripeEvent` model:

### 1. Create Model

```typescript
// src/app/modules/payments/stripeEvent.model.ts
import { Schema, model } from 'mongoose';

interface IStripeEvent {
  eventId: string;
  type: string;
  processedAt: Date;
}

const stripeEventSchema = new Schema<IStripeEvent>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

export const StripeEvent = model<IStripeEvent>('StripeEvent', stripeEventSchema);
```

### 2. Update Webhook Controller

```typescript
// In webhook.controller.ts, add at the start of handleWebhook:

import { StripeEvent } from './stripeEvent.model';

// ... inside handleWebhook after constructEvent ...

// Check if event already processed
const existingEvent = await StripeEvent.findOne({ eventId: event.id });
if (existingEvent) {
  console.log(`ℹ️ Event ${event.id} already processed, skipping`);
  res.json({ received: true, alreadyProcessed: true });
  return;
}

// ... process event as normal ...

// After successful processing, save event
await StripeEvent.create({
  eventId: event.id,
  type: event.type,
});
```

---

## 📊 Monitoring & Logging

### Recommended Tools

1. **Vercel Logs** (built-in):
   - Real-time function logs
   - Search and filter

2. **Sentry** (optional):
   ```bash
   npm install @sentry/node
   ```

3. **Stripe Dashboard**:
   - Monitor webhook delivery attempts
   - View failed events
   - Retry failed webhooks

### What to Monitor

- ✅ Webhook delivery success rate
- ✅ Event processing time
- ✅ Failed payment intents
- ✅ Database write failures
- ✅ API response times

---

## 🎯 Production Checklist

Before going live:

- [ ] Local webhook testing with Stripe CLI passed
- [ ] Backend deployed to Vercel with HTTPS
- [ ] All production environment variables configured
- [ ] Webhook endpoint registered in Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- [ ] Test payment completed successfully end-to-end
- [ ] Frontend pointing to production backend URL
- [ ] Database records created correctly
- [ ] Logs show successful webhook processing
- [ ] CORS allows frontend domain
- [ ] Error handling tested (failed payments, network issues)
- [ ] Monitoring/alerting configured (optional)
- [ ] Documentation updated with production URLs

---

## 🆘 Support

If you encounter issues:

1. **Check Vercel logs:** Deployment → Function Logs
2. **Check Stripe dashboard:** Webhooks → Your endpoint → Events
3. **Check MongoDB:** Verify database connection and records
4. **Test with Stripe CLI:** Reproduce locally first
5. **Review this guide:** Ensure all steps completed

---

## 📚 Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [MongoDB Atlas Network Access](https://docs.atlas.mongodb.com/security/ip-access-list/)

---

**✅ Your webhook implementation is production-ready! Follow these steps to deploy.**
