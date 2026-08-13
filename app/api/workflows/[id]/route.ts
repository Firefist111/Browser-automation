import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getWorkflowById } from "@/features/workflows/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { orgId } = await auth();

    // No org selected — still allow reading public metadata if needed
    if (!orgId) {
      // Fall through to unscoped lookup so public-token or direct access works
    }

    const { id } = await params;

    const workflow = await getWorkflowById(id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("API error fetching workflow by id:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow" },
      { status: 500 },
    );
  }
}
