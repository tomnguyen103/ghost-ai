import Link from "next/link"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-base">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle">
        <Lock className="h-7 w-7 text-copy-muted" />
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold text-copy-primary">Access Denied</p>
        <p className="mt-1 text-sm text-copy-muted">
          You don&apos;t have permission to view this project.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/editor">Back to Editor</Link>
      </Button>
    </div>
  )
}
