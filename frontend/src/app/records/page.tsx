"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    Edit,
    Bell,
    ChevronDown,
    Trash2,
    Loader2,
    Plus,
    X
} from "lucide-react";
import Link from "next/link";

export default function RecordsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [records, setRecords] = useState<any[]>([]);
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
                setRecords(data);
            } catch (err) {
                console.error("Records fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchRecords, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, serviceFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await fetch(`/api/citizens/${id}`, { method: 'DELETE' });
            setRecords(records.filter(r => r.id !== id));
        } catch (err) {
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
            alert(data.message || "SMS notification sent!");
        } catch (err) {
            alert("Failed to send SMS.");
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Records Management</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage and notify your citizen database.</p>
                </div>
                <Link href="/records/new">
                    <Button className="flex items-center gap-2 bg-[#1e3a8a] text-white font-bold rounded-xl shadow-lg px-6 py-6 hover:bg-blue-900 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="w-5 h-5" /> Add New Record
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full lg:max-w-4xl">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative w-full md:w-64">
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
                        >
                            <option value="all">All Services</option>
                            <option value="Passport">Passport</option>
                            <option value="ID Card">ID Card</option>
                            <option value="Visa">Visa</option>
                            <option value="Driver License">Driver License</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative w-full md:w-64">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none pl-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="ready">Ready</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 rounded-xl shadow-sm w-12 h-12 p-0 justify-center">
                    <Download className="w-5 h-5" />
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#1e3a8a]" />
                        <p className="text-gray-500 font-medium">Updating records...</p>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <th className="px-6 py-5">Citizen Information</th>
                                    <th className="px-6 py-5">Phone Number</th>
                                    <th className="px-6 py-5">Service</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-medium text-sm">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <p className="text-gray-900 font-bold">{record.fullName}</p>
                                            <p className="text-gray-500 font-medium text-[11px] uppercase tracking-wider mt-0.5">ID: {record.id.substring(0, 8)}</p>
                                        </td>
                                        <td className="px-6 py-5 text-gray-600 font-mono italic">{record.phoneNumber}</td>
                                        <td className="px-6 py-5 font-bold text-gray-700">{record.service}</td>
                                        <td className="px-6 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${record.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                record.status === 'processing' ? 'bg-orange-100 text-orange-700' :
                                                    record.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex justify-end gap-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" onClick={() => handleSendSMS(record.id)} className="h-9 w-9 p-0 hover:text-green-600 hover:bg-green-50 rounded-full">
                                                    <Bell className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)} className="h-9 w-9 p-0 hover:text-red-600 hover:bg-red-50 rounded-full">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {records.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center font-medium text-gray-500 italic">
                                            No matching records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
