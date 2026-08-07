import { useEffect, useState, useMemo } from "react";
import Navbar from "../../../components/Navbar";
import DataTable from "../../../components/DataTable";
import { getApprovalRequests, updateApprovalRequestStatus } from "../../../api/batchApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../../../context/PermissionContext";

export default function TrainingApprovals() {
    const navigate = useNavigate();
    const { hasPermission } = usePermission();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("Pending");
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const canApprove = hasPermission("employee_training_approval", "write");

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await getApprovalRequests();
            setRequests(res.data.data || []);
        } catch (err) {
            console.error("Failed to load training approval requests", err);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId, status) => {
        if (!window.confirm(`Are you sure you want to set status to '${status}'?`)) return;

        setActionLoadingId(requestId);
        try {
            await updateApprovalRequestStatus(requestId, status);
            toast.success(`Request successfully ${status === 'Approved' ? 'approved' : 'rejected'}`);
            // Refresh
            const res = await getApprovalRequests();
            setRequests(res.data.data || []);
        } catch (err) {
            console.error(`Failed to update status to ${status}`, err);
            toast.error(err?.response?.data?.message || `Failed to update status to ${status}`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredRequests = useMemo(() => {
        if (filterStatus === "All") return requests;
        return requests.filter(r => r.status === filterStatus);
    }, [requests, filterStatus]);

    const getStatusStyle = (status) => {
        switch (status) {
            case "Approved":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Rejected":
                return "bg-rose-50 text-rose-700 border-rose-200";
            default:
                return "bg-amber-50 text-amber-700 border-amber-200";
        }
    };

    const columns = useMemo(() => [
        {
            key: "batch_id",
            label: "Batch / Module",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-mono text-slate-400 font-bold">BAT-b{String(row.batch_id).padStart(7, '0')}</span>
                    <span className="font-bold text-slate-800 mt-0.5">{row.module_name}</span>
                </div>
            )
        },
        {
            key: "employee_name",
            label: "Trainee",
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{row.employee_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">{row.employee_code}</span>
                </div>
            )
        },
        {
            key: "requester_name",
            label: "Requested By",
            render: (row) => <span className="font-bold text-slate-700">{row.requester_name}</span>
        },
        {
            key: "comments",
            label: "Comments",
            render: (row) => (
                <div className="max-w-[200px] truncate text-slate-500" title={row.comments}>
                    {row.comments || "—"}
                </div>
            )
        },
        {
            key: "status",
            label: "Status",
            render: (row) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusStyle(row.status)}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: "created_at",
            label: "Date",
            render: (row) => (
                <span className="text-slate-500 font-mono font-semibold">
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric'
                    })}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            sortable: false,
            render: (row) => {
                if (row.status === "Pending") {
                    return (
                        <div className="flex gap-2">
                            <button
                                disabled={actionLoadingId !== null || !canApprove}
                                onClick={() => handleAction(row.id, "Approved")}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                title="Approve Request"
                            >
                                <i className="fa-solid fa-check"></i>
                                <span>Approve</span>
                            </button>
                            <button
                                disabled={actionLoadingId !== null || !canApprove}
                                onClick={() => handleAction(row.id, "Rejected")}
                                className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-extrabold shadow-sm transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                title="Reject Request"
                            >
                                <i className="fa-solid fa-xmark"></i>
                                <span>Reject</span>
                            </button>
                        </div>
                    );
                }
                return <span className="text-[10px] text-slate-400 font-bold uppercase">Evaluated</span>;
            }
        }
    ], [actionLoadingId, canApprove]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
                        <span className="text-sm font-semibold text-slate-600">Loading approvals page...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            <Navbar />

            <main className="flex-1 w-full mx-auto p-6 md:p-8">
                
                {/* Tabs */}
                <div className="border-b border-slate-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        {["Pending", "Approved", "Rejected", "All"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer border-none bg-transparent
                                    ${filterStatus === status
                                        ? 'border-[#253361] text-[#253361]'
                                        : 'border-transparent text-slate-500 hover:text-slate-755 hover:border-slate-300'
                                    }`}
                            >
                                {status === "Pending" && "Pending Approvals"}
                                {status === "Approved" && "Approved Approvals"}
                                {status === "Rejected" && "Rejected Approvals"}
                                {status === "All" && "Approval History"}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* DataTable Integration */}
                <DataTable
                    tableId="training_approvals"
                    title="Training Approvals"
                    data={filteredRequests}
                    columns={columns}
                    loading={loading}
                    searchPlaceholder="Search approval requests..."
                />
            </main>
        </div>
    );
}
