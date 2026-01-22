import { AvailabilityState } from '../../shared/types.js';
import axios from 'axios';

export class DiscordService {
    private webhookUrl?: string;

    constructor(webhookUrl?: string) {
        this.webhookUrl = webhookUrl;
    }

    async notifyStatusChange(state: AvailabilityState) {
        if (!this.webhookUrl) return;

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

        const fields = [];

        if (state.metadata?.branch) {
            fields.push({ name: '🌿 Git Branch', value: `\`${state.metadata.branch}\``, inline: true });
        }

        if (state.metadata?.music) {
            fields.push({ name: '🎵 Listening to', value: state.metadata.music, inline: true });
        }

        if (state.status === 'away' && state.metadata?.idleMinutes) {
            fields.push({ name: '⏳ Idle for', value: `${state.metadata.idleMinutes} minutes`, inline: true });
        }

        try {
            await axios.post(this.webhookUrl, {
                embeds: [
                    {
                        title: `${emojiMap[state.status] || '🔔'} Status: ${state.status.toUpperCase()}`,
                        description: state.activity
                            ? `Currently: **${state.activity}**`
                            : `I am now **${state.status}**.`,
                        fields: fields.length > 0 ? fields : undefined,
                        color: colorMap[state.status] || 0x34495e,
                        timestamp: new Date(state.timestamp).toISOString(),
                        footer: {
                            text: 'github.com/hyusband'
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('[Discord] Webhook error');
        }
    }
}
