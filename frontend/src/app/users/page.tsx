"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Shield, Mail, Calendar, UserPlus, Search, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialAdmins = [
    { name: "John Doe", email: "admin@nnlomne.gov", role: "Super Admin", added: "2023-10-01" },
    { name: "Marie Claire", email: "m.claire@nnlomne.gov", role: "Editor", added: "2023-11-15" }
];

export default function UsersPage() {
    const [admins, setAdmins] = useState(initialAdmins);
    const [searchTerm, setSearchTerm] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddAdmin = () => {
        // Just as demonstration of functionality
        const name = prompt("Enter Administrator Name:");
        const email = prompt("Enter Email address:");
        if (name && email) {
            setAdmins([...admins, {
                name,
                email,
                role: "Editor",
                added: new Date().toISOString().split('T')[0]
            }]);
        }
    };

    const handleDelete = (email: string) => {
        if (confirm("Revoke administrative access for this user?")) {
            setAdmins(admins.filter(a => a.email !== email));
        }
    };

    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Access Control</h1>
                    <p className="text-gray-500 mt-1 font-medium">Manage administrative staff and system permissions.</p>
                </div>
                <Button
                    onClick={handleAddAdmin}
                    className="bg-[#1e3a8a] text-white font-extrabold px-6 py-6 rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-900 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" /> Add New Administrator
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all font-bold text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <th className="px-8 py-5">Administrator</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5">Date Added</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredAdmins.map((admin) => (
                                <tr key={admin.email} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-[#1e3a8a] text-white flex items-center justify-center font-extrabold shadow-lg shadow-blue-100">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-gray-900 text-base">{admin.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1 font-bold mt-0.5">
                                                    <Mail className="w-3 h-3" /> {admin.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border border-blue-100">
                                            <Shield className="w-3.5 h-3.5" />
                                            {admin.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-gray-500 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-300" /> {admin.added}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-blue-50 hover:text-[#1e3a8a]">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(admin.email)}
                                                className="h-10 w-10 p-0 rounded-xl hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
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
