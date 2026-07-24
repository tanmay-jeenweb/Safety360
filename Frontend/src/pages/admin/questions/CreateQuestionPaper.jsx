import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getTrainingModules } from "../../../api/trainingModuleApi";
import { getQuestionsByModule } from "../../../api/questionBankApi";
import {
    createQuestionPaper,
    updateQuestionPaper,
    getQuestionPaperById
} from "../../../api/questionPaperApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateQuestionPaper() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [examType, setExamType] = useState("Pre");
    const [moduleId, setModuleId] = useState("");
    const [modules, setModules] = useState([]);
    
    // Questions from Question Bank for selected module
    const [bankQuestions, setBankQuestions] = useState([]);
    const [selectedQuestionId, setSelectedQuestionId] = useState("");
    
    // Questions added to the paper (list of question objects)
    const [addedQuestions, setAddedQuestions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Fetch all training modules
    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await getTrainingModules();
                setModules(res.data.data || []);
            } catch (err) {
                console.error("Error loading training modules:", err);
                toast.error("Failed to load training modules");
            }
        };
        fetchModules();
    }, []);

    // Load editing details if editing mode
    useEffect(() => {
        if (!isEditMode) return;

        const loadEditingDetails = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await getQuestionPaperById(id);
                const paper = res.data.data;
                if (paper) {
                    setName(paper.name || "");
                    setExamType(paper.exam_type || "Pre");
                    setModuleId(paper.module_id || "");
                    if (paper.detailedQuestions) {
                        setAddedQuestions(paper.detailedQuestions);
                    } else {
                        setAddedQuestions([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load paper details", err);
                setError("Failed to load question paper details");
            } finally {
                setLoading(false);
            }
        };

        loadEditingDetails();
    }, [id, isEditMode]);

    // Fetch questions when moduleId changes
    useEffect(() => {
        if (!moduleId) {
            setBankQuestions([]);
            setSelectedQuestionId("");
            return;
        }

        const fetchBankQuestions = async () => {
            try {
                const res = await getQuestionsByModule(moduleId);
                setBankQuestions(res.data.data || []);
                setSelectedQuestionId("");
            } catch (err) {
                console.error("Error fetching questions for module:", err);
                toast.error("Failed to load questions for selected module");
            }
        };

        fetchBankQuestions();
    }, [moduleId]);

    // Handle module dropdown change with confirmation if questions were added
    const handleModuleChange = (e) => {
        const newModuleId = e.target.value;
        if (moduleId && addedQuestions.length > 0) {
            const confirmChange = window.confirm("Changing the training module will clear all currently selected questions. Do you want to proceed?");
            if (!confirmChange) {
                return;
            }
            toast.warn("Selected questions cleared due to training module change");
        }
        setModuleId(newModuleId);
        setAddedQuestions([]);
    };

    // Add selected question from dropdown to the list
    const handleAddQuestion = () => {
        if (!selectedQuestionId) {
            toast.error("Please select a question to add");
            return;
        }

        const qObj = bankQuestions.find(q => q.id === parseInt(selectedQuestionId));
        if (!qObj) return;

        if (addedQuestions.some(q => q.id === qObj.id)) {
            toast.error("Question is already added to this paper");
            return;
        }

        setAddedQuestions([...addedQuestions, qObj]);
        setSelectedQuestionId("");
        toast.success("Question added to paper");
    };

    // Remove question from the list
    const handleRemoveQuestion = (id) => {
        setAddedQuestions(addedQuestions.filter(q => q.id !== id));
        toast.success("Question removed");
    };

    // Filter available questions (not yet added) for the dropdown selection
    const availableQuestions = useMemo(() => {
        return bankQuestions.filter(q => !addedQuestions.some(added => added.id === q.id));
    }, [bankQuestions, addedQuestions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Question paper name is required");
            return;
        }
        if (!moduleId) {
            toast.error("Please select a training module");
            return;
        }
        if (addedQuestions.length === 0) {
            toast.error("Please add at least one question to the paper");
            return;
        }

        const qIds = addedQuestions.map(q => q.id);
        const data = {
            name: name.trim(),
            examType,
            moduleId: parseInt(moduleId),
            questions: qIds
        };

        setSaving(true);
        try {
            if (isEditMode) {
                await updateQuestionPaper(id, data);
                toast.success("Question Paper updated successfully");
            } else {
                await createQuestionPaper(data);
                toast.success("Question Paper created successfully");
            }
            navigate("/admin/question-paper");
        } catch (err) {
            console.error("Failed to save question paper", err);
            toast.error(err?.response?.data?.message || "Failed to save question paper");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar />

            <main style={{ flex: 1, padding: "32px 30px", width: "100%", margin: "0 auto", boxSizing: "border-box", maxWidth: 1200 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                            {isEditMode ? "Edit Question Paper" : "Create New Question Paper"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            {isEditMode ? "Modify question paper configuration and questions below" : "Assemble exam sheets from Question Bank by selecting module-specific questions"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/question-paper")}
                        style={{
                            padding: "9px 18px", borderRadius: 9, border: "1.5px solid #cbd5e1",
                            background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading question paper details...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div style={{ padding: "28px" }}>
                            
                            {/* Section 1: Configuration */}
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    1. Configuration
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                                    {/* Paper Name */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Question Paper Name <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="E.g., Fire Safety Refresher Exam"
                                            style={{
                                                width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                                borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b"
                                            }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                            required
                                        />
                                    </div>

                                    {/* Training Module Dropdown */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Training Module <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <select
                                            value={moduleId}
                                            onChange={handleModuleChange}
                                            style={{
                                                width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                                borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b",
                                                background: "#fff"
                                            }}
                                            required
                                        >
                                            <option value="">Select Training Module...</option>
                                            {modules.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.module_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Exam Type Radios */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Exam Type <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <div style={{ display: "flex", gap: 24, height: 44, alignItems: "center" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#334155", cursor: "pointer", fontWeight: 600 }}>
                                                <input
                                                    type="radio"
                                                    name="examType"
                                                    value="Pre"
                                                    checked={examType === "Pre"}
                                                    onChange={() => setExamType("Pre")}
                                                    style={{ width: 17, height: 17, accentColor: "#253361" }}
                                                />
                                                Pre-Training Exam
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, color: "#334155", cursor: "pointer", fontWeight: 600 }}>
                                                <input
                                                    type="radio"
                                                    name="examType"
                                                    value="Post"
                                                    checked={examType === "Post"}
                                                    onChange={() => setExamType("Post")}
                                                    style={{ width: 17, height: 17, accentColor: "#253361" }}
                                                />
                                                Post-Training Exam
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Assemble Questions */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    2. Assemble Questions
                                </h3>

                                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                                    <select
                                        value={selectedQuestionId}
                                        onChange={(e) => setSelectedQuestionId(e.target.value)}
                                        disabled={!moduleId}
                                        style={{
                                            flex: 1, boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                            borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b",
                                            background: !moduleId ? "#f1f5f9" : "#fff"
                                        }}
                                    >
                                        {!moduleId ? (
                                            <option value="">Please select a training module first...</option>
                                        ) : availableQuestions.length === 0 ? (
                                            <option value="">No other questions found in this module...</option>
                                        ) : (
                                            <>
                                                <option value="">Select a question from the question bank...</option>
                                                {availableQuestions.map((q) => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.question_text.length > 90 ? `${q.question_text.substring(0, 90)}...` : q.question_text} ({q.question_type})
                                                    </option>
                                                ))}
                                            </>
                                        )}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleAddQuestion}
                                        disabled={!moduleId || !selectedQuestionId}
                                        style={{
                                            padding: "11px 22px", borderRadius: 9, border: "none",
                                            background: (!moduleId || !selectedQuestionId) ? "#cbd5e1" : "linear-gradient(135deg,#253361,#1a2446)",
                                            color: "#fff", fontWeight: 700, fontSize: 13,
                                            cursor: (!moduleId || !selectedQuestionId) ? "not-allowed" : "pointer",
                                            display: "flex", alignItems: "center", gap: 6, shrink: 0,
                                            boxShadow: (!moduleId || !selectedQuestionId) ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                        Add to Paper
                                    </button>
                                </div>

                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                                    Assembled Sheet ({addedQuestions.length} Questions)
                                </label>
                                
                                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
                                    {addedQuestions.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
                                            No questions have been added yet. Choose a question from the dropdown and click "Add to Paper".
                                        </div>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                            <thead>
                                                <tr style={{ background: "#f1f5f9", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                                                    <th style={{ padding: "12px 16px", width: 60, color: "#475569", fontWeight: 700 }}>#</th>
                                                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Question Content</th>
                                                    <th style={{ padding: "12px 16px", width: 80, color: "#475569", textAlign: "center", fontWeight: 700 }}>Remove</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addedQuestions.map((q, idx) => (
                                                    <tr key={q.id} style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                                                        <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 700 }}>{idx + 1}</td>
                                                        <td style={{ padding: "14px 16px", color: "#1e293b" }}>
                                                            <div style={{ fontWeight: 600 }}>{q.question_text}</div>
                                                            <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                                                                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: q.question_type === "MCQ" ? "#fef3c7" : "#d1fae5", color: q.question_type === "MCQ" ? "#b45309" : "#065f46" }}>
                                                                    {q.question_type}
                                                                </span>
                                                                <span style={{ fontSize: 11.5, color: "#64748b", fontWeight: 500 }}>
                                                                    Correct: <strong style={{ color: "#0f172a" }}>{q.correct_answer}</strong>
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveQuestion(q.id)}
                                                                style={{
                                                                    background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c",
                                                                    cursor: "pointer", display: "inline-flex", padding: 6, borderRadius: 8,
                                                                    alignItems: "center", justifyContent: "center"
                                                                }}
                                                                title="Remove Question"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div style={{
                            padding: "20px 28px", borderTop: "1px solid #e2e8f0",
                            display: "flex", justifyContent: "flex-end", gap: 14, background: "#fafafa"
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate("/admin/question-paper")}
                                disabled={saving}
                                style={{
                                    padding: "10px 22px", borderRadius: 9, border: "1.5px solid #cbd5e1",
                                    color: "#475569", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || !name.trim() || !moduleId || addedQuestions.length === 0}
                                style={{
                                    padding: "10px 26px", borderRadius: 9, border: "none",
                                    background: (saving || !name.trim() || !moduleId || addedQuestions.length === 0) ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                    color: "#fff", fontWeight: 700, fontSize: 13,
                                    cursor: (saving || !name.trim() || !moduleId || addedQuestions.length === 0) ? "not-allowed" : "pointer",
                                    boxShadow: (saving || !name.trim() || !moduleId || addedQuestions.length === 0) ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                            >
                                {saving ? "Saving…" : isEditMode ? "Save Changes" : "Create Paper"}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
