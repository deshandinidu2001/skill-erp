"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function SimpleChart({
  type,
  data,
}: {
  type: "bar" | "line" | "donut";
  data: Array<{ name: string; value: number; value2?: number }>;
}) {
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#0e7490" />
          <Line type="monotone" dataKey="value2" stroke="#f97316" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (type === "donut") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
            {data.map((_, index) => <Cell key={index} fill={["#0e7490", "#f97316", "#10b981", "#64748b"][index % 4]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0e7490" />
        <Bar dataKey="value2" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
}
