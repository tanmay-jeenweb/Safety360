import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getSites, createSite, updateSite, deleteSite } from "../../../api/siteApi";
import { getClients } from "../../../api/clientApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Site ─────────────────────────────────
function SiteFormModal({ isOpen, onClose, onSave, editingRow, saving, clients }) {
    const [siteName, setSiteName] = useState("");
    const [clientId, setClientId] = useState("");

    useEffect(() => {
        if (editingRow) {
            setSiteName(editingRow.site_name || "");
            setClientId(editingRow.client_id ? String(editingRow.client_id) : "");
        } else {
            setSiteName("");
            setClientId("");
        }
    }, [editingRow, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!siteName.trim()) {
            toast.error("Site name is required");
            return;
        }
        if (!clientId) {
            toast.error("Please select a client");
            return;
        }
        onSave(siteName.trim(), Number(clientId));
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
                            {editingRow ? "Edit Site" : "Add New Site"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update site details below" : "Fill in the details to add a new site"}
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
                        {/* Client Lookup Dropdown */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Client <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b",
                                    background: "#fff"
                                }}
                                onFocus={e => e.target.style.borderColor = "#253361"}
                                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                            >
                                <option value="">Select a Client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.client_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Site Name Input */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Site Name <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={siteName}
                                onChange={(e) => setSiteName(e.target.value)}
                                placeholder="Enter site name..."
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b"
                                }}
                                onFocus={e => e.target.style.borderColor = "#253361"}
                                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
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
                            disabled={saving || !siteName.trim() || !clientId}
                            style={{
                                padding: "9px 24px", borderRadius: 8, border: "none",
                                background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: saving ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                            }}
                        >
                            {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Site"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Site Master Page Component ──────────────────────────────────────────
export default function SiteMaster() {
    const [sites, setSites] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const [sitesRes, clientsRes] = await Promise.all([
                getSites(),
                getClients()
            ]);
            setSites(sitesRes.data.data || []);
            setClients(clientsRes.data.data || []);
        } catch (err) {
            console.error("Failed to load sites", err);
            setError("Unable to load sites. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
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

    const handleSave = async (siteName, clientId) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateSite(editingRow.id, { siteName, clientId });
                toast.success("Site updated successfully");
            } else {
                await createSite({ siteName, clientId });
                toast.success("Site created successfully");
            }
            handleCloseModal();
            await loadData();
        } catch (err) {
            console.error("Failed to save site", err);
            toast.error(err?.response?.data?.message || "Unable to save site.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this site?")) return;
        setSaving(true);
        try {
            await deleteSite(id);
            toast.success("Site deleted successfully");
            await loadData();
        } catch (err) {
            console.error("Failed to delete site", err);
            toast.error(err?.response?.data?.message || "Unable to delete site.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "70px" },
            {
                key: "site_name",
                label: "Site Name",
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.site_name}</span>
            },
            {
                key: "client_name",
                label: "Client Name",
                render: (row) => (
                    <span style={{
                        fontSize: 12, fontWeight: 600, color: "#253361",
                        background: "#f0f3fa", border: "1px solid #c2d0eb",
                        borderRadius: 6, padding: "3px 8px", display: "inline-block"
                    }}>
                        {row.client_name || "Unknown"}
                    </span>
                )
            }
        ];

        const canUpdate = hasPermission("site_master", "update");
        const canDelete = hasPermission("site_master", "delete");

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
                                title="Edit Site"
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
                                title="Delete Site"
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

            <SiteFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingRow={editingRow}
                saving={saving}
                clients={clients}
            />

            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", padding: "32px 30px" }}>
                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}
                <DataTable
                    tableId="site_master"
                    title="Site Master"
                    data={sites}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search sites or clients..."
                    actionButton={
                        hasPermission("site_master", "write") ? (
                            <button
                                onClick={handleOpenAddModal}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                                title="Add Site"
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
