import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getTrainingModules, deleteTrainingModule } from "../../../api/trainingModuleApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../context/PermissionContext";

export default function TrainingModuleMaster() {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    const { hasPermission } = usePermission();

    const loadModules = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getTrainingModules();
            setModules(response.data.data || []);
        } catch (err) {
            console.error("Failed to load training modules", err);
            setError("Unable to load training modules. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadModules();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this training module?")) return;
        try {
            await deleteTrainingModule(id);
            toast.success("Training module deleted successfully");
            await loadModules();
        } catch (err) {
            console.error("Failed to delete training module", err);
            toast.error(err?.response?.data?.message || "Unable to delete training module.");
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "60px" },
            {
                key: "module_name",
                label: "Module Name",
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.module_name}</span>
            },
            {
                key: "category_name",
                label: "Category",
                render: (row) => (
                    <span style={{
                        background: "#f0f3fa", color: "#253361", fontWeight: 600,
                        padding: "3px 8px", borderRadius: 6, fontSize: 12
                    }}>
                        {row.category_name}
                    </span>
                )
            },
            {
                key: "duration_hours",
                label: "Duration (Hrs)",
                render: (row) => <span>{row.duration_hours} h</span>
            },
            {
                key: "validity_months",
                label: "Validity (Mths)",
                render: (row) => <span>{row.validity_months} m</span>
            },
            {
                key: "passing_marks",
                label: "Passing (%)",
                render: (row) => <span style={{ fontWeight: 600 }}>{row.passing_marks}%</span>
            },
            {
                key: "refresher_months",
                label: "Refresher (Mths)",
                render: (row) => <span>{row.refresher_months} m</span>
            },
            {
                key: "practical_required",
                label: "Practical",
                render: (row) => (
                    <span style={{
                        color: row.practical_required === 'Yes' ? '#15803d' : '#64748b',
                        fontWeight: 600, fontSize: 12
                    }}>
                        {row.practical_required}
                    </span>
                )
            },
            {
                key: "pre_test_qs",
                label: "Pre Qs",
                render: (row) => <span>{row.pre_test_qs}</span>
            },
            {
                key: "post_test_qs",
                label: "Post Qs",
                render: (row) => <span>{row.post_test_qs}</span>
            },
            {
                key: "certificate_applicable",
                label: "Certificate",
                render: (row) => (
                    <span style={{
                        color: row.certificate_applicable === 'Yes' ? '#15803d' : '#64748b',
                        fontWeight: 600, fontSize: 12
                    }}>
                        {row.certificate_applicable}
                    </span>
                )
            }
        ];

        const canUpdate = hasPermission("training_module_master", "update");
        const canDelete = hasPermission("training_module_master", "delete");

        if (canUpdate || canDelete) {
            cols.push({
                key: "actions",
                label: "Actions",
                sortable: false,
                minWidth: "120px",
                render: (row) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {canUpdate && (
                            <button
                                onClick={() => navigate(`/admin/training-modules/edit/${row.id}`)}
                                style={{
                                    display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                    borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                                }}
                                title="Edit Training Module"
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
                                title="Delete Training Module"
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
    }, [hasPermission, navigate]);

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar title="CRM Admin" />

            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", padding: "32px 30px" }}>
                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}
                <DataTable
                    tableId="training_module_master"
                    title="Training Module Master"
                    data={modules}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search modules or categories..."
                    actionButton={
                        hasPermission("training_module_master", "write") ? (
                            <button
                                onClick={() => navigate("/admin/training-modules/create")}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                                title="Add Training Module"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        ) : null
                    }
                />
            </main>
        </div>
    );
}
