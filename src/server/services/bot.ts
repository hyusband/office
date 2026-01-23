import { Client, GatewayIntentBits } from 'discord.js';
import { AvailabilityState } from '../../shared/types.js';

export class BotService {
    private client: Client;
    private userStates: Record<string, AvailabilityState> = {};

    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            const isMentioned = message.mentions.users.has(this.client.user?.id || '');
            const isDM = !message.guild;

            if (isMentioned || isDM) {
                const ownerId = process.env.USER_ID || 'dev-user';
                const state = this.userStates[ownerId];

                if (state && (state.status === 'busy' || state.status === 'meeting' || state.status === 'away')) {
                    const reply = `🤖 **Auto-Reply**: Hyusband is currently **${state.status}** (${state.activity || 'no details'}). I'll notify them when they are available!`;
                    await message.reply(reply);
                }
            }
        });
    }

    async start(token: string) {
        try {
            await this.client.login(token);
            console.log(`[Bot] Logged in as ${this.client.user?.tag}`);
        } catch (err) {
            console.error('[Bot] Failed to login:', (err as Error).message);
        }
    }

    updateUserState(userId: string, state: AvailabilityState) {
        this.userStates[userId] = state;
    }

    getAvailableUsers() {
        return Object.entries(this.userStates)
            .filter(([_, state]) => state.status === 'available' || state.status === 'coding')
            .map(([userId, state]) => ({ userId, status: state.status, activity: state.activity }));
    }

    async sendPrivateReport(userId: string, content: string) {
        try {
            const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;
            if (logChannelId) {
                const channel = await this.client.channels.fetch(logChannelId);
                if (channel?.isTextBased()) {
                    await (channel as any).send({
                        content: `📊 **Daily Standup Report for ${userId}**\n\n${content}`
                    });
                }
            } else {
                console.log(`[Bot] Report for ${userId}: ${content}`);
            }
        } catch (err) {
            console.error('[Bot] Failed to send report', (err as Error).message);
        }
    }
}

export const botService = new BotService();
