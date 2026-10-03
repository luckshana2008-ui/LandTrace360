// Central API base URL:
// Coupled with Express Backend Server (default port 5000)
const rawUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://127.0.0.1:5000' : 'https://landtrace360.onrender.com');

// Strip any trailing slash to prevent double-slash routing issues
const API_BASE = rawUrl.replace(/\/+$/, '');

export default API_BASE;
