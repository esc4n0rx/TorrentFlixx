import torrentService from '../services/torrentService.js';

/**
 * TorrentController - Gerencia as requisições relacionadas a torrents
 */
const TorrentController = {
  /**
   * Lista todos os arquivos .torrent disponíveis
   */
  async listAll(req, res) {
    try {
      const { category } = req.query;
      const torrents = await torrentService.listTorrents(category);
      
      res.status(200).json({
        success: true,
        data: torrents
      });
    } catch (error) {
      console.error('Erro ao listar torrents:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar torrents',
        error: error.message
      });
    }
  },

  /**
   * Obtém informações detalhadas de um único torrent
   */
  async getTorrent(req, res) {
    try {
      const { id } = req.params;
      const torrent = await torrentService.getTorrentInfo(id);
      
      if (!torrent) {
        return res.status(404).json({
          success: false,
          message: 'Torrent não encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: torrent
      });
    } catch (error) {
      console.error(`Erro ao obter torrent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter informações do torrent',
        error: error.message
      });
    }
  },

  /**
   * Recebe um arquivo .torrent via upload e salva na pasta de torrents
   */
  async uploadTorrent(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhum arquivo enviado'
        });
      }
      
      const { category = 'Outros' } = req.body;
      
      const torrent = await torrentService.saveTorrent(req.file, category);
      
      res.status(201).json({
        success: true,
        message: 'Torrent salvo com sucesso',
        data: torrent
      });
    } catch (error) {
      console.error('Erro ao fazer upload do torrent:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao salvar torrent',
        error: error.message
      });
    }
  },

  /**
   * Atualiza categoria de um torrent
   */
  async updateTorrent(req, res) {
    try {
      const { id } = req.params;
      const { category } = req.body;
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Categoria é obrigatória'
        });
      }
      
      const updated = await torrentService.updateTorrentInfo(id, { category });
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Torrent não encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Torrent atualizado com sucesso',
        data: updated
      });
    } catch (error) {
      console.error(`Erro ao atualizar torrent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar torrent',
        error: error.message
      });
    }
  },

  /**
   * Remove um torrent da lista
   */
  async deleteTorrent(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await torrentService.deleteTorrent(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Torrent não encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Torrent removido com sucesso'
      });
    } catch (error) {
      console.error(`Erro ao remover torrent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover torrent',
        error: error.message
      });
    }
  },

  /**
   * Retorna as categorias disponíveis
   */
  getCategories(req, res) {
    try {
      const categories = torrentService.getCategories();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Erro ao obter categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao obter categorias',
        error: error.message
      });
    }
  }
};

export default TorrentController;