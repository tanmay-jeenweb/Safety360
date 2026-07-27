import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logoutUser } from "../api/authApi";
import { usePermission } from "../context/PermissionContext";

const logo = "/Gravity Logo.png";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
    const { hasPermission } = usePermission();

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (isOpen && !e.target.closest("#masters-dropdown")) {
                setIsOpen(false);
            }
            if (isProfileOpen && !e.target.closest("#profile-dropdown")) {
                setIsProfileOpen(false);
            }
            if (isQuestionsOpen && !e.target.closest("#questions-dropdown")) {
                setIsQuestionsOpen(false);
            }
        };
        document.addEventListener("click", handleOutsideClick);
        return () => document.removeEventListener("click", handleOutsideClick);
    }, [isOpen, isProfileOpen, isQuestionsOpen]);

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout failed", error);
        }
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        sessionStorage.removeItem("loginTime");
        window.dispatchEvent(new Event("auth-change"));
        navigate("/");
    };

    const isAdmin = user.role === "admin" || user.role === "super admin";

    return (
        <nav className="bg-white shadow-sm border-b border-slate-200 flex flex-col relative z-50">
            {/* First Row */}
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative z-40">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="Safety360 Logo" className="h-12 w-auto cursor-pointer" onClick={() => navigate("/admin/home")} />
                </div>

                <div className="flex items-center gap-6">
                    {/* Profile Dropdown */}
                    <div className="relative" id="profile-dropdown">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all duration-200 cursor-pointer focus:outline-none"
                            title="User menu"
                        >
                            <div className="w-8 h-8 rounded-full bg-orange-50 border border-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                {user.name ? user.name[0].toUpperCase() : "U"}
                            </div>
                            <span className="hidden sm:inline text-sm font-semibold text-slate-700">{user.name || "User"}</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="px-4 py-2.5 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                                    <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user.name || "User"}</p>
                                    {user.email && (
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                                    )}
                                </div>

                                <div className="px-1.5 py-1">
                                    <button
                                        onClick={() => {
                                            navigate("/profile");
                                            setIsProfileOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                        Your Profile
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 my-1"></div>

                                <div className="px-1.5 py-1">
                                    <button
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            handleLogout();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-red-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 6.75 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                        </svg>
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Second Row: Navigation Links */}
            {user.role && (
                <div className="bg-[#253361] border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-0 flex flex-wrap items-center gap-4">
                    <div className="flex items-center relative z-30">
                        {/* Dashboard Tab */}
                        <div className="relative">
                            <button
                                onClick={() => navigate("/admin/home")}
                                className={`w-44 flex items-center justify-center px-4 py-2.5 text-sm border-r border-l border-white/10 rounded-none focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer ${location.pathname === "/admin/home" ? "bg-white/15" : "bg-[#253361] hover:bg-white/5"
                                    }`}
                            >
                                <span className="flex items-center gap-2 font-semibold text-white truncate">
                                    Dashboard
                                </span>
                            </button>
                        </div>

                        {/* Master Dropdown */}
                        <div className="relative" id="masters-dropdown">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className={`w-44 flex items-center justify-center px-4 py-2.5 text-sm border-r border-white/10 rounded-none focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer ${isOpen || location.pathname === "/admin/dashboard" || location.pathname.startsWith("/admin/user-types") || location.pathname.startsWith("/admin/clients") || location.pathname.startsWith("/admin/sites") || location.pathname.startsWith("/admin/roles") || location.pathname.startsWith("/admin/trainers") || location.pathname.startsWith("/admin/certificate-templates") || location.pathname.startsWith("/admin/rating-scales") || location.pathname.startsWith("/admin/categories") || location.pathname.startsWith("/admin/training-modules") || location.pathname.startsWith("/admin/departments") || location.pathname.startsWith("/admin/employees") ? "bg-white/15" : "bg-[#253361] hover:bg-white/5"
                                    }`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <span className="font-semibold text-white truncate">Master</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                        className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isOpen ? "rotate-180 text-white" : ""}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </span>
                            </button>
                            {isOpen && (
                                <div className="absolute left-0 top-full mt-1.5 w-[520px] bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 origin-top-left animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            onClick={() => {
                                                navigate("/admin/dashboard");
                                                setIsOpen(false);
                                            }}
                                            className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname === "/admin/dashboard"
                                                ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                }`}
                                        >
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname === "/admin/dashboard" ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                }`}>
                                                <i className="fa-solid fa-users-gear text-xs"></i>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold leading-snug">User Master</p>
                                            </div>
                                        </button>

                                        {(isAdmin || hasPermission("user_type", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/user-types");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/user-types")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/user-types") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-user-shield text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">User Type Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("client_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/clients");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/clients")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/clients") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-building text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Client Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("site_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/sites");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/sites")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/sites") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-location-dot text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Site Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("role_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/roles");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/roles")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/roles") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-user-tag text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Role Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("trainer_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/trainers");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/trainers")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/trainers") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-chalkboard-user text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Trainer Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("certificate_template_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/certificate-templates");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/certificate-templates")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/certificate-templates") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-certificate text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Certificate Template Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("rating_scale_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/rating-scales");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/rating-scales")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/rating-scales") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-star text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Rating Scale Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("category_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/categories");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/categories")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/categories") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-tags text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Category Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("training_module_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/training-modules");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/training-modules")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/training-modules") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-book-open text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Training Module Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("department_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/departments");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/departments")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/departments") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-sitemap text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Department Master</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("employee_master", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/employees");
                                                    setIsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/employees")
                                                        ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/employees") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-user-group text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Employee Master</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Questions Dropdown */}
                        <div className="relative" id="questions-dropdown">
                            <button
                                onClick={() => setIsQuestionsOpen(!isQuestionsOpen)}
                                className={`w-44 flex items-center justify-center px-4 py-2.5 text-sm border-r border-white/10 rounded-none focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer ${isQuestionsOpen || location.pathname.startsWith("/admin/question-bank") || location.pathname.startsWith("/admin/question-paper") ? "bg-white/15" : "bg-[#253361] hover:bg-white/5"
                                    }`}
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <span className="font-semibold text-white truncate">Questions</span>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2.5}
                                        stroke="currentColor"
                                        className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${isQuestionsOpen ? "rotate-180 text-white" : ""}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </span>
                            </button>
                            {isQuestionsOpen && (
                                <div className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 origin-top-left animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col gap-1.5">
                                        {(isAdmin || hasPermission("question_bank", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/question-bank");
                                                    setIsQuestionsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/question-bank")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/question-bank") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-circle-question text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Question Bank</p>
                                                </div>
                                            </button>
                                        )}

                                        {(isAdmin || hasPermission("question_paper", "read")) && (
                                            <button
                                                onClick={() => {
                                                    navigate("/admin/question-paper");
                                                    setIsQuestionsOpen(false);
                                                }}
                                                className={`relative group flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer text-left border border-transparent ${location.pathname.startsWith("/admin/question-paper")
                                                    ? "bg-orange-50/70 text-orange-700 font-semibold border-orange-100/50"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100"
                                                    }`}
                                            >
                                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-sm shrink-0 ${location.pathname.startsWith("/admin/question-paper") ? "bg-orange-100/80 text-orange-700" : "bg-slate-100/80 text-slate-500"
                                                    }`}>
                                                    <i className="fa-solid fa-file-signature text-xs"></i>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold leading-snug">Question Paper</p>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Batches Tab */}
                        {(isAdmin || hasPermission("batch_master", "read")) && (
                            <div className="relative">
                                <button
                                    onClick={() => navigate("/admin/batches")}
                                    className={`w-44 flex items-center justify-center px-4 py-2.5 text-sm border-r border-white/10 rounded-none focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer ${location.pathname.startsWith("/admin/batches") ? "bg-white/15" : "bg-[#253361] hover:bg-white/5"
                                        }`}
                                >
                                    <span className="flex items-center gap-2 font-semibold text-white truncate">
                                        Batches
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* Activity Report Tab */}
                        {isAdmin && (
                            <div className="relative">
                                <button
                                    onClick={() => navigate("/admin/report")}
                                    className={`w-44 flex items-center justify-center px-4 py-2.5 text-sm border-r border-white/10 rounded-none focus:outline-none transition-all duration-200 font-semibold text-white cursor-pointer ${location.pathname.startsWith("/admin/report") ? "bg-white/15" : "bg-[#253361] hover:bg-white/5"
                                        }`}
                                >
                                    <span className="flex items-center gap-2 font-semibold text-white truncate">
                                        Activity Report
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
