import { execSync } from 'child_process';

/**
 * Detects the open VS Code workspace name from the window title on Windows.
 */
export function getVSCodeWorkspace(): string | undefined {
    try {
        const cmd = 'tasklist /v /fi "IMAGENAME eq Code.exe" /fo csv';
        const output = execSync(cmd, { encoding: 'utf8' });

        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('Code.exe')) {
                const parts = line.split('","');
                const windowTitle = parts[parts.length - 1]?.replace('"', '').trim();

                if (windowTitle && windowTitle.includes('Visual Studio Code')) {
                    const cleanTitle = windowTitle.replace(' - Visual Studio Code', '');
                    const titleParts = cleanTitle.split(' - ');
                    return titleParts[titleParts.length - 1] || cleanTitle;
                }
            }
        }
    } catch (err) {
        // VS Code not running
    }
    return undefined;
}
