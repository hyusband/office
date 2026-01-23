import axios from 'axios';
import logger from './logger.js';
import { AvailabilityState } from '../../shared/types.js';
import fs from 'fs';
import path from 'path';

const QUEUE_FILE = path.join(process.cwd(), 'pending_status.json');

class QueueService {
    private queue: { state: AvailabilityState, userId: string }[] = [];

    constructor() {
        this.loadQueue();
    }

    private loadQueue() {
        if (fs.existsSync(QUEUE_FILE)) {
            try {
                this.queue = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
                logger.info(`[Queue] Loaded ${this.queue.length} pending updates from disk`);
            } catch (err) {
                logger.error('[Queue] Failed to load queue from disk', { error: (err as Error).message });
            }
        }
    }

    private saveQueue() {
        try {
            fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
        } catch (err) {
            logger.error('[Queue] Failed to save queue to disk', { error: (err as Error).message });
        }
    }

    async enqueue(userId: string, state: AvailabilityState, apiUrl: string) {
        this.queue.push({ state, userId });
        this.saveQueue();
        await this.processQueue(apiUrl);
    }

    async processQueue(apiUrl: string) {
        if (this.queue.length === 0) return;

        logger.info(`[Queue] Attempting to sync ${this.queue.length} pending updates...`);

        const remaining: typeof this.queue = [];
        let successCount = 0;

        for (const item of this.queue) {
            try {
                await axios.post(`${apiUrl}/status`, item);
                successCount++;
            } catch (err) {
                remaining.push(item);
                logger.error(`[Queue] Sync failed for state ${item.state.status}. Keeping in queue.`);
            }
        }

        this.queue = remaining;
        this.saveQueue();

        if (successCount > 0) {
            logger.info(`[Queue] Successfully synced ${successCount} updates.`);
        }
    }
}

export const queueService = new QueueService();
