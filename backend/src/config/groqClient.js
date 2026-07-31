import { Groq } from "groq-sdk";

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export const isGroqConfigured = () => {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
};

let clientInstance = null;

export const getGroqClient = () => {
  if (!isGroqConfigured()) {
    return null;
  }

  if (!clientInstance) {
    clientInstance = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 10000,
      maxRetries: 1,
    });
  }

  return clientInstance;
};
