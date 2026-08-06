import { useState } from "react";
import Navbar from "../../../components/Navbar";
import { createUserType } from "../../../api/userTypeMasterApi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const MASTERS = [
  { key: "user_type",             label: "User Type Master" },
  { key: "user_master",             label: "User Master" },
  { key: "device_approval",         label: "Device Approval" },
  { key: "client_master",            label: "Client Master" },
  { key: "site_master",              label: "Site Master" },
  { key: "role_master",              label: "Role Master" },
  { key: "trainer_master",           label: "Trainer Master" },
  { key: "certificate_template_master", label: "Certificate Template Master" },
  { key: "rating_scale_master",      label: "Rating Scale Master" },
  { key: "category_master",          label: "Module Category Master" },
  { key: "training_module_master",   label: "Training Module Master" },
  { key: "department_master",        label: "Department Master" },
  { key: "question_bank",            label: "Question Bank Master" },
  { key: "question_paper",           label: "Question Paper Master" },
  { key: "employee_master",          label: "Employee Master" },
  { key: "batch_master",             label: "Batch Master" },
  { key: "feedback_question_bank",   label: "Feedback Question Bank Master" },
  { key: "feedback_papers",          label: "Feedback Paper Master" },
  { key: "activity_report",          label: "Activity Report" },
  { key: "employee_training_approval", label: "Employee Training Approval" },
];

const PERMS = ["canRead", "canWrite", "canUpdate", "canDelete"];
const PERM_LABELS = { canRead: "Read", canWrite: "Write / Approval", canUpdate: "Update", canDelete: "Delete" };
const PERM_COLORS = {
  canRead:   { bg: "#f0f3fa", border: "#c2d0eb", text: "#253361", check: "#253361" },
  canWrite:  { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", check: "#16a34a" },
  canUpdate: { bg: "#fffbeb", border: "#fde68a", text: "#b45309", check: "#d97706" },
  canDelete: { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", check: "#e11d48" },
};

const defaultPerms = () =>
  MASTERS.map((m) => ({
    masterName: m.key,
    canRead: false,
    canWrite: false,
    canUpdate: false,
    canDelete: false,
  }));

export default function CreateUserType() {
  const [newTypeName, setNewTypeName] = useState("");
  const [permissions, setPermissions] = useState(defaultPerms());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Toggle a single checkbox
  const togglePerm = (masterKey, perm) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.masterName === masterKey ? { ...p, [perm]: !p[perm] } : p
      )
    );
  };

  // Toggle entire row (all perms for one master)
  const toggleRow = (masterKey) => {
    const isApprovalRow = masterKey.endsWith("_approval");
    const row = permissions.find((p) => p.masterName === masterKey);
    const applicablePerms = isApprovalRow ? ["canRead", "canWrite"] : PERMS;
    const allChecked = applicablePerms.every((perm) => row[perm]);
    setPermissions((prev) =>
      prev.map((p) =>
        p.masterName === masterKey
          ? {
              ...p,
              canRead: !allChecked,
              canWrite: !allChecked,
              canUpdate: isApprovalRow ? false : !allChecked,
              canDelete: isApprovalRow ? false : !allChecked,
            }
          : p
      )
    );
  };

  // Toggle entire column (one perm across all masters)
  const toggleColumn = (perm) => {
    const allChecked = permissions.every((p) => p[perm]);
    setPermissions((prev) => prev.map((p) => {
      const isApprovalRow = p.masterName.endsWith("_approval");
      if (isApprovalRow && (perm === "canUpdate" || perm === "canDelete")) {
        return { ...p, [perm]: false };
      }
      return { ...p, [perm]: !allChecked };
    }));
  };

  // Select / deselect all
  const toggleAll = () => {
    const allChecked = permissions.every((p) => {
      const isApprovalRow = p.masterName.endsWith("_approval");
      const applicablePerms = isApprovalRow ? ["canRead", "canWrite"] : PERMS;
      return applicablePerms.every((perm) => p[perm]);
    });
    setPermissions((prev) =>
      prev.map((p) => {
        const isApprovalRow = p.masterName.endsWith("_approval");
        return {
          ...p,
          canRead: !allChecked,
          canWrite: !allChecked,
          canUpdate: isApprovalRow ? false : !allChecked,
          canDelete: isApprovalRow ? false : !allChecked,
        };
      })
    );
  };

  const isRowAll = (masterKey) => {
    const isApprovalRow = masterKey.endsWith("_approval");
    const row = permissions.find((p) => p.masterName === masterKey);
    const applicablePerms = isApprovalRow ? ["canRead", "canWrite"] : PERMS;
    return applicablePerms.every((perm) => row[perm]);
  };

  const isColAll = (perm) => permissions.every((p) => {
    const isApprovalRow = p.masterName.endsWith("_approval");
    if (isApprovalRow && (perm === "canUpdate" || perm === "canDelete")) {
      return true; // treat as matched so it doesn't block "all"
    }
    return p[perm];
  });
  
  const isAllAll = () => permissions.every((p) => {
    const isApprovalRow = p.masterName.endsWith("_approval");
    const applicablePerms = isApprovalRow ? ["canRead", "canWrite"] : PERMS;
    return applicablePerms.every((perm) => p[perm]);
  });

  const handleAddType = async (event) => {
    event.preventDefault();
    if (!newTypeName.trim()) {
      setError("Enter a valid user type name.");
      return;
    }
    setSaving(true);
    setError("");
    // setMessage("");
    try {
      await createUserType({ typeName: newTypeName.trim(), permissions });
      toast.success(`User type '${newTypeName.trim()}' added successfully.`);
      setNewTypeName("");
      setPermissions(defaultPerms());
      setTimeout(() => navigate("/admin/user-types"), 1200);
    } catch (err) {
      console.error("Failed to add user type", err);
      toast.error(err?.response?.data?.message || "Unable to add user type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] font-sans">
      <Navbar title="CRM Admin" />

      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-[24px] font-bold text-[#1e293b] m-0">Create User Type</h1>
            <p className="text-[#64748b] mt-1 text-[14px]">Define a new user group and set its module permissions.</p>
          </div>
          <button
            onClick={() => navigate("/admin/user-types")}
            className="flex items-center gap-1.5 text-[#64748b] bg-none border-none cursor-pointer text-[14px] font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[16px] h-[16px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to User Types
          </button>
        </div>

        {/* Alerts */}
        {/* {message && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
            ✓ {message}
          </div>
        )} */}
        {/* {error && (
          <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
            ✕ {error}
          </div>
        )} */}

        <form onSubmit={handleAddType}>
          {/* Type Name Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-6 mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <label className="block text-[13px] font-semibold text-[#475569] mb-2 uppercase tracking-[0.05em]">
              User Type Name <span className="text-[#e11d48]">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Supervisor, Technician, Manager"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              required
              className="w-full box-border border-[1.5px] border-[#cbd5e1] rounded-[9px] py-[11px] px-[14px] text-[15px] outline-none text-[#1e293b] focus:border-[#253361] transition-colors duration-200"
            />
          </div>

          {/* Permissions Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[14px] p-6 mb-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-[18px]">
              <div>
                <h2 className="text-[15px] font-bold text-[#1e293b] m-0">Module Permissions</h2>
                <p className="text-[13px] text-[#94a3b8] mt-1">Set read, write, update and delete access per master module.</p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className={`text-[12px] font-semibold py-1.5 px-3.5 rounded-lg cursor-pointer border-[1.5px] border-[#253361] transition-all duration-200 ${isAllAll() ? "text-white bg-[#253361]" : "text-[#253361] bg-[#e6ebf0]"}`}
              >
                {isAllAll() ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="text-left py-2.5 px-3.5 text-[12px] font-bold text-[#64748b] uppercase tracking-[0.05em] border-b-2 border-[#e2e8f0] min-w-[160px]">
                      Master Module
                    </th>
                    {PERMS.map((perm) => {
                      const c = PERM_COLORS[perm];
                      return (
                        <th key={perm} className="text-center py-2.5 px-2 border-b-2 border-[#e2e8f0] min-w-[90px]">
                          <button
                            type="button"
                            onClick={() => toggleColumn(perm)}
                            title={`Toggle all ${PERM_LABELS[perm]}`}
                            className="inline-flex flex-col items-center gap-1 bg-none border-none cursor-pointer p-1"
                          >
                            <span className="text-[11px] font-bold uppercase tracking-[0.06em] border rounded-md py-[3px] px-2" style={{ color: c.text, backgroundColor: c.bg, borderColor: c.border }}>
                              {PERM_LABELS[perm]}
                            </span>
                            <div className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-150" style={{ borderColor: isColAll(perm) ? c.check : "#cbd5e1", backgroundColor: isColAll(perm) ? c.check : "#fff" }}>
                              {isColAll(perm) && (
                                <svg viewBox="0 0 12 10" className="w-[10px] h-[10px]">
                                  <polyline points="1,5 4.5,8.5 11,1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                          </button>
                        </th>
                      );
                    })}
                    <th className="text-center py-2.5 px-2 border-b-2 border-[#e2e8f0] min-w-[80px] text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.05em]">
                      All
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MASTERS.map((master, idx) => {
                    const row = permissions.find((p) => p.masterName === master.key);
                    const rowAll = isRowAll(master.key);
                    return (
                      <tr
                        key={master.key}
                        className="odd:bg-white even:bg-[#fafafa] hover:bg-[#f1f5f9] transition-colors duration-150"
                      >
                        <td className="py-3 px-3.5 text-[14px] font-semibold text-[#334155] border-b border-[#f1f5f9]">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#253361] shrink-0" />
                            {master.label}
                          </div>
                        </td>
                        {PERMS.map((perm) => {
                          const c = PERM_COLORS[perm];
                          const checked = row[perm];
                          const isApprovalRow = master.key.endsWith("_approval");

                          if (isApprovalRow && (perm === "canUpdate" || perm === "canDelete")) {
                            return (
                              <td key={perm} className="text-center py-3 px-2 border-b border-[#f1f5f9] text-[#94a3b8]">
                                —
                              </td>
                            );
                          }

                          return (
                            <td key={perm} className="text-center py-3 px-2 border-b border-[#f1f5f9]">
                              <div
                                onClick={() => togglePerm(master.key, perm)}
                                className="w-[22px] h-[22px] rounded-md flex items-center justify-center cursor-pointer transition-all duration-150 mx-auto border-2"
                                style={{
                                  borderColor: checked ? c.check : "#cbd5e1",
                                  backgroundColor: checked ? c.check : "#fff",
                                  boxShadow: checked ? `0 0 0 3px ${c.bg}` : "none"
                                }}
                              >
                                {checked && (
                                  <svg viewBox="0 0 12 10" className="w-[11px] h-[11px]">
                                    <polyline points="1,5 4.5,8.5 11,1" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        {/* Row toggle */}
                        <td className="text-center py-3 px-2 border-b border-[#f1f5f9]">
                          <button
                            type="button"
                            onClick={() => toggleRow(master.key)}
                            className={`text-[11px] font-semibold py-1 px-2.5 rounded-md cursor-pointer border-[1.5px] transition-all duration-150 ${rowAll ? "border-[#253361] text-white bg-[#253361]" : "border-[#cbd5e1] text-[#64748b] bg-[#f8fafc]"}`}
                          >
                            {rowAll ? "✓ All" : "All"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2.5 mt-4 pt-3.5 border-t border-[#f1f5f9]">
              {PERMS.map((perm) => {
                const c = PERM_COLORS[perm];
                return (
                  <div key={perm} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: c.check }} />
                    <span className="text-[12px] text-[#64748b] font-medium">{PERM_LABELS[perm]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/user-types")}
              className="py-2.5 px-[22px] rounded-[9px] border-[1.5px] border-[#cbd5e1] text-[#475569] bg-white font-semibold text-[14px] cursor-pointer hover:bg-[#f8fafc] transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`py-2.5 px-7 rounded-[9px] border-none text-white font-bold text-[14px] transition-all duration-200 ${saving ? "bg-[#94a3b8] cursor-not-allowed shadow-none" : "bg-gradient-to-br from-[#253361] to-[#1a2446] cursor-pointer shadow-[0_2px_8px_rgba(37,51,97,0.35)]"}`}
            >
              {saving ? "Saving…" : "Create User Type"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

