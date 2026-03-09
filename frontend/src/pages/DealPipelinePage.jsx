import { useEffect, useState } from "react";
import API from "../services/api";
import { FiTrendingUp, FiTarget, FiBriefcase, FiCheckCircle, FiActivity } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

function DealPipeline() {
    const [deals, setDeals] = useState([]);
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipeline, setSelectedPipeline] = useState(null);
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    const fetchInitialData = async () => {
        try {
            const resPipelines = await API.get("/pipelines");
            const pipes = resPipelines.data?.data || [];
            setPipelines(pipes);

            if (pipes.length > 0) {
                const defaultPipe = pipes[0];
                setSelectedPipeline(defaultPipe);
                fetchStages(defaultPipe._id);
            }
            fetchDeals();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStages = async (pipelineId) => {
        try {
            const res = await API.get(`/pipelines/${pipelineId}/stages`);
            setStages(res.data?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchDeals = async () => {
        try {
            const res = await API.get("/deals");
            setDeals(res.data?.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleUpdateStage = async (id, stageId) => {
        try {
            await API.patch(`/deals/${id}/stage`, { stageId });
            toast.success("Deal stage updated");
            fetchDeals();
        } catch (err) {
            toast.error("Failed to move deal.");
        }
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case "Won": return "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50 tooltip-emerald-500 shadow-lg shadow-emerald-100/50 scale-105 z-10 animate-pulse-slow";
            case "Lost": return "bg-rose-50 text-rose-600 border-rose-100";
            case "Negotiation": return "bg-sky-50 text-sky-600 border-sky-100 shadow-lg shadow-sky-50 transition-all active:scale-95 group-hover:bg-sky-100";
            default: return "bg-gray-50 text-gray-500 border-gray-100";
        }
    };

    if (loading) return (
        <div className="h-screen bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm animate-pulse transition-opacity duration-700">
            <div className="w-12 h-12 border-[6px] border-sky-50 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing CRM Pipeline...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-3xl opacity-30 -mr-10 -mt-10 group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
                        {selectedPipeline ? selectedPipeline.name : "Deal Pipeline"}
                    </h1>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest opacity-75">
                        Manage your opportunities across visual stages.
                    </p>
                </div>
                {pipelines.length > 1 && (
                    <select
                        className="relative z-10 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-sky-500/20"
                        value={selectedPipeline?._id}
                        onChange={(e) => {
                            const p = pipelines.find(x => x._id === e.target.value);
                            setSelectedPipeline(p);
                            fetchStages(p._id);
                        }}
                    >
                        {pipelines.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                )}
            </div>

            <div className="flex flex-nowrap overflow-x-auto pb-8 gap-6 min-h-[60vh] snap-x snap-mandatory scroll-smooth p-2">
                {stages.map(stage => {
                    const stageDeals = deals.filter(d =>
                        d.stageId?._id === stage._id || d.stage === stage.name
                    );
                    const stageValue = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);

                    return (
                        <div key={stage._id} className="min-w-[320px] max-w-[320px] bg-white border border-gray-100 rounded-3xl flex flex-col shadow-sm snap-start hover:shadow-xl transition-all duration-500 group">
                            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2 group-hover:text-sky-600 transition-colors">
                                        <FiTarget size={16} />
                                        {stage.name}
                                    </h3>
                                    <span className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black text-gray-400 border border-gray-100 group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-100 transition-all active:scale-95 group-active:scale-95 duration-300">
                                        {stageDeals.length}
                                    </span>
                                </div>
                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex flex-col justify-center gap-1 group-hover:bg-white transition-all">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Potential value</p>
                                    <p className="text-lg font-black text-gray-900 group-hover:text-emerald-600 transition-colors opacity-90">₹ {stageValue.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="p-4 overflow-y-auto max-h-[600px] flex flex-col gap-4 bg-gray-50/30">
                                {stageDeals.length === 0 ? (
                                    <div className="py-20 text-center bg-white/40 border-2 border-dashed border-gray-100 rounded-2xl grayscale transition-all duration-700 hover:scale-95 hover:grayscale-0">
                                        <p className="text-gray-300 font-black uppercase tracking-widest text-[10px] opacity-60">Empty stage</p>
                                    </div>
                                ) : (
                                    stageDeals.map(deal => (
                                        <div key={deal._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300 group cursor-grab active:cursor-grabbing border-b-4 border-b-sky-500/0 hover:border-b-sky-500 group/item">
                                            <div className="flex flex-col gap-3">
                                                <h4 className="font-black text-gray-900 text-sm group-hover/item:text-sky-600 transition-colors line-clamp-1">{deal.title || deal.leadId?.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-lg border border-gray-100 flex items-center gap-1.5 opacity-80 group-hover/item:opacity-100 group-hover/item:bg-sky-50 transition-all duration-300">
                                                        <FiBriefcase size={12} /> ₹ {deal.value?.toLocaleString() || 0}
                                                    </span>
                                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-lg border border-gray-100 flex items-center gap-1.5 opacity-80 group-hover/item:opacity-100 group-hover/item:bg-emerald-50 transition-all duration-300">
                                                        <FiActivity size={12} /> {deal.assignedTo?.name?.split(' ')[0] || "No owner"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-5 grid grid-cols-2 gap-2 opacity-0 group-hover/item:opacity-100 translate-y-2 group-hover/item:translate-y-0 transition-all duration-500 pointer-events-none group-hover/item:pointer-events-auto">
                                                {stage.winLikelihood === "open" && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                const wonStage = stages.find(s => s.winLikelihood === "won");
                                                                if (wonStage) handleUpdateStage(deal._id, wonStage._id);
                                                            }}
                                                            className="py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
                                                        >
                                                            <FiCheckCircle size={14} className="inline mr-1" /> Won
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const currentIndex = stages.findIndex(s => s._id === stage._id);
                                                                const nextStage = stages[currentIndex + 1];
                                                                if (nextStage) handleUpdateStage(deal._id, nextStage._id);
                                                            }}
                                                            className="py-2 bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-200"
                                                            disabled={stages.indexOf(stage) === stages.length - 1}
                                                        >
                                                            Next Stage
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default DealPipeline;
