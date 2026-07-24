const express = require('express');
const {
    addRole,
    getAllRolesController,
    updateRoleController,
    deleteRoleController
} = require('../controllers/roleController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('role_master', 'write'), addRole);
router.get('/all', verifyToken, verifyPermission('role_master', 'read'), getAllRolesController);
router.put('/update/:id', verifyToken, verifyPermission('role_master', 'update'), updateRoleController);
router.delete('/delete/:id', verifyToken, verifyPermission('role_master', 'delete'), deleteRoleController);

module.exports = router;
