import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getFeedbackPapers, deleteFeedbackPaper } from "../../../api/feedbackPaperApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";
import { useNavigate } from "react-router-dom";

export default function FeedbackPaperMaster() {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const { hasPermission } = usePermission();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin" || user.role === "super admin";

    const canWrite = hasPermission("feedback_papers", "write") || isAdmin;
    const canUpdate = hasPermission("feedback_papers", "update") || isAdmin;
    const canDelete = hasPermission("feedback_papers", "delete") || isAdmin;

    const loadFeedbackPapers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getFeedbackPapers();
            setPapers(response.data.data || []);
        } catch (err) {
            console.error("Failed to load feedback papers", err);
            setError("Unable to load Feedback Papers. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedbackPapers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this feedback paper?")) return;
        setLoading(true);
        try {
            await deleteFeedbackPaper(id);
            toast.success("Feedback Paper deleted successfully");
            await loadFeedbackPapers();
        } catch (err) {
            console.error("Failed to delete feedback paper", err);
            toast.error(err?.response?.data?.message || "Unable to delete feedback paper.");
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
                render: (row) => <span className="font-bold text-slate-800">{row.name}</span>
            },
            {
                key: "questions",
                label: "Total Questions",
                render: (row) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                        <i className="fa-solid fa-list-ol text-[10px]"></i> {Array.isArray(row.questions) ? row.questions.length : 0} Questions
                    </span>
                )
            },
            {
                key: "added_by_name",
                label: "Created By",
                sortable: true,
                render: (row) => <span className="font-semibold text-slate-600">{row.added_by_name || "N/A"}</span>
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
                                onClick={() => navigate(`/admin/feedback-paper/edit/${row.id}`)}
                                style={{
                                    display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                    borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                                }}
                                title="Edit Feedback Paper"
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
                                title="Delete Feedback Paper"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
                                </svg>
                            </button>
                        )}
                    </div>
                )
            });
        }

        return cols;
    }, [canUpdate, canDelete, papers, navigate]);

    // Custom add button with "+" icon matching other masters' actionButton
    const actionButton = canWrite && (
        <button
            onClick={() => navigate("/admin/feedback-paper/create")}
            style={{
                display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
            }}
            title="Create Feedback Paper"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 p-6 w-full mx-auto">
                {loading && papers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 font-semibold animate-pulse">
                        Loading Feedback Papers...
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 rounded-2xl border border-red-200 shadow-sm p-6 text-center font-bold">
                        {error}
                    </div>
                ) : (
                    <DataTable
                        title="Feedback Paper List"
                        columns={columns}
                        data={papers}
                        searchPlaceholder="Search feedback papers by name..."
                        tableId="feedback_paper_master"
                        actionButton={actionButton}
                    />
                )}
            </div>
        </div>
    );
}
