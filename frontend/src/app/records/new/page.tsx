"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export default function NewRecordPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        language: "",
        service: "",
        requestType: "",
        status: "Pending"
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = () => {
        console.log("Saving dossier:", formData);
        // Add Firebase logic here
        router.push("/records");
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Create New Dossier</h1>
                <p className="text-gray-500">Fill in the details below to register a new file in the system.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="e.g. Jean Dupont"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent transition-all text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Phone Number
                        </label>
                        <input
                            type="text"
                            name="phone"
                            placeholder="+237 6xx xxx xxx"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent transition-all text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Preferred Language
                        </label>
                        <div className="relative">
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer"
                            >
                                <option value="" disabled>Select Language</option>
                                <option value="EN">English</option>
                                <option value="FR">French</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Service
                        </label>
                        <div className="relative">
                            <select
                                name="service"
                                value={formData.service}
                                onChange={handleChange}
                                className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer"
                            >
                                <option value="" disabled>Select Service</option>
                                <option value="Business License">Business License</option>
                                <option value="Zone Permit">Zone Permit</option>
                                <option value="Safety Inspection">Safety Inspection</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Request Type
                        </label>
                        <input
                            type="text"
                            name="requestType"
                            placeholder="e.g. Legal Certification, Transcript"
                            value={formData.requestType}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4361ee] focus:border-transparent transition-all text-sm font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold tracking-wider text-gray-700 uppercase mb-2">
                            Status
                        </label>
                        <div className="relative">
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full appearance-none px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#4361ee] cursor-pointer"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Ready">Ready</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                </div>

                <div className="mt-12 flex items-center justify-end gap-4 border-t border-gray-100 pt-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-gray-500 font-bold tracking-wider text-sm px-6 bg-gray-50/80 hover:bg-gray-100 h-12"
                    >
                        CANCEL
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-[#2f55ed] hover:bg-[#203db8] text-white font-bold tracking-wider text-sm px-8 h-12 shadow-sm"
                    >
                        SAVE DOSSIER
                    </Button>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-gray-400 font-medium pb-8 max-w-4xl">
                <p>© 2023 NNLOMNE Notify. Optimized for Administrative Workflow.</p>
            </div>
        </DashboardLayout>
    );
}
