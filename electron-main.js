const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple experimentation only
        },
    });

    // Load the Next.js app
    // We accept a URL argument or default to localhost:3000
    const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';

    console.log(`Loading URL: ${startUrl}`);
    win.loadURL(startUrl);

    // Open the DevTools.
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
