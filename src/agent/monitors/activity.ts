import psList from 'ps-list';
import { StatusType } from '../../shared/types.js';
import { getGitBranch } from './git.js';
import { getIdleMinutes } from './idle.js';
import { getSpotifyMusic } from './spotify.js';

export interface ActivityDetail {
    status: StatusType;
    activity?: string;
    metadata?: {
        branch?: string;
        music?: string;
        idleMinutes?: number;
    };
}

export async function checkActivity(): Promise<ActivityDetail> {
    const idleMinutes = getIdleMinutes();

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

    if (isZooming || isTeams) {
        return {
            status: 'meeting',
            activity: isZooming ? 'In a Zoom Call' : 'In a Teams Meeting',
            metadata: { music }
        };
    }

    if (isCoding) {
        return {
            status: 'coding',
            activity: 'Writing Code in VS Code',
            metadata: { branch, music }
        };
    }

    return {
        status: 'available',
        metadata: { music }
    };
}
