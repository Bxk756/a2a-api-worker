/**
 * A2A Shield Gateway
 * Node.js Serverless Function (Vercel)
 */

export const runtime = "nodejs";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    /* ----------------------------------------
       Enforce POST only
    ---------------------------------------- */
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        error: "Method Not Allowed"
      });
    }

    /* ----------------------------------------
       Load POLICY_URL from Vercel env
    ---------------------------------------- */
    const rawPolicyUrl = process.env.POLICY_URL;

    if (!rawPolicyUrl) {
      return res.status(500).json({
        ok: false,
        error: "POLICY_URL is not defined"
      });
    }

    let policyUrl: URL;
    try {
      policyUrl = new URL(rawPolicyUrl);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "POLICY_URL is not a valid absolute URL"
      });
    }

    /* ----------------------------------------
       Forward request to policy engine
    ---------------------------------------- */
    const upstream = await fetch(policyUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body ?? {})
    });

    const upstreamText = await upstream.text();

    /* ----------------------------------------
       Return deterministic response
    ---------------------------------------- */
    return res.status(200).json({
      ok: true,
      gateway: "A2A Shield",
      upstream_status: upstream.status,
      upstream_response: upstreamText
    });

  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err?.message ?? "Unhandled gateway error"
    });
  }
}
