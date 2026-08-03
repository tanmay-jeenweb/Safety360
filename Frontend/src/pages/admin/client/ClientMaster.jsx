import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getClients, createClient, updateClient, deleteClient } from "../../../api/clientApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Full Page Form Component for Add & Edit Client ──────────────────────────────
function ClientForm({ onBack, onSave, editingRow, saving }) {
    const [clientName, setClientName] = useState("");
    const [address, setAddress] = useState("");
    const [representatives, setRepresentatives] = useState([{ name: "", email: "", phoneNo: "" }]);
    const [workOrderNo, setWorkOrderNo] = useState("");
    const [workOrderDate, setWorkOrderDate] = useState("");

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (editingRow) {
            setClientName(editingRow.client_name || "");
            setAddress(editingRow.address || "");
            setRepresentatives(editingRow.representatives || []);
            setWorkOrderNo(editingRow.work_order_no || "");
            setWorkOrderDate(editingRow.work_order_date ? formatDate(editingRow.work_order_date) : "");
        } else {
            setClientName("");
            setAddress("");
            setRepresentatives([{ name: "", email: "", phoneNo: "" }]);
            setWorkOrderNo("");
            setWorkOrderDate("");
        }
    }, [editingRow]);

    const handleAddRep = () => {
        setRepresentatives([...representatives, { name: "", email: "", phoneNo: "" }]);
    };

    const handleRemoveRep = (index) => {
        setRepresentatives(representatives.filter((_, i) => i !== index));
    };

    const handleRepChange = (index, field, value) => {
        const updated = [...representatives];
        updated[index] = { ...updated[index], [field]: value };
        setRepresentatives(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!clientName.trim()) {
            toast.error("Client name is required");
            return;
        }

        // Validate representatives
        for (let i = 0; i < representatives.length; i++) {
            if (!representatives[i].name || !representatives[i].name.trim()) {
                toast.error(`Name is required for Representative #${i + 1}`);
                return;
            }
        }

        onSave({
            clientName: clientName.trim(),
            address: address.trim(),
            representatives,
            workOrderNo: workOrderNo.trim(),
            workOrderDate: workOrderDate || null
        });
    };

    return (
        <div className="w-full mx-auto">
            {/* Header / Back Action */}
            <div className="flex items-center justify-between mb-7">
                <div>
                    <h2 className="m-0 text-[24px] font-extrabold text-[#1e293b]">
                        {editingRow ? "Edit Client Details" : "Add New Client"}
                    </h2>
                    <p className="mt-1 text-[14px] text-[#64748b]">
                        {editingRow ? "Modify client details and representatives" : "Provide information to onboard a new client"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-[#64748b] bg-transparent border-none cursor-pointer text-[14px] font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[16px] h-[16px]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Clients
                </button>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="bg-white border border-[#e2e8f0] rounded-[16px] overflow-hidden shadow-sm">
                <div className="p-8">
                    {/* General Details */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-2">
                                Client Name <span className="text-[#e11d48]">*</span>
                            </label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Enter client name..."
                                className="w-full border-[1.5px] border-[#cbd5e1] rounded-[9px] px-3.5 py-[11px] text-[15px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-2">Client Address</label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter client address..."
                                rows={2}
                                className="w-full border-[1.5px] border-[#cbd5e1] rounded-[9px] px-3.5 py-[11px] text-[15px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361] resize-y font-inherit"
                            />
                        </div>
                    </div>

                    {/* Work Order Details */}
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div>
                            <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-2">Work Order No.</label>
                            <input
                                type="text"
                                value={workOrderNo}
                                onChange={(e) => setWorkOrderNo(e.target.value)}
                                placeholder="Enter work order number..."
                                className="w-full border-[1.5px] border-[#cbd5e1] rounded-[9px] px-3.5 py-[11px] text-[15px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                            />
                        </div>
                        <div>
                            <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-2">Work Order Date</label>
                            <input
                                type="date"
                                value={workOrderDate}
                                onChange={(e) => setWorkOrderDate(e.target.value)}
                                className="w-full border-[1.5px] border-[#cbd5e1] rounded-[9px] px-3.5 py-[11px] text-[15px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                            />
                        </div>
                    </div>

                    {/* Representatives Table Section */}
                    <div className="border-t border-[#e2e8f0] pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="m-0 text-[16px] font-bold text-[#1e293b]">Representatives List</h3>
                                <p className="mt-0.5 text-[12px] text-[#64748b]">Manage contact representatives for this client</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddRep}
                                className="bg-gradient-to-br from-[#253361] to-[#1a2446] text-white border-none rounded-[8px] px-4 py-2 text-[13px] font-semibold cursor-pointer flex items-center gap-1.5 shadow-[0_2px_4px_rgba(37,51,97,0.2)]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[14px] h-[14px]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Representative
                            </button>
                        </div>

                        {representatives.length === 0 ? (
                            <div className="p-8 border-2 border-dashed border-[#cbd5e1] rounded-[12px] text-center text-[#64748b] text-[14px]">
                                No representatives added yet. Click "Add Representative" to include one.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
                                            <th className="text-left px-4 py-3 text-[12px] font-bold text-[#475569] uppercase">Name <span className="text-[#e11d48]">*</span></th>
                                            <th className="text-left px-4 py-3 text-[12px] font-bold text-[#475569] uppercase">Email</th>
                                            <th className="text-left px-4 py-3 text-[12px] font-bold text-[#475569] uppercase">Phone Number</th>
                                            <th className="text-center px-4 py-3 text-[12px] font-bold text-[#475569] uppercase w-[80px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {representatives.map((rep, idx) => (
                                            <tr key={idx} className="border-b border-[#f1f5f9]">
                                                <td className="px-2 py-3">
                                                    <input
                                                        type="text"
                                                        value={rep.name}
                                                        onChange={(e) => handleRepChange(idx, "name", e.target.value)}
                                                        placeholder="Representative Name *"
                                                        className="w-full border border-[#cbd5e1] rounded-[6px] px-3 py-2 text-[14px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input
                                                        type="email"
                                                        value={rep.email}
                                                        onChange={(e) => handleRepChange(idx, "email", e.target.value)}
                                                        placeholder="Email Address"
                                                        className="w-full border border-[#cbd5e1] rounded-[6px] px-3 py-2 text-[14px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                                                    />
                                                </td>
                                                <td className="px-2 py-3">
                                                    <input
                                                        type="text"
                                                        value={rep.phoneNo}
                                                        onChange={(e) => handleRepChange(idx, "phoneNo", e.target.value)}
                                                        placeholder="Phone Number"
                                                        className="w-full border border-[#cbd5e1] rounded-[6px] px-3 py-2 text-[14px] outline-none text-[#1e293b] bg-white transition-colors duration-200 focus:border-[#253361]"
                                                    />
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRep(idx)}
                                                        className="bg-[#fff1f2] border border-[#fecdd3] rounded-[8px] w-[34px] h-[34px] cursor-pointer inline-flex items-center justify-center text-[#be123c] hover:bg-[#ffe4e6] transition-colors"
                                                        title="Delete Row"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[16px] h-[16px]">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-8 py-5 border-t border-[#f1f5f9] flex justify-end gap-4 bg-[#fafafa]">
                    <button
                        type="button"
                        onClick={onBack}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-[8px] border-[1.5px] border-[#cbd5e1] text-[#475569] bg-white font-semibold text-[14px] cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !clientName.trim()}
                        className={`px-8 py-2.5 rounded-[8px] border-none text-white font-bold text-[14px] transition-all ${saving ? 'bg-[#94a3b8] cursor-not-allowed' : 'bg-gradient-to-br from-[#253361] to-[#1a2446] cursor-pointer shadow-[0_4px_12px_rgba(37,51,97,0.3)]'}`}
                    >
                        {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Client"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ─── Main Client Master Page Component ──────────────────────────────────────────
export default function ClientMaster() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);

    const { hasPermission } = usePermission();

    const loadClients = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getClients();
            setClients(response.data.data || []);
        } catch (err) {
            console.error("Failed to load clients", err);
            setError("Unable to load clients. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const handleOpenAddForm = () => {
        setEditingRow(null);
        setIsFormOpen(true);
    };

    const handleOpenEditForm = (row) => {
        setEditingRow(row);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingRow(null);
    };

    const handleSave = async (data) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateClient(editingRow.id, data);
                toast.success("Client updated successfully");
            } else {
                await createClient(data);
                toast.success("Client created successfully");
            }
            handleCloseForm();
            await loadClients();
        } catch (err) {
            console.error("Failed to save client", err);
            toast.error(err?.response?.data?.message || "Unable to save client.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this client?")) return;
        setSaving(true);
        try {
            await deleteClient(id);
            toast.success("Client deleted successfully");
            await loadClients();
        } catch (err) {
            console.error("Failed to delete client", err);
            toast.error(err?.response?.data?.message || "Unable to delete client.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "70px" },
            {
                key: "client_name",
                label: "Client Name",
                render: (row) => <span className="font-bold text-[#1e293b]">{row.client_name}</span>
            },
            {
                key: "address",
                label: "Address",
                render: (row) => <span className="text-[#475569]">{row.address || "-"}</span>
            },
            {
                key: "work_order_no",
                label: "Work Order No.",
                render: (row) => <span className="font-semibold text-[#334155]">{row.work_order_no || "-"}</span>
            },
            {
                key: "work_order_date",
                label: "Work Order Date",
                render: (row) => <span className="text-[#475569]">{row.work_order_date ? new Date(row.work_order_date).toLocaleDateString() : "-"}</span>
            },
            {
                key: "representatives",
                label: "Representatives",
                minWidth: "200px",
                render: (row) => {
                    const reps = row.representatives || [];
                    if (reps.length === 0) return <span className="text-[#94a3b8]">-</span>;
                    const namesStr = reps.map(rep => rep.name).filter(Boolean).join(", ");
                    return <span className="text-[#475569] font-medium">{namesStr || "-"}</span>;
                }
            }
        ];

        const canUpdate = hasPermission("client_master", "update");
        const canDelete = hasPermission("client_master", "delete");

        if (canUpdate || canDelete) {
            cols.push({
                key: "actions",
                label: "Actions",
                sortable: false,
                minWidth: "120px",
                render: (row) => (
                    <div className="flex items-center gap-2">
                        {canUpdate && (
                            <button
                                onClick={() => handleOpenEditForm(row)}
                                className="flex w-8 h-8 items-center justify-center rounded-[8px] border border-[#c2d0eb] bg-[#f0f3fa] text-[#253361] cursor-pointer hover:bg-[#e2e8f4] transition-colors"
                                title="Edit Client"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[15px] h-[15px]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
                                </svg>
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(row.id)}
                                className="flex w-8 h-8 items-center justify-center rounded-[8px] border border-[#fecdd3] bg-[#fff1f2] text-[#be123c] cursor-pointer hover:bg-[#ffe4e6] transition-colors"
                                title="Delete Client"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[15px] h-[15px]">
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
        <div className="flex flex-col flex-1 min-h-screen bg-[#f8fafc] font-sans">
            <Navbar title="CRM Admin" />

            <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto py-8 px-7">
                {error && (
                    <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] px-4 py-3 rounded-[10px] mb-5 text-[14px] font-medium">
                        {error}
                    </div>
                )}
                
                {isFormOpen ? (
                    <ClientForm
                        onBack={handleCloseForm}
                        onSave={handleSave}
                        editingRow={editingRow}
                        saving={saving}
                    />
                ) : (
                    <DataTable
                        tableId="client_master"
                        title="Client Master"
                        data={clients}
                        columns={columns}
                        loading={loading}
                        searchPlaceholder="Search clients..."
                        actionButton={
                            hasPermission("client_master", "write") ? (
                                <button
                                    onClick={handleOpenAddForm}
                                    className="flex w-10 h-10 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#253361] to-[#1a2446] text-white border-none cursor-pointer shadow-[0_2px_8px_rgba(37,51,97,0.35)]"
                                    title="Add Client"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                </button>
                            ) : null
                        }
                    />
                )}
            </main>
        </div>
    );
}
