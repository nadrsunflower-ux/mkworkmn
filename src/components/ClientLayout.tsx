"use client";

import { MemberProvider } from "@/context/MemberContext";
import Sidebar from "./Sidebar";
import MemberSelector from "./MemberSelector";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <MemberProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-end items-center">
            <MemberSelector />
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </MemberProvider>
  );
}
