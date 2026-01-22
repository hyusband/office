import psList from 'ps-list';
import { StatusType } from '../../shared/types.js';
import { getGitBranch } from './git.js';
import { getIdleMinutes } from './idle.js';
import { getSpotifyMusic } from './spotify.js';
import { isCameraInUse } from './camera.js';
import { getGithubNotifications } from './github.js';
import { getWakaTimeActivity } from './wakatime.js';

export interface ActivityDetail {
    status: StatusType;
    activity?: string;
    metadata?: {
        branch?: string;
        music?: string;
        idleMinutes?: number;
        timezone?: string;
        localTime?: string;
        githubNotifications?: number;
        wakatime?: string;
        cameraInUse?: boolean;
    };
}

export async function checkActivity(): Promise<ActivityDetail> {
    const idleMinutes = getIdleMinutes();
    const cameraInUse = isCameraInUse();

    if (cameraInUse) {
        return {
            status: 'meeting',
            activity: 'In a Call (Camera detected)',
            metadata: { cameraInUse }
        };
    }

    if (idleMinutes >= 5) {
        return {
            status: 'away',
            activity: 'Away from Keyboard',
            metadata: { idleMinutes }
        };
    }

    const processes = await psList();
    const isZooming = processes.some(p => p.name.toLowerCase().includes('zoom'));
    const isTeams = processes.some(p => p.name.toLowerCase().includes('teams'));
    const isCoding = processes.some(p => p.name.toLowerCase().includes('code'));

    const branch = isCoding ? getGitBranch() : undefined;
    const music = getSpotifyMusic();
    const githubNotifications = await getGithubNotifications(process.env.GITHUB_TOKEN);
    const wakatime = await getWakaTimeActivity(process.env.WAKATIME_API_KEY);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isZooming || isTeams) {
        return {
            status: 'meeting',
            activity: isZooming ? 'In a Zoom Call' : 'In a Teams Meeting',
            metadata: { music, githubNotifications, timezone, localTime, wakatime }
        };
    }

    if (isCoding) {
        return {
            status: 'coding',
            activity: 'Writing Code in VS Code',
            metadata: { branch, music, githubNotifications, timezone, localTime, wakatime }
        };
    }

    return {
        status: 'available',
        metadata: { music, githubNotifications, timezone, localTime, wakatime }
    };
}
