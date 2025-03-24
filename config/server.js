import { config } from "process"

export default {
    port: process.env.PORT || 3000,
    
    // Configurações de torrents
    torrents: {
      defaultPath: './torrents',
      maxSize: 1024 * 1024 * 10, // 10MB - Tamanho máximo para uploads de arquivos .torrent
      allowedTypes: ['.torrent']
    },
    
    // Categorias padrão disponíveis
    categories: [
      'Filmes',
      'TV Shows',
      'Música',
      'Documentários',
      'Outros'
    ],
    
    // Configurações de streaming
    streaming: {
      // Timeout inativo para liberar recursos (30 min)
      inactiveTimeout: 30 * 60 * 1000,
      
      // Cache básico para melhorar performance
      enableCache: true,
      cacheSize: 1024 * 1024 * 100 // 100MB de cache
    }
  };