import { NextResponse, type NextRequest } from "next/server";

export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  if (process.env.NODE_ENV === "production" && !local && proto !== "https") {
    return new NextResponse("HTTPS is required.", { status: 403 });
  }

  return NextResponse.next();
}
