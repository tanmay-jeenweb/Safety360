const express = require('express');
const {
    addEmployee,
    getAllEmployeesController,
    updateEmployeeController,
    deleteEmployeeController,
    importEmployeesController
} = require('../controllers/employeeController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('employee_master', 'write'), addEmployee);
router.post('/import', verifyToken, verifyPermission('employee_master', 'write'), importEmployeesController);
router.get('/all', verifyToken, verifyPermission('employee_master', 'read'), getAllEmployeesController);
router.put('/update/:id', verifyToken, verifyPermission('employee_master', 'update'), updateEmployeeController);
router.delete('/delete/:id', verifyToken, verifyPermission('employee_master', 'delete'), deleteEmployeeController);

module.exports = router;
