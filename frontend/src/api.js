// In development: use local Express backend on port 5000
// In production: use same-origin relative URL ("") which routes to Vercel Edge Serverless Function
const rawUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:5000' : '');

// Strip any trailing slash to prevent double-slash routing issues
const API_BASE = rawUrl ? rawUrl.replace(/\/+$/, '') : '';

export default API_BASE;
