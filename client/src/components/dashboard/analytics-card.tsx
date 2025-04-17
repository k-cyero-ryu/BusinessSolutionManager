import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  iconBgColor?: string;
  iconColor?: string;
  descriptionColor?: string;
}

export default function AnalyticsCard({
  title,
  value,
  icon,
  description,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  descriptionColor = "text-muted-foreground"
}: AnalyticsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="tracking-tight text-sm font-medium">{title}</h3>
          <div className={`h-8 w-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div className="pt-0">
          <div className="text-2xl font-bold">{value}</div>
          <p className={`text-xs ${descriptionColor}`}>{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
