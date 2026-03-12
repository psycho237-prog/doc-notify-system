"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    Bell,
    ChevronDown,
    Calendar,
    CheckCircle2,
    XCircle
} from "lucide-react";

const smsData = [
    { id: 1, name: "John Doe", initials: "JD", color: "bg-blue-100 text-blue-600", phone: "+1 (555) 123-4567", snippet: "Your appointment is scheduled for tomorr...", status: "Sent", date: "Oct 24, 2023 · 09:41 AM" },
    { id: 2, name: "Alice Smith", initials: "AS", color: "bg-orange-100 text-orange-600", phone: "+1 (555) 987-6543", snippet: "Urgent: Please update your billing inform...", status: "Failed", date: "Oct 24, 2023 · 08:30 AM" },
    { id: 3, name: "Bob Johnson", initials: "BJ", color: "bg-purple-100 text-purple-600", phone: "+1 (555) 444-3322", snippet: "Welcome to NNLOMNE! Your registration...", status: "Sent", date: "Oct 23, 2023 · 14:15 PM" },
    { id: 4, name: "Charlie Lee", initials: "CL", color: "bg-green-100 text-green-600", phone: "+1 (555) 777-8899", snippet: "Your one-time code is 482931. Valid for t...", status: "Sent", date: "Oct 23, 2023 · 09:00 AM" },
    { id: 5, name: "Unknown Recipient", initials: "UK", color: "bg-gray-100 text-gray-600", phone: "+1 (555) 000-0000", snippet: "Reminder: Your subscription expires soo...", status: "Failed", date: "Oct 22, 2023 · 08:30 AM" },
];

export default function SMSHistoryPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8 relative">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SMS Communication History</h1>

                <div className="flex items-center gap-4">
                    <Bell className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
                    <Button className="bg-[#2f55ed] hover:bg-[#203db8] text-white font-bold px-6 shadow-sm flex items-center gap-2">
                        Send New SMS
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-wrap items-center justify-between mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <select className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer min-w-[140px]">
                            <option>All Statuses</option>
                            <option>Sent</option>
                            <option>Failed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="mm/dd/yyyy"
                            className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] min-w-[140px]"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 font-semibold rounded-lg shadow-sm px-4 h-10">
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-6 py-4">Recipient</th>
                                <th className="px-6 py-4">Phone Number</th>
                                <th className="px-6 py-4">Message Snippet</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date/Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                            {smsData.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${row.color}`}>
                                            {row.initials}
                                        </div>
                                        <span className="text-gray-900 font-bold">{row.name}</span>
                                    </td>
                                    <td className="px-6 py-4">{row.phone}</td>
                                    <td className="px-6 py-4 text-gray-500 truncate max-w-[250px]">{row.snippet}</td>
                                    <td className="px-6 py-4">
                                        {row.status === 'Sent' ? (
                                            <span className="flex w-fit items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                                            </span>
                                        ) : (
                                            <span className="flex w-fit items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">
                                                <XCircle className="w-3.5 h-3.5" /> Failed
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{row.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                    <p>Showing 1 to 5 of 156 results</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 px-3 disabled:opacity-50 font-medium">
                            Previous
                        </Button>
                        <div className="flex gap-1">
                            <Button className="bg-[#4361ee] hover:bg-blue-700 text-white rounded-md shadow-sm h-9 w-9 p-0 font-bold">1</Button>
                            <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 w-9 p-0 font-medium hover:bg-gray-50">2</Button>
                            <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 w-9 p-0 font-medium hover:bg-gray-50">3</Button>
                        </div>
                        <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 px-3 font-medium hover:bg-gray-50">
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
