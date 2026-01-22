import { execSync } from 'child_process';

export interface BrowserInfo {
    title: string;
    category: 'video' | 'research' | 'design' | 'social' | 'other';
}

export function getActiveBrowserInfo(): BrowserInfo | undefined {
    try {
        // PowerShell to get the title of the active (foreground) window
        const psCmd = `
            Add-Type -TypeDefinition @'
            using System;
            using System.Runtime.InteropServices;
            public class User32 {
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
                [DllImport("user32.dll")]
                public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
            }
'@
            $hwnd = [User32]::GetForegroundWindow()
            $sb = New-Object System.Text.StringBuilder 256
            [User32]::GetWindowText($hwnd, $sb, $sb.Capacity) | Out-Null
            $sb.ToString()
        `;

        const windowTitle = execSync(`powershell -Command "${psCmd.replace(/\n/g, '')}"`, { encoding: 'utf8' }).trim();

        if (!windowTitle) return undefined;

        // Check if the foreground window is a known browser
        const isBrowser = ['chrome', 'edge', 'firefox', 'brave', 'opera'].some(b => windowTitle.toLowerCase().includes(b));
        // Note: Window titles usually end with " - Google Chrome" or similar.

        const titleLower = windowTitle.toLowerCase();

        let category: BrowserInfo['category'] = 'other';
        if (titleLower.includes('youtube') || titleLower.includes('netflix') || titleLower.includes('twitch')) {
            category = 'video';
        } else if (titleLower.includes('stack overflow') || titleLower.includes('mdn') || titleLower.includes('github') || titleLower.includes('documentation')) {
            category = 'research';
        } else if (titleLower.includes('figma') || titleLower.includes('canva') || titleLower.includes('adobe')) {
            category = 'design';
        } else if (titleLower.includes('twitter') || titleLower.includes('facebook') || titleLower.includes('instagram')) {
            category = 'social';
        }

        return { title: windowTitle, category };
    } catch (err) {
        return undefined;
    }
}
