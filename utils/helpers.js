import crypto from 'crypto';

/**
 * Utilitários diversos para o sistema
 */
const helpers = {
  /**
   * Gera um ID único
   * @param {number} length - Tamanho do ID (padrão: 10)
   * @returns {string} - ID gerado
   */
  generateId(length = 10) {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Formata o tamanho em bytes para uma string legível
   * @param {number} bytes - Tamanho em bytes
   * @param {number} decimals - Número de casas decimais
   * @returns {string} - Tamanho formatado
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  /**
   * Limpa um nome de arquivo para uso seguro em URLs e sistemas de arquivos
   * @param {string} filename - Nome do arquivo
   * @returns {string} - Nome limpo
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-z0-9.]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  },

  /**
   * Extrai o domínio de uma URL
   * @param {string} url - URL completa
   * @returns {string} - Domínio da URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return '';
    }
  },

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} html - String com possível HTML
   * @returns {string} - String escapada
   */
  escapeHtml(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};

export default helpers;