import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getRoles, createRole, updateRole, deleteRole } from "../../../api/roleApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Role ──────────────────────────────────
function RoleFormModal({ isOpen, onClose, onSave, editingRow, saving }) {
    const [roleName, setRoleName] = useState("");

    useEffect(() => {
        if (editingRow) {
            setRoleName(editingRow.role_name || "");
        } else {
            setRoleName("");
        }
    }, [editingRow, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            toast.error("Role name is required");
            return;
        }
        onSave(roleName.trim());
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
                    background: "linear-gradient(135deg, #ea580c, #c2410c)"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                            {editingRow ? "Edit Role" : "Add New Role"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update role details below" : "Fill in the details to add a new role"}
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
                                Role Name <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={roleName}
                                onChange={(e) => setRoleName(e.target.value)}
                                placeholder="Enter role name..."
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b"
                                }}
                                onFocus={e => e.target.style.borderColor = "#ea580c"}
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
                            disabled={saving || !roleName.trim()}
                            style={{
                                padding: "9px 24px", borderRadius: 8, border: "none",
                                background: saving ? "#94a3b8" : "linear-gradient(135deg,#ea580c,#c2410c)",
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: saving ? "none" : "0 2px 8px rgba(234,88,12,0.35)"
                            }}
                        >
                            {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Role Master Page Component ───────────────────────────────────────────
export default function RoleMaster() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadRoles = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getRoles();
            setRoles(response.data.data || []);
        } catch (err) {
            console.error("Failed to load roles", err);
            setError("Unable to load roles. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRoles();
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

    const handleSave = async (roleName) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateRole(editingRow.id, { roleName });
                toast.success("Role updated successfully");
            } else {
                await createRole({ roleName });
                toast.success("Role created successfully");
            }
            handleCloseModal();
            await loadRoles();
        } catch (err) {
            console.error("Failed to save role", err);
            toast.error(err?.response?.data?.message || "Unable to save role.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        setSaving(true);
        try {
            await deleteRole(id);
            toast.success("Role deleted successfully");
            await loadRoles();
        } catch (err) {
            console.error("Failed to delete role", err);
            toast.error(err?.response?.data?.message || "Unable to delete role.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "70px" },
            {
                key: "role_name",
                label: "Role Name",
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.role_name}</span>
            }
        ];

        const canUpdate = hasPermission("role_master", "update");
        const canDelete = hasPermission("role_master", "delete");

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
                                    borderRadius: 8, border: "1px solid #fed7aa", background: "#fff7ed", color: "#ea580c", cursor: "pointer"
                                }}
                                title="Edit Role"
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
                                title="Delete Role"
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
    }, [hasPermission]);

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar title="CRM Admin" />

            <RoleFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingRow={editingRow}
                saving={saving}
            />

            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", padding: "32px 30px" }}>
                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}
                <DataTable
                    tableId="role_master"
                    title="Role Master"
                    data={roles}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search roles..."
                    actionButton={
                        hasPermission("role_master", "write") ? (
                            <button
                                onClick={handleOpenAddModal}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#ea580c,#c2410c)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(234,88,12,0.35)"
                                }}
                                title="Add Role"
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
