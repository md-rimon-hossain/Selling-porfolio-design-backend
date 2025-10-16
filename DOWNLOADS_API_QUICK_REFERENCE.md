# Downloads API - Quick Reference

## Endpoints Summary

### Admin Endpoints (Require Admin Role)

| Method | Endpoint               | Description                             |
| ------ | ---------------------- | --------------------------------------- |
| GET    | `/downloads`           | Get all downloads with advanced filters |
| GET    | `/downloads/analytics` | Get download analytics and statistics   |

### User Endpoints (Require Authentication)

| Method | Endpoint                         | Description                     |
| ------ | -------------------------------- | ------------------------------- |
| GET    | `/downloads/subscription-status` | Get current subscription status |
| GET    | `/downloads/my-downloads`        | Get user's download history     |
| POST   | `/downloads/design/:designId`    | Download a design file          |

---

## New Admin Endpoint: GET /downloads

### Key Features

✅ **Advanced Filtering** - Filter by user, design, type, date range  
✅ **Search Functionality** - Search across users and designs  
✅ **Pagination** - Efficient data loading with page/limit  
✅ **Sorting** - Sort by downloadDate or createdAt  
✅ **Statistics** - Get real-time download stats

### Query Parameters

```typescript
{
  page?: number;              // Default: 1
  limit?: number;             // Default: 10, Max: 100
  sortBy?: "downloadDate" | "createdAt";  // Default: "downloadDate"
  sortOrder?: "asc" | "desc"; // Default: "desc"
  downloadType?: "individual_purchase" | "subscription";
  userId?: string;            // MongoDB ObjectId
  designId?: string;          // MongoDB ObjectId
  search?: string;            // Search in names, emails, titles
  startDate?: string;         // ISO 8601 format
  endDate?: string;           // ISO 8601 format
}
```

### Response Structure

```typescript
{
  success: true,
  message: "All downloads retrieved successfully",
  data: Download[],           // Array of download objects
  pagination: {
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemsPerPage: number,
    hasNextPage: boolean,
    hasPrevPage: boolean
  },
  statistics: {
    totalDownloads: number,
    individualPurchases: number,
    subscriptionDownloads: number,
    uniqueUsers: number,
    uniqueDesigns: number
  },
  filters: {
    downloadType: string | null,
    userId: string | null,
    designId: string | null,
    search: string | null,
    dateRange: {
      startDate: string | null,
      endDate: string | null
    },
    sortBy: string,
    sortOrder: string
  }
}
```

---

## Frontend Integration (RTK Query)

### Complete Setup

```typescript
// API Definition
export const downloadApi = createApi({
  reducerPath: "downloadApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1",
    credentials: "include", // CRITICAL for cookies
  }),
  tagTypes: ["Downloads", "Subscription"],
  endpoints: (builder) => ({
    getAllDownloads: builder.query<any, DownloadFilters>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `/downloads?${searchParams.toString()}`;
      },
      providesTags: ["Downloads"],
    }),
  }),
});
```

### Usage Example

```typescript
function AdminDownloadsTable() {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
  });

  const { data, isLoading } = useGetAllDownloadsQuery(filters);

  return (
    <div>
      {/* Search */}
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        placeholder="Search users or designs..."
      />

      {/* Statistics */}
      <div>
        Total: {data?.statistics.totalDownloads}
        Individual: {data?.statistics.individualPurchases}
        Subscription: {data?.statistics.subscriptionDownloads}
      </div>

      {/* Table */}
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
      <span>Page {data?.pagination.currentPage} of {data?.pagination.totalPages}</span>
      <button
        disabled={!data?.pagination.hasNextPage}
        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
      >
        Next
      </button>
    </div>
  );
}
```

---

## Example API Calls

### 1. Get all downloads (basic)

```bash
GET /downloads?page=1&limit=20
```

### 2. Search for specific user's downloads

```bash
GET /downloads?search=john&sortOrder=desc
```

### 3. Filter by download type

```bash
GET /downloads?downloadType=subscription&page=1
```

### 4. Filter by date range

```bash
GET /downloads?startDate=2024-10-01T00:00:00.000Z&endDate=2024-10-31T23:59:59.000Z
```

### 5. Get downloads for specific design

```bash
GET /downloads?designId=653abc123def456789012341&limit=50
```

### 6. Combined filters

```bash
GET /downloads?search=dashboard&downloadType=individual_purchase&startDate=2024-10-01T00:00:00.000Z&sortBy=downloadDate&sortOrder=desc&page=1&limit=25
```

---

## Important Implementation Details

### Search Implementation

- Searches in `User.name`, `User.email`, `Design.title`, `Design.designerName`
- Case-insensitive regex search
- Returns downloads matching ANY of the search criteria

### Performance Optimizations

- Database-level filtering (not in-memory)
- Efficient indexes on user/design/downloadDate
- Aggregation pipeline for statistics
- Populated related data in single query

### Security

- Admin-only access with role verification
- Cookie-based authentication required
- Input validation with Zod schemas
- MongoDB ObjectId validation for IDs

### Download Count Tracking

- Automatically increments `Design.downloadCount` on download
- Decrements `Purchase.remainingDownloads` for subscriptions
- Records IP address and user agent for audit trail

---

## Files Modified

1. **download.controller.ts**

   - Added `getAllDownloads()` controller function
   - Implements advanced filtering, search, pagination
   - Returns statistics along with data

2. **download.validation.ts**

   - Added `adminDownloadQuerySchema` for validation
   - Validates all query parameters with Zod
   - Proper type exports

3. **download.routes.ts**

   - Added `GET /` route for admin
   - Proper middleware chain: authenticate → authorize → validate
   - Route ordering optimized

4. **Documentation Files**
   - `DOWNLOADS_API_DOCUMENTATION.md` - Complete API docs
   - `DOWNLOADS_API_QUICK_REFERENCE.md` - Quick reference guide

---

## Testing Checklist

- [ ] Admin can access `/downloads` endpoint
- [ ] Non-admin users get 403 error
- [ ] Unauthenticated users get 401 error
- [ ] Search works across users and designs
- [ ] Pagination works correctly
- [ ] Filters combine properly (AND logic)
- [ ] Statistics calculate correctly
- [ ] Date range filtering works
- [ ] Invalid ObjectIds are rejected
- [ ] Response includes all populated data

---

## Next Steps

1. **Test the endpoint** with Postman or frontend
2. **Verify authentication** and authorization
3. **Check performance** with large datasets
4. **Add monitoring** for download patterns
5. **Consider adding** export functionality (CSV/Excel)

---

For complete documentation, see `DOWNLOADS_API_DOCUMENTATION.md`
