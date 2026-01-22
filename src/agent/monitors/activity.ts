import psList from 'ps-list';
import { StatusType } from '../../shared/types.js';
import { getGitBranch } from './git.js';
import { getIdleMinutes } from './idle.js';
import { getSpotifyMusic } from './spotify.js';
import { isCameraInUse } from './camera.js';
import { getGithubNotifications } from './github.js';
import { getWakaTimeActivity } from './wakatime.js';
import { getVSCodeWorkspace } from './workspace.js';
import { getHardwareInfo } from './hardware.js';
import { isAudioPlaying } from './audio.js';
import { getActiveBrowserInfo } from './browser.js';

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
        workspace?: string;
        battery?: number;
        isCharging?: boolean;
        cpuLoad?: number;
        isAudioPlaying?: boolean;
        browserTitle?: string;
        browserCategory?: string;
    };
}

export async function checkActivity(): Promise<ActivityDetail> {
    const now = new Date();
    const currentHour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // 4. Status Scheduling: Offline after 10 PM or on early Weekends
    if (currentHour >= 22 || currentHour < 7 || (isWeekend && currentHour < 10)) {
        return {
            status: 'offline',
            activity: isWeekend ? 'Enjoying the Weekend 🌴' : 'Resting (Scheduled DND 🌙)',
            metadata: { localTime: now.toLocaleTimeString() }
        };
    }

    const idleMinutes = getIdleMinutes();
    const cameraInUse = isCameraInUse();
    const audioPlaying = isAudioPlaying();
    const hardware = getHardwareInfo();
    const browser = getActiveBrowserInfo();

    if (cameraInUse) {
        return {
            status: 'meeting',
            activity: 'In a Call (Camera detected)',
            metadata: { cameraInUse, ...hardware }
        };
    }

    if (idleMinutes >= 5 && !audioPlaying) {
        return {
            status: 'away',
            activity: 'Away from Keyboard',
            metadata: { idleMinutes, ...hardware }
        };
    }

    const processes = await psList();
    const isZooming = processes.some(p => p.name.toLowerCase().includes('zoom'));
    const isTeams = processes.some(p => p.name.toLowerCase().includes('teams'));
    const isCoding = processes.some(p => p.name.toLowerCase().includes('code'));

    const branch = isCoding ? getGitBranch() : undefined;
    const workspace = isCoding ? getVSCodeWorkspace() : undefined;
    const music = getSpotifyMusic();
    const githubNotifications = await getGithubNotifications(process.env.GITHUB_TOKEN);
    const wakatime = await getWakaTimeActivity(process.env.WAKATIME_API_KEY);

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const commonMeta = {
        music,
        githubNotifications,
        timezone,
        localTime,
        wakatime,
        isAudioPlaying: audioPlaying,
        browserTitle: browser?.title,
        browserCategory: browser?.category,
        ...hardware
    };

    if (isZooming || isTeams) {
        return {
            status: 'meeting',
            activity: isZooming ? 'In a Zoom Call' : 'In a Teams Meeting',
            metadata: { ...commonMeta }
        };
    }

    if (isCoding) {
        if (browser?.category === 'research') {
            return {
                status: 'coding',
                activity: `Researching: ${browser.title}`,
                metadata: { ...commonMeta, branch, workspace }
            };
        }

        return {
            status: 'coding',
            activity: `Coding${workspace ? ` on ${workspace}` : ''}`,
            metadata: { ...commonMeta, branch, workspace }
        };
    }

    if (browser) {
        if (browser.category === 'video') {
            return {
                status: 'away',
                activity: `Watching: ${browser.title}`,
                metadata: { ...commonMeta }
            };
        }
        if (browser.category === 'design') {
            return {
                status: 'busy',
                activity: `Designing: ${browser.title}`,
                metadata: { ...commonMeta }
            };
        }
    }

    if (hardware.cpuLoad && hardware.cpuLoad > 80) {
        return {
            status: 'busy',
            activity: `High Load: ${hardware.cpuLoad}% CPU`,
            metadata: { ...commonMeta }
        };
    }

    return {
        status: 'available',
        metadata: { ...commonMeta }
    };
}
