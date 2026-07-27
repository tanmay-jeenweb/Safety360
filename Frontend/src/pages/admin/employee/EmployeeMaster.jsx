import { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "../../../components/Navbar";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployees } from "../../../api/employeeApi";
import { getDepartments } from "../../../api/departmentApi";
import { getClients } from "../../../api/clientApi";
import { getSites } from "../../../api/siteApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { usePermission } from "../../../context/PermissionContext";

// ─── Modal Form Component for Add & Edit Employee ──────────────────────────────
function EmployeeFormModal({ isOpen, onClose, onSave, editingRow, saving, departments, clients, sites }) {
    const [employeeCode, setEmployeeCode] = useState("");
    const [fullName, setFullName] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [designation, setDesignation] = useState("");
    const [employeeType, setEmployeeType] = useState("Direct");
    const [contractorName, setContractorName] = useState("");
    const [phoneNo, setPhoneNo] = useState("");
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
            setPhoneNo(editingRow.phone_no || "");
            setClientId(editingRow.client_id || "");
            setSiteId(editingRow.site_id || "");
        } else {
            setEmployeeCode("");
            setFullName("");
            setDepartmentId("");
            setDesignation("");
            setEmployeeType("Direct");
            setContractorName("");
            setPhoneNo("");
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
        if (!phoneNo.trim()) {
            toast.error("Phone Number is required");
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
            phoneNo: phoneNo.trim(),
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

                            {/* Phone Number */}
                            <div>
                                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                                    Phone Number <span style={{ color: "#e11d48" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={phoneNo}
                                    onChange={(e) => setPhoneNo(e.target.value)}
                                    placeholder="Enter phone number..."
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
    const fileInputRef = useRef(null);

    const handleExportTemplate = async () => {
        try {
            const ExcelJS = await import("exceljs");
            const workbook = new ExcelJS.Workbook();
            
            // Sheet 1: Template
            const worksheet = workbook.addWorksheet("Template", {
                views: [{ showGridLines: true }]
            });
            
            // Sheet 2: Lists (Lookup lists for dropdowns)
            const listsSheet = workbook.addWorksheet("Lists", {
                views: [{ showGridLines: true }]
            });
            // Hide the lists sheet so it doesn't clutter the workbook
            listsSheet.state = "hidden";

            // Headers for Template
            const headers = [
                "Employee Code",
                "Full Name",
                "Department",
                "Designation",
                "Employee Type",
                "Contractor Name",
                "Phone Number",
                "Client",
                "Site"
            ];
            
            worksheet.addRow(headers);
            
            // Format Template Header Row
            const headerRow = worksheet.getRow(1);
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF253361" } // Dark blue theme
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
            });

            // Populate Lists sheet with values
            const deptNames = departments.map(d => d.department_name).filter(Boolean);
            const empTypes = ["Direct", "Contractor"];
            const clientNames = clients.map(c => c.client_name).filter(Boolean);
            const siteNames = sites.map(s => s.site_name).filter(Boolean);

            // Find maximum length of list columns to write rows safely
            const maxListLength = Math.max(deptNames.length, empTypes.length, clientNames.length, siteNames.length);
            
            // Add header for list sheet columns
            listsSheet.addRow(["Departments", "EmployeeTypes", "Clients", "Sites"]);
            
            for (let i = 0; i < maxListLength; i++) {
                listsSheet.addRow([
                    deptNames[i] || "",
                    empTypes[i] || "",
                    clientNames[i] || "",
                    siteNames[i] || ""
                ]);
            }

            // Ranges for validations in Excel notation (1-indexed, starting from row 2)
            const deptRange = `Lists!$A$2:$A$${deptNames.length + 1}`;
            const typeRange = `Lists!$B$2:$B$3`;
            const clientRange = `Lists!$C$2:$C$${clientNames.length + 1}`;
            const siteRange = `Lists!$D$2:$D$${siteNames.length + 1}`;



            // Apply data validations to the entire columns (rows 2 to 10000) using ExcelJS dataValidations
            worksheet.dataValidations.add("C2:C10000", {
                type: "list",
                allowBlank: true,
                formulae: [deptRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select a department from the dropdown list."
            });

            worksheet.dataValidations.add("E2:E10000", {
                type: "list",
                allowBlank: true,
                formulae: [typeRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select Direct or Contractor."
            });

            worksheet.dataValidations.add("H2:H10000", {
                type: "list",
                allowBlank: true,
                formulae: [clientRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select a client from the dropdown list."
            });

            worksheet.dataValidations.add("I2:I10000", {
                type: "list",
                allowBlank: true,
                formulae: [siteRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select a site from the dropdown list."
            });

            // Adjust column widths
            worksheet.columns.forEach((column, index) => {
                const headerText = headers[index];
                column.width = Math.max(headerText.length + 5, 18);
            });

            // Write Buffer and trigger download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "Employee_Import_Template.xlsx";
            anchor.click();
            window.URL.revokeObjectURL(url);

            toast.success("Excel template with dropdowns exported successfully!");
        } catch (err) {
            console.error("Failed to export Excel template:", err);
            toast.error("Failed to export Excel template. Please try again.");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                const dataBuffer = evt.target.result;
                const workbook = XLSX.read(dataBuffer, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast.error("The selected file is empty.");
                    setLoading(false);
                    return;
                }

                const firstRow = jsonData[0];
                const keys = Object.keys(firstRow);

                const getVal = (row, fieldOptions) => {
                    const foundKey = keys.find(k => fieldOptions.includes(k.toLowerCase().trim()));
                    return foundKey ? row[foundKey] : null;
                };

                const mappedRecords = jsonData.map((row) => {
                    const empCode = getVal(row, ["employee code", "employee_code", "code", "emp code"]);
                    const fullName = getVal(row, ["full name", "full_name", "name", "employee name"]);
                    const departmentName = getVal(row, ["department", "department_name", "dept"]);
                    const designation = getVal(row, ["designation", "role"]);
                    const employeeType = getVal(row, ["employee type", "employee_type", "type"]) || "Direct";
                    const contractorName = getVal(row, ["contractor name", "contractor_name", "contractor"]);
                    const phoneNo = getVal(row, ["phone number", "phone_no", "phone", "phone no", "phone no."]);
                    const clientName = getVal(row, ["client", "client_name", "client_id"]);
                    const siteName = getVal(row, ["site", "site_name", "site_id"]);

                    return {
                        employeeCode: empCode ? String(empCode).trim() : null,
                        fullName: fullName ? String(fullName).trim() : null,
                        departmentName: departmentName ? String(departmentName).trim() : null,
                        designation: designation ? String(designation).trim() : null,
                        employeeType: employeeType ? String(employeeType).trim() : "Direct",
                        contractorName: contractorName ? String(contractorName).trim() : null,
                        phoneNo: phoneNo ? String(phoneNo).trim() : null,
                        clientName: clientName ? String(clientName).trim() : null,
                        siteName: siteName ? String(siteName).trim() : null
                    };
                }).filter(r => r.employeeCode);

                if (mappedRecords.length === 0) {
                    toast.error("No valid records with Employee Code found.");
                    setLoading(false);
                    return;
                }

                const importRes = await importEmployees(mappedRecords);
                if (importRes.data.success) {
                    toast.success(importRes.data.message || `Successfully processed ${mappedRecords.length} records.`);
                    await loadData();
                } else {
                    toast.error(importRes.data.message || "Failed to import records.");
                }
            } catch (err) {
                console.error("Error reading/importing Excel:", err);
                toast.error(err?.response?.data?.message || err.message || "Failed to process import file.");
            } finally {
                setLoading(false);
                if (e.target) e.target.value = "";
            }
        };

        reader.onerror = () => {
            toast.error("Failed to read the file.");
            setLoading(false);
        };

        reader.readAsArrayBuffer(file);
    };

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
                key: "phone_no",
                label: "Phone No.",
                render: (row) => <span style={{ fontWeight: 600, color: "#1e293b" }}>{row.phone_no || "—"}</span>
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

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    style={{ display: "none" }} 
                    accept=".xlsx, .xls" 
                />

                <DataTable
                    tableId="employee_master"
                    title="Employee / Participant Master"
                    data={employees}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search employees, designation, type..."
                    actionButton={
                        hasPermission("employee_master", "write") ? (
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    onClick={handleExportTemplate}
                                    style={{
                                        display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                        borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#253361", cursor: "pointer",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                    }}
                                    title="Export Excel Template"
                                >
                                    <i className="fa-solid fa-file-export" style={{ fontSize: 14 }}></i>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                                        borderRadius: 9, border: "1px solid #cbd5e1", background: "#fff", color: "#253361", cursor: "pointer",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                    }}
                                    title="Import Excel File"
                                >
                                    <i className="fa-solid fa-file-import" style={{ fontSize: 14 }}></i>
                                </button>
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
                            </div>
                        ) : null
                    }
                />
            </main>
        </div>
    );
}
