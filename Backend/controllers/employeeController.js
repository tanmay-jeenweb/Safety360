const {
    createEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    importEmployees
} = require('../models/employeeModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');
const bcrypt = require('bcryptjs');

const addEmployee = async (req, res) => {
    try {
        const {
            employeeCode,
            fullName,
            departmentId,
            designation,
            employeeType,
            contractorName,
            clientId,
            siteId,
            phoneNo,
            email,
            joiningDate
        } = req.body;

        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!employeeCode || !employeeCode.trim()) {
            return res.status(400).json({ success: false, message: 'Employee Code is required' });
        }
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'Full Name is required' });
        }
        if (!departmentId) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }
        if (!designation || !designation.trim()) {
            return res.status(400).json({ success: false, message: 'Designation is required' });
        }
        if (!employeeType || !['Direct', 'Contractor'].includes(employeeType)) {
            return res.status(400).json({ success: false, message: 'Employee Type must be Direct or Contractor' });
        }
        if (employeeType === 'Contractor' && (!contractorName || !contractorName.trim())) {
            return res.status(400).json({ success: false, message: 'Contractor Name is required for Contractor employee type' });
        }
        if (!phoneNo || !phoneNo.trim()) {
            return res.status(400).json({ success: false, message: 'Phone Number is required' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        if (!joiningDate) {
            return res.status(400).json({ success: false, message: 'Joining Date is required' });
        }
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Client is required' });
        }
        if (!siteId) {
            return res.status(400).json({ success: false, message: 'Site is required' });
        }

        const hashedPassword = await bcrypt.hash(phoneNo.trim(), 10);

        const data = {
            employeeCode: employeeCode.trim(),
            fullName: fullName.trim(),
            departmentId: parseInt(departmentId, 10),
            designation: designation.trim(),
            employeeType,
            contractorName: employeeType === 'Contractor' ? contractorName.trim() : null,
            phoneNo: phoneNo.trim(),
            password: hashedPassword,
            email: email.trim(),
            joiningDate,
            clientId: parseInt(clientId, 10),
            siteId: parseInt(siteId, 10)
        };

        const result = await createEmployee(data, addedBy);
        const newId = result.insertId;

        // Strip password for log and response
        const { password, ...safeData } = data;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Employee Master',
            'created',
            null,
            { id: newId, ...safeData, added_by: addedBy, device_id: deviceId }
        );

        res.status(201).json({
            success: true,
            message: 'Employee added successfully',
            data: { id: newId, ...safeData, added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Employee Code or Email already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllEmployeesController = async (req, res) => {
    try {
        const employees = await getAllEmployees();
        res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully',
            data: employees
        });
    } catch (error) {
        console.error('Error retrieving employees:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employeeCode,
            fullName,
            departmentId,
            designation,
            employeeType,
            contractorName,
            clientId,
            siteId,
            phoneNo,
            email,
            joiningDate
        } = req.body;

        if (!employeeCode || !employeeCode.trim()) {
            return res.status(400).json({ success: false, message: 'Employee Code is required' });
        }
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'Full Name is required' });
        }
        if (!departmentId) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }
        if (!designation || !designation.trim()) {
            return res.status(400).json({ success: false, message: 'Designation is required' });
        }
        if (!employeeType || !['Direct', 'Contractor'].includes(employeeType)) {
            return res.status(400).json({ success: false, message: 'Employee Type must be Direct or Contractor' });
        }
        if (employeeType === 'Contractor' && (!contractorName || !contractorName.trim())) {
            return res.status(400).json({ success: false, message: 'Contractor Name is required for Contractor employee type' });
        }
        if (!phoneNo || !phoneNo.trim()) {
            return res.status(400).json({ success: false, message: 'Phone Number is required' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        if (!joiningDate) {
            return res.status(400).json({ success: false, message: 'Joining Date is required' });
        }
        if (!clientId) {
            return res.status(400).json({ success: false, message: 'Client is required' });
        }
        if (!siteId) {
            return res.status(400).json({ success: false, message: 'Site is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getEmployeeById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const data = {
            employeeCode: employeeCode.trim(),
            fullName: fullName.trim(),
            departmentId: parseInt(departmentId, 10),
            designation: designation.trim(),
            employeeType,
            contractorName: employeeType === 'Contractor' ? contractorName.trim() : null,
            phoneNo: phoneNo.trim(),
            email: email.trim(),
            joiningDate,
            clientId: parseInt(clientId, 10),
            siteId: parseInt(siteId, 10)
        };

        await updateEmployee(id, data);
        const afterData = await getEmployeeById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Employee Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Employee Code or Email already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteEmployeeController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getEmployeeById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteEmployee(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Employee Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const importEmployeesController = async (req, res) => {
    try {
        const records = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid records list'
            });
        }

        const results = await importEmployees(records, addedBy);

        try {
            await createAuditLog(
                addedBy,
                req.user?.name || req.user?.username || 'Unknown',
                deviceId,
                'Employee Master Import',
                'created',
                null,
                {
                    imported_count: records.length,
                    imported_at: new Date().toISOString()
                }
            );
        } catch (auditErr) {
            console.error("Failed to write audit log for employee import:", auditErr);
        }

        res.status(200).json({
            success: true,
            message: `Successfully processed ${records.length} employee records.`,
            data: results
        });
    } catch (error) {
        console.error('Error importing employee records:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during import'
        });
    }
};

module.exports = {
    addEmployee,
    getAllEmployeesController,
    updateEmployeeController,
    deleteEmployeeController,
    importEmployeesController
};
