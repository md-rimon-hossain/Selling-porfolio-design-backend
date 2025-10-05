# 🎨 Ecommerce Design Platform - Complete API Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication](#authentication-endpoints)
  - [Categories](#categories)
  - [Designs](#designs)
  - [Pricing Plans](#pricing-plans)
  - [Purchases](#purchases)
  - [Reviews](#reviews)
- [Testing Guide](#testing-guide)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

---

## 🌟 Overview

**Ecommerce Design Platform** is a comprehensive digital marketplace for selling and purchasing design assets. Built with modern technologies including **Node.js**, **Express**, **TypeScript**, **MongoDB**, and **JWT Authentication**.

### 🚀 Key Features

- **User Authentication** - JWT-based authentication with role-based access control
- **Design Marketplace** - Upload, browse, and purchase design assets
- **Category Management** - Organize designs by categories
- **Subscription Plans** - Flexible pricing plans with different access levels
- **Purchase System** - Complete ecommerce workflow with payment processing
- **Review System** - Customer feedback and rating system
- **Analytics Dashboard** - Comprehensive reporting for administrators
- **Advanced Filtering** - Search and filter across all modules
- **Real-time Validation** - Input validation using Zod schemas

### 🛠 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod schema validation
- **Security**: bcrypt password hashing, CORS protection
- **Development**: ESLint, Prettier, ts-node-dev

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce-for-selling-design

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Build the project
npm run build

# Start development server
npm run start:dev

# Start production server
npm start
```

### Environment Variables

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/ecommerce-design
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

### Base URL

```
Local Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

---

## 🔐 Authentication

The API uses **JWT (JSON Web Token)** authentication with role-based access control.

### User Roles

- **Admin**: Full access to all endpoints including analytics and management
- **Customer**: Access to public endpoints, purchases, and personal data

### Authentication Header

```http
Authorization: Bearer <your-jwt-token>
```

### Token Lifecycle

- **Expiration**: 7 days (configurable)
- **Refresh**: Currently manual (login again)
- **Storage**: Client-side storage (localStorage/sessionStorage recommended)

---

## 📋 API Endpoints

### Health Check

#### GET `/health`

Check API server status and connectivity.

**Access**: Public  
**Response**:

```json
{
  "success": true,
  "message": "Server is running smoothly",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 🔑 Authentication Endpoints

### Register User

#### POST `/auth/register`

Create a new user account.

**Access**: Public  
**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "role": "customer"
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6789abcde",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "isActive": true,
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

### Login User

#### POST `/auth/login`

Authenticate user and receive JWT token.

**Access**: Public  
**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response** (200):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6789abcde",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Change Password

#### PUT `/auth/change-password`

Change user password (requires authentication).

**Access**: Authenticated Users  
**Request Body**:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!"
}
```

---

## 📂 Categories

### Get All Categories

#### GET `/categories`

Retrieve all design categories with optional filtering.

**Access**: Public  
**Query Parameters**:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `isActive` (boolean): Filter by active status
- `sortBy` (string): Sort field (name, createdAt)
- `sortOrder` (string): asc | desc

**Response** (200):

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6789abcde",
      "name": "Logo Design",
      "description": "Professional logo designs for businesses",
      "isActive": true,
      "designCount": 245,
      "createdAt": "2025-01-15T08:20:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Create Category

#### POST `/categories`

Create a new design category.

**Access**: Admin Only  
**Request Body**:

```json
{
  "name": "Web Design Templates",
  "description": "Modern and responsive web design templates",
  "isActive": true
}
```

### Get Single Category

#### GET `/categories/:id`

Retrieve a specific category by ID.

**Access**: Public

### Update Category

#### PUT `/categories/:id`

Update an existing category.

**Access**: Admin Only

### Delete Category

#### DELETE `/categories/:id`

Delete a category (soft delete).

**Access**: Admin Only

---

## 🎨 Designs

### Get All Designs

#### GET `/designs`

Retrieve all designs with advanced filtering and search.

**Access**: Public  
**Query Parameters**:

- `page`, `limit`: Pagination
- `search`: Search in title/description
- `category`: Filter by category ID
- `minPrice`, `maxPrice`: Price range
- `tags`: Filter by tags (comma-separated)
- `sortBy`: price, downloads, rating, createdAt
- `sortOrder`: asc | desc

**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6789abcde",
      "title": "Modern Corporate Logo Pack",
      "description": "Collection of 20 modern corporate logos",
      "price": 49.99,
      "category": {
        "_id": "64f8a1b2c3d4e5f6789abcdf",
        "name": "Logo Design"
      },
      "tags": ["corporate", "modern", "professional"],
      "images": ["image1.jpg", "image2.jpg"],
      "files": ["logo-pack.zip"],
      "downloads": 1250,
      "rating": {
        "average": 4.8,
        "count": 156
      },
      "isActive": true,
      "createdAt": "2025-01-10T12:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### Upload Design

#### POST `/designs`

Upload a new design to the marketplace.

**Access**: Admin Only  
**Request Body**:

```json
{
  "title": "Minimalist Business Card Set",
  "description": "Clean and professional business card designs",
  "price": 29.99,
  "category": "64f8a1b2c3d4e5f6789abcdf",
  "tags": ["business-card", "minimalist", "professional"],
  "images": ["preview1.jpg", "preview2.jpg"],
  "files": ["business-cards.zip"],
  "requirements": "Adobe Illustrator CS6 or higher",
  "license": "Commercial use allowed",
  "isActive": true
}
```

### Get Single Design

#### GET `/designs/:id`

Retrieve detailed information about a specific design.

**Access**: Public

### Update Design

#### PUT `/designs/:id`

Update design information.

**Access**: Admin Only

### Delete Design

#### DELETE `/designs/:id`

Remove a design from the marketplace.

**Access**: Admin Only

### Get Design Analytics

#### GET `/designs/analytics`

Get comprehensive design analytics and statistics.

**Access**: Admin Only  
**Query Parameters**:

- `startDate`, `endDate`: Date range
- `designId`: Specific design analytics
- `groupBy`: day, week, month

**Response** (200):

```json
{
  "success": true,
  "data": {
    "totalDesigns": 1250,
    "totalDownloads": 45680,
    "totalRevenue": 125750.5,
    "averageRating": 4.6,
    "topCategories": [
      {
        "category": "Logo Design",
        "count": 245,
        "revenue": 35000
      }
    ],
    "monthlyStats": [
      {
        "month": "2025-01",
        "designs": 45,
        "downloads": 2340,
        "revenue": 5670.25
      }
    ]
  }
}
```

---

## 💰 Pricing Plans

### Get Active Pricing Plans

#### GET `/pricing-plans/active`

Retrieve all active subscription plans.

**Access**: Public  
**Response** (200):

```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6789abcde",
      "name": "Premium Plan",
      "description": "Full access to all premium features",
      "price": 99.99,
      "originalPrice": 149.99,
      "discountPercentage": 33,
      "features": [
        "Unlimited downloads",
        "Premium support",
        "Advanced analytics",
        "Custom design requests"
      ],
      "duration": "1 month",
      "maxDesigns": 100,
      "maxDownloads": 1000,
      "priority": 1,
      "isActive": true,
      "validUntil": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

### Create Pricing Plan

#### POST `/pricing-plans`

Create a new subscription plan.

**Access**: Admin Only  
**Request Body**:

```json
{
  "name": "Professional Plan",
  "description": "Perfect for professional designers",
  "price": 49.99,
  "features": ["50 downloads per month", "Email support", "Standard templates"],
  "duration": "1 month",
  "maxDesigns": 50,
  "maxDownloads": 50,
  "priority": 2,
  "isActive": true,
  "discountPercentage": 20,
  "validUntil": "2025-12-31T23:59:59.000Z"
}
```

### Get All Pricing Plans

#### GET `/pricing-plans`

Retrieve all pricing plans with filtering (admin only).

**Access**: Admin Only  
**Query Parameters**:

- Standard pagination and sorting options
- `isActive`: Filter by active status

### Update Pricing Plan

#### PUT `/pricing-plans/:id`

Update an existing pricing plan.

**Access**: Admin Only

### Get Pricing Plan Analytics

#### GET `/pricing-plans/analytics`

Get pricing plan performance analytics.

**Access**: Admin Only

---

## 🛒 Purchases

### Create Purchase

#### POST `/purchases`

Create a new purchase/subscription.

**Access**: Authenticated Customers  
**Request Body**:

```json
{
  "pricingPlan": "64f8a1b2c3d4e5f6789abcde",
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardNumber": "**** **** **** 1234",
    "expiryDate": "12/26",
    "cvv": "***",
    "cardholderName": "John Doe"
  },
  "billingAddress": {
    "street": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "notes": "First purchase - excited to try premium features!"
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "Purchase created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6789abcde",
    "user": "64f8a1b2c3d4e5f6789abcdf",
    "pricingPlan": {
      "_id": "64f8a1b2c3d4e5f6789abcde",
      "name": "Premium Plan",
      "price": 99.99
    },
    "amount": 99.99,
    "status": "pending",
    "paymentMethod": "credit_card",
    "purchaseDate": "2025-01-20T15:30:00.000Z",
    "expiryDate": "2025-02-20T15:30:00.000Z"
  }
}
```

### Get My Purchases

#### GET `/purchases/my-purchases`

Retrieve current user's purchase history.

**Access**: Authenticated Customers  
**Query Parameters**:

- `page`, `limit`: Pagination
- `status`: pending, active, expired, cancelled

### Get All Purchases

#### GET `/purchases`

Retrieve all purchases with filtering.

**Access**: Admin Only

### Update Purchase Status

#### PUT `/purchases/:id/status`

Update purchase status (payment processing, activation, etc.).

**Access**: Admin Only  
**Request Body**:

```json
{
  "status": "active",
  "adminNotes": "Payment verified and approved"
}
```

### Cancel Purchase

#### DELETE `/purchases/:id`

Cancel a purchase/subscription.

**Access**: Purchase Owner or Admin  
**Request Body**:

```json
{
  "cancelReason": "Changed my mind about the purchase"
}
```

### Get Purchase Analytics

#### GET `/purchases/analytics`

Get comprehensive purchase analytics.

**Access**: Admin Only  
**Query Parameters**:

- `startDate`, `endDate`: Date range
- `groupBy`: day, week, month
- `status`: Filter by purchase status

**Response** (200):

```json
{
  "success": true,
  "data": {
    "totalPurchases": 2340,
    "totalRevenue": 125750.5,
    "averageOrderValue": 53.74,
    "conversionRate": 12.5,
    "statusBreakdown": {
      "active": 1890,
      "pending": 234,
      "cancelled": 156,
      "expired": 60
    },
    "monthlyRevenue": [
      {
        "month": "2025-01",
        "revenue": 15750.25,
        "purchases": 287
      }
    ]
  }
}
```

---

## ⭐ Reviews

### Create Review

#### POST `/reviews`

Create a review for a design.

**Access**: Authenticated Customers  
**Request Body**:

```json
{
  "design": "64f8a1b2c3d4e5f6789abcde",
  "rating": 5,
  "title": "Outstanding Modern Corporate Design",
  "comment": "Absolutely fantastic design! The attention to detail is remarkable and the quality exceeds expectations.",
  "pros": [
    "Clean and professional design",
    "High-quality files provided",
    "Excellent documentation"
  ],
  "cons": ["Could include more color variations"],
  "wouldRecommend": true
}
```

**Response** (201):

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6789abcde",
    "user": {
      "_id": "64f8a1b2c3d4e5f6789abcdf",
      "name": "John Doe"
    },
    "design": "64f8a1b2c3d4e5f6789abcde",
    "rating": 5,
    "title": "Outstanding Modern Corporate Design",
    "comment": "Absolutely fantastic design!...",
    "pros": ["Clean and professional design", "..."],
    "cons": ["Could include more color variations"],
    "wouldRecommend": true,
    "helpfulCount": 0,
    "createdAt": "2025-01-20T16:45:00.000Z"
  }
}
```

### Get Design Reviews

#### GET `/reviews/design/:designId`

Get all reviews for a specific design.

**Access**: Public  
**Query Parameters**:

- `page`, `limit`: Pagination
- `sortBy`: rating, helpfulCount, createdAt
- `sortOrder`: asc | desc

### Get All Reviews

#### GET `/reviews`

Get all reviews with filtering.

**Access**: Admin Only

### Update Review

#### PUT `/reviews/:id`

Update an existing review.

**Access**: Review Owner or Admin

### Mark Review as Helpful

#### PUT `/reviews/:id/helpful`

Mark a review as helpful or not helpful.

**Access**: Authenticated Users (except review owner)  
**Request Body**:

```json
{
  "isHelpful": true
}
```

### Delete Review

#### DELETE `/reviews/:id`

Delete a review.

**Access**: Review Owner or Admin

### Get Review Analytics

#### GET `/reviews/analytics`

Get review analytics and statistics.

**Access**: Admin Only  
**Response** (200):

```json
{
  "success": true,
  "data": {
    "totalReviews": 1567,
    "averageRating": 4.6,
    "ratingDistribution": {
      "5": 789,
      "4": 456,
      "3": 234,
      "2": 67,
      "1": 21
    },
    "topReviewedDesigns": [
      {
        "design": "64f8a1b2c3d4e5f6789abcde",
        "title": "Modern Corporate Logo Pack",
        "reviewCount": 156,
        "averageRating": 4.8
      }
    ]
  }
}
```

---

## 🧪 Testing Guide

### Using Postman Collection

#### Setup Environment Variables

```json
{
  "base_url": "http://localhost:5000/api/v1",
  "admin_token": "",
  "customer_token": "",
  "category_id": "",
  "design_id": "",
  "pricing_plan_id": "",
  "purchase_id": "",
  "review_id": ""
}
```

### Recommended Testing Flow

#### 1. Authentication & Setup

1. **Health Check** - Verify server is running
2. **Register Admin** - Create admin account
3. **Register Customer** - Create customer account
4. **Login Admin** - Get admin token
5. **Login Customer** - Get customer token

#### 2. Core Functionality

1. **Create Categories** - Set up design categories
2. **Upload Designs** - Add design assets
3. **Create Pricing Plans** - Set up subscription plans
4. **Test Public Endpoints** - Browse without authentication

#### 3. Ecommerce Workflow

1. **Create Purchase** - Customer buys subscription
2. **Update Purchase Status** - Admin processes payment
3. **Create Reviews** - Customer leaves feedback
4. **Test Analytics** - Admin views reports

#### 4. Authorization Testing

1. **Admin-only Endpoints** - Test with customer token (should fail)
2. **Customer-only Endpoints** - Test without authentication (should fail)
3. **Owner-only Operations** - Test with different user (should fail)

#### 5. Validation Testing

1. **Invalid Data** - Test with malformed requests
2. **Missing Fields** - Test required field validation
3. **Data Types** - Test type validation
4. **Business Rules** - Test duplicate prevention, etc.

### Test Data Examples

#### Valid Admin User

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "AdminPass123!",
  "role": "admin"
}
```

#### Valid Customer User

```json
{
  "name": "John Doe",
  "email": "customer@example.com",
  "password": "CustomerPass123!",
  "role": "customer"
}
```

#### Sample Design Category

```json
{
  "name": "Logo Design",
  "description": "Professional logo designs for businesses and brands",
  "isActive": true
}
```

---

## ⚠️ Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Detailed error message",
  "errorCode": "SPECIFIC_ERROR_CODE",
  "statusCode": 400,
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered"
    }
  ]
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created successfully
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate data)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Error Types

#### Validation Errors (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters long"
    }
  ]
}
```

#### Authentication Errors (401)

```json
{
  "success": false,
  "message": "Authentication required",
  "errorCode": "UNAUTHORIZED"
}
```

#### Authorization Errors (403)

```json
{
  "success": false,
  "message": "Insufficient permissions to perform this action",
  "errorCode": "FORBIDDEN"
}
```

---

## 🛡️ Security

### Authentication Security

- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Token Expiration**: Configurable token lifetime
- **Role-based Access**: Admin/Customer permission levels

### Input Validation

- **Zod Schema Validation**: Type-safe input validation
- **SQL Injection Prevention**: MongoDB ODM protection
- **XSS Prevention**: Input sanitization
- **CORS Protection**: Configurable cross-origin policies

### Best Practices

- Use HTTPS in production
- Implement rate limiting
- Regular security audits
- Keep dependencies updated
- Monitor for suspicious activity

---

## 📈 Rate Limiting

### Default Limits

- **Authentication Endpoints**: 5 requests per minute
- **Public Endpoints**: 100 requests per minute
- **Authenticated Endpoints**: 200 requests per minute
- **Admin Endpoints**: 500 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## 🔧 Development

### Scripts

```bash
# Development with hot reload
npm run start:dev

# Production build
npm run build
npm start

# Code quality
npm run lint
npm run lint:fix
npm run format
```

### Database Relationships

```
User (1) → (N) Purchase
User (1) → (N) Review
Category (1) → (N) Design
Design (1) → (N) Review
PricingPlan (1) → (N) Purchase
```

### Project Structure

```
src/
├── app/
│   ├── config/         # Database and app configuration
│   ├── middlewares/    # Authentication and error handling
│   ├── modules/        # Feature modules (auth, designs, etc.)
│   └── routes/         # Route definitions
├── app.ts             # Express app setup
└── server.ts          # Server startup
```

---

## 📞 Support

### API Version

Current Version: **v1.0.0**

### Documentation Updates

This documentation is updated with each API release. Check the version number and changelog for updates.

### Contact

- **Developer**: Rimon Hossain
- **Email**: support@yourplatform.com
- **GitHub**: [Repository Link]

---

**Last Updated**: January 20, 2025  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0
