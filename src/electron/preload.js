const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    
    loginBot: (token) => ipcRenderer.invoke('login-bot', token),
    
    getGuilds: () => ipcRenderer.invoke('get-guilds'),
    getChannels: (guildId) => ipcRenderer.invoke('get-channels', guildId),
    
    getMembers: (guildId) => ipcRenderer.invoke('get-members', guildId),
    
    sendMessage: (data) => ipcRenderer.invoke('send-discord-msg', data),
    createThread: (data) => ipcRenderer.invoke('create-prospect-thread', data),
    selectImage: () => ipcRenderer.invoke('select-image')
});