const express = require('express');
const {
    addDepartment,
    getAllDepartmentsController,
    updateDepartmentController,
    deleteDepartmentController
} = require('../controllers/departmentController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('department_master', 'write'), addDepartment);
router.get('/all', verifyToken, verifyPermission('department_master', 'read'), getAllDepartmentsController);
router.put('/update/:id', verifyToken, verifyPermission('department_master', 'update'), updateDepartmentController);
router.delete('/delete/:id', verifyToken, verifyPermission('department_master', 'delete'), deleteDepartmentController);

module.exports = router;
