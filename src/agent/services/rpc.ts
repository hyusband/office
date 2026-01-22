import DiscordRPC from 'discord-rpc';
import logger from './logger.js';

const clientId = 'not-set';

export class RPCService {
    private client: DiscordRPC.Client | null = null;
    private isConnected = false;

    constructor() {
        
    }

    async connect() {
        if (this.isConnected) return;

        try {
            this.client = new DiscordRPC.Client({ transport: 'ipc' });

            this.client.on('ready', () => {
                this.isConnected = true;
                logger.info('[RPC] Discord RPC connected');
            });

            await this.client.login({ clientId }).catch(err => {
                logger.debug('[RPC] Failed to connect to local Discord client');
            });
        } catch (err) {
            // Silently fail if Discord is not open
        }
    }

    async update(details: string, state: string, largeImageKey = 'vscode', largeImageText = 'VS Code') {
        if (!this.isConnected || !this.client) {
            await this.connect();
            if (!this.isConnected) return;
        }

        try {
            await this.client.setActivity({
                details,
                state,
                startTimestamp: Date.now(),
                largeImageKey,
                largeImageText,
                instance: false,
                buttons: [
                    { label: 'View Profile', url: `https://github.com/${process.env.USER_ID || 'hyusband'}` }
                ]
            });
        } catch (err) {
            logger.error('[RPC] Update failed', { error: (err as Error).message });
        }
    }

    async clear() {
        if (this.client) {
            await this.client.clearActivity().catch(() => { });
        }
    }
}

export const rpcService = new RPCService();
