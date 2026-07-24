import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../../api/departmentApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Department ────────────────────────────
function DepartmentFormModal({ isOpen, onClose, onSave, editingRow, saving }) {
    const [departmentName, setDepartmentName] = useState("");

    useEffect(() => {
        if (editingRow) {
            setDepartmentName(editingRow.department_name || "");
        } else {
            setDepartmentName("");
        }
    }, [editingRow, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!departmentName.trim()) {
            toast.error("Department name is required");
            return;
        }
        onSave(departmentName.trim());
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
            <div style={{
                background: "#fff", borderRadius: 18, width: "100%", maxWidth: 500, margin: "0 auto",
                boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden"
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "linear-gradient(135deg, #253361, #1a2446)"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                            {editingRow ? "Edit Department" : "Add New Department"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update department details below" : "Fill in the details to add a new department"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8,
                            width: 34, height: 34, cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", color: "#fff"
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ padding: "24px" }}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Department Name <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={departmentName}
                                onChange={(e) => setDepartmentName(e.target.value)}
                                placeholder="Enter department name..."
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b"
                                }}
                                onFocus={e => e.target.style.borderColor = "#253361"}
                                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div style={{
                        padding: "16px 24px", borderTop: "1px solid #f1f5f9",
                        display: "flex", justifyContent: "flex-end", gap: 12, background: "#fafafa"
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            style={{
                                padding: "9px 20px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                                color: "#475569", background: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer"
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !departmentName.trim()}
                            style={{
                                padding: "9px 24px", borderRadius: 8, border: "none",
                                background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: saving ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                            }}
                        >
                            {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Department"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Department Master Page Component ─────────────────────────────────────
export default function DepartmentMaster() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadDepartments = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getDepartments();
            setDepartments(response.data.data || []);
        } catch (err) {
            console.error("Failed to load departments", err);
            setError("Unable to load departments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDepartments();
    }, []);

    const handleOpenAddModal = () => {
        setEditingRow(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (row) => {
        setEditingRow(row);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRow(null);
    };

    const handleSave = async (departmentName) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateDepartment(editingRow.id, { departmentName });
                toast.success("Department updated successfully");
            } else {
                await createDepartment({ departmentName });
                toast.success("Department created successfully");
            }
            handleCloseModal();
            await loadDepartments();
        } catch (err) {
            console.error("Failed to save department", err);
            toast.error(err?.response?.data?.message || "Unable to save department.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        setSaving(true);
        try {
            await deleteDepartment(id);
            toast.success("Department deleted successfully");
            await loadDepartments();
        } catch (err) {
            console.error("Failed to delete department", err);
            toast.error(err?.response?.data?.message || "Unable to delete department.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "70px" },
            {
                key: "department_name",
                label: "Department Name",
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.department_name}</span>
            }
        ];

        const canUpdate = hasPermission("department_master", "update");
        const canDelete = hasPermission("department_master", "delete");

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
                                onClick={() => handleOpenEditModal(row)}
                                style={{
                                    display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                    borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                                }}
                                title="Edit Department"
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
                                    borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#e11d48", cursor: "pointer"
                                }}
                                title="Delete Department"
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
    }, [hasPermission]);

    const canWrite = hasPermission("department_master", "write");

    return (
        <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
            <Navbar />

            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 48px" }}>
                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 16, marginBottom: 24
                }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12,
                                background: "linear-gradient(135deg, #253361, #1a2446)",
                                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff"
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 22, height: 22 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5s.75 0 .75.75v1.5c0 .75-.75.75-.75.75H9m0-3h1.5m-1.5 6h1.5s.75 0 .75.75v1.5c0 .75-.75.75-.75.75H9m0-3h1.5m-1.5 6h1.5s.75 0 .75.75v1.5c0 .75-.75.75-.75.75H9m0-3h1.5" />
                                </svg>
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                                    Department Master
                                </h1>
                                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                                    Manage organization departments and department records
                                </p>
                            </div>
                        </div>
                    </div>

                    {canWrite && (
                        <button
                            onClick={handleOpenAddModal}
                            style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "10px 20px", borderRadius: 10, border: "none",
                                background: "linear-gradient(135deg, #253361, #1a2446)",
                                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(37,51,97,0.3)"
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add Department
                        </button>
                    )}
                </div>

                {/* Error Notification */}
                {error && (
                    <div style={{
                        background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12,
                        padding: "14px 18px", marginBottom: 20, color: "#be123c", fontSize: 14,
                        display: "flex", alignItems: "center", gap: 10
                    }}>
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Data Table */}
                <div style={{
                    background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden"
                }}>
                    <DataTable
                        data={departments}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Search departments..."
                        emptyMessage="No departments found. Click 'Add Department' to create one."
                    />
                </div>
            </div>

            {/* Form Modal */}
            <DepartmentFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingRow={editingRow}
                saving={saving}
            />
        </div>
    );
}
