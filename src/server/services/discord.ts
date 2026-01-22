import { AvailabilityState } from '../../shared/types.js';
import axios from 'axios';

export class DiscordService {
    private webhookUrl?: string;

    constructor(webhookUrl?: string) {
        this.webhookUrl = webhookUrl;
    }

    async notifyStatusChange(state: AvailabilityState) {
        if (!this.webhookUrl) {
            console.log('[Discord] No Webhook URL configured, skipping notification.');
            return;
        }

        const colorMap: Record<string, number> = {
            available: 0x27ae60,
            busy: 0xe74c3c,
            meeting: 0x9b59b6,
            away: 0xf1c40f, 
            coding: 0x3498db 
        };

        const emojiMap: Record<string, string> = {
            available: '✅',
            busy: '⛔',
            meeting: '🎧',
            away: '🌙',
            coding: '💻'
        };

        try {
            await axios.post(this.webhookUrl, {
                embeds: [
                    {
                        title: `${emojiMap[state.status] || '🔔'} Status Updated: ${state.status.toUpperCase()}`,
                        description: state.activity
                            ? `Currently: **${state.activity}**\n${state.detail || ''}`
                            : `I am now **${state.status}**.`,
                        color: colorMap[state.status] || 0x34495e,
                        timestamp: new Date(state.timestamp).toISOString(),
                        footer: {
                            text: 'github.com/hyusband'
                        }
                    }
                ]
            });
            console.log(`[Discord] Webhook sent for status: ${state.status}`);
        } catch (error) {
            console.error('[Discord] Failed to send webhook:', error);
        }
    }
}
