export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: unknown;
}

export const aiConfig = () => {
  const baseUrl = Deno.env.get("AI_BASE_URL");
  const apiKey = Deno.env.get("AI_API_KEY");
  const model = Deno.env.get("AI_MODEL");

  if (!baseUrl || !apiKey || !model) {
    throw new Error("AI is not configured. Set AI_BASE_URL, AI_API_KEY, and AI_MODEL.");
  }

  return {
    endpoint: `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    apiKey,
    model,
  };
};

export async function callAI(body: {
  messages: AIMessage[];
  tools?: unknown[];
  tool_choice?: unknown;
}) {
  const config = aiConfig();
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      ...body,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("AI provider error:", response.status, detail.slice(0, 1000));
    throw new Error(
      response.status === 429
        ? "AI provider is rate limited. Please try again later."
        : response.status === 402
          ? "AI provider requires billing."
          : "AI provider request failed.",
    );
  }

  return response;
}
