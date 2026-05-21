import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp, Info } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string
  change?: number
  changeType?: "increase" | "decrease"
  description: string
  icon?: LucideIcon
  // Optional explanation rendered on hover of an info icon next to the
  // title. Used to surface how each metric is calculated without cluttering
  // the card. Plain text — no markdown.
  tooltip?: string
}

export const KpiCard = ({
  title,
  value,
  change,
  changeType,
  description,
  icon: Icon,
  tooltip,
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
        <div className="flex items-center gap-1.5">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {tooltip ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Cómo se calcula ${title}`}
                    className="text-muted-foreground/60 transition-colors hover:text-foreground"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
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
