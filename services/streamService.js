import WebTorrent from 'webtorrent';
import path from 'path';
import config from '../config/server.js';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Cria cliente WebTorrent
const client = new WebTorrent();

// Mapa de torrents ativos para gerenciar o cache
const activeTorrents = new Map();

// Função para limpar torrents inativos periodicamente
const cleanupInactiveTorrents = () => {
  for (const [torrentId, data] of activeTorrents.entries()) {
    const { lastAccessed, torrent } = data;
    const now = Date.now();
    
    // Se o torrent não foi acessado nos últimos 30 minutos, remova-o
    if (now - lastAccessed > config.streaming.inactiveTimeout) {
      console.log(`Removendo torrent inativo: ${torrentId}`);
      torrent.destroy();
      activeTorrents.delete(torrentId);
    }
  }
};

// Executa a limpeza a cada 10 minutos
setInterval(cleanupInactiveTorrents, 10 * 60 * 1000);

/**
 * StreamService - Gerencia operações de streaming dos arquivos torrent
 */
const StreamService = {
  /**
   * Ativa um torrent para streaming
   * @param {Object} torrentInfo - Informações do torrent
   * @returns {Promise<Object>} - Informações do stream ativado
   */
  activateTorrent(torrentInfo) {
    return new Promise((resolve, reject) => {
      // Verifica se o torrent já está ativo
      if (activeTorrents.has(torrentInfo.id)) {
        const entry = activeTorrents.get(torrentInfo.id);
        entry.lastAccessed = Date.now();
        
        console.log(`Torrent já ativo: ${torrentInfo.id}`);
        
        // Adiciona o ID como propriedade do torrent
        const torrentWithId = {
          ...entry.torrent,
          id: torrentInfo.id // Garante que o ID esteja definido
        };
        
        return resolve(torrentWithId);
      }
      
      console.log(`Ativando torrent: ${torrentInfo.id}`);
      
      // Adiciona o torrent ao cliente
      client.add(torrentInfo.path, { path: path.join(__dirname, '../uploads') }, torrent => {
        console.log(`Torrent adicionado: ${torrentInfo.id} (${torrent.files.length} arquivos)`);
        
        // Armazena torrent ativo no mapa
        activeTorrents.set(torrentInfo.id, {
          torrent,
          lastAccessed: Date.now()
        });
        
        // Cria um objeto com o ID explicitamente definido
        const torrentWithId = {
          ...torrent, 
          id: torrentInfo.id
        };
        
        resolve(torrentWithId);
      }).on('error', err => {
        console.error(`Erro ao adicionar torrent ${torrentInfo.id}:`, err);
        reject(err);
      });
    });
  },

  /**
   * Obtém os torrents ativos para streaming
   * @returns {Promise<Array>} - Lista de torrents ativos
   */
  async getActiveStreams() {
    const activeStreams = [];
    
    for (const [id, { torrent }] of activeTorrents.entries()) {
      // Atualiza o timestamp de último acesso
      activeTorrents.get(id).lastAccessed = Date.now();
      
      // Criar um novo objeto com o ID correto
      const streamInfo = {
        ...torrent,
        id: id
      };
      
      activeStreams.push(streamInfo);
    }
    
    return activeStreams;
  },

  /**
   * Desativa um torrent
   * @param {string} id - ID do torrent
   * @returns {Promise<boolean>} - Resultado da operação
   */
  async deactivateTorrent(id) {
    if (!activeTorrents.has(id)) {
      return false;
    }
    
    const { torrent } = activeTorrents.get(id);
    
    return new Promise((resolve) => {
      torrent.destroy(() => {
        activeTorrents.delete(id);
        console.log(`Torrent desativado: ${id}`);
        resolve(true);
      });
    });
  },

  /**
   * Obtém um stream de arquivo de um torrent ativo
   * @param {string} torrentId - ID do torrent
   * @param {number} fileIndex - Índice do arquivo
   * @returns {Promise<Object>} - Stream do arquivo
   */
   
  // Em streamService.js
async getFileStream(torrentId, fileIndex) {
    console.log(`getFileStream: torrentId=${torrentId}, fileIndex=${fileIndex}`);
    
    try {
      // Verifica se o torrent está ativo
      if (!activeTorrents.has(torrentId)) {
        console.log(`Torrent ${torrentId} não está ativo`);
        return null;
      }
      
      const { torrent } = activeTorrents.get(torrentId);
      console.log(`Torrent encontrado, nome: ${torrent.name}, arquivos: ${torrent.files.length}`);
      
      // Atualiza o timestamp de último acesso
      activeTorrents.get(torrentId).lastAccessed = Date.now();
      
      // Verifica se o índice do arquivo é válido
      if (fileIndex < 0 || fileIndex >= torrent.files.length) {
        console.log(`Índice inválido: ${fileIndex}, total de arquivos: ${torrent.files.length}`);
        return null;
      }
      
      const file = torrent.files[fileIndex];
      console.log(`Arquivo selecionado: ${file.name}`);
      
      return file;
    } catch (error) {
      console.error(`Erro ao obter stream de arquivo: ${error.message}`);
      return null;
    }
  },

  /**
   * Verifica o status de um torrent
   * @param {string} id - ID do torrent
   * @returns {Object} - Status do torrent
   */
  getTorrentStatus(id) {
    if (!activeTorrents.has(id)) {
      return { active: false };
    }
    
    const { torrent, lastAccessed } = activeTorrents.get(id);
    
    return {
      active: true,
      progress: torrent.progress,
      downloadSpeed: torrent.downloadSpeed,
      uploadSpeed: torrent.uploadSpeed,
      numPeers: torrent.numPeers,
      lastAccessed
    };
  }
};

export default StreamService;