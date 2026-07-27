import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import {
    getBatchById,
    getBatchParticipants,
    addBatchParticipant,
    removeBatchParticipant,
    updateBatchParticipant,
    updateBatch
} from "../../../api/batchApi";
import { getEmployees } from "../../../api/employeeApi";
import { getTrainingModuleById } from "../../../api/trainingModuleApi";
import toast from "react-hot-toast";

const STATUS_STEPS = [
    { label: "Draft Setup", value: "Draft" },
    { label: "Pre-Test Active", value: "Pretest Active" },
    { label: "Training Held", value: "Training Held" },
    { label: "Post-Test Active", value: "Posttest Active" },
    { label: "Feedback Pending", value: "Feedback" },
    { label: "Batch Closed", value: "Closed" }
];

export default function ManageBatch() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [batch, setBatch] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [trainingModule, setTrainingModule] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch batch details and participants
    const fetchData = async () => {
        setLoading(true);
        try {
            const batchRes = await getBatchById(id);
            const batchData = batchRes.data.data;
            setBatch(batchData);

            // Fetch participants
            const partRes = await getBatchParticipants(id);
            setParticipants(partRes.data.data || []);

            // Fetch module details
            if (batchData.training_module_id) {
                const modRes = await getTrainingModuleById(batchData.training_module_id);
                setTrainingModule(modRes.data.data);
            }

            // Fetch all employees for manual selection
            const empRes = await getEmployees();
            setEmployees(empRes.data.data || []);

        } catch (err) {
            console.error("Error loading batch details:", err);
            toast.error("Failed to load batch details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    // Active step calculation
    const currentStepIndex = useMemo(() => {
        if (!batch) return 0;
        const idx = STATUS_STEPS.findIndex(s => s.value.toLowerCase() === batch.status.toLowerCase());
        return idx !== -1 ? idx : 0;
    }, [batch]);

    // Filter employees: same client organization, and not already registered in this batch
    const availableEmployees = useMemo(() => {
        if (!batch || !employees.length) return [];
        return employees.filter(emp => 
            emp.client_id === batch.client_id && 
            !participants.some(part => part.employee_id === emp.id)
        );
    }, [batch, employees, participants]);

    // Search query filter for available employees
    const filteredAvailableEmployees = useMemo(() => {
        if (!availableEmployees.length) return [];
        return availableEmployees.filter(emp => 
            emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.employee_code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [availableEmployees, searchQuery]);

    // Add employee manually
    const handleAddParticipant = async (e) => {
        e.preventDefault();
        if (selectedEmployeeIds.length === 0) {
            toast.error("Please choose at least one employee");
            return;
        }

        if (participants.length + selectedEmployeeIds.length > batch.batch_size) {
            toast.error(`Adding these trainees exceeds the batch size limit of ${batch.batch_size}`);
            return;
        }

        setSubmitting(true);
        try {
            await addBatchParticipant(id, selectedEmployeeIds);
            toast.success("Trainees added to batch");
            setSelectedEmployeeIds([]);
            setSearchQuery("");
            // Refresh
            const partRes = await getBatchParticipants(id);
            setParticipants(partRes.data.data || []);
        } catch (err) {
            console.error("Error adding participants:", err);
            toast.error(err?.response?.data?.message || "Failed to add participants");
        } finally {
            setSubmitting(false);
        }
    };

    // Remove employee
    const handleRemoveParticipant = async (employeeId) => {
        if (!window.confirm("Are you sure you want to remove this participant?")) return;
        try {
            await removeBatchParticipant(id, employeeId);
            toast.success("Trainee removed from batch");
            // Refresh
            const partRes = await getBatchParticipants(id);
            setParticipants(partRes.data.data || []);
        } catch (err) {
            console.error("Error removing participant:", err);
            toast.error(err?.response?.data?.message || "Failed to remove participant");
        }
    };

    // Toggle attendance
    const handleAttendanceChange = async (employeeId, currentAttendance) => {
        try {
            await updateBatchParticipant(id, employeeId, { attendance: !currentAttendance });
            toast.success("Attendance updated");
            // Refresh
            const partRes = await getBatchParticipants(id);
            setParticipants(partRes.data.data || []);
        } catch (err) {
            console.error("Error updating attendance:", err);
            toast.error("Failed to update attendance");
        }
    };

    // Advance Status
    const handleAdvanceStatus = async () => {
        if (!batch) return;
        
        const nextIndex = currentStepIndex + 1;
        if (nextIndex >= STATUS_STEPS.length) {
            toast.error("Batch is already completed/closed");
            return;
        }

        const nextStep = STATUS_STEPS[nextIndex];
        const nextStatusLabel = nextStep.label;

        // Custom validation check before advancing from Draft Setup
        if (batch.status === "Draft" && participants.length === 0) {
            toast.error("Please add at least one participant before activating");
            return;
        }

        const confirmAdvance = window.confirm(`Are you sure you want to advance this batch status to "${nextStatusLabel}"?`);
        if (!confirmAdvance) return;

        setSubmitting(true);
        try {
            // Setup payload for standard batch update endpoint
            const payload = {
                clientId: batch.client_id,
                siteId: batch.site_id,
                trainingModuleId: batch.training_module_id,
                trainerId: batch.trainer_id,
                scheduledDate: batch.scheduled_date ? new Date(batch.scheduled_date).toISOString().split('T')[0] : "",
                venue: batch.venue,
                batchSize: batch.batch_size,
                status: nextStep.value
            };

            await updateBatch(batch.id, payload);
            toast.success(`Batch advanced to: ${nextStatusLabel}`);
            
            // Reload batch details
            const batchRes = await getBatchById(id);
            setBatch(batchRes.data.data);
        } catch (err) {
            console.error("Error advancing status:", err);
            toast.error(err?.response?.data?.message || "Failed to update batch status");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to format date
    const formattedDate = useMemo(() => {
        if (!batch || !batch.scheduled_date) return "—";
        return new Date(batch.scheduled_date).toLocaleDateString("en-US", {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, [batch]);

    // Format batch ID code e.g. BAT-b0000001
    const batchCode = useMemo(() => {
        if (!batch) return "";
        return `BAT-b${String(batch.id).padStart(7, '0')}`;
    }, [batch]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
                        <span className="text-sm font-semibold text-slate-600">Loading batch details...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-700">Batch Not Found</h2>
                        <button onClick={() => navigate("/admin/batches")} className="mt-4 px-4 py-2 bg-[#253361] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2446]">
                            Back to Batches
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const nextStep = currentStepIndex < STATUS_STEPS.length - 1 ? STATUS_STEPS[currentStepIndex + 1] : null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar />



            {/* Main Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
                
                {/* Batch Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>

                    <div className="pl-2 space-y-2">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold tracking-wider">{batchCode}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                batch.status === 'Draft' 
                                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                                {batch.status}
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{batch.module_name}</h1>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <i className="fa-regular fa-calendar-days text-slate-400"></i>
                                {formattedDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-location-dot text-slate-400"></i>
                                {batch.site_name} · {batch.venue}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                                <i className="fa-solid fa-chalkboard-user text-slate-400"></i>
                                Trainer: {batch.trainer_name}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    {nextStep ? (
                        <button
                            onClick={handleAdvanceStatus}
                            disabled={submitting}
                            className="bg-[#0f172a] hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 flex items-center gap-2 group shrink-0"
                        >
                            <span>Advance to: {nextStep.label}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </button>
                    ) : (
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm font-bold flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Batch Completed
                        </div>
                    )}
                </div>

                {/* Progress Stepper */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
                    <div className="min-w-[800px] flex items-center justify-between px-8 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-[8%] right-[8%] top-[24px] h-[3px] bg-slate-100 z-0">
                            <div 
                                className="h-full bg-orange-500 transition-all duration-300"
                                style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                            ></div>
                        </div>

                        {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx < currentStepIndex;
                            const isActive = idx === currentStepIndex;
                            const isPending = idx > currentStepIndex;

                            return (
                                <div key={step.value} className="flex flex-col items-center gap-3 relative z-10 w-24">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                                        isActive 
                                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30' 
                                            : isCompleted 
                                                ? 'bg-orange-50 border-orange-300 text-orange-600'
                                                : 'bg-white border-slate-200 text-slate-400'
                                    }`}>
                                        {isCompleted ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        ) : (
                                            idx + 1
                                        )}
                                    </div>
                                    <span className={`text-xs font-bold text-center transition-colors ${
                                        isActive 
                                            ? 'text-orange-600 font-extrabold' 
                                            : isCompleted 
                                                ? 'text-slate-700' 
                                                : 'text-slate-400 font-medium'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Trainees Loaded</span>
                        <div className="text-2xl font-black text-slate-900">{participants.length} / {batch.batch_size}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Pre-Tests Submitted</span>
                        <div className="text-2xl font-black text-slate-900">0 / {participants.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Post Tests Submitted</span>
                        <div className="text-2xl font-black text-slate-900">0 / {participants.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Feedbacks Received</span>
                        <div className="text-2xl font-black text-slate-900">0 / {participants.length}</div>
                    </div>
                </div>

                {/* Split layout: Table left, Sidecards right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    
                    {/* Left Column: Participant Table */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-users text-slate-400 text-sm"></i>
                                <h3 className="font-extrabold text-slate-900 text-sm tracking-wider uppercase">Participant Registration Table</h3>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/40">
                                        <th className="py-3.5 px-6">Code</th>
                                        <th className="py-3.5 px-6">Trainee Name</th>
                                        <th className="py-3.5 px-6 text-center">Attendance</th>
                                        <th className="py-3.5 px-6 text-center">Pre Test</th>
                                        <th className="py-3.5 px-6 text-center">Post Test</th>
                                        <th className="py-3.5 px-6 text-center">Final Score</th>
                                        <th className="py-3.5 px-6 text-center">Band Badge</th>
                                        <th className="py-3.5 px-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {participants.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-8 text-center text-sm font-semibold text-slate-400">
                                                No participants registered in this batch.
                                            </td>
                                        </tr>
                                    ) : (
                                        participants.map(part => (
                                            <tr key={part.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                                                <td className="py-4 px-6 font-mono text-slate-500 font-semibold text-xs">{part.employee_code}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{part.full_name}</span>
                                                        <span className="text-[11px] text-slate-400 mt-0.5">{part.employee_type}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={Boolean(part.attendance)}
                                                        disabled={true}
                                                        onChange={() => handleAttendanceChange(part.employee_id, part.attendance)}
                                                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                <td className="py-4 px-6 text-center text-slate-400 font-semibold">—</td>
                                                <td className="py-4 px-6 text-center text-slate-400 font-semibold">—</td>
                                                <td className="py-4 px-6 text-center text-slate-400 font-semibold">—</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                        {part.band_badge || 'UNTESTED'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {batch.status === 'Draft' && (
                                                        <button 
                                                            onClick={() => handleRemoveParticipant(part.employee_id)}
                                                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                                            title="Remove Trainee"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4.5 h-4.5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column: Cards */}
                    <div className="space-y-6">
                        
                        {/* Card 1: Add Participant */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                <span className="text-orange-500 text-lg font-black">+</span>
                                <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Add Participant Manually</h3>
                            </div>

                            {batch.status === 'Draft' ? (
                                <form onSubmit={handleAddParticipant} className="space-y-3.5">
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Search Employee Database</label>
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                                        />

                                        {filteredAvailableEmployees.length > 0 && (
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allIds = filteredAvailableEmployees.map(e => e.id);
                                                        setSelectedEmployeeIds(prev => Array.from(new Set([...prev, ...allIds])));
                                                    }}
                                                    className="hover:text-orange-500 transition-colors uppercase tracking-wider focus:outline-none cursor-pointer"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const allIds = filteredAvailableEmployees.map(e => e.id);
                                                        setSelectedEmployeeIds(prev => prev.filter(id => !allIds.includes(id)));
                                                    }}
                                                    className="hover:text-orange-500 transition-colors uppercase tracking-wider focus:outline-none cursor-pointer"
                                                >
                                                    Deselect All
                                                </button>
                                            </div>
                                        )}

                                        <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
                                            {filteredAvailableEmployees.length === 0 ? (
                                                <div className="text-xs text-slate-400 text-center py-4 font-semibold">
                                                    No employees available.
                                                </div>
                                            ) : (
                                                filteredAvailableEmployees.map(emp => {
                                                    const isChecked = selectedEmployeeIds.includes(emp.id);
                                                    return (
                                                        <label key={emp.id} className="flex items-start gap-2.5 p-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-xs font-semibold text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => {
                                                                    if (isChecked) {
                                                                        setSelectedEmployeeIds(prev => prev.filter(i => i !== emp.id));
                                                                    } else {
                                                                        setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                                    }
                                                                }}
                                                                className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                                                            />
                                                            <div className="flex flex-col">
                                                                <span>{emp.full_name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employee_code} ({emp.employee_type})</span>
                                                            </div>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting || selectedEmployeeIds.length === 0}
                                        className="w-full py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer text-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            background: selectedEmployeeIds.length > 0 ? "linear-gradient(135deg, #f97316, #ea580c)" : "#94a3b8"
                                        }}
                                    >
                                        Add Participants ({selectedEmployeeIds.length})
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-4 text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    Participants can only be managed when the batch status is Draft Setup.
                                </div>
                            )}
                        </div>

                        {/* Card 2: Active Batch Details */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Active Batch Details</h3>
                            </div>

                            <div className="space-y-3.5 text-sm">
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Module Type:</span>
                                    <span className="font-bold text-slate-800">{batch.module_name || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Duration:</span>
                                    <span className="font-bold text-slate-800">{trainingModule?.duration_hours ? `${trainingModule.duration_hours} Hours` : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Passing Marks:</span>
                                    <span className="font-bold text-slate-800">{trainingModule?.passing_marks ? `${trainingModule.passing_marks}%` : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Practical Required:</span>
                                    <span className="font-bold text-slate-800">{trainingModule?.practical_required || '—'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-400 text-xs uppercase tracking-wider">Test Configs:</span>
                                    <span className="font-bold text-slate-800">
                                        {trainingModule ? `${trainingModule.pre_test_qs} Pre / ${trainingModule.post_test_qs} Post Qs` : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </main>



        </div>
    );
}
