"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Send,
    Globe,
    Plus,
    Save,
    Users,
    Trash2,
    Clock,
    Sparkles
} from "lucide-react";

export default function NotificationsPage() {
    const [msgEN, setMsgEN] = useState("Hello {name}, your security code is {code}.\nPlease do not share this with anyone.");
    const [msgFR, setMsgFR] = useState("Bonjour {name}, votre code de sécurité est {code}. Veuillez ne le partager avec personne.");
    const [isSending, setIsSending] = useState(false);

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            alert("Broadcast signal successfully transmitted to authorized carrier networks.");
        }, 1500);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-6 anim-fade-in">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Broadcast Center</h1>
                    <p className="text-gray-500 mt-2 font-bold flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Multi-lingual mass notification deployment gateway
                    </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-black text-gray-400 uppercase tracking-[0.3em] bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    System Ready <span className="text-gray-200 ml-2">|</span> Draft saved 2m ago
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 anim-slide-up">
                {/* English Version */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden group hover:border-blue-200 transition-all">
                    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[10px]">EN</div>
                            <h3 className="text-sm font-black tracking-widest text-gray-700 uppercase">Primary English Stream</h3>
                        </div>
                        <Sparkles className="w-4 h-4 text-blue-200 group-hover:text-blue-500 transition-colors" />
                    </div>

                    <div className="p-8 pb-6">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {['{name}', '{date}', '{order_id}', '{station}'].map((tag) => (
                                <button key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-gray-100 hover:border-blue-100">
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={msgEN}
                            onChange={(e) => setMsgEN(e.target.value)}
                            className="w-full h-40 p-6 border-2 border-gray-50 bg-gray-50/20 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white text-gray-800 font-bold text-sm resize-none transition-all shadow-inner"
                        />

                        <div className="flex justify-between items-center mt-4 px-2">
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${msgEN.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                                    Characters: {msgEN.length} / 160
                                </span>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                    1 Segment
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* French Version */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden group hover:border-[#1e3a8a] transition-all">
                    <div className="flex justify-between items-center px-8 py-6 border-b border-gray-50 bg-gray-50/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-[10px]">FR</div>
                            <h3 className="text-sm font-black tracking-widest text-gray-700 uppercase">Version Secondaire (FR)</h3>
                        </div>
                        <Sparkles className="w-4 h-4 text-indigo-200 group-hover:text-indigo-500 transition-colors" />
                    </div>

                    <div className="p-8 pb-6">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {['{name}', '{date}', '{order_id}', '{gare}'].map((tag) => (
                                <button key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-gray-100 hover:border-indigo-100">
                                    {tag}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={msgFR}
                            onChange={(e) => setMsgFR(e.target.value)}
                            className="w-full h-40 p-6 border-2 border-gray-50 bg-gray-50/20 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#1e3a8a] focus:bg-white text-gray-800 font-bold text-sm resize-none transition-all shadow-inner"
                        />

                        <div className="flex justify-between items-center mt-4 px-2">
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-widest ${msgFR.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                                    Caractères: {msgFR.length} / 160
                                </span>
                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                    1 Segment
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden mb-10 anim-slide-up-delayed">
                <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 bg-gray-50/20">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#1e3a8a] text-white flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Recipients Queue</h2>
                    </div>
                    <Button variant="outline" className="text-xs font-black uppercase tracking-widest border-gray-200 rounded-xl px-6 py-5 hover:bg-gray-50 transition-all flex items-center gap-3">
                        <Plus className="w-4 h-4" /> Expand Audience
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-white text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100">
                                <th className="px-10 py-6">Citizen Identity</th>
                                <th className="px-10 py-6">Target Line</th>
                                <th className="px-10 py-6">Locale Preferences</th>
                                <th className="px-10 py-6 text-right">Queue Operations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold">
                            {[
                                { name: "Jean Dupont", phone: "+33 6 12 34 56 78", lang: "FR" },
                                { name: "Alice Smith", phone: "+44 7911 123456", lang: "EN" },
                                { name: "Marc Bernard", phone: "+33 7 88 99 00 11", lang: "FR" }
                            ].map((recipient, i) => (
                                <tr key={i} className="hover:bg-blue-50/10 transition-colors group">
                                    <td className="px-10 py-6 text-gray-900 font-extrabold text-base">{recipient.name}</td>
                                    <td className="px-10 py-6 text-gray-500 font-mono italic">{recipient.phone}</td>
                                    <td className="px-10 py-6">
                                        <span className={cn(
                                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                            recipient.lang === 'EN' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-100 text-gray-600 border-gray-200"
                                        )}>
                                            {recipient.lang}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-auto">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-gray-50/40 border-t border-gray-100 text-center">
                    <button className="text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.3em] transition-all">
                        Synchronize full citizen database archive...
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-100 pt-10 gap-6 mb-12 anim-fade-in">
                <label className="flex items-center gap-4 cursor-pointer group bg-white px-8 py-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-all">
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1e3a8a]"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#1e3a8a]" />
                        <span className="text-sm font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-900">Schedule Broadcast for later</span>
                    </div>
                </label>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none border-gray-200 text-gray-700 font-extrabold px-10 py-7 rounded-2xl shadow-sm uppercase tracking-widest text-xs hover:bg-gray-50 flex items-center gap-3 transition-all">
                        <Save className="w-5 h-5" /> Save Draft
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending}
                        className="flex-1 md:flex-none bg-[#1e3a8a] hover:bg-blue-900 text-white font-black px-12 py-7 rounded-2xl shadow-2xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm uppercase tracking-widest flex items-center gap-4 disabled:opacity-50"
                    >
                        {isSending ? (
                            <>Protocol Initiating...</>
                        ) : (
                            <>
                                Initiate Mass Broadcast
                                <Send className="w-5 h-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
