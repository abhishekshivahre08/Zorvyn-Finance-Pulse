# 💰 Finance Dashboard Backend

A production-ready backend for a Finance Dashboard system built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. Implements role-based access control, financial record management, dashboard analytics, input validation, error handling, rate limiting, and soft delete.

---

## 🌐 Live Access & Demo

> ⚠️ **Important Note for Reviewers:** > The backend is hosted on a free instance of **Render**. If the initial request takes **30-60 seconds** to load, please be patient—the server is "spinning up" from sleep mode. Once awake, it will be fast!

| Type | Link | Description |
| :--- | :--- | :--- |
| **🚀 Live Demo (Full UI)** | [👉 Click Here to Open UI](https://your-frontend-vercel-link.vercel.app) | Full Frontend + Backend Integration |
| **📡 API Base (JSON Data)** | [🔗 View Backend API](https://finances-dashboard.onrender.com) | Direct JSON response for testing endpoints |
| **📑 API Documentation** | [📖 View Specs](#-api-reference) | Detailed endpoint documentation below |

### 🔑 Quick Test Credentials
You can use these pre-seeded accounts to explore the dashboard immediately:

* **Role: Admin** (Full Access)  
    * **Email:** `admin@finance.com`  
    * **Password:** `admin123`
* **Role: Viewer** (Read-only)  
    * **Email:** `viewer@finance.com`  
    * **Password:** `viewer123`

---


## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Validation | Joi |
| Password Hashing | bcryptjs |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Morgan |

---

## 📁 Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Register, Login, Profile
│   │   ├── userController.js    # User CRUD (Admin only)
│   │   ├── transactionController.js  # Financial records CRUD
│   │   └── dashboardController.js    # Analytics & summary APIs
│   ├── middleware/
│   │   ├── auth.js              # JWT protect + role restrict
│   │   ├── errorHandler.js      # Global error handler
│   │   └── rateLimiter.js       # Rate limiting
│   ├── models/
│   │   ├── User.js              # User schema (role, status)
│   │   └── Transaction.js       # Financial record schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── transactionRoutes.js
│   │   └── dashboardRoutes.js
│   ├── validators/
│   │   └── schemas.js           # Joi validation schemas
│   ├── utils/
│   │   └── helpers.js           # AppError, asyncHandler, sendSuccess
│   ├── seeds/
│   │   └── seeder.js            # Sample data seeder
│   └── server.js                # App entry point
├── .env
├── .gitignore
└── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB running locally OR MongoDB Atlas URI

### Steps

```bash
# 1. Clone / download the project
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Create environment file
cd .env
# Edit .env and set your MONGODB_URI and JWT_SECRET

# 4. Seed sample data (optional but recommended)
npm run seed

# 5. Start development server
npm run dev

# 6. Server runs at:
#    http://localhost:5000
#    API docs: http://localhost:5000/api
#    Health: http://localhost:5000/health
```
## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```



---

## 👤 Roles & Permissions

| Action | Viewer | Analyst | Admin |
|--------|--------|---------|-------|
| Login / View Profile | ✅ | ✅ | ✅ |
| View Transactions | ✅ | ✅ | ✅ |
| View Dashboard Summary | ❌ | ✅ | ✅ |
| View Trends & Analytics | ❌ | ✅ | ✅ |
| Create Transactions | ❌ | ❌ | ✅ |
| Update Transactions | ❌ | ❌ | ✅ |
| Delete Transactions | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |

---

## 🔑 Test Credentials (after seeding)

```
Admin   → admin@finance.com    / admin123
Analyst → analyst@finance.com  / analyst123
Viewer  → viewer@finance.com   / viewer123
```

---

## 📡 API Reference

### Auth

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT token |
| GET | `/api/auth/me` | Protected | Get my profile |
| PATCH | `/api/auth/update-password` | Protected | Change password |

**Login Request:**
```json
POST /api/auth/login
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "success": true,
  "message": "Login successful. Welcome back!",
  "data": {
    "user": { "_id": "...", "name": "Super Admin", "role": "admin" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

> **Use the token** in all subsequent requests:
> `Authorization: Bearer <token>`

---

### Users (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (paginated, filterable) |
| GET | `/api/users/stats` | Get user count by role/status |
| POST | `/api/users` | Create a new user |
| GET | `/api/users/:id` | Get single user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Deactivate user (soft) |

**Query Params for GET /api/users:**
```
?role=admin&status=active&search=ravi&page=1&limit=10
```

---

### Transactions

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/transactions` | All roles | List transactions |
| GET | `/api/transactions/:id` | All roles | Get single transaction |
| POST | `/api/transactions` | Admin | Create transaction |
| PATCH | `/api/transactions/:id` | Admin | Update transaction |
| DELETE | `/api/transactions/:id` | Admin | Soft delete |
| PATCH | `/api/transactions/:id/restore` | Admin | Restore deleted |

**Query Params for GET /api/transactions:**
```
?type=income
?type=expense&category=food
?startDate=2024-01-01&endDate=2024-12-31
?search=salary
?page=2&limit=20
?sortBy=amount&sortOrder=desc
```

**Valid Categories:**

Income: `salary`, `freelance`, `investment`, `business`, `rental`, `other_income`

Expense: `food`, `housing`, `transport`, `utilities`, `healthcare`, `education`, `entertainment`, `shopping`, `travel`, `other_expense`

**Create Transaction Request:**
```json
POST /api/transactions
Authorization: Bearer <admin_token>
{
  "title": "Monthly Salary",
  "amount": 85000,
  "type": "income",
  "category": "salary",
  "date": "2024-04-01",
  "notes": "April salary credited"
}
```

---

### Dashboard (Analyst + Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Full summary with totals, categories, recent activity |
| GET | `/api/dashboard/trends` | Monthly/weekly income vs expense trends |
| GET | `/api/dashboard/categories` | Category-wise breakdown with percentages |
| GET | `/api/dashboard/balance` | Net balance, savings rate |

**Query Params:**
```
GET /api/dashboard/summary?period=month     # week | month | quarter | year
GET /api/dashboard/trends?groupBy=month&months=6
GET /api/dashboard/categories?type=expense&startDate=2024-01-01
```

**Summary Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "allTime": {
        "totalIncome": 450000,
        "totalExpense": 280000,
        "netBalance": 170000,
        "totalTransactions": 124
      },
      "period": {
        "label": "month",
        "income": { "total": 85000, "count": 3, "average": 28333 },
        "expense": { "total": 42000, "count": 15, "average": 2800 },
        "netBalance": 43000,
        "savingsRate": "50.6"
      }
    },
    "categoryBreakdown": {
      "income": [{ "category": "salary", "total": 85000, "percentage": "100.0" }],
      "expense": [{ "category": "housing", "total": 22000, "percentage": "52.4" }]
    },
    "recentActivity": [...]
  }
}
```

---

## 🛡️ Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Descriptive error message here"
}
```

Validation errors include field-level details:

```json
{
  "success": false,
  "message": "Validation failed. Please check the provided data.",
  "errors": [
    { "field": "amount", "message": "Amount must be greater than 0" },
    { "field": "type", "message": "Type must be income or expense" }
  ]
}
```

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (no token / invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 🔒 Security Features

- **JWT Authentication** — stateless token-based auth, 7-day expiry
- **bcrypt Password Hashing** — 12 salt rounds
- **Role-Based Access Control** — middleware enforces permissions per route
- **Rate Limiting** — 100 req/15min general, 10 req/15min for auth routes
- **Helmet** — sets secure HTTP headers
- **CORS** — configurable origin whitelist
- **Input Validation** — Joi schemas strip unknown fields and sanitize input
- **Body Size Limit** — 10kb maximum request body

---

## ✨ Additional Features

- **Soft Delete** — transactions are flagged `isDeleted: true`, never truly removed; restorable by admin
- **Pagination** — all list endpoints support `page` & `limit`
- **Search** — full-text search on title and notes
- **Filters** — filter by type, category, date range
- **Sorting** — sort by date, amount, or createdAt in asc/desc order
- **Mongoose Indexes** — indexed on type, category, date, createdBy for fast queries
- **asyncHandler** — eliminates boilerplate try-catch in every controller
- **Graceful Shutdown** — handles SIGTERM, unhandledRejection, uncaughtException

---

## 💡 Assumptions Made

1. **Admin creates transactions** — only admins can add/edit/delete financial records; viewers and analysts are read-only consumers of the data.
2. **Date cannot be future** — financial entries are historical records; future-dated entries are rejected.
3. **Soft delete default** — transactions are never hard-deleted to preserve audit history. Deletion sets `isDeleted: true`.
4. **User deactivation = soft delete** — deleting a user deactivates them (sets status to `inactive`) rather than removing them, preserving their transaction history.
5. **Amount must be positive** — negative amounts are not allowed; `type` field (income/expense) determines the direction.
6. **Dashboard needs Analyst+ role** — viewers see raw transactions but not aggregated analytics, as per typical finance app access patterns.
7. **In-memory seeding** — the seeder script populates realistic 6-month data for testing purposes.

---

## 🔄 Future Enhancements

- Email verification on registration
- Refresh tokens
- WebSocket for real-time balance updates
- Export to CSV/PDF
- Multi-currency support
- Budget limits with alerts
- Unit & integration tests (Jest + Supertest)
- Swagger/OpenAPI documentation
- Docker + docker-compose setup
