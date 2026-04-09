"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { MEAL_ICONS } from "@/lib/utils";

const DAYS_OF_WEEK = ["月", "火", "水", "木", "金", "土", "日"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          カレンダー
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-gray-700 min-w-[100px] text-center">{monthLabel}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-7 gap-px">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {cells.map((day, i) => {
              const isToday = day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
              return (
                <div
                  key={i}
                  className={`min-h-[56px] lg:min-h-[80px] p-1 rounded-lg ${
                    day ? "hover:bg-gray-50 cursor-pointer" : ""
                  } ${isToday ? "bg-primary/10" : ""}`}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium block text-center mb-0.5 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                        isToday ? "bg-primary text-white" : "text-gray-700"
                      }`}>
                        {day}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 text-center mt-3">食事記録機能は開発中です</p>
    </div>
  );
}
