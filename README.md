# 🎨 Design Portfolio Marketplace - Backend API# 🎨 Ecommerce Design Platform - Complete API Documentation

> A robust, production-ready Express.js REST API for a design marketplace platform with user authentication, OAuth integration, payment processing, and file management.## 📋 Table of Contents

---- [Overview](#overview)

- [Getting Started](#getting-started)

## 📋 Table of Contents- [Authentication](#authentication)

- [API Endpoints](#api-endpoints)

- [Overview](#overview) - [Health Check](#health-check)

- [Tech Stack](#tech-stack) - [Authentication](#authentication-endpoints)

- [Features](#features) - [Categories](#categories)

- [Getting Started](#getting-started) - [Designs](#designs)

- [Environment Variables](#environment-variables) - [Pricing Plans](#pricing-plans)

- [API Endpoints](#api-endpoints) - [Purchases](#purchases)

- [Project Structure](#project-structure) - [Reviews](#reviews)

- [Development](#development)- [Testing Guide](#testing-guide)

- [Deployment](#deployment)- [Error Handling](#error-handling)

- [Troubleshooting](#troubleshooting)- [Rate Limiting](#rate-limiting)

- [Security](#security)

---

---

## 🌟 Overview

## 🌟 Overview

This is the backend API for a design marketplace platform where users can:

- Browse and purchase design templates**Ecommerce Design Platform** is a comprehensive digital marketplace for selling and purchasing design assets. Built with modern technologies including **Node.js**, **Express**, **TypeScript**, **MongoDB**, and **JWT Authentication**.

- Upload and sell their own designs

- Leave reviews and likes on designs### 🚀 Key Features

- Make secure payments via Stripe

- Download purchased designs- **User Authentication** - JWT-based authentication with role-based access control

- OAuth authentication with Google and GitHub- **Design Marketplace** - Upload, browse, and purchase design assets

- **Category Management** - Organize designs by categories

---- **Subscription Plans** - Flexible pricing plans with different access levels

- **Purchase System** - Complete ecommerce workflow with payment processing

## 🛠️ Tech Stack- **Review System** - Customer feedback and rating system

- **Analytics Dashboard** - Comprehensive reporting for administrators

- **Runtime**: Node.js- **Advanced Filtering** - Search and filter across all modules

- **Framework**: Express.js with TypeScript- **Real-time Validation** - Input validation using Zod schemas

- **Database**: MongoDB with Mongoose ODM

- **Authentication**: JWT + OAuth (Google, GitHub via NextAuth)### 🛠 Tech Stack

- **Payment**: Stripe (Payment Intents + Webhooks)

- **File Storage**: Cloudinary- **Backend**: Node.js, Express.js, TypeScript

- **Validation**: Zod- **Database**: MongoDB with Mongoose ODM

- **Security**: bcrypt, cookie-parser, CORS- **Authentication**: JWT (JSON Web Tokens)

- **Validation**: Zod schema validation

---- **Security**: bcrypt password hashing, CORS protection

- **Development**: ESLint, Prettier, ts-node-dev

## ✨ Features

---

### Authentication & Authorization

- ✅ JWT-based authentication## 🚀 Getting Started

- ✅ OAuth integration (Google & GitHub)

- ✅ Role-based access control (User/Admin)### Prerequisites

- ✅ Secure password hashing with bcrypt

- Node.js (v16 or higher)

### Design Management- MongoDB database

- ✅ CRUD operations for designs- npm or yarn package manager

- ✅ Image upload to Cloudinary

- ✅ Category-based organization### Installation

- ✅ Search and filtering

- ✅ Like/unlike functionality```bash

# Clone the repository

### Payment Systemgit clone <repository-url>

- ✅ Stripe Payment Intentscd ecommerce-for-selling-design

- ✅ Webhook handling for payment events

- ✅ Purchase tracking# Install dependencies

- ✅ Pricing plans managementnpm install

- ✅ Multiple currency support (USD, BDT)

# Set up environment variables

### Downloads & Reviewscp .env.example .env

- ✅ Secure download system for purchased designs

- ✅ Review and rating system# Build the project

- ✅ Download tracking and analyticsnpm run build

### Admin Features# Start development server

- ✅ User managementnpm run start:dev

- ✅ Payment monitoring

- ✅ Design approval workflow# Start production server

- ✅ Analytics dashboard datanpm start

````

---

### Environment Variables

## 🚀 Getting Started

```env

### PrerequisitesNODE_ENV=development

PORT=5000

- **Node.js**: v18+ (LTS recommended)DATABASE_URL=mongodb://localhost:27017/ecommerce-design

- **MongoDB**: v6+ (local or Atlas)JWT_SECRET=your-jwt-secret-key

- **npm** or **yarn**JWT_EXPIRES_IN=7d

- **Stripe Account**: For payment processingBCRYPT_SALT_ROUNDS=12

- **Cloudinary Account**: For file storage```



### Installation### Base URL



1. **Clone the repository**```

   ```bashLocal Development: http://localhost:5000/api/v1

   cd backendProduction: https://your-domain.com/api/v1

````

2. **Install dependencies**---

   ```bash

   npm install## 🔐 Authentication

   ```

The API uses **JWT (JSON Web Token)** authentication with role-based access control.

3. **Create environment file**

   ````bash### User Roles

   cp .env.example .env

   ```- **Admin**: Full access to all endpoints including analytics and management
   ````

- **Customer**: Access to public endpoints, purchases, and personal data

4. **Configure environment variables** (see [Environment Variables](#environment-variables))

### Authentication Header

5. **Start development server**

   `bash`http

   npm run start:devAuthorization: Bearer <your-jwt-token>

   ```

   ```

The API will be available at `http://localhost:5000`### Token Lifecycle

---- **Expiration**: 7 days (configurable)

- **Refresh**: Currently manual (login again)

## 🔐 Environment Variables- **Storage**: Client-side storage (localStorage/sessionStorage recommended)

Create a `.env` file in the backend root directory:---

````bash## 📋 API Endpoints

# Server Configuration

PORT=5000### Health Check

NODE_ENV=development

#### GET `/health`

# Database

DB_URI=mongodb://localhost:27017/design-marketplaceCheck API server status and connectivity.

# Or use MongoDB Atlas:

# DB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/design-marketplace**Access**: Public

**Response**:

# JWT Authentication

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production```json

JWT_EXPIRES_IN=7d{

  "success": true,

# Password Hashing  "message": "Server is running smoothly",

BCRYPT_SALT_ROUNDS=10  "timestamp": "2025-01-20T10:30:00.000Z",

  "version": "1.0.0"

# Cloudinary (File Storage)}

CLOUDINARY_CLOUD_NAME=your-cloud-name```

CLOUDINARY_API_KEY=your-api-key

CLOUDINARY_API_SECRET=your-api-secret---



# Stripe Payment## 🔑 Authentication Endpoints

STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY

STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY### Register User

STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

#### POST `/auth/register`

# CORS Configuration

FRONTEND_URL=http://localhost:3000Create a new user account.

````

**Access**: Public

### 🔑 Getting API Keys**Request Body**:

#### MongoDB Atlas```json

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas){

2. Create a free cluster "name": "John Doe",

3. Get connection string from "Connect" → "Connect your application" "email": "john@example.com",

"password": "SecurePassword123!",

#### Cloudinary "role": "customer"

1. Sign up at [Cloudinary](https://cloudinary.com/)}

2. Find credentials in Dashboard → Account Details```

#### Stripe**Response** (201):

1. Create account at [Stripe](https://stripe.com)

2. Get test keys from Dashboard → Developers → API keys```json

3. For webhook secret, see [Webhook Setup](#webhook-setup){

"success": true,

--- "message": "User registered successfully",

"data": {

## 📡 API Endpoints "\_id": "64f8a1b2c3d4e5f6789abcde",

    "name": "John Doe",

### Base URL "email": "john@example.com",

```````"role": "customer",

http://localhost:5000/api    "isActive": true,

```    "createdAt": "2025-01-20T10:30:00.000Z"

  }

### Health Check}

```http```

GET /api/health

```### Login User



### Authentication#### POST `/auth/login`

```http

POST   /api/auth/register          # Register new userAuthenticate user and receive JWT token.

POST   /api/auth/login             # Login with email/password

POST   /api/auth/oauth             # OAuth login (Google/GitHub)**Access**: Public

POST   /api/auth/refresh           # Refresh JWT token**Request Body**:

GET    /api/auth/me                # Get current user

``````json

{

### Users  "email": "john@example.com",

```http  "password": "SecurePassword123!"

GET    /api/users                  # Get all users (Admin)}

GET    /api/users/:id              # Get user by ID```

PATCH  /api/users/:id              # Update user

DELETE /api/users/:id              # Delete user (Admin)**Response** (200):

```````

````json

### Designs{

```http  "success": true,

GET    /api/designs                # Get all designs (with filters)  "message": "Login successful",

GET    /api/designs/:id            # Get single design  "data": {

POST   /api/designs                # Create design (Auth required)    "user": {

PATCH  /api/designs/:id            # Update design (Owner/Admin)      "_id": "64f8a1b2c3d4e5f6789abcde",

DELETE /api/designs/:id            # Delete design (Owner/Admin)      "name": "John Doe",

```      "email": "john@example.com",

      "role": "customer"

**Query Parameters for GET /api/designs:**    },

- `category`: Filter by category ID    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

- `search`: Search in title/description  }

- `minPrice`: Minimum price}

- `maxPrice`: Maximum price```

- `sort`: Sort by (price, createdAt, likes)

- `page`: Page number (default: 1)### Change Password

- `limit`: Items per page (default: 12)

#### PUT `/auth/change-password`

### Categories

```httpChange user password (requires authentication).

GET    /api/categories             # Get all categories

GET    /api/categories/:id         # Get category by ID**Access**: Authenticated Users

POST   /api/categories             # Create category (Admin)**Request Body**:

PATCH  /api/categories/:id         # Update category (Admin)

DELETE /api/categories/:id         # Delete category (Admin)```json

```{

  "currentPassword": "OldPassword123!",

### Pricing Plans  "newPassword": "NewSecurePassword123!"

```http}

GET    /api/pricing-plans          # Get all pricing plans```

GET    /api/pricing-plans/:id      # Get plan by ID

POST   /api/pricing-plans          # Create plan (Admin)---

PATCH  /api/pricing-plans/:id      # Update plan (Admin)

DELETE /api/pricing-plans/:id      # Delete plan (Admin)## 📂 Categories

````

### Get All Categories

### Payments

```http#### GET `/categories`

POST /api/payments/create-payment-intent # Create Stripe payment

POST /api/payments/confirm # Confirm paymentRetrieve all design categories with optional filtering.

POST /api/payments/webhook # Stripe webhook (raw body)

GET /api/payments # Get all payments (Admin)**Access**: Public

GET /api/payments/user/:userId # Get user payments**Query Parameters**:

````

- `page` (number): Page number (default: 1)

### Purchases- `limit` (number): Items per page (default: 10)

```http- `search` (string): Search term

GET    /api/purchases                         # Get user's purchases- `isActive` (boolean): Filter by active status

GET    /api/purchases/:id                     # Get purchase details- `sortBy` (string): Sort field (name, createdAt)

GET    /api/purchases/check/:designId         # Check if design purchased- `sortOrder` (string): asc | desc

````

**Response** (200):

### Downloads

`http`json

GET /api/downloads/:purchaseId # Download purchased design{

GET /api/downloads/history # Get download history "success": true,

````"message": "Categories retrieved successfully",

  "data": [

### Reviews    {

```http      "_id": "64f8a1b2c3d4e5f6789abcde",

GET    /api/reviews/design/:designId         # Get reviews for design      "name": "Logo Design",

POST   /api/reviews                          # Create review (Auth)      "description": "Professional logo designs for businesses",

PATCH  /api/reviews/:id                      # Update review (Owner)      "isActive": true,

DELETE /api/reviews/:id                      # Delete review (Owner/Admin)      "designCount": 245,

```      "createdAt": "2025-01-15T08:20:00.000Z"

    }

### Likes  ],

```http  "pagination": {

POST   /api/likes/toggle/:designId           # Like/unlike design    "currentPage": 1,

GET    /api/likes/status/:designId           # Check if user liked    "totalPages": 5,

GET    /api/likes/design/:designId           # Get design like count    "totalItems": 50,

```    "hasNext": true,

    "hasPrev": false

---  }

}

## 📁 Project Structure```



```### Create Category

backend/

├── src/#### POST `/categories`

│   ├── app/

│   │   ├── config/Create a new design category.

│   │   │   ├── database.ts           # MongoDB connection

│   │   │   └── index.ts               # Config loader**Access**: Admin Only

│   │   ├── middlewares/**Request Body**:

│   │   │   ├── auth.middleware.ts     # JWT verification

│   │   │   ├── error.middleware.ts    # Global error handler```json

│   │   │   └── upload.middleware.ts   # Multer file upload{

│   │   ├── modules/  "name": "Web Design Templates",

│   │   │   ├── auth/  "description": "Modern and responsive web design templates",

│   │   │   │   ├── auth.controller.ts  "isActive": true

│   │   │   │   ├── auth.routes.ts}

│   │   │   │   ├── auth.service.ts```

│   │   │   │   └── auth.validation.ts

│   │   │   ├── design/               # Design CRUD### Get Single Category

│   │   │   ├── category/             # Categories

│   │   │   ├── payments/             # Stripe integration#### GET `/categories/:id`

│   │   │   ├── purchase/             # Purchase tracking

│   │   │   ├── download/             # Download managementRetrieve a specific category by ID.

│   │   │   ├── review/               # Reviews system

│   │   │   ├── like/                 # Like functionality**Access**: Public

│   │   │   ├── user/                 # User management

│   │   │   └── pricingPlan/          # Pricing plans### Update Category

│   │   ├── routes/

│   │   │   └── index.ts              # Route aggregator#### PUT `/categories/:id`

│   │   ├── services/                 # Shared services

│   │   └── utils/Update an existing category.

│   │       ├── cloudinary.ts         # Cloudinary upload

│   │       └── jwt.ts                # JWT utilities**Access**: Admin Only

│   ├── app.ts                        # Express app setup

│   └── server.ts                     # Server entry point### Delete Category

├── .env.example                      # Example environment file

├── package.json#### DELETE `/categories/:id`

├── tsconfig.json

└── README.mdDelete a category (soft delete).

````

**Access**: Admin Only

---

---

## 💻 Development

## 🎨 Designs

### Available Scripts

### Get All Designs

````bash

# Development with auto-reload#### GET `/designs`

npm run start:dev

Retrieve all designs with advanced filtering and search.

# Production build

npm run build**Access**: Public

**Query Parameters**:

# Start production server

npm start- `page`, `limit`: Pagination

- `search`: Search in title/description

# Linting- `category`: Filter by category ID

npm run lint- `minPrice`, `maxPrice`: Price range

npm run lint:fix- `tags`: Filter by tags (comma-separated)

- `sortBy`: price, downloads, rating, createdAt

# Code formatting- `sortOrder`: asc | desc

npm run format

```**Response** (200):



### Code Style```json

{

This project uses:  "success": true,

- **ESLint**: For code linting  "data": [

- **Prettier**: For code formatting    {

- **TypeScript**: For type safety      "_id": "64f8a1b2c3d4e5f6789abcde",

      "title": "Modern Corporate Logo Pack",

### Database Migrations      "description": "Collection of 20 modern corporate logos",

      "price": 49.99,

To add new fields or migrate data:      "category": {

        "_id": "64f8a1b2c3d4e5f6789abcdf",

```bash        "name": "Logo Design"

npm run migrate:add-currency      },

```      "tags": ["corporate", "modern", "professional"],

      "images": ["image1.jpg", "image2.jpg"],

---      "files": ["logo-pack.zip"],

      "downloads": 1250,

## 🔧 Stripe Webhook Setup      "rating": {

        "average": 4.8,

Stripe webhooks are required for payment confirmation.        "count": 156

      },

### Development (Local Testing)      "isActive": true,

      "createdAt": "2025-01-10T12:00:00.000Z"

1. **Install Stripe CLI**    }

   ```bash  ],

   # Windows (use Scoop or download from stripe.com)  "pagination": { ... }

   scoop install stripe}

````

# macOS

brew install stripe/stripe-cli/stripe### Upload Design

````

#### POST `/designs`

2. **Login to Stripe**

```bashUpload a new design to the marketplace.

stripe login

```**Access**: Admin Only

**Request Body**:

3. **Forward webhooks to local server**

```bash```json

stripe listen --forward-to localhost:5000/api/payments/webhook{

```  "title": "Minimalist Business Card Set",

"description": "Clean and professional business card designs",

4. **Copy webhook secret**  "price": 29.99,

The CLI will display:  "category": "64f8a1b2c3d4e5f6789abcdf",

```  "tags": ["business-card", "minimalist", "professional"],

> Ready! Your webhook signing secret is whsec_...  "images": ["preview1.jpg", "preview2.jpg"],

```  "files": ["business-cards.zip"],

  "requirements": "Adobe Illustrator CS6 or higher",

Add this to `.env`:  "license": "Commercial use allowed",

```bash  "isActive": true

STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE}

````

5. **Test payments**### Get Single Design

   Use Stripe test cards:

   - Success: `4242 4242 4242 4242`#### GET `/designs/:id`

   - Decline: `4000 0000 0000 0002`

   - Any future date for expiry, any 3-digit CVCRetrieve detailed information about a specific design.

### Production (Deployed Backend)**Access**: Public

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)### Update Design

2. Navigate to **Developers** → **Webhooks**

3. Click **Add endpoint**#### PUT `/designs/:id`

4. Set endpoint URL: `https://your-api-domain.com/api/payments/webhook`

5. Select events:Update design information.

   - `payment_intent.succeeded`

   - `payment_intent.payment_failed`**Access**: Admin Only

   - `payment_intent.canceled`

6. Copy signing secret and add to production environment variables### Delete Design

---#### DELETE `/designs/:id`

## 🚢 DeploymentRemove a design from the marketplace.

### Vercel**Access**: Admin Only

1. **Install Vercel CLI**### Get Design Analytics

   ```bash

   npm i -g vercel#### GET `/designs/analytics`

   ```

Get comprehensive design analytics and statistics.

2. **Deploy**

   ```bash**Access**: Admin Only

   vercel**Query Parameters**:

   ```

- `startDate`, `endDate`: Date range

3. **Add environment variables**- `designId`: Specific design analytics

   - Go to Vercel Dashboard → Project → Settings → Environment Variables- `groupBy`: day, week, month

   - Add all variables from `.env`

**Response** (200):

4.  **Configure vercel.json** (already included)

    `json`json

    {{

    "version": 2, "success": true,

    "builds": [ "data": {

        {    "totalDesigns": 1250,

          "src": "src/server.ts",    "totalDownloads": 45680,

          "use": "@vercel/node"    "totalRevenue": 125750.5,

        }    "averageRating": 4.6,

    ], "topCategories": [

    "routes": [ {

        {        "category": "Logo Design",

          "src": "/(.*)",        "count": 245,

          "dest": "src/server.ts"        "revenue": 35000

        }      }

    ] ],

    } "monthlyStats": [

    ```{

         "month": "2025-01",
    ```

### Heroku "designs": 45,

        "downloads": 2340,

```````bash "revenue": 5670.25

# Login      }

heroku login    ]

  }

# Create app}

heroku create your-app-name```



# Add MongoDB---

heroku addons:create mongolab

## 💰 Pricing Plans

# Set environment variables

heroku config:set JWT_SECRET=your-secret### Get Active Pricing Plans

heroku config:set STRIPE_SECRET_KEY=sk_live_...

# ... add all variables#### GET `/pricing-plans/active`



# DeployRetrieve all active subscription plans.

git push heroku main

**Access**: Public

# View logs**Response** (200):

heroku logs --tail

``````json

{

### Railway  "success": true,

  "data": [

1. Connect GitHub repository    {

2. Select backend folder      "_id": "64f8a1b2c3d4e5f6789abcde",

3. Add environment variables in dashboard      "name": "Premium Plan",

4. Deploy automatically on push      "description": "Full access to all premium features",

      "price": 99.99,

---      "originalPrice": 149.99,

      "discountPercentage": 33,

## 🐛 Troubleshooting      "features": [

        "Unlimited downloads",

### Common Issues        "Premium support",

        "Advanced analytics",

#### 1. Database Connection Failed        "Custom design requests"

```      ],

Error: MongoServerError: Authentication failed      "duration": "1 month",

```      "maxDesigns": 100,

**Solution**: Check `DB_URI` in `.env`. Ensure username/password are correct and special characters are URL-encoded.      "maxDownloads": 1000,

      "priority": 1,

#### 2. Stripe Webhook Verification Failed      "isActive": true,

```      "validUntil": "2025-12-31T23:59:59.000Z"

Error: No signatures found matching the expected signature    }

```  ]

**Solution**: }

- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly```

- Make sure webhook route is BEFORE `express.json()` middleware (already configured)

- Run `stripe listen` for local development### Create Pricing Plan



#### 3. Cloudinary Upload Failed#### POST `/pricing-plans`

```````

Error: Must supply cloud_nameCreate a new subscription plan.

```````

**Solution**: Check Cloudinary credentials in `.env`**Access**: Admin Only

**Request Body**:

#### 4. CORS Error from Frontend

``````json

Access to XMLHttpRequest has been blocked by CORS policy{

```  "name": "Professional Plan",

**Solution**: Add your frontend URL to CORS whitelist in `src/app.ts`:  "description": "Perfect for professional designers",

```typescript  "price": 49.99,

cors({  "features": ["50 downloads per month", "Email support", "Standard templates"],

  origin: [  "duration": "1 month",

    "http://localhost:3000",  "maxDesigns": 50,

    "https://your-frontend-domain.com"  "maxDownloads": 50,

  ],  "priority": 2,

  credentials: true  "isActive": true,

})  "discountPercentage": 20,

```  "validUntil": "2025-12-31T23:59:59.000Z"

}

#### 5. JWT Token Invalid```

```````

Error: jwt malformed### Get All Pricing Plans

````

**Solution**: Ensure `JWT_SECRET` is set in `.env` and matches between backend restarts#### GET `/pricing-plans`



---Retrieve all pricing plans with filtering (admin only).



## 📊 API Response Format**Access**: Admin Only

**Query Parameters**:

### Success Response

```json- Standard pagination and sorting options

{- `isActive`: Filter by active status

  "success": true,

  "message": "Operation successful",### Update Pricing Plan

  "data": {

    // Response data#### PUT `/pricing-plans/:id`

  }

}Update an existing pricing plan.

````

**Access**: Admin Only

### Error Response

```json### Get Pricing Plan Analytics

{

  "success": false,#### GET `/pricing-plans/analytics`

  "message": "Error description",

  "error": "Detailed error message",Get pricing plan performance analytics.

  "errorDetails": {

    // Additional error info**Access**: Admin Only

  }

}---

```

## 🛒 Purchases

---

### Create Purchase

## 🔒 Security Best Practices

#### POST `/purchases`

- ✅ Environment variables for sensitive data

- ✅ JWT tokens with expirationCreate a new purchase/subscription.

- ✅ Password hashing with bcrypt

- ✅ CORS configuration**Access**: Authenticated Customers

- ✅ Input validation with Zod**Request Body**:

- ✅ Rate limiting (implement with `express-rate-limit`)

- ✅ Helmet for security headers (recommended)```json

{

--- "pricingPlan": "64f8a1b2c3d4e5f6789abcde",

"paymentMethod": "credit_card",

## 📝 Testing "paymentDetails": {

    "cardNumber": "**** **** **** 1234",

Use the included Postman collection: "expiryDate": "12/26",

    "cvv": "***",

1. Import `Ecommerce Design Selling API.postman_collection.json` "cardholderName": "John Doe"

2. Set environment variables: },

   - `BASE_URL`: `http://localhost:5000/api` "billingAddress": {

   - `TOKEN`: Your JWT token after login "street": "123 Main Street",

3. Run requests in order (Register → Login → Test endpoints) "city": "New York",

   "state": "NY",

--- "zipCode": "10001",

    "country": "USA"

## 🤝 Contributing },

"notes": "First purchase - excited to try premium features!"

1. Fork the repository}

2. Create feature branch (`git checkout -b feature/amazing-feature`)```

3. Commit changes (`git commit -m 'Add amazing feature'`)

4. Push to branch (`git push origin feature/amazing-feature`)**Response** (201):

5. Open Pull Request

````json

---{

  "success": true,

## 📄 License  "message": "Purchase created successfully",

  "data": {

This project is licensed under the ISC License.    "_id": "64f8a1b2c3d4e5f6789abcde",

    "user": "64f8a1b2c3d4e5f6789abcdf",

---    "pricingPlan": {

      "_id": "64f8a1b2c3d4e5f6789abcde",

## 👤 Author      "name": "Premium Plan",

      "price": 99.99

**Rimon Hossain**    },

    "amount": 99.99,

---    "status": "pending",

    "paymentMethod": "credit_card",

## 📞 Support    "purchaseDate": "2025-01-20T15:30:00.000Z",

    "expiryDate": "2025-02-20T15:30:00.000Z"

For issues or questions:  }

- Check [Troubleshooting](#troubleshooting) section}

- Review API documentation above```

- Check MongoDB connection strings

- Verify all environment variables are set### Get My Purchases



---#### GET `/purchases/my-purchases`



## 🎯 Quick Start ChecklistRetrieve current user's purchase history.



- [ ] Node.js v18+ installed**Access**: Authenticated Customers

- [ ] MongoDB running (local or Atlas)**Query Parameters**:

- [ ] `.env` file created with all variables

- [ ] Dependencies installed (`npm install`)- `page`, `limit`: Pagination

- [ ] Stripe CLI running for local webhook testing- `status`: pending, active, expired, cancelled

- [ ] Server running (`npm run start:dev`)

- [ ] API health check passes: `GET /api/health`### Get All Purchases

- [ ] Frontend configured to point to this API

#### GET `/purchases`

---

Retrieve all purchases with filtering.

**Made with ❤️ for designers and developers**

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
````

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
