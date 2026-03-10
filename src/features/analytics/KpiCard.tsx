import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number; // e.g., 0.12 for +12%
  changeType?: "increase" | "decrease";
  description: string;
}

export const KpiCard = ({ title, value, change, description }: KpiCardProps) => {
  const isIncreasePositive = changeType === 'increase';
  const changeColor = change && (isIncreasePositive ? "text-green-500" : "text-red-500");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* You can add an icon here */}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change && (
            <span className={`flex items-center mr-2 ${changeColor}`}>
              {isIncreasePositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change * 100).toFixed(1)}%
            </span>
          )}
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
};
