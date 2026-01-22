export class FocusTracker {
    private appHistory: { name: string, time: number }[] = [];
    private readonly MAX_HISTORY = 10;
    private readonly SWITCH_THRESHOLD_MS = 30000; // 30 seconds

    recordSwitch(appName: string) {
        const now = Date.now();
        if (this.appHistory.length > 0 && this.appHistory[this.appHistory.length - 1].name === appName) {
            return;
        }

        this.appHistory.push({ name: appName, time: now });
        if (this.appHistory.length > this.MAX_HISTORY) {
            this.appHistory.shift();
        }
    }

    getFocusLevel(): 'low' | 'normal' | 'deep' {
        if (this.appHistory.length < 3) return 'normal';

        // Check the average time between switches
        let totalGap = 0;
        for (let i = 1; i < this.appHistory.length; i++) {
            totalGap += this.appHistory[i].time - this.appHistory[i - 1].time;
        }

        const avgGap = totalGap / (this.appHistory.length - 1);

        // If switching between dev tools (VS Code, Terminal, Browser Research) every < 60s
        if (avgGap < 60000) {
            return 'deep';
        }

        return 'normal';
    }
}

export const focusTracker = new FocusTracker();
