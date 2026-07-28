import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDashboardData } from "../../api/employeeApi";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState({ pendingTestsCount: 0, completedCoursesCount: 0, activeBatchesCount: 0 });
    const [activeTrainings, setActiveTrainings] = useState([]);
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!storedUser) {
            navigate("/");
            return;
        }
        setUser(storedUser);

        const fetchDashboardData = async () => {
            try {
                const res = await getMyDashboardData();
                if (res.data.success) {
                    const { summary, activeTrainings, trainingHistory } = res.data.data;
                    setSummary(summary || { pendingTestsCount: 0, completedCoursesCount: 0, activeBatchesCount: 0 });
                    setActiveTrainings(activeTrainings || []);
                    setTrainingHistory(trainingHistory || []);
                } else {
                    toast.error("Failed to load dashboard data");
                }
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                toast.error("Error loading dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("loginTime");
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
    };

    const handleStartTest = (batchId, testType) => {
        navigate(`/employee/test/${batchId}/${testType}`);
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Draft":
                return "bg-slate-100 text-slate-700 border-slate-200";
            case "Pretest Active":
                return "bg-blue-50 text-blue-700 border-blue-100";
            case "Training Held":
                return "bg-amber-50 text-amber-700 border-amber-100";
            case "Posttest Active":
                return "bg-purple-50 text-purple-700 border-purple-100";
            default:
                return "bg-slate-50 text-slate-600 border-slate-100";
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "Draft":
                return "Draft Setup";
            case "Pretest Active":
                return "Pre-Test Active";
            case "Training Held":
                return "Training Held";
            case "Posttest Active":
                return "Post-Test Active";
            case "Closed":
                return "Batch Closed";
            default:
                return status;
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 via-orange-50/10 to-slate-100 font-sans antialiased text-slate-800 flex flex-col relative overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute top-[10%] left-[10%] w-[35%] h-[40%] bg-orange-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[40%] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none z-0" />

            {/* Premium Navbar */}
            <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-10 sticky top-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <img src="/Gravity Logo.png" alt="Safety360 Logo" className="h-10 w-auto" />
                    <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Safety<span className="text-orange-600">360</span> Portal
                    </span>
                </div>
                {user && (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Participant</p>
                            <p className="text-sm font-extrabold text-slate-800">{user.name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </header>

            {/* Dashboard Content */}
            <main className="flex-1 w-full mx-auto px-6 py-6 z-10 flex flex-col justify-start max-w-7xl">
                {/* Welcome Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-[0_20px_50px_rgba(37,51,97,0.04)] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome, <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">{user?.name || "Participant"}</span>!
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">
                            Safety360 Training Portal Dashboard
                        </p>
                    </div>
                    <div className="bg-orange-50 text-orange-700 px-4 py-2.5 rounded-2xl text-xs font-bold border border-orange-100/50 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3">
                        <p className="text-slate-500 font-medium">
                            Employee Code: <span className="font-extrabold text-slate-700">{user?.username}</span>
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="w-full py-32 flex flex-col items-center justify-center gap-4 bg-white/50 rounded-3xl border border-slate-200/50">
                        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-sm font-semibold">Loading dashboard data...</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Card 1: Pending Tests */}
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_15px_30px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-300 hover:shadow-[0_20px_40px_rgba(249,115,22,0.05)] hover:border-orange-500/30">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Tests</p>
                                    <h3 className="text-3xl font-black text-slate-850 mt-1">{summary.pendingTestsCount}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Requires immediate completion</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 2.24a.75.75 0 0 1-1.077 0L6.47 5.784a.75.75 0 1 1 1.06-1.06l1.222 1.22 3.72-3.72a.75.75 0 1 1 1.06 1.06L9.28 6.079Z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 2: Completed Courses */}
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_15px_30px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-300 hover:shadow-[0_20px_40px_rgba(16,185,129,0.05)] hover:border-emerald-500/30">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Courses</p>
                                    <h3 className="text-3xl font-black text-slate-850 mt-1">{summary.completedCoursesCount}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Modules fully evaluated</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Card 3: Active Batches */}
                            <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl p-6 shadow-[0_15px_30px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all duration-300 hover:shadow-[0_20px_40px_rgba(14,165,233,0.05)] hover:border-sky-500/30">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Batches</p>
                                    <h3 className="text-3xl font-black text-slate-850 mt-1">{summary.activeBatchesCount}</h3>
                                    <p className="text-xs text-slate-500 mt-1">Assigned training modules</p>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.969 5.969 0 0 1-5.384-3.51M9.75 8.25c0-1.8 1.5-3 3-3s3 1.2 3 3-1.2 3-3 3-3-1.2-3-3Zm-1.25-2.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0ZM3 18.72a9.094 9.094 0 0 1 3.741-.479 3 3 0 0 1-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 0 12 21c2.17 0 4.207-.576 5.963-1.584A6.062 6.062 0 0 0 18 18.72m-12 0a5.969 5.969 0 0 0 5.384-3.51M9.75 8.25c0-1.8-1.5-3-3-3s-3 1.2-3 3 1.2 3 3 3 3-1.2 3-3Zm-1.25-2.5a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Side by Side layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Left Column: Active Training (2/3 width) */}
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-2">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-50"></span>
                                    </span>
                                    Active Trainings
                                </h2>

                                {activeTrainings.length === 0 ? (
                                    <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-[0_20px_50px_rgba(37,51,97,0.03)] p-6">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800">No Active Trainings</h3>
                                        <p className="text-slate-500 text-xs max-w-sm mt-1 font-medium">
                                            There are no active training batches assigned to you at the moment.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {activeTrainings.map((training) => (
                                            <div
                                                key={training.batchId}
                                                className="bg-white border border-slate-200 hover:border-orange-500/20 rounded-3xl p-6 shadow-[0_10px_30px_rgba(37,51,97,0.02)] transition-all duration-350"
                                            >
                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-4 pb-4 border-b border-slate-100">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400">BATCH ID: B-{training.batchId}</span>
                                                        <h3 className="text-lg font-black text-slate-900 leading-snug mt-0.5">
                                                            {training.moduleName}
                                                        </h3>
                                                    </div>
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getStatusBadgeClass(training.status)}`}>
                                                        {getStatusLabel(training.status)}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500 font-semibold mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Trainer</p>
                                                            <p className="text-slate-700 font-bold mt-0.5">{training.trainerName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled</p>
                                                            <p className="text-slate-700 font-bold mt-0.5">{new Date(training.scheduledDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Venue</p>
                                                            <p className="text-slate-700 font-bold mt-0.5">{training.venue}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Training Progress Scores Details */}
                                                <div className="flex items-center gap-4 bg-slate-50/55 p-3 rounded-2xl text-xs font-semibold text-slate-500 mb-4 border border-slate-100">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${training.preTestScore !== null ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                                                        <span>Pre-Test: <strong className="text-slate-700">{training.preTestScore !== null ? `${training.preTestScore} Marks` : "Not Taken"}</strong></span>
                                                    </div>
                                                    <div className="w-px h-4 bg-slate-200"></div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${training.attendance ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                                                        <span>Attendance: <strong className="text-slate-700">{training.attendance ? "Present" : "Absent / Pending"}</strong></span>
                                                    </div>
                                                </div>

                                                {/* Pending Test Call-to-action */}
                                                {training.pendingTests && training.pendingTests.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {training.pendingTests.map((t) => (
                                                            <div 
                                                                key={t.type}
                                                                className="flex items-center justify-between bg-orange-50/40 border border-orange-200/50 rounded-2xl p-4 gap-3"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl bg-orange-100/60 flex items-center justify-center text-orange-600 shrink-0">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-black text-slate-800">{t.type} Test Available</p>
                                                                        <p className="text-[10px] text-slate-500 mt-0.5">Please start and complete the evaluation.</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleStartTest(training.batchId, t.type)}
                                                                    className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] tracking-wide uppercase px-4 py-2 rounded-xl transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap"
                                                                >
                                                                    Start Exam
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-3 bg-slate-50/50 rounded-2xl text-[10px] text-slate-400 font-bold tracking-wider uppercase border border-dashed border-slate-200">
                                                        {training.status === "Draft" 
                                                            ? "Waiting for trainer to start Pre-test"
                                                            : training.status === "Training Held"
                                                            ? "Training Held. Waiting for Post-test activation"
                                                            : "No immediate evaluation actions"}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Training History Timeline (1/3 width) */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-slate-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                    Training History
                                </h2>

                                {trainingHistory.length === 0 ? (
                                    <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xs font-bold text-slate-800">No Past History</h3>
                                        <p className="text-slate-500 text-[10px] max-w-xs mt-1 font-medium">
                                            Evaluated course details and results will show here once completed.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="relative pl-1">
                                        {trainingHistory.map((history) => {
                                            const isPassed = history.bandBadge === "PASSED";
                                            const isFailed = history.bandBadge === "FAILED";
                                            
                                            // Timeline node decoration
                                            let nodeBg = "bg-slate-200 text-slate-400";
                                            if (isPassed) nodeBg = "bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50";
                                            else if (isFailed) nodeBg = "bg-red-100 text-red-600 ring-4 ring-red-50";

                                            return (
                                                <div 
                                                    key={history.batchId} 
                                                    className="relative border-l-2 border-slate-200/70 ml-3 pl-6 pb-6 last:pb-2 last:border-none"
                                                >
                                                    {/* Timeline Node Badge */}
                                                    <span className={`absolute -left-[13px] top-1 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${nodeBg}`}>
                                                        {isPassed ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : isFailed ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                                                                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                                            </svg>
                                                        ) : (
                                                            <span>•</span>
                                                        )}
                                                    </span>

                                                    {/* Timeline Card */}
                                                    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_5px_15px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-200">
                                                        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wide">
                                                            {new Date(history.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">
                                                            {history.moduleName}
                                                        </h4>
                                                        
                                                        <div className="space-y-1.5 text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-100 font-medium">
                                                            <p className="flex justify-between items-center">
                                                                <span className="text-slate-400">Trainer</span>
                                                                <span className="text-slate-700 font-bold">{history.trainerName}</span>
                                                            </p>
                                                            <p className="flex justify-between items-center">
                                                                <span className="text-slate-400">Pre-Test Score</span>
                                                                <span className="text-slate-700 font-bold">{history.preTestScore !== null ? `${history.preTestScore} Marks` : "-"}</span>
                                                            </p>
                                                            <p className="flex justify-between items-center">
                                                                <span className="text-slate-400">Post-Test Score</span>
                                                                <span className="text-slate-700 font-bold">{history.postTestScore !== null ? `${history.postTestScore} Marks` : "-"}</span>
                                                            </p>
                                                            <p className="flex justify-between items-center">
                                                                <span className="text-slate-400">Attendance</span>
                                                                <span className={`font-bold ${history.attendance ? "text-emerald-600" : "text-red-500"}`}>
                                                                    {history.attendance ? "Present" : "Absent"}
                                                                </span>
                                                            </p>
                                                            <p className="flex justify-between items-center pt-1">
                                                                <span className="text-slate-400">Status</span>
                                                                <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${
                                                                    isPassed 
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                                                        : isFailed 
                                                                        ? "bg-red-50 text-red-700 border-red-100" 
                                                                        : "bg-slate-50 text-slate-500 border-slate-100"
                                                                }`}>
                                                                    {history.bandBadge || "UNTESTED"}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
