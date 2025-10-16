# Downloads API Documentation

## Base URL

```
http://localhost:5000/api/v1/downloads
```

---

## Table of Contents

1. [Admin Endpoints](#admin-endpoints)
   - [Get All Downloads](#1-get-all-downloads-admin)
   - [Get Download Analytics](#2-get-download-analytics-admin)
2. [User Endpoints](#user-endpoints)
   - [Get Subscription Status](#3-get-subscription-status)
   - [Get My Downloads](#4-get-my-downloads)
   - [Download a Design](#5-download-a-design)

---

## Admin Endpoints

### 1. Get All Downloads (Admin)

**Endpoint:** `GET /api/v1/downloads`

**Description:** Get all downloads with advanced filtering, searching, and pagination. Admin only.

**Authentication:** Required (Admin role)

**Query Parameters:**

| Parameter      | Type   | Required | Default        | Description                                             |
| -------------- | ------ | -------- | -------------- | ------------------------------------------------------- |
| `page`         | number | No       | 1              | Page number for pagination                              |
| `limit`        | number | No       | 10             | Number of items per page (max 100)                      |
| `sortBy`       | string | No       | "downloadDate" | Sort field: "downloadDate" or "createdAt"               |
| `sortOrder`    | string | No       | "desc"         | Sort order: "asc" or "desc"                             |
| `downloadType` | string | No       | -              | Filter by type: "individual_purchase" or "subscription" |
| `userId`       | string | No       | -              | Filter by user ID (MongoDB ObjectId)                    |
| `designId`     | string | No       | -              | Filter by design ID (MongoDB ObjectId)                  |
| `search`       | string | No       | -              | Search in user name, email, design title, designer name |
| `startDate`    | string | No       | -              | Filter downloads from this date (ISO 8601)              |
| `endDate`      | string | No       | -              | Filter downloads until this date (ISO 8601)             |

**Request Example:**

```typescript
// Frontend RTK Query
getAllDownloads: builder.query<any, {
  page?: number;
  limit?: number;
  sortBy?: "downloadDate" | "createdAt";
  sortOrder?: "asc" | "desc";
  downloadType?: "individual_purchase" | "subscription";
  userId?: string;
  designId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}>({
  query: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params.downloadType) searchParams.append("downloadType", params.downloadType);
    if (params.userId) searchParams.append("userId", params.userId);
    if (params.designId) searchParams.append("designId", params.designId);
    if (params.search) searchParams.append("search", params.search);
    if (params.startDate) searchParams.append("startDate", params.startDate);
    if (params.endDate) searchParams.append("endDate", params.endDate);
    return `/downloads?${searchParams.toString()}`;
  },
  providesTags: ["Downloads"],
}),
```

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/v1/downloads?page=1&limit=20&sortBy=downloadDate&sortOrder=desc&downloadType=subscription&search=john" \
  -H "Cookie: token=your-auth-token"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "All downloads retrieved successfully",
  "data": [
    {
      "_id": "653abc123def456789012345",
      "user": {
        "_id": "653abc123def456789012340",
        "name": "John Doe",
        "email": "john@example.com",
        "profileImage": "https://example.com/image.jpg",
        "role": "customer"
      },
      "design": {
        "_id": "653abc123def456789012341",
        "title": "Modern Dashboard UI Kit",
        "previewImageUrl": "https://example.com/preview.jpg",
        "price": 49.99,
        "designerName": "Jane Designer",
        "category": "653abc123def456789012342"
      },
      "downloadType": "subscription",
      "purchase": {
        "_id": "653abc123def456789012343",
        "purchaseType": "subscription",
        "amount": 99.99,
        "transactionId": "TXN123456789"
      },
      "downloadDate": "2024-10-15T10:30:00.000Z",
      "createdAt": "2024-10-15T10:30:00.000Z",
      "updatedAt": "2024-10-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "statistics": {
    "totalDownloads": 95,
    "individualPurchases": 45,
    "subscriptionDownloads": 50,
    "uniqueUsers": 32,
    "uniqueDesigns": 28
  },
  "filters": {
    "downloadType": "subscription",
    "userId": null,
    "designId": null,
    "search": "john",
    "dateRange": {
      "startDate": null,
      "endDate": null
    },
    "sortBy": "downloadDate",
    "sortOrder": "desc"
  }
}
```

**Error Responses:**

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Access denied. Admin role required"
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "userId",
      "message": "Invalid user ID format"
    }
  ]
}
```

---

### 2. Get Download Analytics (Admin)

**Endpoint:** `GET /api/v1/downloads/analytics`

**Description:** Get comprehensive download analytics and statistics. Admin only.

**Authentication:** Required (Admin role)

**Query Parameters:**

| Parameter   | Type   | Required | Default   | Description                                         |
| ----------- | ------ | -------- | --------- | --------------------------------------------------- |
| `period`    | string | No       | "monthly" | Time period: "daily", "weekly", "monthly", "yearly" |
| `startDate` | string | No       | -         | Custom start date (ISO 8601 datetime)               |
| `endDate`   | string | No       | -         | Custom end date (ISO 8601 datetime)                 |

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/v1/downloads/analytics?period=monthly" \
  -H "Cookie: token=your-auth-token"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Download analytics retrieved successfully",
  "data": {
    "overview": {
      "totalDownloads": 1250,
      "individualDownloads": 680,
      "subscriptionDownloads": 570,
      "uniqueUsers": 342,
      "uniqueDesigns": 128
    },
    "topDesigns": [
      {
        "designId": "653abc123def456789012341",
        "designTitle": "Modern Dashboard UI Kit",
        "designPrice": 49.99,
        "downloadCount": 87
      },
      {
        "designId": "653abc123def456789012342",
        "designTitle": "Mobile App UI Kit",
        "designPrice": 39.99,
        "downloadCount": 65
      }
    ],
    "period": "monthly",
    "dateRange": {
      "startDate": "2024-09-15T00:00:00.000Z",
      "endDate": "Present"
    }
  }
}
```

---

## User Endpoints

### 3. Get Subscription Status

**Endpoint:** `GET /api/v1/downloads/subscription-status`

**Description:** Get current user's subscription status including remaining downloads.

**Authentication:** Required

**Query Parameters:** None

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/v1/downloads/subscription-status" \
  -H "Cookie: token=your-auth-token"
```

**Success Response (200 OK) - Active Subscription:**

```json
{
  "success": true,
  "message": "Subscription status retrieved successfully",
  "data": {
    "hasActiveSubscription": true,
    "subscription": {
      "_id": "653abc123def456789012345",
      "user": "653abc123def456789012340",
      "pricingPlan": {
        "_id": "653abc123def456789012346",
        "name": "Premium Plan",
        "description": "Access to all premium features",
        "features": [
          "50 downloads per month",
          "HD quality",
          "Commercial license"
        ],
        "maxDownloads": 50,
        "duration": 30
      },
      "purchaseType": "subscription",
      "amount": 99.99,
      "status": "active",
      "subscriptionStartDate": "2024-10-01T00:00:00.000Z",
      "subscriptionEndDate": "2024-10-31T23:59:59.000Z",
      "remainingDownloads": 32,
      "createdAt": "2024-10-01T00:00:00.000Z"
    },
    "downloadStats": {
      "totalDownloaded": 18,
      "remainingDownloads": 32,
      "downloadLimitReached": false
    }
  }
}
```

**Success Response (200 OK) - No Active Subscription:**

```json
{
  "success": true,
  "message": "No active subscription found",
  "data": {
    "hasActiveSubscription": false,
    "subscription": null
  }
}
```

---

### 4. Get My Downloads

**Endpoint:** `GET /api/v1/downloads/my-downloads`

**Description:** Get authenticated user's download history with pagination and filtering.

**Authentication:** Required

**Query Parameters:**

| Parameter      | Type   | Required | Default        | Description                                             |
| -------------- | ------ | -------- | -------------- | ------------------------------------------------------- |
| `page`         | number | No       | 1              | Page number for pagination                              |
| `limit`        | number | No       | 10             | Number of items per page (max 100)                      |
| `sortBy`       | string | No       | "downloadDate" | Sort field: "downloadDate" or "createdAt"               |
| `sortOrder`    | string | No       | "desc"         | Sort order: "asc" or "desc"                             |
| `downloadType` | string | No       | -              | Filter by type: "individual_purchase" or "subscription" |

**cURL Example:**

```bash
curl -X GET "http://localhost:5000/api/v1/downloads/my-downloads?page=1&limit=10&sortBy=downloadDate&sortOrder=desc" \
  -H "Cookie: token=your-auth-token"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Download history retrieved successfully",
  "data": [
    {
      "_id": "653abc123def456789012345",
      "user": "653abc123def456789012340",
      "design": {
        "_id": "653abc123def456789012341",
        "title": "Modern Dashboard UI Kit",
        "previewImageUrl": "https://example.com/preview.jpg",
        "price": 49.99,
        "designerName": "Jane Designer"
      },
      "downloadType": "subscription",
      "purchase": {
        "_id": "653abc123def456789012343",
        "purchaseType": "subscription",
        "amount": 99.99
      },
      "downloadDate": "2024-10-15T10:30:00.000Z",
      "createdAt": "2024-10-15T10:30:00.000Z",
      "updatedAt": "2024-10-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 28,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 5. Download a Design

**Endpoint:** `POST /api/v1/downloads/design/:designId`

**Description:** Download a design file. Requires either individual purchase or active subscription.

**Authentication:** Required

**URL Parameters:**

| Parameter  | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `designId` | string | Yes      | MongoDB ObjectId of the design |

**Request Body:** None

**cURL Example:**

```bash
curl -X POST "http://localhost:5000/api/v1/downloads/design/653abc123def456789012341" \
  -H "Cookie: token=your-auth-token"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Download initiated successfully",
  "data": {
    "download": {
      "_id": "653abc123def456789012345",
      "user": {
        "_id": "653abc123def456789012340",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "design": {
        "_id": "653abc123def456789012341",
        "title": "Modern Dashboard UI Kit",
        "previewImageUrl": "https://example.com/preview.jpg",
        "designerName": "Jane Designer",
        "price": 49.99
      },
      "downloadType": "subscription",
      "downloadDate": "2024-10-15T10:30:00.000Z"
    },
    "downloadUrl": "/api/v1/files/designs/653abc123def456789012341",
    "expiresAt": "2024-10-15T10:45:00.000Z",
    "remainingDownloads": 31
  }
}
```

**Error Responses:**

**403 Forbidden - No Permission:**

```json
{
  "success": false,
  "message": "You need to purchase this design individually or have an active subscription to download it"
}
```

**403 Forbidden - Download Limit Reached:**

```json
{
  "success": false,
  "message": "You have reached your download limit for this subscription period"
}
```

**403 Forbidden - Subscription Expired:**

```json
{
  "success": false,
  "message": "Your subscription has expired. Please renew to continue downloading"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Design not found or not available"
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Invalid design ID format"
}
```

---

## Frontend Integration Examples

### React + RTK Query Complete Implementation

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const downloadApi = createApi({
  reducerPath: "downloadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1",
    credentials: "include", // Important for cookie-based auth
  }),
  tagTypes: ["Downloads", "Subscription"],
  endpoints: (builder) => ({
    // Admin: Get all downloads with filters
    getAllDownloads: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        sortBy?: "downloadDate" | "createdAt";
        sortOrder?: "asc" | "desc";
        downloadType?: "individual_purchase" | "subscription";
        userId?: string;
        designId?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sortBy) searchParams.append("sortBy", params.sortBy);
        if (params.sortOrder)
          searchParams.append("sortOrder", params.sortOrder);
        if (params.downloadType)
          searchParams.append("downloadType", params.downloadType);
        if (params.userId) searchParams.append("userId", params.userId);
        if (params.designId) searchParams.append("designId", params.designId);
        if (params.search) searchParams.append("search", params.search);
        if (params.startDate)
          searchParams.append("startDate", params.startDate);
        if (params.endDate) searchParams.append("endDate", params.endDate);
        return `/downloads?${searchParams.toString()}`;
      },
      providesTags: ["Downloads"],
    }),

    // Admin: Get download analytics
    getDownloadAnalytics: builder.query<
      any,
      {
        period?: "daily" | "weekly" | "monthly" | "yearly";
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.period) searchParams.append("period", params.period);
        if (params.startDate)
          searchParams.append("startDate", params.startDate);
        if (params.endDate) searchParams.append("endDate", params.endDate);
        return `/downloads/analytics?${searchParams.toString()}`;
      },
      providesTags: ["Downloads"],
    }),

    // User: Get subscription status
    getSubscriptionStatus: builder.query<any, void>({
      query: () => "/downloads/subscription-status",
      providesTags: ["Subscription"],
    }),

    // User: Get my downloads
    getMyDownloads: builder.query<
      any,
      {
        page?: number;
        limit?: number;
        sortBy?: "downloadDate" | "createdAt";
        sortOrder?: "asc" | "desc";
        downloadType?: "individual_purchase" | "subscription";
      }
    >({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.sortBy) searchParams.append("sortBy", params.sortBy);
        if (params.sortOrder)
          searchParams.append("sortOrder", params.sortOrder);
        if (params.downloadType)
          searchParams.append("downloadType", params.downloadType);
        return `/downloads/my-downloads?${searchParams.toString()}`;
      },
      providesTags: ["Downloads"],
    }),

    // User: Download a design
    downloadDesign: builder.mutation<any, string>({
      query: (designId) => ({
        url: `/downloads/design/${designId}`,
        method: "POST",
      }),
      invalidatesTags: ["Downloads", "Subscription"],
    }),
  }),
});

export const {
  useGetAllDownloadsQuery,
  useGetDownloadAnalyticsQuery,
  useGetSubscriptionStatusQuery,
  useGetMyDownloadsQuery,
  useDownloadDesignMutation,
} = downloadApi;
```

### Usage in Components

```typescript
// Admin Dashboard - View All Downloads
function AdminDownloadsPage() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    downloadType: undefined,
    sortBy: "downloadDate" as const,
    sortOrder: "desc" as const,
  });

  const { data, isLoading, error } = useGetAllDownloadsQuery(filters);

  return (
    <div>
      <input
        placeholder="Search users or designs..."
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div>Total Downloads: {data?.statistics.totalDownloads}</div>
          <table>
            {data?.data.map((download) => (
              <tr key={download._id}>
                <td>{download.user.name}</td>
                <td>{download.design.title}</td>
                <td>{download.downloadType}</td>
                <td>{new Date(download.downloadDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </table>

          {/* Pagination */}
          <button
            disabled={!data?.pagination.hasPrevPage}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Previous
          </button>
          <button
            disabled={!data?.pagination.hasNextPage}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Next
          </button>
        </>
      )}
    </div>
  );
}

// User Component - Download Button
function DownloadButton({ designId }: { designId: string }) {
  const [downloadDesign, { isLoading }] = useDownloadDesignMutation();
  const { data: subscription } = useGetSubscriptionStatusQuery();

  const handleDownload = async () => {
    try {
      const result = await downloadDesign(designId).unwrap();

      // Open download URL in new tab
      window.open(result.data.downloadUrl, '_blank');

      toast.success(`Download initiated! Expires in 15 minutes`);

      if (result.data.remainingDownloads !== "Unlimited") {
        toast.info(`Remaining downloads: ${result.data.remainingDownloads}`);
      }
    } catch (error: any) {
      toast.error(error.data?.message || "Download failed");
    }
  };

  return (
    <button onClick={handleDownload} disabled={isLoading}>
      {isLoading ? "Preparing..." : "Download"}
    </button>
  );
}

// User Dashboard - Download History
function MyDownloadsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyDownloadsQuery({ page, limit: 10 });

  return (
    <div>
      <h1>My Downloads</h1>
      {data?.data.map((download) => (
        <div key={download._id}>
          <h3>{download.design.title}</h3>
          <p>Downloaded: {new Date(download.downloadDate).toLocaleDateString()}</p>
          <p>Type: {download.downloadType}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Data Models

### Download Schema

```typescript
interface IDownload {
  _id: string;
  user: ObjectId | IUser;
  design: ObjectId | IDesign;
  downloadType: "individual_purchase" | "subscription";
  purchase: ObjectId | IPurchase;
  downloadDate: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Important Notes

### Authentication

- All endpoints require authentication via HTTP-only cookies
- Frontend must use `credentials: 'include'` in fetch/axios requests
- Admin endpoints require `admin` role

### Rate Limiting

- Download endpoint may have rate limiting to prevent abuse
- Recommended: Max 50 downloads per hour per user

### Download Links

- Download URLs expire after 15 minutes for security
- Each download increments the design's downloadCount
- Subscription downloads decrement remainingDownloads

### Search Functionality

- Searches in: user name, user email, design title, designer name
- Case-insensitive search
- Minimum 1 character required

### Date Filters

- Dates must be in ISO 8601 format: `2024-10-15T00:00:00.000Z`
- `startDate` and `endDate` can be used together or separately
- When using custom dates, `period` parameter is ignored

### Pagination Best Practices

- Default limit is 10, maximum is 100
- Use `hasNextPage` and `hasPrevPage` for navigation
- Total pages calculated automatically

---

## Error Handling

All endpoints follow this error response structure:

```typescript
{
  success: false,
  message: string,
  error?: string,
  errors?: Array<{ field: string, message: string }>
}
```

### Common Error Codes

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (no permission or limit reached)
- `404` - Not Found (design doesn't exist)
- `500` - Internal Server Error

---

## Testing with Postman

Import the following collection to test all endpoints:

```json
{
  "info": {
    "name": "Downloads API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Downloads (Admin)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/downloads?page=1&limit=20&search=john",
          "host": ["{{baseUrl}}"],
          "path": ["downloads"],
          "query": [
            { "key": "page", "value": "1" },
            { "key": "limit", "value": "20" },
            { "key": "search", "value": "john" }
          ]
        }
      }
    }
  ]
}
```

---

## Support

For issues or questions:

- Check validation error messages for specific field requirements
- Ensure authentication cookies are being sent
- Verify user has necessary permissions (subscription/purchase)
- Contact backend team for server-side issues
