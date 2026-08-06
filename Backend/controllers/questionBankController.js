const {
    createQuestion,
    getAllQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    getQuestionsByModule,
    bulkCreateQuestions
} = require("../models/questionBankModel.js");
const { createAuditLog } = require("../models/auditLogModel.js");

// ─── Add Question ────────────────────────────────────────────────────────────
const addQuestionController = async (req, res) => {
    try {
        const { moduleId, language, questionType, questionText, options, correctAnswer } = req.body;

        if (!moduleId) {
            return res.status(400).json({ success: false, message: "Module association is required" });
        }
        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }
        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ success: false, message: "At least 2 options are required" });
        }
        if (!correctAnswer || !correctAnswer.trim()) {
            return res.status(400).json({ success: false, message: "Correct answer selection is required" });
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const result = await createQuestion(req.body, addedBy);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Bank Master',
            'created',
            null,
            { id: result.insertId, ...req.body, added_by: addedBy }
        );

        res.status(201).json({
            success: true,
            message: "Question added successfully",
            questionId: result.insertId
        });
    } catch (error) {
        console.error("Error adding question:", error);
        res.status(500).json({ success: false, message: "Failed to add question" });
    }
};

// ─── Get All Questions ───────────────────────────────────────────────────────
const getAllQuestionsController = async (req, res) => {
    try {
        const questions = await getAllQuestions();
        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ success: false, message: "Failed to fetch questions" });
    }
};

// ─── Get Question By ID ──────────────────────────────────────────────────────
const getQuestionByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const question = await getQuestionById(id);
        if (!question) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        res.status(200).json({
            success: true,
            data: question
        });
    } catch (error) {
        console.error("Error fetching question by ID:", error);
        res.status(500).json({ success: false, message: "Failed to fetch question" });
    }
};

// ─── Update Question ─────────────────────────────────────────────────────────
const updateQuestionController = async (req, res) => {
    try {
        const { id } = req.params;
        const { moduleId, questionText, options, correctAnswer } = req.body;

        const existing = await getQuestionById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        if (!moduleId) {
            return res.status(400).json({ success: false, message: "Module association is required" });
        }
        if (!questionText || !questionText.trim()) {
            return res.status(400).json({ success: false, message: "Question text is required" });
        }
        if (!Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ success: false, message: "At least 2 options are required" });
        }
        if (!correctAnswer || !correctAnswer.trim()) {
            return res.status(400).json({ success: false, message: "Correct answer selection is required" });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await updateQuestion(id, req.body);

        await createAuditLog(
            req.user.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Bank Master',
            'updated',
            existing,
            { id, ...req.body }
        );

        res.status(200).json({
            success: true,
            message: "Question updated successfully"
        });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({ success: false, message: "Failed to update question" });
    }
};

// ─── Delete Question ─────────────────────────────────────────────────────────
const deleteQuestionController = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await getQuestionById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Question not found" });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteQuestion(id);

        await createAuditLog(
            req.user.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Bank Master',
            'deleted',
            existing,
            null
        );

        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({ success: false, message: "Failed to delete question" });
    }
};

// ─── Get Questions By Module ID ──────────────────────────────────────────────
const getQuestionsByModuleController = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const questions = await getQuestionsByModule(moduleId);
        res.status(200).json({
            success: true,
            data: questions
        });
    } catch (error) {
        console.error("Error fetching questions by module:", error);
        res.status(500).json({ success: false, message: "Failed to fetch questions for module" });
    }
};

// ─── Bulk Import Questions ────────────────────────────────────────────────────
const bulkAddQuestionsController = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, message: "A list of questions is required for import." });
        }

        // Basic sanity check
        for (const q of questions) {
            if (!q.moduleId) {
                return res.status(400).json({ success: false, message: "Module association is required for all questions." });
            }
            if (!q.questionText || !q.questionText.trim()) {
                return res.status(400).json({ success: false, message: "Question text is required for all questions." });
            }
            if (!Array.isArray(q.options) || q.options.length < 2) {
                return res.status(400).json({ success: false, message: "At least 2 options are required for MCQ questions." });
            }
            if (!q.correctAnswer || !q.correctAnswer.trim()) {
                return res.status(400).json({ success: false, message: "Correct answer is required for all questions." });
            }
        }

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        
        await bulkCreateQuestions(questions, addedBy);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Question Bank Master',
            'bulk_imported',
            null,
            { count: questions.length }
        );

        res.status(201).json({
            success: true,
            message: `Successfully imported ${questions.length} questions.`
        });
    } catch (error) {
        console.error("Error bulk importing questions:", error);
        res.status(500).json({ success: false, message: "Failed to import questions." });
    }
};

module.exports = {
    addQuestionController,
    getAllQuestionsController,
    getQuestionByIdController,
    updateQuestionController,
    deleteQuestionController,
    getQuestionsByModuleController,
    bulkAddQuestionsController
};
