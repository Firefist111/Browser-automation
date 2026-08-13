import { auth, clerkClient } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { getWorkflow, getWorkflowById } from "@/features/workflows/data"
import { getWorkflowRunPublicToken } from "@/features/workflows/actions"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const { id } = await params

  if (!orgId) {
    redirect("/choose-organization")
  }

  // Fast path: the workflow belongs to the currently active organization.
  // Query scoped to the active org so a foreign workflow can never be viewed here.
  let ownerOrgId = orgId
  const workflow = await getWorkflow(id, orgId)

  if (!workflow) {
    // The workflow may legitimately exist under another organization the user
    // belongs to. The app selects the active org on the client (sidebar), which
    // can temporarily differ from the org the server session reports — causing a
    // real, authorized workflow to 404. Fall back to an ID-based lookup and verify
    // the user is actually a member of the owning org before rendering.
    const byId = await getWorkflowById(id)
    if (!byId) {
      console.warn(`[workflows] page 404: workflow not found by id or org`, {
        workflowId: id,
        orgId,
        userId,
      })
      notFound()
    }

    if (byId.orgId !== orgId) {
      const client = await clerkClient()
      const memberships = await client.users.getOrganizationMembershipList({ userId })
      const isMember = memberships.data.some((m) => m.organization.id === byId.orgId)

      if (!isMember) {
        notFound()
      }
    }

    ownerOrgId = byId.orgId
  }

  // Mint a short-lived (≈1h), read-only public token scoped to this workflow's run
  // tag. The client uses it to subscribe to live run updates over Trigger.dev
  // realtime without shipping any privileged credentials to the browser.
  const { token: runToken } = await getWorkflowRunPublicToken(id)

  // Render and let the client switch the active org to match the workflow's org,
  // so subsequent Server Actions (save/delete/run) target the correct org.
  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkflowShell workflowId={id} orgId={ownerOrgId} runToken={runToken} />
    </div>
  )
}
