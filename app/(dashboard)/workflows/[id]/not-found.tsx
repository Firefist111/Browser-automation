import { Button } from "@/components/ui/button"
import { WorkflowIcon } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="text-center">
        <WorkflowIcon className="size-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Workflow Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The workflow you are looking for does not exist or you do not have access to it.
        </p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </div>
  )
}