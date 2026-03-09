import { useEffect, useState } from "react";
import API from "../services/api";
import { FiTrendingUp, FiCheckCircle, FiXCircle, FiTarget, FiPieChart } from "react-icons/fi";

function AnalyticsDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        try {
            const [leads, deals, conversion] = await Promise.all([
                API.get("/dashboard/leads"),
                API.get("/dashboard/deals"),
                API.get("/dashboard/conversion")
            ]);
            setStats({
                leads: leads.data?.data,
                deals: deals.data?.data,
                conversion: conversion.data?.data
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="h-screen bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm animate-pulse">
            <div className="w-16 h-16 border-[8px] border-indigo-50 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[12px]">Generating Analytics Dashboard...</p>
        </div>
    );

    const metrics = [
        { title: "Total Inquiries", value: stats?.conversion?.totalInquiries, icon: FiTarget, color: "text-blue-500 bg-blue-50 border-blue-100" },
        { title: "Total Leads", value: stats?.leads?.totalLeads, icon: FiTrendingUp, color: "text-purple-500 bg-purple-50 border-purple-100" },
        { title: "Conversion Rate", value: `${stats?.conversion?.conversionRate}%`, icon: FiPieChart, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
        { title: "Deals Won", value: stats?.deals?.dealsWon, icon: FiCheckCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100" },
        { title: "Deals Lost", value: stats?.deals?.dealsLost, icon: FiXCircle, color: "text-rose-500 bg-rose-50 border-rose-100" }
    ];

    return (
        <div className="space-y-8 animate-in zoom-in-95 fade-in duration-1000 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-10 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group transition-all">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-20 -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-2">Performance Analytics</h1>
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] opacity-75">
                        Deep dive into your CRM performance and conversion funnel.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {metrics.map((m, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:translate-y-[-5px] transition-all hover:shadow-xl group">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${m.color} group-hover:scale-110 transition-transform`}>
                            <m.icon size={26} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-gray-400 font-black uppercase tracking-widest text-[9px] mb-1">{m.title}</h3>
                        <p className="text-3xl font-black text-gray-900 tracking-tight">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
                    <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Lead Funnel Summary</h2>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">New Leads</span>
                            <span className="text-lg font-black text-gray-900">{stats?.leads?.newLeads}</span>
                        </div>
                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div
                                className="h-full bg-indigo-500 rounded-full shadow-lg shadow-indigo-200 transition-all duration-1000"
                                style={{ width: `${(stats?.leads?.newLeads / stats?.leads?.totalLeads) * 100}%` }}
                            />
                        </div>

                        <div className="flex justify-between items-end mt-12">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Hot Leads (High Priority)</span>
                            <span className="text-lg font-black text-rose-600">{stats?.leads?.hotLeads}</span>
                        </div>
                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                            <div
                                className="h-full bg-rose-500 rounded-full shadow-lg shadow-rose-200 transition-all duration-1000"
                                style={{ width: `${(stats?.leads?.hotLeads / stats?.leads?.totalLeads) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 -mr-20 -mb-20 transition-all group-hover:scale-125 duration-1000" />
                    <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">Deal Performance</h2>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-sm flex flex-col items-center">
                            <FiCheckCircle size={32} className="text-emerald-500 mb-4" />
                            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Won</h4>
                            <p className="text-4xl font-black text-emerald-700">{stats?.deals?.dealsWon}</p>
                        </div>
                        <div className="p-8 bg-rose-50 rounded-3xl border border-rose-100 shadow-sm flex flex-col items-center">
                            <FiXCircle size={32} className="text-rose-500 mb-4" />
                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Lost</h4>
                            <p className="text-4xl font-black text-rose-700">{stats?.deals?.dealsLost}</p>
                        </div>
                    </div>
                    <div className="mt-8 p-10 bg-gray-50/50 rounded-3xl border border-gray-100 border-dashed text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Pipeline Value</p>
                        <p className="text-4xl font-black text-gray-900 tracking-tight">₹ {stats?.deals?.totalDeals * 1500}+ Est.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsDashboard;
