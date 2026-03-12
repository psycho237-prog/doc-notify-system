"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Bell, ChevronsRight } from "lucide-react";

export default function NotificationsPage() {
    const [msgEN, setMsgEN] = useState("Hello {name}, your security code is {code}.\nPlease do not share this with anyone.");
    const [msgFR, setMsgFR] = useState("Bonjour {name}, votre code de sécurité est {code}. Veuillez ne le partager avec personne.");

    return (
        <DashboardLayout>
            <div className="flex justify-between items-end mb-8 relative">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Compose New Notification</h1>

                <div className="flex items-center gap-4 text-sm text-gray-500 italic">
                    <span>Saved as draft 2 mins ago</span>
                    <Bell className="w-5 h-5 text-gray-400 cursor-pointer" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* English Version */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50">
                        <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase">English Version</h3>
                        <span className="text-xs font-semibold text-gray-400">EN</span>
                    </div>

                    <div className="p-6 pb-4">
                        <div className="flex gap-2 mb-4">
                            {['{name}', '{date}', '{order_id}'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <textarea
                            value={msgEN}
                            onChange={(e) => setMsgEN(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent text-gray-800 text-sm resize-none mb-2"
                        />

                        <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                            <span>Characters: {msgEN.length} / 160</span>
                            <span>1 SMS segment</span>
                        </div>
                    </div>
                </div>

                {/* French Version */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-50">
                        <h3 className="text-sm font-bold tracking-wider text-gray-700 uppercase">Version Française</h3>
                        <span className="text-xs font-semibold text-gray-400">FR</span>
                    </div>

                    <div className="p-6 pb-4">
                        <div className="flex gap-2 mb-4">
                            {['{name}', '{date}', '{order_id}'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <textarea
                            value={msgFR}
                            onChange={(e) => setMsgFR(e.target.value)}
                            className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent text-gray-800 text-sm resize-none mb-2"
                        />

                        <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
                            <span>Caractères: {msgFR.length} / 160</span>
                            <span>1 segment SMS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900">Recipients (12 Selected)</h2>
                    <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        + Add More
                    </button>
                </div>

                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                            <th className="px-6 py-4 font-semibold tracking-wider">Name</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Phone Number</th>
                            <th className="px-6 py-4 font-semibold tracking-wider">Language</th>
                            <th className="px-6 py-4 font-semibold tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-gray-900">Jean Dupont</td>
                            <td className="px-6 py-4 text-gray-600">+33 6 12 34 56 78</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">FR</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-red-500 hover:text-red-600 transition-colors">Remove</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-gray-900">Alice Smith</td>
                            <td className="px-6 py-4 text-gray-600">+44 7911 123456</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">EN</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-red-500 hover:text-red-600 transition-colors">Remove</button>
                            </td>
                        </tr>
                        <tr className="hover:bg-gray-50/50">
                            <td className="px-6 py-4 text-gray-900">Marc Bernard</td>
                            <td className="px-6 py-4 text-gray-600">+33 7 88 99 00 11</td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">FR</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-red-500 hover:text-red-600 transition-colors">Remove</button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div className="p-4 border-t border-gray-100 text-center">
                    <a href="#" className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors">
                        Show all recipients...
                    </a>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4361ee] focus:ring-[#4361ee] transition-all" />
                    <span className="text-sm text-gray-600 font-medium group-hover:text-gray-900 transition-colors">Schedule for later</span>
                </label>

                <div className="flex items-center gap-4">
                    <Button variant="outline" className="border-gray-200 text-gray-700 font-semibold px-6 shadow-sm">
                        Save Draft
                    </Button>
                    <Button className="bg-[#2f55ed] hover:bg-[#203db8] text-white font-bold px-8 shadow-sm flex items-center gap-2">
                        Send SMS Notification
                        <ChevronsRight className="w-5 h-5 ml-1" />
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
