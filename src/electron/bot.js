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
            ],

            allowedMentions: {
                parse: ['users', 'roles', 'everyone'],
                repliedUser: true
            }
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
        
        console.log("DEBUG: Media Path calculated as:", this.mediaPath);
    }

    async login(token) {
        this.token = token;
        try {
            console.log("DEBUG: Attempting to log in...");
            
            
            const readyPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Login timeout after 10 seconds'));
                }, 10000);
                
                this.client.once('ready', () => {
                    clearTimeout(timeout);
                    console.log(`DEBUG: Bot is ready! User: ${this.client.user.tag}`);
                    console.log(`DEBUG: Guilds cached: ${this.client.guilds.cache.size}`);
                    resolve();
                });
            });
            
            await this.client.login(token);
            await readyPromise;
            
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log(`DEBUG: Login complete. Guilds available: ${this.client.guilds.cache.size}`);
            return true;
        } catch (error) {
            console.error('DEBUG: Login failed:', error.message);
            return false;
        }
    }

    async getGuildMembers(guildId) {
        if (!this.client.isReady()) return [];
        try {
            const guild = this.client.guilds.cache.get(guildId);  
            if (!guild) return [];

           
            await guild.members.fetch();  

            return guild.members.cache
                .filter(m => !m.user.bot) 
                .map(m => ({
                    id: m.user.id,
                    username: m.user.username,
                    displayName: m.displayName,
                    tag: m.user.tag
                }))
                .sort((a, b) => a.displayName.localeCompare(b.displayName));
        } catch (error) {
            console.error("DEBUG: Error fetching members:", error);
            return [];
        }
    }

    async getGuilds() {
        if (!this.client.isReady()) {
            console.log("DEBUG: Client not ready yet");
            return [];
        }
        
        try {
            
            await this.client.guilds.fetch();
            
            const guilds = this.client.guilds.cache.map(g => ({
                id: g.id,
                name: g.name
            }));
            
            console.log(`DEBUG: Found ${guilds.length} guilds:`, guilds);
            return guilds;
         } catch (error) {
            console.error('DEBUG: Error fetching guilds:', error);
            return [];
         }
    }

    async getChannel(channelId) {
        if (!this.client.isReady()) throw new Error('Bot not ready');
        return await this.client.channels.fetch(channelId);
    }

    async getTextChannels(guildId) {
        if (!this.client.isReady()) return [];
        try {
            
            const guild = this.client.guilds.cache.get(guildId);  // ← also fixed here for consistency
            if (!guild) return [];

            await guild.channels.fetch(); 
            return guild.channels.cache
                .filter(c => c.type === ChannelType.GuildText)
                .map(c => ({ id: c.id, name: c.name }))
                .sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            console.error("DEBUG: Error fetching channels:", error);
            return [];
        }
    }

    async sendMessage(channelId, type, content, embedData, pollOptions, imagePath, pollDuration) {
        const channel = await this.getChannel(channelId);
        const files = imagePath ? [{ attachment: imagePath, name: 'attachment.png' }] : [];

        const allowedMentions = {
            parse: ['users', 'roles', 'everyone']
        };

        if (type === 'embed') {
            const embed = new EmbedBuilder()
                .setDescription(content || null)
                .setColor(embedData.color || '#5865F2');
            
            if (embedData.title) embed.setTitle(embedData.title);
            if (imagePath) embed.setImage('attachment://attachment.png');

            return await channel.send({ 
                embeds: [embed], 
                files: files, 
                allowedMentions: allowedMentions
            });
        } 
        
        if (type === 'poll') {
            await channel.send({
                poll: {
                    question: { text: content },
                    answers: pollOptions.map(opt => ({ text: opt.text })),
                    duration: pollDuration || 24, 
                },
                allowedMentions: allowedMentions
            });
            if (imagePath) await channel.send({ files: files, allowedMentions: allowedMentions });
            return;
        } 

        return await channel.send({ content: content, files: files, allowedMentions: allowedMentions });
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
            files: [{ attachment: this.judgePath, name: 'judge.jpg' }], 
            allowedMentions: allowedMentions
        });

        
        const userFiles = imagePath ? [{ attachment: imagePath, name: 'evidence.png' }] : [];
        const message = await thread.send({ content: content, files: userFiles, allowedMentions: allowedMentions });
        
        if (emoji) await message.react(emoji);
        
        return thread;
    }
}

module.exports = new DiscordBot();