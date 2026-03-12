"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Users as UsersIcon, Shield, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockAdmins = [
    { name: "John Doe", email: "admin@nnlomne.gov", role: "Super Admin", added: "2023-10-01" },
    { name: "Marie Claire", email: "m.claire@nnlomne.gov", role: "Editor", added: "2023-11-15" }
];

export default function UsersPage() {
    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage administrative access and permissions.</p>
                </div>
                <Button className="bg-[#1e3a8a] text-white">+ Add Administrator</Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4">Administrator</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Date Added</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {mockAdmins.map((admin) => (
                            <tr key={admin.email} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold font-sans">
                                            {admin.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{admin.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> {admin.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                                        <Shield className="w-4 h-4 text-blue-600" />
                                        {admin.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" /> {admin.added}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" className="text-blue-700 font-bold hover:bg-blue-50">Edit</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
