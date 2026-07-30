import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkflowPage({ params }: PageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const { id } = await params

  return (
    <div className="h-[calc(100vh-4rem)]">
      <WorkflowShell workflowId={id} />
    </div>
  )
}
