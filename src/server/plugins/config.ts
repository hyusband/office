import fp from 'fastify-plugin';
import fastifyEnv from '@fastify/env';

const schema = {
    type: 'object',
    required: ['DISCORD_WEBHOOK_URL'],
    properties: {
        PORT: { type: 'string', default: '3000' },
        DISCORD_WEBHOOK_URL: { type: 'string' },
        NODE_ENV: { type: 'string', default: 'development' }
    }
};

export default fp(async (fastify) => {
    fastify.register(fastifyEnv, {
        confKey: 'config',
        schema: schema,
        dotenv: true
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        config: {
            PORT: string;
            DISCORD_WEBHOOK_URL: string;
            NODE_ENV: string;
        };
    }
}
