/**
 * Test runtime endpoint for the `hello-modula` Sepolia smoke-test model.
 *
 * The Modula gateway forwards `tools/call` arguments here after x402
 * verify; this handler echoes the input back as `output` so the
 * end-to-end path (gateway → runtime → response → gateway settle →
 * caller) is observably alive without depending on any real model
 * infra.
 *
 * Production models would replace this with a vLLM proxy, an OpenAI-
 * compatible /v1/chat/completions adapter, or whatever inference
 * backend the creator runs.
 */
export async function POST(request: Request): Promise<Response> {
  const args = (await request.json().catch(() => ({}))) as {
    prompt?: unknown;
  };

  const prompt = typeof args.prompt === "string" ? args.prompt : "";

  return Response.json({
    output: {
      echo: prompt || "(no prompt provided)",
      model: "hello-modula",
      ts: Date.now(),
    },
  });
}

// Tell Next this route is dynamic (not statically renderable) — the
// echo varies per request and we never want a CDN cached value here.
export const dynamic = "force-dynamic";
