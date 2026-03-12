"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2, CheckCircle2 } from "lucide-react";

export default function NewRecordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        service: "Passport",
        status: "pending"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const institutionId = localStorage.getItem("institutionId") || "nnlomne";
            const res = await fetch("/api/citizens", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, institutionId })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => router.push("/records"), 1500);
            } else {
                alert("Failed to save record.");
            }
        } catch (err) {
            console.error("Save error:", err);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <DashboardLayout>
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Record Saved Successfully!</h2>
                    <p className="text-gray-500">Redirecting to records management...</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Create New Dossier</h1>
                <p className="text-gray-500 font-medium">Fill in the details below to register a new file in the system.</p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 max-w-4xl glass-card">
                <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        <div>
                            <label className="block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase mb-3">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                required
                                placeholder="e.g. Jean Dupont"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-5 py-4 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all text-sm font-bold bg-gray-50/30"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase mb-3">
                                Phone Number
                            </label>
                            <input
                                type="text"
                                name="phoneNumber"
                                required
                                placeholder="+237 6xx xxx xxx"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full px-5 py-4 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] transition-all text-sm font-bold bg-gray-50/30 font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase mb-3">
                                Service Type
                            </label>
                            <div className="relative">
                                <select
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    className="w-full appearance-none px-5 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] cursor-pointer"
                                >
                                    <option value="Passport">Passport Delivery</option>
                                    <option value="ID Card">ID Card Registration</option>
                                    <option value="Visa">Visa Extension</option>
                                    <option value="Driver License">Driver License Renewal</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold tracking-widest text-[#1e3a8a] uppercase mb-3">
                                Initial Status
                            </label>
                            <div className="relative">
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full appearance-none px-5 py-4 border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] cursor-pointer"
                                >
                                    <option value="pending">Pending Registration</option>
                                    <option value="processing">In Processing</option>
                                    <option value="ready">Ready for Pickup</option>
                                    <option value="on-hold">On Hold / Clarification</option>
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-10 border-t border-gray-100 mt-10">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-gray-500 font-bold tracking-widest text-xs px-8 hover:bg-gray-100 h-14 rounded-2xl"
                        >
                            DISCARD
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-[#1e3a8a] hover:bg-blue-900 text-white font-extrabold tracking-widest text-xs px-10 h-14 rounded-2xl shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "REGISTER DOSSIER"}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
