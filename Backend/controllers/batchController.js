const {
    createBatch,
    getAllBatches,
    updateBatch,
    deleteBatch,
    getBatchById
} = require('../models/batchModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addBatch = async (req, res) => {
    try {
        const { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        // Validation - all fields are mandatory
        if (!clientId || !siteId || !trainingModuleId || !trainerId || !scheduledDate || !venue || !batchSize) {
            return res.status(400).json({ success: false, message: 'All fields are mandatory' });
        }

        const result = await createBatch({
            clientId,
            siteId,
            trainingModuleId,
            trainerId,
            scheduledDate,
            venue,
            batchSize,
            status: status || 'Draft'
        }, addedBy);

        const newId = result.insertId;
        const newBatch = await getBatchById(newId);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'created',
            null,
            newBatch
        );

        res.status(201).json({
            success: true,
            message: 'Batch added successfully',
            data: newBatch
        });
    } catch (error) {
        console.error('Error adding batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllBatchesController = async (req, res) => {
    try {
        const batches = await getAllBatches();
        res.status(200).json({
            success: true,
            message: 'Batches retrieved successfully',
            data: batches
        });
    } catch (error) {
        console.error('Error retrieving batches:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateBatchController = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status } = req.body;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        // Validation - all fields are mandatory
        if (!clientId || !siteId || !trainingModuleId || !trainerId || !scheduledDate || !venue || !batchSize || !status) {
            return res.status(400).json({ success: false, message: 'All fields are mandatory' });
        }

        const beforeData = await getBatchById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        await updateBatch(id, {
            clientId,
            siteId,
            trainingModuleId,
            trainerId,
            scheduledDate,
            venue,
            batchSize,
            status
        });

        const afterData = await getBatchById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Batch updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteBatchController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getBatchById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteBatch(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addBatch,
    getAllBatchesController,
    updateBatchController,
    deleteBatchController
};
