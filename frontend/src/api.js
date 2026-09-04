// Central API base URL — reads from Vite env variable.
// In Vercel dashboard: set VITE_API_URL = https://landtrace360.onrender.com
// Falls back to the production Render URL so the deployed site always works.
const API_BASE =
    import.meta.env.VITE_API_URL ||
    'https://landtrace360.onrender.com';

export default API_BASE;
