import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkflowsByOrg } from "@/features/workflows/data";

export async function GET(request: NextRequest) {
  const { orgId } = await auth();

  if (!orgId) {
    return NextResponse.json({ error: "No organization selected" }, { status: 401 });
  }

  const workflows = await getWorkflowsByOrg(orgId);

  return NextResponse.json(workflows);
}