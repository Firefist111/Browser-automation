import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkflowsByOrg } from "@/features/workflows/data";

export async function GET(request: NextRequest) {
  try {
    const { orgId } = await auth();

    // No org selected yet — return an empty list instead of 401
    if (!orgId) {
      return NextResponse.json([]);
    }

    const workflows = await getWorkflowsByOrg(orgId);

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("API error fetching workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflows" },
      { status: 500 }
    );
  }
}
