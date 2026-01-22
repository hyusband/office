export type StatusType = 'available' | 'busy' | 'meeting' | 'away' | 'coding';

export interface AvailabilityState {
    status: StatusType;
    activity?: string;
    detail?: string;
    timestamp: number;
}

export interface StatusUpdateRequest {
    state: AvailabilityState;
    userId: string;
}
