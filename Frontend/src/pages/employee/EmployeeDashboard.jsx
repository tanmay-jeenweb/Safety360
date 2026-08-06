import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyDashboardData, changeEmployeePassword, sendChangePasswordOtp } from "../../api/employeeApi";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState({ pendingTestsCount: 0, completedCoursesCount: 0, activeBatchesCount: 0 });
    const [activeTrainings, setActiveTrainings] = useState([]);
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Profile Dropdown state
    const [showDropdown, setShowDropdown] = useState(false);

    // Change Password Modal state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [modalConfig, setModalConfig] = useState({ isForced: false });
    const [passwordForm, setPasswordForm] = useState({ otp: "", newPassword: "", confirmPassword: "" });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [changePassReceivedOtp, setChangePassReceivedOtp] = useState("");

    // Accordion State
    const [activeTrainingsExpanded, setActiveTrainingsExpanded] = useState(true);
    const [trainingHistoryExpanded, setTrainingHistoryExpanded] = useState(false);

    // Selected Training Details Modal State
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!storedUser) {
            navigate("/");
            return;
        }
        setUser(storedUser);

        // Force password change if is_first_login is true (or 1)
        if (storedUser.is_first_login === 1 || storedUser.is_first_login === true) {
            setModalConfig({ isForced: true });
            setShowPasswordModal(true);
        }

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

    // Handle clicks outside of dropdown to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("loginTime");
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
    };

    const handleStartTest = (batchId, testType) => {
        if (user?.is_first_login === 1 || user?.is_first_login === true) {
            toast.error("Please change your password first.");
            return;
        }
        navigate(`/employee/test/${batchId}/${testType}`);
    };

    const handleSendChangePasswordOtp = async () => {
        setOtpLoading(true);
        try {
            const res = await sendChangePasswordOtp();
            if (res.data.success) {
                setOtpSent(true);
                setChangePassReceivedOtp(res.data.otp || "");
                toast.success("OTP sent to your registered email address.");
            } else {
                toast.error("Failed to send OTP.");
            }
        } catch (err) {
            console.error("Error sending change password OTP:", err);
            toast.error(err.response?.data?.message || "Failed to send OTP.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();

        if (!modalConfig.isForced && !passwordForm.otp) {
            toast.error("Verification OTP is required.");
            return;
        }
        if (passwordForm.newPassword.length < 4) {
            toast.error("New password must be at least 4 characters.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await changeEmployeePassword({
                otp: modalConfig.isForced ? undefined : passwordForm.otp,
                newPassword: passwordForm.newPassword
            });

            if (res.data.success) {
                toast.success("Password changed successfully!");

                // Update local storage and user state
                const updatedUser = { ...user, is_first_login: 0 };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUser(updatedUser);

                // Clear form and close modal
                setPasswordForm({ otp: "", newPassword: "", confirmPassword: "" });
                setOtpSent(false);
                setChangePassReceivedOtp("");
                setShowPasswordModal(false);
                setModalConfig({ isForced: false });
            } else {
                toast.error(res.data.message || "Failed to update password.");
            }
        } catch (err) {
            console.error("Error changing password:", err);
            toast.error(err.response?.data?.message || "Invalid verification OTP.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return "EE";
        return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
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

    const getCardStyle = (status) => {
        switch (status) {
            case "Draft":
                return "border-l-4 border-l-slate-400 bg-slate-50/20 hover:border-slate-500/25";
            case "Pretest Active":
                return "border-l-4 border-l-blue-500 bg-blue-50/5 hover:border-blue-500/25";
            case "Training Held":
                return "border-l-4 border-l-amber-500 bg-amber-50/5 hover:border-amber-500/25";
            case "Posttest Active":
                return "border-l-4 border-l-purple-500 bg-purple-50/5 hover:border-purple-500/25";
            case "Closed":
                return "border-l-4 border-l-emerald-500 bg-emerald-50/5 hover:border-emerald-500/25";
            default:
                return "border-l-4 border-l-orange-500 bg-orange-50/5 hover:border-orange-500/25";
        }
    };

    const getHistoryCardStyle = (badge) => {
        switch (badge) {
            case "PASSED":
                return "border-l-4 border-l-emerald-500 bg-emerald-50/5 hover:border-emerald-500/25";
            case "FAILED":
                return "border-l-4 border-l-red-500 bg-red-50/5 hover:border-red-500/25";
            default:
                return "border-l-4 border-l-slate-400 bg-slate-50/20 hover:border-slate-500/25";
        }
    };

    const getProgressPercent = (status, preTestScore, postTestScore) => {
        if (postTestScore !== null || status === "Closed") return "100%";
        if (status === "Posttest Active") return "75%";
        if (status === "Training Held") return "50%";
        if (status === "Pretest Active") return "25%";
        return "0%";
    };

    const getProgressSteps = (training) => {
        const { status, preTestScore, postTestScore, attendance } = training;

        // Step 1: Pre-Test
        let preTestStep = {
            label: "Pre-Test",
            icon: "1",
            style: "bg-white border-slate-200 text-slate-400",
            labelStyle: "text-slate-400"
        };
        if (preTestScore !== null) {
            preTestStep = {
                label: "Pre-Test",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                ),
                style: "bg-emerald-50 border-emerald-500 text-emerald-600",
                labelStyle: "text-emerald-600 font-bold"
            };
        } else if (status === "Pretest Active") {
            preTestStep = {
                label: "Pre-Test",
                icon: "1",
                style: "bg-blue-50 border-blue-500 text-blue-600 ring-4 ring-blue-100",
                labelStyle: "text-blue-600 font-extrabold"
            };
        }

        // Step 2: Training Session
        let trainingStep = {
            label: "Training",
            icon: "2",
            style: "bg-white border-slate-200 text-slate-400",
            labelStyle: "text-slate-400"
        };
        if (attendance === 1 || status === "Training Held" || status === "Posttest Active" || postTestScore !== null || status === "Closed") {
            const isDone = status === "Training Held" || status === "Posttest Active" || postTestScore !== null || status === "Closed";
            if (isDone) {
                trainingStep = {
                    label: "Training",
                    icon: (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                    ),
                    style: "bg-emerald-50 border-emerald-500 text-emerald-600",
                    labelStyle: "text-emerald-600 font-bold"
                };
            } else {
                trainingStep = {
                    label: "Training",
                    icon: "2",
                    style: "bg-amber-50 border-amber-500 text-amber-600 ring-4 ring-amber-100",
                    labelStyle: "text-amber-600 font-extrabold"
                };
            }
        }

        // Step 3: Post-Test
        let postTestStep = {
            label: "Post-Test",
            icon: "3",
            style: "bg-white border-slate-200 text-slate-400",
            labelStyle: "text-slate-400"
        };
        if (postTestScore !== null || status === "Closed") {
            postTestStep = {
                label: "Post-Test",
                icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                ),
                style: "bg-emerald-50 border-emerald-500 text-emerald-600",
                labelStyle: "text-emerald-600 font-bold"
            };
        } else if (status === "Posttest Active") {
            postTestStep = {
                label: "Post-Test",
                icon: "3",
                style: "bg-purple-50 border-purple-500 text-purple-600 ring-4 ring-purple-100",
                labelStyle: "text-purple-600 font-extrabold"
            };
        }

        return [preTestStep, trainingStep, postTestStep];
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 via-orange-50/10 to-slate-100 font-sans antialiased text-slate-800 flex flex-col relative overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute top-[10%] left-[10%] w-[35%] h-[40%] bg-orange-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
            <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[40%] bg-amber-500/5 rounded-full blur-[130px] pointer-events-none z-0" />

            {/* Premium Navbar */}
            <header className="w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4 flex items-center justify-between z-30 sticky top-0 shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                    <img src="/Gravity Logo.png" alt="Safety360 Logo" className="h-10 w-auto" />
                    <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                        Safety<span className="text-orange-600">360</span> Portal
                    </span>
                </div>
                {user && (
                    <div className="flex items-center gap-4 relative" ref={dropdownRef}>
                        {/* Profile Clickable Area */}
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 hover:bg-slate-100/60 p-2 rounded-2xl cursor-pointer transition-all duration-200 select-none"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-xl bg-orange-600/10 text-orange-600 font-extrabold text-xs flex items-center justify-center border border-orange-200/40">
                                {getInitials(user.name)}
                            </div>
                            <div className="text-right hidden sm:block">
                                {/* <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Participant</p> */}
                                <p className="text-md font-black text-slate-800">{user.name}</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 origin-top-right transition-all duration-300">
                                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Logged in as</p>
                                    <p className="text-xs font-black text-slate-800 truncate">{user.username}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setModalConfig({ isForced: false });
                                        setShowPasswordModal(true);
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer border-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                    </svg>
                                    Change Password
                                </button>

                                <div className="h-px bg-slate-100 my-1"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors cursor-pointer border-none"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                    Log Out
                                </button>
                            </div>
                        )}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Accordions Stack */}
                        <div className="space-y-6">
                            
                            {/* Accordion 1: Active Trainings */}
                            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
                                <button
                                    onClick={() => setActiveTrainingsExpanded(!activeTrainingsExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-none focus:outline-none cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">Active Trainings</h2>
                                            <p className="text-slate-500 text-xs mt-1.5 font-medium">Your current and ongoing training modules</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-orange-600/10 text-orange-600 font-extrabold text-xs px-2.5 py-1 rounded-full">
                                            {activeTrainings.length}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-slate-400 transition-transform duration-250 ${activeTrainingsExpanded ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </button>

                                {activeTrainingsExpanded && (
                                    <div className="p-6 border-t border-slate-100">
                                        {activeTrainings.length === 0 ? (
                                            <div className="w-full py-12 flex flex-col items-center justify-center text-center p-6">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {activeTrainings.map((training) => (
                                                    <div
                                                        key={training.batchId}
                                                        className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col justify-between ${getCardStyle(training.status)}`}
                                                    >
                                                        <div>
                                                            <div className="flex justify-between items-start gap-2 mb-3 pb-3 border-b border-slate-100">
                                                                <div>
                                                                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">BATCH B-{training.batchId}</span>
                                                                    <h3 className="text-md font-extrabold text-slate-900 leading-snug mt-0.5 min-h-[44px] line-clamp-2">
                                                                        {training.moduleName}
                                                                    </h3>
                                                                </div>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider shrink-0 ${getStatusBadgeClass(training.status)}`}>
                                                                    {getStatusLabel(training.status)}
                                                                </span>
                                                            </div>

                                                            <div className="space-y-2 text-xs text-slate-500 font-semibold mb-5">
                                                                <div className="flex items-center gap-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                                    </svg>
                                                                    <span className="truncate">Trainer: <strong className="text-slate-700 font-bold">{training.trainerName}</strong></span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                                    </svg>
                                                                    <span>Scheduled: <strong className="text-slate-700 font-bold">{new Date(training.scheduledDate).toLocaleDateString()}</strong></span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                                    </svg>
                                                                    <span className="truncate">Venue: <strong className="text-slate-700 font-bold">{training.venue}</strong></span>
                                                                </div>
                                                            </div>

                                                            {/* Visual Stage Progress Stepper */}
                                                            <div className="relative my-5 px-3">
                                                                {/* Connection Line */}
                                                                <div className="absolute left-[10%] right-[10%] top-4 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0">
                                                                    <div 
                                                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500" 
                                                                        style={{ width: getProgressPercent(training.status, training.preTestScore, training.postTestScore) }}
                                                                    />
                                                                </div>
                                                                
                                                                {/* Steps */}
                                                                <div className="relative flex justify-between items-center w-full z-10">
                                                                    {getProgressSteps(training).map((step, idx) => (
                                                                        <div key={idx} className="flex flex-col items-center">
                                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${step.style}`}>
                                                                                {step.icon}
                                                                            </div>
                                                                            <span className={`text-[10px] font-bold mt-1.5 uppercase tracking-wider ${step.labelStyle}`}>
                                                                                {step.label}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            {/* Score progress summary */}
                                                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${training.preTestScore !== null ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                                    <span>Pre: {training.preTestScore !== null ? `${training.preTestScore}/${training.preTotalQuestions}` : 'Pending'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${training.attendance ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                                                    <span>Attended: {training.attendance ? 'Yes' : 'No'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${training.postTestScore !== null ? (training.bandBadge === 'PASSED' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-300'}`}></span>
                                                                    <span>Post: {training.postTestScore !== null ? `${training.postTestScore}/${training.postTotalQuestions}` : 'Pending'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            {training.pendingTests && training.pendingTests.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {training.pendingTests.map((t) => (
                                                                        <button
                                                                            key={t.type}
                                                                            onClick={() => handleStartTest(training.batchId, t.type)}
                                                                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all duration-300 shadow-sm hover:shadow cursor-pointer border-none flex items-center justify-center gap-1.5"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                                                                            </svg>
                                                                            Start {t.type}-Test
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTraining(training);
                                                                        setShowDetailsModal(true);
                                                                    }}
                                                                    className="w-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all duration-350 cursor-pointer border-none flex items-center justify-center gap-1.5"
                                                                >
                                                                    View Training Details
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Accordion 2: Training History */}
                            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.015)]">
                                <button
                                    onClick={() => setTrainingHistoryExpanded(!trainingHistoryExpanded)}
                                    className="w-full flex items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left border-none focus:outline-none cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-none">Training History</h2>
                                            <p className="text-slate-500 text-xs mt-1.5 font-medium">History of your completed and evaluated training modules</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="bg-emerald-600/10 text-emerald-600 font-extrabold text-xs px-2.5 py-1 rounded-full">
                                            {trainingHistory.length}
                                        </span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-slate-400 transition-transform duration-250 ${trainingHistoryExpanded ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </button>

                                {trainingHistoryExpanded && (
                                    <div className="p-6 border-t border-slate-100">
                                        {trainingHistory.length === 0 ? (
                                            <div className="w-full py-12 flex flex-col items-center justify-center text-center p-6">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-base font-bold text-slate-800">No Past History</h3>
                                                <p className="text-slate-500 text-xs max-w-sm mt-1 font-medium">
                                                    Evaluated course details and results will show here once completed.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {trainingHistory.map((history) => {
                                                    const isPassed = history.bandBadge === "PASSED";
                                                    const isFailed = history.bandBadge === "FAILED";

                                                    return (
                                                        <div
                                                            key={history.batchId}
                                                            className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-[0_10px_35px_rgba(0,0,0,0.03)] transition-all duration-300 flex flex-col justify-between ${getHistoryCardStyle(history.bandBadge)}`}
                                                        >
                                                            <div>
                                                                <div className="flex justify-between items-start gap-2 mb-3 pb-3 border-b border-slate-100">
                                                                    <div>
                                                                        <span className="text-[10px] font-extrabold text-slate-400 tracking-wider">
                                                                            {new Date(history.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                        <h3 className="text-md font-extrabold text-slate-900 leading-snug mt-0.5 min-h-[44px] line-clamp-2">
                                                                            {history.moduleName}
                                                                        </h3>
                                                                    </div>
                                                                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-extrabold border shrink-0 uppercase tracking-wider ${isPassed
                                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                            : isFailed
                                                                                ? "bg-red-50 text-red-700 border-red-100"
                                                                                : "bg-slate-50 text-slate-500 border-slate-100"
                                                                        }`}>
                                                                        {history.bandBadge || "UNTESTED"}
                                                                    </span>
                                                                </div>

                                                                <div className="space-y-2 text-xs text-slate-500 font-semibold mb-5">
                                                                    <div className="flex items-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                                        </svg>
                                                                        <span className="truncate">Trainer: <strong className="text-slate-700 font-bold">{history.trainerName}</strong></span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                                        </svg>
                                                                        <span className="truncate">Venue: <strong className="text-slate-700 font-bold">{history.venue || 'N/A'}</strong></span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                {/* Summary of results */}
                                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100/50">
                                                                    <span>Pre: {history.preTestScore !== null ? `${Math.round((history.preTestScore / (history.preTotalQuestions || 1)) * 100)}%` : "-"}</span>
                                                                    <span className="w-px h-3.5 bg-slate-200"></span>
                                                                    <span>Post: {history.postTestScore !== null ? `${Math.round((history.postTestScore / (history.postTotalQuestions || 1)) * 100)}%` : "-"}</span>
                                                                    <span className="w-px h-3.5 bg-slate-200"></span>
                                                                    <span>Attended: <strong className={history.attendance ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>{history.attendance ? "Yes" : "No"}</strong></span>
                                                                </div>

                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedTraining(history);
                                                                        setShowDetailsModal(true);
                                                                    }}
                                                                    className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all duration-350 cursor-pointer border-none flex items-center justify-center gap-1.5"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                                                    </svg>
                                                                    Review Performance
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>
                    </>
                )}
            </main>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 animate-fade-in relative">

                        {/* Close button - only visible if NOT forced */}
                        {!modalConfig.isForced && (
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordForm({ otp: "", newPassword: "", confirmPassword: "" });
                                    setOtpSent(false);
                                    setChangePassReceivedOtp("");
                                }}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Change Password</h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {modalConfig.isForced
                                        ? "For security, you must update your password to continue."
                                        : "Update your training portal password."}
                                </p>
                            </div>
                        </div>


                        {!modalConfig.isForced && !otpSent ? (
                            <div className="space-y-4 text-center py-2">
                                <p className="text-slate-600 text-xs leading-relaxed">
                                    For your security, we'll send a 6-digit One-Time Password (OTP) to your registered email address to verify your identity.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleSendChangePasswordOtp}
                                    disabled={otpLoading}
                                    className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 border-none flex justify-center items-center gap-2"
                                >
                                    {otpLoading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        "Send Verification OTP"
                                    )}
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">

                                {!modalConfig.isForced && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Verification Code (OTP)</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength="6"
                                            value={passwordForm.otp}
                                            onChange={(e) => setPasswordForm({ ...passwordForm, otp: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors"
                                            placeholder="Enter 6-digit OTP"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors"
                                        placeholder="Minimum 4 characters"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500/50 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none transition-colors"
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={passwordLoading}
                                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs py-3 rounded-xl transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0 border-none"
                                    >
                                        {passwordLoading ? "Updating Password..." : "Update Password"}
                                    </button>
                                </div>

                                {!modalConfig.isForced && (
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setOtpSent(false);
                                                setPasswordForm({ otp: "", newPassword: "", confirmPassword: "" });
                                                setChangePassReceivedOtp("");
                                            }}
                                            className="text-slate-400 hover:text-orange-600 transition-colors text-[11px] font-bold uppercase tracking-wider cursor-pointer border-none bg-transparent"
                                        >
                                            Back / Resend OTP
                                        </button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Selected Training Details Modal */}
            {showDetailsModal && selectedTraining && (() => {
                const isPassed = selectedTraining.bandBadge === "PASSED";
                const isFailed = selectedTraining.bandBadge === "FAILED";
                const prePercent = selectedTraining.preTestScore !== null ? Math.round((selectedTraining.preTestScore / (selectedTraining.preTotalQuestions || 1)) * 100) : null;
                const postPercent = selectedTraining.postTestScore !== null ? Math.round((selectedTraining.postTestScore / (selectedTraining.postTotalQuestions || 1)) * 100) : null;
                const improvement = prePercent !== null && postPercent !== null ? postPercent - prePercent : null;

                return (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8 animate-fade-in relative flex flex-col max-h-[90vh] overflow-y-auto">
                            
                            {/* Close button */}
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedTraining(null);
                                }}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                    </svg>
                                </div>
                                <div className="pr-8">
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Training Module Evaluation</span>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight mt-0.5">
                                        {selectedTraining.moduleName}
                                    </h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600 mb-6">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Batch ID</p>
                                    <p className="text-slate-800 font-extrabold mt-0.5">B-{selectedTraining.batchId}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Date</p>
                                    <p className="text-slate-800 font-extrabold mt-0.5">{new Date(selectedTraining.scheduledDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Trainer</p>
                                    <p className="text-slate-800 font-extrabold mt-0.5">{selectedTraining.trainerName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">Venue</p>
                                    <p className="text-slate-800 font-extrabold mt-0.5 truncate">{selectedTraining.venue || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Evaluation Performance visual charts */}
                            <div className="space-y-4 mb-6">
                                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Evaluation Scores</h4>
                                
                                {/* Pre test bar */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                                        <span className="text-slate-500">Pre-Test Score</span>
                                        <span className="text-slate-800 font-bold">{prePercent !== null ? `${prePercent}% (${selectedTraining.preTestScore}/${selectedTraining.preTotalQuestions})` : "Pending"}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                            style={{ width: prePercent !== null ? `${prePercent}%` : '0%' }}
                                        />
                                    </div>
                                </div>

                                {/* Post test bar */}
                                <div>
                                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                                        <span className="text-slate-500">Post-Test Score</span>
                                        <span className="text-slate-800 font-bold">{postPercent !== null ? `${postPercent}% (${selectedTraining.postTestScore}/${selectedTraining.postTotalQuestions})` : "Pending"}</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${isPassed ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-orange-500'}`} 
                                            style={{ width: postPercent !== null ? `${postPercent}%` : '0%' }}
                                        />
                                    </div>
                                </div>

                                {/* Progress/Attendance badge list */}
                                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs font-semibold">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400">Attendance:</span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${selectedTraining.attendance ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                            {selectedTraining.attendance ? 'Present' : 'Absent'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-slate-400">Final Result:</span>
                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${isPassed ? 'bg-emerald-50 text-emerald-700' : isFailed ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {selectedTraining.bandBadge || 'IN EVALUATION'}
                                        </span>
                                    </div>
                                </div>

                                {improvement !== null && improvement > 0 && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                <path fillRule="evenodd" d="M10 17a.75.75 0 0 1-.75-.75V5.612L5.29 9.77a.75.75 0 0 1-1.08-1.04l5.25-5.5a.75.75 0 0 1 1.08 0l5.25 5.5a.75.75 0 1 1-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0 1 10 17Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-800">Excellent Progress!</p>
                                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Your score improved by {improvement}% from the Pre-Test to the Post-Test.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setSelectedTraining(null);
                                }}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all duration-300 shadow-sm cursor-pointer border-none"
                            >
                                Close Summary
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
