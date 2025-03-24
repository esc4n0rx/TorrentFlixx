# Arquitetura do Torrent Streamer

Este documento descreve a arquitetura e os componentes principais do Torrent Streamer, uma aplicação Node.js para streaming de torrents sem download completo.

## Visão Geral da Arquitetura

O Torrent Streamer segue uma arquitetura MVC (Model-View-Controller) modular, com separação clara de responsabilidades:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│     Views     │     │  Controllers  │     │    Services   │
│ (Interface)   │◄───►│  (Rotas API)  │◄───►│   (Lógica)    │
└───────────────┘     └───────────────┘     └───────────────┘
                             │                     │
                             ▼                     ▼
                      ┌───────────────┐     ┌───────────────┐
                      │     Utils     │     │ Armazenamento │
                      │  (Helpers)    │     │  (Arquivos)   │
                      └───────────────┘     └───────────────┘
```

## Componentes Principais

### 1. Servidor Express (server.js)

Este é o ponto de entrada da aplicação. O arquivo `server.js` inicializa o servidor Express, configura middlewares e registra as rotas.

**Responsabilidades:**
- Inicializar o servidor HTTP
- Configurar middlewares (CORS, compressão, etc.)
- Registrar rotas
- Garantir a existência das pastas necessárias
- Iniciar a aplicação

### 2. Configuração (config/server.js)

Centraliza todas as configurações da aplicação, facilitando ajustes e personalizações.

**Parâmetros principais:**
- Porta do servidor
- Configurações de torrent (pasta padrão, limites)
- Categorias disponíveis
- Configurações de streaming (cache, timeout)

### 3. Controladores

Os controladores processam as requisições HTTP, chamam os serviços apropriados e retornam respostas formatadas.

#### TorrentController (controllers/torrentController.js)

**Funções:**
- `listAll`: Lista todos os torrents disponíveis (com filtragem opcional por categoria)
- `getTorrent`: Obtém detalhes de um torrent específico
- `uploadTorrent`: Processa o upload de um novo arquivo .torrent
- `updateTorrent`: Atualiza metadados de um torrent (como categoria)
- `deleteTorrent`: Remove um torrent do sistema
- `getCategories`: Obtém as categorias disponíveis

#### StreamController (controllers/streamController.js)

**Funções:**
- `activateTorrent`: Ativa um torrent para streaming
- `listActiveStreams`: Lista todos os torrents atualmente em streaming
- `deactivateTorrent`: Desativa o streaming de um torrent
- `streamFile`: Gerencia o streaming real de um arquivo de torrent

### 4. Serviços

Os serviços contêm a lógica de negócios principal, interagindo com bibliotecas externas e gerenciando recursos.

#### TorrentService (services/torrentService.js)

**Responsabilidades:**
- Gerenciar arquivos .torrent (listar, salvar, atualizar, remover)
- Gerenciar metadados dos torrents (categorias, informações)
- Fornecer informações sobre os torrents disponíveis

#### StreamService (services/streamService.js)

**Responsabilidades:**
- Inicializar e gerenciar o cliente WebTorrent
- Criar e gerenciar streams de torrents
- Manter o cache de torrents ativos
- Limpar recursos não utilizados
- Gerenciar o sistema de streaming

### 5. Rotas (routes/)

As rotas definem os endpoints da API e conectam as requisições HTTP aos controladores.

#### torrents.js

**Endpoints:**
- `GET /api/torrents`: Lista todos os torrents
- `GET /api/torrents/categories`: Obtém categorias disponíveis
- `GET /api/torrents/:id`: Obtém um torrent específico
- `POST /api/torrents`: Upload de um novo torrent
- `PUT /api/torrents/:id`: Atualiza um torrent
- `DELETE /api/torrents/:id`: Remove um torrent

#### stream.js

**Endpoints:**
- `GET /api/stream/active`: Lista streams ativos
- `POST /api/stream/activate/:id`: Ativa um torrent para streaming
- `POST /api/stream/deactivate/:id`: Desativa um stream
- `GET /api/stream/:torrentId/:fileIndex`: Endpoint de streaming do arquivo

### 6. Utilitários (utils/helpers.js)

Funções auxiliares usadas em toda a aplicação:

- `generateId`: Gera IDs únicos para novos torrents
- `formatFileSize`: Formata tamanhos de arquivo para exibição
- `sanitizeFilename`: Trata nomes de arquivos para uso seguro
- `extractDomain`: Extrai domínio de URLs
- `escapeHtml`: Escapa HTML para prevenir XSS

### 7. Interface de Usuário (views/index.html, public/)

A interface é uma SPA (Single Page Application) simples, que se comunica com o backend via API RESTful. O design visual é inspirado em terminais CLI antigos.

**Componentes da UI:**
- Lista de torrents com status e ações
- Categorias para filtragem
- Modal de upload de torrents
- Área de links ativos de streaming
- Recursos estáticos (CSS, JS, imagens)

## Fluxo de Dados

### Upload e Ativação de Torrent

1. Usuário faz upload de um arquivo .torrent via interface
2. Frontend envia o arquivo para `/api/torrents` (POST)
3. `TorrentController.uploadTorrent` processa o upload e chama `TorrentService.saveTorrent`
4. O arquivo é movido para a pasta de torrents e metadados são salvos
5. O usuário ativa o torrent para streaming via UI
6. Frontend envia requisição para `/api/stream/activate/:id` (POST)
7. `StreamController.activateTorrent` chama `StreamService.activateTorrent`
8. WebTorrent Client inicia o download/stream do torrent
9. Um link de streaming é gerado e retornado ao frontend

### Streaming de Conteúdo

1. Usuário ou aplicação acessa o link de streaming (`/api/stream/:torrentId/:fileIndex`)
2. `StreamController.streamFile` processa a requisição
3. Se o torrent estiver ativo, `StreamService.getFileStream` obtém o stream
4. O arquivo é transmitido diretamente para o cliente sem salvar completamente no disco
5. Suporte para streaming parcial via range requests permite compatibilidade com players de mídia

## Otimizações

1. **Gerenciamento de Recursos:**
   - Torrents inativos são automaticamente descarregados após um período de inatividade
   - Cache configurável para melhorar a performance de streaming

2. **Performance:**
   - Compressão HTTP para reduzir tráfego
   - Estrutura modular para carregamento eficiente
   - Streaming em vez de download completo

3. **Interface Responsiva:**
   - Design adaptável para mobile e desktop
   - JavaScript assíncrono para operações não-bloqueantes

## Segurança

1. **Validação de Entradas:**
   - Filtragem e validação de uploads
   - Sanitização de nomes de arquivos

2. **Limitações:**
   - Tamanho máximo de upload configurável
   - Restrição de tipos de arquivo

## Considerações para Produção

1. **Escalabilidade:**
   - Para grande número de usuários, é recomendavel considerar balanceamento de carga
   - Para muitos torrents ativos, aumente os limites de recursos do servidor,principalmente memoria ram

2. **Segurança Adicional:**
   - Adicionar autenticação para uso público
   - Implementar HTTPS

3. **Monitoramento:**
   - Adicionar logs detalhados
   - Implementar métricas de uso e performance
