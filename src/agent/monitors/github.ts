import axios from 'axios';

/**
 * Fetches the count of unread notifications from GitHub.
 * Requires a personal access token with 'notifications' scope.
 */
export async function getGithubNotifications(token?: string): Promise<number> {
    if (!token) return 0;

    try {
        const response = await axios.get('https://api.github.com/notifications', {
            headers: {
                Authorization: `token ${token}`,
                'User-Agent': 'Real-Availability-Agent'
            }
        });
        return response.data.length;
    } catch (err) {
        return 0;
    }
}
