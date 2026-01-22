import SysTray from 'systray-v2';
import notifier from 'node-notifier';
import { StatusType } from '../../shared/types.js';

export class TrayService {
    private tray?: any;

    constructor(onExit: () => void) {
        this.tray = new SysTray({
            menu: {
                icon: '',
                title: 'Real Availability',
                tooltip: 'Real Availability Agent',
                items: [
                    {
                        title: 'Exit',
                        tooltip: 'Stop the agent',
                        checked: false,
                        enabled: true
                    }
                ]
            }
        });

        this.tray.onClick((action: any) => {
            if (action.item.title === 'Exit') {
                this.tray.kill();
                onExit();
            }
        });
    }

    notify(status: StatusType, activity?: string) {
        notifier.notify({
            title: `Status: ${status.toUpperCase()}`,
            message: activity || `Your status is now ${status}`,
            sound: false
        });
    }

    exit() {
        this.tray?.kill();
    }
}
