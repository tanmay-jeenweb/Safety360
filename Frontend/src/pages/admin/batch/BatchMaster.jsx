import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { getBatches, createBatch, updateBatch, deleteBatch } from "../../../api/batchApi";
import { getClients } from "../../../api/clientApi";
import { getSites } from "../../../api/siteApi";
import { getTrainingModules } from "../../../api/trainingModuleApi";
import { getTrainers } from "../../../api/trainerApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Batch ──────────────────────────────────
function BatchFormModal({ isOpen, onClose, onSave, editingRow, saving, clients, sites, modules, trainers }) {
    const [clientId, setClientId] = useState("");
    const [siteId, setSiteId] = useState("");
    const [trainingModuleId, setTrainingModuleId] = useState("");
    const [trainerId, setTrainerId] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [venue, setVenue] = useState("");
    const [batchSize, setBatchSize] = useState("");

    // Filter sites based on selected client
    const filteredSites = useMemo(() => {
        if (!clientId) return [];
        return sites.filter(s => s.client_id === Number(clientId));
    }, [clientId, sites]);

    useEffect(() => {
        if (editingRow) {
            setClientId(editingRow.client_id || "");
            setSiteId(editingRow.site_id || "");
            setTrainingModuleId(editingRow.training_module_id || "");
            setTrainerId(editingRow.trainer_id || "");
            
            // Format date from YYYY-MM-DDTHH:MM:SS to YYYY-MM-DD
            if (editingRow.scheduled_date) {
                const parsed = new Date(editingRow.scheduled_date);
                const year = parsed.getFullYear();
                const month = String(parsed.getMonth() + 1).padStart(2, '0');
                const date = String(parsed.getDate()).padStart(2, '0');
                setScheduledDate(`${year}-${month}-${date}`);
            } else {
                setScheduledDate("");
            }
            
            setVenue(editingRow.venue || "");
            setBatchSize(editingRow.batch_size || "");
        } else {
            setClientId("");
            setSiteId("");
            setTrainingModuleId("");
            setTrainerId("");
            setScheduledDate("");
            setVenue("");
            setBatchSize("");
        }
    }, [editingRow, isOpen]);

    // Handle Client change: reset siteId since the client changed
    const handleClientChange = (e) => {
        setClientId(e.target.value);
        setSiteId("");
    };

    if (!isOpen) return null;

    const handleSubmit = (targetStatus) => {
        if (!clientId || !siteId || !trainingModuleId || !trainerId || !scheduledDate || !venue || !batchSize) {
            toast.error("All fields are mandatory");
            return;
        }

        onSave({
            clientId: Number(clientId),
            siteId: Number(siteId),
            trainingModuleId: Number(trainingModuleId),
            trainerId: Number(trainerId),
            scheduledDate,
            venue,
            batchSize: Number(batchSize),
            status: targetStatus
        });
    };

    // Show draft save button if we are NOT editing a batch that is already 'Pretest Active'
    const showDraftButton = !editingRow || editingRow.status !== 'Pretest Active';

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
            <div style={{
                background: "#fff", borderRadius: 18, width: "95%", maxWidth: 900, margin: "0 auto",
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
                            {editingRow ? "Edit Batch" : "Add New Batch"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update batch details below" : "Fill in the details to schedule a new training batch"}
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
                <div style={{ padding: "24px", maxHeight: "70vh", overflowY: "auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                        {/* Row 1 Column 1: Client Organization */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Client Organization <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={clientId}
                                onChange={handleClientChange}
                                style={{ width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b", background: "#fff" }}
                            >
                                <option value="">Select Client...</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.client_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 1 Column 2: Site Location */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Site Location <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={siteId}
                                onChange={(e) => setSiteId(e.target.value)}
                                disabled={!clientId}
                                style={{ width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b", background: !clientId ? "#f1f5f9" : "#fff" }}
                            >
                                <option value="">
                                    {!clientId ? "Select a Client first..." : "Select Site Location..."}
                                </option>
                                {filteredSites.map(s => (
                                    <option key={s.id} value={s.id}>{s.site_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 1 Column 3: Training Module */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Training Module <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={trainingModuleId}
                                onChange={(e) => setTrainingModuleId(e.target.value)}
                                style={{ width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b", background: "#fff" }}
                            >
                                <option value="">Select Training Module...</option>
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>{m.module_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2 Column 1: Assigned Trainer */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Assigned Trainer <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <select
                                value={trainerId}
                                onChange={(e) => setTrainerId(e.target.value)}
                                style={{ width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b", background: "#fff" }}
                            >
                                <option value="">Select Trainer...</option>
                                {trainers.map(t => (
                                    <option key={t.id} value={t.id}>{t.trainer_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Row 2 Column 2: Scheduled Date */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Scheduled Date <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b" }}
                            />
                        </div>

                        {/* Row 2 Column 3: Batch Size */}
                        <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Batch Size <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="number"
                                min="1"
                                placeholder="Enter batch size..."
                                value={batchSize}
                                onChange={(e) => setBatchSize(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b" }}
                            />
                        </div>

                        {/* Row 3: Venue (Spans all 3 columns) */}
                        <div style={{ gridColumn: "span 3" }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                Venue <span style={{ color: "#e11d48" }}>*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter venue address or room details..."
                                value={venue}
                                onChange={(e) => setVenue(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 15, outline: "none", color: "#1e293b" }}
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
                    {showDraftButton && (
                        <button
                            type="button"
                            onClick={() => handleSubmit("Draft")}
                            disabled={saving}
                            style={{
                                padding: "9px 20px", borderRadius: 8, border: "1.5px solid #cbd5e1",
                                color: "#253361", background: "#f0f3fa", fontWeight: 600, fontSize: 13, cursor: "pointer"
                            }}
                        >
                            Save as Draft
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleSubmit("Pretest Active")}
                        disabled={saving}
                        style={{
                            padding: "9px 24px", borderRadius: 8, border: "none",
                            background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)", // same brand theme color
                            color: "#fff", fontWeight: 700, fontSize: 13,
                            cursor: saving ? "not-allowed" : "pointer",
                            boxShadow: saving ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                        }}
                    >
                        {saving ? "Saving…" : "Submit & Activate Pretest"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Batch Master Page Component ───────────────────────────────────────────
export default function BatchMaster() {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [clients, setClients] = useState([]);
    const [sites, setSites] = useState([]);
    const [modules, setModules] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadDropdownData = async () => {
        try {
            const [clientsRes, sitesRes, modulesRes, trainersRes] = await Promise.all([
                getClients(),
                getSites(),
                getTrainingModules(),
                getTrainers()
            ]);
            setClients(clientsRes.data.data || []);
            setSites(sitesRes.data.data || []);
            setModules(modulesRes.data.data || []);
            setTrainers(trainersRes.data.data || []);
        } catch (err) {
            console.error("Failed to load drop-down data", err);
        }
    };

    const loadBatches = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getBatches();
            setBatches(response.data.data || []);
        } catch (err) {
            console.error("Failed to load batches", err);
            setError("Unable to load batches. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBatches();
        loadDropdownData();
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

    const handleSave = async (batchData) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateBatch(editingRow.id, batchData);
                toast.success("Batch updated successfully");
            } else {
                await createBatch(batchData);
                toast.success("Batch scheduled successfully");
            }
            handleCloseModal();
            await loadBatches();
        } catch (err) {
            console.error("Failed to save batch", err);
            toast.error(err?.response?.data?.message || "Unable to save batch.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this batch?")) return;
        setSaving(true);
        try {
            await deleteBatch(id);
            toast.success("Batch deleted successfully");
            await loadBatches();
        } catch (err) {
            console.error("Failed to delete batch", err);
            toast.error(err?.response?.data?.message || "Unable to delete batch.");
        } finally {
            setSaving(false);
        }
    };

    const handleManageBatch = (row) => {
        navigate(`/admin/batches/manage/${row.id}`);
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "Batch ID", minWidth: "90px" },
            {
                key: "client_name",
                label: "Client Organization",
                render: (row) => <span style={{ fontWeight: 600, color: "#334155" }}>{row.client_name}</span>
            },
            {
                key: "site_name",
                label: "Site Location",
                render: (row) => <span style={{ color: "#475569" }}>{row.site_name}</span>
            },
            {
                key: "module_name",
                label: "Training Module",
                render: (row) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.module_name}</span>
            },
            {
                key: "trainer_name",
                label: "Trainer",
                render: (row) => <span style={{ color: "#475569" }}>{row.trainer_name}</span>
            },
            {
                key: "scheduled_date",
                label: "Scheduled Date",
                render: (row) => {
                    if (!row.scheduled_date) return "—";
                    return new Date(row.scheduled_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                }
            },
            { key: "venue", label: "Venue" },
            { key: "batch_size", label: "Size" },
            {
                key: "status",
                label: "Status",
                render: (row) => (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        row.status === 'Pretest Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                        {row.status}
                    </span>
                )
            }
        ];

        const canUpdate = hasPermission("batch_master", "update");
        const canDelete = hasPermission("batch_master", "delete");

        // We will show actions column if update/delete are allowed, or for the view eye icon
        cols.push({
            key: "actions",
            label: "Actions",
            sortable: false,
            minWidth: "160px",
            render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Manage Button */}
                    <button
                        onClick={() => handleManageBatch(row)}
                        style={{
                            display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                            borderRadius: 8, border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", cursor: "pointer"
                        }}
                        title="Manage Batch"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>
                    {canUpdate && (
                        <button
                            onClick={() => handleOpenEditModal(row)}
                            style={{
                                display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                            }}
                            title="Edit Batch"
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
                            title="Delete Batch"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        });

        return cols;
    }, [hasPermission]);

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar title="Safety360 Admin" />

            <BatchFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingRow={editingRow}
                saving={saving}
                clients={clients}
                sites={sites}
                modules={modules}
                trainers={trainers}
            />

            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", padding: "32px 30px" }}>
                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}
                <DataTable
                    tableId="batch_master"
                    title="Batch Master"
                    data={batches}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search batches..."
                    actionButton={
                        hasPermission("batch_master", "write") ? (
                            <button
                                onClick={handleOpenAddModal}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                                title="Add Batch"
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
