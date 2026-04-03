# Edumerge Admission Management System

A full-stack web application for managing college admissions with quota-based seat allocation and real-time availability tracking.

## 🎯 Project Overview

This system allows colleges to:
- Configure programs and seat quotas (KCET, COMEDK, Management)
- Manage applicant information
- Allocate seats with strict quota enforcement
- Generate unique admission numbers
- Track documents and fee status
- View real-time dashboard statistics

**Core Feature:** Database-level quota enforcement prevents seat overbooking even under concurrent allocation requests.

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (with triggers and transactions)
- pg (PostgreSQL driver)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- React Query (server state management)
- Tailwind CSS (styling)
- Axios (HTTP client)

## 📦 Project Structure

```
edumerge-admission/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── masterController.js     # Institution, Campus, Program, Quota
│   │   │   ├── applicantController.js  # Applicant CRUD
│   │   │   └── admissionController.js  # Seat allocation logic
│   │   ├── middleware/
│   │   │   └── errorHandler.js     # Centralized error handling
│   │   ├── routes/
│   │   │   └── index.js            # API routes
│   │   └── server.js               # Express app entry point
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql                  # Complete database schema with triggers
└── frontend/
    └── src
        └── config/
            └── api.ts             # A file with API Endpoints
        └── pages/
            └── Admission.tsx      # Admission Page Route With Admission Forms
            └── Applicants.tsx     # Applicants Page Route With Applicant Forms
            └── Dashboard.tsx      # Dashboard Page
            └── Masters.tsx        # Master Page With Programs & Quotas Forms
        └── services/
            └── api.ts             # A file with APIs calling with Axios Interceptor
        └── types/
            └── index.ts           # file with tpye interfaces for Programs,Applicants,Dashboard,Masters Pages 
        └── App.css
        └── App.tsx                # Entry File With Routing
        └── package.json
            
        
        


```

##  Setup Instructions

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Git

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd edumerge-admission
```

### 2. Database Setup

```bash
# Create database
createdb edumerge_db

# Run schema (creates tables, triggers, sample data)
psql edumerge_db < database/schema.sql

# Verify setup
psql edumerge_db -c "SELECT * FROM dashboard_stats;"
```

**Expected output:** You should see sample program with KCET/COMEDK/Management quotas.

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env  # or use your preferred editor
```

**Required environment variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=edumerge_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Start backend:**
```bash
npm run dev
```

Server should start on `http://localhost:5000`

**Test backend:**
```bash
curl http://localhost:5000/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should start on `http://localhost:5173`

## 🧪 Testing the System

### Manual Test Flow

1. **Setup Master Data:**
   ```bash
   # Already done by schema.sql sample data
   # Check: http://localhost:5000/api/programs
   ```

2. **Create Applicant:**
   ```bash
   curl -X POST http://localhost:5000/api/applicants \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Test Student",
       "email": "test@example.com",
       "phone": "9876543210",
       "date_of_birth": "2004-01-01",
       "gender": "Male",
       "category": "GM",
       "qualifying_exam": "KCET",
       "marks_obtained": 90.5,
       "entry_type": "Regular",
       "quota_type": "KCET",
       "admission_mode": "Government"
     }'
   ```

3. **Allocate Seat:**
   ```bash
   curl -X POST http://localhost:5000/api/admissions/allocate \
     -H "Content-Type: application/json" \
     -d '{
       "applicant_id": 1,
       "program_id": 1,
       "quota_id": 1
     }'
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Seat allocated successfully",
     "admission": {
       "id": 1,
       "admission_number": "INST/2026/UG/CSE/KCET/0001",
       "status": "Provisional"
     }
   }
   ```

4. **Check Dashboard:**
   ```bash
   curl http://localhost:5000/api/dashboard/stats
   ```

5. **Test Quota Full Scenario:**
   - Allocate seats until KCET quota (50 seats) is full
   - Next allocation should fail with error:
   ```json
   {
     "success": false,
     "error": "Quota full - no seats available in selected quota",
     "code": "QUOTA_FULL"
   }
   ```

## 📊 Key Features Implementation

### 1. Quota Enforcement (Database-Level)

**Problem:** Prevent race conditions when multiple users allocate the last seat simultaneously.

**Solution:** PostgreSQL trigger validates availability BEFORE insert:

```sql
CREATE TRIGGER increment_seat_counter
BEFORE INSERT ON admissions
FOR EACH ROW EXECUTE FUNCTION update_seat_counter();
```

**How it works:**
1. User clicks "Allocate Seat"
2. Backend starts transaction (`BEGIN`)
3. Trigger checks: `seats_filled < allocated_seats`
4. If quota full → `RAISE EXCEPTION` (rollback transaction)
5. If available → Increment counter + Insert admission
6. Transaction commits (`COMMIT`)

**Concurrency Guarantee:** Even with 100 simultaneous requests, only 1 succeeds for the last seat.

### 2. Admission Number Generation

**Format:** `INST/2026/UG/CSE/KCET/0001`

**Implementation:**
- Uses PostgreSQL sequence for uniqueness
- Generated by database function (not application code)
- Immutable once created

### 3. Dashboard Statistics

**Views:** Pre-computed views for performance:
```sql
CREATE VIEW dashboard_stats AS
SELECT quota_type, allocated_seats, seats_filled, remaining_seats...
```

Benefits:
- No complex joins in application code
- Easy to add new statistics
- Cached by PostgreSQL query planner

## 🔍 API Documentation

### Master Data APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/institutions` | POST | Create institution |
| `/api/institutions` | GET | List institutions |
| `/api/campuses` | POST | Create campus |
| `/api/campuses?institution_id=1` | GET | List campuses |
| `/api/departments` | POST | Create department |
| `/api/departments?campus_id=1` | GET | List departments |
| `/api/programs` | POST | Create program |
| `/api/programs?department_id=1` | GET | List programs |
| `/api/quotas` | POST | Create quota |
| `/api/quotas?program_id=1` | GET | List quotas with availability |

### Applicant APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/applicants` | POST | Create applicant |
| `/api/applicants` | GET | List applicants (with filters) |
| `/api/applicants/:id` | GET | Get applicant details |
| `/api/applicants/:id` | PUT | Update applicant |

### Admission APIs (Core)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admissions/allocate` | POST | **Allocate seat (critical)** |
| `/api/admissions` | GET | List admissions |
| `/api/admissions/:id/confirm` | PUT | Confirm admission (fee/doc status) |
| `/api/admissions/:id` | DELETE | Cancel admission (releases seat) |

### Dashboard APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard/stats` | GET | Get statistics (quota-wise, pending docs/fees) |

## 🎨 Frontend Components 

1. **Master Setup Page:**
   - Hierarchical forms (Institution → Campus → Department → Program)
   - Quota allocation form with validation

2. **Applicant Management:**
   - Applicant form (max 15 fields as per requirement)
   - Search and filter applicants

3. **Seat Allocation:**
   - Real-time seat availability display
   - Government vs Management flow
   - Error handling (quota full alerts)

4. **Dashboard:**
   - Stats cards (total/filled/remaining seats)
   - Progress bars for each quota
   - Pending documents/fees lists

## 🛡️ Security Considerations

1. **SQL Injection Prevention:** Using parameterized queries (`$1, $2`)
2. **Error Handling:** Sensitive details hidden in production
3. **CORS:** Restricted to frontend URL only
4. **Helmet.js:** Security headers (XSS protection, etc.)


## 📝 AI Assistance Disclosure

**Tools Used:** Claude AI (Anthropic)

**AI-Assisted Parts:**
- Database schema generation (reviewed and modified triggers)
- Boilerplate Express route setup
- Error handling middleware structure
- SQL function for admission number generation

**Human-Written Parts:**
- Architecture decisions (PostgreSQL vs MongoDB)
- Core business logic (quota validation strategy)
- Transaction flow design
- API endpoint design
- This README documentation

**Approach:** Used AI for scaffolding and boilerplate, then customized all logic to meet assignment requirements. Can explain every line of code in interview.


## 🚀 Deployment

### Backend (Render/Railway)

1. Create PostgreSQL database on Render
2. Run `schema.sql` on production database
3. Deploy backend with environment variables
4. Test with: `curl https://your-backend.onrender.com/health`

### Frontend (Vercel/Netlify)

1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com`

## 📚 Resources

- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Query Docs](https://tanstack.com/query/latest)

## 👤 Author

**Akhil Munnuru**
- Email: munnuruakhil26@gmail.com
- GitHub: https://github.com/akhilmunnuru26/
- LinkedIn: https://www.linkedin.com/in/akhil-munnuru/

## 📄 License

MIT License - Feel free to use for learning purposes.

---

**Note:** This system is designed as a minimal viable product for demonstration purposes. Production deployment would require additional features: authentication, audit logging, data backup, monitoring, etc.
