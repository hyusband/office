import { execSync } from 'child_process';
import logger from './logger.js';

const DISTRACTORS = ['Steam.exe', 'Telegram.exe', 'Discord.exe', 'Spotify.exe'];

export class AutomationService {
    private closedProcesses: string[] = [];

    async blockDistractors() {
        try {
            const taskList = execSync('tasklist /fo csv', { encoding: 'utf8' });
            for (const app of DISTRACTORS) {
                if (taskList.toLowerCase().includes(app.toLowerCase())) {
                    logger.info(`[Automation] Closing distractor: ${app}`);
                    execSync(`taskkill /F /IM ${app}`, { stdio: 'ignore' });
                    if (!this.closedProcesses.includes(app)) {
                        this.closedProcesses.push(app);
                    }
                }
            }
        } catch (err) {
            logger.error('[Automation] Error blocking distractors', { error: (err as Error).message });
        }
    }

    async unblockDistractors() {
        if (this.closedProcesses.length === 0) return;

        logger.info(`[Automation] Reopening distractors: ${this.closedProcesses.join(', ')}`);

        for (const app of this.closedProcesses) {
            try {
                logger.debug(`[Automation] Attempting to restart ${app}`);
                execSync(`start ${app.replace('.exe', '')}`, { stdio: 'ignore', shell: true });
            } catch (err) {
                logger.error(`[Automation] Failed to restart ${app}`);
            }
        }
        this.closedProcesses = [];
    }
}

export const automationService = new AutomationService();
