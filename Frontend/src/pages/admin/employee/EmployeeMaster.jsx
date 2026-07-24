import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../../api/employeeApi";
import { getDepartments } from "../../../api/departmentApi";
import { getClients } from "../../../api/clientApi";
import { getSites } from "../../../api/siteApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Employee ──────────────────────────────
function EmployeeFormModal({ isOpen, onClose, onSave, editingRow, saving, departments, clients, sites }) {
    const [employeeCode, setEmployeeCode] = useState("");
    const [fullName, setFullName] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [designation, setDesignation] = useState("");
    const [employeeType, setEmployeeType] = useState("Direct");
    const [contractorName, setContractorName] = useState("");
    const [clientId, setClientId] = useState("");
    const [siteId, setSiteId] = useState("");

    // Filter sites based on selected client
    const filteredSites = useMemo(() => {
        if (!clientId) return [];
        return sites.filter(s => String(s.client_id) === String(clientId));
    }, [sites, clientId]);

    useEffect(() => {
        if (editingRow) {
            setEmployeeCode(editingRow.employee_code || "");
            setFullName(editingRow.full_name || "");
            setDepartmentId(editingRow.department_id || "");
            setDesignation(editingRow.designation || "");
            setEmployeeType(editingRow.employee_type || "Direct");
            setContractorName(editingRow.contractor_name || "");
            setClientId(editingRow.client_id || "");
            setSiteId(editingRow.site_id || "");
        } else {
            setEmployeeCode("");
            setFullName("");
            setDepartmentId("");
            setDesignation("");
            setEmployeeType("Direct");
            setContractorName("");
            setClientId("");
            setSiteId("");
        }
    }, [editingRow, isOpen]);

    // Handle Client Change and auto-reset Site if no longer valid
    const handleClientChange = (e) => {
        const newClientId = e.target.value;
        setClientId(newClientId);
        setSiteId(""); // reset site when client changes
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!employeeCode.trim()) {
            toast.error("Employee Code is required");
            return;
        }
        if (!fullName.trim()) {
            toast.error("Full Name is required");
            return;
        }
        if (!departmentId) {
            toast.error("Please select a Department");
            return;
        }
        if (!designation.trim()) {
            toast.error("Designation is required");
            return;
        }
        if (employeeType === "Contractor" && !contractorName.trim()) {
            toast.error("Contractor Name is required when Employee Type is Contractor");
            return;
        }
        if (!clientId) {
            toast.error("Please select a Client");
            return;
        }
        if (!siteId) {
            toast.error("Please select a Site");
            return;
        }

        onSave({
            employeeCode: employeeCode.trim(),
            fullName: fullName.trim(),
            departmentId,
            designation: designation.trim(),
            employeeType,
            contractorName: employeeType === "Contractor" ? contractorName.trim() : null,
            clientId,
            siteId
        });
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
            <div style={{
                background: "#fff", borderRadius: 18, width: "100%", maxWidth: 650, margin: "0 auto",
                boxShadow: "0 25px 60px rgba(0,0,0,0.2)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column"
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: "20px 24px", borderBottom: "1px solid #f1f5f9",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "linear-gradient(135deg, #253361, #1a2446)"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>
                            {editingRow ? "Edit Employee / Participant" : "Add New Employee / Participant"}
                        </h2>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#d9e2ec" }}>
                            {editingRow ? "Update participant details below" : "Fill in details to register a new employee or participant"}
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

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                    <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            
                            {/* Employee Code */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Employee Code <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    placeholder="e.g. EMP-001"
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Full Name <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter full name..."
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                />
                            </div>

                            {/* Department Lookup */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Department <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                >
                                    <option value="">-- Select Department --</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.department_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Designation */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Designation <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    placeholder="e.g. Executive Engineer"
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                />
                            </div>

                            {/* Employee Type (Direct / Contractor Select) */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Employee Type <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <select
                                    value={employeeType}
                                    onChange={(e) => setEmployeeType(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                >
                                    <option value="Direct">Direct</option>
                                    <option value="Contractor">Contractor</option>
                                </select>
                            </div>

                            {/* Contractor Name (Conditional) */}
                            {employeeType === "Contractor" && (
                                <div style={{ gridColumn: "span 2" }}>
                                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                        Contractor Name <span style={{ color: "#e11d48" }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={contractorName}
                                        onChange={(e) => setContractorName(e.target.value)}
                                        placeholder="Enter contractor name..."
                                        style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                        onFocus={e => e.target.style.borderColor = "#253361"}
                                        onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        required
                                    />
                                </div>
                            )}

                            {/* Client Lookup */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Client <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <select
                                    value={clientId}
                                    onChange={handleClientChange}
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                >
                                    <option value="">-- Select Client --</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.client_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Site Lookup */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Site <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <select
                                    value={siteId}
                                    onChange={(e) => setSiteId(e.target.value)}
                                    style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                    onFocus={e => e.target.style.borderColor = "#253361"}
                                    onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                    required
                                >
                                    <option value="">-- Select Site --</option>
                                    {filteredSites.map(s => (
                                        <option key={s.id} value={s.id}>{s.site_name}</option>
                                    ))}
                                </select>
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
                            disabled={saving}
                            style={{
                                padding: "9px 24px", borderRadius: 8, border: "none",
                                background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                color: "#fff", fontWeight: 700, fontSize: 13,
                                cursor: saving ? "not-allowed" : "pointer",
                                boxShadow: saving ? "none" : "0 2px 8px rgba(37,51,97,0.35)"
                            }}
                        >
                            {saving ? "Saving…" : editingRow ? "Save Changes" : "Create Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Main Employee Master Page Component ───────────────────────────────────────
export default function EmployeeMaster() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [clients, setClients] = useState([]);
    const [sites, setSites] = useState([]);
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
            const [empRes, deptRes, clientRes, siteRes] = await Promise.all([
                getEmployees(),
                getDepartments(),
                getClients(),
                getSites()
            ]);
            setEmployees(empRes.data.data || []);
            setDepartments(deptRes.data.data || []);
            setClients(clientRes.data.data || []);
            setSites(siteRes.data.data || []);
        } catch (err) {
            console.error("Failed to load employee master data", err);
            setError("Unable to load data. Please try again.");
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

    const handleSave = async (data) => {
        setSaving(true);
        try {
            if (editingRow) {
                await updateEmployee(editingRow.id, data);
                toast.success("Employee updated successfully");
            } else {
                await createEmployee(data);
                toast.success("Employee created successfully");
            }
            handleCloseModal();
            await loadData();
        } catch (err) {
            console.error("Failed to save employee", err);
            toast.error(err?.response?.data?.message || "Unable to save employee.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this employee?")) return;
        setSaving(true);
        try {
            await deleteEmployee(id);
            toast.success("Employee deleted successfully");
            await loadData();
        } catch (err) {
            console.error("Failed to delete employee", err);
            toast.error(err?.response?.data?.message || "Unable to delete employee.");
        } finally {
            setSaving(false);
        }
    };

    const columns = useMemo(() => {
        const cols = [
            { key: "id", label: "ID", minWidth: "60px" },
            {
                key: "employee_code",
                label: "Emp Code",
                render: (row) => <span style={{ fontWeight: 700, color: "#253361" }}>{row.employee_code}</span>
            },
            {
                key: "full_name",
                label: "Full Name",
                render: (row) => <span style={{ fontWeight: 700, color: "#1e293b" }}>{row.full_name}</span>
            },
            {
                key: "department_name",
                label: "Department",
                render: (row) => (
                    <span style={{ background: "#f0f3fa", color: "#253361", fontWeight: 600, padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>
                        {row.department_name}
                    </span>
                )
            },
            {
                key: "designation",
                label: "Designation",
                render: (row) => <span style={{ fontWeight: 600, color: "#475569" }}>{row.designation}</span>
            },
            {
                key: "employee_type",
                label: "Employee Type",
                render: (row) => (
                    <span style={{
                        color: row.employee_type === 'Contractor' ? '#b45309' : '#15803d',
                        background: row.employee_type === 'Contractor' ? '#fffbeb' : '#f0fdf4',
                        border: row.employee_type === 'Contractor' ? '1px solid #fde68a' : '1px solid #bbf7d0',
                        fontWeight: 600, padding: "2px 8px", borderRadius: 6, fontSize: 12
                    }}>
                        {row.employee_type}
                    </span>
                )
            },
            {
                key: "contractor_name",
                label: "Contractor Name",
                render: (row) => <span>{row.contractor_name || "-"}</span>
            },
            {
                key: "client_name",
                label: "Client",
                render: (row) => <span>{row.client_name}</span>
            },
            {
                key: "site_name",
                label: "Site",
                render: (row) => <span>{row.site_name}</span>
            }
        ];

        const canUpdate = hasPermission("employee_master", "update");
        const canDelete = hasPermission("employee_master", "delete");

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
                                title="Edit Employee"
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
                                title="Delete Employee"
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

            <EmployeeFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                editingRow={editingRow}
                saving={saving}
                departments={departments}
                clients={clients}
                sites={sites}
            />

            <main style={{ flex: 1, display: "flex", flexDirection: "column", width: "100%", margin: "0 auto", padding: "32px 30px" }}>
                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}
                <DataTable
                    tableId="employee_master"
                    title="Employee / Participant Master"
                    data={employees}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search employees, designation, type..."
                    actionButton={
                        hasPermission("employee_master", "write") ? (
                            <button
                                onClick={handleOpenAddModal}
                                style={{
                                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)"
                                }}
                                title="Add Employee"
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
