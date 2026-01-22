import OBSWebSocket from 'obs-websocket-js';
import logger from './logger.js';

export class OBSService {
    private obs = new OBSWebSocket();
    private isConnected = false;

    async connect(address = 'ws://127.0.0.1:4455', password?: string) {
        if (this.isConnected) return;
        try {
            await this.obs.connect(address, password);
            this.isConnected = true;
            logger.info('[OBS] Connected to OBS WebSocket');
        } catch (err) {
            logger.debug('[OBS] Failed to connect to OBS (Is it open?)');
        }
    }

    async setScene(sceneName: string) {
        if (!this.isConnected) {
            await this.connect();
            if (!this.isConnected) return;
        }

        try {
            await this.obs.call('SetCurrentProgramScene', { sceneName });
            logger.info(`[OBS] Switched to scene: ${sceneName}`);
        } catch (err) {
            logger.error('[OBS] Failed to set scene', { error: (err as Error).message });
        }
    }

    async isStreaming(): Promise<boolean> {
        if (!this.isConnected) return false;
        try {
            const { outputActive } = await this.obs.call('GetStreamStatus');
            return outputActive;
        } catch {
            return false;
        }
    }
}

export const obsService = new OBSService();
