import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data for demonstration
const data = [
  {
    name: "Jan",
    revenue: 4000,
  },
  {
    name: "Feb",
    revenue: 3000,
  },
  {
    name: "Mar",
    revenue: 5000,
  },
  {
    name: "Apr",
    revenue: 4500,
  },
  {
    name: "May",
    revenue: 6000,
  },
  {
    name: "Jun",
    revenue: 8000,
  },
];

export default function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`$${value}`, 'Revenue']}
          contentStyle={{ 
            backgroundColor: "#fff", 
            border: "1px solid #e2e8f0",
            borderRadius: "0.5rem",
            padding: "0.5rem",
          }} 
        />
        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
