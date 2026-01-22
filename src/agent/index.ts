import { Command } from 'commander';
import axios from 'axios';
import { checkActivity } from './monitors/activity.js';
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

program
    .command('set')
    .argument('<status>', 'Status to set (available, busy, meeting, away, coding)')
    .argument('[activity]', 'Optional activity description')
    .action(async (status: string, activity?: string) => {
        manualOverride = {
            status: status as StatusType,
            activity: activity || 'Manual Status',
            timestamp: Date.now()
        };
        console.log(`[Agent] Manual override set: ${status}`);
        await syncWithServer(manualOverride);
    });

program
    .command('clear')
    .action(async () => {
        manualOverride = null;
        console.log('[Agent] Manual override cleared. Returning to auto-detection.');
        const autoState = await getAutoState();
        await syncWithServer(autoState);
    });

program.action(async () => {
    console.log('[Agent] Starting Real Availability Monitor...');
    console.log(`[Agent] Reporting to: ${API_URL}`);

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
    return {
        ...detail,
        timestamp: Date.now()
    };
}

async function syncWithServer(state: AvailabilityState) {
    try {
        await axios.post(`${API_URL}/status`, {
            state,
            userId: USER_ID
        });
        lastSentState = state.status;
        console.log(`[Agent] Synced: ${state.status} ${state.activity ? `(${state.activity})` : ''}`);
    } catch (err) {
        console.error('[Agent] Sync failed:', (err as any).response?.data || (err as Error).message);
    }
}

program.parse(process.argv);
