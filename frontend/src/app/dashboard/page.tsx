"use client";

import { useState, useEffect } from "react";
import {
    Clock,
    Send,
    Loader2,
    Users as UsersIcon,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    LayoutDashboard,
    Bell,
    CheckCircle2
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardData {
    totalRegistered: number;
    processing: number;
    ready: number;
    smsSentToday: number;
    recentDossiers: {
        id: string;
        fullName: string;
        service: string;
        status: string;
        phoneNumber: string;
    }[];
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const institutionId = localStorage.getItem("institutionId") || "nnlomne";
                const res = await fetch(`/api/dashboard?institutionId=${institutionId}`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        {
            title: "Total Registered",
            value: data?.totalRegistered ?? "0",
            change: "+12.5%",
            trend: "up",
            description: "New citizens this month",
            icon: <UsersIcon className="w-6 h-6 text-blue-600" />,
            bgColor: "bg-blue-50"
        },
        {
            title: "In Processing",
            value: data?.processing ?? "0",
            change: "+3.2%",
            trend: "up",
            description: "Dossiers being verified",
            icon: <Clock className="w-6 h-6 text-orange-600" />,
            bgColor: "bg-orange-50"
        },
        {
            title: "Ready to Notify",
            value: data?.ready ?? "0",
            change: "-2.4%",
            trend: "down",
            description: "Awaiting SMS dispatch",
            icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
            bgColor: "bg-green-50"
        },
        {
            title: "SMS Sent Today",
            value: data?.smsSentToday ?? "0",
            change: "+18.1%",
            trend: "up",
            description: "Successful delivery rate",
            icon: <Send className="w-6 h-6 text-indigo-600" />,
            bgColor: "bg-indigo-50"
        }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-blue-100 border-t-[#1e3a8a] rounded-full animate-spin"></div>
                        <LayoutDashboard className="w-8 h-8 text-[#1e3a8a] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xl font-extrabold text-gray-900 tracking-tight">Syncing Dashboard</p>
                        <p className="text-gray-500 font-medium">Retrieving real-time analytics for your institution...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6 anim-fade-in">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Oversight</h1>
                    <p className="text-gray-500 mt-2 font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Live monitoring for NNLOMNE Administrative Branch
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Link href="/records/new" className="flex-1 md:flex-none">
                        <Button className="w-full relative group bg-[#1e3a8a] text-white font-black px-8 py-8 rounded-2xl shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <span className="relative flex items-center gap-3 text-lg">
                                <PlusIcon className="w-6 h-6" /> Add New Record
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {stats.map((stat, idx) => (
                    <div key={idx} className="group bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/40 border border-gray-100 flex flex-col justify-between hover:border-blue-200 transition-all relative overflow-hidden active:scale-95 cursor-pointer">
                        <div className={`w-14 h-14 ${stat.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                            {stat.icon}
                        </div>

                        <div>
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{stat.title}</h3>
                            <div className="text-5xl font-black text-gray-900 tracking-tighter mb-4">{stat.value}</div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                            <div className={`flex items-center text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                {stat.change}
                            </div>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">{stat.description}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden anim-slide-up">
                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Dossiers</h2>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Latest system updates</p>
                        </div>
                    </div>
                    <Link href="/records">
                        <Button variant="outline" className="text-sm font-black text-[#1e3a8a] border-gray-200 px-6 py-6 rounded-2xl hover:bg-blue-50 transition-colors shadow-sm">
                            Management Portal
                        </Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100">
                                <th className="px-10 py-8">Citizen Identity</th>
                                <th className="px-10 py-8">Service Category</th>
                                <th className="px-10 py-8">Current Status</th>
                                <th className="px-10 py-8">Direct Contact</th>
                                <th className="px-10 py-8 text-right">Interaction</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-bold text-sm">
                            {data?.recentDossiers?.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/30 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                                                {row.fullName.charAt(0)}
                                            </div>
                                            <span className="font-black text-gray-900 text-lg">{row.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className="text-gray-600 bg-gray-100 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{row.service}</span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border ${row.status === 'ready' ? 'bg-green-50 text-green-700 border-green-100' :
                                                row.status === 'processing' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    row.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8 text-gray-400 font-mono text-base">{row.phoneNumber}</td>
                                    <td className="px-10 py-8 text-right">
                                        <Link href={`/records?search=${row.fullName}`} className="group-hover:translate-x-2 transition-transform inline-flex items-center gap-2 font-black text-[#1e3a8a] text-xs uppercase tracking-widest hover:text-blue-900 group-hover:scale-105">
                                            Manage <ArrowUpRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

function PlusIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
}
