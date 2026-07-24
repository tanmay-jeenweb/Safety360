import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { getTrainingModules } from "../../../api/trainingModuleApi";
import { createQuestion, getQuestionById, updateQuestion } from "../../../api/questionBankApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateQuestion() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [moduleId, setModuleId] = useState("");
    const [language, setLanguage] = useState("English");
    const [questionType, setQuestionType] = useState("MCQ");
    const [questionText, setQuestionText] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [correctAnswer, setCorrectAnswer] = useState("");

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const res = await getTrainingModules();
                setModules(res.data.data || []);
            } catch (err) {
                console.error("Error loading modules", err);
                toast.error("Failed to load training modules");
            }
        };
        fetchModules();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            const fetchQuestionDetails = async () => {
                setLoading(true);
                try {
                    const res = await getQuestionById(id);
                    const q = res.data.data;
                    if (q) {
                        setModuleId(q.module_id || "");
                        setLanguage(q.language || "English");
                        setQuestionType(q.question_type || "MCQ");
                        setQuestionText(q.question_text || "");
                        
                        const existingOptions = Array.isArray(q.options) && q.options.length >= 2
                            ? q.options
                            : ["", ""];
                        setOptions(existingOptions);
                        setCorrectAnswer(q.correct_answer || "");
                    }
                } catch (err) {
                    console.error("Error fetching question detail", err);
                    setError("Failed to load question details");
                } finally {
                    setLoading(false);
                }
            };
            fetchQuestionDetails();
        }
    }, [id, isEditMode]);

    const handleQuestionTypeChange = (newType) => {
        setQuestionType(newType);
        if (newType === "True/False") {
            setOptions(["True", "False"]);
            setCorrectAnswer("True");
        } else {
            setOptions(["", ""]);
            setCorrectAnswer("");
        }
    };

    const handleOptionChange = (index, value) => {
        const updated = [...options];
        const oldValue = updated[index];
        updated[index] = value;
        setOptions(updated);

        if (correctAnswer === oldValue) {
            setCorrectAnswer(value);
        }
    };

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index) => {
        if (options.length <= 2) {
            toast.error("At least 2 options are required for MCQ questions");
            return;
        }
        const removedValue = options[index];
        const updated = options.filter((_, i) => i !== index);
        setOptions(updated);

        if (correctAnswer === removedValue) {
            setCorrectAnswer("");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!moduleId) {
            toast.error("Please select a Module Association");
            return;
        }
        if (!questionText.trim()) {
            toast.error("Question text is required");
            return;
        }

        let validOptions = [];
        if (questionType === "MCQ") {
            validOptions = options.map((opt) => opt.trim());
            if (validOptions.some((opt) => opt === "")) {
                toast.error("All option fields must be filled");
                return;
            }
            const uniqueOptions = new Set(validOptions);
            if (uniqueOptions.size !== validOptions.length) {
                toast.error("Option values must be unique");
                return;
            }
            if (!correctAnswer.trim() || !validOptions.includes(correctAnswer.trim())) {
                toast.error("Please select a valid Correct Answer");
                return;
            }
        } else {
            validOptions = ["True", "False"];
            if (!correctAnswer || !validOptions.includes(correctAnswer)) {
                toast.error("Please select a valid Correct Answer (True or False)");
                return;
            }
        }

        const data = {
            moduleId,
            language,
            questionType,
            questionText: questionText.trim(),
            options: validOptions,
            correctAnswer: correctAnswer.trim(),
        };

        setSaving(true);
        try {
            if (isEditMode) {
                await updateQuestion(id, data);
                toast.success("Question updated successfully");
            } else {
                await createQuestion(data);
                toast.success("Question added successfully");
            }
            navigate("/admin/question-bank");
        } catch (err) {
            console.error("Error saving question", err);
            toast.error(err.response?.data?.message || "Failed to save question");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar />

            <main style={{ flex: 1, padding: "32px 30px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifySpaceBetween: "space-between", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                            {isEditMode ? "Edit Question" : "Create New Question"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            {isEditMode ? "Modify question settings and options below" : "Fill out the fields to add a new question to the Question Bank"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/question-bank")}
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
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading question details...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div style={{ padding: "28px" }}>
                            
                            {/* Section 1: Question Meta */}
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    1. Configuration
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Module Association */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Module Association <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <select
                                            value={moduleId}
                                            onChange={(e) => setModuleId(e.target.value)}
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
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

                                    {/* Language */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Language <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                            required
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Question details */}
                            <div style={{ marginBottom: 28 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    2. Question & Type
                                </h3>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                        Question Type <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    <select
                                        value={questionType}
                                        onChange={(e) => handleQuestionTypeChange(e.target.value)}
                                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                        required
                                    >
                                        <option value="MCQ">MCQ</option>
                                        <option value="True/False">True / False</option>
                                    </select>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                        Question Text <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={questionText}
                                        onChange={(e) => setQuestionText(e.target.value)}
                                        placeholder="Enter the question text here..."
                                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", resize: "vertical" }}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section 3: Options & Answer */}
                            <div>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    3. Options & Correct Answer
                                </h3>

                                {questionType === "MCQ" ? (
                                    <div style={{ marginBottom: 24, background: "#f8fafc", padding: "20px 24px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                MCQ Options (Min 2 Compulsory)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddOption}
                                                style={{
                                                    background: "linear-gradient(135deg, #253361, #1a2446)", color: "#fff", border: "none",
                                                    borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700,
                                                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 2px 8px rgba(37,51,97,0.25)"
                                                }}
                                            >
                                                <i className="fa-solid fa-plus text-xs"></i> Add Option
                                            </button>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            {options.map((opt, idx) => (
                                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#64748b", width: 80 }}>
                                                        Option {idx + 1} {idx < 2 ? "*" : ""}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1} text...`}
                                                        style={{ flex: 1, boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                                        required={idx < 2}
                                                    />
                                                    {idx >= 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(idx)}
                                                            style={{
                                                                background: "#fee2e2", color: "#dc2626", border: "none",
                                                                borderRadius: 8, width: 38, height: 38, cursor: "pointer",
                                                                display: "flex", alignItems: "center", justifyContent: "center"
                                                            }}
                                                            title="Remove Option"
                                                        >
                                                            <i className="fa-solid fa-trash-can text-sm"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: 24, background: "#f8fafc", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                                        <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                                            True / False Choices
                                        </span>
                                        <div style={{ display: "flex", gap: 16 }}>
                                            <div style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#334155" }}>
                                                True
                                            </div>
                                            <div style={{ padding: "10px 20px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#334155" }}>
                                                False
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                        Correct Answer <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    <select
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                        required
                                    >
                                        <option value="">Select Correct Answer...</option>
                                        {questionType === "MCQ" ? (
                                            options.filter(opt => opt.trim() !== "").map((opt, idx) => (
                                                <option key={idx} value={opt}>
                                                    Option {idx + 1}: {opt}
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="True">True</option>
                                                <option value="False">False</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div style={{ padding: "20px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: 16, background: "#fafafa" }}>
                            <button
                                type="button"
                                onClick={() => navigate("/admin/question-bank")}
                                style={{
                                    padding: "10px 20px", borderRadius: 9, border: "1.5px solid #cbd5e1",
                                    background: "#fff", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: "10px 24px", borderRadius: 9, border: "none",
                                    background: saving ? "#94a3b8" : "linear-gradient(135deg, #253361, #1a2446)", color: "#fff",
                                    fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
                                    boxShadow: saving ? "none" : "0 3px 10px rgba(37,51,97,0.3)"
                                }}
                            >
                                {saving ? "Saving..." : isEditMode ? "Update Question" : "Create Question"}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
