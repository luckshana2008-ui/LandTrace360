// Central API base URL:
// 1. Explicit environment variable (VITE_API_URL from .env.development, .env.local, or Vercel dashboard)
// 2. In local development (import.meta.env.DEV): defaults to local FastAPI backend (http://127.0.0.1:8000)
// 3. In production build: defaults to production Render URL (https://landtrace360.onrender.com)
const rawUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:8000' : 'https://landtrace360.onrender.com');

// Strip any trailing slash to prevent double-slash routing issues (e.g. //api/auth/login)
const API_BASE = rawUrl.replace(/\/+$/, '');

export default API_BASE;
