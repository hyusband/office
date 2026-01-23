import notifier from 'node-notifier';
import logger from './logger.js';

export enum NotificationType {
    BREAK = 'Break 💧',
    SUCCESS = 'Success ✅',
    ERROR = 'Error ❌',
    INFO = 'Info ℹ️',
    SYSTEM = 'System ⚙️'
}

class NotifierService {
    notify(type: NotificationType, message: string, sound = true) {
        const title = `Real Availability: ${type}`;

        notifier.notify({
            title,
            message,
            sound,
            wait: false
        });

        logger.info(`[Notifier] ${type}: ${message}`);
    }

    breakReminder(minutes: number) {
        this.notify(
            NotificationType.BREAK,
            `Llevas ${Math.round(minutes)} min dándole duro. Ve a beber agua y estira un poco.`
        );
    }

    shutdown() {
        this.notify(NotificationType.SYSTEM, 'Agent is shutting down. See you later!');
    }
}

export const notifierService = new NotifierService();
