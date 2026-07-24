const {
    createRatingScale,
    getAllRatingScales,
    updateRatingScale,
    deleteRatingScale,
    getRatingScaleById
} = require('../models/ratingScaleModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addRatingScale = async (req, res) => {
    try {
        const { ratingValue, meaning, colorHex } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        const parsedRating = parseInt(ratingValue, 10);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating value must be an integer between 1 and 5' });
        }
        if (!meaning || !meaning.trim()) {
            return res.status(400).json({ success: false, message: 'Meaning is required' });
        }
        if (!colorHex || !colorHex.trim()) {
            return res.status(400).json({ success: false, message: 'Color Hex is required' });
        }

        const formattedHex = colorHex.trim().startsWith('#') ? colorHex.trim() : `#${colorHex.trim()}`;

        const result = await createRatingScale(parsedRating, meaning.trim(), formattedHex, addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Rating Scale Master',
            'created',
            null,
            {
                id: newId,
                rating_value: parsedRating,
                meaning: meaning.trim(),
                color_hex: formattedHex,
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Rating scale added successfully',
            data: { id: newId, rating_value: parsedRating, meaning: meaning.trim(), color_hex: formattedHex, added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding rating scale:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllRatingScalesController = async (req, res) => {
    try {
        const ratingScales = await getAllRatingScales();
        res.status(200).json({
            success: true,
            message: 'Rating scales retrieved successfully',
            data: ratingScales
        });
    } catch (error) {
        console.error('Error retrieving rating scales:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateRatingScaleController = async (req, res) => {
    try {
        const { id } = req.params;
        const { ratingValue, meaning, colorHex } = req.body;

        const parsedRating = parseInt(ratingValue, 10);
        if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({ success: false, message: 'Rating value must be an integer between 1 and 5' });
        }
        if (!meaning || !meaning.trim()) {
            return res.status(400).json({ success: false, message: 'Meaning is required' });
        }
        if (!colorHex || !colorHex.trim()) {
            return res.status(400).json({ success: false, message: 'Color Hex is required' });
        }

        const formattedHex = colorHex.trim().startsWith('#') ? colorHex.trim() : `#${colorHex.trim()}`;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        
        const beforeData = await getRatingScaleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Rating scale not found' });
        }

        await updateRatingScale(id, parsedRating, meaning.trim(), formattedHex);
        const afterData = await getRatingScaleById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Rating Scale Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Rating scale updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating rating scale:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteRatingScaleController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getRatingScaleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Rating scale not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteRatingScale(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Rating Scale Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Rating scale deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating scale:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addRatingScale,
    getAllRatingScalesController,
    updateRatingScaleController,
    deleteRatingScaleController
};
