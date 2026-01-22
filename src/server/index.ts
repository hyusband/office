import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DiscordService } from './services/discord.js';
import { StatusUpdateRequest } from '../shared/types.js';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const discordService = new DiscordService(process.env.DISCORD_WEBHOOK_URL);

fastify.register(cors, {
    origin: true
});

fastify.get('/health', async () => {
    return { status: 'ok' };
});

fastify.post('/status', async (request, reply) => {
    const { state, userId } = request.body as StatusUpdateRequest;

    if (!state || !userId) {
        return reply.status(400).send({ error: 'Missing state or userId' });
    }

    console.log(`[Server] Update from ${userId}: ${state.status} (${state.activity || 'No activity'})`);

    await discordService.notifyStatusChange(state);

    return { success: true, timestamp: Date.now() };
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
