/**
 * Dot X Library - Full-Stack Express Server & Vite Dev Gateway
 */
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { authenticate } from './server/auth.js';
import { setupMeetingWebSocket } from './server/meetingSocket.js';
import authRoutes from './server/routes/authRoutes.js';
import bookRoutes from './server/routes/bookRoutes.js';
import categoryRoutes from './server/routes/categoryRoutes.js';
import meetingRoutes from './server/routes/meetingRoutes.js';
import chatRoutes from './server/routes/chatRoutes.js';
import aiRoutes from './server/routes/aiRoutes.js';
import notificationRoutes from './server/routes/notificationRoutes.js';
import contactRoutes from './server/routes/contactRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import instituteRoutes from './server/routes/instituteRoutes.js';
import readingGoalRoutes from './server/routes/readingGoalRoutes.js';
import lectureRoutes from './server/routes/lectureRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parser & Security
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Global Auth extraction
  app.use(authenticate);

  // API Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/institutes', instituteRoutes);
  app.use('/api/admin/institutes', instituteRoutes);
  app.use('/api/reading-goals', readingGoalRoutes);
  app.use('/api/lectures', lectureRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'Dot X Learner Platform',
      timestamp: new Date().toISOString()
    });
  });

  // Simulated PDF / File serving
  app.get('/api/files/:filename', (req, res) => {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${req.params.filename}"`);
    // Sample minimal valid PDF binary header
    const minimalPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
    );
    res.send(minimalPdf);
  });

  // Mount Vite or static build
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Create unified HTTP server for Express and WebSockets
  const server = http.createServer(app);

  // Initialize Real-Time Meeting WebSocket Server
  const wss = new WebSocketServer({ server });
  setupMeetingWebSocket(wss);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dot X Library Server listening on http://0.0.0.0:${PORT} (HTTP + WebSockets)`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
