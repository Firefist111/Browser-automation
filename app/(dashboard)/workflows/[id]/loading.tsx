import { Loader2Icon } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}