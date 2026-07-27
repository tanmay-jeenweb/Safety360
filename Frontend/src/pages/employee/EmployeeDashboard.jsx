import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyActiveTests } from "../../api/employeeApi";
import toast from "react-hot-toast";

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!storedUser) {
            navigate("/");
            return;
        }
        setUser(storedUser);

        const fetchTests = async () => {
            try {
                const res = await getMyActiveTests();
                if (res.data.success) {
                    setTests(res.data.data || []);
                } else {
                    toast.error("Failed to load active tests");
                }
            } catch (err) {
                console.error("Error loading active tests:", err);
                toast.error("Error loading active tests");
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
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

    return (
        <div className="min-h-screen w-full bg-gradient-to-tr from-slate-50 via-orange-50/20 to-slate-100 font-sans antialiased text-slate-800 flex flex-col relative overflow-hidden">
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
            <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 z-10 flex flex-col justify-start">
                {/* Welcome Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(37,51,97,0.04)] mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Welcome, <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">{user?.name || "Participant"}</span>!
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-medium">
                            Employee Code: <span className="font-bold text-slate-700">{user?.username}</span>
                        </p>
                    </div>
                    <div className="bg-orange-50 text-orange-700 px-4 py-2 rounded-2xl text-xs font-bold border border-orange-100 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                        Active Exam Session
                    </div>
                </div>

                {/* Test Listings */}
                <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5.5 h-5.5 text-orange-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 2.24a.75.75 0 0 1-1.077 0L6.47 5.784a.75.75 0 1 1 1.06-1.06l1.222 1.22 3.72-3.72a.75.75 0 1 1 1.06 1.06L9.28 6.079Z" />
                        </svg>
                        Your Active Assessments
                    </h2>

                    {loading ? (
                        <div className="w-full py-16 flex flex-col items-center justify-center gap-4 bg-white/50 rounded-3xl border border-slate-200/50">
                            <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 text-sm font-semibold">Checking for activated tests...</p>
                        </div>
                    ) : tests.length === 0 ? (
                        <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white/60 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-[0_20px_50px_rgba(37,51,97,0.03)] p-6">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">No Exams Scheduled</h3>
                            <p className="text-slate-500 text-sm max-w-sm mt-1.5 font-medium">
                                There are no active pre-tests or post-tests configured for your batch at this moment. Please wait for the trainer to activate your exam.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {tests.map((test, index) => (
                                <div
                                    key={`${test.batchId}-${test.testType}`}
                                    className="bg-white/90 backdrop-blur-xl border border-slate-200 hover:border-orange-500/30 rounded-3xl p-6 shadow-[0_15px_35px_rgba(37,51,97,0.03)] hover:shadow-[0_20px_50px_rgba(37,51,97,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-4">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-extrabold border uppercase tracking-wider ${
                                                test.testType === "Pre" 
                                                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                                                    : "bg-purple-50 text-purple-700 border-purple-100"
                                            }`}>
                                                {test.testType} Test
                                            </span>
                                            <span className="text-xs text-slate-400 font-bold">
                                                ID: B-{test.batchId}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-extrabold text-slate-900 leading-snug mb-3">
                                            {test.moduleName}
                                        </h3>

                                        <div className="space-y-2.5 text-xs text-slate-500 font-medium border-t border-slate-100 pt-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                </svg>
                                                <span>Trainer: <strong className="text-slate-700">{test.trainerName}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                </svg>
                                                <span>Scheduled: <strong className="text-slate-700">{new Date(test.scheduledDate).toLocaleDateString()}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                                </svg>
                                                <span>Venue: <strong className="text-slate-700">{test.venue}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleStartTest(test.batchId, test.testType)}
                                        className="w-full py-2.5 rounded-xl text-white text-xs font-semibold tracking-wider transition-all duration-300 bg-orange-600 hover:bg-orange-500 hover:shadow-[0_6px_20px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 cursor-pointer flex justify-center items-center gap-2"
                                    >
                                        <span>Start Exam</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
