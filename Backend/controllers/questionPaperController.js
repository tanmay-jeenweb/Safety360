const {
    createQuestionPaper,
    getAllQuestionPapers,
    getQuestionPaperById,
    updateQuestionPaper,
    deleteQuestionPaper
} = require("../models/questionPaperModel.js");
const { createAuditLog } = require("../models/auditLogModel.js");

// ─── Add Question Paper ──────────────────────────────────────────────────────
const addQuestionPaperController = async (req, res) => {
    try {
        const { name, examType, moduleId, questions } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Question Paper name is required" });
        }
        if (!examType || (examType !== "Pre" && examType !== "Post")) {
            return res.status(400).json({ success: false, message: "Exam Type must be Pre or Post" });
        }
        if (!moduleId) {
            return res.status(400).json({ success: false, message: "Module association is required" });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: "At least one question is required for a question paper" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const result = await createQuestionPaper(req.body, addedBy);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Paper Master',
            'created',
            null,
            { id: result.insertId, ...req.body, added_by: addedBy }
        );

        res.status(201).json({
            success: true,
            message: "Question Paper created successfully",
            questionPaperId: result.insertId
        });
    } catch (error) {
        console.error("Error creating question paper:", error);
        res.status(500).json({ success: false, message: "Failed to create question paper" });
    }
};

// ─── Get All Question Papers ─────────────────────────────────────────────────
const getAllQuestionPapersController = async (req, res) => {
    try {
        const papers = await getAllQuestionPapers();
        res.status(200).json({
            success: true,
            data: papers
        });
    } catch (error) {
        console.error("Error fetching question papers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch question papers" });
    }
};

// ─── Get Question Paper By ID ────────────────────────────────────────────────
const getQuestionPaperByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const paper = await getQuestionPaperById(id);
        if (!paper) {
            return res.status(404).json({ success: false, message: "Question Paper not found" });
        }

        res.status(200).json({
            success: true,
            data: paper
        });
    } catch (error) {
        console.error("Error fetching question paper by ID:", error);
        res.status(500).json({ success: false, message: "Failed to fetch question paper details" });
    }
};

// ─── Update Question Paper ───────────────────────────────────────────────────
const updateQuestionPaperController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, examType, moduleId, questions } = req.body;

        const existing = await getQuestionPaperById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Question Paper not found" });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Question Paper name is required" });
        }
        if (!examType || (examType !== "Pre" && examType !== "Post")) {
            return res.status(400).json({ success: false, message: "Exam Type must be Pre or Post" });
        }
        if (!moduleId) {
            return res.status(400).json({ success: false, message: "Module association is required" });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: "At least one question is required" });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await updateQuestionPaper(id, req.body);

        await createAuditLog(
            req.user.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Paper Master',
            'updated',
            existing,
            { id, ...req.body }
        );

        res.status(200).json({
            success: true,
            message: "Question Paper updated successfully"
        });
    } catch (error) {
        console.error("Error updating question paper:", error);
        res.status(500).json({ success: false, message: "Failed to update question paper" });
    }
};

// ─── Delete Question Paper ───────────────────────────────────────────────────
const deleteQuestionPaperController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getQuestionPaperById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Question Paper not found" });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteQuestionPaper(id);

        await createAuditLog(
            req.user.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Paper Master',
            'deleted',
            existing,
            null
        );

        res.status(200).json({
            success: true,
            message: "Question Paper deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting question paper:", error);
        res.status(500).json({ success: false, message: "Failed to delete question paper" });
    }
};

module.exports = {
    addQuestionPaperController,
    getAllQuestionPapersController,
    getQuestionPaperByIdController,
    updateQuestionPaperController,
    deleteQuestionPaperController
};
