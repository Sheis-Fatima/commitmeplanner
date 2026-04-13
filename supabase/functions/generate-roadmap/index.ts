import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goalTitle, goalDescription, goalCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a goal planning assistant. Generate a structured roadmap of actionable steps for achieving a goal. Return exactly a JSON array of step objects with 'title' (string, concise action item) and 'description' (string, brief detail). Generate 5-8 steps ordered from first to last. Only return valid JSON array, no markdown."
          },
          {
            role: "user",
            content: `Generate a step-by-step roadmap for this goal:\nTitle: ${goalTitle}\n${goalDescription ? `Description: ${goalDescription}` : ""}\n${goalCategory ? `Category: ${goalCategory}` : ""}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_steps",
              description: "Generate roadmap steps for a goal",
              parameters: {
                type: "object",
                properties: {
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["steps"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_steps" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ steps: parsed.steps }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "[]";
    const steps = JSON.parse(content);
    return new Response(JSON.stringify({ steps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-roadmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
