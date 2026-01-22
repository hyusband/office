import { execSync } from 'child_process';
import logger from './logger.js';

export async function checkForUpdates() {
    try {
        console.log('[Updater] Checking for updates...');

        execSync('git fetch', { stdio: 'ignore' });
        const local = execSync('git rev-parse HEAD').toString().trim();
        const remote = execSync('git rev-parse @{u}').toString().trim();

        if (local !== remote) {
            logger.info('[Updater] New version detected! Updating...');
            execSync('git pull');
            execSync('npm install');
            logger.info('[Updater] Update complete. Please restart the agent.');
            return true;
        } else {
            console.log('[Updater] Agent is up to date.');
        }
    } catch (err) {
        logger.debug('[Updater] Auto-update skipped (not a git repo or no remote)');
    }
    return false;
}
