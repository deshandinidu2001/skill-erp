import { NextRequest, NextResponse } from "next/server";
import { getClientQuotationPortal, submitClientQuotationResponseDirect } from "@/services/api/client-portal.service";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  return NextResponse.json(await getClientQuotationPortal(params.token));
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const body = await req.json();
    return NextResponse.json({
      status: await submitClientQuotationResponseDirect(params.token, body.decision, body.reason),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
