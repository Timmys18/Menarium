import { NextResponse } from "next/server";
import { API_VERSION } from "@/lib/api-response";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "menarium-api",
    version: API_VERSION,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
