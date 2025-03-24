import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';
import compression from 'compression';
import fs from 'fs-extra';
import { createServer } from 'http';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import config from './config/server.js';


import torrentRoutes from './routes/torrents.js';
import streamRoutes from './routes/stream.js';


const app = express();
const server = createServer(app);


app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


const ensureDirs = async () => {
  await fs.ensureDir(path.join(__dirname, 'torrents'));
  await fs.ensureDir(path.join(__dirname, 'uploads'));
  console.log('✓ Diretórios verificados e criados se necessário.');
};


app.use('/api/torrents', torrentRoutes);
app.use('/api/stream', streamRoutes);
I
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});


const PORT = config.port || 3000;

ensureDirs().then(() => {
  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║ Torrent Streamer iniciado na porta ${PORT}!        ║
╠═══════════════════════════════════════════════╣
║ Interface: http://localhost:${PORT}             ║
║ API: http://localhost:${PORT}/api               ║
╚═══════════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('Erro ao inicializar diretórios:', err);
  process.exit(1);
});