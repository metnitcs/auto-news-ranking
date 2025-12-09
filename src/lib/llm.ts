import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface LLMRequest {
    model?: string;
    system?: string;
    messages: { role: "user" | "model"; content: string }[];
    temperature?: number;
    max_tokens?: number;
    jsonMode?: boolean;
}

export async function callLLM(request: LLMRequest): Promise<string> {
    const MAX_RETRIES = 5;
    const BASE_DELAY_MS = 10000; // 10 seconds

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const modelName = request.model || "gemini-1.5-flash";
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: request.temperature,
                    maxOutputTokens: request.max_tokens,
                    responseMimeType: request.jsonMode ? "application/json" : "text/plain",
                }
            });

            let promptText = "";
            if (request.system) {
                promptText += `System Instruction:\n${request.system}\n\n`;
            }

            for (const msg of request.messages) {
                promptText += `${msg.role === "user" ? "User" : "Model"}: ${msg.content}\n\n`;
            }

            const result = await model.generateContent(promptText);
            const response = await result.response;
            let text = response.text();

            return text;
        } catch (error: any) {
            const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests');

            if (is429 && attempt < MAX_RETRIES - 1) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
                console.warn(`[LLM] Rate limited (429). Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error("Error calling Gemini API:", error);
                throw error;
            }
        }
    }
    throw new Error("LLM call failed after max retries.");
}
