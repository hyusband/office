import { FastifyInstance } from 'fastify';
import { StatusUpdateRequest, AvailabilityState } from '../../shared/types.js';
import { DiscordService } from '../services/discord.js';

let currentState: Record<string, AvailabilityState> = {};

export default async function statusRoutes(fastify: FastifyInstance) {
    const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

    fastify.get('/status', async (request) => {
        const { userId } = request.query as { userId?: string };
        if (userId) return currentState[userId] || { error: 'Not found' };
        return currentState;
    });

    fastify.post('/status', async (request, reply) => {
        const { state, userId } = request.body as StatusUpdateRequest;

        if (!state || !userId) {
            return reply.status(400).send({ error: 'Missing state or userId' });
        }

        currentState[userId] = state;

        await discordService.notifyStatusChange(state);

        return { success: true, timestamp: Date.now() };
    });
}
