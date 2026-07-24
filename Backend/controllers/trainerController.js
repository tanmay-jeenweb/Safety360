const {
    createTrainer,
    getAllTrainers,
    updateTrainer,
    deleteTrainer,
    getTrainerById
} = require('../models/trainerModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addTrainer = async (req, res) => {
    try {
        const { trainerName, trainerEmail } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!trainerName || !trainerName.trim()) {
            return res.status(400).json({ success: false, message: 'Trainer name is required' });
        }
        if (!trainerEmail || !trainerEmail.trim()) {
            return res.status(400).json({ success: false, message: 'Trainer email is required' });
        }

        const result = await createTrainer(trainerName.trim(), trainerEmail.trim().toLowerCase(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Trainer Master',
            'created',
            null,
            {
                id: newId,
                trainer_name: trainerName.trim(),
                trainer_email: trainerEmail.trim().toLowerCase(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Trainer added successfully',
            data: { id: newId, trainer_name: trainerName.trim(), trainer_email: trainerEmail.trim().toLowerCase(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding trainer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Trainer email already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllTrainersController = async (req, res) => {
    try {
        const trainers = await getAllTrainers();
        res.status(200).json({
            success: true,
            message: 'Trainers retrieved successfully',
            data: trainers
        });
    } catch (error) {
        console.error('Error retrieving trainers:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateTrainerController = async (req, res) => {
    try {
        const { id } = req.params;
        const { trainerName, trainerEmail } = req.body;

        if (!trainerName || !trainerName.trim()) {
            return res.status(400).json({ success: false, message: 'Trainer name is required' });
        }
        if (!trainerEmail || !trainerEmail.trim()) {
            return res.status(400).json({ success: false, message: 'Trainer email is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getTrainerById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        await updateTrainer(id, trainerName.trim(), trainerEmail.trim().toLowerCase());
        const afterData = await getTrainerById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Trainer Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Trainer updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating trainer:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Trainer email already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteTrainerController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getTrainerById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Trainer not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteTrainer(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Trainer Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Trainer deleted successfully' });
    } catch (error) {
        console.error('Error deleting trainer:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addTrainer,
    getAllTrainersController,
    updateTrainerController,
    deleteTrainerController
};
