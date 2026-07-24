const {
    createSite,
    getAllSites,
    updateSite,
    deleteSite,
    getSiteById
} = require('../models/siteModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addSite = async (req, res) => {
    try {
        const { siteName, clientId } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!siteName || !siteName.trim()) {
            return res.status(400).json({ success: false, message: 'Site name is required' });
        }
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Client selection is required' });
        }

        const result = await createSite(siteName.trim(), clientId, addedBy);
        const newId = result.insertId;
        const siteData = await getSiteById(newId);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Site Master',
            'created',
            null,
            {
                id: newId,
                site_name: siteName.trim(),
                client_id: clientId,
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Site added successfully',
            data: siteData
        });
    } catch (error) {
        console.error('Error adding site:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Site name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllSitesController = async (req, res) => {
    try {
        const sites = await getAllSites();
        res.status(200).json({
            success: true,
            message: 'Sites retrieved successfully',
            data: sites
        });
    } catch (error) {
        console.error('Error retrieving sites:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateSiteController = async (req, res) => {
    try {
        const { id } = req.params;
        const { siteName, clientId } = req.body;

        if (!siteName || !siteName.trim()) {
            return res.status(400).json({ success: false, message: 'Site name is required' });
        }
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Client selection is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getSiteById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Site not found' });
        }

        await updateSite(id, siteName.trim(), clientId);
        const afterData = await getSiteById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Site Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Site updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating site:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Site name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteSiteController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getSiteById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Site not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteSite(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Site Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Site deleted successfully' });
    } catch (error) {
        console.error('Error deleting site:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addSite,
    getAllSitesController,
    updateSiteController,
    deleteSiteController
};
