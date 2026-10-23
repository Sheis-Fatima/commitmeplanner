import { callAI } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goalTitle, goalDescription, goalCategory, checkinFrequency, periods } = await req.json();

    const n = Math.min(Math.max(Number(periods) || 6, 2), 12);

    const response = await callAI({
        messages: [
          {
            role: "system",
            content:
              "You are a goal coach. Produce concrete, verifiable deliverables — one per check-in period — for a user's goal. Each deliverable should be a tangible artifact or measurable outcome that can be uploaded as a PDF (e.g. 'Outline draft of chapter 1', 'Spreadsheet of 20 prospect contacts', 'Workout log for the week'). Order them progressively.",
          },
          {
            role: "user",
            content: `Goal: ${goalTitle}\n${goalDescription ? `Description: ${goalDescription}\n` : ""}${goalCategory ? `Category: ${goalCategory}\n` : ""}Check-in cadence: ${checkinFrequency}\nProduce exactly ${n} milestones.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_milestones",
            description: "Generate per-period milestones",
            parameters: {
              type: "object",
              properties: {
                milestones: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      deliverable: { type: "string", description: "What concrete artifact proves completion" },
                    },
                    required: ["title", "deliverable"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["milestones"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_milestones" } },
    });

    if (!response.ok) {
      if (response.status === 429)
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402)
        return new Response(JSON.stringify({ error: "Payment required." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { milestones: [] };
    return new Response(JSON.stringify({ milestones: parsed.milestones }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-milestones error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});