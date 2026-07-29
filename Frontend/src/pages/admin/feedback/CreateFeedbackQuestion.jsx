import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { createFeedbackQuestion, getFeedbackQuestionById, updateFeedbackQuestion } from "../../../api/feedbackQuestionBankApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateFeedbackQuestion() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [language, setLanguage] = useState("English");
    const [questionType, setQuestionType] = useState("Rating");
    const [questionText, setQuestionText] = useState("");

    useEffect(() => {
        if (isEditMode) {
            const fetchQuestionDetails = async () => {
                setLoading(true);
                try {
                    const res = await getFeedbackQuestionById(id);
                    const q = res.data.data;
                    if (q) {
                        setLanguage(q.language || "English");
                        setQuestionType(q.question_type || "Rating");
                        setQuestionText(q.question_text || "");
                    }
                } catch (err) {
                    console.error("Error fetching feedback question detail", err);
                    setError("Failed to load feedback question details");
                } finally {
                    setLoading(false);
                }
            };
            fetchQuestionDetails();
        }
    }, [id, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!questionText.trim()) {
            toast.error("Question text is required");
            return;
        }

        const data = {
            language,
            questionType,
            questionText: questionText.trim()
        };

        setSaving(true);
        try {
            if (isEditMode) {
                const res = await updateFeedbackQuestion(id, data);
                if (res.data && res.data.success) {
                    toast.success("Feedback question updated successfully");
                    navigate("/admin/feedback-question-bank");
                } else {
                    toast.error(res.data?.message || "Failed to update feedback question");
                }
            } else {
                const res = await createFeedbackQuestion(data);
                if (res.data && res.data.success) {
                    toast.success("Feedback question created successfully");
                    navigate("/admin/feedback-question-bank");
                } else {
                    toast.error(res.data?.message || "Failed to create feedback question");
                }
            }
        } catch (err) {
            console.error("Save error:", err);
            toast.error(err?.response?.data?.message || "Failed to save feedback question");
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
                            {isEditMode ? "Edit Feedback Question" : "Add Feedback Question"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            Define language and response type for course evaluation questions
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/feedback-question-bank")}
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

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 font-semibold">
                        Loading question details...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 rounded-2xl border border-red-200 shadow-sm p-6 text-center font-bold">
                        {error}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Language selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 font-semibold transition"
                                >
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                </select>
                            </div>

                            {/* Question Type selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Type</label>
                                <select
                                    value={questionType}
                                    onChange={(e) => setQuestionType(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 font-semibold transition"
                                >
                                    <option value="Rating">Rating (0-5 Stars)</option>
                                    <option value="Text">Text / Comments</option>
                                </select>
                            </div>
                        </div>

                        {/* Question Text */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Question Text</label>
                            <textarea
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder="Enter the evaluation question..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-400 font-semibold transition placeholder:text-slate-400 placeholder:font-medium leading-relaxed"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/feedback-question-bank")}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-transparent rounded-xl text-slate-700 text-sm font-bold transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white text-sm font-bold rounded-xl transition cursor-pointer shadow-md shadow-slate-900/10 flex items-center justify-center min-w-[100px]"
                            >
                                {saving ? "Saving..." : "Save Question"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
