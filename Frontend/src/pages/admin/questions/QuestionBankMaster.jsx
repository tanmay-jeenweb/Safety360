import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { getQuestions, deleteQuestion } from "../../../api/questionBankApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

export default function QuestionBankMaster() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const { hasPermission } = usePermission();

    const canWrite = hasPermission("question_bank", "write");
    const canUpdate = hasPermission("question_bank", "update");
    const canDelete = hasPermission("question_bank", "delete");

    const loadData = async () => {
        setLoading(true);
        try {
            const qRes = await getQuestions();
            if (qRes.data && qRes.data.success) {
                setQuestions(qRes.data.data || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load Question Bank data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteClick = async (row) => {
        if (!window.confirm(`Are you sure you want to delete this question?`)) return;

        try {
            const res = await deleteQuestion(row.id);
            if (res.data && res.data.success) {
                toast.success("Question deleted successfully");
                loadData();
            } else {
                toast.error(res.data?.message || "Failed to delete question");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Error deleting question");
        }
    };

    // Columns for DataTable
    const columns = useMemo(() => [
        {
            key: "id",
            label: "Sr No",
            render: (row) => questions.indexOf(row) + 1,
            sortable: false,
        },
        {
            key: "module_name",
            label: "Module Association",
            sortable: true,
            render: (row) => <span className="font-semibold text-slate-700">{row.module_name || "N/A"}</span>
        },
        {
            key: "language",
            label: "Language",
            sortable: true,
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.language === "English" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {row.language}
                </span>
            )
        },
        {
            key: "question_type",
            label: "Question Type",
            sortable: true,
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.question_type === "MCQ" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {row.question_type}
                </span>
            )
        },
        {
            key: "question_text",
            label: "Question Text",
            sortable: true,
            render: (row) => <div className="max-w-xs truncate font-medium text-slate-800" title={row.question_text}>{row.question_text}</div>
        },
        {
            key: "options",
            label: "Options",
            render: (row) => {
                const opts = Array.isArray(row.options) ? row.options : [];
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {opts.map((o, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                                {o}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: "correct_answer",
            label: "Correct Answer",
            sortable: true,
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                    <i className="fa-solid fa-check text-[10px]"></i> {row.correct_answer}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {canUpdate && (
                        <button
                            onClick={() => navigate(`/admin/question-bank/edit/${row.id}`)}
                            style={{
                                display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                            }}
                            title="Edit Question"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
                            </svg>
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDeleteClick(row)}
                            style={{
                                display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", cursor: "pointer"
                            }}
                            title="Delete Question"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ], [canUpdate, canDelete, questions, navigate]);

    // Custom add button with "+" icon matching other masters' actionButton
    const actionButton = canWrite && (
        <button
            onClick={() => navigate("/admin/question-bank/create")}
            style={{
                display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
            }}
            title="Add New Question"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
                

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                        Loading Question Bank data...
                    </div>
                ) : (
                    <DataTable
                        title="Question Bank"
                        columns={columns}
                        data={questions}
                        searchPlaceholder="Search questions by text, module, language..."
                        tableId="question_bank_master"
                        actionButton={actionButton}
                    />
                )}
            </div>
        </div>
    );
}
