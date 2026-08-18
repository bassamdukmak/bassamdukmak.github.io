import { env } from "cloudflare:workers";
import { syncQueuedLeads } from "../../../../lib/crm";

export const runtime = "edge";

export async function POST(request: Request) {
  const runtimeEnv = env as unknown as {
    CRM_SYNC_SECRET?: string;
    CRM_WEBHOOK_URL?: string;
  };
  const providedSecret = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (
    !runtimeEnv.CRM_SYNC_SECRET ||
    runtimeEnv.CRM_SYNC_SECRET.length < 20 ||
    providedSecret !== runtimeEnv.CRM_SYNC_SECRET
  ) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!runtimeEnv.CRM_WEBHOOK_URL) {
    return Response.json(
      { error: "CRM webhook is not configured." },
      { status: 503 },
    );
  }

  const summary = await syncQueuedLeads(50);
  return Response.json(summary);
}
