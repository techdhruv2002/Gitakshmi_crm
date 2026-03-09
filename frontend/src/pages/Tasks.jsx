import { useEffect, useState } from "react";
import API from "../services/api";
import { FiCheckCircle, FiClock, FiAlertCircle, FiSearch, FiCalendar } from "react-icons/fi";
import { useToast } from "../context/ToastContext";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const toast = useToast();

    const fetchTasks = async () => {
        try {
            const res = await API.get("/tasks");
            setTasks(res.data?.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await API.patch(`/tasks/${id}`, { status });
            toast.success(`Task ${status}`);
            fetchTasks();
        } catch (err) {
            toast.error("Failed to update task.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "completed": return "bg-green-50 text-green-600 border-green-100";
            case "pending": return "bg-orange-50 text-orange-600 border-orange-100";
            case "cancelled": return "bg-red-50 text-red-600 border-red-100";
            default: return "bg-gray-50 text-gray-600 border-gray-100";
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.leadId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.leadId?.companyName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Follow-up Tasks</h1>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1 opacity-75">
                        Manage your scheduled follow-ups and reminders.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group flex-1 lg:w-64">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-transparent rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 focus:bg-white transition-all font-bold text-gray-700 text-sm shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] bg-white rounded-[2rem] border border-gray-100 flex flex-col items-center justify-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-[6px] border-blue-50 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Tasks...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTasks.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                            <FiCalendar className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No tasks found</p>
                        </div>
                    ) : (
                        filteredTasks.map(task => (
                            <div key={task._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                        <FiClock size={14} />
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {task.leadId?.name}
                                </h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">
                                    {task.leadId?.companyName || "No Company"}
                                </p>

                                <div className="flex gap-2 pt-4 border-t border-gray-50">
                                    {task.status === "pending" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(task._id, "completed")}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-green-600 transition-colors"
                                            >
                                                <FiCheckCircle size={14} /> Done
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(task._id, "cancelled")}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-400 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-colors"
                                            >
                                                <FiAlertCircle size={14} /> Skip
                                            </button>
                                        </>
                                    )}
                                    {task.status === "completed" && (
                                        <div className="w-full py-2.5 bg-green-50 text-green-600 text-center font-black text-[10px] uppercase tracking-widest rounded-xl">
                                            Completed Successfully
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Tasks;
