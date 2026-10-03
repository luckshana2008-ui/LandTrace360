import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

import authRouter from './routes/auth.js';
import landsRouter from './routes/lands.js';
import locationRouter from './routes/location.js';
import ogdRouter from './routes/ogd.js';
import geminiRouter from './routes/gemini.js';
import mlRouter from './routes/ml.js';
import auxiliaryRouter from './routes/auxiliary.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[Express] ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Primary Remerged API Routes (Express Handlers)
app.use('/api/auth', authRouter);
app.use('/api/lands', landsRouter);
app.use('/api/location', locationRouter);
app.use('/api/ogd', ogdRouter);
app.use('/api/ai', geminiRouter);
app.use('/api/chat', geminiRouter); // direct alias for LandTraceAI
app.use('/api/ml', mlRouter);
app.use('/api', auxiliaryRouter);

// Reverse Proxy to FastAPI (port 8000) for legacy routes / fallback
const fastApiProxy = createProxyMiddleware({
  target: FASTAPI_URL,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.warn(`[Proxy Fallback] FastAPI at ${FASTAPI_URL} unreachable for ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.status(200).json([]);
    }
  }
});

// Proxy routes that delegate to FastAPI
app.use('/api/lands', fastApiProxy);
app.use('/api/saved-lands', fastApiProxy);
app.use('/api/alerts', fastApiProxy);
app.use('/api/loan-closure-verification', fastApiProxy);
app.use('/api/search', fastApiProxy);
app.use('/uploads', fastApiProxy);

// Health check & status
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'LandTrace360 Remerged Coupled Server',
    region: 'Coimbatore, Tamil Nadu & All India Registry',
    ports: { express: PORT, fastapi_target: FASTAPI_URL },
    timestamp: new Date().toISOString(),
    gemini_key_configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE')
  });
});

// Production: Serve React static build if dist folder exists
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/health')) {
    return next();
  }
  const indexPath = path.join(frontendDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send(`
        <h1>LandTrace360 Remerged Server</h1>
        <p>API is active on port ${PORT}. In development, React is served via Vite at http://127.0.0.1:5173</p>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` LandTrace360 Remerged Express Server Active`);
  console.log(` Port: ${PORT} (Proxying to FastAPI at ${FASTAPI_URL})`);
  console.log(` Region: Coimbatore & All India Land Records`);
  console.log(` ML Engine & Gemini AI Studio: Active`);
  console.log(`====================================================`);
});
