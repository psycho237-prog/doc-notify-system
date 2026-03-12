"use client";

import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Visual accent backdrop */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/20 blur-[120px] rounded-full pointer-events-none -mr-40 -mt-40 z-0"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-100/20 blur-[100px] rounded-full pointer-events-none -ml-20 -mb-20 z-0"></div>

                <main className="flex-1 overflow-y-auto relative z-10 px-6 py-10 lg:px-12 xl:px-16">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>

                <footer className="px-12 py-6 text-center lg:text-left border-t border-gray-100/50 bg-white/30 backdrop-blur-sm relative z-10">
                    <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.5em]">
                        Administrative Security Layer <span className="text-gray-200 ml-2">|</span> <span className="text-blue-500 ml-2 italic">v2.4.0-Final-PROD</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}
