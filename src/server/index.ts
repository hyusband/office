import Fastify from 'fastify';
import cors from '@fastify/cors';
import configPlugin from './plugins/config.js';
import statusRoutes from './routes/status.js';
import { botService } from './services/bot.js';
import { reporterService } from './services/reporter.js';

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty'
        }
    }
});

const start = async () => {
    try {
        await fastify.register(configPlugin);
        await fastify.register(cors, { origin: true });
        await fastify.register(statusRoutes);

        fastify.get('/health', async () => ({ status: 'ok' }));

        const port = Number(process.env.PORT) || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });

        // Start Discord Bot if token is provided
        if (process.env.DISCORD_BOT_TOKEN) {
            await botService.start(process.env.DISCORD_BOT_TOKEN);
        }

        reporterService.start();

        console.log(`\n🚀 Server ready at http://localhost:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
