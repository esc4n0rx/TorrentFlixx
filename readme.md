# TorrentFlix

Aplicação Node.js para streaming de torrents sem download completo, com interface retrô estilo terminal/CLI.

## Características

- **Streaming de torrents em tempo real** sem baixar o conteúdo completo
- Interface web moderna com visual retrô estilo terminal
- Gerenciamento de torrents por categorias
- Upload de novos arquivos .torrent via interface web
- Geração de links públicos para compartilhamento
- Streaming otimizado com cache para melhor performance

## Requisitos

- Node.js 14.x ou superior
- NPM ou Yarn

## Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/esc4n0rx/TorrentFlixx
   cd torrent-streamer
   ```

2. Instale as dependências:
   ```
   npm install
   ```
   ou, se preferir usar Yarn:
   ```
   yarn install
   ```

3. Crie as pastas necessárias caso não existam:
   ```
   mkdir -p torrents uploads
   ```

## Execução

Para iniciar o servidor em modo de desenvolvimento com auto-reload:
```
npm run dev
```

Para iniciar o servidor em modo de produção:
```
npm start
```

O servidor será iniciado na porta 3000 por padrão. Acesse em seu navegador:
```
http://localhost:3000
```

## Estrutura do Projeto

```
/torrent-streamer
├─ /torrents            # pasta para arquivos .torrent
├─ /uploads             # uploads temporários
├─ /public              # assets estáticos (CSS, JS)
│  ├─ /css
│  └─ /js  
├─ /routes              # rotas da API
│  ├─ torrents.js
│  └─ stream.js
├─ /controllers         # controladores
│  ├─ torrentController.js
│  └─ streamController.js
├─ /services            # lógica de negócios
│  ├─ torrentService.js
│  └─ streamService.js
├─ /utils               # utilitários
│  └─ helpers.js
├─ /views               # views HTML
│  └─ index.html
├─ /config              # configurações
│  └─ server.js
├─ server.js            # arquivo principal
└─ package.json
```

## Uso

1. **Upload de Torrents**
   - Clique no botão "Upload" na interface
   - Selecione um arquivo .torrent do seu computador
   - Escolha uma categoria e confirme

2. **Ativação de Streaming**
   - Selecione os torrents que deseja ativar com as caixas de seleção
   - Clique em "Ativar Selecionados" ou use o botão "Ativar" individual
   - Os links de streaming serão gerados automaticamente

3. **Streaming de Conteúdo**
   - Copie o link de streaming gerado
   - Use o link em qualquer player compatível com streaming HTTP
   - O link também pode ser acessado diretamente no navegador

## Configuração

As configurações podem ser ajustadas no arquivo `config/server.js`:

- Porta do servidor
- Pasta de torrents
- Categorias disponíveis
- Configurações de cache
- Tempo de inatividade

## Notas Importantes

- A aplicação realiza apenas streaming, sem salvar o conteúdo completo no disco
- Certifique-se de ter largura de banda suficiente para streaming
- Considere implicações legais dependendo do conteúdo compartilhado
- A aplicação não provê recursos de VPN ou anonimato

## Licença

MIT
