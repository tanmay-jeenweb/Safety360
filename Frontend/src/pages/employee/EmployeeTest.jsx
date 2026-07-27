import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTestDetails, submitTest } from "../../api/employeeApi";
import toast from "react-hot-toast";

export default function EmployeeTest() {
    const { batchId, testType } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [testInfo, setTestInfo] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { [questionId]: selected_option }
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getTestDetails(batchId, testType);
                if (res.data.success) {
                    setTestInfo(res.data.data);
                    setQuestions(res.data.data.questions || []);
                } else {
                    toast.error(res.data.message || "Failed to load test details");
                    navigate("/employee/dashboard");
                }
            } catch (err) {
                console.error("Error loading test details:", err);
                toast.error(err.response?.data?.message || "Error loading test details");
                navigate("/employee/dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [batchId, testType, navigate]);

    const handleSelectOption = (questionId, optionText) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionText
        }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        // Validation: check if all questions are answered
        const unansweredCount = questions.length - Object.keys(answers).length;
        let confirmMsg = "Are you sure you want to submit your exam?";
        if (unansweredCount > 0) {
            confirmMsg = `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit your exam?`;
        }

        if (!window.confirm(confirmMsg)) return;

        setSubmitting(true);
        try {
            const res = await submitTest({
                batchId: parseInt(batchId, 10),
                testType,
                answers
            });

            if (res.data.success) {
                setSubmitted(true);
                toast.success("Exam submitted successfully!");
            } else {
                toast.error(res.data.message || "Submission failed");
            }
        } catch (err) {
            console.error("Error submitting test:", err);
            toast.error(err.response?.data?.message || "Error submitting test");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-semibold">Loading assessment questions...</p>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 via-orange-50/20 to-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* Glows */}
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] bg-orange-600/5 rounded-full blur-[110px] pointer-events-none" />
                <div className="absolute bottom-[20%] right-[20%] w-[30%] h-[30%] bg-amber-500/5 rounded-full blur-[110px] pointer-events-none" />

                <div className="w-full max-w-lg bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(37,51,97,0.06)] hover:shadow-[0_30px_70px_rgba(37,51,97,0.12)] hover:border-orange-500/20 transition-all duration-300 flex flex-col items-center text-center z-10">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 border border-green-100 mb-6 animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                        Thank You!
                    </h1>
                    <p className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed mb-8">
                        Your exam responses have been safely saved and evaluated. You can now close this tab or return to the dashboard.
                    </p>

                    <button
                        onClick={() => navigate("/employee/dashboard")}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-2xl text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 hover:-translate-y-0.5 cursor-pointer"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <p className="text-slate-500 text-sm font-semibold mb-4">This exam does not have any questions configured.</p>
                <button
                    onClick={() => navigate("/employee/dashboard")}
                    className="bg-orange-600 text-white px-6 py-2 rounded-xl text-xs font-semibold hover:bg-orange-500 cursor-pointer"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = answers[currentQuestion.id];
    const isLastQuestion = currentIndex === questions.length - 1;

    return (
        <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 via-orange-50/20 to-slate-100 flex flex-col relative overflow-hidden font-sans antialiased text-slate-800">
            {/* Ambient Glows */}
            <div className="absolute top-[10%] left-[10%] w-[35%] h-[40%] bg-orange-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[40%] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none z-0" />

            {/* Test Header */}
            <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-10 sticky top-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{testType} Test Assessment</span>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight line-clamp-1">
                        {testInfo?.moduleName}
                    </h2>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">Progress</span>
                    <p className="text-xs sm:text-sm font-extrabold text-orange-600">
                        {currentIndex + 1} / {questions.length}
                    </p>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200/50 h-1.5 z-10">
                <div
                    className="bg-orange-600 h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
            </div>

            {/* Assessment Main Area */}
            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10 z-10 flex flex-col justify-start">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(37,51,97,0.04)] mb-6 flex-1 flex flex-col justify-between">
                    <div>
                        {/* Question Text */}
                        <div className="mb-6">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {currentIndex + 1}</span>
                            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 leading-relaxed">
                                {currentQuestion.question_text}
                            </h1>
                        </div>

                        {/* Options List */}
                        <div className="space-y-3.5 mb-8">
                            {currentQuestion.options.map((option, optIdx) => {
                                const isSelected = selectedAnswer === option;
                                return (
                                    <div
                                        key={optIdx}
                                        onClick={() => handleSelectOption(currentQuestion.id, option)}
                                        className={`flex items-center gap-3.5 p-4 rounded-2xl border text-sm sm:text-base font-semibold cursor-pointer transition-all duration-200 select-none ${
                                            isSelected
                                                ? "border-orange-500 bg-orange-50/50 text-orange-800 shadow-sm"
                                                : "border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 text-slate-700 hover:border-slate-300"
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                            isSelected 
                                                ? "border-orange-600 bg-orange-600" 
                                                : "border-slate-300"
                                        }`}>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-white"></div>
                                            )}
                                        </div>
                                        <span className="leading-tight">{option}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-6 mt-auto">
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            Previous
                        </button>

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {submitting ? "Submitting..." : "Submit Exam"}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all hover:-translate-y-0.5 cursor-pointer flex items-center gap-1.5"
                            >
                                <span>Next</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
