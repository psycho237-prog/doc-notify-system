"use client";

import { useState, useEffect } from "react";
import {
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Send,
    Loader2,
    Users as UsersIcon
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
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
            title: "TOTAL REGISTERED",
            value: data?.totalRegistered ?? "0",
            change: "Total documents",
            trend: "up",
            icon: <UsersIcon className="w-4 h-4 mr-1 text-blue-500" />
        },
        {
            title: "PROCESSING",
            value: data?.processing ?? "0",
            change: "In progress",
            trend: "neutral",
            icon: <Clock className="w-4 h-4 mr-1 text-orange-500" />
        },
        {
            title: "READY FOR NOTIFICATION",
            value: data?.ready ?? "0",
            change: "Requires Action",
            trend: "neutral",
            icon: <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        },
        {
            title: "SMS SENT TODAY",
            value: data?.smsSentToday ?? "0",
            change: "Last 24h",
            trend: "up",
            icon: <Send className="w-4 h-4 mr-1 text-blue-600" />
        }
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
                        <p className="text-gray-500 font-medium">Loading your dashboard...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1 font-medium">Welcome back, here&apos;s what&apos;s happening with your dossiers today.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link href="/records/new" className="flex-1 md:flex-none">
                        <Button className="w-full flex items-center justify-center gap-2 bg-[#1e3a8a] text-white font-bold rounded-xl shadow-lg px-6 py-6 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            + Add New Dossier
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</h3>
                        <div className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">{stat.value}</div>

                        <div className={`flex items-center text-sm font-bold ${stat.trend === 'up' ? 'text-green-600' :
                            stat.trend === 'down' ? 'text-red-600' : 'text-orange-600'
                            }`}>
                            {stat.icon}
                            <span className="text-gray-500 ml-1">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-lg font-extrabold text-gray-900">Recent Dossier Updates</h2>
                    <Link href="/records" className="text-sm font-bold text-[#1e3a8a] hover:underline px-3 py-1 bg-blue-50 rounded-lg transition-colors">
                        View Records
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-6 py-5">Full Name</th>
                                <th className="px-6 py-5">Service Type</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5">Phone Number</th>
                                <th className="px-6 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-sm">
                            {data?.recentDossiers?.map((row: any) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5 font-bold text-gray-900">{row.fullName}</td>
                                    <td className="px-6 py-5 text-gray-600">{row.service}</td>
                                    <td className="px-6 py-5">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${row.status === 'ready' ? 'bg-green-100 text-green-700' :
                                            row.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                                                row.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 font-mono italic">{row.phoneNumber}</td>
                                    <td className="px-6 py-5 text-right">
                                        <Link href={`/records?search=${row.fullName}`} className="font-bold text-[#1e3a8a] hover:text-blue-900 group-hover:underline">
                                            Edit Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {(!data?.recentDossiers || data.recentDossiers.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-gray-400 font-medium">No dossiers registered yet.</p>
                                            <Link href="/records/new">
                                                <Button variant="ghost" className="text-blue-600 font-bold hover:bg-blue-50">Create your first record</Button>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
