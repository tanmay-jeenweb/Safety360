const {
    createDepartment,
    getAllDepartments,
    updateDepartment,
    deleteDepartment,
    getDepartmentById
} = require('../models/departmentModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addDepartment = async (req, res) => {
    try {
        const { departmentName } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!departmentName || !departmentName.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const result = await createDepartment(departmentName.trim(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Department Master',
            'created',
            null,
            {
                id: newId,
                department_name: departmentName.trim(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Department added successfully',
            data: { id: newId, department_name: departmentName.trim(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Department name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllDepartmentsController = async (req, res) => {
    try {
        const departments = await getAllDepartments();
        res.status(200).json({
            success: true,
            message: 'Departments retrieved successfully',
            data: departments
        });
    } catch (error) {
        console.error('Error retrieving departments:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateDepartmentController = async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentName } = req.body;

        if (!departmentName || !departmentName.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getDepartmentById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        await updateDepartment(id, departmentName.trim());
        const afterData = await getDepartmentById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Department Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating department:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Department name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteDepartmentController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getDepartmentById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Department not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteDepartment(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Department Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addDepartment,
    getAllDepartmentsController,
    updateDepartmentController,
    deleteDepartmentController
};
