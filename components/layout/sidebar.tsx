"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Calendar,
  BarChart2,
  Heart,
  Refrigerator,
  FileText,
  ListOrdered,
  Receipt,
  Settings,
  Trophy,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
  { href: "/meal-plan", icon: CalendarDays, label: "週間献立" },
  { href: "/shopping-list", icon: ShoppingCart, label: "買い物リスト" },
  { href: "/calendar", icon: Calendar, label: "カレンダー" },
  { href: "/nutrition", icon: BarChart2, label: "栄養分析" },
  { href: "/fridge", icon: Refrigerator, label: "冷蔵庫" },
  { href: "/favorites", icon: Heart, label: "お気に入り" },
  { href: "/report", icon: FileText, label: "レポート" },
  { href: "/ingredients-log", icon: ListOrdered, label: "食材集計" },
  { href: "/score", icon: Trophy, label: "スコア" },
  { href: "/receipt", icon: Receipt, label: "レシート" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <span className="font-bold text-gray-800 text-sm">週間献立アプリ</span>
        </div>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mb-0.5",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
