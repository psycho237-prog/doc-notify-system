"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    Bell,
    ChevronDown,
    Calendar,
    CheckCircle2,
    XCircle,
    Loader2
} from "lucide-react";
import Link from "next/link";

export default function SMSHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const institutionId = localStorage.getItem("institutionId") || "nnlomne";
                let url = `/api/sms-logs?institutionId=${institutionId}`;
                if (statusFilter !== "all") url += `&status=${statusFilter}`;

                const res = await fetch(url);
                const data = await res.json();
                setLogs(data);
            } catch (err) {
                console.error("Logs fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [statusFilter]);

    const filteredLogs = logs.filter(log =>
        log.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.phoneNumber?.includes(searchTerm)
    );

    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SMS Communication History</h1>
                    <p className="text-gray-500 font-medium">Tracking all notifications sent to citizens.</p>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/records">
                        <Button className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold px-6 py-6 rounded-xl shadow-lg flex items-center gap-2">
                            Send New SMS
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-wrap items-center justify-between mb-8 gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer min-w-[160px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="success">Success Only</option>
                            <option value="failed">Failed Only</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 font-bold rounded-xl shadow-sm px-6 h-12 hover:bg-gray-50">
                    <Download className="w-5 h-5" /> Export Logs
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
                            <p className="text-gray-500 font-medium tracking-wide">Retrieving message logs...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-5">Recipient</th>
                                    <th className="px-6 py-5">Phone Number</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Sent Date</th>
                                    <th className="px-6 py-5">Message SID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                                {filteredLogs.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-extrabold text-[10px]">
                                                    {row.citizenName ? row.citizenName.split(' ').map((n: any) => n[0]).join('') : '??'}
                                                </div>
                                                <span className="text-gray-900 font-extrabold">{row.citizenName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 font-mono italic">{row.phoneNumber}</td>
                                        <td className="px-6 py-5">
                                            {row.status === 'success' ? (
                                                <span className="flex w-fit items-center gap-1.5 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-[10px] font-extrabold uppercase">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                                                </span>
                                            ) : (
                                                <span className="flex w-fit items-center gap-1.5 px-4 py-1.5 bg-red-50 text-red-700 rounded-full text-[10px] font-extrabold uppercase">
                                                    <XCircle className="w-3.5 h-3.5" /> Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 font-bold">
                                            {row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-5 text-gray-400 font-mono text-xs">{row.messageSid || 'N/A'}</td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-gray-500 italic font-medium">
                                            No communication logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
