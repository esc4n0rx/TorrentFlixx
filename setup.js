
const fs = require('fs-extra');
const path = require('path');


const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m"
};


function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}


const dirs = [
  './torrents',
  './uploads',
  './public/css',
  './public/js',
  './public/img',
  './views',
  './docs'
];


const sampleTorrentUrl = 'https://webtorrent.io/torrents/sintel.torrent';

async function init() {
  console.log(colorize('green', '╔═══════════════════════════════════════════════╗'));
  console.log(colorize('green', '║       Torrent Streamer - Configuração         ║'));
  console.log(colorize('green', '╚═══════════════════════════════════════════════╝'));
  console.log();

  try {

    console.log(colorize('yellow', '✓ Criando diretórios...'));
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
      console.log(`  - ${dir} ${colorize('green', '✓')}`);
    }
    
    console.log(colorize('yellow', '\n✓ Verificando arquivos estáticos...'));
    
    const cssExists = await fs.pathExists('./public/css/terminal.css');
    const jsExists = await fs.pathExists('./public/js/app.js');
    
    if (!cssExists || !jsExists) {
      console.log(colorize('red', '  - Alguns arquivos estáticos estão faltando!'));
      console.log(colorize('yellow', '  - Por favor, verifique se os arquivos CSS e JS foram criados corretamente.'));
    } else {
      console.log(`  - Arquivos CSS e JS ${colorize('green', '✓')}`);
    }
    
    console.log(colorize('yellow', '\n✓ Verificando arquivos de exemplo...'));
    
    const hasTorrents = await fs.pathExists('./torrents') && 
                         (await fs.readdir('./torrents')).filter(f => f.endsWith('.torrent')).length > 0;
    
    if (!hasTorrents) {
      console.log('  - Não foram encontrados arquivos .torrent de exemplo.');
      console.log('  - Baixe manualmente alguns arquivos .torrent para a pasta "torrents".');
      console.log(`  - Sugestão: ${colorize('cyan', sampleTorrentUrl)}`);
    } else {
      console.log(`  - Arquivos .torrent já existem ${colorize('green', '✓')}`);
    }
    
    console.log(colorize('yellow', '\n✓ Verificando dependências...'));
    
    const packageJsonExists = await fs.pathExists('./package.json');
    if (!packageJsonExists) {
      console.log(colorize('red', '  - package.json não encontrado! Isso é crítico.'));
    } else {
      console.log(`  - package.json ${colorize('green', '✓')}`);
      try {
        const packageJson = await fs.readJson('./package.json');
        const deps = packageJson.dependencies || {};
        
        const requiredDeps = ['express', 'webtorrent', 'multer', 'cors', 'compression'];
        const missingDeps = requiredDeps.filter(dep => !deps[dep]);
        
        if (missingDeps.length > 0) {
          console.log(colorize('red', `  - Dependências faltando: ${missingDeps.join(', ')}`));
          console.log(colorize('yellow', '  - Execute: npm install'));
        } else {
          console.log(`  - Todas as dependências necessárias ${colorize('green', '✓')}`);
        }
      } catch (err) {
        console.log(colorize('red', `  - Erro ao ler package.json: ${err.message}`));
      }
    }
    
    console.log(colorize('yellow', '\n✓ Verificando estrutura do servidor...'));
    
    const serverExists = await fs.pathExists('./server.js');
    if (!serverExists) {
      console.log(colorize('red', '  - server.js não encontrado! Isso é crítico.'));
    } else {
      console.log(`  - server.js ${colorize('green', '✓')}`);
    }
    
    console.log(colorize('green', '\n╔═══════════════════════════════════════════════╗'));
    console.log(colorize('green', '║              Próximos passos                   ║'));
    console.log(colorize('green', '╚═══════════════════════════════════════════════╝'));
    console.log();
    console.log('1. Instale as dependências:');
    console.log(colorize('cyan', '   npm install'));
    console.log();
    console.log('2. Inicie o servidor:');
    console.log(colorize('cyan', '   npm start    (produção)'));
    console.log(colorize('cyan', '   npm run dev  (desenvolvimento)'));
    console.log();
    console.log('3. Acesse a interface:');
    console.log(colorize('cyan', '   http://localhost:3000'));
    console.log();
    
  } catch (error) {
    console.error(colorize('red', 'Erro durante a inicialização:'), error);
    process.exit(1);
  }
}


init().catch(console.error);