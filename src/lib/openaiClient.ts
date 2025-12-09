import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set. AI features will not work until you set it.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
