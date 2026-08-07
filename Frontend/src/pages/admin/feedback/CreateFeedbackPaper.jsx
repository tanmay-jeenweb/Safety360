import { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "../../../components/Navbar";
import { getFeedbackQuestions } from "../../../api/feedbackQuestionBankApi";
import {
    createFeedbackPaper,
    updateFeedbackPaper,
    getFeedbackPaperById
} from "../../../api/feedbackPaperApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateFeedbackPaper() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [name, setName] = useState("");
    
    // Questions from Feedback Question Bank
    const [bankQuestions, setBankQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Custom dropdown states
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Questions added to this paper
    const [addedQuestions, setAddedQuestions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Fetch all feedback questions from bank
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const res = await getFeedbackQuestions();
                setBankQuestions(res.data.data || []);
            } catch (err) {
                console.error("Error loading feedback questions:", err);
                toast.error("Failed to load feedback questions from bank");
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, []);

    // Load editing details if editing mode
    useEffect(() => {
        if (!isEditMode) return;

        const loadEditingDetails = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await getFeedbackPaperById(id);
                const paper = res.data.data;
                if (paper) {
                    setName(paper.name || "");
                    if (paper.detailedQuestions) {
                        setAddedQuestions(paper.detailedQuestions);
                    } else {
                        setAddedQuestions([]);
                    }
                }
            } catch (err) {
                console.error("Failed to load feedback paper details", err);
                setError("Failed to load feedback paper details");
            } finally {
                setLoading(false);
            }
        };

        loadEditingDetails();
    }, [id, isEditMode]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Filter available questions by search term
    const availableFiltered = useMemo(() => {
        let qs = bankQuestions;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            qs = qs.filter(q => 
                (q.question_text && q.question_text.toLowerCase().includes(term)) ||
                (q.question_type && q.question_type.toLowerCase().includes(term)) ||
                (q.language && q.language.toLowerCase().includes(term))
            );
        }
        return qs;
    }, [bankQuestions, searchTerm]);

    const isAllSelected = useMemo(() => {
        return availableFiltered.length > 0 && 
            availableFiltered.every(q => addedQuestions.some(added => added.id === q.id));
    }, [availableFiltered, addedQuestions]);

    const handleToggleQuestion = (qObj) => {
        const isAlreadyAdded = addedQuestions.some(added => added.id === qObj.id);
        if (isAlreadyAdded) {
            setAddedQuestions(addedQuestions.filter(added => added.id !== qObj.id));
        } else {
            setAddedQuestions([...addedQuestions, qObj]);
        }
    };

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            // Remove all availableFiltered questions from addedQuestions
            const filteredIds = availableFiltered.map(q => q.id);
            setAddedQuestions(prev => prev.filter(added => !filteredIds.includes(added.id)));
        } else {
            // Add all availableFiltered questions that are not already in addedQuestions
            const toAdd = availableFiltered.filter(q => !addedQuestions.some(added => added.id === q.id));
            setAddedQuestions(prev => [...prev, ...toAdd]);
        }
    };

    // Remove question from the list
    const handleRemoveQuestion = (qId) => {
        setAddedQuestions(addedQuestions.filter(q => q.id !== qId));
        toast.success("Question removed");
    };

    // Move question up in assembly order
    const moveQuestionUp = (index) => {
        if (index === 0) return;
        const newQuestions = [...addedQuestions];
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[index - 1];
        newQuestions[index - 1] = temp;
        setAddedQuestions(newQuestions);
    };

    // Move question down in assembly order
    const moveQuestionDown = (index) => {
        if (index === addedQuestions.length - 1) return;
        const newQuestions = [...addedQuestions];
        const temp = newQuestions[index];
        newQuestions[index] = newQuestions[index + 1];
        newQuestions[index + 1] = temp;
        setAddedQuestions(newQuestions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Feedback paper name is required");
            return;
        }
        if (addedQuestions.length === 0) {
            toast.error("At least one question is required for a feedback paper");
            return;
        }

        const questionIds = addedQuestions.map(q => q.id);
        const payload = {
            name: name.trim(),
            questions: questionIds
        };

        setSaving(true);
        try {
            if (isEditMode) {
                const res = await updateFeedbackPaper(id, payload);
                if (res.data && res.data.success) {
                    toast.success("Feedback Paper updated successfully");
                    navigate("/admin/feedback-paper");
                } else {
                    toast.error(res.data?.message || "Failed to update feedback paper");
                }
            } else {
                const res = await createFeedbackPaper(payload);
                if (res.data && res.data.success) {
                    toast.success("Feedback Paper created successfully");
                    navigate("/admin/feedback-paper");
                } else {
                    toast.error(res.data?.message || "Failed to create feedback paper");
                }
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error(err?.response?.data?.message || "Failed to save feedback paper");
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
                            {isEditMode ? "Edit Feedback Paper" : "Create New Feedback Paper"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            {isEditMode ? "Modify feedback paper configuration and questions below" : "Assemble course evaluation sheets from Feedback Question Bank"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/feedback-paper")}
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

                {loading && bankQuestions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading feedback paper details...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "visible", border: "1px solid #e2e8f0" }}>
                        <div style={{ padding: "28px" }}>
                            
                            {/* Section 1: Configuration */}
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    1. Configuration
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Paper Name */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Feedback Paper Name <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="E.g., Trainer Evaluation Form"
                                            style={{
                                                width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                                borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b"
                                            }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Assemble Questions */}
                            <div style={{ marginBottom: 20 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    2. Assemble Questions
                                </h3>

                                {/* Custom Searchable Multi-Select Dropdown */}
                                <div ref={dropdownRef} style={{ position: "relative", marginBottom: 24 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                        Select Questions <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    
                                    {/* Dropdown Trigger Header */}
                                    <div
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9,
                                            padding: "11px 14px", fontSize: 14, color: "#1e293b",
                                            background: "#fff", cursor: "pointer", userSelect: "none"
                                        }}
                                    >
                                        <span>
                                            {addedQuestions.length === 0 
                                                ? "Click to select questions from the bank..." 
                                                : `${addedQuestions.length} question(s) selected`}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16, color: "#64748b", transition: "transform 0.2s", transform: isDropdownOpen ? "rotate(180deg)" : "none" }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>

                                    {/* Dropdown Panel */}
                                    {isDropdownOpen && (
                                        <div style={{
                                            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
                                            background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12,
                                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                            zIndex: 1000, overflow: "hidden", display: "flex", flexDirection: "column"
                                        }}>
                                            {/* Search Input inside Dropdown */}
                                            <div style={{ padding: 12, borderBottom: "1px solid #e2e8f0", position: "relative", background: "#f8fafc" }}>
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Search feedback questions by text, type or language..."
                                                    style={{
                                                        width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                                        borderRadius: 8, padding: "8px 12px 8px 36px", fontSize: 13, outline: "none", color: "#1e293b",
                                                        background: "#fff"
                                                    }}
                                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                                />
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                                                </svg>
                                            </div>

                                            {/* Select All Toggle Header inside Dropdown */}
                                            {availableFiltered.length > 0 && (
                                                <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9", fontSize: 12.5, fontWeight: 700, color: "#475569" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={el => {
                                                            if (el) {
                                                                const someSelected = availableFiltered.some(q => addedQuestions.some(added => added.id === q.id));
                                                                const allSelected = availableFiltered.length > 0 && availableFiltered.every(q => addedQuestions.some(added => added.id === q.id));
                                                                el.indeterminate = someSelected && !allSelected;
                                                            }
                                                        }}
                                                        onChange={handleToggleSelectAll}
                                                        style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#253361", marginRight: 10 }}
                                                    />
                                                    <span>Select All Filtered ({availableFiltered.length} questions)</span>
                                                </div>
                                            )}

                                            {/* Questions List inside Dropdown */}
                                            <div style={{ maxHeight: 250, overflowY: "auto" }}>
                                                {availableFiltered.length === 0 ? (
                                                    <div style={{ textAlign: "center", padding: "30px 20px", color: "#94a3b8", fontSize: 13 }}>
                                                        {bankQuestions.length === 0 ? "No questions available in the feedback question bank. Please add some first." : "No matching questions found."}
                                                    </div>
                                                ) : (
                                                    availableFiltered.map((q) => {
                                                        const isChecked = addedQuestions.some(added => added.id === q.id);
                                                        return (
                                                            <div 
                                                                key={q.id} 
                                                                onClick={() => handleToggleQuestion(q)}
                                                                style={{ 
                                                                    display: "flex", 
                                                                    alignItems: "center", 
                                                                    padding: "10px 16px", 
                                                                    borderBottom: "1px solid #f1f5f9",
                                                                    background: isChecked ? "#f0f4ff" : "#fff",
                                                                    cursor: "pointer",
                                                                    userSelect: "none",
                                                                    transition: "background 0.15s"
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => {}} // toggled by row click
                                                                    style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#253361", marginRight: 10, flexShrink: 0 }}
                                                                />
                                                                <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                                                                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.question_text}>
                                                                        {q.question_text}
                                                                    </div>
                                                                    <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
                                                                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: "1.5px 5px", borderRadius: 4, background: q.language === "English" ? "#eff6ff" : "#faf5ff", color: q.language === "English" ? "#1e40af" : "#6b21a8", border: q.language === "English" ? "1px solid #dbeafe" : "1px solid #f3e8ff" }}>
                                                                            {q.language}
                                                                        </span>
                                                                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: "1.5px 5px", borderRadius: 4, background: q.question_type === "Rating" ? "#fffbeb" : "#ecfdf5", color: q.question_type === "Rating" ? "#92400e" : "#065f46", border: q.question_type === "Rating" ? "1px solid #fef3c7" : "1px solid #d1fae5" }}>
                                                                            {q.question_type === "Rating" ? "Rating (0-5)" : "Text"}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                                    Assembled Sheet ({addedQuestions.length} Questions)
                                </label>
                                
                                <div style={{ border: "1px solid #cbd5e1", borderRadius: 12, overflow: "hidden", background: "#f8fafc" }}>
                                    {addedQuestions.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontSize: 14 }}>
                                            No questions have been added yet. Use the selector above to find and add questions.
                                        </div>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                                            <thead>
                                                <tr style={{ background: "#f1f5f9", textAlign: "left", borderBottom: "1px solid #cbd5e1" }}>
                                                    <th style={{ padding: "12px 16px", width: 60, color: "#475569", fontWeight: 700 }}>#</th>
                                                    <th style={{ padding: "12px 16px", color: "#475569", fontWeight: 700 }}>Question Content</th>
                                                    <th style={{ padding: "12px 16px", width: 140, color: "#475569", textAlign: "center", fontWeight: 700 }}>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addedQuestions.map((q, idx) => (
                                                    <tr key={q.id} style={{ borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
                                                        <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: 700 }}>{idx + 1}</td>
                                                        <td style={{ padding: "14px 16px", color: "#1e293b" }}>
                                                            <div style={{ fontWeight: 600 }}>{q.question_text}</div>
                                                            <div style={{ display: "flex", gap: 12, marginTop: 6, alignItems: "center" }}>
                                                                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: q.language === "English" ? "#eff6ff" : "#faf5ff", color: q.language === "English" ? "#1e40af" : "#6b21a8", border: q.language === "English" ? "1px solid #dbeafe" : "1px solid #f3e8ff" }}>
                                                                    {q.language}
                                                                </span>
                                                                <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: q.question_type === "Rating" ? "#fffbeb" : "#ecfdf5", color: q.question_type === "Rating" ? "#92400e" : "#065f46", border: q.question_type === "Rating" ? "1px solid #fef3c7" : "1px solid #d1fae5" }}>
                                                                    {q.question_type === "Rating" ? "Rating (0-5)" : "Text"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                            <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                                                                {/* Move Up */}
                                                                <button
                                                                    type="button"
                                                                    disabled={idx === 0}
                                                                    onClick={() => moveQuestionUp(idx)}
                                                                    style={{
                                                                        padding: 6, borderRadius: 8, border: "1.5px solid #cbd5e1",
                                                                        background: "#fff", color: "#475569", cursor: idx === 0 ? "not-allowed" : "pointer",
                                                                        opacity: idx === 0 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center"
                                                                    }}
                                                                    title="Move Up"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                                                    </svg>
                                                                </button>
                                                                {/* Move Down */}
                                                                <button
                                                                    type="button"
                                                                    disabled={idx === addedQuestions.length - 1}
                                                                    onClick={() => moveQuestionDown(idx)}
                                                                    style={{
                                                                        padding: 6, borderRadius: 8, border: "1.5px solid #cbd5e1",
                                                                        background: "#fff", color: "#475569", cursor: idx === addedQuestions.length - 1 ? "not-allowed" : "pointer",
                                                                        opacity: idx === addedQuestions.length - 1 ? 0.4 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center"
                                                                    }}
                                                                    title="Move Down"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                                    </svg>
                                                                </button>
                                                                {/* Remove */}
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
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </div>
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
                            display: "flex", justifyContent: "flex-end", gap: 14, background: "#fafafa",
                            borderBottomLeftRadius: 16, borderBottomRightRadius: 16
                        }}>
                            <button
                                type="button"
                                onClick={() => navigate("/admin/feedback-paper")}
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
                                disabled={saving || !name.trim() || addedQuestions.length === 0}
                                style={{
                                    padding: "10px 26px", borderRadius: 9, border: "none",
                                    background: (saving || !name.trim() || addedQuestions.length === 0) ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                    color: "#fff", fontWeight: 700, fontSize: 13,
                                    cursor: (saving || !name.trim() || addedQuestions.length === 0) ? "not-allowed" : "pointer",
                                    boxShadow: (saving || !name.trim() || addedQuestions.length === 0) ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
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
