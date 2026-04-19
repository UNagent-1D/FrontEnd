import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeType?: "increase" | "decrease"
  description: string
  icon?: LucideIcon
}

export const KpiCard = ({
  title,
  value,
  change,
  changeType,
  description,
  icon: Icon,
}: KpiCardProps) => {
  const isIncrease = changeType === "increase"
  const changeColor = change
    ? isIncrease
      ? "text-category-status-active"
      : "text-category-status-error"
    : undefined

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <div className="mt-2 h-0.5 w-8 rounded-full bg-primary" />
        <div className="mt-2 flex items-center text-xs text-muted-foreground">
          {change ? (
            <span
              className={cn("mr-2 inline-flex items-center gap-1", changeColor)}
            >
              {isIncrease ? (
                <ArrowUp className="size-3.5" />
              ) : (
                <ArrowDown className="size-3.5" />
              )}
              {Math.abs(change * 100).toFixed(1)}%
            </span>
          ) : null}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  )
}
