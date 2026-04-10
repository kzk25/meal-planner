"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { MEAL_ICONS, MEAL_LABELS, MEAL_TYPES } from "@/lib/utils";
import type { MealRecord } from "@/lib/types";

const DAYS_OF_WEEK = ["月", "火", "水", "木", "金", "土", "日"];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [recordsMap, setRecordsMap] = useState<Map<string, MealRecord[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = `${year}年${month + 1}月`;
  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  useEffect(() => {
    setLoading(true);
    setSelectedDay(null);
    fetch(`/api/meal-records?month=${monthStr}`)
      .then((r) => r.json())
      .then((data: MealRecord[]) => {
        const map = new Map<string, MealRecord[]>();
        if (Array.isArray(data)) {
          for (const record of data) {
            const key = record.recorded_date;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(record);
          }
        }
        setRecordsMap(map);
      })
      .catch(() => setRecordsMap(new Map()))
      .finally(() => setLoading(false));
  }, [monthStr]);

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

  const selectedDateStr = selectedDay !== null ? toDateStr(year, month, selectedDay) : null;
  const selectedRecords = selectedDateStr ? (recordsMap.get(selectedDateStr) ?? []) : [];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          カレンダー
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-gray-700 min-w-[100px] text-center">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className={`p-2 ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-7 gap-px">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              const isToday =
                day !== null &&
                year === today.getFullYear() &&
                month === today.getMonth() &&
                day === today.getDate();
              const isSelected = day !== null && day === selectedDay;
              const dateStr = day !== null ? toDateStr(year, month, day) : null;
              const dayRecords = dateStr ? (recordsMap.get(dateStr) ?? []) : [];
              const recordedTypes = new Set(dayRecords.map((r) => r.meal_type));

              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                  className={`min-h-[60px] lg:min-h-[80px] p-1 rounded-lg transition-colors ${
                    day ? "hover:bg-gray-50 cursor-pointer" : ""
                  } ${isToday ? "bg-primary/10" : ""} ${isSelected ? "ring-2 ring-primary ring-inset" : ""}`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-xs font-medium block text-center mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto ${
                          isToday ? "bg-primary text-white" : "text-gray-700"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="flex justify-center gap-0.5 flex-wrap">
                        {MEAL_TYPES.map((type) => {
                          const recorded = recordedTypes.has(type);
                          return (
                            <span
                              key={type}
                              title={MEAL_LABELS[type]}
                              className={`text-[10px] leading-none transition-opacity ${
                                recorded ? "opacity-100" : "opacity-20"
                              }`}
                            >
                              {MEAL_ICONS[type]}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-gray-500 justify-center">
        {MEAL_TYPES.map((type) => (
          <span key={type} className="flex items-center gap-1">
            <span>{MEAL_ICONS[type]}</span>
            {MEAL_LABELS[type]}
          </span>
        ))}
      </div>

      {/* Selected day detail */}
      {selectedDay !== null && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {month + 1}月{selectedDay}日の食事記録
            </h2>
            {selectedRecords.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">記録がありません</p>
            ) : (
              <div className="space-y-2">
                {MEAL_TYPES.map((type) => {
                  const records = selectedRecords.filter((r) => r.meal_type === type);
                  if (records.length === 0) return null;
                  return (
                    <div key={type}>
                      <div className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <span>{MEAL_ICONS[type]}</span>
                        {MEAL_LABELS[type]}
                      </div>
                      {records.map((r) => {
                        const name = r.dish_name ?? r.dish?.name ?? "不明";
                        const calories = r.dish?.calories;
                        return (
                          <div
                            key={r.id}
                            className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded-lg text-sm"
                          >
                            <span className="text-gray-800">{name}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {r.servings !== 1 && <span>{r.servings}人前</span>}
                              {calories && (
                                <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
                                  {Math.round(calories * r.servings)} kcal
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
