"use client";

import {
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Send
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";

const stats = [
    {
        title: "TOTAL REGISTERED",
        value: "2,481",
        change: "+12% vs last month",
        trend: "up",
        icon: null
    },
    {
        title: "PROCESSING",
        value: "342",
        change: "Active batches",
        trend: "neutral",
        icon: <Clock className="w-4 h-4 mr-1 text-orange-500" />
    },
    {
        title: "READY FOR NOTIFICATION",
        value: "89",
        change: "Requires Action",
        trend: "neutral",
        icon: <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
    },
    {
        title: "SMS SENT TODAY",
        value: "1,205",
        change: "+98.2% Delivery rate",
        trend: "up",
        icon: null
    }
];

const recentUpdates = [
    { id: "#DOS-9281-A", name: "Jean Dupont", status: "Ready", time: "2 mins ago", notification: "Pending" },
    { id: "#DOS-9280-B", name: "Marie Leblanc", status: "Processing", time: "14 mins ago", notification: "—" },
    { id: "#DOS-9279-C", name: "Ahmed Khalil", status: "Registered", time: "45 mins ago", notification: "—" },
    { id: "#DOS-9278-D", name: "Lucille Vachon", status: "Ready", time: "1 hour ago", notification: "Sent" },
    { id: "#DOS-9277-E", name: "Pierre Dubois", status: "On Hold", time: "3 hours ago", notification: "—" },
];

export default function DashboardPage() {
    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, here&apos;s what&apos;s happening with your dossiers today.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="flex items-center gap-2 border-gray-300 text-gray-700 font-semibold bg-white rounded-lg shadow-sm">
                        <Send className="w-4 h-4" /> Send SMS
                    </Button>
                    <Button className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-semibold rounded-lg shadow-md px-6">
                        + Add New Dossier
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</h3>
                        <div className="text-4xl font-bold text-gray-900 mt-2 mb-6">{stat.value}</div>

                        <div className={`flex items-center text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' :
                            stat.trend === 'down' ? 'text-red-600' : 'text-orange-600'
                            }`}>
                            {stat.trend === 'up' && !stat.icon && <ArrowUpRight className="w-4 h-4 mr-1" />}
                            {stat.trend === 'down' && !stat.icon && <ArrowDownRight className="w-4 h-4 mr-1" />}
                            {stat.icon}
                            <span className={stat.icon ? 'text-gray-600' : ''}>{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">Recent Dossier Updates</h2>
                    <a href="/records" className="text-sm font-semibold text-[#1e3a8a] hover:text-blue-800 transition-colors">
                        View All Dossiers
                    </a>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                <th className="px-6 py-4">Dossier ID</th>
                                <th className="px-6 py-4">Applicant Name</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Last Update</th>
                                <th className="px-6 py-4">Notification</th>
                                <th className="px-6 py-4 flex justify-end">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-sm">
                            {recentUpdates.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-900">{row.id}</td>
                                    <td className="px-6 py-4 text-gray-700">{row.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status === 'Ready' ? 'bg-green-100 text-green-700' :
                                            row.status === 'Processing' ? 'bg-orange-100 text-orange-700' :
                                                row.status === 'Registered' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{row.time}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {row.notification === 'Sent' ? (
                                            <span className="flex items-center text-green-600 font-semibold gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                                Sent
                                            </span>
                                        ) : (
                                            row.notification
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a href="#" className="font-semibold text-[#1e3a8a] hover:text-blue-800 transition-colors">
                                            Update
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-100 text-center">
                    <a href="#" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                        Show More Activity
                    </a>
                </div>
            </div>
        </DashboardLayout>
    );
}
