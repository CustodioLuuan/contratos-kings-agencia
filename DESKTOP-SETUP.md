# 🖥️ Kings Contratos Desktop - Guia de Instalação

## Para Usuários Finais

### ⬇️ Download e Instalação

1. **Baixe o instalador**
   - Execute: `npm run build-desktop`
   - Localize o arquivo: `dist-electron/Kings-Contratos-Setup.exe`

2. **Instale o aplicativo**
   - Execute o arquivo `Kings-Contratos-Setup.exe`
   - Siga as instruções do instalador
   - Escolha o diretório de instalação (opcional)
   - Clique em "Instalar"

3. **Primeira execução**
   - Um atalho será criado na área de trabalho
   - O aplicativo também estará disponível no Menu Iniciar
   - Abra o "Kings Contratos"

### 🎯 Funcionalidades do Desktop

- **Interface Nativa**: Experiência completa de aplicativo Windows
- **Atalhos de Teclado**:
  - `Ctrl+N`: Novo Contrato
  - `Ctrl+D`: Dashboard  
  - `Ctrl+H`: Página Inicial
  - `Ctrl+R`: Recarregar
- **Menu de Aplicativo**: Acesso rápido a todas as funções
- **Janela Redimensionável**: Adapta-se ao seu fluxo de trabalho

## Para Desenvolvedores

### 🛠️ Setup de Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento (web + desktop)
npm run electron-dev

# Build completo para desktop
npm run build-desktop
```

### 📦 Estrutura dos Arquivos

```
projeto/
├── electron/
│   ├── main.js          # Processo principal do Electron
│   ├── preload.js       # Script de segurança
│   └── assets/
│       └── icon.png     # Ícone do aplicativo
├── dist-electron/       # Build final do desktop
├── build-desktop.js     # Script de build automatizado
└── README-DESKTOP.md    # Documentação
```

### 🚀 Scripts Disponíveis

- `npm run electron-dev`: Desenvolvimento com hot-reload
- `npm run build-desktop`: Build completo + instalador
- `npm run electron`: Executar Electron (requer build)
- `npm run electron-pack`: Apenas empacotamento Electron

### 🔧 Configurações do Build

O arquivo `package.json` contém configurações para:
- **Windows**: Instalador NSIS (.exe)
- **macOS**: Arquivo DMG (futuro)
- **Linux**: AppImage (futuro)

## 📋 Requisitos do Sistema

### Mínimos
- Windows 10 (64-bit)
- 4GB RAM
- 200MB espaço livre
- Conexão com internet

### Recomendados
- Windows 11
- 8GB RAM
- SSD
- Conexão estável

## 🐛 Solução de Problemas

### Erro de Instalação
- Execute como administrador
- Desative temporariamente o antivírus
- Verifique espaço em disco

### App não abre
- Verifique se todos os arquivos foram instalados
- Reinstale o aplicativo
- Contate o suporte técnico

### Performance lenta
- Feche outros programas
- Verifique conexão com internet
- Reinicie o aplicativo

## 📞 Suporte

- **Site**: https://www.kingsagencia.com.br
- **Email**: contato@kingsagencia.com.br
- **Documentação**: README-DESKTOP.md

---

**Kings Contratos Desktop v1.0.0**  
*Desenvolvido com ❤️ pela Kings Agência*
