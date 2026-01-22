export type StatusType = 'available' | 'busy' | 'meeting' | 'away' | 'coding' | 'offline';

export interface AvailabilityState {
    status: StatusType;
    activity?: string;
    detail?: string;
    timestamp: number;
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
        kpm?: number;
    };
}

export interface StatusUpdateRequest {
    state: AvailabilityState;
    userId: string;
}
