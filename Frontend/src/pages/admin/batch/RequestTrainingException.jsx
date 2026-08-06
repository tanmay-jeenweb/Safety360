import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getBatches, getBatchParticipants, requestTrainingException, getExceptionRequests } from "../../../api/batchApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function RequestTrainingException() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState("");
    const [participants, setParticipants] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [comments, setComments] = useState("");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [batchesRes, requestsRes] = await Promise.all([
                getBatches(),
                getExceptionRequests()
            ]);
            // Filter batches that are active and not closed
            const activeBatches = (batchesRes.data.data || []).filter(b => 
                b.status && ["pretest active", "training held", "posttest active"].includes(b.status.toLowerCase())
            );
            setBatches(activeBatches);
            setRequests(requestsRes.data.data || []);
        } catch (err) {
            console.error("Failed to load initial data", err);
            toast.error("Failed to load batches and requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    // Load participants when batch changes
    useEffect(() => {
        if (!selectedBatchId) {
            setParticipants([]);
            setSelectedEmployeeId("");
            return;
        }

        const fetchParticipants = async () => {
            try {
                const res = await getBatchParticipants(selectedBatchId);
                setParticipants(res.data.data || []);
                setSelectedEmployeeId("");
            } catch (err) {
                console.error("Failed to load participants", err);
                toast.error("Failed to load participants for selected batch");
            }
        };

        fetchParticipants();
    }, [selectedBatchId]);

    // Trainees who missed the pre-test and don't already have an approved exception
    const ineligibleTrainees = useMemo(() => {
        return participants.filter(p => p.pre_test_score === null && p.allow_training_exception === 0);
    }, [participants]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBatchId || !selectedEmployeeId) {
            toast.error("Please select a batch and a trainee");
            return;
        }

        setSubmitting(true);
        try {
            await requestTrainingException(selectedBatchId, selectedEmployeeId, comments);
            toast.success("Exception request submitted to administrator");
            setComments("");
            setSelectedEmployeeId("");
            // Reload requests
            const reqsRes = await getExceptionRequests();
            setRequests(reqsRes.data.data || []);
        } catch (err) {
            console.error("Failed to submit exception request", err);
            toast.error(err?.response?.data?.message || "Failed to submit exception request");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Rejected":
                return "bg-rose-50 text-rose-700 border-rose-200";
            default:
                return "bg-amber-50 text-amber-700 border-amber-200";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
                        <span className="text-sm font-semibold text-slate-600">Loading request exception page...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
                
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#253361]"></div>
                    <div className="pl-2">
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Allow Employee to Attend Training</h1>
                        <p className="text-slate-500 text-xs font-semibold mt-1">Submit exception requests for trainees who missed their pre-test assessments.</p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/batches")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-655 font-bold text-xs rounded-xl transition-all border border-slate-200 cursor-pointer self-start sm:self-center"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                        <span>Back to Batches</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Submission Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 lg:col-span-1">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Submit Exception Request</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Batch</label>
                                <select
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                    required
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                                >
                                    <option value="">Choose a Batch...</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            BAT-b{String(b.id).padStart(7, '0')} · {b.module_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Select Trainee (who missed pre-test)</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    required
                                    disabled={!selectedBatchId || ineligibleTrainees.length === 0}
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{selectedBatchId ? (ineligibleTrainees.length === 0 ? "No trainees missed pre-test" : "Choose Trainee...") : "First choose a batch..."}</option>
                                    {ineligibleTrainees.map(t => (
                                        <option key={t.employee_id} value={t.employee_id}>
                                            {t.full_name} ({t.employee_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Comments / Justification</label>
                                <textarea
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Provide a brief reason for requesting this exception..."
                                    rows="4"
                                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedBatchId || !selectedEmployeeId}
                                className="w-full bg-[#253361] hover:bg-[#1a2446] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none flex justify-center items-center gap-1.5"
                            >
                                {submitting ? "Submitting..." : "Submit Exception Request"}
                            </button>
                        </form>
                    </div>

                    {/* Exceptions List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 lg:col-span-2">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">My Exception Requests History</h3>
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                                Total: {requests.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/40">
                                        <th className="py-3.5 px-4">Batch Code / Module</th>
                                        <th className="py-3.5 px-4">Trainee</th>
                                        <th className="py-3.5 px-4">Comments</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                        <th className="py-3.5 px-4">Requested On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {requests.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-8 text-center text-sm font-semibold text-slate-400">
                                                No exception requests submitted yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        requests.map(req => (
                                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors text-xs">
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-mono text-slate-500 font-bold">BAT-b{String(req.batch_id).padStart(7, '0')}</span>
                                                        <span className="font-bold text-slate-800 mt-0.5">{req.module_name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{req.employee_name}</span>
                                                        <span className="text-[10px] text-slate-400 mt-0.5 font-mono">{req.employee_code}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-600" title={req.comments}>
                                                    {req.comments || "—"}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusStyle(req.status)}`}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-500 font-semibold font-mono">
                                                    {new Date(req.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
