import { clearSessionCookie, revokeSession } from "../../../../db/auth-repository";
export async function POST(request:Request){await revokeSession(request.headers.get("cookie"));return Response.json({ok:true},{headers:{"Set-Cookie":clearSessionCookie()}});}
