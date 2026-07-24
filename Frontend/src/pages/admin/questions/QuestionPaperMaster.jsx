import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getQuestionPapers, deleteQuestionPaper } from "../../../api/questionPaperApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";
import { useNavigate } from "react-router-dom";

export default function QuestionPaperMaster() {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const { hasPermission } = usePermission();

    const canWrite = hasPermission("question_paper", "write");
    const canUpdate = hasPermission("question_paper", "update");
    const canDelete = hasPermission("question_paper", "delete");

    const loadQuestionPapers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getQuestionPapers();
            setPapers(response.data.data || []);
        } catch (err) {
            console.error("Failed to load question papers", err);
            setError("Unable to load Question Papers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuestionPapers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question paper?")) return;
        setLoading(true);
        try {
            await deleteQuestionPaper(id);
            toast.success("Question Paper deleted successfully");
            await loadQuestionPapers();
        } catch (err) {
            console.error("Failed to delete question paper", err);
            toast.error(err?.response?.data?.message || "Unable to delete question paper.");
        } finally {
            setLoading(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            {
                key: "id",
                label: "Sr No",
                render: (row) => papers.indexOf(row) + 1,
                sortable: false,
            },
            {
                key: "name",
                label: "Paper Name",
                sortable: true,
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.name}</span>
            },
            {
                key: "exam_type",
                label: "Exam Type",
                sortable: true,
                render: (row) => (
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.exam_type === "Pre" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                        {row.exam_type === "Pre" ? "Pre-Training" : "Post-Training"}
                    </span>
                )
            },
            {
                key: "module_name",
                label: "Module Name",
                sortable: true,
                render: (row) => <span className="font-semibold text-slate-700">{row.module_name || "N/A"}</span>
            },
            {
                key: "questions",
                label: "Total Questions",
                render: (row) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                        <i className="fa-solid fa-list-ol text-[10px]"></i> {Array.isArray(row.questions) ? row.questions.length : 0} Qs
                    </span>
                )
            }
        ];

        if (canUpdate || canDelete) {
            cols.push({
                key: "actions",
                label: "Actions",
                sortable: false,
                render: (row) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {canUpdate && (
                            <button
                                onClick={() => navigate(`/admin/question-paper/edit/${row.id}`)}
                                style={{
                                    display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                    borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                                }}
                                title="Edit Question Paper"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
                                </svg>
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(row.id)}
                                style={{
                                    display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                    borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", cursor: "pointer"
                                }}
                                title="Delete Question Paper"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                            </button>
                        )}
                    </div>
                )
            });
        }

        return cols;
    }, [papers, canUpdate, canDelete, navigate]);

    const actionButton = canWrite && (
        <button
            onClick={() => navigate("/admin/question-paper/create")}
            style={{
                display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
            }}
            title="Create Question Paper"
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
                {error && (
                    <div style={{
                        background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c",
                        padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                        Loading Question Papers...
                    </div>
                ) : (
                    <DataTable
                        title="Question Papers"
                        columns={columns}
                        data={papers}
                        searchPlaceholder="Search question papers by name, module..."
                        tableId="question_paper_master"
                        actionButton={actionButton}
                    />
                )}
            </div>
        </div>
    );
}
