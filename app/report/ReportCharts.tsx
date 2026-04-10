"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface WeekData {
  week_start: string;
  label: string;
  total_calories: number;
  total_cost: number;
  meal_count: number;
  avg_calories_per_meal: number;
}

interface CategoryEntry {
  name: string;
  value: number;
}

const PIE_COLORS = [
  "#2E7D32",
  "#388E3C",
  "#F57F17",
  "#E65100",
  "#1565C0",
  "#6A1B9A",
  "#00695C",
  "#78909C",
];

function WeekTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === "カロリー"
            ? `${p.value.toLocaleString()} kcal`
            : formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

interface WeekBarChartProps {
  weeks: WeekData[];
  hasCalories: boolean;
  hasCost: boolean;
}

export function WeekBarChart({ weeks, hasCalories, hasCost }: WeekBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={weeks}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="calories"
          orientation="left"
          tick={{ fontSize: 10, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
          }
          width={36}
        />
        <YAxis
          yAxisId="cost"
          orientation="right"
          tick={{ fontSize: 10, fill: "#6B7280" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) =>
            `¥${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
          }
          width={44}
        />
        <Tooltip content={<WeekTooltip />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {hasCalories && (
          <Bar
            yAxisId="calories"
            dataKey="total_calories"
            name="カロリー"
            fill="#2E7D32"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        )}
        {hasCost && (
          <Bar
            yAxisId="cost"
            dataKey="total_cost"
            name="食費"
            fill="#F59E0B"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryPieChartProps {
  categoryBreakdown: CategoryEntry[];
}

export function CategoryPieChart({ categoryBreakdown }: CategoryPieChartProps) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryBreakdown}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) =>
              `${name} ${Math.round((percent ?? 0) * 100)}%`
            }
            labelLine={false}
          >
            {categoryBreakdown.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value}回`, "回数"]} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
