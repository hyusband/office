import axios from 'axios';

/**
 * Fetches the current or last heartbeats from WakaTime.
 * Requires a WakaTime API Key.
 */
export async function getWakaTimeActivity(apiKey?: string): Promise<string | undefined> {
    if (!apiKey) return undefined;

    try {
        const encodedKey = Buffer.from(apiKey).toString('base64');
        const response = await axios.get('https://wakatime.com/api/v1/users/current/heartbeats', {
            headers: {
                Authorization: `Basic ${encodedKey}`
            }
        });

        const latest = response.data.data?.[0];
        if (latest) {
            return `${latest.language || 'Unknown'} - ${latest.project || 'No Project'}`;
        }
    } catch (err) {
        
    }
    return undefined;
}
