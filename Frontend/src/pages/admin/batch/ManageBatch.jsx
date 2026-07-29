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
import { getQuestionPapers } from "../../../api/questionPaperApi";
import { getDepartments } from "../../../api/departmentApi";
import { getClients } from "../../../api/clientApi";
import { getSites } from "../../../api/siteApi";
import toast from "react-hot-toast";

const STATUS_STEPS = [
    { label: "Draft Setup", value: "Draft" },
    { label: "Pre-Test Active", value: "Pretest Active" },
    { label: "Training Held", value: "Training Held" },
    { label: "Post-Test Active", value: "Posttest Active" },
    { label: "Batch Closed", value: "Closed" }
];

export default function ManageBatch() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [batch, setBatch] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [trainingModule, setTrainingModule] = useState(null);
    const [questionPapers, setQuestionPapers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [clients, setClients] = useState([]);
    const [sites, setSites] = useState([]);

    const [selectedDeptId, setSelectedDeptId] = useState("");
    const [selectedClientId, setSelectedClientId] = useState("");
    const [selectedSiteId, setSelectedSiteId] = useState("");

    const [loading, setLoading] = useState(true);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const [isQpModalOpen, setIsQpModalOpen] = useState(false);
    const [selectedQpId, setSelectedQpId] = useState("");

    const [isPostQpModalOpen, setIsPostQpModalOpen] = useState(false);
    const [selectedPostQpId, setSelectedPostQpId] = useState("");

    // Fetch batch details, participants, and question papers
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

            // Fetch question papers
            const qpRes = await getQuestionPapers();
            setQuestionPapers(qpRes.data.data || []);

            // Fetch lookup data for filtering
            const [deptRes, clientRes, siteRes] = await Promise.all([
                getDepartments(),
                getClients(),
                getSites()
            ]);
            setDepartments(deptRes.data.data || []);
            setClients(clientRes.data.data || []);
            setSites(siteRes.data.data || []);

        } catch (err) {
            console.error("Error loading batch details:", err);
            toast.error("Failed to load batch details");
        } finally {
            setLoading(false);
        }
    };

    // Filter question papers for the active module and pre-test type
    const preTestPapers = useMemo(() => {
        if (!batch || !questionPapers.length) return [];
        return questionPapers.filter(qp => 
            qp.module_id === batch.training_module_id && 
            qp.exam_type === 'Pre'
        );
    }, [batch, questionPapers]);

    // Filter question papers for the active module and post-test type
    const postTestPapers = useMemo(() => {
        if (!batch || !questionPapers.length) return [];
        return questionPapers.filter(qp => 
            qp.module_id === batch.training_module_id && 
            qp.exam_type === 'Post'
        );
    }, [batch, questionPapers]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    useEffect(() => {
        if (batch) {
            setSelectedClientId(batch.client_id || "");
            setSelectedSiteId(batch.site_id || "");
        }
    }, [batch]);

    // Active step calculation
    const currentStepIndex = useMemo(() => {
        if (!batch) return 0;
        let statusVal = batch.status;
        if (statusVal && statusVal.toLowerCase() === "feedback") {
            statusVal = "Closed";
        }
        const idx = STATUS_STEPS.findIndex(s => s.value.toLowerCase() === statusVal.toLowerCase());
        return idx !== -1 ? idx : 0;
    }, [batch]);

    // Filter employees: same client organization (or selected client), not already registered, and match selected site & department
    const availableEmployees = useMemo(() => {
        if (!employees.length) return [];
        return employees.filter(emp => {
            const isAlreadyRegistered = participants.some(part => part.employee_id === emp.id);
            if (isAlreadyRegistered) return false;

            if (selectedClientId && emp.client_id !== Number(selectedClientId)) {
                return false;
            }

            if (selectedSiteId && emp.site_id !== Number(selectedSiteId)) {
                return false;
            }

            if (selectedDeptId && emp.department_id !== Number(selectedDeptId)) {
                return false;
            }

            return true;
        });
    }, [employees, participants, selectedClientId, selectedSiteId, selectedDeptId]);

    const preTestsSubmittedCount = useMemo(() => {
        return participants.filter(p => p.pre_test_score !== null).length;
    }, [participants]);

    const postTestsSubmittedCount = useMemo(() => {
        return participants.filter(p => p.post_test_score !== null).length;
    }, [participants]);

    const eligiblePostTestCount = useMemo(() => {
        return participants.filter(p => Boolean(p.attendance)).length;
    }, [participants]);

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

    // Helper to submit status advance
    const submitStatusAdvance = async (nextStatus, nextStatusLabel, additionalPayload = {}) => {
        setSubmitting(true);
        try {
            const payload = {
                clientId: batch.client_id,
                siteId: batch.site_id,
                trainingModuleId: batch.training_module_id,
                trainerId: batch.trainer_id,
                scheduledDate: batch.scheduled_date ? new Date(batch.scheduled_date).toISOString().split('T')[0] : "",
                venue: batch.venue,
                batchSize: batch.batch_size,
                status: nextStatus,
                ...additionalPayload
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

        // Intercept Draft -> Pretest transition to show the Question Paper select modal
        if (batch.status === "Draft" && nextStep.value === "Pretest Active") {
            setSelectedQpId(batch.pre_test_question_paper_id || "");
            setIsQpModalOpen(true);
            return;
        }

        // Intercept Training Held -> Posttest Active transition to show the Post-Test Question Paper select modal
        if (batch.status === "Training Held" && nextStep.value === "Posttest Active") {
            setSelectedPostQpId(batch.post_test_question_paper_id || "");
            setIsPostQpModalOpen(true);
            return;
        }

        let confirmMessage = `Are you sure you want to advance this batch status to "${nextStatusLabel}"?`;
        if (batch.status && batch.status.toLowerCase() === "pretest active") {
            confirmMessage = "Trainees who have not completed the pre-test will not be able to attend/take it anymore. Are you sure you want to proceed?";
        } else if (batch.status && batch.status.toLowerCase() === "posttest active") {
            confirmMessage = "Trainees who have not completed the post-test will not be able to attend/take it anymore. Are you sure you want to proceed?";
        }

        const confirmAdvance = window.confirm(confirmMessage);
        if (!confirmAdvance) return;

        await submitStatusAdvance(nextStep.value, nextStatusLabel);
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

            {/* Question Paper Select Modal */}
            {isQpModalOpen && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: 16
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 18, width: "95%", maxWidth: 500, margin: "auto",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden"
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(135deg, #1e293b, #0f172a)"
                        }}>
                            <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 800 }}>
                                Select Pre-Test Question Paper
                            </h3>
                            <button 
                                onClick={() => setIsQpModalOpen(false)}
                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 24 }}>
                            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                                Before activating the Pre-test for this batch, you must select a pre-test question paper for the module <strong>{batch.module_name}</strong>.
                            </p>

                            {preTestPapers.length === 0 ? (
                                <div style={{ 
                                    padding: 16, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3",
                                    color: "#be123c", fontSize: 13, display: "flex", flexDirection: "column", gap: 8
                                }}>
                                    <span style={{ fontWeight: 700 }}>No Pre-Test Question Papers Found</span>
                                    <span>There are no Pre-Test question papers registered for this training module. Please create one in the Question Paper Master first to proceed.</span>
                                    <button
                                        onClick={() => navigate("/admin/question-paper/create")}
                                        style={{
                                            alignSelf: "flex-start", marginTop: 4, padding: "6px 12px", borderRadius: 6,
                                            background: "#be123c", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer"
                                        }}
                                    >
                                        Create Question Paper
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                                        Choose Paper
                                    </label>
                                    <select
                                        value={selectedQpId}
                                        onChange={(e) => setSelectedQpId(e.target.value)}
                                        style={{ 
                                            width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, 
                                            padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" 
                                        }}
                                    >
                                        <option value="">Select a Question Paper...</option>
                                        {preTestPapers.map(qp => (
                                            <option key={qp.id} value={qp.id}>
                                                {qp.name} ({qp.questions?.length || 0} Questions)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: "16px 24px", borderTop: "1px solid #f1f5f9",
                            display: "flex", justifyContent: "flex-end", gap: 12, background: "#fafafa"
                        }}>
                            <button
                                onClick={() => setIsQpModalOpen(false)}
                                style={{
                                    padding: "9px 20px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                                    color: "#475569", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            {preTestPapers.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (!selectedQpId) {
                                            toast.error("Please select a question paper");
                                            return;
                                        }
                                        setIsQpModalOpen(false);
                                        await submitStatusAdvance("Pretest Active", "Pre-Test Active", {
                                            preTestQuestionPaperId: Number(selectedQpId)
                                        });
                                    }}
                                    disabled={!selectedQpId}
                                    style={{
                                        padding: "9px 24px", borderRadius: 8, border: "none",
                                        background: !selectedQpId ? "#94a3b8" : "linear-gradient(135deg, #f97316, #ea580c)",
                                        color: "#fff", fontWeight: 700, fontSize: 13,
                                        cursor: !selectedQpId ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Activate Pre-test
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Post-Test Question Paper Select Modal */}
            {isPostQpModalOpen && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", padding: 16
                }}>
                    <div style={{
                        background: "#fff", borderRadius: 18, width: "95%", maxWidth: 500, margin: "auto",
                        boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden"
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(135deg, #1e293b, #0f172a)"
                        }}>
                            <h3 style={{ margin: 0, color: "#fff", fontSize: 16, fontWeight: 800 }}>
                                Select Post-Test Question Paper
                            </h3>
                            <button 
                                onClick={() => setIsPostQpModalOpen(false)}
                                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 20 }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: 24 }}>
                            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                                Before activating the Post-test for this batch, you must select a post-test question paper for the module <strong>{batch.module_name}</strong>.
                            </p>

                            {postTestPapers.length === 0 ? (
                                <div style={{ 
                                    padding: 16, borderRadius: 12, background: "#fff1f2", border: "1px solid #fecdd3",
                                    color: "#be123c", fontSize: 13, display: "flex", flexDirection: "column", gap: 8
                                }}>
                                    <span style={{ fontWeight: 700 }}>No Post-Test Question Papers Found</span>
                                    <span>There are no Post-Test question papers registered for this training module. Please create one in the Question Paper Master first to proceed.</span>
                                    <button
                                        onClick={() => navigate("/admin/question-paper/create")}
                                        style={{
                                            alignSelf: "flex-start", marginTop: 4, padding: "6px 12px", borderRadius: 6,
                                            background: "#be123c", color: "#fff", border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer"
                                        }}
                                    >
                                        Create Question Paper
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>
                                        Choose Paper
                                    </label>
                                    <select
                                        value={selectedPostQpId}
                                        onChange={(e) => setSelectedPostQpId(e.target.value)}
                                        style={{ 
                                            width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, 
                                            padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" 
                                        }}
                                    >
                                        <option value="">Select a Question Paper...</option>
                                        {postTestPapers.map(qp => (
                                            <option key={qp.id} value={qp.id}>
                                                {qp.name} ({qp.questions?.length || 0} Questions)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: "16px 24px", borderTop: "1px solid #f1f5f9",
                            display: "flex", justifyContent: "flex-end", gap: 12, background: "#fafafa"
                        }}>
                            <button
                                onClick={() => setIsPostQpModalOpen(false)}
                                style={{
                                    padding: "9px 20px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                                    color: "#475569", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            {postTestPapers.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (!selectedPostQpId) {
                                            toast.error("Please select a question paper");
                                            return;
                                        }
                                        setIsPostQpModalOpen(false);
                                        await submitStatusAdvance("Posttest Active", "Post-Test Active", {
                                            postTestQuestionPaperId: Number(selectedPostQpId)
                                        });
                                    }}
                                    disabled={!selectedPostQpId}
                                    style={{
                                        padding: "9px 24px", borderRadius: 8, border: "none",
                                        background: !selectedPostQpId ? "#94a3b8" : "linear-gradient(135deg, #f97316, #ea580c)",
                                        color: "#fff", fontWeight: 700, fontSize: 13,
                                        cursor: !selectedPostQpId ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Activate Post-test
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}



            {/* Main Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">

                {/* Batch Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>

                    <div className="pl-2 flex items-center flex-wrap gap-x-4 gap-y-2">
                        

                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{batch.module_name}</h1>

                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-bold tracking-wider">{batchCode}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${batch.status === 'Draft'
                                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                {batch.status}
                            </span>
                        </div>
                    </div>

                    {/* Action Button */}
                    {nextStep ? (
                        <div className="flex gap-2">
                            <button
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border border-slate-200/50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                            <span>Back</span>
                        </button>
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
                        </div>
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
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${isActive
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
                                    <span className={`text-xs font-bold text-center transition-colors ${isActive
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Trainees Loaded</span>
                        <div className="text-2xl font-black text-slate-900">{participants.length} / {batch.batch_size}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Pre-Tests Submitted</span>
                        <div className="text-2xl font-black text-slate-900">{preTestsSubmittedCount} / {participants.length}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Post Tests Submitted</span>
                        <div className="text-2xl font-black text-slate-900">{postTestsSubmittedCount} / {eligiblePostTestCount}</div>
                    </div>
                </div>

                {/* Active Batch Details Card (Full Row) */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Active Batch Details</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-sm">
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Module Type</span>
                            <span className="font-bold text-slate-800 text-sm">{batch.module_name || '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Trainer</span>
                            <span className="font-bold text-slate-800 text-sm">{batch.trainer_name || '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Scheduled Date</span>
                            <span className="font-bold text-slate-800 text-sm">{formattedDate || '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Venue</span>
                            <span className="font-bold text-slate-800 text-sm">{batch.site_name ? `${batch.site_name} · ${batch.venue}` : '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Duration</span>
                            <span className="font-bold text-slate-800 text-sm">{trainingModule?.duration_hours ? `${trainingModule.duration_hours} Hours` : '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Passing Marks</span>
                            <span className="font-bold text-slate-800 text-sm">{trainingModule?.passing_marks ? `${trainingModule.passing_marks}%` : '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Practical Required</span>
                            <span className="font-bold text-slate-800 text-sm">{trainingModule?.practical_required || '—'}</span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Test Configs</span>
                            <span className="font-bold text-slate-800 text-sm">
                                {trainingModule ? `${trainingModule.pre_test_qs} Pre / ${trainingModule.post_test_qs} Post Qs` : '—'}
                            </span>
                        </div>
                        <div className="border-b border-slate-100 pb-2">
                            <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block mb-1">Pre-Test Paper</span>
                            <span className="font-bold text-slate-800 text-sm">
                                {batch.pre_test_question_paper_name || '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Add Participant Card (Full Row) - Only visible during Draft Setup */}
                {batch.status === 'Draft' && (
                    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <span className="text-orange-500 text-lg font-black">+</span>
                            <h3 className="font-extrabold text-slate-900 text-xs tracking-wider uppercase">Add Participant Manually</h3>
                        </div>

                        <div className="space-y-4">
                            {/* Filters Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Filter by Client</label>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => {
                                            setSelectedClientId(e.target.value);
                                            setSelectedSiteId("");
                                        }}
                                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                                    >
                                        <option value="">All Clients</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.client_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Filter by Site</label>
                                    <select
                                        value={selectedSiteId}
                                        onChange={(e) => setSelectedSiteId(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                                    >
                                        <option value="">All Sites</option>
                                        {sites
                                            .filter(s => !selectedClientId || String(s.client_id) === String(selectedClientId))
                                            .map(s => (
                                                <option key={s.id} value={s.id}>{s.site_name}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Filter by Department</label>
                                    <select
                                        value={selectedDeptId}
                                        onChange={(e) => setSelectedDeptId(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white cursor-pointer"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.department_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Search & Add Action Row */}
                            <form onSubmit={handleAddParticipant} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center justify-between">
                                <div className="flex-1 space-y-1 relative w-full">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Search & Select Employees</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Type name or code to filter search..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setDropdownOpen(true);
                                            }}
                                            onFocus={() => setDropdownOpen(true)}
                                            onBlur={() => {
                                                setTimeout(() => setDropdownOpen(false), 200);
                                            }}
                                            className="w-full border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 bg-white"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                                            <i className="fa-solid fa-chevron-down text-[10px]"></i>
                                        </div>
                                    </div>

                                    {dropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto border border-slate-200 rounded-xl shadow-lg bg-white z-50 divide-y divide-slate-50">
                                            {filteredAvailableEmployees.filter(emp => !selectedEmployeeIds.includes(emp.id)).length === 0 ? (
                                                <div className="text-xs text-slate-400 text-center py-4 font-semibold">
                                                    No matching employees found.
                                                </div>
                                            ) : (
                                                filteredAvailableEmployees
                                                    .filter(emp => !selectedEmployeeIds.includes(emp.id))
                                                    .map(emp => (
                                                        <div
                                                            key={emp.id}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                                setSearchQuery("");
                                                            }}
                                                            className="flex flex-col p-2.5 hover:bg-slate-50 cursor-pointer transition-colors text-xs font-semibold text-slate-700"
                                                        >
                                                            <span>{emp.full_name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.employee_code} ({emp.employee_type})</span>
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || selectedEmployeeIds.length === 0}
                                    className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-center text-white disabled:opacity-50 disabled:cursor-not-allowed shrink-0 sm:self-end h-[34px]"
                                    style={{
                                        background: selectedEmployeeIds.length > 0 ? "linear-gradient(135deg, #253361, #1a2446)" : "#94a3b8"
                                    }}
                                >
                                    Add ({selectedEmployeeIds.length})
                                </button>
                            </form>

                            {/* Selected Employees list (badges) */}
                            {selectedEmployeeIds.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Selected ({selectedEmployeeIds.length})</div>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                                        {selectedEmployeeIds.map(empId => {
                                            const emp = employees.find(e => e.id === empId);
                                            if (!emp) return null;
                                            return (
                                                <span
                                                    key={empId}
                                                    className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200"
                                                >
                                                    <span>{emp.full_name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedEmployeeIds(prev => prev.filter(id => id !== empId))}
                                                        className="hover:bg-orange-100 text-orange-600 rounded-md p-0.5 transition-colors focus:outline-none cursor-pointer"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Bottom Row: Participant Table (100% width) */}
                <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
                                    <th className="py-3.5 px-6 text-center">Result</th>
                                    <th className="py-3.5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {participants.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-8 text-center text-sm font-semibold text-slate-400">
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
                                                    disabled={!batch.status || batch.status.toLowerCase() !== "training held"}
                                                    onChange={() => handleAttendanceChange(part.employee_id, part.attendance)}
                                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-slate-700">{part.pre_test_score !== null ? part.pre_test_score : "—"}</td>
                                            <td className="py-4 px-6 text-center font-bold text-slate-700">{part.post_test_score !== null ? part.post_test_score : "—"}</td>
                                            <td className="py-4 px-6 text-center font-bold text-slate-700">
                                                {part.post_test_score !== null ? (
                                                    (() => {
                                                        const totalQs = trainingModule?.post_test_qs || 1;
                                                        const pct = (part.post_test_score / totalQs) * 100;
                                                        const passing = trainingModule?.passing_marks || 0;
                                                        return pct >= passing ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                                                                Pass
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                                                                Fail
                                                            </span>
                                                        );
                                                    })()
                                                ) : (
                                                    <span className="text-slate-400 font-medium">—</span>
                                                )}
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

            </main>



        </div>
    );
}
