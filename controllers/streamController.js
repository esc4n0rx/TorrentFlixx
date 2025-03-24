import streamService from '../services/streamService.js';
import torrentService from '../services/torrentService.js';
import rangeParser from 'range-parser';
import mime from 'mime-types';
import path from 'path'; // Adicione esta linha

/**
 * StreamController - Gerencia as requisições de streaming de torrents
 */
const StreamController = {
  /**
   * Ativa um torrent para streaming
   */
  async activateTorrent(req, res) {
    try {
      const { id } = req.params;
      
      // Verifica se o torrent existe
      const torrentInfo = await torrentService.getTorrentInfo(id);
      
      if (!torrentInfo) {
        return res.status(404).json({
          success: false,
          message: 'Torrent não encontrado'
        });
      }
      
      // Ativa o streaming do torrent
      const streamInfo = await streamService.activateTorrent(torrentInfo);
      
      res.status(200).json({
        success: true,
        message: 'Torrent ativado para streaming',
        data: {
          id: streamInfo.id,
          name: streamInfo.name,
          files: streamInfo.files.map((file, index) => ({
            name: file.name,
            size: file.length,
            index: index, // Adicionar o índice explicitamente
            streamUrl: `/api/stream/${streamInfo.id}/${index}`
          }))
        }
      });
    } catch (error) {
      console.error(`Erro ao ativar streaming do torrent ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao ativar streaming',
        error: error.message
      });
    }
  },

  /**
   * Lista todos os torrents atualmente em modo de streaming
   */
  async listActiveStreams(req, res) {
    try {
      const activeStreams = await streamService.getActiveStreams();
      
      res.status(200).json({
        success: true,
        data: activeStreams.map(stream => ({
          id: stream.id,
          name: stream.name,
          files: stream.files.map((file, index) => ({
            name: file.name,
            size: file.length,
            index: index, // Adicionar o índice explicitamente
            streamUrl: `/api/stream/${stream.id}/${index}`
          }))
        }))
      });
    } catch (error) {
      console.error('Erro ao listar streams ativos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar streams ativos',
        error: error.message
      });
    }
  },

  /**
   * Desativa o streaming de um torrent
   */
  async deactivateTorrent(req, res) {
    try {
      const { id } = req.params;
      
      const deactivated = await streamService.deactivateTorrent(id);
      
      if (!deactivated) {
        return res.status(404).json({
          success: false,
          message: 'Stream não encontrado ou já desativado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Stream desativado com sucesso'
      });
    } catch (error) {
      console.error(`Erro ao desativar stream ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: 'Erro ao desativar stream',
        error: error.message
      });
    }
  },

  /**
   * Realiza o streaming de um arquivo de torrent
   */
  async streamFile(req, res) {
    let fileStream;
    
    try {
      const { torrentId, fileIndex } = req.params;
      console.log(`Solicitação de streaming para torrent: ${torrentId}, arquivo: ${fileIndex}`);
      
      // Obtém o torrent e arquivo solicitados
      const file = await streamService.getFileStream(torrentId, parseInt(fileIndex, 10));
      
      if (!file) {
        console.log(`Arquivo não encontrado: torrent ${torrentId}, arquivo ${fileIndex}`);
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado'
        });
      }
      
      console.log(`Arquivo encontrado: ${file.name}, tamanho: ${file.length}`);
      
      // Define headers de resposta
      const fileSize = file.length;
      let mimeType;
      
      try {
        mimeType = mime.lookup(file.name);
        // Se não conseguir determinar o MIME type pelo nome, tente pela extensão
        if (!mimeType) {
          const ext = path.extname(file.name).toLowerCase();
          if (['.mp4', '.mkv', '.webm', '.avi'].includes(ext)) {
            mimeType = 'video/mp4';
          } else if (['.mp3', '.wav', '.ogg'].includes(ext)) {
            mimeType = 'audio/mpeg';
          } else {
            mimeType = 'application/octet-stream';
          }
        }
      } catch (err) {
        // Em caso de erro, use um tipo genérico
        console.error('Erro ao determinar MIME type:', err);
        mimeType = 'application/octet-stream';
      }
      
      console.log(`MIME type para ${file.name}: ${mimeType}`);
      
      // Para arquivos MKV, forçar um MIME type que funcione melhor em navegadores
      if (mimeType === 'video/x-matroska') {
        mimeType = 'video/mp4';
        console.log(`Alterando MIME type para ${mimeType} para melhor compatibilidade`);
      }
      
      // Processa o range para suportar streaming parcial
      let range = req.headers.range;
      let positions, start, end, chunksize;
      
      if (range) {
        try {
          positions = rangeParser(fileSize, range, { combine: true });
          
          if (positions === -1 || positions === -2) {
            // Erro de range - envia o arquivo completo
            start = 0;
            end = fileSize - 1;
          } else {
            start = positions[0].start;
            end = positions[0].end;
          }
          
          chunksize = (end - start) + 1;
          
          res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + fileSize,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': mimeType
          });
          
          // Stream do arquivo pelo range solicitado
          fileStream = file.createReadStream({ start, end });
        } catch (error) {
          console.error('Erro ao processar range request:', error);
          
          // Fallback para streaming completo
          res.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Content-Length': fileSize,
            'Content-Type': mimeType
          });
          
          fileStream = file.createReadStream();
        }
      } else {
        // Sem range definido - envia o arquivo completo
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes'
        });
        
        fileStream = file.createReadStream();
      }
      
      // Configurar handlers para os eventos do stream
      fileStream.on('error', (error) => {
        console.error('Erro no fileStream:', error);
        // Se ainda não enviou headers, podemos enviar uma resposta de erro
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: 'Erro durante o streaming' });
        } else if (!res.writableEnded) {
          // Se já enviou headers mas ainda podemos escrever, finalizamos a resposta
          res.end();
        }
      });
      
      // Configurar handlers para eventos da resposta HTTP
      res.on('close', () => {
        console.log(`Conexão fechada para ${file.name}`);
        if (fileStream && !fileStream.destroyed) {
          fileStream.destroy();
        }
      });
      
      // Conectar o stream do arquivo à resposta HTTP
      fileStream.pipe(res);
      
    } catch (error) {
      console.error(`Erro geral ao realizar streaming: ${error.message}`);
      
      // Limpar o fileStream se ele existe
      if (fileStream && !fileStream.destroyed) {
        fileStream.destroy();
      }
      
      // Se já enviou headers, não pode enviar resposta de erro JSON
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erro ao realizar streaming',
          error: error.message
        });
      } else if (!res.writableEnded) {
        // Se já enviou headers mas ainda podemos escrever, finalizamos a resposta
        res.end();
      }
    }
    },
};

export default StreamController;