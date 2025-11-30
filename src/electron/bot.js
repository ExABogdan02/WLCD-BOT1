const { Client, GatewayIntentBits, EmbedBuilder, ChannelType } = require('discord.js');
const { app } = require('electron'); 
const path = require('path');

class DiscordBot {
    constructor() {
        this.client = new Client({ 
            intents: [
                GatewayIntentBits.Guilds, 
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ] 
        });
        
        this.token = null;

        const isDev = !app.isPackaged;

        if (isDev) {
            this.mediaPath = path.join(__dirname, '../media');
        } else {
            this.mediaPath = path.join(process.resourcesPath, 'media');
        }
        
        this.logoPath = path.join(this.mediaPath, 'WLCD.jpg');
        this.judgePath = path.join(this.mediaPath, 'Judge.jpg');
        
        console.log("DEBUG: Media Path set to:", this.mediaPath);
    }

    async login(token) {
        this.token = token;
        try {
            console.log("DEBUG: Attempting to log in...");
            const readyPromise = new Promise((resolve) => {
                this.client.once('ready', () => resolve());
            });
            await this.client.login(token);
            await readyPromise;
            console.log(`DEBUG: Logged in successfully as ${this.client.user.tag}`);
            return true;
        } catch (error) {
            console.error('DEBUG: Login failed:', error);
            return false;
        }
    }

    async getChannel(channelId) {
        if (!this.client.isReady()) throw new Error('Bot not ready');
        return await this.client.channels.fetch(channelId);
    }

    async getTextChannels() {
        if (!this.client.isReady()) return [];
        const guild = this.client.guilds.cache.first();
        if (!guild) return [];
        try {
            await guild.channels.fetch(); 
            return guild.channels.cache
                .filter(c => c.type === ChannelType.GuildText)
                .map(c => ({ id: c.id, name: c.name }))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            return [];
        }
    }

    async sendMessage(channelId, type, content, embedData, pollOptions, imagePath) {
        const channel = await this.getChannel(channelId);
        const files = imagePath ? [{ attachment: imagePath, name: 'attachment.png' }] : [];

        if (type === 'embed') {
            const embed = new EmbedBuilder()
                .setDescription(content || null)
                .setColor(embedData.color || '#5865F2');
            
            if (embedData.title) embed.setTitle(embedData.title);
            if (imagePath) embed.setImage('attachment://attachment.png');

            return await channel.send({ embeds: [embed], files: files });
        } 
        
        if (type === 'poll') {
            await channel.send({
                poll: {
                    question: { text: content },
                    answers: pollOptions.map(opt => ({ text: opt.text })),
                    duration: 24,
                }
            });
            if (imagePath) await channel.send({ files: files });
            return;
        } 

        return await channel.send({ content: content, files: files });
    }

    async createProspectThread(channelId, threadName, content, emoji, imagePath) {
        console.log(`DEBUG: Creating thread in ${channelId}`);
        const channel = await this.getChannel(channelId);
        
        const thread = await channel.threads.create({
            name: threadName,
            autoArchiveDuration: 1440,
            type: ChannelType.PublicThread,
            reason: 'Prospect Review App'
        });

        await thread.send({ 
            files: [{ attachment: this.judgePath, name: 'Judge.jpg' }] 
        });

        const userFiles = imagePath ? [{ attachment: imagePath, name: 'evidence.png' }] : [];
        const message = await thread.send({ content: content, files: userFiles });
        
        if (emoji) await message.react(emoji);
        
        return thread;
    }
}

module.exports = new DiscordBot();