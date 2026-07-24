const {
    createRole,
    getAllRoles,
    updateRole,
    deleteRole,
    getRoleById
} = require('../models/roleModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addRole = async (req, res) => {
    try {
        const { roleName } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!roleName || !roleName.trim()) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        const result = await createRole(roleName.trim(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Role Master',
            'created',
            null,
            {
                id: newId,
                role_name: roleName.trim(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Role added successfully',
            data: { id: newId, role_name: roleName.trim(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding role:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Role name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllRolesController = async (req, res) => {
    try {
        const roles = await getAllRoles();
        res.status(200).json({
            success: true,
            message: 'Roles retrieved successfully',
            data: roles
        });
    } catch (error) {
        console.error('Error retrieving roles:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateRoleController = async (req, res) => {
    try {
        const { id } = req.params;
        const { roleName } = req.body;

        if (!roleName || !roleName.trim()) {
            return res.status(400).json({ success: false, message: 'Role name is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getRoleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        await updateRole(id, roleName.trim());
        const afterData = await getRoleById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Role Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating role:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Role name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteRoleController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getRoleById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Role not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteRole(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Role Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addRole,
    getAllRolesController,
    updateRoleController,
    deleteRoleController
};
