import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, globalShortcut } from 'electron';
import path from 'path';
import { ClipboardManager } from './clipboardManager';
import Store from './store';

let tray: Tray | null = null;
let window: BrowserWindow | null = null;
let clipboardManager: ClipboardManager;
let store: Store;

const createWindow = () => {
  window = new BrowserWindow({
    width: 400,
    height: 500,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: false,
    fullscreenable: false, // Prevent from going fullscreen
    type: 'panel', // Use panel type for overlay behavior
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set visible on all workspaces after window creation
  window.setVisibleOnAllWorkspaces(true);

  const htmlPath = path.join(__dirname, 'renderer/index.html');
  console.log('Loading HTML from:', htmlPath);
  
  window.loadFile(htmlPath).catch(err => {
    console.error('Failed to load HTML:', err);
  });

  // Auto-hide on blur, but with better logic to avoid disrupting fullscreen apps
  window.on('blur', () => {
    // Use an even longer timeout to allow for user interaction in fullscreen mode
    setTimeout(() => {
      if (window && !window.isDestroyed() && !window.isFocused() && window.isVisible()) {
        console.log('Window blurred, hiding...');
        window.hide();
      }
    }, 3000); // Longer delay to account for fullscreen interaction
  });

  // Handle window focus events
  window.on('focus', () => {
    console.log('Window focused');
  });

  window.on('show', () => {
    console.log('Window shown');
  });

  window.on('hide', () => {
    console.log('Window hidden');
    // Reset always on top when hidden to avoid interference
    if (window && !window.isDestroyed()) {
      window.setAlwaysOnTop(false);
    }
  });
  
  // Debug: show dev tools on creation
  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: 'detach' });
  }
};

const createTray = () => {
  // Load icon with proper path handling
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'assets/icon-v3.png')
    : path.join(__dirname, '../../assets/icon-v3.png');
  
  let icon = nativeImage.createFromPath(iconPath);
  
  // If icon not found, create an empty one
  if (icon.isEmpty()) {
    console.log('Icon not found, using empty icon');
    icon = nativeImage.createEmpty();
  }
  
  // For macOS, we can use text if icon doesn't work
  tray = new Tray(icon);
  tray.setTitle('📋'); // Use emoji as fallback
  tray.setToolTip('ClipFakeBook');
  
  // Click on tray icon shows window
  tray.on('click', () => {
    try {
      console.log('Tray clicked');
      toggleWindow();
    } catch (error) {
      console.error('Error in tray click handler:', error);
    }
  });

  // Also handle double-click for better reliability
  tray.on('double-click', () => {
    try {
      console.log('Tray double-clicked');
      toggleWindow();
    } catch (error) {
      console.error('Error in tray double-click handler:', error);
    }
  });

  // Right click shows context menu
  tray.on('right-click', () => {
    const showInDock = store.getShowInDock();
    const contextMenu = Menu.buildFromTemplate([
      { label: '清除歷史', click: () => store.clearHistory() },
      { type: 'separator' },
      { 
        label: showInDock ? '從 Dock 隱藏' : '在 Dock 顯示', 
        click: () => toggleDockVisibility() 
      },
      { type: 'separator' },
      { label: '退出', click: () => app.quit() }
    ]);
    tray?.popUpContextMenu(contextMenu);
  });
};

const toggleWindow = () => {
  if (!window) {
    console.error('Window is not created');
    return;
  }

  console.log('Toggle window, current visible:', window.isVisible());

  if (window.isVisible()) {
    window.hide();
  } else {
    const position = getWindowPosition();
    window.setPosition(position.x, position.y, false);
    
    // Use the highest level to show over all fullscreen apps
    window.setAlwaysOnTop(true, 'pop-up-menu');
    window.show();
    
    // Focus the window to ensure it's interactive
    window.focus();
    
    // Downgrade to modal-panel level after a short delay 
    setTimeout(() => {
      if (window && !window.isDestroyed() && window.isVisible()) {
        window.setAlwaysOnTop(true, 'modal-panel');
      }
    }, 2000);
    
    // Final downgrade to floating level
    setTimeout(() => {
      if (window && !window.isDestroyed() && window.isVisible()) {
        window.setAlwaysOnTop(true, 'floating');
      }
    }, 5000);
    
    // Remove always on top completely after extended user interaction time
    setTimeout(() => {
      if (window && !window.isDestroyed()) {
        window.setAlwaysOnTop(false);
      }
    }, 10000);
    
    console.log('Window shown at position:', position);
  }
};

const getWindowPosition = () => {
  if (!tray || !window) return { x: 100, y: 100 };

  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();
  
  console.log('Tray bounds:', trayBounds);
  console.log('Window bounds:', windowBounds);

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x, y };
};

const toggleDockVisibility = () => {
  const currentSetting = store.getShowInDock();
  const newSetting = !currentSetting;
  
  store.setShowInDock(newSetting);
  
  if (newSetting) {
    app.dock?.show();
  } else {
    app.dock?.hide();
  }
  
  console.log('Dock visibility toggled:', newSetting ? 'shown' : 'hidden');
};

const setupGlobalShortcuts = () => {
  // 先取消註冊所有快捷鍵
  globalShortcut.unregisterAll();
  
  // 註冊全域快捷鍵
  const ret = globalShortcut.register('CommandOrControl+Shift+V', () => {
    console.log('Global shortcut triggered');
    try {
      toggleWindow();
    } catch (error) {
      console.error('Error in global shortcut handler:', error);
    }
  });

  if (!ret) {
    console.log('Global shortcut registration failed');
    // 重試註冊
    setTimeout(() => {
      const retryRet = globalShortcut.register('CommandOrControl+Shift+V', () => {
        console.log('Global shortcut triggered (retry)');
        try {
          toggleWindow();
        } catch (error) {
          console.error('Error in global shortcut handler (retry):', error);
        }
      });
      console.log('Global shortcut retry registration:', retryRet);
    }, 1000);
  }

  // 檢查快捷鍵是否註冊成功
  console.log('Global shortcut registered:', globalShortcut.isRegistered('CommandOrControl+Shift+V'));
};

// IPC handlers
ipcMain.handle('get-clipboard-history', () => {
  return clipboardManager.getHistory();
});

ipcMain.handle('copy-to-clipboard', (_, content: string) => {
  clipboardManager.copyToClipboard(content);
  window?.hide();
});

ipcMain.handle('toggle-pin-item', (_, id: string) => {
  store.togglePinItem(id);
});

ipcMain.handle('delete-item', (_, id: string) => {
  return store.deleteItem(id);
});

ipcMain.handle('get-dock-setting', () => {
  return store.getShowInDock();
});

ipcMain.handle('set-dock-setting', (_, show: boolean) => {
  store.setShowInDock(show);
  if (show) {
    app.dock?.show();
  } else {
    app.dock?.hide();
  }
});

app.whenReady().then(() => {
  console.log('App is ready');
  
  // Initialize store and clipboard manager
  store = new Store();
  clipboardManager = new ClipboardManager(store);
  clipboardManager.start();

  createTray();
  createWindow();
  
  // Setup global shortcuts with a slight delay to ensure app is fully ready
  setTimeout(() => {
    setupGlobalShortcuts();
  }, 500);
  
  // Set initial dock visibility based on user preference
  const showInDock = store.getShowInDock();
  if (showInDock) {
    app.dock?.show();
  } else {
    app.dock?.hide();
  }
  
  console.log('Tray and window created');
});

// Re-register shortcuts when app becomes active (macOS specific)
app.on('activate', () => {
  console.log('App activated');
  if (!globalShortcut.isRegistered('CommandOrControl+Shift+V')) {
    console.log('Re-registering global shortcuts');
    setupGlobalShortcuts();
  }
});

app.on('window-all-closed', () => {
  // Don't quit on window close for menu bar apps
});

app.on('before-quit', () => {
  clipboardManager.stop();
  globalShortcut.unregisterAll();
});