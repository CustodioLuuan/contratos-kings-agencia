const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do Kings Contratos Desktop...\n');

try {
  // Step 1: Build the web app for Electron
  console.log('📦 1/3 - Fazendo build da aplicação web...');
  process.env.ELECTRON = 'true';
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build da aplicação concluído!\n');

  // Step 2: Copy electron files
  console.log('📁 2/3 - Preparando arquivos do Electron...');
  
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Copy main.js to dist
  if (fs.existsSync('electron/main.js')) {
    fs.copyFileSync('electron/main.js', 'dist/main.js');
  }
  
  // Copy preload.js to dist
  if (fs.existsSync('electron/preload.js')) {
    fs.copyFileSync('electron/preload.js', 'dist/preload.js');
  }
  
  console.log('✅ Arquivos do Electron preparados!\n');

  // Step 3: Build desktop app
  console.log('🔨 3/3 - Criando executável para Windows...');
  execSync('electron-builder --win', { stdio: 'inherit' });
  console.log('✅ Aplicativo desktop criado com sucesso!\n');

  console.log('🎉 Build completo!');
  console.log('📁 Arquivos disponíveis em: dist-electron/');
  console.log('💾 Instalador: dist-electron/Kings-Contratos-Setup.exe');
  console.log('\n🚀 O Kings Contratos Desktop está pronto para distribuição!');

} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
