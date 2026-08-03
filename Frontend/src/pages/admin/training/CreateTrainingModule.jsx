import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { getCategories } from "../../../api/categoryApi";
import {
    createTrainingModule,
    getTrainingModuleById,
    updateTrainingModule
} from "../../../api/trainingModuleApi";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

export default function CreateTrainingModule() {
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        moduleName: "",
        categoryId: "",
        durationHours: "",
        validityMonths: "",
        passingMarks: "",
        refresherMonths: "",
        practicalRequired: "No",
        preTestQs: "",
        postTestQs: "",
        certificateApplicable: "No"
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await getCategories();
                setCategories(res.data.data || []);
            } catch (err) {
                console.error("Error loading categories", err);
                toast.error("Failed to load categories");
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            const fetchModuleDetails = async () => {
                setLoading(true);
                try {
                    const res = await getTrainingModuleById(id);
                    const mod = res.data.data;
                    if (mod) {
                        setFormData({
                            moduleName: mod.module_name || "",
                            categoryId: mod.category_id || "",
                            durationHours: mod.duration_hours || "",
                            validityMonths: mod.validity_months || "",
                            passingMarks: mod.passing_marks || "",
                            refresherMonths: mod.refresher_months || "",
                            practicalRequired: mod.practical_required || "No",
                            preTestQs: mod.pre_test_qs || "",
                            postTestQs: mod.post_test_qs || "",
                            certificateApplicable: mod.certificate_applicable || "No"
                        });
                    }
                } catch (err) {
                    console.error("Error fetching module", err);
                    setError("Failed to load module details");
                } finally {
                    setLoading(false);
                }
            };
            fetchModuleDetails();
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.moduleName.trim()) {
            toast.error("Module Name is required");
            return;
        }
        if (!formData.categoryId) {
            toast.error("Please select a Category");
            return;
        }

        setSaving(true);
        try {
            if (isEditMode) {
                await updateTrainingModule(id, formData);
                toast.success("Training Module updated successfully");
            } else {
                await createTrainingModule(formData);
                toast.success("Training Module created successfully");
            }
            navigate("/admin/training-modules");
        } catch (err) {
            console.error("Error saving training module", err);
            toast.error(err?.response?.data?.message || "Failed to save training module");
        } finally {
            setSaving(false);
        }
    };

    /* Shared input class */
    const inputClass =
        "w-full box-border border-[1.5px] border-slate-300 rounded-[9px] px-3.5 py-[11px] text-sm outline-none text-slate-800 bg-white focus:border-[#253361] transition-colors";

    const inputSmClass =
        "w-full box-border border-[1.5px] border-slate-300 rounded-[9px] px-3 py-[10px] text-sm outline-none text-slate-800 bg-white focus:border-[#253361] transition-colors";

    const sectionHeadingClass =
        "mt-0 mb-4 text-[15px] font-bold text-[#253361] uppercase tracking-[0.05em] border-b-[1.5px] border-slate-100 pb-2";

    const labelClass = "block text-[13px] font-bold text-slate-500 mb-1.5";
    const labelSmClass = "block text-xs font-bold text-slate-500 mb-1.5";

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-['Inter',sans-serif]">
            <Navbar title="CRM Admin" />

            <main className="flex-1 px-[30px] py-8 w-full mx-auto box-border">
                {/* Top Bar Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="m-0 text-2xl font-bold text-slate-800">
                            {isEditMode ? "Edit Training Module" : "Create New Training Module"}
                        </h1>
                        <p className="mt-1 mb-0 text-sm text-slate-500">
                            {isEditMode
                                ? "Modify module details and settings below"
                                : "Fill out the fields to add a new training module to the system"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/training-modules")}
                        className="flex items-center gap-1.5 px-[18px] py-[9px] rounded-[9px] border-[1.5px] border-slate-300 bg-white text-slate-500 font-semibold text-[13px] cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-[10px] mb-5 text-sm font-medium">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading module details...</div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden border border-slate-200">
                        <div className="p-7">

                            {/* Section 1: Basic Module Info */}
                            <div className="mb-6">
                                <h3 className={sectionHeadingClass}>
                                    1. Basic Module Details
                                </h3>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Module Name */}
                                    <div>
                                        <label className={labelClass}>
                                            Module Name <span className="text-rose-600">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="moduleName"
                                            value={formData.moduleName}
                                            onChange={handleChange}
                                            placeholder="Enter module name..."
                                            className={inputClass}
                                            required
                                        />
                                    </div>

                                    {/* Category Lookup Dropdown */}
                                    <div>
                                        <label className={labelClass}>
                                            Category <span className="text-rose-600">*</span>
                                        </label>
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleChange}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">-- Select Category --</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.category_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Timing & Evaluation */}
                            <div className="mb-6">
                                <h3 className={sectionHeadingClass}>
                                    2. Duration &amp; Evaluation Settings
                                </h3>

                                <div className="grid grid-cols-4 gap-4">
                                    {/* Duration (Hours) */}
                                    <div>
                                        <label className={labelSmClass}>
                                            Duration (Hours)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            name="durationHours"
                                            value={formData.durationHours}
                                            onChange={handleChange}
                                            placeholder="e.g. 2"
                                            className={inputSmClass}
                                        />
                                    </div>

                                    {/* Validity (Months) */}
                                    <div>
                                        <label className={labelSmClass}>
                                            Validity (Months)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="validityMonths"
                                            value={formData.validityMonths}
                                            onChange={handleChange}
                                            placeholder="e.g. 12"
                                            className={inputSmClass}
                                        />
                                    </div>

                                    {/* Passing Marks (%) */}
                                    <div>
                                        <label className={labelSmClass}>
                                            Passing Marks (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            name="passingMarks"
                                            value={formData.passingMarks}
                                            onChange={handleChange}
                                            placeholder="e.g. 80"
                                            className={inputSmClass}
                                        />
                                    </div>

                                    {/* Refresher (Months) */}
                                    <div>
                                        <label className={labelSmClass}>
                                            Refresher (Months)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="refresherMonths"
                                            value={formData.refresherMonths}
                                            onChange={handleChange}
                                            placeholder="e.g. 6"
                                            className={inputSmClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Assessment Questions */}
                            <div className="mb-6">
                                <h3 className={sectionHeadingClass}>
                                    3. Test Questions Count
                                </h3>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Pre-Test Qs */}
                                    <div>
                                        <label className={labelClass}>
                                            Pre-Test Qs (Count)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="preTestQs"
                                            value={formData.preTestQs}
                                            onChange={handleChange}
                                            placeholder="e.g. 5"
                                            className={inputClass}
                                        />
                                    </div>

                                    {/* Post-Test Qs */}
                                    <div>
                                        <label className={labelClass}>
                                            Post-Test Qs (Count)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="postTestQs"
                                            value={formData.postTestQs}
                                            onChange={handleChange}
                                            placeholder="e.g. 10"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Options & Requirements */}
                            <div>
                                <h3 className={sectionHeadingClass}>
                                    4. Requirements &amp; Options
                                </h3>

                                <div className="grid grid-cols-2 gap-5">
                                    {/* Practical Required Radio */}
                                    <div className="bg-slate-50 px-[18px] py-3.5 rounded-[10px] border border-slate-200">
                                        <label className="block text-[13px] font-bold text-slate-500 mb-2.5">
                                            Practical Required?
                                        </label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                                <input
                                                    type="radio"
                                                    name="practicalRequired"
                                                    value="Yes"
                                                    checked={formData.practicalRequired === "Yes"}
                                                    onChange={handleChange}
                                                    className="accent-[#253361] w-4 h-4"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                                <input
                                                    type="radio"
                                                    name="practicalRequired"
                                                    value="No"
                                                    checked={formData.practicalRequired === "No"}
                                                    onChange={handleChange}
                                                    className="accent-[#253361] w-4 h-4"
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>

                                    {/* Certificate Applicable Radio */}
                                    <div className="bg-slate-50 px-[18px] py-3.5 rounded-[10px] border border-slate-200">
                                        <label className="block text-[13px] font-bold text-slate-500 mb-2.5">
                                            Certificate Applicable?
                                        </label>
                                        <div className="flex gap-6">
                                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                                <input
                                                    type="radio"
                                                    name="certificateApplicable"
                                                    value="Yes"
                                                    checked={formData.certificateApplicable === "Yes"}
                                                    onChange={handleChange}
                                                    className="accent-[#253361] w-4 h-4"
                                                />
                                                Yes
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                                                <input
                                                    type="radio"
                                                    name="certificateApplicable"
                                                    value="No"
                                                    checked={formData.certificateApplicable === "No"}
                                                    onChange={handleChange}
                                                    className="accent-[#253361] w-4 h-4"
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Footer Action Buttons */}
                        <div className="px-7 py-5 border-t border-slate-100 bg-[#fafafa] flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate("/admin/training-modules")}
                                disabled={saving}
                                className="px-[22px] py-2.5 rounded-[9px] border-[1.5px] border-slate-300 bg-white text-slate-500 font-semibold text-sm cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-60"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className={`px-7 py-2.5 rounded-[9px] border-none text-white font-bold text-sm transition-all
                                    ${saving
                                        ? "bg-slate-400 cursor-not-allowed shadow-none"
                                        : "bg-gradient-to-br from-[#253361] to-[#1a2446] cursor-pointer shadow-[0_3px_10px_rgba(37,51,97,0.3)] hover:opacity-90"
                                    }`}
                            >
                                {saving ? "Saving…" : isEditMode ? "Save Changes" : "Create Training Module"}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    );
}
