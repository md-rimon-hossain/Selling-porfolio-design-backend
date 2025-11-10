# 🔐 Hybrid OAuth Implementation (NextAuth + Express Backend)

## 🎯 Overview

**Best of Both Worlds:**

- ✅ NextAuth handles OAuth on frontend (easier, more features)
- ✅ Your Express backend validates users and issues JWT tokens
- ✅ Maintains your existing JWT authentication system
- ✅ No need to modify Express routes for OAuth callbacks

---

## 📊 Architecture Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User clicks "Login with Google"                             │
│     ↓                                                            │
│  2. NextAuth handles OAuth flow with Google/GitHub              │
│     ↓                                                            │
│  3. NextAuth receives user profile (name, email, image)         │
│     ↓                                                            │
│  4. Send user data to YOUR backend: POST /api/auth/oauth        │
│     {                                                            │
│       name: "John Doe",                                          │
│       email: "john@gmail.com",                                   │
│       image: "https://...",                                      │
│       provider: "google"                                         │
│     }                                                            │
│     ↓                                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                     BACKEND (Express + MongoDB)                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  5. Receive OAuth user data                                      │
│     ↓                                                            │
│  6. Check if user exists by email                               │
│     ↓                                                            │
│  7. If new: Create user in MongoDB                              │
│     If exists: Update OAuth fields                              │
│     ↓                                                            │
│  8. Generate JWT token (your existing logic)                     │
│     ↓                                                            │
│  9. Return: { token: "eyJhbG...", user: {...} }                 │
│     ↓                                                            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  10. NextAuth stores YOUR backend JWT token in session          │
│      ↓                                                           │
│  11. All API requests include: Authorization: Bearer <token>    │
│      ↓                                                           │
│  12. YOUR backend validates token (existing middleware)          │
│      ↓                                                           │
│  13. User authenticated! ✅                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Step 1: Frontend - Install NextAuth**

```bash
# In your Next.js/React project
npm install next-auth
```

---

### **Step 2: Frontend - Configure NextAuth**

**Create:** `app/api/auth/[...nextauth]/route.ts` (App Router)

or

**Create:** `pages/api/auth/[...nextauth].ts` (Pages Router)

```typescript
import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // Traditional email/password (optional - uses your backend)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Call your existing backend login endpoint
        const res = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          return {
            id: data.data.user.id,
            email: data.data.user.email,
            name: data.data.user.name,
            role: data.data.user.role,
            backendToken: data.data.token, // YOUR backend JWT
          };
        }

        return null;
      },
    }),
  ],

  callbacks: {
    // After OAuth sign-in, sync with YOUR backend
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          // Send OAuth user data to YOUR backend
          const res = await fetch("http://localhost:5000/api/auth/oauth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: account.provider,
              providerId: account.providerAccountId,
            }),
          });

          const data = await res.json();

          if (res.ok && data.success) {
            // Store YOUR backend token in user object
            user.backendToken = data.data.token;
            user.role = data.data.user.role;
            return true;
          }

          return false;
        } catch (error) {
          console.error("Backend sync error:", error);
          return false;
        }
      }

      return true;
    },

    // Add backend token to JWT
    async jwt({ token, user }) {
      if (user) {
        token.backendToken = (user as any).backendToken;
        token.role = (user as any).role;
      }
      return token;
    },

    // Add backend token to session
    async session({ session, token }) {
      (session as any).backendToken = token.backendToken;
      (session as any).role = token.role;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

### **Step 3: Frontend - Environment Variables**

**Create:** `.env.local`

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-generate-this

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc...xyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc...xyz

# GitHub OAuth
GITHUB_CLIENT_ID=Iv1.abc123...
GITHUB_CLIENT_SECRET=ghp_abc123...

# Your Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

---

### **Step 4: Backend - Create OAuth Sync Endpoint**

**Create:** `src/app/modules/auth/oauth-sync.controller.ts`

```typescript
import { Request, Response } from "express";
import { User } from "../user/user.model";
import jwt from "jsonwebtoken";
import config from "../../config/index";

// Create JWT token (your existing function)
const createToken = (userId: string, email: string, role: string): string => {
  if (!config.jwt_secret) {
    throw new Error("JWT secret is missing!");
  }

  return jwt.sign({ userId, email, role }, config.jwt_secret, {
    expiresIn: config.jwt_expires_in || "7d",
  });
};

/**
 * OAuth Sync Endpoint
 * Called by NextAuth after successful OAuth login
 * Creates/updates user and returns JWT token
 */
export const oauthSyncController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, image, provider, providerId } = req.body;

    // Validate required fields
    if (!email || !provider) {
      res.status(400).json({
        success: false,
        message: "Email and provider are required",
      });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update OAuth fields
      const updateFields: any = {};

      if (provider === "google" && !user.googleId) {
        updateFields.googleId = providerId;
        updateFields.authProvider = "google";
      } else if (provider === "github" && !user.githubId) {
        updateFields.githubId = providerId;
        updateFields.authProvider = "github";
      }

      if (image && !user.profileImage) {
        updateFields.profileImage = image;
      }

      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(
          user._id,
          { $set: updateFields },
          { new: true },
        );
      }
    } else {
      // Create new user
      const newUserData: any = {
        name,
        email,
        authProvider: provider,
        role: "customer",
        isActive: true,
        profileImage: image,
      };

      if (provider === "google") {
        newUserData.googleId = providerId;
      } else if (provider === "github") {
        newUserData.githubId = providerId;
      }

      user = await User.create(newUserData);
    }

    // Generate JWT token
    const token = createToken(user._id as string, user.email, user.role);

    // Set httpOnly cookie (optional - for extra security)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return token and user data
    res.status(200).json({
      success: true,
      message: "OAuth sync successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error) {
    console.error("OAuth sync error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync OAuth user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
```

---

### **Step 5: Backend - Add OAuth Route**

**Update:** `src/app/modules/auth/auth.routes.ts`

```typescript
import { Router } from "express";
import {
  loginUserController,
  registerUserController,
  logoutUserController,
} from "./auth.controller";
import { oauthSyncController } from "./oauth-sync.controller";

const router = Router();

// Existing routes
router.post("/register", registerUserController);
router.post("/login", loginUserController);
router.post("/logout", logoutUserController);

// OAuth sync endpoint (called by NextAuth)
router.post("/oauth", oauthSyncController);

export default router;
```

---

### **Step 6: Backend - Update User Model**

**Already done if you followed the previous guide!**

If not, add these fields to User schema:

```typescript
// OAuth fields
googleId: {
  type: String,
  sparse: true,
  index: true,
},
githubId: {
  type: String,
  sparse: true,
  index: true,
},
authProvider: {
  type: String,
  enum: ["local", "google", "github"],
  default: "local",
},
```

And make password optional for OAuth users:

```typescript
password: {
  type: String,
  required: function() {
    return this.authProvider === "local";
  },
  minlength: [6, "Password must be at least 6 characters"],
  select: false,
},
```

---

### **Step 7: Frontend - Create Login Page**

```typescript
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Traditional email/password login
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.ok) {
      window.location.href = "/dashboard";
    } else {
      alert("Login failed");
    }
  };

  // Google OAuth login
  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  // GitHub OAuth login
  const handleGitHubLogin = () => {
    signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="login-container">
      <h1>Login</h1>

      {/* Email/Password Form */}
      <form onSubmit={handleCredentialsLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <div className="divider">OR</div>

      {/* Social Login Buttons */}
      <div className="social-login">
        <button onClick={handleGoogleLogin} className="google-btn">
          <GoogleIcon /> Login with Google
        </button>

        <button onClick={handleGitHubLogin} className="github-btn">
          <GitHubIcon /> Login with GitHub
        </button>
      </div>
    </div>
  );
}
```

---

### **Step 8: Frontend - Use Backend Token in API Calls**

**Create:** `lib/api.ts` (API client)

```typescript
import { getSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
) {
  // Get NextAuth session (contains YOUR backend token)
  const session = await getSession();
  const backendToken = (session as any)?.backendToken;

  // Add Authorization header with YOUR backend token
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (backendToken) {
    headers["Authorization"] = `Bearer ${backendToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Send cookies
  });

  return response;
}

// Example usage:
export async function getMyPurchases() {
  const response = await fetchWithAuth("/purchases/my-purchases");
  return response.json();
}

export async function createPayment(data: any) {
  const response = await fetchWithAuth("/payments/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

### **Step 9: Frontend - Protected Pages**

```typescript
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name}!</p>
      <p>Role: {(session as any).role}</p>

      {/* YOUR backend token is available: */}
      {/* (session as any).backendToken */}
    </div>
  );
}
```

---

## 🎯 Why This Approach is Better

### **Advantages:**

| Feature                     | Your Approach                           | Pure Passport.js                     |
| --------------------------- | --------------------------------------- | ------------------------------------ |
| **Frontend Complexity**     | ✅ Simple (NextAuth handles everything) | ❌ Complex (manual redirects)        |
| **Backend Changes**         | ✅ Minimal (one endpoint)               | ❌ Heavy (passport, session, routes) |
| **OAuth Providers**         | ✅ 50+ providers supported              | ⚠️ Need to install each              |
| **Frontend Dev Experience** | ✅ Excellent (built-in hooks)           | ❌ Manual state management           |
| **Your JWT System**         | ✅ Unchanged                            | ✅ Unchanged                         |
| **Maintenance**             | ✅ Easy                                 | ⚠️ More code to maintain             |
| **Security**                | ✅ Battle-tested (NextAuth)             | ✅ Battle-tested (Passport)          |

---

## 🔒 Security Benefits

### **1. Double Token System:**

- NextAuth session token (frontend only)
- YOUR backend JWT (for API calls)

### **2. HttpOnly Cookies:**

```typescript
res.cookie("token", token, {
  httpOnly: true, // Cannot be accessed by JavaScript
  secure: true, // HTTPS only in production
  sameSite: "none", // CSRF protection
});
```

### **3. Token Validation:**

Your existing backend middleware validates the JWT:

```typescript
// Your existing auth middleware still works!
router.get("/purchases/my-purchases", authenticate, getPurchasesController);
```

---

## 📊 Complete Flow Example

### **User Clicks "Login with Google":**

```
1. Frontend: signIn("google")
   ↓
2. NextAuth redirects to Google
   ↓
3. User signs in with Google
   ↓
4. Google redirects back to NextAuth callback
   ↓
5. NextAuth callback sends to YOUR backend:
   POST http://localhost:5000/api/auth/oauth
   {
     "name": "John Doe",
     "email": "john@gmail.com",
     "image": "https://...",
     "provider": "google",
     "providerId": "1234567890"
   }
   ↓
6. YOUR backend:
   - Finds/creates user in MongoDB
   - Generates JWT token
   - Returns: { token: "eyJhbG...", user: {...} }
   ↓
7. NextAuth stores token in session:
   session.backendToken = "eyJhbG..."
   ↓
8. Frontend makes API calls:
   fetch("/api/purchases/my-purchases", {
     headers: {
       Authorization: "Bearer eyJhbG..."
     }
   })
   ↓
9. YOUR backend validates JWT with existing middleware
   ↓
10. User authenticated! ✅
```

---

## ✅ Implementation Checklist

### **Frontend (Next.js):**

- [ ] Install NextAuth: `npm install next-auth`
- [ ] Create `[...nextauth]/route.ts`
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Add signIn callback to sync with backend
- [ ] Store backend token in session
- [ ] Create login page with OAuth buttons
- [ ] Create API client that uses backend token
- [ ] Protect routes with `useSession()`

### **Backend (Express):**

- [ ] Create `/api/auth/oauth` endpoint
- [ ] Implement `oauthSyncController`
- [ ] Update User model (if not done)
- [ ] Return JWT token on OAuth sync
- [ ] Test endpoint with Postman

### **OAuth Setup:**

- [ ] Get Google OAuth credentials
- [ ] Get GitHub OAuth credentials
- [ ] Add to `.env.local` (frontend)
- [ ] Configure redirect URIs

### **Testing:**

- [ ] Test Google login flow
- [ ] Test GitHub login flow
- [ ] Test token in API calls
- [ ] Test role-based access
- [ ] Test existing email/password login still works

---

## 🧪 Testing

### **Test OAuth Sync Endpoint (Postman):**

```http
POST http://localhost:5000/api/auth/oauth
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@gmail.com",
  "image": "https://lh3.googleusercontent.com/a/...",
  "provider": "google",
  "providerId": "1234567890"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "OAuth sync successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "673...",
      "name": "John Doe",
      "email": "john@gmail.com",
      "role": "customer",
      "profileImage": "https://..."
    }
  }
}
```

---

## 🎉 Summary

### **What You Get:**

✅ **NextAuth handles OAuth** (Google, GitHub, etc.)  
✅ **Your backend stays simple** (just one new endpoint)  
✅ **Your JWT system unchanged** (all existing routes work)  
✅ **Better DX** (NextAuth hooks, session management)  
✅ **Same security** (your backend validates all requests)  
✅ **Easy to add more providers** (NextAuth supports 50+)

### **Flow:**

```
NextAuth (OAuth) → YOUR Backend (JWT) → YOUR APIs (Validate JWT)
```

### **No Need to:**

❌ Install Passport.js  
❌ Configure OAuth routes in Express  
❌ Handle OAuth callbacks in backend  
❌ Manage sessions in Express

**Your backend stays focused on what it does best: API logic and JWT validation!** 🚀

---

## 📚 Additional Resources

- **NextAuth Docs:** https://next-auth.js.org/
- **OAuth Providers:** https://next-auth.js.org/providers/
- **JWT Callbacks:** https://next-auth.js.org/configuration/callbacks

**This is the modern, recommended approach!** ✨
