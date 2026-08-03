const express = require('express');
const {
    addEmployee,
    getAllEmployeesController,
    updateEmployeeController,
    deleteEmployeeController,
    importEmployeesController
} = require('../controllers/employeeController.js');
const {
    getMyTestsController,
    getTestDetailsController,
    submitTestController,
    getMyDashboardController,
    changePasswordController,
    sendChangePasswordOtpController
} = require('../controllers/employeePortalController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

// Employee Portal routes
router.get('/my-tests', verifyToken, getMyTestsController);
router.get('/my-dashboard', verifyToken, getMyDashboardController);
router.get('/test-details/:batchId/:testType', verifyToken, getTestDetailsController);
router.post('/submit-test', verifyToken, submitTestController);
router.post('/change-password', verifyToken, changePasswordController);
router.post('/send-change-password-otp', verifyToken, sendChangePasswordOtpController);

router.post('/add', verifyToken, verifyPermission('employee_master', 'write'), addEmployee);
router.post('/import', verifyToken, verifyPermission('employee_master', 'write'), importEmployeesController);
router.get('/all', verifyToken, verifyPermission('employee_master', 'read'), getAllEmployeesController);
router.put('/update/:id', verifyToken, verifyPermission('employee_master', 'update'), updateEmployeeController);
router.delete('/delete/:id', verifyToken, verifyPermission('employee_master', 'delete'), deleteEmployeeController);

module.exports = router;
