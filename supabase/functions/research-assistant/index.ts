import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@6.16.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://madardigital.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return Response.json({ error: "أضف OPENAI_API_KEY إلى أسرار Edge Functions.", code: "OPENAI_KEY_MISSING" }, { status: 503, headers: corsHeaders });

  const body = await req.json();
  const topic = String(body?.topic ?? "").trim();
  if (topic.length < 5 || topic.length > 500) return Response.json({ error: "اكتب موضوعًا واضحًا." }, { status: 400, headers: corsHeaders });

  const client = new OpenAI({ apiKey });
  const language = body?.language === "English" ? "English" : "العربية";
  const wordCount = Math.max(400, Math.min(2500, Number(body?.wordCount) || 1200));
  const citationStyle = String(body?.citationStyle || "APA 7").slice(0, 40);
  const response = await client.responses.create({
    model: Deno.env.get("OPENAI_MODEL") || "gpt-5-mini",
    store: false,
    tools: [{ type: "web_search" }],
    include: ["web_search_call.action.sources"],
    max_output_tokens: 6500,
    instructions: `أنت مساعد بحث أكاديمي. ابحث في الويب واستخدم مصادر موثوقة. لا تختلق المصادر أو الأرقام. اكتب باللغة ${language} مع إحالات مرقمة وقائمة مراجع بأسلوب ${citationStyle}.`,
    input: `اكتب مسودة بحث أصلية قابلة للمراجعة عن: ${topic}. المستوى: ${body?.academicLevel || "جامعي"}. الطول: نحو ${wordCount} كلمة. النوع: ${body?.deliverable || "بحث أكاديمي"}. الملاحظات: ${body?.notes || "لا توجد"}. نظّمها إلى عنوان، خطة، مقدمة، عناوين فرعية، خاتمة، ومراجع.`,
  });

  const sources = new Map<string, { title: string; url: string }>();
  for (const item of response.output) {
    if (item.type === "web_search_call" && item.action?.type === "search") {
      for (const source of item.action.sources || []) sources.set(source.url, { title: source.url, url: source.url });
    }
    if (item.type === "message") {
      for (const part of item.content) {
        if (part.type !== "output_text") continue;
        for (const annotation of part.annotations || []) {
          if (annotation.type === "url_citation") sources.set(annotation.url, { title: annotation.title || annotation.url, url: annotation.url });
        }
      }
    }
  }

  return Response.json({
    content: response.output_text,
    sources: [...sources.values()].slice(0, 20),
    generatedAt: new Date().toISOString(),
  }, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
