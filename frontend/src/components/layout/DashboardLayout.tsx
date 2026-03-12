"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav"; // We'll create this if needed, or put top bar logic in pages.
import { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header/Navigation could go here, or handled per page */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
