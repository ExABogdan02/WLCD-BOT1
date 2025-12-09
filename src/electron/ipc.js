const { ipcMain, dialog } = require('electron'); 
const bot = require('./bot'); 

function setupIpcHandlers() {

    
    const safeHandle = (channel, handler) => {
        ipcMain.removeHandler(channel); 
        ipcMain.handle(channel, handler);
    };

    
    safeHandle('login-bot', async (event, token) => {
        return await bot.login(token); 
    });

    
    safeHandle('get-guilds', async () => {
        return await bot.getGuilds();
    });

    
    safeHandle('get-channels', async (event, guildId) => {
        return await bot.getTextChannels(guildId);
    });

    
    safeHandle('select-image', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg', 'webp'] }
            ]
        });
        
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });

    
    safeHandle('send-discord-msg', async (event, data) => {
        try {
            const { channelId, type, content, embedData, pollOptions, imagePath, pollDuration } = data;
            
            await bot.sendMessage(channelId, type, content, embedData, pollOptions, imagePath, pollDuration);
            
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    // FIXED: typo "ger-members" → "get-members"
    safeHandle('get-members', async (event, guildId) => {
        return await bot.getGuildMembers(guildId);
    });

    
    safeHandle('create-prospect-thread', async (event, data) => {
        try {
            const { channelId, threadName, content, emoji, imagePath } = data;
            
            await bot.createProspectThread(channelId, threadName, content, emoji, imagePath);
            
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
}

module.exports = { setupIpcHandlers };