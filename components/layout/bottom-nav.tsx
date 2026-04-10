"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Calendar,
  Menu,
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className={cn(
          "fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 transition-transform duration-300 ease-out lg:hidden",
          drawerOpen ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-semibold text-gray-800">メニュー</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="閉じる"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-3 pb-6">
          {moreItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs transition-colors active:scale-95",
                  active
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
                <span className="text-center leading-tight">{label}</span>
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
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors touch-manipulation active:opacity-70",
                  active ? "text-primary" : "text-gray-500"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "stroke-[2.5px]")} />
                {label}
              </Link>
            );
          })}

          {/* Menu button — shows count badge when on a "more" page */}
          <button
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors touch-manipulation active:opacity-70 relative",
              isMoreActive || drawerOpen ? "text-primary" : "text-gray-500"
            )}
            onClick={() => setDrawerOpen((v) => !v)}
            aria-label="メニューを開く"
            aria-expanded={drawerOpen}
          >
            <div className="relative">
              {drawerOpen ? (
                <X className="w-5 h-5 stroke-[2.5px]" />
              ) : (
                <Menu className={cn("w-5 h-5", isMoreActive && "stroke-[2.5px]")} />
              )}
              {/* Active indicator dot when on a "more" page and drawer is closed */}
              {isMoreActive && !drawerOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
            <span>{drawerOpen ? "閉じる" : "メニュー"}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
