import { Command } from 'commander';
import axios from 'axios';
import { checkActivity } from './monitors/activity.js';
import { setupCommands } from './cli/commands.js';
import { TrayService } from './services/tray.js';
import logger from './services/logger.js';
import { checkForUpdates } from './services/updater.js';
import { rpcService } from './services/rpc.js';
import { automationService } from './services/automation.js';
import { obsService } from './services/obs.js';
import { AvailabilityState, StatusType } from '../shared/types.js';
import * as dotenv from 'dotenv';
import { notifierService } from './services/notifier.js';
import { queueService } from './services/queue.js';
import { withPerformance } from '../shared/utils/perf.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'dev-user';

let manualOverride: AvailabilityState | null = null;
let lastSentState: StatusType | null = null;
let focusStartTime: number | null = null;
let lastReminderTime: number = 0;

const trayService = new TrayService(() => gracefulShutdown());

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
            const state = manualOverride || await withPerformance('CheckActivity', getAutoState);

            handleHealthReminders(state);
            await handleAutomation(state);

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

    if (state.status === 'coding' || state.status === 'busy' || state.status === 'deep_focus') {
        if (!focusStartTime) focusStartTime = now;

        const focusMinutes = (now - focusStartTime) / 60000;

        if (focusMinutes >= 60 && (now - lastReminderTime) > 60000 * 60) {
            notifierService.breakReminder(focusMinutes);
            lastReminderTime = now;
        }
    } else {
        focusStartTime = null;
    }
}

async function handleAutomation(state: AvailabilityState) {
    // Distraction Blocker
    if (state.status === 'deep_focus' || state.status === 'meeting') {
        await automationService.blockDistractors();
    } else if (lastSentState === 'deep_focus' || lastSentState === 'meeting') {
        if (state.status === 'available' || state.status === 'coding') {
            await automationService.unblockDistractors();
        }
    }

    // OBS Sync
    if (state.status === 'away') {
        await obsService.setScene('BRB / Vuelvo pronto');
    } else if (state.status === 'coding' || state.status === 'deep_focus' || state.status === 'available') {
        if (lastSentState === 'away') {
            await obsService.setScene('Escena Principal');
        }
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
    await queueService.enqueue(USER_ID, state, API_URL);
    lastSentState = state.status;
}

async function gracefulShutdown() {
    logger.info('[Agent] Initiating graceful shutdown...');
    notifierService.shutdown();

    // Optional: Notify server of offline status
    await syncWithServer({
        status: 'away',
        activity: 'Agent Offline',
        timestamp: Date.now()
    });

    process.exit(0);
}

// Signal handlers
process.on('SIGINT', () => gracefulShutdown());
process.on('SIGTERM', () => gracefulShutdown());

program.parse(process.argv);
