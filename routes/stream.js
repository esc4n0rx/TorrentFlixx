import express from 'express';
const router = express.Router();

// Controlador de streams
import streamController from '../controllers/streamController.js';

// Rotas
router.get('/active', streamController.listActiveStreams);
router.post('/activate/:id', streamController.activateTorrent);
router.post('/deactivate/:id', streamController.deactivateTorrent);
router.get('/:torrentId/:fileIndex', streamController.streamFile);

export default router;