import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">403</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to view this page.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Go back</Link>
        </Button>
      </div>
    </div>
  )
}
