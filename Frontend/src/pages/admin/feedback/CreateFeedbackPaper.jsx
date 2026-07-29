import { useEffect, useState, useMemo } from "react";
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
    const [selectedQuestionId, setSelectedQuestionId] = useState("");
    
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

    // Filter available questions (not yet added) for the dropdown selection
    const availableQuestions = useMemo(() => {
        return bankQuestions.filter(q => !addedQuestions.some(added => added.id === q.id));
    }, [bankQuestions, addedQuestions]);

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
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 p-6 w-full mx-auto">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                            {isEditMode ? "Edit Feedback Paper" : "Create Feedback Paper"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            Assemble a sequence of survey/feedback questions for course evaluations
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

                {loading && bankQuestions.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 font-semibold animate-pulse">
                        Loading details...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 rounded-2xl border border-red-200 shadow-sm p-6 text-center font-bold">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Meta & Question Selection */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Paper Meta Details */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">Paper Details</h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paper Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Trainer Evaluation Form"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 font-semibold transition"
                                    />
                                </div>
                            </div>

                            {/* Question Select Panel */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">Add Questions</h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Question</label>
                                    <select
                                        value={selectedQuestionId}
                                        onChange={(e) => setSelectedQuestionId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 font-semibold transition text-sm"
                                    >
                                        <option value="">-- Choose feedback question --</option>
                                        {availableQuestions.map((q) => (
                                            <option key={q.id} value={q.id}>
                                                [{q.question_type} - {q.language}] {q.question_text.length > 50 ? q.question_text.substring(0, 50) + "..." : q.question_text}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-950 text-white font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Add Question to Paper
                                </button>
                            </div>
                        </div>

                        {/* Right Column: Assembled List */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">Assembled Questions</h3>
                                        <p className="text-slate-400 text-xs mt-0.5">Define sequence and order of questions inside the feedback form</p>
                                    </div>
                                    <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                                        {addedQuestions.length} Question{addedQuestions.length !== 1 ? 's' : ''} Added
                                    </span>
                                </div>

                                {/* List Container */}
                                <div className="flex-1 min-h-[300px] space-y-3">
                                    {addedQuestions.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10 text-slate-300 mb-2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 2.24a4.5 4.5 0 1 1 9.016 0D12 6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08" />
                                            </svg>
                                            <p className="text-sm font-semibold text-slate-400">No questions added yet</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Select feedback questions on the left side to build this paper</p>
                                        </div>
                                    ) : (
                                        addedQuestions.map((q, index) => (
                                            <div
                                                key={q.id}
                                                className="flex items-start justify-between gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-200 text-slate-600 font-bold text-xs shrink-0 mt-0.5">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 leading-snug">{q.question_text}</p>
                                                        <div className="flex gap-2 mt-1.5">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.language === "English" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-purple-50 text-purple-700 border border-purple-100"}`}>
                                                                {q.language}
                                                            </span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.question_type === "Rating" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                                                                {q.question_type === "Rating" ? "Rating (0-5)" : "Text"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    {/* Move Up */}
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => moveQuestionUp(index)}
                                                        className={`p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                                                        </svg>
                                                    </button>
                                                    {/* Move Down */}
                                                    <button
                                                        type="button"
                                                        disabled={index === addedQuestions.length - 1}
                                                        onClick={() => moveQuestionDown(index)}
                                                        className={`p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                        </svg>
                                                    </button>
                                                    {/* Remove */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveQuestion(q.id)}
                                                        className="p-1.5 rounded border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                                        title="Remove Question"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Form Action Buttons */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate("/admin/feedback-paper")}
                                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-transparent rounded-xl text-slate-700 text-sm font-bold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={saving}
                                        className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-md shadow-slate-900/10 flex items-center justify-center min-w-[100px]"
                                    >
                                        {saving ? "Saving..." : "Save Feedback Paper"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
