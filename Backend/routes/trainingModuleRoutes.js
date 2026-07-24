const express = require('express');
const {
    addTrainingModule,
    getAllTrainingModulesController,
    getTrainingModuleByIdController,
    updateTrainingModuleController,
    deleteTrainingModuleController
} = require('../controllers/trainingModuleController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('training_module_master', 'write'), addTrainingModule);
router.get('/all', verifyToken, verifyPermission('training_module_master', 'read'), getAllTrainingModulesController);
router.get('/:id', verifyToken, verifyPermission('training_module_master', 'read'), getTrainingModuleByIdController);
router.put('/update/:id', verifyToken, verifyPermission('training_module_master', 'update'), updateTrainingModuleController);
router.delete('/delete/:id', verifyToken, verifyPermission('training_module_master', 'delete'), deleteTrainingModuleController);

module.exports = router;
