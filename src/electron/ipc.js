const { ipcMain, dialog } = require('electron'); 
const bot = require('./bot'); 

function setupIpcHandlers() {

    //LOGIN
    ipcMain.handle('login-bot', async (event, token) => {
        return await bot.login(token); 
    });

    //GET CHANNELS
    ipcMain.handle('get-channels', async () => {
        return await bot.getTextChannels();
    });

    //Select Image Dialog
    ipcMain.handle('select-image', async () => {
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

    //Send Message
    ipcMain.handle('send-discord-msg', async (event, data) => {
        try {
            const { channelId, type, content, embedData, pollOptions, imagePath } = data;
            await bot.sendMessage(channelId, type, content, embedData, pollOptions, imagePath);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    //Create Prospect Thread
    ipcMain.handle('create-prospect-thread', async (event, data) => {
        try {
            const { channelId, threadName, content, emoji, imagePath } = data;
            
            // Pass the imagePath to the bot function
            await bot.createProspectThread(channelId, threadName, content, emoji, imagePath);
            
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });
}

module.exports = { setupIpcHandlers };