import { Command } from 'commander';
import axios from 'axios';
import { checkActivity } from './monitors/activity.js';
import { setupCommands } from './cli/commands.js';
import { TrayService } from './services/tray.js';
import logger from './services/logger.js';
import { checkForUpdates } from './services/updater.js';
import { AvailabilityState, StatusType } from '../shared/types.js';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'dev-user';

let manualOverride: AvailabilityState | null = null;
let lastSentState: StatusType | null = null;

const trayService = new TrayService(() => process.exit(0));

const program = new Command();

program
    .name('real-av')
    .description('Local agent for Real Availability API')
    .version('1.0.0');

setupCommands(
    program,
    async (state) => {
        manualOverride = state;
        console.log(`[Agent] Manual override: ${state.status}`);
        trayService.notify(state.status, state.activity);
        await syncWithServer(state);
    },
    async () => {
        manualOverride = null;
        console.log('[Agent] Manual override cleared.');
        const autoState = await getAutoState();
        await syncWithServer(autoState);
    }
);

program.action(async () => {
    if (program.args.length > 0) return;

    await checkForUpdates();

    console.log('--- Real Availability Agent ---');
    console.log(`User: ${USER_ID} | API: ${API_URL}\n`);

    setInterval(async () => {
        try {
            const state = manualOverride || await getAutoState();
            if (state.status !== lastSentState) {
                trayService.notify(state.status, state.activity);
                await syncWithServer(state);
            } else if (manualOverride) {
                await syncWithServer(state);
            }
        } catch (err) {
            logger.error('[Agent] Loop error', { error: (err as Error).message });
        }
    }, 10000);
});

async function getAutoState(): Promise<AvailabilityState> {
    const detail = await checkActivity();
    return { ...detail, timestamp: Date.now() };
}

async function syncWithServer(state: AvailabilityState) {
    try {
        await axios.post(`${API_URL}/status`, { state, userId: USER_ID });
        lastSentState = state.status;
        logger.info(`Synced: ${state.status}`);
    } catch (err) {
        logger.error('[Agent] Sync failed', { error: (err as any).response?.data || (err as Error).message });
    }
}

program.parse(process.argv);
