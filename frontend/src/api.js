// Central API base URL — reads from Vite env variable.
// Set VITE_API_URL in .env.local for dev, or in Vercel dashboard for production.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_BASE;
