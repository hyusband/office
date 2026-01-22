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

        if (state.metadata?.workspace) {
            fields.push({ name: '📂 Workspace', value: `\`${state.metadata.workspace}\``, inline: true });
        }

        if (state.metadata?.branch) {
            fields.push({ name: '🌿 Branch', value: `\`${state.metadata.branch}\``, inline: true });
        }

        if (state.metadata?.battery !== undefined) {
            const batteryIcon = state.metadata.isCharging ? '⚡' : '🔋';
            fields.push({ name: `${batteryIcon} Battery`, value: `${state.metadata.battery}%`, inline: true });
        }

        if (state.metadata?.cpuLoad !== undefined) {
            fields.push({ name: '⚙️ CPU Load', value: `${state.metadata.cpuLoad}%`, inline: true });
        }

        if (state.metadata?.wakatime) {
            fields.push({ name: '🚀 WakaTime', value: state.metadata.wakatime, inline: true });
        }

        if (state.metadata?.githubNotifications) {
            fields.push({ name: '🔔 GitHub', value: `${state.metadata.githubNotifications} issues/PRs`, inline: true });
        }

        if (state.metadata?.music) {
            fields.push({ name: '🎵 Listening to', value: state.metadata.music, inline: true });
        }

        if (state.metadata?.localTime) {
            fields.push({ name: '🕒 My Time', value: `${state.metadata.localTime} (${state.metadata.timezone || 'UTC'})`, inline: true });
        }

        if (state.status === 'away' && state.metadata?.idleMinutes) {
            fields.push({ name: '⏳ Idle', value: `${state.metadata.idleMinutes}m`, inline: true });
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
