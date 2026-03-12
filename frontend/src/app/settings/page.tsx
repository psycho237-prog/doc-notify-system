"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Smartphone, Globe, Save, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    const [name, setName] = useState("NNLOMNE Administrative");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(r => setTimeout(r, 1200));
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <DashboardLayout>
            <div className="mb-8 anim-fade-in">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
                <p className="text-gray-500 mt-1 font-medium">Configure your institution and notification preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 hover:border-blue-100 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-[#1e3a8a]" />
                            </div>
                            Institution Profile
                        </h2>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest ml-1">Institution Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] outline-none transition-all font-bold text-gray-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest ml-1">Institution ID</label>
                                    <div className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 text-gray-400 font-mono text-sm flex items-center justify-between">
                                        LKEV-2024-001
                                        <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Read Only</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 hover:border-blue-100 transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-[#1e3a8a]" />
                            </div>
                            SMS Configuration (Twilio)
                        </h2>
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <Globe className="w-4 h-4 text-blue-600" />
                                </div>
                                <p className="text-xs text-blue-800 font-bold leading-relaxed">
                                    Twilio credentials are encrypted and stored in environment variables. To update tokens, please contact your system administrator.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-widest ml-1">Sender ID / Phone Number</label>
                                <div className="w-full px-5 py-4 border border-gray-100 rounded-2xl bg-gray-50 text-gray-400 font-mono text-sm">
                                    +1 (308) 536-4774
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/10 border border-gray-100 p-8 sticky top-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <Save className="w-8 h-8 text-[#1e3a8a]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Save Changes</h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium leading-relaxed">Changes to the institution profile will be visible to all administrative users immediately.</p>

                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-full py-8 rounded-2xl flex items-center justify-center gap-3 transition-all text-base font-extrabold shadow-xl ${saved ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-[#1e3a8a] text-white hover:bg-blue-900 shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : saved ? (
                                <CheckCircle className="w-6 h-6" />
                            ) : (
                                <Save className="w-6 h-6" />
                            )}
                            {isSaving ? "Saving..." : saved ? "Config Updated!" : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
