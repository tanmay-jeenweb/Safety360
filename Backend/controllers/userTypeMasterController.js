const {
    createUserType,
    getAllUserTypes,
    updateUserType,
    deleteUserType,
    getUserTypeById
} = require('../models/userTypeModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const filterActivePermissions = (perms) => {
    if (!Array.isArray(perms)) return [];
    return perms.filter(p => p.canRead || p.canWrite || p.canUpdate || p.canDelete);
};

const addUserType = async (req, res) => {
    try {
        const { typeName, permissions } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!typeName) {
            return res.status(400).json({ success: false, message: 'Type name is required' });
        }

        const userType = await createUserType(typeName, addedBy, deviceId, permissions || []);
        const activePerms = filterActivePermissions(permissions || []);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'User Type Master',
            'created',
            null,
            {
                id: userType.insertId,
                type_name: typeName,
                permissions: activePerms,
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'User type added successfully',
            data: userType
        });
    } catch (error) {
        console.error('Error adding user type:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllUserTypesController = async (req, res) => {
    try {
        const userTypes = await getAllUserTypes();

        res.status(200).json({
            success: true,
            message: 'User types retrieved successfully',
            data: userTypes
        });
    } catch (error) {
        console.error('Error retrieving user types:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateUserTypeController = async (req, res) => {
    try {
        const { id } = req.params;
        const { typeName, permissions } = req.body;

        if (!typeName) {
            return res.status(400).json({ success: false, message: 'Type name is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getUserTypeById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'User type not found' });
        }

        await updateUserType(id, typeName, permissions || []);

        const cleanedBefore = {
            ...beforeData,
            permissions: filterActivePermissions(beforeData.permissions)
        };
        const activePerms = filterActivePermissions(permissions || []);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'User Type Master',
            'updated',
            cleanedBefore,
            {
                ...cleanedBefore,
                type_name: typeName,
                permissions: activePerms
            }
        );

        res.status(200).json({ success: true, message: 'User type updated successfully' });
    } catch (error) {
        console.error('Error updating user type:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteUserTypeController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getUserTypeById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'User type not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteUserType(id);
        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'User Type Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'User type deleted' });
    } catch (error) {
        console.error('Error deleting user type:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    addUserType,
    getAllUserTypesController,
    updateUserTypeController,
    deleteUserTypeController
};