const {
    createFeedbackQuestion,
    getAllFeedbackQuestions,
    getFeedbackQuestionById,
    updateFeedbackQuestion,
    deleteFeedbackQuestion
} = require("../models/feedbackQuestionBankModel.js");
const { createAuditLog } = require("../models/auditLogModel.js");

// ─── Add Question ────────────────────────────────────────────────────────────
const addFeedbackQuestionController = async (req, res) => {
    try {
        const { language, questionType, questionText } = req.body;

        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const result = await createFeedbackQuestion(req.body, addedBy);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Question Bank Master',
            'created',
            null,
            { id: result.insertId, ...req.body, added_by: addedBy }
        );

        res.status(201).json({
            success: true,
            message: "Feedback question added successfully",
            questionId: result.insertId
        });
    } catch (error) {
        console.error("Error adding feedback question:", error);
        res.status(500).json({ success: false, message: "Failed to add feedback question" });
    }
};

// ─── Get All Questions ───────────────────────────────────────────────────────
const getAllFeedbackQuestionsController = async (req, res) => {
    try {
        const questions = await getAllFeedbackQuestions();
        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error("Error fetching feedback questions:", error);
        res.status(500).json({ success: false, message: "Failed to fetch feedback questions" });
    }
};

// ─── Get Question By ID ──────────────────────────────────────────────────────
const getFeedbackQuestionByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await getFeedbackQuestionById(id);
        if (!question) {
            return res.status(404).json({ success: false, message: "Feedback question not found" });
        }

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (error) {
        console.error("Error fetching feedback question by ID:", error);
        res.status(500).json({ success: false, message: "Failed to fetch feedback question" });
    }
};

// ─── Update Question ─────────────────────────────────────────────────────────
const updateFeedbackQuestionController = async (req, res) => {
    try {
        const { id } = req.params;
        const { language, questionType, questionText } = req.body;

        const existing = await getFeedbackQuestionById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Feedback question not found" });
        }

        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await updateFeedbackQuestion(id, req.body);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Question Bank Master',
            'updated',
            existing,
            { id, ...req.body, added_by: addedBy }
        );

        res.status(200).json({
            success: true,
            message: "Feedback question updated successfully"
        });
    } catch (error) {
        console.error("Error updating feedback question:", error);
        res.status(500).json({ success: false, message: "Failed to update feedback question" });
    }
};

// ─── Delete Question ─────────────────────────────────────────────────────────
const deleteFeedbackQuestionController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getFeedbackQuestionById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Feedback question not found" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteFeedbackQuestion(id);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Feedback Question Bank Master',
            'deleted',
            existing,
            null
        );

        res.status(200).json({
            success: true,
            message: "Feedback question deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting feedback question:", error);
        res.status(500).json({ success: false, message: "Failed to delete feedback question" });
    }
};

module.exports = {
    addFeedbackQuestionController,
    getAllFeedbackQuestionsController,
    getFeedbackQuestionByIdController,
    updateFeedbackQuestionController,
    deleteFeedbackQuestionController
};
