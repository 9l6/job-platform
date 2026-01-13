# Job Platform (MERN) — Employer Jobs + CV Parsing + OTP Verification

A MERN job platform:
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite

Key features:
- **Employer job posting** with structured sections (description, responsibilities, requirements, preferred, skills, salary, benefits, etc.).
- **Public job details** page for published employer jobs: `/company-jobs/:slug`.
- **Jobseeker CV upload** (PDF/DOCX) with backend text extraction for accurate matching.
- **Email verification:** **OTP only** (no verification links).

---

## Prerequisites
- Node.js 18+ (recommended)
- MongoDB (local) **or** MongoDB Atlas (recommended)

---

## Quick start (local)

### 1) Backend
```bash
cd backend
npm install
```

Create env:
- Windows (CMD): `copy .env.example .env`
- PowerShell: `Copy-Item .env.example .env`
- Mac/Linux: `cp .env.example .env`

Edit `backend/.env` and set at least:
- `MONGO_URI`
- `JWT_SECRET`
- Email SMTP/Gmail App Password fields (see `.env.example`)

Run:
```bash
npm run dev
```

### 2) Frontend
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
- Windows (CMD): `copy .env.example .env`

Then run:
```bash
npm run dev
```

Open:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

---

## Environment variables

### Backend (`backend/.env`)
Use `backend/.env.example` as a template.

### Frontend (`frontend/.env`)
Use `frontend/.env.example`:
- `VITE_API_URL` should point to your backend (local: `http://localhost:5000`).

---

## Employer job posting
Employers can:
- Create jobs as **draft**
- Publish jobs
- Edit/close their jobs

Public jobs endpoint returns **published only**.

---

## CV upload + parsing
- Supported formats: **PDF** and **DOCX**
- Extracted text is stored to enable better matching.

Note: parsing quality depends on the CV file content (scanned images inside PDF need OCR, which is not enabled by default).

---

## Deploy notes (free demo)
If you want a free demo deployment:
- Database: MongoDB Atlas (free tier)
- Backend: Render free web service (Node)
- Frontend: Render static site / Vercel

Do **NOT** commit `.env` to GitHub.

---

## GitHub publish (Windows)
From the project root:
```cmd
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

---

## Security
- Keep `JWT_SECRET` strong and private.
- Never commit `.env`.
