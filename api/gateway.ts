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
      domain: req.headers.get("host"),
      method: req.method,
      path: new URL(req.url).pathname,
    },
  };

  // Call Policy Engine
  const policyRes = await fetch(`${POLICY_URL}/v1/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(policyEvent),
  });

  if (!policyRes.ok) {
    return new Response("Policy engine unreachable", { status: 502 });
  }

  const decision = await policyRes.json();

  // 🔒 ENFORCEMENT
  if (decision.decision === "BLOCK") {
    return new Response(
      JSON.stringify({
        blocked: true,
        reason: decision.reason,
        policy_id: decision.policy_id,
      }),
      { status: 403 }
    );
  }

  if (decision.decision === "ESCALATE") {
    return new Response(
      JSON.stringify({
        escalated: true,
        reason: decision.reason,
        policy_id: decision.policy_id,
      }),
      { status: 202 }
    );
  }

  // ✅ ALLOW
  return new Response(
    JSON.stringify({
      allowed: true,
      policy_id: decision.policy_id,
    }),
    { status: 200 }
  );
}
