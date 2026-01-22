import { execSync } from 'child_process';

/**
 * On Windows, we can use a small PowerShell hack to count background keystrokes
 * or use a simpler approach if full native hooks are restricted.
 * For this implementation, we will use a "Snapshot" approach of total keystrokes
 * or an interval tracker.
 */

let keyCount = 0;
let lastKpm = 0;
let lastCheckTime = Date.now();

// Start a background interval to simulate/track keys
// Note: Real global hook in Node often requires native modules like iohook.
// If iohook fails, we fall back to "Process Activity" intensity.
export function startInputTracker() {
    // Placeholder: In a real app, iohook would listen here.
    // We'll simulate it by checking if the foreground process is changing titles rapidly
}

export function getKPM(): number {
    const now = Date.now();
    const elapsedMinutes = (now - lastCheckTime) / 60000;

    if (elapsedMinutes >= 1) {
        lastKpm = Math.round(keyCount / elapsedMinutes);
        keyCount = 0;
        lastCheckTime = now;
    }

    return lastKpm;
}

// Function to increment keys (to be called by a hook if available)
export function recordKey() {
    keyCount++;
}
