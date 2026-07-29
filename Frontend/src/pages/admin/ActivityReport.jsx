import { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/Navbar";
import DataTable from "../../components/DataTable";
import { fetchActivityLogs } from "../../api/authApi";
import toast from "react-hot-toast";

// ─── Modal to view detailed change data ──────────────────────────────────────────
// ─── Modal to view detailed change data ──────────────────────────────────────────
function DetailModal({ isOpen, row, onClose }) {
  if (!isOpen || !row) return null;

  const beforeObj = row.before_data || {};
  const afterObj = row.after_data || {};

  // Get all unique keys and sort them alphabetically, excluding device_id
  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]))
    .filter(key => key !== 'device_id')
    .sort();

  const isFieldChanged = (key) => {
    const vBefore = beforeObj[key];
    const vAfter = afterObj[key];
    if (typeof vBefore === "object" || typeof vAfter === "object") {
      return JSON.stringify(vBefore) !== JSON.stringify(vAfter);
    }
    return vBefore !== vAfter;
  };

  const formatValue = (key, val) => {
    if (val === null || val === undefined) return <span className="text-[#94a3b8]">—</span>;
    if (typeof val === "boolean") return val ? "True" : "False";
    if (key === "permissions" && Array.isArray(val)) {
      const active = val.filter(p => p.canRead || p.canWrite || p.canUpdate || p.canDelete);
      if (active.length === 0) return <span className="text-[#94a3b8]">No permissions set</span>;
      return (
        <div className="flex flex-col gap-1">
          {active.map((p, idx) => {
            const actions = [];
            if (p.canRead) actions.push("Read");
            if (p.canWrite) actions.push("Write");
            if (p.canUpdate) actions.push("Update");
            if (p.canDelete) actions.push("Delete");
            const label = p.masterName || p.master_name || "Unknown";
            return (
              <div key={idx} className="text-[12px]">
                <strong className="text-[#1e293b]">{label}</strong>: <span className="text-[#0284c7]">{actions.join(", ")}</span>
              </div>
            );
          })}
        </div>
      );
    }
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/55 backdrop-blur-[4px] flex items-center justify-center p-4">
      <div className="bg-white rounded-[18px] w-full max-w-[700px] mx-auto shadow-[0_25px_60px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="py-5 px-7 border-b border-[#f1f5f9] flex items-center justify-between bg-gradient-to-br from-[#253361] to-[#1a2446]">
          <div className="flex: 1">
            <h2 className="m-0 text-[18px] font-bold text-white">Activity Log Detail</h2>
            <p className="mt-1 text-[13px] text-[#d9e2ec]">
              {row.master_name} — {row.change_type.toUpperCase()} by {row.username}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/15 border-none rounded-lg w-[34px] h-[34px] cursor-pointer flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-[18px] h-[18px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-5 px-7 overflow-y-auto flex-1 bg-[#f8fafc]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-3 gap-4 mb-5 bg-white p-4 rounded-xl border border-[#e2e8f0]">
            <div>
              <span className="text-[11px] font-bold text-[#64748b] uppercase">User</span>
              <p className="m-0 mt-0.5 text-[14px] font-semibold text-[#1e293b]">{row.username || "System"}</p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748b] uppercase">Action Type</span>
              <p className="m-0 mt-0.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  row.change_type === 'created' || row.change_type === 'approved' ? 'bg-green-100 text-green-800' :
                  row.change_type === 'updated' ? 'bg-amber-100 text-amber-800' :
                  row.change_type === 'deleted' || row.change_type === 'rejected' ? 'bg-rose-100 text-rose-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {row.change_type.toUpperCase()}
                </span>
              </p>
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748b] uppercase">Timestamp</span>
              <p className="m-0 mt-0.5 text-[14px] text-[#1e293b]">{new Date(row.created_at).toLocaleString()}</p>
            </div>
          </div>

          {afterObj.close_reason && (
            <div className="mb-5 bg-[#fef2f2] border border-[#fee2e2] py-3.5 px-4.5 rounded-xl text-[#991b1b]">
              <span className="text-[11px] font-bold uppercase block text-[#b91c1c]">Inquiry Close Reason</span>
              <p className="m-0 mt-1 text-[14px] font-semibold">{afterObj.close_reason}</p>
            </div>
          )}

          {/* Table View */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="bg-[#f1f5f9] border-b border-[#e2e8f0]">
                  <th className="py-2.5 px-3.5 font-semibold text-[#475569]">Field</th>
                  <th className="py-2.5 px-3.5 font-semibold text-[#475569]">Before</th>
                  <th className="py-2.5 px-3.5 font-semibold text-[#475569]">After</th>
                </tr>
              </thead>
              <tbody>
                {allKeys.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-3.5 text-center text-[#64748b]">No details available</td>
                  </tr>
                ) : (
                  allKeys.map((key) => {
                    const changed = isFieldChanged(key);
                    return (
                      <tr key={key} className={`border-b border-[#f1f5f9] ${changed ? "bg-[#fef3c7]/40" : "bg-transparent"}`}>
                        <td className="py-2.5 px-3.5 font-medium text-[#1e293b] w-[30%]">{key}</td>
                        <td className="py-2.5 px-3.5 text-[#475569] w-[35%] break-all">{formatValue(key, beforeObj[key])}</td>
                        <td className={`py-2.5 px-3.5 w-[35%] break-all ${changed ? "text-[#92400e] font-semibold" : "text-[#475569] font-normal"}`}>
                          {formatValue(key, afterObj[key])}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="py-4 px-7 border-t border-[#f1f5f9] flex justify-end bg-[#fafafa]">
          <button type="button" onClick={onClose}
            className="py-[9px] px-6 rounded-lg border-[1.5px] border-[#cbd5e1] text-[#475569] bg-white font-bold text-[13px] cursor-pointer hover:bg-[#f8fafc] transition-colors duration-150">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Activity Report Component ──────────────────────────────────────────────
export default function ActivityReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetchActivityLogs();
      if (res.data?.success) {
        const rawLogs = res.data.logs || [];
        // Filter out closed inquiries from the Audit Log report
        const filteredLogs = rawLogs.filter(row => {
          const isClosedInquiry = row.master_name === 'Inquiry' && 
                                  row.change_type === 'status_updated' && 
                                  row.after_data?.status === 'closed';
          return !isClosedInquiry;
        });
        setLogs(filteredLogs);
      } else {
        toast.error(res.data?.message || "Failed to fetch activity logs");
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = useMemo(() => [
    {
      key: "username",
      label: "Username",
      render: (row) => <span className="font-semibold text-slate-800">{row.username || "System"}</span>
    },
    {
      key: "master_name",
      label: "Module / Master",
      render: (row) => <span className="text-slate-700">{row.master_name}</span>
    },
    {
      key: "change_type",
      label: "Action",
      render: (row) => {
        const isClosedInquiry = row.master_name === 'Inquiry' && 
                                row.change_type === 'status_updated' && 
                                row.after_data?.status === 'closed';
        const displayAction = isClosedInquiry ? 'closed' : row.change_type;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${
            displayAction === 'created' || displayAction === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
            displayAction === 'updated' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
            displayAction === 'deleted' || displayAction === 'rejected' || displayAction === 'closed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
            'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            {displayAction.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: "details",
      label: "Details",
      sortable: false,
      render: (row) => (row.before_data || row.after_data) ? (
        <button
          onClick={() => {
            setSelectedRow(row);
            setModalOpen(true);
          }}
          className="text-xs text-orange-600 hover:text-orange-900 bg-orange-50 border border-orange-200 hover:bg-orange-100 font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer"
        >
          View Details
        </button>
      ) : <span className="text-slate-400">—</span>
    },
    {
      key: "created_at",
      label: "Date & Time",
      render: (row) => <span className="text-xs text-slate-500">{new Date(row.created_at).toLocaleString()}</span>
    }
  ], []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 font-sans text-slate-900 min-h-screen">
      <Navbar title="User Activity Report" />

      <main className="flex-1 flex flex-col w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex-1 flex flex-col mb-8">
          <DataTable
            tableId="user_activity_report"
            title="User Activity Report"
            data={logs}
            columns={columns}
            loading={loading}
            searchPlaceholder="Search by username, module or action..."
          />
        </div>
      </main>

      {/* Detail Modal */}
      <DetailModal
        isOpen={modalOpen}
        row={selectedRow}
        onClose={() => {
          setModalOpen(false);
          setSelectedRow(null);
        }}
      />
    </div>
  );
}
