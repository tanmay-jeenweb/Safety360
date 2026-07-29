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
        <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans">
            <Navbar />

            <main className="flex-1 py-8 px-[30px] w-full mx-auto box-border">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="m-0 text-[24px] font-bold text-[#1e293b]">
                            {isEditMode ? "Edit Question" : "Create New Question"}
                        </h1>
                        <p className="mt-1 text-[14px] text-[#64748b]">
                            {isEditMode ? "Modify question settings and options below" : "Fill out the fields to add a new question to the Question Bank"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/question-bank")}
                        className="py-[9px] px-[18px] rounded-[9px] border-[1.5px] border-[#cbd5e1] bg-white text-[#475569] font-semibold text-[13px] cursor-pointer flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[16px] h-[16px]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {error && (
                    <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] py-3 px-4 rounded-[10px] mb-5 text-[14px] font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center p-10 text-[#64748b]">Loading question details...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden border border-[#e2e8f0]">
                        <div className="p-7">
                            
                            {/* Section 1: Question Meta */}
                            <div className="mb-7">
                                <h3 className="m-0 mb-4 text-[15px] font-bold text-[#253361] uppercase tracking-[0.05em] border-b-[1.5px] border-[#f1f5f9] pb-2">
                                    1. Configuration
                                </h3>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Module Association */}
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#475569] mb-1.5">
                                            Module Association <span className="text-[#e11d48]">*</span>
                                        </label>
                                        <select
                                            value={moduleId}
                                            onChange={(e) => setModuleId(e.target.value)}
                                            className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
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
                                        <label className="block text-[13px] font-bold text-[#475569] mb-1.5">
                                            Language <span className="text-[#e11d48]">*</span>
                                        </label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
                                            required
                                        >
                                            <option value="English">English</option>
                                            <option value="Hindi">Hindi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Question details */}
                            <div className="mb-7">
                                <h3 className="m-0 mb-4 text-[15px] font-bold text-[#253361] uppercase tracking-[0.05em] border-b-[1.5px] border-[#f1f5f9] pb-2">
                                    2. Question & Type
                                </h3>

                                <div className="mb-5">
                                    <label className="block text-[13px] font-bold text-[#475569] mb-1.5">
                                        Question Type <span className="text-[#e11d48]">*</span>
                                    </label>
                                    <select
                                        value={questionType}
                                        onChange={(e) => handleQuestionTypeChange(e.target.value)}
                                        className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
                                        required
                                    >
                                        <option value="MCQ">MCQ</option>
                                        <option value="True/False">True / False</option>
                                    </select>
                                </div>

                                <div className="mb-5">
                                    <label className="block text-[13px] font-bold text-[#475569] mb-1.5">
                                        Question Text <span className="text-[#e11d48]">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={questionText}
                                        onChange={(e) => setQuestionText(e.target.value)}
                                        placeholder="Enter the question text here..."
                                        className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[14px] outline-none text-[#1e293b] resize-y focus:border-[#253361] transition-colors duration-200"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Section 3: Options & Answer */}
                            <div>
                                <h3 className="m-0 mb-4 text-[15px] font-bold text-[#253361] uppercase tracking-[0.05em] border-b-[1.5px] border-[#f1f5f9] pb-2">
                                    3. Options & Correct Answer
                                </h3>

                                {questionType === "MCQ" ? (
                                    <div className="mb-6 bg-[#f8fafc] py-5 px-6 rounded-xl border border-[#e2e8f0]">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[13px] font-bold text-[#475569] uppercase tracking-[0.05em]">
                                                MCQ Options (Min 2 Compulsory)
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddOption}
                                                className="bg-gradient-to-br from-[#253361] to-[#1a2446] text-white border-none rounded-lg py-[7px] px-3.5 text-[12px] font-bold cursor-pointer flex items-center gap-1.5 shadow-[0_2px_8px_rgba(37,51,97,0.25)]"
                                            >
                                                <i className="fa-solid fa-plus text-xs"></i> Add Option
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {options.map((opt, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <span className="text-[13px] font-bold text-[#64748b] w-20">
                                                        Option {idx + 1} {idx < 2 ? "*" : ""}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1} text...`}
                                                        className="flex-1 box-border border-[1.5px] border-[#cbd5e1] rounded-lg py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                                        required={idx < 2}
                                                    />
                                                    {idx >= 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveOption(idx)}
                                                            className="bg-[#fee2e2] text-[#dc2626] border-none rounded-lg w-[38px] h-[38px] cursor-pointer flex items-center justify-center hover:bg-[#fca5a5] transition-colors duration-150"
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
                                    <div className="mb-6 bg-[#f8fafc] py-4 px-5 rounded-xl border border-[#e2e8f0]">
                                        <span className="block text-[13px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-3">
                                            True / False Choices
                                        </span>
                                        <div className="flex gap-4">
                                            <div className="py-2.5 px-5 bg-white border border-[#cbd5e1] rounded-lg text-[14px] font-bold text-[#334155]">
                                                True
                                            </div>
                                            <div className="py-2.5 px-5 bg-white border border-[#cbd5e1] rounded-lg text-[14px] font-bold text-[#334155]">
                                                False
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[13px] font-bold text-[#475569] mb-1.5">
                                        Correct Answer <span className="text-[#e11d48]">*</span>
                                    </label>
                                    <select
                                        value={correctAnswer}
                                        onChange={(e) => setCorrectAnswer(e.target.value)}
                                        className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
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
                        <div className="py-5 px-7 border-t border-[#f1f5f9] flex justify-end gap-4 bg-[#fafafa]">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/question-bank")}
                                className="py-2.5 px-5 rounded-[9px] border-[1.5px] border-[#cbd5e1] bg-white text-[#475569] text-[14px] font-semibold cursor-pointer hover:bg-[#f8fafc] transition-colors duration-150"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`py-2.5 px-6 rounded-[9px] border-none text-white text-[14px] font-bold transition-all duration-200 ${saving ? "bg-[#94a3b8] cursor-not-allowed opacity-70 shadow-none" : "bg-gradient-to-br from-[#253361] to-[#1a2446] cursor-pointer opacity-100 shadow-[0_3px_10px_rgba(37,51,97,0.3)]"}`}
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
