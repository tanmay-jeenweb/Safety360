const {
    createFeedbackPaper,
    getAllFeedbackPapers,
    getFeedbackPaperById,
    updateFeedbackPaper,
    deleteFeedbackPaper
} = require("../models/feedbackPaperModel.js");
const { createAuditLog } = require("../models/auditLogModel.js");

// ─── Add Feedback Paper ──────────────────────────────────────────────────────
const addFeedbackPaperController = async (req, res) => {
    try {
        const { name, questions } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Feedback Paper name is required" });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: "At least one question is required for a feedback paper" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const result = await createFeedbackPaper(req.body, addedBy);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Paper Master',
            'created',
            null,
            { id: result.insertId, ...req.body, added_by: addedBy }
        );

        res.status(201).json({
            success: true,
            message: "Feedback Paper created successfully",
            feedbackPaperId: result.insertId
        });
    } catch (error) {
        console.error("Error creating feedback paper:", error);
        res.status(500).json({ success: false, message: "Failed to create feedback paper" });
    }
};

// ─── Get All Feedback Papers ─────────────────────────────────────────────────
const getAllFeedbackPapersController = async (req, res) => {
    try {
        const papers = await getAllFeedbackPapers();
        res.status(200).json({
            success: true,
            data: papers
        });
    } catch (error) {
        console.error("Error fetching feedback papers:", error);
        res.status(500).json({ success: false, message: "Failed to fetch feedback papers" });
    }
};

// ─── Get Feedback Paper By ID ────────────────────────────────────────────────
const getFeedbackPaperByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const paper = await getFeedbackPaperById(id);
        if (!paper) {
            return res.status(404).json({ success: false, message: "Feedback Paper not found" });
        }

        res.status(200).json({
            success: true,
            data: paper
        });
    } catch (error) {
        console.error("Error fetching feedback paper by ID:", error);
        res.status(500).json({ success: false, message: "Failed to fetch feedback paper details" });
    }
};

// ─── Update Feedback Paper ───────────────────────────────────────────────────
const updateFeedbackPaperController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, questions } = req.body;

        const existing = await getFeedbackPaperById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Feedback Paper not found" });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: "Feedback Paper name is required" });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: "At least one question is required for a feedback paper" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await updateFeedbackPaper(id, req.body);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Paper Master',
            'updated',
            existing,
            { id, ...req.body, added_by: addedBy }
        );

        res.status(200).json({
            success: true,
            message: "Feedback Paper updated successfully"
        });
    } catch (error) {
        console.error("Error updating feedback paper:", error);
        res.status(500).json({ success: false, message: "Failed to update feedback paper" });
    }
};

// ─── Delete Feedback Paper ───────────────────────────────────────────────────
const deleteFeedbackPaperController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getFeedbackPaperById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Feedback Paper not found" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteFeedbackPaper(id);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Paper Master',
            'deleted',
            existing,
            null
        );

        res.status(200).json({
            success: true,
            message: "Feedback Paper deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting feedback paper:", error);
        res.status(500).json({ success: false, message: "Failed to delete feedback paper" });
    }
};

module.exports = {
    addFeedbackPaperController,
    getAllFeedbackPapersController,
    getFeedbackPaperByIdController,
    updateFeedbackPaperController,
    deleteFeedbackPaperController
};
