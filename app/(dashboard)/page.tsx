import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { WorkflowIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from "@/components/ui/empty"

export default async function Page() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WorkflowIcon className="size-16" />
          </EmptyMedia>
          <EmptyTitle className="text-xl">No Workflow Selected</EmptyTitle>
          <EmptyDescription className="text-base">
            Select a workflow from the sidebar or create a new one to get started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg" className="gap-2">
            <PlusIcon className="size-4" />
            Create New Workflow
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
