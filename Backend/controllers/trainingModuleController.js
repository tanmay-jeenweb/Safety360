const {
    createTrainingModule,
    getAllTrainingModules,
    updateTrainingModule,
    deleteTrainingModule,
    getTrainingModuleById
} = require('../models/trainingModuleModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addTrainingModule = async (req, res) => {
    try {
        const {
            moduleName,
            categoryId,
            durationHours,
            validityMonths,
            passingMarks,
            refresherMonths,
            practicalRequired,
            preTestQs,
            postTestQs,
            certificateApplicable
        } = req.body;

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!moduleName || !moduleName.trim()) {
            return res.status(400).json({ success: false, message: 'Module name is required' });
        }
        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        const data = {
            moduleName: moduleName.trim(),
            categoryId: parseInt(categoryId, 10),
            durationHours: parseFloat(durationHours) || 0,
            validityMonths: parseInt(validityMonths, 10) || 0,
            passingMarks: parseInt(passingMarks, 10) || 0,
            refresherMonths: parseInt(refresherMonths, 10) || 0,
            practicalRequired: practicalRequired === 'Yes' ? 'Yes' : 'No',
            preTestQs: parseInt(preTestQs, 10) || 0,
            postTestQs: parseInt(postTestQs, 10) || 0,
            certificateApplicable: certificateApplicable === 'Yes' ? 'Yes' : 'No'
        };

        const result = await createTrainingModule(data, addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Training Module Master',
            'created',
            null,
            { id: newId, ...data, added_by: addedBy, device_id: deviceId }
        );

        res.status(201).json({
            success: true,
            message: 'Training module added successfully',
            data: { id: newId, ...data, added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding training module:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Module name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllTrainingModulesController = async (req, res) => {
    try {
        const modules = await getAllTrainingModules();
        res.status(200).json({
            success: true,
            message: 'Training modules retrieved successfully',
            data: modules
        });
    } catch (error) {
        console.error('Error retrieving training modules:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getTrainingModuleByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const moduleData = await getTrainingModuleById(id);
        if (!moduleData) {
            return res.status(404).json({ success: false, message: 'Training module not found' });
        }
        res.status(200).json({
            success: true,
            data: moduleData
        });
    } catch (error) {
        console.error('Error retrieving training module:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateTrainingModuleController = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            moduleName,
            categoryId,
            durationHours,
            validityMonths,
            passingMarks,
            refresherMonths,
            practicalRequired,
            preTestQs,
            postTestQs,
            certificateApplicable
        } = req.body;

        if (!moduleName || !moduleName.trim()) {
            return res.status(400).json({ success: false, message: 'Module name is required' });
        }
        if (!categoryId) {
            return res.status(400).json({ success: false, message: 'Category is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getTrainingModuleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Training module not found' });
        }

        const data = {
            moduleName: moduleName.trim(),
            categoryId: parseInt(categoryId, 10),
            durationHours: parseFloat(durationHours) || 0,
            validityMonths: parseInt(validityMonths, 10) || 0,
            passingMarks: parseInt(passingMarks, 10) || 0,
            refresherMonths: parseInt(refresherMonths, 10) || 0,
            practicalRequired: practicalRequired === 'Yes' ? 'Yes' : 'No',
            preTestQs: parseInt(preTestQs, 10) || 0,
            postTestQs: parseInt(postTestQs, 10) || 0,
            certificateApplicable: certificateApplicable === 'Yes' ? 'Yes' : 'No'
        };

        await updateTrainingModule(id, data);
        const afterData = await getTrainingModuleById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Training Module Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Training module updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating training module:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Module name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteTrainingModuleController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getTrainingModuleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Training module not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteTrainingModule(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Training Module Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Training module deleted successfully' });
    } catch (error) {
        console.error('Error deleting training module:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addTrainingModule,
    getAllTrainingModulesController,
    getTrainingModuleByIdController,
    updateTrainingModuleController,
    deleteTrainingModuleController
};
