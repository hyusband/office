import { execSync } from 'child_process';

export function getSpotifyMusic(): string | undefined {
    try {
        const cmd = 'tasklist /v /fi "IMAGENAME eq Spotify.exe" /fo csv';
        const output = execSync(cmd, { encoding: 'utf8' });

        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('Spotify.exe')) {
                const parts = line.split('","');
                const windowTitle = parts[parts.length - 1]?.replace('"', '').trim();

                if (windowTitle && windowTitle !== 'Spotify' && windowTitle !== 'N/A') {
                    return windowTitle;
                }
            }
        }
    } catch (err) {
        // Spotify not running or error
    }
    return undefined;
}
