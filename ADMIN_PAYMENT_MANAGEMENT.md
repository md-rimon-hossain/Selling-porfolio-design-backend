# 👨‍💼 Admin Payment Management API

## Overview

Comprehensive admin endpoints to manage, monitor, and analyze all payments in the system.

---

## 🔐 Authentication Required

All admin endpoints require:

- ✅ Valid JWT token in `Authorization: Bearer <token>`
- ✅ User role = `admin`

---

## 📊 Admin Endpoints

### 1. **Get All Payments**

Get paginated list of all payments with advanced filtering.

```http
GET /api/payments/admin/all
```

**Query Parameters:**

| Parameter     | Type   | Default     | Description                                                      |
| ------------- | ------ | ----------- | ---------------------------------------------------------------- |
| `page`        | number | 1           | Page number                                                      |
| `limit`       | number | 20          | Items per page                                                   |
| `status`      | string | -           | Filter: `pending`, `succeeded`, `failed`, `canceled`, `refunded` |
| `productType` | string | -           | Filter: `design`, `course`, `subscription`                       |
| `userId`      | string | -           | Filter by specific user ID                                       |
| `startDate`   | string | -           | Date range start (ISO format)                                    |
| `endDate`     | string | -           | Date range end (ISO format)                                      |
| `sortBy`      | string | `createdAt` | Sort field: `createdAt`, `amount`, `status`                      |
| `sortOrder`   | string | `desc`      | Sort order: `asc` or `desc`                                      |

**Example Requests:**

```bash
# Get all payments (default: page 1, 20 items)
GET /api/payments/admin/all

# Get pending payments
GET /api/payments/admin/all?status=pending

# Get failed payments
GET /api/payments/admin/all?status=failed

# Get payments for specific user
GET /api/payments/admin/all?userId=507f1f77bcf86cd799439011

# Get payments for November 2025
GET /api/payments/admin/all?startDate=2025-11-01&endDate=2025-11-30

# Get subscription payments, sorted by amount (highest first)
GET /api/payments/admin/all?productType=subscription&sortBy=amount&sortOrder=desc

# Get page 2 with 50 items per page
GET /api/payments/admin/all?page=2&limit=50
```

**Response:**

```json
{
  "success": true,
  "message": "All payments retrieved successfully",
  "data": [
    {
      "_id": "673...",
      "userId": {
        "_id": "507f...",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "customer"
      },
      "productType": "design",
      "designId": {
        "_id": "507f...",
        "title": "Modern Landing Page",
        "basePrice": 2999
      },
      "amount": 2999,
      "currency": "USD",
      "status": "succeeded",
      "paymentIntentId": "pi_3QK...",
      "purchaseId": {
        "_id": "673...",
        "purchaseType": "individual"
      },
      "succeededAt": "2025-11-06T10:30:00.000Z",
      "createdAt": "2025-11-06T10:25:00.000Z"
    }
    // ... more payments
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 87,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. **Get Payment Statistics**

Get comprehensive analytics and statistics about payments.

```http
GET /api/payments/admin/statistics
```

**Query Parameters:**

| Parameter   | Type   | Description                          |
| ----------- | ------ | ------------------------------------ |
| `startDate` | string | Optional: Filter by date range start |
| `endDate`   | string | Optional: Filter by date range end   |

**Example Requests:**

```bash
# Get all-time statistics
GET /api/payments/admin/statistics

# Get statistics for specific month
GET /api/payments/admin/statistics?startDate=2025-11-01&endDate=2025-11-30

# Get statistics for current year
GET /api/payments/admin/statistics?startDate=2025-01-01&endDate=2025-12-31
```

**Response:**

```json
{
  "success": true,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "overview": {
      "totalPayments": 150,
      "totalRevenue": 45250.5, // In dollars (amount / 100)
      "averageAmount": 301.67, // Average payment amount
      "successfulPayments": 132, // Succeeded payments
      "failedPayments": 8, // Failed payments
      "pendingPayments": 5, // Pending payments
      "canceledPayments": 3, // Canceled payments
      "refundedPayments": 2, // Refunded payments
      "successRate": "88.00" // Success rate percentage
    },
    "statusBreakdown": {
      "succeeded": {
        "count": 132,
        "amount": 4525050 // In cents
      },
      "pending": {
        "count": 5,
        "amount": 12500
      },
      "failed": {
        "count": 8,
        "amount": 0
      },
      "canceled": {
        "count": 3,
        "amount": 0
      },
      "refunded": {
        "count": 2,
        "amount": 5998
      }
    },
    "productTypeBreakdown": {
      "design": {
        "count": 95,
        "amount": 2845050 // Total revenue from designs
      },
      "course": {
        "count": 30,
        "amount": 1350000 // Total revenue from courses
      },
      "subscription": {
        "count": 25,
        "amount": 1250000 // Total revenue from subscriptions
      }
    },
    "recentPayments": [
      {
        "_id": "673...",
        "amount": 2999,
        "currency": "USD",
        "status": "succeeded",
        "productType": "design",
        "createdAt": "2025-11-06T10:30:00.000Z",
        "userName": "John Doe",
        "userEmail": "john@example.com"
      }
      // ... 9 more recent payments
    ]
  }
}
```

---

## 📈 Use Cases

### **1. Monitor Stuck Payments**

Check for payments stuck in "pending" status:

```bash
GET /api/payments/admin/all?status=pending&sortBy=createdAt&sortOrder=asc
```

Payments pending for >30 minutes might need investigation.

---

### **2. Investigate Failed Payments**

Get all failed payments to identify patterns:

```bash
GET /api/payments/admin/all?status=failed
```

Check `errorMessage` field for failure reasons.

---

### **3. Track Daily Revenue**

Get today's successful payments:

```bash
GET /api/payments/admin/all?status=succeeded&startDate=2025-11-06&endDate=2025-11-06
```

Or use statistics endpoint:

```bash
GET /api/payments/admin/statistics?startDate=2025-11-06&endDate=2025-11-06
```

---

### **4. Analyze User Payment History**

Get all payments from a specific user:

```bash
GET /api/payments/admin/all?userId=507f1f77bcf86cd799439011
```

Useful for customer support or fraud investigation.

---

### **5. Monthly Financial Reports**

Get complete monthly statistics:

```bash
GET /api/payments/admin/statistics?startDate=2025-11-01&endDate=2025-11-30
```

Returns:

- Total revenue
- Payment counts by status
- Product type breakdown
- Success rate

---

### **6. Product Performance Analysis**

Compare revenue by product type:

```bash
# Design payments
GET /api/payments/admin/all?productType=design&status=succeeded

# Course payments
GET /api/payments/admin/all?productType=course&status=succeeded

# Subscription payments
GET /api/payments/admin/all?productType=subscription&status=succeeded
```

---

### **7. Find Refund Candidates**

Get all refunded payments:

```bash
GET /api/payments/admin/all?status=refunded
```

Check refund reasons and patterns.

---

## 🎯 Quick Reference

### **Payment Statuses:**

| Status      | Description                                   |
| ----------- | --------------------------------------------- |
| `pending`   | Payment created, waiting for user to complete |
| `succeeded` | Payment successful, purchase created          |
| `failed`    | Payment failed (card declined, etc.)          |
| `canceled`  | User canceled payment                         |
| `refunded`  | Payment refunded by admin                     |

### **Product Types:**

| Type           | Description                                  |
| -------------- | -------------------------------------------- |
| `design`       | Individual design purchase                   |
| `course`       | Course purchase                              |
| `subscription` | Subscription plan (access to multiple items) |

---

## 🔍 Common Queries

### **Find High-Value Transactions**

```bash
GET /api/payments/admin/all?sortBy=amount&sortOrder=desc&limit=10
```

### **Check Last Hour's Payments**

```bash
# Use startDate = (current time - 1 hour)
GET /api/payments/admin/all?startDate=2025-11-06T09:00:00Z&endDate=2025-11-06T10:00:00Z
```

### **Compare Success Rate**

```bash
# This month
GET /api/payments/admin/statistics?startDate=2025-11-01&endDate=2025-11-30

# Last month
GET /api/payments/admin/statistics?startDate=2025-10-01&endDate=2025-10-31
```

Compare `successRate` field.

---

## 📊 Dashboard Metrics You Can Build

With these endpoints, you can create admin dashboards showing:

1. **Overview Cards:**

   - Total Revenue (today/week/month)
   - Total Payments
   - Success Rate
   - Pending Payments Count

2. **Status Breakdown Chart:**

   - Succeeded: X payments
   - Pending: Y payments
   - Failed: Z payments

3. **Product Type Revenue Chart:**

   - Designs: $X
   - Courses: $Y
   - Subscriptions: $Z

4. **Recent Activity Table:**

   - Last 10 payments
   - User, amount, status, time

5. **Alerts:**
   - Payments pending >30 minutes
   - Failed payment spike
   - Low success rate

---

## 🚨 Monitoring & Alerts

### **Health Check Queries:**

**1. Check for Stuck Payments (>1 hour):**

```bash
GET /api/payments/admin/all?status=pending&sortBy=createdAt&sortOrder=asc
```

If payments are older than 1 hour and still pending, investigate:

- Is webhook listener running?
- Check Stripe dashboard for webhook delivery

**2. Monitor Failed Payments:**

```bash
GET /api/payments/admin/statistics
```

If `failedPayments` / `totalPayments` > 10%, investigate:

- Common error messages
- Specific users or cards
- Stripe logs

**3. Track Refund Rate:**

```bash
GET /api/payments/admin/statistics
```

If `refundedPayments` / `successfulPayments` > 5%, investigate:

- Refund reasons
- Product quality issues
- Customer satisfaction

---

## 🔐 Security Notes

### **Authorization:**

- ✅ All endpoints require `admin` role
- ✅ Regular users get `403 Forbidden`
- ✅ Unauthenticated requests get `401 Unauthorized`

### **Data Protection:**

- ⚠️ Payment details include sensitive data
- ⚠️ Never expose admin APIs publicly
- ⚠️ Log all admin access for audit

### **Rate Limiting:**

Consider adding rate limits to admin endpoints:

- Statistics: 60 requests/minute
- All payments: 120 requests/minute

---

## 📖 Example Admin Dashboard Workflow

```javascript
// 1. Fetch overview statistics
const stats = await fetch("/api/payments/admin/statistics");

// Display:
// - Total Revenue: $45,250.50
// - Success Rate: 88%
// - Pending: 5 payments

// 2. Fetch pending payments for manual review
const pending = await fetch("/api/payments/admin/all?status=pending");

// 3. Fetch recent activity
const recent = await fetch("/api/payments/admin/all?limit=10");

// 4. Check failed payments
const failed = await fetch("/api/payments/admin/all?status=failed");
```

---

## ✅ Testing Admin Endpoints

### **Postman Collection:**

All admin endpoints are included in the Postman collection:

**Folder:** `💳 Payments (Stripe Integration)`

**Endpoints:**

- ✅ Get All Payments (Admin)
- ✅ Get Payments by Status (Admin)
- ✅ Get Failed Payments (Admin)
- ✅ Get Payments by User (Admin)
- ✅ Get Payment Statistics (Admin)
- ✅ Get Monthly Statistics (Admin)
- ❌ Get All Payments as Customer (Should Fail)
- ❌ Get Statistics as Customer (Should Fail)

### **Quick Test:**

1. **Login as Admin:**

   ```bash
   POST /api/auth/login
   { "email": "admin@example.com", "password": "..." }
   ```

2. **Get Statistics:**

   ```bash
   GET /api/payments/admin/statistics
   Authorization: Bearer <admin_token>
   ```

3. **Get All Payments:**
   ```bash
   GET /api/payments/admin/all?page=1&limit=20
   Authorization: Bearer <admin_token>
   ```

---

## 🎉 Summary

**Admin now has complete payment management:**

✅ **View all payments** with filtering and pagination  
✅ **Filter by status** (pending, succeeded, failed, etc.)  
✅ **Filter by product type** (design, course, subscription)  
✅ **Filter by user** to see specific customer history  
✅ **Filter by date range** for reports  
✅ **Get comprehensive statistics** with revenue and success rate  
✅ **Monitor recent activity** (last 10 payments)  
✅ **Track payment health** (stuck, failed, refunded)

**Perfect for building admin dashboards!** 📊
