const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    loginBot: (token) => ipcRenderer.invoke('login-bot', token),
    
    getChannels: () => ipcRenderer.invoke('get-channels'),
    
    sendMessage: (data) => ipcRenderer.invoke('send-discord-msg', data),
    createThread: (data) => ipcRenderer.invoke('create-prospect-thread', data),
    selectImage: () => ipcRenderer.invoke('select-image')
});