const {
    createCertificateTemplate,
    getAllCertificateTemplates,
    updateCertificateTemplate,
    deleteCertificateTemplate,
    getCertificateTemplateById
} = require('../models/certificateTemplateModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addCertificateTemplate = async (req, res) => {
    try {
        const { formatPrefix } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!formatPrefix || !formatPrefix.trim()) {
            return res.status(400).json({ success: false, message: 'Formate prefix is required' });
        }

        const result = await createCertificateTemplate(formatPrefix.trim(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Certificate Template Master',
            'created',
            null,
            {
                id: newId,
                format_prefix: formatPrefix.trim(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Certificate template added successfully',
            data: { id: newId, format_prefix: formatPrefix.trim(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding certificate template:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Formate prefix already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllCertificateTemplatesController = async (req, res) => {
    try {
        const templates = await getAllCertificateTemplates();
        res.status(200).json({
            success: true,
            message: 'Certificate templates retrieved successfully',
            data: templates
        });
    } catch (error) {
        console.error('Error retrieving certificate templates:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateCertificateTemplateController = async (req, res) => {
    try {
        const { id } = req.params;
        const { formatPrefix } = req.body;

        if (!formatPrefix || !formatPrefix.trim()) {
            return res.status(400).json({ success: false, message: 'Formate prefix is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getCertificateTemplateById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Certificate template not found' });
        }

        await updateCertificateTemplate(id, formatPrefix.trim());
        const afterData = await getCertificateTemplateById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Certificate Template Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Certificate template updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating certificate template:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Formate prefix already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteCertificateTemplateController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getCertificateTemplateById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Certificate template not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteCertificateTemplate(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Certificate Template Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Certificate template deleted successfully' });
    } catch (error) {
        console.error('Error deleting certificate template:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addCertificateTemplate,
    getAllCertificateTemplatesController,
    updateCertificateTemplateController,
    deleteCertificateTemplateController
};
