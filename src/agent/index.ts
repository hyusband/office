import { Command } from 'commander';
import axios from 'axios';
import { checkActivity } from './monitors/activity.js';
import { setupCommands } from './cli/commands.js';
import { TrayService } from './services/tray.js';
import logger from './services/logger.js';
import { checkForUpdates } from './services/updater.js';
import { rpcService } from './services/rpc.js';
import { AvailabilityState, StatusType } from '../shared/types.js';
import * as dotenv from 'dotenv';
import notifier from 'node-notifier';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'dev-user';

let manualOverride: AvailabilityState | null = null;
let lastSentState: StatusType | null = null;
let focusStartTime: number | null = null;
let lastReminderTime: number = 0;

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
        logger.info(`[Agent] Manual override: ${state.status}`);
        trayService.notify(state.status, state.activity);
        await syncWithServer(state);
    },
    async () => {
        manualOverride = null;
        logger.info('[Agent] Manual override cleared.');
        const autoState = await getAutoState();
        await syncWithServer(autoState);
    }
);

program.action(async () => {
    if (program.args.length > 0) return;

    await checkForUpdates();

    console.log('--- Real Availability Agent ---');
    console.log(`User: ${USER_ID} | API: ${API_URL}\n`);

    await rpcService.connect();

    setInterval(async () => {
        try {
            const state = manualOverride || await getAutoState();

            handleHealthReminders(state);

            if (state.status !== lastSentState) {
                trayService.notify(state.status, state.activity);
                await syncWithServer(state);

                updateLocalRPC(state);
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

function handleHealthReminders(state: AvailabilityState) {
    const now = Date.now();

    if (state.status === 'coding' || state.status === 'busy') {
        if (!focusStartTime) focusStartTime = now;

        const focusMinutes = (now - focusStartTime) / 60000;

        if (focusMinutes >= 60 && (now - lastReminderTime) > 60000 * 60) {
            notifier.notify({
                title: 'Real Availability: Health Break 💧',
                message: `Llevas ${Math.round(focusMinutes)} min dándole duro. Ve a beber agua y estira un poco.`,
                sound: true
            });
            lastReminderTime = now;
            logger.info('[Health] Break reminder sent');
        }
    } else {
        focusStartTime = null;
    }
}

async function updateLocalRPC(state: AvailabilityState) {
    const details = state.activity || 'Dev Mode';
    const rpcState = state.status.toUpperCase();

    let largeImageKey = 'vscode';
    if (state.status === 'meeting') largeImageKey = 'zoom';
    if (state.status === 'away') largeImageKey = 'away';

    await rpcService.update(details, `Status: ${rpcState}`, largeImageKey);
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
