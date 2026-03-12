"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    ChevronDown,
    CheckCircle2,
    XCircle,
    Loader2,
    History,
    MessageSquare,
    ExternalLink,
    Calendar,
    Filter
} from "lucide-react";
import Link from "next/link";

interface SMSLog {
    id: string;
    citizenName?: string;
    phoneNumber?: string;
    status: string;
    timestamp: string;
    messageSid?: string;
}

export default function SMSHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [logs, setLogs] = useState<SMSLog[]>([]);
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

    const handleExportLogs = () => {
        const headers = ["Recipient", "Phone Number", "Status", "Sent Date", "Message SID"];
        const rows = filteredLogs.map(l => [l.citizenName, l.phoneNumber, l.status, l.timestamp, l.messageSid]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sms_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 anim-fade-in">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Communication Audit</h1>
                    <p className="text-gray-500 mt-2 font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        Comprehensive log of all outgoing citizen notifications
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <Link href="/records">
                        <Button className="flex-1 xl:flex-none bg-[#1e3a8a] hover:bg-blue-900 text-white font-black px-8 py-7 rounded-2xl shadow-2xl shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-widest flex items-center gap-3">
                            <MessageSquare className="w-5 h-5" /> Dispatch New Alert
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 p-8 flex flex-col lg:flex-row items-center justify-between mb-10 gap-6 anim-slide-up">
                <div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full relative">
                    <div className="relative w-full lg:max-w-md">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Trace by recipient name or number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 border-2 border-gray-50 bg-gray-50/30 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white transition-all shadow-inner"
                        />
                    </div>

                    <div className="relative w-full md:w-64">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none pl-6 pr-12 py-5 border-2 border-gray-50 bg-gray-50/30 rounded-2xl text-xs font-black text-gray-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] cursor-pointer"
                        >
                            <option value="all">Every Response</option>
                            <option value="success">Successful Only</option>
                            <option value="failed">Delivery Failures</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <Button
                    onClick={handleExportLogs}
                    variant="outline"
                    className="flex items-center gap-3 border-gray-200 text-gray-700 font-black px-8 py-7 rounded-2xl shadow-sm text-sm uppercase tracking-widest hover:bg-gray-50 transition-all w-full lg:w-auto"
                >
                    <Download className="w-5 h-5" /> Export Logs
                </Button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden anim-slide-up-delayed">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center justify-center gap-6">
                            <div className="w-16 h-16 border-4 border-indigo-50 border-t-[#1e3a8a] rounded-full animate-spin"></div>
                            <div className="text-center">
                                <p className="text-xl font-black text-gray-900 tracking-tight">Retrieving Audit Logs</p>
                                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs mt-1">Accessing secure communication archives</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/40 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100">
                                    <th className="px-10 py-8">Target Recipient</th>
                                    <th className="px-10 py-8">Communication Line</th>
                                    <th className="px-10 py-8">Gateway Status</th>
                                    <th className="px-10 py-8">Timestamp</th>
                                    <th className="px-10 py-8 text-right">Message Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-sm">
                                {filteredLogs.map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/20 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-xs shadow-inner">
                                                    {row.citizenName ? row.citizenName.split(' ').map((n: any) => n[0]).join('') : '??'}
                                                </div>
                                                <span className="text-gray-900 font-black text-lg">{row.citizenName}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-gray-600 font-mono text-base tracking-tighter italic">{row.phoneNumber}</td>
                                        <td className="px-10 py-8">
                                            {row.status === 'success' ? (
                                                <span className="flex w-fit items-center gap-2.5 px-5 py-2.5 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 shadow-sm">
                                                    <CheckCircle2 className="w-4 h-4" /> Delivered
                                                </span>
                                            ) : (
                                                <span className="flex w-fit items-center gap-2.5 px-5 py-2.5 bg-red-50 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 shadow-sm">
                                                    <XCircle className="w-4 h-4" /> Gateway Fail
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-2.5 text-gray-900 font-black">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {row.timestamp ? new Date(row.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex items-center justify-end gap-2 text-gray-400 font-mono text-[10px] uppercase tracking-tighter">
                                                <span className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">{row.messageSid?.substring(0, 12)}...</span>
                                                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <MessageSquare className="w-10 h-10 text-gray-200" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 tracking-tight">No Communication Records</p>
                                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Awaiting first citizen notification</p>
                                                </div>
                                            </div>
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
