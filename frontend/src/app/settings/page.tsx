"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Smartphone, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500 mt-1">Configure your institution and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-600" /> Institution Profile
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name</label>
                                    <input type="text" defaultValue="NNLOMNE Administrative" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution ID</label>
                                    <input type="text" readOnly value="LKEV-2024-001" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-blue-600" /> SMS Configuration (Twilio)
                        </h2>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                Twilio settings are managed via secure environment variables. For security, keys are not displayed here.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID / Phone Number</label>
                                <input type="text" readOnly value="+13085364774" className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Save Changes</h3>
                        <p className="text-sm text-gray-500 mb-6">Updating settings will affect all administrators in your institution.</p>
                        <Button className="w-full bg-[#1e3a8a] text-white py-6 rounded-xl flex items-center gap-2">
                            <Save className="w-5 h-5" /> Save Configuration
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
