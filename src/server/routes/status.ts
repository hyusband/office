import { FastifyInstance } from 'fastify';
import { StatusUpdateRequest } from '../../shared/types.js';
import { DiscordService } from '../services/discord.js';
import { dbService } from '../services/database.js';
import { botService } from '../services/bot.js';
import { aiService } from '../services/ai.js';

export default async function statusRoutes(fastify: FastifyInstance) {

    fastify.post('/status', async (request, reply) => {
        const { state, userId } = request.body as StatusUpdateRequest;

        if (!state || !userId) {
            return reply.status(400).send({ error: 'Missing state or userId' });
        }

        const config = await dbService.getUserConfig(userId);
        const webhookUrl = config?.webhookUrl || process.env.DISCORD_WEBHOOK_URL;

        await dbService.saveStatus(userId, state);

        if (state.status === 'coding' || state.status === 'busy') {
            const aiSummary = await aiService.generateCreativeStatus(state.activity || state.status, state.metadata);
            if (aiSummary) {
                state.metadata = { ...state.metadata, aiSummary };
            }
        }

        botService.updateUserState(userId, state);

        if (webhookUrl) {
            const discordService = new DiscordService(webhookUrl);
            await discordService.notifyStatusChange(state);
        }

        return { success: true };
    });

    fastify.get('/analytics/:userId', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const stats = await dbService.getWeeklyStats(userId);
        return stats;
    });

    fastify.post('/config', async (request, reply) => {
        const { userId, webhookUrl, discordToken } = request.body as { userId: string, webhookUrl: string, discordToken?: string };
        if (!userId || !webhookUrl) return reply.status(400).send({ error: 'Missing fields' });

        await dbService.setUserConfig(userId, webhookUrl, discordToken);
        return { success: true };
    });

    fastify.get('/analytics/heatmap/:userId', async (request, reply) => {
        const { userId } = request.params as { userId: string };
        const data = await dbService.getHeatmapData(userId);
        return data;
    });

    fastify.get('/status/free', async (request, reply) => {
        const users = botService.getAvailableUsers();
        return users;
    });
}
