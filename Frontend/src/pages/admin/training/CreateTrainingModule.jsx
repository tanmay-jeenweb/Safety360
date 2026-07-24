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

    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter',sans-serif" }}>
            <Navbar title="CRM Admin" />

            <main style={{ flex: 1, padding: "32px 30px", maxWidth: 900, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
                {/* Top Bar Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#1e293b" }}>
                            {isEditMode ? "Edit Training Module" : "Create New Training Module"}
                        </h1>
                        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748b" }}>
                            {isEditMode ? "Modify module details and settings below" : "Fill out the fields to add a new training module to the system"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/training-modules")}
                        style={{
                            padding: "9px 18px", borderRadius: 9, border: "1.5px solid #cbd5e1",
                            background: "#fff", color: "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 6
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to List
                    </button>
                </div>

                {error && (
                    <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500 }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading module details...</div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                        <div style={{ padding: "28px" }}>
                            
                            {/* Section 1: Basic Module Info */}
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    1. Basic Module Details
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Module Name */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Module Name <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="moduleName"
                                            value={formData.moduleName}
                                            onChange={handleChange}
                                            placeholder="Enter module name..."
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                            required
                                        />
                                    </div>

                                    {/* Category Lookup Dropdown */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Category <span style={{ color: "#e11d48" }}>*</span>
                                        </label>
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleChange}
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b", background: "#fff" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
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
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    2. Duration & Evaluation Settings
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
                                    {/* Duration (Hours) */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
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
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>

                                    {/* Validity (Months) */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Validity (Months)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="validityMonths"
                                            value={formData.validityMonths}
                                            onChange={handleChange}
                                            placeholder="e.g. 12"
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>

                                    {/* Passing Marks (%) */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
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
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>

                                    {/* Refresher (Months) */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Refresher (Months)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="refresherMonths"
                                            value={formData.refresherMonths}
                                            onChange={handleChange}
                                            placeholder="e.g. 6"
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "10px 12px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Assessment Questions */}
                            <div style={{ marginBottom: 24 }}>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    3. Test Questions Count
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Pre-Test Qs */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Pre-Test Qs (Count)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="preTestQs"
                                            value={formData.preTestQs}
                                            onChange={handleChange}
                                            placeholder="e.g. 5"
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>

                                    {/* Post-Test Qs */}
                                    <div>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                                            Post-Test Qs (Count)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            name="postTestQs"
                                            value={formData.postTestQs}
                                            onChange={handleChange}
                                            placeholder="e.g. 10"
                                            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #cbd5e1", borderRadius: 9, padding: "11px 14px", fontSize: 14, outline: "none", color: "#1e293b" }}
                                            onFocus={e => e.target.style.borderColor = "#253361"}
                                            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Options & Requirements */}
                            <div>
                                <h3 style={{ margin: "0 0 16px 0", fontSize: 15, fontWeight: 700, color: "#253361", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 8 }}>
                                    4. Requirements & Options
                                </h3>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                    {/* Practical Required Radio */}
                                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                                            Practical Required?
                                        </label>
                                        <div style={{ display: "flex", gap: 24 }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#1e293b" }}>
                                                <input
                                                    type="radio"
                                                    name="practicalRequired"
                                                    value="Yes"
                                                    checked={formData.practicalRequired === "Yes"}
                                                    onChange={handleChange}
                                                    style={{ accentColor: "#253361", width: 16, height: 16 }}
                                                />
                                                Yes
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#1e293b" }}>
                                                <input
                                                    type="radio"
                                                    name="practicalRequired"
                                                    value="No"
                                                    checked={formData.practicalRequired === "No"}
                                                    onChange={handleChange}
                                                    style={{ accentColor: "#253361", width: 16, height: 16 }}
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>

                                    {/* Certificate Applicable Radio */}
                                    <div style={{ background: "#f8fafc", padding: "14px 18px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                                            Certificate Applicable?
                                        </label>
                                        <div style={{ display: "flex", gap: 24 }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#1e293b" }}>
                                                <input
                                                    type="radio"
                                                    name="certificateApplicable"
                                                    value="Yes"
                                                    checked={formData.certificateApplicable === "Yes"}
                                                    onChange={handleChange}
                                                    style={{ accentColor: "#253361", width: 16, height: 16 }}
                                                />
                                                Yes
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600, color: "#1e293b" }}>
                                                <input
                                                    type="radio"
                                                    name="certificateApplicable"
                                                    value="No"
                                                    checked={formData.certificateApplicable === "No"}
                                                    onChange={handleChange}
                                                    style={{ accentColor: "#253361", width: 16, height: 16 }}
                                                />
                                                No
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Footer Action Buttons */}
                        <div style={{ padding: "20px 28px", borderTop: "1px solid #f1f5f9", background: "#fafafa", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button
                                type="button"
                                onClick={() => navigate("/admin/training-modules")}
                                disabled={saving}
                                style={{ padding: "10px 22px", borderRadius: 9, border: "1.5px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: "10px 28px", borderRadius: 9, border: "none",
                                    background: saving ? "#94a3b8" : "linear-gradient(135deg,#253361,#1a2446)",
                                    color: "#fff", fontWeight: 700, fontSize: 14,
                                    cursor: saving ? "not-allowed" : "pointer",
                                    boxShadow: saving ? "none" : "0 3px 10px rgba(37,51,97,0.3)"
                                }}
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
