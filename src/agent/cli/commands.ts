import { Command } from 'commander';
import { StatusType, AvailabilityState } from '../../shared/types.js';

export function setupCommands(
    program: Command,
    onSet: (state: AvailabilityState) => void,
    onClear: () => void
) {
    program
        .command('set')
        .argument('<status>', 'Status (available, busy, meeting, away, coding)')
        .argument('[activity]', 'Activity description')
        .action((status, activity) => {
            onSet({
                status: status as StatusType,
                activity: activity || 'Manual Status',
                timestamp: Date.now()
            });
        });

    program
        .command('clear')
        .description('Clear manual status and return to auto-detection')
        .action(() => {
            onClear();
        });
}
