import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import {
    getRatingScales,
    createRatingScale,
    updateRatingScale,
    deleteRatingScale
} from "../../../api/ratingScaleApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Rating Scale ─────────────────────────
function RatingScaleFormModal({ isOpen, onClose, onSave, editingRow, saving }) {
    const [ratingValue, setRatingValue] = useState(1);
    const [meaning, setMeaning] = useState("");
    const [colorHex, setColorHex] = useState("#3b82f6");

    useEffect(() => {
        if (editingRow) {
            setRatingValue(editingRow.rating_value || 1);
            setMeaning(editingRow.meaning || "");
            setColorHex(editingRow.color_hex || "#3b82f6");
        } else {
            setRatingValue(1);
            setMeaning("");
            setColorHex("#3b82f6");
        }
    }, [editingRow, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const parsedVal = parseInt(ratingValue, 10);
        if (isNaN(parsedVal) || parsedVal < 1 || parsedVal > 5) {
            toast.error("Rating value must be between 1 and 5");
            return;
        }
        if (!meaning.trim()) {
            toast.error("Meaning is required");
            return;
        }
        if (!colorHex.trim()) {
            toast.error("Color Hex is required");
            return;
        }
        onSave(parsedVal, meaning.trim(), colorHex.trim());
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
                            {editingRow ? "Edit Rating Scale" : "Add Rating Scale"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update rating scale details below" : "Fill in details to add a new rating scale"}
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
                        {/* Rating Value */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Rating Value (1 - 5) <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={ratingValue}
                                onChange={(e) => setRatingValue(e.target.value)}
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b",
                                    background: "#fff"
                                }}
                                onFocus={e => e.target.style.borderColor = "#253361"}
                                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                            </select>
                        </div>

                        {/* Meaning */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Meaning <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="text"
                                value={meaning}
                                onChange={(e) => setMeaning(e.target.value)}
                                placeholder="e.g. Poor, Average, Excellent..."
                                style={{
                                    width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                    borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b"
                                }}
                                onFocus={e => e.target.style.borderColor = "#253361"}
                                onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                            />
                        </div>

                        {/* Color Hex */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{
                                display: "block", fontSize: 12, fontWeight: 700,
                                color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8
                            }}>
                                Color Hex <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <input
                                    type="color"
                                    value={colorHex.startsWith('#') && colorHex.length === 7 ? colorHex : "#3b82f6"}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    style={{
                                        width: 44, height: 44, border: "none", borderRadius: 8,
                                        cursor: "pointer", background: "none", padding: 0
                                    }}
                                />
                                <input
                                    type="text"
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    placeholder="#EF4444"
                                    style={{
                                        flex: 1, boxSizing: "border-box", border: "1.5px solid #cbd5e1",
                                        borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b",
                                        fontFamily: "monospace"
                                    }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                />
                            </div>
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
                            disabled={saving || !meaning.trim() || !colorHex.trim()}
                            style={{
                                padding: "9px 24px", borderRadius: 8, border: "none",
                                background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: saving ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                            }}
                        >
                            {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Rating Scale"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Rating Scale Master Page Component ──────────────────────────────────
export default function RatingScaleMaster() {
    const [ratingScales, setRatingScales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadRatingScales = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getRatingScales();
            setRatingScales(response.data.data || []);
        } catch (err) {
            console.error("Failed to load rating scales", err);
            setError("Unable to load rating scales. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRatingScales();
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

    const handleSave = async (ratingValue, meaning, colorHex) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateRatingScale(editingRow.id, { ratingValue, meaning, colorHex });
                toast.success("Rating scale updated successfully");
            } else {
                await createRatingScale({ ratingValue, meaning, colorHex });
                toast.success("Rating scale created successfully");
            }
            handleCloseModal();
            await loadRatingScales();
        } catch (err) {
            console.error("Failed to save rating scale", err);
            toast.error(err?.response?.data?.message || "Unable to save rating scale.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this rating scale?")) return;
        setSaving(true);
        try {
            await deleteRatingScale(id);
            toast.success("Rating scale deleted successfully");
            await loadRatingScales();
        } catch (err) {
            console.error("Failed to delete rating scale", err);
            toast.error(err?.response?.data?.message || "Unable to delete rating scale.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "70px" },
            {
                key: "rating_value",
                label: "Rating Value",
                render: (row) => (
                    <span style={{
                        fontWeight: 700, color: "#1e293b", background: "#f1f5f9",
                        padding: "4px 10px", borderRadius: 6, fontSize: 13
                    }}>
                        {row.rating_value}
                    </span>
                )
            },
            {
                key: "meaning",
                label: "Meaning",
                render: (row) => <span style={{ fontWeight: 600, color: "#334155" }}>{row.meaning}</span>
            },
            {
                key: "color_hex",
                label: "Color Hex",
                render: (row) => (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                            width: 18, height: 18, borderRadius: "50%",
                            background: row.color_hex || "#cbd5e1",
                            boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                            display: "inline-block"
                        }} />
                        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                            {row.color_hex}
                        </span>
                    </div>
                )
            }
        ];

        const canUpdate = hasPermission("rating_scale_master", "update");
        const canDelete = hasPermission("rating_scale_master", "delete");

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
                                title="Edit Rating Scale"
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
                                title="Delete Rating Scale"
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

            <RatingScaleFormModal
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
                    tableId="rating_scale_master"
                    title="Rating Scale Master"
                    data={ratingScales}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search rating scales..."
                    actionButton={
                        hasPermission("rating_scale_master", "write") ? (
                            <button
                                onClick={handleOpenAddModal}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                                title="Add Rating Scale"
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
