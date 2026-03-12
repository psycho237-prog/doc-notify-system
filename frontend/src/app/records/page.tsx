"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Search,
    Download,
    Edit,
    Bell,
    ChevronDown,
    Trash2
} from "lucide-react";

const recordsData = [
    { id: 1, name: "Robert Chen", email: "robert.c@example.gov", phone: "+1 (555) 012-3456", service: "Business License", status: "Active" },
    { id: 2, name: "Sarah Miller", email: "s.miller@provider.net", phone: "+1 (555) 987-6543", service: "Zone Permit", status: "Pending" },
    { id: 3, name: "Marcus Wright", email: "m.wright@city.com", phone: "+1 (555) 234-5678", service: "Safety Inspection", status: "Expired" },
    { id: 4, name: "Linda Thompson", email: "linda.t@service.gov", phone: "+1 (555) 345-6789", service: "Building Code", status: "Active" },
    { id: 5, name: "James Wilson", email: "james.w@mail.com", phone: "+1 (555) 456-7890", service: "Health Permit", status: "Active" },
];

export default function RecordsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Records Management</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Button className="flex items-center gap-2 bg-[#4361ee] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md px-6">
                        + Add New Record
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="relative">
                        <select className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer">
                            <option>All Services</option>
                            <option>Business License</option>
                            <option>Zone Permit</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer">
                            <option>All Statuses</option>
                            <option>Active</option>
                            <option>Pending</option>
                            <option>Expired</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <Button variant="outline" className="flex items-center gap-2 border-gray-200 text-gray-600 rounded-lg shadow-sm w-10 h-10 p-0 justify-center">
                    <Download className="w-5 h-5" />
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Phone Number</th>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-sm">
                        {recordsData.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-gray-900 font-bold">{record.name}</p>
                                    <p className="text-gray-500 font-normal text-xs mt-0.5">{record.email}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{record.phone}</td>
                                <td className="px-6 py-4 text-gray-600">{record.service}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'Active' ? 'bg-green-100 text-green-700' :
                                            record.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-3 text-gray-400">
                                        <button className="hover:text-[#4361ee] transition-colors"><Edit className="w-5 h-5" /></button>
                                        <button className="hover:text-[#4361ee] transition-colors"><Bell className="w-5 h-5" /></button>
                                        <button className="hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                    <p>Showing 1 to 5 of 124 results</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-gray-200 text-gray-400 rounded-md shadow-sm h-9 px-3 disabled:opacity-50">
                            Previous
                        </Button>
                        <div className="flex gap-1">
                            <Button className="bg-[#4361ee] hover:bg-blue-700 text-white rounded-md shadow-sm h-9 w-9 p-0">1</Button>
                            <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 w-9 p-0">2</Button>
                            <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 w-9 p-0">3</Button>
                            <span className="px-2 py-1.5">...</span>
                            <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 w-9 p-0">25</Button>
                        </div>
                        <Button variant="outline" className="border-gray-200 text-gray-600 rounded-md shadow-sm h-9 px-3">
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
