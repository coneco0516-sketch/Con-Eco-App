# 🚀 Render Deployment Guide — ConEco

This guide covers deploying the **ConEco Backend (FastAPI)** and **Frontend (React/Vite)** on [Render](https://render.com).

---

## 📋 Prerequisites

- GitHub repository: `coneco0516-sketch/Con-Eco-App`
- Render account: [https://render.com](https://render.com)
- Neon PostgreSQL database URL (see `NEON_DATABASE.md`)
- Brevo API key for email (see `BREVO_EMAIL_SETUP.md`)

---

## 🔧 1. Deploy the Backend (FastAPI)

### Step 1: Create a New Web Service on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **New → Web Service**
3. Connect your GitHub repo: `Con-Eco-App`
4. Configure as follows:

| Setting | Value |
|---|---|
| **Name** | `coneco-backend` |
| **Region** | Singapore (Asia) |
| **Branch** | `main` |
| **Root Directory** | `Backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free (or Starter for production) |

---

### Step 2: Set Environment Variables

In the Render dashboard → **Environment** tab, add the following:

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb?sslmode=require

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
SECRET_KEY=your_secret_key_here

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@coneco.com
FROM_NAME=ConEco

# App URL (update after first deploy)
APP_URL=https://coneco-backend.onrender.com

# Razorpay (if applicable)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

### Step 3: Deploy

- Click **Create Web Service**
- Render will automatically build and deploy from the `main` branch
- First deploy takes ~3–5 minutes

### Step 4: Note Your Backend URL

After deploy, your backend URL will be something like:
```
https://coneco-backend.onrender.com
```

Update `APP_URL` in environment variables to this URL.

---

## 🌐 2. Deploy the Frontend (React/Vite)

### Step 1: Create a Static Site on Render

1. Click **New → Static Site**
2. Connect the same GitHub repo
3. Configure as follows:

| Setting | Value |
|---|---|
| **Name** | `coneco-frontend` |
| **Branch** | `main` |
| **Root Directory** | `Frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### Step 2: Set Environment Variables (Frontend)

```env
REACT_APP_API_URL=https://coneco-backend.onrender.com
```

> **Note:** In Vite, prefix env vars with `VITE_` if you're using `import.meta.env`. Check your `.env` setup.

### Step 3: Deploy

- Click **Create Static Site**
- Frontend build takes ~2–3 minutes

Your frontend URL will be:
```
https://coneco-frontend.onrender.com
```

---

## 🔄 3. Auto-Deploy (CI/CD)

Render auto-deploys on every push to `main` branch by default.

To disable auto-deploy:
- Go to Service → **Settings** → Auto-Deploy → Toggle off

---

## ⚠️ Free Tier Limitations

| Limitation | Detail |
|---|---|
| **Cold starts** | Free services spin down after 15 min of inactivity — first request takes ~30 sec |
| **Build minutes** | 500 free build minutes/month |
| **Bandwidth** | 100 GB/month |
| **Uptime** | Not guaranteed on free tier |

**For production:** Upgrade to **Starter ($7/month)** to avoid cold starts.

---

## 🛠 Troubleshooting

### Build fails: Module not found
```bash
# Ensure requirements.txt is in Backend/ folder
pip install -r Backend/requirements.txt
```

### CORS errors in browser
Make sure your backend `main.py` CORS config includes the Render frontend URL:
```python
allow_origins=["https://coneco-frontend.onrender.com"]
```

### Database connection failed
- Check `DATABASE_URL` is set correctly in Render environment
- Ensure Neon DB allows connections from Render IPs (Neon allows all by default)

### Cold start too slow
- Upgrade to Starter plan
- Or use a free uptime monitor (e.g., UptimeRobot) to ping the service every 14 minutes

---

## 📄 Render Dashboard Links

- Backend: `https://dashboard.render.com/web/coneco-backend`
- Frontend: `https://dashboard.render.com/static/coneco-frontend`

---

*Last updated: April 2026 | ConEco Team*
