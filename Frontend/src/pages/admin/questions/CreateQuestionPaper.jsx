import { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "../../../components/Navbar";
import { getTrainingModules } from "../../../api/trainingModuleApi";
import { getQuestions, getQuestionsByModule } from "../../../api/questionBankApi";
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
    
    // Questions from Question Bank
    const [allBankQuestions, setAllBankQuestions] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Custom dropdown states
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Custom module dropdown states
    const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
    const [moduleSearchTerm, setModuleSearchTerm] = useState("");
    const moduleDropdownRef = useRef(null);
    
    // Questions added to the paper (list of question objects)
    const [addedQuestions, setAddedQuestions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Fetch all training modules and question bank on mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [modulesRes, questionsRes] = await Promise.all([
                    getTrainingModules(),
                    getQuestions()
                ]);
                setModules(modulesRes.data.data || []);
                setAllBankQuestions(questionsRes.data.data || []);
            } catch (err) {
                console.error("Error loading initial data:", err);
                toast.error("Failed to load modules or questions");
            }
        };
        loadInitialData();
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

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(event.target)) {
                setIsModuleDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const filteredModules = useMemo(() => {
        if (!moduleSearchTerm.trim()) return modules;
        const term = moduleSearchTerm.toLowerCase();
        return modules.filter(m => m.module_name && m.module_name.toLowerCase().includes(term));
    }, [modules, moduleSearchTerm]);

    // Handle module selection with confirmation if questions were added
    const handleModuleSelection = (selectedId) => {
        const selectedIdStr = selectedId.toString();
        if (moduleId && addedQuestions.length > 0) {
            const confirmChange = window.confirm("Changing the training module will clear all currently selected questions. Do you want to proceed?");
            if (!confirmChange) {
                return;
            }
            toast.warn("Selected questions cleared due to training module change");
        }
        setModuleId(selectedIdStr);
        setAddedQuestions([]);
    };

    // All questions belonging to the selected training module (filtered by search term only)
    const availableFiltered = useMemo(() => {
        if (!moduleId) return [];
        let qs = allBankQuestions;

        // Filter by module (uses paper's selected moduleId directly)
        qs = qs.filter(q => q.module_id === parseInt(moduleId));

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            qs = qs.filter(q => 
                (q.question_text && q.question_text.toLowerCase().includes(term)) ||
                (q.question_type && q.question_type.toLowerCase().includes(term)) ||
                (q.module_name && q.module_name.toLowerCase().includes(term))
            );
        }

        return qs;
    }, [allBankQuestions, moduleId, searchTerm]);

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
    const handleRemoveQuestion = (id) => {
        setAddedQuestions(addedQuestions.filter(q => q.id !== id));
        toast.success("Question removed");
    };

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
                    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "visible", border: "1px solid #e2e8f0" }}>
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

                                    {/* Training Module Searchable Dropdown */}
                                    <div ref={moduleDropdownRef} style={{ position: "relative" }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Training Module <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        
                                        {/* Dropdown Trigger Header */}
                                        <div
                                            onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                                            style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9,
                                                padding: "11px 14px", fontSize: 14, color: moduleId ? "#1e293b" : "#94a3b8",
                                                background: "#fff", cursor: "pointer", userSelect: "none"
                                            }}
                                        >
                                            <span>
                                                {moduleId 
                                                    ? modules.find(m => m.id === parseInt(moduleId))?.module_name || "Select Training Module..."
                                                    : "Select Training Module..."}
                                            </span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16, color: "#64748b", transition: "transform 0.2s", transform: isModuleDropdownOpen ? "rotate(180deg)" : "none" }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </div>

                                        {/* Dropdown Panel */}
                                        {isModuleDropdownOpen && (
                                            <div style={{
                                                position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
                                                background: "#fff", border: "1px solid #cbd5e1", borderRadius: 12,
                                                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
                                                zIndex: 1000, overflow: "hidden", display: "flex", flexDirection: "column"
                                            }}>
                                                {/* Search Input */}
                                                <div style={{ padding: 10, borderBottom: "1px solid #e2e8f0", position: "relative", background: "#f8fafc" }}>
                                                    <input
                                                        type="text"
                                                        value={moduleSearchTerm}
                                                        onChange={(e) => setModuleSearchTerm(e.target.value)}
                                                        placeholder="Search training modules..."
                                                        style={{
                                                            width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                                            borderRadius: 8, padding: "8px 12px 8px 32px", fontSize: 13, outline: "none", color: "#1e293b",
                                                            background: "#fff"
                                                        }}
                                                        onFocus={e => e.target.style.borderColor = "#253361"}
                                                        onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                                    />
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.602 10.602z" />
                                                    </svg>
                                                </div>

                                                {/* Modules List */}
                                                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                                    {filteredModules.length === 0 ? (
                                                        <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: 13 }}>
                                                            No modules found.
                                                        </div>
                                                    ) : (
                                                        filteredModules.map((m) => {
                                                            const isSelected = parseInt(moduleId) === m.id;
                                                            return (
                                                                <div 
                                                                    key={m.id} 
                                                                    onClick={() => {
                                                                        handleModuleSelection(m.id);
                                                                        setIsModuleDropdownOpen(false);
                                                                        setModuleSearchTerm("");
                                                                    }}
                                                                    style={{ 
                                                                        padding: "10px 16px", 
                                                                        borderBottom: "1px solid #f1f5f9",
                                                                        background: isSelected ? "#f0f4ff" : "#fff",
                                                                        cursor: "pointer",
                                                                        fontSize: 13.5,
                                                                        color: isSelected ? "#253361" : "#1e293b",
                                                                        fontWeight: isSelected ? 700 : 500,
                                                                        userSelect: "none",
                                                                        transition: "background 0.15s"
                                                                    }}
                                                                >
                                                                    {m.module_name}
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
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

                                {/* Custom Searchable Multi-Select Dropdown */}
                                <div ref={dropdownRef} style={{ position: "relative", marginBottom: 24 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                        Select Questions <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    
                                    {/* Dropdown Trigger Header */}
                                    <div
                                        onClick={() => {
                                            if (moduleId) {
                                                setIsDropdownOpen(!isDropdownOpen);
                                            } else {
                                                toast.error("Please select a training module in the configuration section first");
                                            }
                                        }}
                                        style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9,
                                            padding: "11px 14px", fontSize: 14, color: moduleId ? "#1e293b" : "#94a3b8",
                                            background: moduleId ? "#fff" : "#f1f5f9", cursor: moduleId ? "pointer" : "not-allowed",
                                            userSelect: "none"
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
                                                    placeholder="Search questions by text or type..."
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
                                                        {allBankQuestions.length === 0 ? "No questions available in the question bank. Please add some first." : "No matching questions found."}
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
                                                                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: "1.5px 5px", borderRadius: 4, background: q.question_type === "MCQ" ? "#fef3c7" : "#d1fae5", color: q.question_type === "MCQ" ? "#b45309" : "#065f46" }}>
                                                                            {q.question_type}
                                                                        </span>
                                                                        <span style={{ fontSize: 10.5, color: "#64748b" }}>
                                                                            Correct: <strong>{q.correct_answer}</strong>
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
                            display: "flex", justifyContent: "flex-end", gap: 14, background: "#fafafa",
                            borderBottomLeftRadius: 16, borderBottomRightRadius: 16
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
