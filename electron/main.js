const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    show: false
  });

  // Set window title
  mainWindow.setTitle('Kings Contratos - Kings Agência');

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/client/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Contrato',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/create-contract';
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Navegar',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/dashboard';
            `);
          }
        },
        {
          label: 'Página Inicial',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              window.location.hash = '/';
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'Recarregar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        }
      ]
    },
    {
      label: 'Janela',
      submenu: [
        {
          label: 'Minimizar',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow.minimize();
          }
        },
        {
          label: 'Fechar',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            mainWindow.close();
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre Kings Contratos',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre Kings Contratos',
              message: 'Kings Contratos',
              detail: 'Sistema de gestão e assinatura de contratos\nVersão 1.0.0\n\nDesenvolvido por Kings Agência\nwww.kingsagencia.com.br'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Site da Kings Agência',
          click: () => {
            shell.openExternal('https://www.kingsagencia.com.br');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
