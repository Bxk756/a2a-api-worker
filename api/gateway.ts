export const config = {
  runtime: "edge",
};

const POLICY_URL = process.env.POLICY_ENGINE_URL;

export default async function handler(req: Request): Promise<Response> {
  if (!POLICY_URL) {
    return new Response("Policy engine not configured", { status: 500 });
  }

  // Build policy event
  const policyEvent = {
    agent: {
      id: "a2a-edge-worker",
      type: "edge",
      version: "1.0.0",
    },
    action: {
      type: "network_scan",
      target: req.headers.get("x-forwarded-for") || "unknown",
    },
    context: {
export const runtime = "edge";

export default async function handler(request: Request) {
  try {
    // Enforce POST only
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405 }
      );
    }

    // 🔐 SAFELY load POLICY_URL
    const rawPolicyUrl = process.env.POLICY_URL;
    if (!rawPolicyUrl) {
      return new Response(
        JSON.stringify({ error: "POLICY_URL is not defined" }),
        { status: 500 }
      );
    }

    let policyUrl: URL;
    try {
      policyUrl = new URL(rawPolicyUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "POLICY_URL is invalid" }),
        { status: 500 }
      );
    }

    // Safely parse body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // Forward to policy engine
    const res = await fetch(policyUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    return new Response(
      JSON.stringify({
        ok: true,
        upstream_status: res.status,
        response: text
      }),
      { status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err?.message ?? "Gateway crash"
      }),
      { status: 500 }
    );
  }
}
