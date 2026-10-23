import { callAI } from "../_shared/ai.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pdfPath, deliverable, goalTitle, milestoneTitle } = await req.json();
    if (!pdfPath || !deliverable) throw new Error("pdfPath and deliverable are required");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: file, error: dErr } = await admin.storage.from("checkin-pdfs").download(pdfPath);
    if (dErr || !file) throw new Error("Failed to read PDF: " + (dErr?.message || "not found"));

    const buf = new Uint8Array(await file.arrayBuffer());
    // base64 encode (chunked to avoid call-stack limits)
    let binary = "";
    const CHUNK = 0x8000;
    for (let i = 0; i < buf.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, Array.from(buf.subarray(i, i + CHUNK)) as any);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:application/pdf;base64,${base64}`;

    const response = await callAI({
        messages: [
          {
            role: "system",
            content: "You evaluate whether an uploaded PDF satisfies a stated deliverable for a goal milestone. Be fair but rigorous. Score 0–100 where 100 = fully satisfies the deliverable. Provide concise feedback.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Goal: ${goalTitle || "(unspecified)"}\nMilestone: ${milestoneTitle || "(unspecified)"}\nExpected deliverable: ${deliverable}\n\nReview the attached PDF and decide how well it fulfills the deliverable.` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_evaluation",
            description: "Return the deliverable evaluation",
            parameters: {
              type: "object",
              properties: {
                score: { type: "integer", description: "0-100 alignment with the deliverable" },
                feedback: { type: "string", description: "Concise feedback (1-3 sentences)" },
                meets_expectations: { type: "boolean" },
              },
              required: ["score", "feedback", "meets_expectations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_evaluation" } },
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
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : { score: 0, feedback: "Unable to evaluate", meets_expectations: false };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-checkin-pdf error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});