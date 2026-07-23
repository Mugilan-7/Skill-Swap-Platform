import api, { getApiErrorMessage } from "./api.js";

const AI_UNAVAILABLE_MESSAGE = "AI service is temporarily unavailable. Please try again.";

function shouldRetry(error) {
  const status = error?.response?.status;
  return !status || status === 408 || status === 429 || status >= 500;
}

export async function sendAiMessage(message) {
  const text = String(message || "").trim();
  if (!text) {
    throw new Error("Message is required.");
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data } = await api.post("/ai/chat", { message: text });
      if (!data?.success || !data?.reply) {
        throw new Error(data?.message || "AI response was empty.");
      }
      return data.reply;
    } catch (error) {
      lastError = error;
      if (attempt === 1 || !shouldRetry(error)) break;
    }
  }

  const messageFromApi = getApiErrorMessage(lastError, AI_UNAVAILABLE_MESSAGE);
  if (lastError?.response?.status && lastError.response.status < 500 && lastError.response.status !== 429) {
    throw new Error(messageFromApi);
  }
  throw new Error(AI_UNAVAILABLE_MESSAGE);
}
