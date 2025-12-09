const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('./ipc');
const bot = require('./bot');

const IS_DEV = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "WildCards Admin Tool",
        backgroundColor: '#121212',
        icon: IS_DEV 
            ? path.join(__dirname, '../media/WLCD.jpg')
            : path.join(process.resourcesPath, 'media/WLCD.jpg'),
        webPreferences: {
            
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            devTools: true 
        }
    });

    win.setMenuBarVisibility(false);

    if (IS_DEV) {
        win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
    } else {
        const indexPath = path.join(__dirname, '../../build/index.html');
        
        win.loadFile(indexPath).catch(e => {
            console.error('Failed to load app:', e);
        });
        
        
        win.webContents.openDevTools(); 
    }
}

app.whenReady().then(() => {
    try {
        setupIpcHandlers();
        createWindow();
    } catch (e) {
        dialog.showErrorBox("Startup Error", e.message);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});