const { app, BrowserWindow } = require('electron');
const path = require('path');
const bot = require('./bot');
const { setupIpcHandlers } = require('./ipc');

const IS_DEV = !app.isPackaged;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "WildCards Admin Tool",
        backgroundColor: '#121212',
        
        icon: path.join(__dirname, '../media/WLCD.jpg'), 
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    
    win.setMenuBarVisibility(false);

    
    if (IS_DEV) {
        
        win.loadURL('http://localhost:3000');
        
        win.webContents.openDevTools(); 
    } else {
        
        const indexPath = path.join(app.getAppPath(), 'build', 'index.html');
        win.loadFile(indexPath).catch(e => console.error('Failed to load index.html:', e));
    }
}

app.whenReady().then(async () => {
    setupIpcHandlers();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});