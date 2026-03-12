"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    Bell,
    ChevronDown,
    Trash2,
    Plus,
    Filter,
    Edit3,
    XCircle,
    Copy
} from "lucide-react";
import Link from "next/link";

interface Citizen {
    id: string;
    fullName: string;
    phoneNumber: string;
    service: string;
    status: string;
}

export default function RecordsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [records, setRecords] = useState<Citizen[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            try {
                const institutionId = localStorage.getItem("institutionId") || "nnlomne";
                let url = `/api/citizens?institutionId=${institutionId}`;
                if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
                if (statusFilter !== "all") url += `&status=${statusFilter}`;
                if (serviceFilter !== "all") url += `&service=${serviceFilter}`;

                const res = await fetch(url);
                const data = await res.json();
                setRecords(data.citizens || []);
            } catch (_err) {
                console.error("Records fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchRecords, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, serviceFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record? This action cannot be undone.")) return;
        try {
            await fetch(`/api/citizens/${id}`, { method: 'DELETE' });
            setRecords((prev) => prev.filter(r => r.id !== id));
        } catch (_err) {
            console.error("Delete error:", err);
        }
    };

    const handleSendSMS = async (id: string) => {
        try {
            const institutionId = localStorage.getItem("institutionId") || "nnlomne";
            const res = await fetch('/api/send-sms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ institutionId, citizenIds: [id] })
            });
            const data = await res.json();
            alert(data.message || "Priority SMS notification dispatched successfully!");
        } catch (_err) {
            alert("Protocol error: SMS gateway unresponsive.");
        }
    };

    const handleExport = () => {
        const headers = ["ID", "Full Name", "Phone Number", "Service", "Status"];
        const rows = records.map(r => [r.id, r.fullName, r.phoneNumber, r.service, r.status]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `citizen_records_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 anim-fade-in">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Records Registry</h1>
                    <p className="text-gray-500 mt-2 font-bold flex items-center gap-2">
                        <Filter className="w-4 h-4 text-blue-500" />
                        Authenticated database management for administrative services
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        className="flex-1 xl:flex-none flex items-center gap-3 border-gray-200 text-gray-700 font-black px-6 py-7 rounded-2xl hover:bg-gray-50 transition-all text-sm uppercase tracking-widest shadow-sm"
                    >
                        <Download className="w-5 h-5" /> Export Data
                    </Button>
                    <Link href="/records/new" className="flex-1 xl:flex-none">
                        <Button className="w-full flex items-center justify-center gap-3 bg-[#1e3a8a] text-white font-black px-8 py-7 rounded-2xl shadow-2xl shadow-blue-900/20 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-widest">
                            <Plus className="w-5 h-5 mr-1" /> New Entry
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 p-8 flex flex-col lg:flex-row items-center justify-between mb-10 gap-6 anim-slide-up">
                <div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full relative">
                    <div className="relative w-full lg:max-w-md group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1e3a8a] transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify by name or contact number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 border-2 border-gray-50 bg-gray-50/30 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <select
                                value={serviceFilter}
                                onChange={(e) => setServiceFilter(e.target.value)}
                                className="w-full appearance-none pl-6 pr-12 py-5 border-2 border-gray-50 bg-gray-50/30 rounded-2xl text-xs font-black text-gray-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] cursor-pointer"
                            >
                                <option value="all">Every Service</option>
                                <option value="Passport">Passport</option>
                                <option value="ID Card">ID Card</option>
                                <option value="Visa">Visa</option>
                                <option value="Driver License">Driver License</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        <div className="relative flex-1 md:w-56">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none pl-6 pr-12 py-5 border-2 border-gray-50 bg-gray-50/30 rounded-2xl text-xs font-black text-gray-700 uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] cursor-pointer"
                            >
                                <option value="all">Status Hierarchy</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="ready">Ready</option>
                                <option value="on-hold">On Hold</option>
                            </select>
                            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden anim-slide-up-delayed">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-blue-50 border-t-[#1e3a8a] rounded-full animate-spin"></div>
                        <div className="text-center">
                            <p className="text-xl font-black text-gray-900 tracking-tight">Updating Registry</p>
                            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs mt-1">Fetching secure encrypted data</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-gray-50/40 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100">
                                    <th className="px-10 py-8">Identity Profile</th>
                                    <th className="px-10 py-8">Communication Line</th>
                                    <th className="px-10 py-8">Service Stream</th>
                                    <th className="px-10 py-8">Progress State</th>
                                    <th className="px-10 py-8 text-right">Administrative Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 font-bold text-sm">
                                {records.map((record: Citizen) => (
                                    <tr key={record.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-black text-gray-500 shadow-inner group-hover:from-blue-500 group-hover:to-[#1e3a8a] group-hover:text-white transition-all transform group-hover:rotate-6">
                                                    {record.fullName.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="text-gray-900 font-black text-lg group-hover:text-[#1e3a8a] transition-colors">{record.fullName}</p>
                                                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                                        <Copy className="w-3 h-3" /> UID-{record.id.substring(0, 10)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-gray-600 font-mono text-base tracking-tight">{record.phoneNumber}</td>
                                        <td className="px-10 py-8">
                                            <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-black uppercase tracking-widest border border-gray-200 group-hover:bg-white transition-colors">{record.service}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border flex items-center w-fit gap-2 shadow-sm ${record.status === 'ready' ? 'bg-green-50 text-green-700 border-green-100' :
                                                record.status === 'processing' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    record.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                <div className={`w-2 h-2 rounded-full ${record.status === 'ready' ? 'bg-green-500' :
                                                    record.status === 'processing' ? 'bg-orange-500' :
                                                        record.status === 'pending' ? 'bg-blue-500' :
                                                            'bg-red-500'
                                                    } animate-pulse`}></div>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <Button variant="ghost" size="sm" onClick={() => handleSendSMS(record.id)} className="h-12 w-12 p-0 hover:text-green-600 hover:bg-green-50 rounded-2xl shadow-sm bg-white border border-gray-100 transition-all hover:scale-110" title="Dispatch SMS">
                                                    <Bell className="w-5 h-5" />
                                                </Button>
                                                <Link href={`/records?edit=${record.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-12 w-12 p-0 hover:text-blue-600 hover:bg-blue-50 rounded-2xl shadow-sm bg-white border border-gray-100 transition-all hover:scale-110" title="Modify Record">
                                                        <Edit3 className="w-5 h-5" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} className="h-12 w-12 p-0 hover:text-red-600 hover:bg-red-50 rounded-2xl shadow-sm bg-white border border-gray-100 transition-all hover:scale-110" title="Revoke Entry">
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                                                    <XCircle className="w-10 h-10 text-gray-200" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-black text-gray-900 tracking-tight">Zero Matches Identified</p>
                                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Verify search parameters or filters</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
