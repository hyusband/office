import axios from 'axios';

export class AiService {
    private apiKey: string | undefined;

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
    }

    async generateCreativeStatus(activity: string, metadata: any): Promise<string | undefined> {
        if (!this.apiKey) return undefined;

        try {
            const prompt = `
                Eres un asistente creativo de disponibilidad para desarrolladores. 
                Genera una frase corta, épica y divertida (máximo 15 palabras) sobre lo que está haciendo el desarrollador ahora mismo.
                
                Actividad: ${activity}
                Detalles técnicos: ${JSON.stringify(metadata)}
                
                Usa emojis. Sé motivador y profesional pero con un toque de humor tech.
            `;

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'mixtral-8x7b-32768',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 50
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0]?.message?.content?.trim().replace(/"/g, '');
        } catch (err) {
            console.error('[AI] Failed to generate status:', (err as Error).message);
            return undefined;
        }
    }

    async transcribeAudio(audioBuffer: Buffer): Promise<string | undefined> {
        if (!this.apiKey) return undefined;

        try {
            const formData = new FormData();
            formData.append('file', new Blob([audioBuffer]), 'recording.wav');
            formData.append('model', 'whisper-large-v3');

            const response = await axios.post('https://api.groq.com/openai/v1/audio/transcriptions', formData, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data.text;
        } catch (err) {
            console.error('[AI] Transcription failed:', (err as Error).message);
            return undefined;
        }
    }

    async generateDailyStandup(userId: string, data: any[]): Promise<string | undefined> {
        if (!this.apiKey) return undefined;

        try {
            const prompt = `
                Eres un asistente de productividad. Genera un reporte de "Daily Standup" profesional y conciso para el usuario ${userId} basado en su actividad de hoy.
                
                Actividad detectada:
                ${JSON.stringify(data)}
                
                El reporte debe incluir:
                1. Resumen de proyectos trabajados (metadata.workspace).
                2. Tiempo total aproximado de foco.
                3. Resúmenes de reuniones clave (provenientes del campo 'context').
                
                Formato: Markdown, profesional pero moderno. Usa emojis.
            `;

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'mixtral-8x7b-32768',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.5
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.choices[0]?.message?.content?.trim();
        } catch (err) {
            console.error('[AI] Standup generation failed:', (err as Error).message);
            return undefined;
        }
    }
}

export const aiService = new AiService(process.env.GROQ_API_KEY);
