import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <CardTitle>Something went wrong</CardTitle>
              <CardDescription className="mt-1 break-words">
                {this.state.error.message || "An unexpected error occurred."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={this.handleReload} className="gap-2">
              <RotateCw className="size-4" />
              Reload page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
}
