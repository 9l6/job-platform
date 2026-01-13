# Quick Start (Windows / macOS / Linux)

## 1) Install dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd ../frontend
npm install
```

## 2) Environment variables

Create `backend/.env` (do NOT commit secrets). Minimum:

```ini
PORT=5000
MONGO_URI=YOUR_MONGO_URI
JWT_SECRET=YOUR_SECRET
FRONTEND_URL=http://localhost:5173

# Email (required for verification + confirmations)
EMAIL_SERVICE=gmail
EMAIL_USER=YOUR_EMAIL
EMAIL_PASS=YOUR_APP_PASSWORD
```

## 3) Run

### Backend
```bash
cd backend
npm run dev
```

If you get **EADDRINUSE: 5000** (server started twice):
```bash
cd backend
npm run kill:5000
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## 4) The new flow (strict)

1) Register / Login
2) Go to **Profile** → fill info + upload CV
3) Tick privacy checkbox → **Submit profile & unlock jobs**
4) Check your email and verify
5) Now you can browse jobs at `/browse-jobs` and open details `/jobs/:slug`

Notes:
- Jobs & companies are not accessible until onboarding is complete.
- After profile submission we email:
  - confirmation that your data was saved
  - a list of matched jobs (top 10)
