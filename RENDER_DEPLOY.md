# Render Deployment Instructions

## 1. Backend (Express/Mongoose)
- Create a new Web Service in Render.
- Set the root directory to `backend`.
- Set the Start Command to `npm start`.
- Add environment variables (MongoDB URI, JWT secret, etc.) in Render's dashboard.
- Ensure `backend/package.json` has a `start` script (already present).

## 2. Frontend (React/Vite)
- Create a new Static Site in Render.
- Set the root directory to `frontend`.
- Set the Build Command to `npm run build`.
- Set the Publish Directory to `frontend/dist`.

## 3. Environment Variables
- Add all required environment variables for backend (e.g., `MONGO_URI`, `JWT_SECRET`).
- For frontend, set `VITE_BACKEND_URL` to the Render backend URL.

## 4. Common Steps
- Push your code to GitHub (Render deploys from GitHub).
- Connect your Render services to your GitHub repo.
- Deploy backend first, then frontend.

## 5. Electron Agent
- Electron agent cannot be deployed on Render; it is for desktop use only.

## 6. Troubleshooting
- Check Render logs for errors.
- Ensure CORS is enabled in backend for frontend URL.
- Update frontend API URLs to use Render backend URL.

---
For more details, see https://render.com/docs/deploy-nodejs and https://render.com/docs/deploy-static-sites
