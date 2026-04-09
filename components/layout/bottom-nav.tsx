"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Calendar,
  MoreHorizontal,
  Refrigerator,
  BarChart2,
  Heart,
  FileText,
  ListOrdered,
  Settings,
  Trophy,
  Receipt,
  X,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const mainItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/meal-plan", icon: CalendarDays, label: "献立" },
  { href: "/shopping-list", icon: ShoppingCart, label: "買い物" },
  { href: "/calendar", icon: Calendar, label: "記録" },
];

const moreItems = [
  { href: "/fridge", icon: Refrigerator, label: "冷蔵庫" },
  { href: "/nutrition", icon: BarChart2, label: "栄養分析" },
  { href: "/favorites", icon: Heart, label: "お気に入り" },
  { href: "/report", icon: FileText, label: "レポート" },
  { href: "/ingredients-log", icon: ListOrdered, label: "食材集計" },
  { href: "/score", icon: Trophy, label: "スコア" },
  { href: "/receipt", icon: Receipt, label: "レシート" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isMoreActive = moreItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 lg:hidden pb-safe",
          drawerOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-semibold text-gray-800">メニュー</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 p-3">
          {moreItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden pb-safe">
        <div className="flex items-center h-16">
          {mainItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors touch-manipulation",
                  active ? "text-primary" : "text-gray-500"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
                {label}
              </Link>
            );
          })}
          <button
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors touch-manipulation",
              isMoreActive || drawerOpen ? "text-primary" : "text-gray-500"
            )}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <MoreHorizontal className={cn("w-5 h-5", (isMoreActive || drawerOpen) && "stroke-[2.5px]")} />
            その他
          </button>
        </div>
      </nav>
    </>
  );
}
