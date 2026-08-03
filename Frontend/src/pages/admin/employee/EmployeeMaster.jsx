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
    const [email, setEmail] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [clientId, setClientId] = useState("");
    const [siteId, setSiteId] = useState("");

    // Filter sites based on selected client
    const filteredSites = useMemo(() => {
        if (!clientId) return [];
        return sites.filter(s => String(s.client_id) === String(clientId));
    }, [sites, clientId]);

    const formatForInput = (dateStr) => {
        if (!dateStr) return "";
        return dateStr.substring(0, 10);
    };

    useEffect(() => {
        if (editingRow) {
            setEmployeeCode(editingRow.employee_code || "");
            setFullName(editingRow.full_name || "");
            setDepartmentId(editingRow.department_id || "");
            setDesignation(editingRow.designation || "");
            setEmployeeType(editingRow.employee_type || "Direct");
            setContractorName(editingRow.contractor_name || "");
            setPhoneNo(editingRow.phone_no || "");
            setEmail(editingRow.email || "");
            setJoiningDate(formatForInput(editingRow.joining_date));
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
            setEmail("");
            setJoiningDate("");
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
        if (!phoneNo.trim()) {
            toast.error("Phone Number is required");
            return;
        }
        if (!email.trim()) {
            toast.error("Email is required");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            toast.error("Please enter a valid email address");
            return;
        }
        if (!joiningDate) {
            toast.error("Joining Date is required");
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
            phoneNo: phoneNo.trim(),
            email: email.trim(),
            joiningDate,
            clientId,
            siteId
        });
    };

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center p-4">
            <div className="bg-white rounded-[18px] w-full max-w-[650px] mx-auto shadow-[0_25px_60px_rgba(0,0,0,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="py-5 px-6 border-b border-[#f1f5f9] flex items-center justify-between bg-gradient-to-br from-[#253361] to-[#1a2446]">
                    <div>
                        <h2 className="m-0 text-[18px] font-bold text-white">
                            {editingRow ? "Edit Employee / Participant" : "Add New Employee / Participant"}
                        </h2>
                        <p className="mt-1 text-[13px] text-[#d9e2ec]">
                            {editingRow ? "Update participant details below" : "Fill in details to register a new employee or participant"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-white/15 border-none rounded-lg w-[34px] h-[34px] cursor-pointer flex items-center justify-center text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Body (Scrollable) */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="grid grid-cols-2 gap-4">
                            
                            {/* Employee Code */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Employee Code <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={employeeCode}
                                    onChange={(e) => setEmployeeCode(e.target.value)}
                                    placeholder="e.g. EMP-001"
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Full Name <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter full name..."
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Department Lookup */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Department <span className="text-[#e11d48]">*</span>
                                </label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
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
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Designation <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={designation}
                                    onChange={(e) => setDesignation(e.target.value)}
                                    placeholder="e.g. Executive Engineer"
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Phone Number <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={phoneNo}
                                    onChange={(e) => setPhoneNo(e.target.value)}
                                    placeholder="Enter phone number..."
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Email <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. employee@company.com"
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Joining Date */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Joining Date <span className="text-[#e11d48]">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={joiningDate}
                                    onChange={(e) => setJoiningDate(e.target.value)}
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                    required
                                />
                            </div>

                            {/* Employee Type (Direct / Contractor Select) */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Employee Type <span className="text-[#e11d48]">*</span>
                                </label>
                                <select
                                    value={employeeType}
                                    onChange={(e) => setEmployeeType(e.target.value)}
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
                                    required
                                >
                                    <option value="Direct">Direct</option>
                                    <option value="Contractor">Contractor</option>
                                </select>
                            </div>

                            {/* Contractor Name (Conditional) */}
                            {employeeType === "Contractor" && (
                                <div className="col-span-2">
                                    <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                        Contractor Name <span className="text-[#e11d48]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={contractorName}
                                        onChange={(e) => setContractorName(e.target.value)}
                                        placeholder="Enter contractor name..."
                                        className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
                                        required
                                    />
                                </div>
                            )}

                            {/* Client Lookup */}
                            <div>
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Client <span className="text-[#e11d48]">*</span>
                                </label>
                                <select
                                    value={clientId}
                                    onChange={handleClientChange}
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
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
                                <label className="block text-[12px] font-bold text-[#475569] uppercase tracking-[0.05em] mb-1.5">
                                    Site <span className="text-[#e11d48]">*</span>
                                </label>
                                <select
                                    value={siteId}
                                    onChange={(e) => setSiteId(e.target.value)}
                                    className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-2.5 px-3 text-[14px] outline-none text-[#1e293b] bg-white focus:border-[#253361] transition-colors duration-200"
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
                    <div className="py-4 px-6 border-t border-[#f1f5f9] flex justify-end gap-3 bg-[#fafafa]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="py-[9px] px-5 rounded-lg border-[1.5px] border-[#cbd5e1] text-[#475569] bg-white font-semibold text-[13px] cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`py-[9px] px-6 rounded-lg border-none text-white font-bold text-[13px] ${
                                saving
                                    ? "bg-[#94a3b8] cursor-not-allowed shadow-none"
                                    : "bg-gradient-to-br from-[#253361] to-[#1a2446] cursor-pointer shadow-[0_2px_8px_rgba(37,51,97,0.35)]"
                            }`}
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
                "Email",
                "Joining Date",
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

            worksheet.dataValidations.add("J2:J10000", {
                type: "list",
                allowBlank: true,
                formulae: [clientRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select a client from the dropdown list."
            });

            worksheet.dataValidations.add("K2:K10000", {
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

                const keysSet = new Set();
                jsonData.forEach(row => {
                    Object.keys(row).forEach(k => keysSet.add(k));
                });
                const keys = Array.from(keysSet);

                const getVal = (row, fieldOptions) => {
                    const foundKey = keys.find(k => fieldOptions.includes(k.toLowerCase().trim()));
                    return foundKey ? row[foundKey] : null;
                };

                const formatDate = (val) => {
                    if (!val) return null;
                    if (typeof val === 'number') {
                        const date = new Date((val - 25569) * 86400 * 1000);
                        return date.toISOString().split('T')[0];
                    }
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        return d.toISOString().split('T')[0];
                    }
                    return val;
                };

                const mappedRecords = jsonData.map((row) => {
                    const empCode = getVal(row, ["employee code", "employee_code", "code", "emp code"]);
                    const fullName = getVal(row, ["full name", "full_name", "name", "employee name"]);
                    const departmentName = getVal(row, ["department", "department_name", "dept"]);
                    const designation = getVal(row, ["designation", "role"]);
                    const employeeType = getVal(row, ["employee type", "employee_type", "type"]) || "Direct";
                    const contractorName = getVal(row, ["contractor name", "contractor_name", "contractor"]);
                    const phoneNo = getVal(row, ["phone number", "phone_no", "phone", "phone no", "phone no."]);
                    const email = getVal(row, ["email", "email_id", "email id"]);
                    const joiningDate = getVal(row, ["joining date", "joining_date", "date of joining", "doj"]);
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
                        email: email ? String(email).trim() : null,
                        joiningDate: formatDate(joiningDate),
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
                render: (row) => <span className="font-bold text-[#253361]">{row.employee_code}</span>
            },
            {
                key: "full_name",
                label: "Full Name",
                render: (row) => <span className="font-bold text-[#1e293b]">{row.full_name}</span>
            },
            {
                key: "department_name",
                label: "Department",
                render: (row) => (
                    <span className="bg-[#f0f3fa] text-[#253361] font-semibold py-[3px] px-2 rounded-md text-[12px]">
                        {row.department_name}
                    </span>
                )
            },
            {
                key: "designation",
                label: "Designation",
                render: (row) => <span className="font-semibold text-[#475569]">{row.designation}</span>
            },
            {
                key: "phone_no",
                label: "Phone No.",
                render: (row) => <span className="font-semibold text-[#1e293b]">{row.phone_no || "—"}</span>
            },
            {
                key: "email",
                label: "Email",
                render: (row) => <span className="font-semibold text-[#1e293b]">{row.email || "—"}</span>
            },
            {
                key: "joining_date",
                label: "Joining Date",
                render: (row) => {
                    if (!row.joining_date) return "—";
                    const date = new Date(row.joining_date);
                    return <span className="font-semibold text-[#475569]">{date.toLocaleDateString('en-GB')}</span>;
                }
            },
            {
                key: "employee_type",
                label: "Employee Type",
                render: (row) => (
                    <span className={`font-semibold py-0.5 px-2 rounded-md text-[12px] border ${
                        row.employee_type === 'Contractor' 
                            ? 'text-[#b45309] bg-[#fffbeb] border-[#fde68a]' 
                            : 'text-[#15803d] bg-[#f0fdf4] border-[#bbf7d0]'
                    }`}>
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
                    <div className="flex items-center gap-2">
                        {canUpdate && (
                            <button
                                onClick={() => handleOpenEditModal(row)}
                                className="flex w-8 h-8 items-center justify-center rounded-lg border border-[#c2d0eb] bg-[#f0f3fa] text-[#253361] cursor-pointer"
                                title="Edit Employee"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[15px] h-[15px]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
                                </svg>
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => handleDelete(row.id)}
                                className="flex w-8 h-8 items-center justify-center rounded-lg border border-[#fecdd3] bg-[#fff1f2] text-[#be123c] cursor-pointer"
                                title="Delete Employee"
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

            <main className="flex-1 flex flex-col w-full mx-auto py-8 px-[30px]">
                {error && (
                    <div className="bg-[#fff1f2] border border-[#fecdd3] text-[#be123c] py-3 px-4 rounded-[10px] mb-5 text-[14px] font-medium">
                        {error}
                    </div>
                )}

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImport} 
                    className="hidden" 
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
                            <div className="flex gap-2.5">
                                <button
                                    onClick={handleExportTemplate}
                                    className="flex w-10 h-10 items-center justify-center rounded-[9px] border border-[#cbd5e1] bg-white text-[#253361] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                                    title="Export Excel Template"
                                >
                                    <i className="fa-solid fa-file-export text-[14px]"></i>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex w-10 h-10 items-center justify-center rounded-[9px] border border-[#cbd5e1] bg-white text-[#253361] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                                    title="Import Excel File"
                                >
                                    <i className="fa-solid fa-file-import text-[14px]"></i>
                                </button>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="flex w-10 h-10 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#253361] to-[#1a2446] text-white border-none cursor-pointer shadow-[0_2px_8px_rgba(37,51,97,0.35)]"
                                    title="Add Employee"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-[18px] h-[18px]">
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
