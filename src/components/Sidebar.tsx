"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "캘린더", icon: "📅" },
  { href: "/meetings", label: "회의록", icon: "📝" },
  { href: "/ideas", label: "아이디어", icon: "💡" },
  { href: "/kpi", label: "KPI", icon: "🎯" },
  { href: "/reports", label: "리포트", icon: "📄" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold">MK WorkTool</h1>
        <p className="text-gray-400 text-sm mt-1">마케팅 팀 업무 관리</p>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
