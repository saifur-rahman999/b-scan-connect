import { getRawDb } from "../../../db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    await getRawDb().prepare("SELECT 1 AS ready").first();
    return Response.json({ status: "ok", checkedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "unavailable", checkedAt }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
