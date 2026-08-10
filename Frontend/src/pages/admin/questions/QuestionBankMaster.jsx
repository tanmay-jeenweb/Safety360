import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { getQuestions, deleteQuestion, importQuestions } from "../../../api/questionBankApi";
import { getTrainingModules } from "../../../api/trainingModuleApi";
import DataTable from "../../../components/DataTable";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { usePermission } from "../../../context/PermissionContext";

export default function QuestionBankMaster() {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const { hasPermission } = usePermission();

    const canWrite = hasPermission("question_bank", "write");
    const canUpdate = hasPermission("question_bank", "update");
    const canDelete = hasPermission("question_bank", "delete");

    const loadData = async () => {
        setLoading(true);
        try {
            const qRes = await getQuestions();
            if (qRes.data && qRes.data.success) {
                setQuestions(qRes.data.data || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load Question Bank data");
        } finally {
            setLoading(false);
        }
    };

    const handleExportTemplate = async () => {
        try {
            // Load modules
            const modRes = await getTrainingModules();
            const allModulesList = modRes.data.data || [];
            
            const ExcelJS = await import("exceljs");
            const workbook = new ExcelJS.Workbook();
            
            // Sheet 1: Template
            const worksheet = workbook.addWorksheet("Template", {
                views: [{ showGridLines: true }]
            });
            
            // Sheet 2: Lookup Lists
            const listsSheet = workbook.addWorksheet("Lists", {
                views: [{ showGridLines: true }]
            });
            listsSheet.state = "hidden";

            // Headers for Template
            const headers = [
                "Module Names (Semicolon separated)",
                "Valuation Type",
                "Language",
                "Question Type",
                "Question Text",
                "Option A",
                "Option B",
                "Option C",
                "Option D",
                "Correct Answer"
            ];
            
            worksheet.addRow(headers);
            
            // Format Template Header Row
            const headerRow = worksheet.getRow(1);
            headerRow.height = 24;
            headerRow.eachCell((cell, colNumber) => {
                cell.font = { name: "Segoe UI", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF253361" } // Dark blue theme
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                
                if (colNumber === 1) {
                    cell.note = {
                        texts: [
                            { font: { bold: true, size: 9, name: "Segoe UI" }, text: "Instructions:\n" },
                            { font: { size: 9, name: "Segoe UI" }, text: "Standard Excel dropdown lists do not allow multi-selecting items natively. To associate multiple modules with a single question, please type or copy-paste the training module names separated by semicolons (e.g. Fire Safety; Electrical Safety)." }
                        ],
                        margins: { left: "0.5in", top: "0.25in", right: "0.25in", bottom: "0.25in" }
                    };
                }
            });

            // Populate Lists sheet
            const moduleNames = allModulesList.map(m => m.module_name).filter(Boolean);
            const valuationTypes = ["Pre", "Post", "Both"];
            const languages = ["English", "Hindi"];
            const questionTypes = ["MCQ", "True/False"];
            const correctAnswers = ["A", "B", "C", "D", "True", "False"];

            const maxListLength = Math.max(moduleNames.length, valuationTypes.length, languages.length, questionTypes.length, correctAnswers.length);
            listsSheet.addRow(["Modules", "ValuationTypes", "Languages", "QuestionTypes", "CorrectAnswers"]);

            for (let i = 0; i < maxListLength; i++) {
                listsSheet.addRow([
                    moduleNames[i] || "",
                    valuationTypes[i] || "",
                    languages[i] || "",
                    questionTypes[i] || "",
                    correctAnswers[i] || ""
                ]);
            }

            // Data validation formulas in Excel notation
            const moduleRange = `Lists!$A$2:$A$${moduleNames.length + 1}`;
            const valuationRange = `Lists!$B$2:$B$4`;
            const languageRange = `Lists!$C$2:$C$3`;
            const typeRange = `Lists!$D$2:$D$3`;

            // Apply validations to rows 2 to 1000
            worksheet.dataValidations.add("A2:A1000", {
                type: "list",
                allowBlank: true,
                formulae: [moduleRange],
                showErrorMessage: false // Allow custom typing for semicolon separated entries
            });

            worksheet.dataValidations.add("B2:B1000", {
                type: "list",
                allowBlank: true,
                formulae: [valuationRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select Pre, Post, or Both."
            });

            worksheet.dataValidations.add("C2:C1000", {
                type: "list",
                allowBlank: true,
                formulae: [languageRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select English or Hindi."
            });

            worksheet.dataValidations.add("D2:D1000", {
                type: "list",
                allowBlank: true,
                formulae: [typeRange],
                showErrorMessage: true,
                errorTitle: "Invalid Option",
                error: "Please select MCQ or True/False."
            });

            // Apply row-by-row validations for dependent dropdowns
            for (let r = 2; r <= 1000; r++) {
                // Correct Answer dropdown: depends on Question Type in column D
                worksheet.getCell(`J${r}`).dataValidation = {
                    type: "list",
                    allowBlank: true,
                    formulae: [`IF(D${r}="True/False", Lists!$E$6:$E$7, Lists!$E$2:$E$5)`],
                    showErrorMessage: true,
                    errorTitle: "Invalid Correct Answer",
                    error: "For MCQ, select A, B, C, or D. For True/False, select True or False."
                };
            }

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
            anchor.download = "Question_Bank_Import_Template.xlsx";
            anchor.click();
            window.URL.revokeObjectURL(url);

            toast.success("Question Bank Excel template exported successfully!");
        } catch (err) {
            console.error("Failed to export Excel template:", err);
            toast.error("Failed to export template. Please try again.");
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = async (evt) => {
            try {
                // Fetch modules first so we can map names to module_ids
                const modRes = await getTrainingModules();
                const allModulesList = modRes.data.data || [];

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

                // Helper to search headers case-insensitively
                const keysSet = new Set();
                jsonData.forEach(row => {
                    Object.keys(row).forEach(k => keysSet.add(k));
                });
                const keys = Array.from(keysSet);

                const getVal = (row, fieldOptions) => {
                    const foundKey = keys.find(k => fieldOptions.includes(k.toLowerCase().trim()));
                    return foundKey ? row[foundKey] : null;
                };

                const mappedQuestions = [];
                let rowNum = 1; // track row number for user error reporting

                for (const row of jsonData) {
                    rowNum++;

                    const moduleNamesRaw = getVal(row, ["module names (semicolon separated)", "module names", "module name", "module_name", "module"]);
                    const valuationTypeRaw = getVal(row, ["valuation type", "valuation_type", "valuation"]);
                    const language = getVal(row, ["language"]) || "English";
                    const questionType = getVal(row, ["question type", "question_type", "type"]);
                    const questionText = getVal(row, ["question text", "question_text", "question"]);
                    const optA = getVal(row, ["option a", "option_a", "option1", "a"]);
                    const optB = getVal(row, ["option b", "option_b", "option2", "b"]);
                    const optC = getVal(row, ["option c", "option_c", "option3", "c"]);
                    const optD = getVal(row, ["option d", "option_d", "option4", "d"]);
                    const correctAnswerRaw = getVal(row, ["correct answer", "correct_answer", "answer", "correct"]);

                    if (!moduleNamesRaw) {
                        throw new Error(`Row ${rowNum}: Module Name is missing.`);
                    }
                    if (!questionText) {
                        throw new Error(`Row ${rowNum}: Question Text is missing.`);
                    }
                    if (!questionType) {
                        throw new Error(`Row ${rowNum}: Question Type is missing.`);
                    }
                    if (!correctAnswerRaw) {
                        throw new Error(`Row ${rowNum}: Correct Answer is missing.`);
                    }

                    // Map multiple module names to module IDs
                    const moduleNames = String(moduleNamesRaw)
                        .split(";")
                        .map(m => m.trim())
                        .filter(Boolean);

                    const targetModuleIds = [];
                    for (const name of moduleNames) {
                        const matchMod = allModulesList.find(m => m.module_name.toLowerCase().trim() === name.toLowerCase());
                        if (!matchMod) {
                            throw new Error(`Row ${rowNum}: Training module "${name}" not found in database.`);
                        }
                        targetModuleIds.push(matchMod.id);
                    }
                    if (targetModuleIds.length === 0) {
                        throw new Error(`Row ${rowNum}: Please select/provide at least one training module.`);
                    }

                    // Parse Valuation Type
                    let valType = "Both";
                    if (valuationTypeRaw) {
                        const rawType = String(valuationTypeRaw).trim().toLowerCase();
                        if (rawType.includes("pre")) valType = "Pre";
                        else if (rawType.includes("post")) valType = "Post";
                        else if (rawType.includes("both")) valType = "Both";
                        else {
                            throw new Error(`Row ${rowNum}: Valuation Type must be Pre, Post, or Both.`);
                        }
                    }

                    const normalizedType = String(questionType).trim();
                    const qType = (normalizedType.toLowerCase() === "true/false" || normalizedType.toLowerCase() === "true or false")
                        ? "True/False"
                        : "MCQ";

                    const normalizedLanguage = String(language).trim().toLowerCase() === "hindi" ? "Hindi" : "English";

                    let optionsArray = [];
                    let finalCorrectAnswer = "";

                    if (qType === "MCQ") {
                        if (!optA || !optB) {
                            throw new Error(`Row ${rowNum}: Option A and Option B are required for MCQ questions.`);
                        }
                        
                        optionsArray = [String(optA).trim(), String(optB).trim()];
                        if (optC) optionsArray.push(String(optC).trim());
                        if (optD) optionsArray.push(String(optD).trim());

                        const ansLetter = String(correctAnswerRaw).trim().toUpperCase();
                        if (ansLetter === "A") {
                            finalCorrectAnswer = String(optA).trim();
                        } else if (ansLetter === "B") {
                            finalCorrectAnswer = String(optB).trim();
                        } else if (ansLetter === "C") {
                            if (!optC) throw new Error(`Row ${rowNum}: Correct Answer is specified as C, but Option C is empty.`);
                            finalCorrectAnswer = String(optC).trim();
                        } else if (ansLetter === "D") {
                            if (!optD) throw new Error(`Row ${rowNum}: Correct Answer is specified as D, but Option D is empty.`);
                            finalCorrectAnswer = String(optD).trim();
                        } else {
                            // fallback: if user wrote the exact option content instead of letter, match it
                            const exactMatch = optionsArray.find(opt => opt.toLowerCase() === ansLetter.toLowerCase());
                            if (!exactMatch) {
                                throw new Error(`Row ${rowNum}: Correct Answer "${correctAnswerRaw}" must be A, B, C, or D (or match one of the option texts exactly).`);
                            }
                            finalCorrectAnswer = exactMatch;
                        }
                    } else {
                        // True/False
                        optionsArray = ["True", "False"];
                        const ansStr = String(correctAnswerRaw).trim().toLowerCase();
                        if (ansStr === "true" || ansStr === "yes" || ansStr === "t" || ansStr === "a") {
                            finalCorrectAnswer = "True";
                        } else if (ansStr === "false" || ansStr === "no" || ansStr === "f" || ansStr === "b") {
                            finalCorrectAnswer = "False";
                        } else {
                            throw new Error(`Row ${rowNum}: Correct Answer "${correctAnswerRaw}" must be True or False.`);
                        }
                    }

                    mappedQuestions.push({
                        moduleIds: targetModuleIds,
                        valuationType: valType,
                        language: normalizedLanguage,
                        questionType: qType,
                        questionText: String(questionText).trim(),
                        options: optionsArray,
                        correctAnswer: finalCorrectAnswer
                    });
                }

                // Send bulk insert to backend
                const importRes = await importQuestions(mappedQuestions);
                if (importRes.data.success) {
                    toast.success(importRes.data.message || `Successfully imported ${mappedQuestions.length} questions.`);
                    await loadData();
                } else {
                    toast.error(importRes.data.message || "Failed to import questions.");
                }
            } catch (err) {
                console.error("Error reading/importing Excel:", err);
                toast.error(err.message || "Failed to process import file.");
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

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteClick = async (row) => {
        if (!window.confirm(`Are you sure you want to delete this question?`)) return;

        try {
            const res = await deleteQuestion(row.id);
            if (res.data && res.data.success) {
                toast.success("Question deleted successfully");
                loadData();
            } else {
                toast.error(res.data?.message || "Failed to delete question");
            }
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Error deleting question");
        }
    };

    // Columns for DataTable
    const columns = useMemo(() => [
        {
            key: "id",
            label: "Sr No",
            render: (row) => questions.indexOf(row) + 1,
            sortable: false,
        },
        {
            key: "modules",
            label: "Module Association",
            sortable: false,
            render: (row) => {
                const associatedModules = Array.isArray(row.modules) ? row.modules : [];
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {associatedModules.length === 0 ? (
                            <span className="text-slate-400 text-xs">N/A</span>
                        ) : (
                            associatedModules.map((m, idx) => (
                                <span key={idx} className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded border border-blue-200 truncate font-semibold max-w-[130px]" title={m.name}>
                                    {m.name}
                                </span>
                            ))
                        )}
                    </div>
                );
            }
        },
        {
            key: "valuation_type",
            label: "Valuation Type",
            sortable: true,
            render: (row) => {
                const valType = row.valuation_type || "Both";
                let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
                if (valType === "Pre") {
                    colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
                } else if (valType === "Post") {
                    colorClass = "bg-pink-50 text-pink-700 border-pink-200";
                }
                return (
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colorClass}`}>
                        {valType === "Both" ? "Both" : `${valType}-Validation`}
                    </span>
                );
            }
        },
        {
            key: "language",
            label: "Language",
            sortable: true,
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.language === "English" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                    {row.language}
                </span>
            )
        },
        {
            key: "question_type",
            label: "Question Type",
            sortable: true,
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${row.question_type === "MCQ" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {row.question_type}
                </span>
            )
        },
        {
            key: "question_text",
            label: "Question Text",
            sortable: true,
            render: (row) => <div className="max-w-xs truncate font-medium text-slate-800" title={row.question_text}>{row.question_text}</div>
        },
        {
            key: "options",
            label: "Options",
            render: (row) => {
                const opts = Array.isArray(row.options) ? row.options : [];
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {opts.map((o, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                                {o}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: "correct_answer",
            label: "Correct Answer",
            sortable: true,
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs">
                    <i className="fa-solid fa-check text-[10px]"></i> {row.correct_answer}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (row) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {canUpdate && (
                        <button
                            onClick={() => navigate(`/admin/question-bank/edit/${row.id}`)}
                            style={{
                                display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                borderRadius: 8, border: "1px solid #c2d0eb", background: "#f0f3fa", color: "#253361", cursor: "pointer"
                            }}
                            title="Edit Question"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
                            </svg>
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={() => handleDeleteClick(row)}
                            style={{
                                display: "flex", width: 32, height: 32, alignItems: "center", justifyContent: "center",
                                borderRadius: 8, border: "1px solid #fecdd3", background: "#fff1f2", color: "#be123c", cursor: "pointer"
                            }}
                            title="Delete Question"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{ width: 15, height: 15 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ], [canUpdate, canDelete, questions, navigate]);

    // Custom action buttons group containing Export Template, Import Excel, and Create New
    const actionButton = canWrite && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImport}
                accept=".xlsx, .xls"
                style={{ display: "none" }}
            />
            {/* Export Template Button */}
            <button
                onClick={handleExportTemplate}
                style={{
                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                    borderRadius: 9, border: "1.5px solid #cbd5e1", background: "#fff", color: "#253361",
                    cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                title="Export Excel Template"
            >
                <i className="fa-solid fa-file-export" style={{ fontSize: 14 }}></i>
            </button>

            {/* Import Button */}
            <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                    borderRadius: 9, border: "1.5px solid #cbd5e1", background: "#fff", color: "#253361",
                    cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                title="Import Excel File"
            >
                <i className="fa-solid fa-file-import" style={{ fontSize: 14 }}></i>
            </button>

            {/* Create New Button */}
            <button
                onClick={() => navigate("/admin/question-bank/create")}
                style={{
                    display: "flex", width: 40, height: 40, alignItems: "center", justifyContent: "center",
                    borderRadius: 9, background: "linear-gradient(135deg,#253361,#1a2446)", color: "#fff",
                    border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(37,51,97,0.35)", transition: "all 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                onMouseLeave={e => e.currentTarget.style.opacity = 1}
                title="Add New Question"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <div className="flex-1 p-6 w-full mx-auto">
                {loading ? (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
                        {questions.length === 0 && loading ? "Processing import file and loading data..." : "Loading Question Bank data..."}
                    </div>
                ) : (
                    <DataTable
                        title="Question Bank"
                        columns={columns}
                        data={questions}
                        searchPlaceholder="Search questions by text, module, language..."
                        tableId="question_bank_master"
                        actionButton={actionButton}
                    />
                )}
            </div>
        </div>
    );
}
