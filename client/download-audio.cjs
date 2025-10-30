/**
 * Script para baixar assets de áudio gratuitos das bibliotecas recomendadas
 * Usando sons com licença comercial livre (CC0 ou CC-BY)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// URLs de sons gratuitos com licença comercial
// Estas são URLs diretas de arquivos CC0/CC-BY de bibliotecas públicas

const audioAssets = {
  music: [
    // Usando arquivos de exemplo CC0 de várias fontes
    { name: 'menu.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', desc: 'Menu music (SoundHelix CC-BY)' },
    { name: 'ranch.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', desc: 'Ranch music (SoundHelix CC-BY)' },
    { name: 'battle.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', desc: 'Battle music (SoundHelix CC-BY)' },
    { name: 'temple.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', desc: 'Temple music (SoundHelix CC-BY)' },
    { name: 'dungeon.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', desc: 'Dungeon music (SoundHelix CC-BY)' },
    { name: 'village.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', desc: 'Village music (SoundHelix CC-BY)' },
    { name: 'victory.mp3', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', desc: 'Victory jingle (SoundHelix CC-BY)' },
  ],
  sfx: [
    // Nota: Para SFX, vamos criar placeholders simples
    // O ideal é baixar de Freesound.org ou Mixkit manualmente
  ]
};

async function downloadFile(url, dest, description) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Baixando: ${description}...`);
    
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ ${path.basename(dest)} baixado com sucesso!`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Seguir redirect
        file.close();
        fs.unlinkSync(dest);
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(fs.createWriteStream(dest));
          fs.createWriteStream(dest).on('finish', () => {
            console.log(`✅ ${path.basename(dest)} baixado (redirect)!`);
            resolve();
          });
        });
      } else {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Status ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function downloadAllAssets() {
  console.log('🎵 Beast Keepers - Download de Assets de Áudio\n');
  console.log('📚 Usando bibliotecas gratuitas com licença comercial\n');
  
  const musicDir = path.join(__dirname, 'public', 'assets', 'audio', 'music');
  const sfxDir = path.join(__dirname, 'public', 'assets', 'audio', 'sfx');
  
  // Criar diretórios se não existirem
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
  }
  if (!fs.existsSync(sfxDir)) {
    fs.mkdirSync(sfxDir, { recursive: true });
  }
  
  console.log('📁 Diretórios criados/verificados\n');
  
  // Download músicas
  console.log('🎼 Baixando músicas...\n');
  for (const music of audioAssets.music) {
    const dest = path.join(musicDir, music.name);
    try {
      await downloadFile(music.url, dest, music.desc);
    } catch (err) {
      console.log(`⚠️  Falha ao baixar ${music.name}: ${err.message}`);
      console.log(`   💡 Baixe manualmente de Incompetech.com ou Mixkit.co\n`);
    }
  }
  
  console.log('\n🔊 Para SFX (efeitos sonoros):');
  console.log('   Recomendamos baixar manualmente de:');
  console.log('   1. https://mixkit.co/free-sound-effects/game/');
  console.log('   2. https://freesound.org (buscar: game ui, attack, etc.)\n');
  
  console.log('✅ Download de músicas completo!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Baixar SFX manualmente das bibliotecas recomendadas');
  console.log('   2. Salvar em: public/assets/audio/sfx/');
  console.log('   3. Recarregar o jogo e testar!');
  console.log('\n🎮 Divirta-se!\n');
}

downloadAllAssets().catch(err => {
  console.error('❌ Erro:', err);
});

