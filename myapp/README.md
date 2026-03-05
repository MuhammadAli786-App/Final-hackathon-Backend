# 🏥 AI Clinic Management SaaS – Backend

A modern, AI-powered clinic management system built with **Node.js + Express + MongoDB + Cloudinary**.

## ✅ Features Implemented

### 1. **Authentication & Authorization**
- JWT-based login/signup with email verification (OTP)
- Role-based access control (admin, doctor, receptionist, patient)
- Password reset and change endpoints
- Secure token expiry (24 hours)

**Endpoints:**
```bash
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/verify-otp
POST   /api/auth/reset-otp
POST   /api/auth/forgot-password
POST   /api/auth/change-password
```

### 2. **Patient Management (CRUD)**
- Add, view, update, delete patient records
- Doctors can also create/edit/delete patient profiles for their own workflow
- Patients now have `isActive` status so admins can deactivate/reactivate without deleting
- Medical history timeline support
- Document storage (Cloudinary integration)

**Endpoints:**
```bash
POST   /api/patients            # Create (admin/receptionist/doctor)
GET    /api/patients            # List all (admin/doctor/receptionist)
GET    /api/patients/:id        # View one (roles + patient)
PUT    /api/patients/:id        # Update (admin/receptionist/doctor)
DELETE /api/patients/:id        # Delete (admin/doctor)
```

### 3. **Appointment Booking & Workflow**
- Book appointments (receptionist/admin/doctor)
- Doctors may schedule, reschedule or cancel appointments for their patients
- View appointments (role-based filtering, doctors see only their own)
- Update appointment status (pending → confirmed → completed → cancelled)
- Date validation

**Endpoints:**
```bash
POST   /api/appointments                   # Create (admin/receptionist/doctor/patient)
GET    /api/appointments?patientId=xxx     # List (role filters apply; doctor may add doctorId param)
PUT    /api/appointments/:id               # Update details (admin/receptionist/doctor)
PUT    /api/appointments/:id/status        # Change status (admin/receptionist/doctor)
DELETE /api/appointments/:id               # Delete/cancel (admin/receptionist/doctor)
```

### 4. **Prescription Management**
- **Doctors only** may create, edit, or delete prescriptions (admin/receptionist/patient blocked)
- Generate PDF (pdfkit)
- Download prescriptions (accessible to doctor, admin, or patient owner)
- AI-powered patient-friendly explanations (doctor-only)
- Attach documents to prescriptions

**Endpoints:**
```bash
POST   /api/prescriptions                  # Doctor only
PUT    /api/prescriptions/:id              # Update prescription (doctor)
DELETE /api/prescriptions/:id              # Delete prescription (doctor)
GET    /api/prescriptions/:id/pdf          # Doctor/admin/patient
POST   /api/prescriptions/:id/explain      # Doctor only
```

### 5. **AI Symptom Checker** ⚡
- Post symptoms, age, gender → AI analyzes and returns potential conditions
- Risk flagging (low/medium/high)
- Suggested medical tests
- **Graceful fallback** if AI service is unavailable (keyword-based heuristics)
- Saves analysis logs for patient history
- Doctors may also **manually create, update, or delete diagnosis log entries** (e.g. notes, history updates)

**Endpoints:**
```bash
POST   /api/diagnosis/check            # Run symptom checker
POST   /api/diagnosis/log              # Doctor creates manual log
GET    /api/diagnosis/patient/:id      # View patient logs
GET    /api/diagnosis/:id              # View single log
PUT    /api/diagnosis/:id              # Update log (doctor)
DELETE /api/diagnosis/:id              # Delete log (doctor)
```

### 6. **AI Prescription Explanation** 🎯
- Generates patient-friendly explanation of medicines
- Lifestyle recommendations
- Simple language for non-medical users
- **Fallback mechanism** for graceful degradation

**Endpoints:**
```bash
POST   /api/prescriptions/:id/explain  # Generate explanation + save
```

### 7. **Analytics Dashboard**
- Admin stats: total patients, total doctors, monthly appointments, revenue simulation, most common diagnosis
- Doctor stats: daily appointments, monthly appointments, total prescriptions written

**Endpoints:**
```bash
GET    /api/analytics/admin    # Admin dashboard (admin only)
GET    /api/analytics/doctor   # Doctor dashboard (doctor only)
```

### 8. **File Uploads (Cloudinary)**
- Upload patient documents (medical records, lab reports, etc.)
- Attach files to prescriptions
- Automatic folder organization
- Delete files (admin only)

**Endpoints:**
```bash
POST   /api/uploads/patient-document       # Upload patient doc
POST   /api/uploads/prescription-attachment # Upload prescription file
DELETE /api/uploads/file                   # Delete file (admin)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or cloud)
- Cloudinary account (free tier: https://cloudinary.com)
- OpenAI API key (optional; system has keyword fallback)

### Installation
```bash
npm install
```

### Environment Setup
Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/ClinicApp
JWT_SECRET=your_secret_key

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_API_SECRET=your_api_secret

# AI (optional)
AI_API_KEY=sk-proj-xxxxx
AI_MODEL=gpt-3.5-turbo

# Email
EMAIL=your_email@gmail.com
APP_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Running the Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## 🧪 Quick Test Commands

### 1. Seed Admin User
```bash
npm run seed
# Creates: admin@clinic.com / Admin@123
```

### 2. Login & Get Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinic.com","password":"Admin@123"}'
```

### 3. Create a Patient
```bash
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"John Doe","age":35,"gender":"male","contact":"03001234567"}'
```

### 4. Run AI Symptom Check
```bash
curl -X POST http://localhost:5000/api/diagnosis/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symptoms":"fever and cough","age":45,"gender":"male"}'
```

### 5. Upload Patient Document
```bash
curl -X POST http://localhost:5000/api/uploads/patient-document \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "patientId=PATIENT_ID"
```

---

## 📊 API Response Examples

### Auth Login
```json
{
  "message": "Login successful",
  "status": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Diagnosis Check
```json
{
  "message": "Analysis complete",
  "logId": "69a36859...",
  "result": {
    "conditions": ["Respiratory infection (possible)"],
    "risk": "low",
    "suggestedTests": ["CBC", "Chest X-ray"],
    "explanation": "..."
  }
}
```

### Admin Analytics
```json
{
  "totalPatients": 45,
  "totalDoctors": 5,
  "monthlyAppointments": [{ "_id": {...}, "count": 120 }],
  "revenue": 12000,
  "mostCommon": "Respiratory infection"
}
```

---

## 🔐 Role-Based Access Control

| Endpoint | Admin | Doctor | Receptionist | Patient |
|----------|-------|--------|--------------|---------|
| Create Patient | ✅ | ✅ | ✅ | ❌ |
| Create Appointment | ✅ | ❌ | ✅ | ❌ |
| Create Prescription | ✅ | ✅ | ❌ | ❌ |
| AI Symptom Check | ✅ | ✅ | ❌ | ❌ |
| View Analytics | ✅ | ✅ | ❌ | ❌ |
| Upload Files | ✅ | ✅ | ✅ | ❌ |

---

## 🤖 AI Features

### Graceful Fallback Architecture
- **AI Available**: Calls OpenAI GPT-3.5-turbo for smart analysis
- **AI Unavailable**: Falls back to deterministic keyword-based heuristics
- **No User Disruption**: System continues to function seamlessly

### Symptom Checker Fallback Logic
```javascript
// If AI fails, system uses keywords to detect:
- Respiratory patterns (fever, cough, breath)
- Cardiac alerts (chest pain → HIGH risk)
- Neurological patterns (sudden headache)
- Suggests appropriate tests
```

---

## 📁 Project Structure
```
backend/
├── config/          # DB & Cloudinary config
├── controller/      # Business logic
├── middleware/      # Auth, multer, role checks
├── models/          # MongoDB schemas
├── routes/          # API endpoints
├── services/        # Email service
├── cron/            # Scheduled jobs (OTP cleanup)
├── scripts/         # Seed, test utilities
├── utlis/           # PDF generation
└── app.js           # Main server
```

---

## 🚢 Deployment

Ready for deployment on:
- **Backend:** Render, Railway, Cyclic, AWS
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary (included)

Example for Render:
1. Push to GitHub
2. Connect to Render
3. Set environment variables
4. Deploy

---

## 📝 Next Steps (Frontend & SaaS)

- **React Frontend:** Dashboards for admin, doctor, receptionist, patient
- **Subscription Plans:** Free vs Pro tiers with feature flags
- **Mock Billing:** Stripe/Razorpay integration simulation
- **SMS Reminders:** Twilio integration for appointment reminders
- **Urdu Language:** Multi-language AI explanations

---

## 📞 Support & Issues

For issues or questions:
1. Check `.env` configuration
2. Verify MongoDB connection
3. Test endpoints with curl
4. Check server logs (`npm run dev`)

---

**Built with ❤️ for Hackathon 2026**
