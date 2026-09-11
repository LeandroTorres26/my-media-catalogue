type ProviderConfig = {
    baseURL: string;
    apiKey: string | undefined;
}

const PROVIDERS: Record<string, ProviderConfig> = {
    groq: {
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
    },
    gemini: {
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
        apiKey: process.env.GOOGLE_API_KEY,
    },
    ollama: {
        baseURL: "http://localhost:11434/v1",
        apiKey: "ollama",
    },
};

const providerName = process.env.AI_PROVIDER ?? "groq";
const provider = PROVIDERS[providerName];
const model = process.env.AI_MODEL;

export class AiError extends Error {
    constructor(
        message: string,
        readonly status?: number,
    ) {
        super(message);
        this.name = "AiError";
    }
}

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postWithRetry(url: string, body: string, attempts = 3) {
    for (let attempt = 0; attempt < attempts; attempt++) {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${provider.apiKey}`,
            },
            body,
        });

        if(res.ok) return res;

        const isLastAttempt = attempt === attempts - 1;

        if(!RETRYABLE.has(res.status) || isLastAttempt) {
            const text = await res.text();
            throw new AiError(`${providerName} returned ${res.status}: ${text}`, res.status);
        }

        await wait(500 * 2 ** attempt);
    }

    throw new AiError("Unreachable");
}

export async function generateJSON<T>(prompt: string): Promise<T> {
    if(!provider) throw new AiError(`Unknown AI_PROVIDER: "${providerName}"`);

    if(!provider.apiKey) throw new AiError(`Missing API key for provider "${providerName}"`);

    if(!model) throw new AiError("AI_MODEL is not configured");

    const res = await postWithRetry(
        `${provider.baseURL}/chat/completions`,
        JSON.stringify({
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a media catalogue assistant. Reply with a single JSON object and nothing else.",
                },
                {
                    role: "user",
                    content: prompt
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        }),
    );

    if(!res.ok) {
        const body = await res.text();
        throw new AiError(`${providerName} returned ${res.status}: ${body}`, res.status);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if(typeof content !== "string") {
        throw new AiError("Provider returned no content");
    }

    return JSON.parse(content) as T;
}