# AutoAuth AI - Quick Start Guide

## 🚀 Get Started in 3 Simple Steps

### Step 1: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Initialize Database
```bash
python init_db.py
```
This creates the database tables and a default admin account.

### Step 3: Start the Applications

**Terminal 1 - Backend:**
```bash
python main.py
```
Backend runs on http://localhost:8000

**Terminal 2 - Frontend:**
```bash
cd ..
npm run dev
```
Frontend runs on http://localhost:5173

---

## 🎮 Using the Application

### Default Credentials
- **Email:** admin@autoauth.ai
- **Password:** admin123

### Complete Workflow

1. **Login** at http://localhost:5173
2. **Click "Start Interactive Demo"** → **Login**
3. **Enter credentials** or use "Quick Demo Login"
4. **Doctor Dashboard:**
   - Click "Load Sample Clinical Note"
   - Review pre-filled patient details
   - Click "Run AutoAuth AI"
5. **Wait 10-30 seconds** for Google Gemini AI processing
6. **View Results:**
   - AI confidence score
   - Approval/denial decision
   - Extracted evidence
   - Policy analysis
7. **Admin Dashboard:**
   - View real-time analytics
   - See approval rates
   - Track processing times

---

## ✨ Key Features Implemented

### Frontend
✅ Professional Login/Signup with validation  
✅ Advanced animations and glassmorphism  
✅ Real-time toast notifications  
✅ Drag-and-drop file upload  
✅ Loading skeletons and states  
✅ Modal dialogs  
✅ Progress indicators  
✅ Responsive design  

### Backend
✅ Google Gemini AI integration  
✅ PostgreSQL database (Supabase)  
✅ JWT authentication  
✅ File upload handling  
✅ RESTful API  
✅ Error handling  
✅ CORS protection  

### State Management
✅ Zustand stores  
✅ React Query  
✅ Persistent auth  

---

## 📊 API Endpoints

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/authorizations/` - Create authorization
- `POST /api/authorizations/{id}/upload` - Upload document
- `POST /api/authorizations/{id}/process` - Process with AI
- `GET /api/authorizations/history` - Get history
- `GET /api/analytics/stats` - System stats
- `GET /api/analytics/trends` - Trends data

**Full API Docs:** http://localhost:8000/docs

---

## 🐛 Troubleshooting

**Backend won't start:**
```bash
pip install --upgrade -r backend/requirements.txt
```

**Frontend errors:**
```bash
npm install
```

**Database errors:**
- Verify `backend/.env` has correct DATABASE_URL
- Check Supabase connection

**AI errors:**
- Verify GOOGLE_AI_API_KEY in `backend/.env`
- Check API quota

---

## 🎉 You're Ready!

Your production-ready AI healthcare authorization system is now fully functional with real AI processing, database persistence, and professional UI!
