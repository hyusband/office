import { Command } from 'commander';
import axios from 'axios';
import { checkActivity } from './monitors/activity.js';
import { setupCommands } from './cli/commands.js';
import { AvailabilityState, StatusType } from '../shared/types.js';
import * as dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';
const USER_ID = process.env.USER_ID || 'dev-user';

let manualOverride: AvailabilityState | null = null;
let lastSentState: StatusType | null = null;

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

    console.log('--- Real Availability Agent ---');
    console.log(`User: ${USER_ID} | API: ${API_URL}\n`);

    setInterval(async () => {
        try {
            const state = manualOverride || await getAutoState();
            if (state.status !== lastSentState || manualOverride) {
                await syncWithServer(state);
            }
        } catch (err) {
            console.error('[Agent] Loop error:', (err as Error).message);
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
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${state.status}`);
    } catch (err) {
        console.error('[Agent] Sync failed');
    }
}

program.parse(process.argv);
