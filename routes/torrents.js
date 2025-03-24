import express from 'express';
const router = express.Router();
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import config from '../config/server.js';
import torrentController from '../controllers/torrentController.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Pasta temporária para uploads
    const uploadsDir = path.join(__dirname, '../uploads');
    await fs.ensureDir(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome único para o arquivo
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para aceitar apenas arquivos .torrent
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.torrent') {
    return cb(new Error('Apenas arquivos .torrent são permitidos'), false);
  }
  cb(null, true);
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.torrents.maxSize
  }
});

// Rotas
router.get('/', torrentController.listAll);
router.get('/categories', torrentController.getCategories);
router.get('/:id', torrentController.getTorrent);
router.post('/', upload.single('torrent'), torrentController.uploadTorrent);
router.put('/:id', torrentController.updateTorrent);
router.delete('/:id', torrentController.deleteTorrent);

export default router;