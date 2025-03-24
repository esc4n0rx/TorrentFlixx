/**
 * TorrentFlix - Interface JavaScript
 */

let currentCategory = 'all';
let torrents = [];
let activeStreams = [];
let categories = [];

const categoriesList = document.getElementById('categories-list');
const torrentsList = document.getElementById('torrents-list');
const activeStreamsList = document.getElementById('active-streams');
const uploadBtn = document.getElementById('upload-btn');
const activateBtn = document.getElementById('activate-btn');
const uploadModal = document.getElementById('upload-modal');
const uploadForm = document.getElementById('upload-form');
const cancelUpload = document.getElementById('cancel-upload');
const torrentCategory = document.getElementById('torrent-category');

async function init() {
  try {
    // Carregar categorias
    await loadCategories();
    
    // Carregar lista de torrents
    await loadTorrents();
    
    // Carregar streams ativos
    await loadActiveStreams();
    
    // Iniciar polling para atualização de streams
    setInterval(loadActiveStreams, 10000);
    
    console.log('Torrent Streamer inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
}

/**
 * Carrega as categorias disponíveis
 */
async function loadCategories() {
  try {
    const response = await fetch('/api/torrents/categories');
    const data = await response.json();
    
    if (data.success) {
      categories = data.data;
      
      // Limpar lista atual
      let categoryItemsHTML = '<li><a href="#" class="block hover:bg-black hover:bg-opacity-30 p-1 rounded active" data-category="all">Todos</a></li>';
      
      // Adicionar categorias
      categories.forEach(category => {
        categoryItemsHTML += `
          <li><a href="#" class="block hover:bg-black hover:bg-opacity-30 p-1 rounded" data-category="${category}">${category}</a></li>
        `;
      });
      
      categoriesList.innerHTML = categoryItemsHTML;
      
      // Preencher dropdown de categorias
      let categoryOptionsHTML = '';
      categories.forEach(category => {
        categoryOptionsHTML += `<option value="${category}">${category}</option>`;
      });
      torrentCategory.innerHTML = categoryOptionsHTML;
      
      // Adicionar event listeners
      document.querySelectorAll('#categories-list a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          currentCategory = e.target.dataset.category;
          loadTorrents();
          
          // Destacar categoria selecionada
          document.querySelectorAll('#categories-list a').forEach(item => {
            item.classList.remove('bg-black', 'bg-opacity-30', 'active');
          });
          e.target.classList.add('bg-black', 'bg-opacity-30', 'active');
        });
      });
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

/**
 * Carrega a lista de torrents
 */
async function loadTorrents() {
  try {
    // Exibir mensagem de carregamento
    torrentsList.innerHTML = `
      <tr>
        <td colspan="6" class="py-4 text-center text-terminal-darkText">Carregando lista de torrents...</td>
      </tr>
    `;
    
    // Fazer requisição
    const url = currentCategory !== 'all' 
      ? `/api/torrents?category=${encodeURIComponent(currentCategory)}`
      : '/api/torrents';
      
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      torrents = data.data;
      
      if (torrents.length === 0) {
        torrentsList.innerHTML = `
          <tr>
            <td colspan="6" class="py-4 text-center text-terminal-darkText">Nenhum torrent encontrado.</td>
          </tr>
        `;
        return;
      }
      
      // Renderizar lista de torrents
      let torrentsHTML = '';
      
      torrents.forEach(torrent => {
        const isActive = activeStreams.some(stream => stream.id === torrent.id);
        const status = isActive ? 'Ativo' : 'Inativo';
        const statusClass = isActive ? 'text-terminal-accent' : 'text-terminal-darkText';
        
        torrentsHTML += `
          <tr class="border-b border-terminal-border">
            <td class="py-2">
              <input type="checkbox" class="torrent-checkbox" data-id="${torrent.id}">
            </td>
            <td class="py-2">${torrent.originalName || torrent.filename}</td>
            <td class="py-2 hidden md:table-cell">${torrent.category}</td>
            <td class="py-2 hidden md:table-cell">${formatFileSize(torrent.size)}</td>
            <td class="py-2 ${statusClass}">${status}</td>
            <td class="py-2">
              ${isActive 
                ? `<button class="text-terminal-accent hover:underline mr-2" 
                    onclick="deactivateTorrent('${torrent.id}')">Desativar</button>` 
                : `<button class="text-terminal-accent hover:underline mr-2" 
                    onclick="activateTorrent('${torrent.id}')">Ativar</button>`
              }
              <button class="text-red-500 hover:underline" 
                onclick="deleteTorrent('${torrent.id}')">Remover</button>
            </td>
          </tr>
        `;
      });
      
      torrentsList.innerHTML = torrentsHTML;
    }
  } catch (error) {
    console.error('Erro ao carregar torrents:', error);
    torrentsList.innerHTML = `
      <tr>
        <td colspan="6" class="py-4 text-center text-red-500">Erro ao carregar torrents. Tente novamente.</td>
      </tr>
    `;
  }
}

/**
 * Carrega os streams ativos
 */
// No app.js - função loadActiveStreams
async function loadActiveStreams() {
    try {
      const response = await fetch('/api/stream/active');
      const data = await response.json();
      
      if (data.success) {
        activeStreams = data.data;
        
        if (activeStreams.length === 0) {
          activeStreamsList.innerHTML = `
            <p class="text-terminal-darkText italic">Nenhum torrent ativo no momento.</p>
          `;
          return;
        }
        
        // Renderizar lista de streams ativos
        let streamsHTML = '<div class="space-y-4">';
        
        activeStreams.forEach(stream => {
          streamsHTML += `
            <div class="border border-terminal-border rounded-md p-2">
              <div class="flex justify-between items-center">
                <h3 class="text-terminal-accent font-bold">${stream.name}</h3>
                <div>
                  <span class="text-terminal-darkText text-xs mr-2">ID: ${stream.id}</span>
                </div>
              </div>
              <div class="mt-2">
                <h4 class="text-terminal-darkText">Arquivos:</h4>
                <ul class="pl-4 mt-1">
          `;
          
          // Filtrar e ordenar arquivos
          const files = stream.files
            .filter(file => file.size > 1000) // Filtrar arquivos muito pequenos
            .sort((a, b) => b.size - a.size); // Ordenar do maior para o menor
          
          files.forEach((file, index) => {
            const fileExt = file.name.split('.').pop().toLowerCase();
            const isVideo = ['mp4', 'mkv', 'avi', 'webm'].includes(fileExt);
            const isAudio = ['mp3', 'ogg', 'wav', 'flac'].includes(fileExt);
            
            // Adicionar ícone baseado no tipo de arquivo
            let fileIcon = '📄';
            if (isVideo) fileIcon = '🎬';
            if (isAudio) fileIcon = '🎵';
            
            streamsHTML += `
              <li class="flex justify-between items-center py-1">
                <div class="truncate flex items-center">
                  <span class="mr-2">${fileIcon}</span>
                  <span>${file.name}</span>
                </div>
                <div class="ml-2 flex items-center">
                  <small class="text-terminal-darkText mr-4">${formatFileSize(file.size)}</small>
                  <a href="/api/stream/${stream.id}/${file.index}" target="_blank" 
                     class="text-terminal-accent hover:underline px-2 py-1 bg-black bg-opacity-30 rounded mr-1">
                    Abrir
                  </a>
                  <button class="text-terminal-darkText hover:text-terminal-accent px-2 py-1 bg-black bg-opacity-30 rounded" 
                    onclick="copyToClipboard('${window.location.origin}/api/stream/${stream.id}/${file.index}')">
                    Copiar Link
                  </button>
                </div>
              </li>
            `;
          });
          
          streamsHTML += `
                </ul>
              </div>
            </div>
          `;
        });
        
        streamsHTML += '</div>';
        activeStreamsList.innerHTML = streamsHTML;
      }
    } catch (error) {
      console.error('Erro ao carregar streams ativos:', error);
    }
  }

/**
 * Ativa um torrent para streaming
 * @param {string} id - ID do torrent
 */
async function activateTorrent(id) {
  try {
    const response = await fetch(`/api/stream/activate/${id}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Torrent ativado com sucesso!', 'success');
      await loadTorrents();
      await loadActiveStreams();
    } else {
      showNotification(`Erro ao ativar torrent: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Erro ao ativar torrent:', error);
    showNotification('Erro ao ativar torrent. Tente novamente.', 'error');
  }
}

/**
 * Desativa um torrent
 * @param {string} id - ID do torrent
 */
async function deactivateTorrent(id) {
  try {
    const response = await fetch(`/api/stream/deactivate/${id}`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Torrent desativado com sucesso!', 'success');
      await loadTorrents();
      await loadActiveStreams();
    } else {
      showNotification(`Erro ao desativar torrent: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Erro ao desativar torrent:', error);
    showNotification('Erro ao desativar torrent. Tente novamente.', 'error');
  }
}

/**
 * Exclui um torrent
 * @param {string} id - ID do torrent
 */
async function deleteTorrent(id) {
  if (!confirm('Tem certeza que deseja remover este torrent?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/torrents/${id}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showNotification('Torrent removido com sucesso!', 'success');
      await loadTorrents();
    } else {
      showNotification(`Erro ao remover torrent: ${data.message}`, 'error');
    }
  } catch (error) {
    console.error('Erro ao remover torrent:', error);
    showNotification('Erro ao remover torrent. Tente novamente.', 'error');
  }
}

/**
 * Formata o tamanho de um arquivo
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Copia um texto para a área de transferência
 * @param {string} text - Texto a ser copiado
 */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification('Link copiado!', 'success');
  }).catch(err => {
    console.error('Erro ao copiar texto:', err);
    showNotification('Erro ao copiar link. Tente novamente.', 'error');
  });
}

/**
 * Exibe uma notificação na tela
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de notificação (success, error, warning)
 */
function showNotification(message, type = 'success') {
  const notificationTypes = {
    success: 'bg-terminal-accent text-terminal-bg',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-black'
  };
  
  const notificationClass = notificationTypes[type] || notificationTypes.success;
  
  // Criar elemento de notificação
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 px-4 py-2 rounded z-50 ${notificationClass}`;
  notification.textContent = message;
  
  // Adicionar ao DOM
  document.body.appendChild(notification);
  
  // Remover após 3 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

/**
 * Ativa os torrents selecionados
 */
async function activateSelected() {
  const checkboxes = document.querySelectorAll('.torrent-checkbox:checked');
  
  if (checkboxes.length === 0) {
    showNotification('Selecione pelo menos um torrent para ativar.', 'warning');
    return;
  }
  
  const ids = Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
  
  for (const id of ids) {
    await activateTorrent(id);
  }
}

// Configuração de event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar aplicação
  init();
  
  // Upload de torrent
  uploadBtn.addEventListener('click', e => {
    e.preventDefault();
    uploadModal.classList.remove('hidden');
  });
  
  // Cancelar upload
  cancelUpload.addEventListener('click', () => {
    uploadModal.classList.add('hidden');
  });
  
  // Fechar modal ao clicar fora
  uploadModal.addEventListener('click', e => {
    if (e.target === uploadModal) {
      uploadModal.classList.add('hidden');
    }
  });
  
  // Upload form submit
  uploadForm.addEventListener('submit', async e => {
    e.preventDefault();
    
    const fileInput = document.getElementById('torrent-file');
    const categorySelect = document.getElementById('torrent-category');
    
    if (!fileInput.files[0]) {
      showNotification('Selecione um arquivo .torrent', 'warning');
      return;
    }
    
    // Criar FormData
    const formData = new FormData();
    formData.append('torrent', fileInput.files[0]);
    formData.append('category', categorySelect.value);
    
    try {
      const response = await fetch('/api/torrents', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        uploadModal.classList.add('hidden');
        uploadForm.reset();
        showNotification('Torrent enviado com sucesso!', 'success');
        await loadTorrents();
      } else {
        showNotification(`Erro ao fazer upload: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      showNotification('Erro ao fazer upload. Tente novamente.', 'error');
    }
  });
  
  // Ativar torrents selecionados
  activateBtn.addEventListener('click', e => {
    e.preventDefault();
    activateSelected();
  });
});