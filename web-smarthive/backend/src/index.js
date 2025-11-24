import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";

import userRoutes from "./routes/userRoutes.js";
import apiarioRoutes from "./routes/apiarioRoutes.js";
import colmeiaRoutes from "./routes/colmeiaRoutes.js";
import registroRoutes from "./routes/registroRoutes.js";
import alertaRoutes from "./routes/alertaRoutes.js";

import { alertBus } from "./utils/bus.js";

const app = express();

// Middlewares
app.use(express.json({ 
  strict: false,
  limit: '10mb',
  type: ['application/json', 'text/plain']
}));
app.use(morgan("dev"));

// Debug middleware para ver o corpo das requisições
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('DEBUG - Headers:', req.headers);
    console.log('DEBUG - Body:', req.body);
    console.log('DEBUG - Raw Body:', req.rawBody);
  }
  next();
});

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    if(!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Healthcheck
app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// Rotas
app.use("/auth", userRoutes);
app.use("/api/apiarios", apiarioRoutes);
app.use("/api/colmeias", colmeiaRoutes);
app.use("/api/registros", registroRoutes);
app.use("/api/alertas", alertaRoutes);

// SSE de alertas (não depende de replica set do Mongo)
const sseClients = new Set();

app.get("/api/alertas/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const client = { res };
  sseClients.add(client);

  // keep-alive ping
  const ping = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    sseClients.delete(client);
  });
});

// Sempre que houver um novo alerta, enviamos aos clientes conectados
alertBus.on("alert", (alert) => {
  const payload = `event: alerta\ndata: ${JSON.stringify(alert)}\n\n`;
  for (const { res } of sseClients) {
    try {
      res.write(payload);
    } catch {
      // cliente desconectado
    }
  }
});

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smarthive";

let server = null;

function gracefulShutdown() {
  if (server) {
    server.close(() => {
      console.log('[API] Servidor encerrado graciosamente');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

const startServer = async () => {
  try {
    await connectDB(MONGO_URI);
    
    server = app.listen(PORT, () => {
      console.log(`[API] Servidor rodando em http://localhost:${PORT}`);
      console.log(`[CORS] Origens permitidas: http://localhost:8080, http://127.0.0.1:8080`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[ERRO] Porta ${PORT} já está em uso. Tentando novamente em 5 segundos...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 5000);
      }
    });

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (err) {
    console.error("Falha ao conectar no MongoDB:", err.message);
    process.exit(1);
  }
};

startServer();
