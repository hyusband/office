import cron from 'node-cron';
import { dbService } from './database.js';
import { aiService } from './ai.js';
import { botService } from './bot.js';
import logger from '../../agent/services/logger.js';

export class ReporterService {
    start() {
        cron.schedule('0 19 * * *', async () => {
            logger.info('[Reporter] Starting daily standup generation cycle');
            await this.generateReportsForEveryone();
        });

        process.on('SIGUSR2', async () => {
            logger.info('[Reporter] Manual trigger received');
            await this.generateReportsForEveryone();
        });
    }

    async generateReportsForEveryone() {
        const userId = process.env.USER_ID || 'hyusband';
        const today = new Date().toISOString().split('T')[0];

        try {
            const activities = await dbService.getDailyActivity(userId, today);
            if (activities.length === 0) {
                logger.info(`[Reporter] No activity found for ${userId} today.`);
                return;
            }

            const standup = await aiService.generateDailyStandup(userId, activities);
            if (standup) {
                await botService.sendPrivateReport(userId, standup);
                logger.info(`[Reporter] Standup sent to ${userId}`);
            }
        } catch (err) {
            logger.error('[Reporter] Failed to generate/send reports', { error: (err as Error).message });
        }
    }
}

export const reporterService = new ReporterService();
