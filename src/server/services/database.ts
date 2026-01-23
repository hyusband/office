import Database from 'better-sqlite3';
import { AvailabilityState } from '../../shared/types.js';

const db = new Database('data.db');

db.exec(`
    CREATE TABLE IF NOT EXISTS user_configs (
        userId TEXT PRIMARY KEY,
        webhookUrl TEXT,
        discordToken TEXT
    );

    CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        status TEXT,
        activity TEXT,
        startTime INTEGER,
        endTime INTEGER,
        metadata TEXT,
        context TEXT
    );
`);

export class DbService {
    async saveStatus(userId: string, state: AvailabilityState) {
        const lastStatus = db.prepare('SELECT id FROM status_history WHERE userId = ? AND endTime IS NULL ORDER BY startTime DESC LIMIT 1').get(userId) as { id: number } | undefined;

        const now = Date.now();
        if (lastStatus) {
            db.prepare('UPDATE status_history SET endTime = ? WHERE id = ?').run(now, lastStatus.id);
        }

        db.prepare(`
            INSERT INTO status_history (userId, status, activity, startTime, metadata)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            userId,
            state.status,
            state.activity || null,
            now,
            state.metadata ? JSON.stringify(state.metadata) : null
        );
    }

    async getUserConfig(userId: string) {
        return db.prepare('SELECT * FROM user_configs WHERE userId = ?').get(userId) as { userId: string, webhookUrl: string, discordToken?: string } | undefined;
    }

    async getWeeklyStats(userId: string) {
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        return db.prepare(`
            SELECT status, SUM(CASE WHEN endTime IS NOT NULL THEN endTime - startTime ELSE ? - startTime END) as totalTime
            FROM status_history
            WHERE userId = ? AND startTime > ?
            GROUP BY status
        `).all(Date.now(), userId, weekAgo);
    }

    async setUserConfig(userId: string, webhookUrl: string, discordToken?: string) {
        db.prepare('INSERT OR REPLACE INTO user_configs (userId, webhookUrl, discordToken) VALUES (?, ?, ?)').run(userId, webhookUrl, discordToken || null);
    }

    async getHeatmapData(userId: string) {
        // Aggregates focus time (coding, busy, meeting, deep_focus) by date
        return db.prepare(`
            SELECT 
                date(startTime / 1000, 'unixepoch') as day,
                SUM(CASE WHEN endTime IS NOT NULL THEN endTime - startTime ELSE ? - startTime END) / 60000 as focusMinutes
            FROM status_history
            WHERE userId = ? AND status IN ('coding', 'busy', 'meeting', 'deep_focus')
            GROUP BY day
            ORDER BY day DESC
            LIMIT 365
        `).all(Date.now(), userId);
    }

    async getDailyActivity(userId: string, date: string) {
        // date format: 'YYYY-MM-DD'
        return db.prepare(`
            SELECT status, activity, startTime, endTime, metadata, context
            FROM status_history
            WHERE userId = ? AND date(startTime / 1000, 'unixepoch') = ?
            ORDER BY startTime ASC
        `).all(userId, date);
    }
}

export const dbService = new DbService();
