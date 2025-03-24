import fs from 'fs-extra';
import path from 'path';
import config from '../config/server.js';
import helpers from '../utils/helpers.js';

/**
 * TorrentService - Gerencia operações relacionadas aos arquivos .torrent
 */
const TorrentService = {
  /**
   * Lista todos os arquivos .torrent disponíveis
   * @param {string} category - Categoria para filtrar (opcional)
   * @returns {Promise<Array>} - Lista de torrents
   */
  async listTorrents(category = null) {
    try {
      // Caminho da pasta de torrents
      const torrentsPath = path.resolve(config.torrents.defaultPath);
      
      // Lê todos os arquivos na pasta de torrents
      const files = await fs.readdir(torrentsPath);
      
      // Filtra apenas os arquivos .torrent
      const torrentFiles = files.filter(file => path.extname(file).toLowerCase() === '.torrent');
      
      // Obtém informações detalhadas de cada torrent
      const torrentsInfo = await Promise.all(
        torrentFiles.map(async file => {
          try {
            const torrentPath = path.join(torrentsPath, file);
            const stats = await fs.stat(torrentPath);
            
            // Verifica se existe arquivo de metadados associado
            const metadataPath = path.join(torrentsPath, `${path.basename(file, '.torrent')}.json`);
            let metadata = {};
            
            if (await fs.pathExists(metadataPath)) {
              metadata = await fs.readJson(metadataPath);
            }
            
            return {
              id: path.basename(file, '.torrent'),
              filename: file,
              size: stats.size,
              path: torrentPath,
              createdAt: stats.birthtime,
              category: metadata.category || 'Outros',
              ...metadata
            };
          } catch (error) {
            console.error(`Erro ao processar torrent ${file}:`, error);
            return null;
          }
        })
      );
      
      // Remove itens que deram erro
      const validTorrents = torrentsInfo.filter(Boolean);
      
      // Filtra por categoria se especificada
      if (category) {
        return validTorrents.filter(torrent => 
          torrent.category && torrent.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      return validTorrents;
    } catch (error) {
      console.error('Erro ao listar torrents:', error);
      throw error;
    }
  },

  /**
   * Obtém informações de um torrent específico
   * @param {string} id - ID do torrent
   * @returns {Promise<Object>} - Informações do torrent
   */
  async getTorrentInfo(id) {
    try {
      const torrentsPath = path.resolve(config.torrents.defaultPath);
      const torrentPath = path.join(torrentsPath, `${id}.torrent`);
      
      // Verifica se o arquivo existe
      if (!await fs.pathExists(torrentPath)) {
        return null;
      }
      
      const stats = await fs.stat(torrentPath);
      
      // Verifica metadados
      const metadataPath = path.join(torrentsPath, `${id}.json`);
      let metadata = {};
      
      if (await fs.pathExists(metadataPath)) {
        metadata = await fs.readJson(metadataPath);
      }
      
      return {
        id,
        filename: `${id}.torrent`,
        size: stats.size,
        path: torrentPath,
        createdAt: stats.birthtime,
        category: metadata.category || 'Outros',
        ...metadata
      };
    } catch (error) {
      console.error(`Erro ao obter informações do torrent ${id}:`, error);
      throw error;
    }
  },

  /**
   * Salva um novo arquivo torrent
   * @param {Object} file - Objeto do arquivo enviado (multer)
   * @param {string} category - Categoria do torrent
   * @returns {Promise<Object>} - Informações do torrent salvo
   */
  async saveTorrent(file, category = 'Outros') {
    try {
      const torrentsPath = path.resolve(config.torrents.defaultPath);
      
      // Gera um ID único para o torrent
      const torrentId = helpers.generateId();
      const torrentFilename = `${torrentId}.torrent`;
      const torrentPath = path.join(torrentsPath, torrentFilename);
      
      // Move o arquivo para a pasta de torrents
      await fs.move(file.path, torrentPath);
      
      // Cria metadados
      const metadata = {
        id: torrentId,
        category,
        originalName: file.originalname,
        createdAt: new Date(),
        size: file.size
      };
      
      // Salva metadados
      const metadataPath = path.join(torrentsPath, `${torrentId}.json`);
      await fs.writeJson(metadataPath, metadata);
      
      return {
        id: torrentId,
        filename: torrentFilename,
        originalName: file.originalname,
        path: torrentPath,
        size: file.size,
        category,
        createdAt: metadata.createdAt
      };
    } catch (error) {
      console.error('Erro ao salvar torrent:', error);
      throw error;
    }
  },

  /**
   * Atualiza informações de um torrent
   * @param {string} id - ID do torrent
   * @param {Object} updates - Campos a serem atualizados
   * @returns {Promise<Object>} - Torrent atualizado
   */
  async updateTorrentInfo(id, updates) {
    try {
      const torrent = await this.getTorrentInfo(id);
      
      if (!torrent) {
        return null;
      }
      
      const torrentsPath = path.resolve(config.torrents.defaultPath);
      const metadataPath = path.join(torrentsPath, `${id}.json`);
      
      // Lê metadados existentes ou cria objeto vazio
      let metadata = {};
      if (await fs.pathExists(metadataPath)) {
        metadata = await fs.readJson(metadataPath);
      }
      
      // Atualiza os campos
      const updatedMetadata = {
        ...metadata,
        ...updates,
        updatedAt: new Date()
      };
      
      // Salva metadados atualizados
      await fs.writeJson(metadataPath, updatedMetadata);
      
      return {
        ...torrent,
        ...updates,
        updatedAt: updatedMetadata.updatedAt
      };
    } catch (error) {
      console.error(`Erro ao atualizar torrent ${id}:`, error);
      throw error;
    }
  },

  /**
   * Remove um torrent
   * @param {string} id - ID do torrent
   * @returns {Promise<boolean>} - Resultado da operação
   */
  async deleteTorrent(id) {
    try {
      const torrentsPath = path.resolve(config.torrents.defaultPath);
      const torrentPath = path.join(torrentsPath, `${id}.torrent`);
      const metadataPath = path.join(torrentsPath, `${id}.json`);
      
      // Verifica se o arquivo existe
      if (!await fs.pathExists(torrentPath)) {
        return false;
      }
      
      // Remove o arquivo .torrent
      await fs.remove(torrentPath);
      
      // Remove metadados se existirem
      if (await fs.pathExists(metadataPath)) {
        await fs.remove(metadataPath);
      }
      
      return true;
    } catch (error) {
      console.error(`Erro ao remover torrent ${id}:`, error);
      throw error;
    }
  },

  /**
   * Retorna as categorias disponíveis
   * @returns {Array} - Lista de categorias
   */
  getCategories() {
    return config.categories;
  }
};

export default TorrentService;