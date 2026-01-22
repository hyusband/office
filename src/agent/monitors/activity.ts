import psList from 'ps-list';
import { StatusType } from '../../shared/types.js';

export interface ActivityDetail {
    status: StatusType;
    activity?: string;
}

export async function checkActivity(): Promise<ActivityDetail> {
    const processes = await psList();

    const isZooming = processes.some(p => p.name.toLowerCase().includes('zoom'));
    const isCoding = processes.some(p => p.name.toLowerCase().includes('code'));
    const isTeams = processes.some(p => p.name.toLowerCase().includes('teams'));

    if (isZooming || isTeams) {
        return {
            status: 'meeting',
            activity: isZooming ? 'In a Zoom Call' : 'In a Teams Meeting'
        };
    }

    if (isCoding) {
        return {
            status: 'coding',
            activity: 'Writing Code in VS Code'
        };
    }

    return {
        status: 'available'
    };
}
