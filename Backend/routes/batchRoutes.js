const express = require('express');
const {
    addBatch,
    getAllBatchesController,
    updateBatchController,
    deleteBatchController,
    getBatchByIdController,
    getBatchParticipantsController,
    addBatchParticipantController,
    removeBatchParticipantController,
    updateBatchParticipantController,
    createExceptionRequestController,
    getExceptionRequestsController,
    updateExceptionStatusController
} = require('../controllers/batchController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('batch_master', 'write'), addBatch);
router.get('/all', verifyToken, verifyPermission('batch_master', 'read'), getAllBatchesController);
router.get('/:id', verifyToken, verifyPermission('batch_master', 'read'), getBatchByIdController);
router.put('/update/:id', verifyToken, verifyPermission('batch_master', 'update'), updateBatchController);
router.delete('/delete/:id', verifyToken, verifyPermission('batch_master', 'delete'), deleteBatchController);

router.get('/:id/participants', verifyToken, verifyPermission('batch_master', 'read'), getBatchParticipantsController);
router.post('/:id/participants', verifyToken, verifyPermission('batch_master', 'update'), addBatchParticipantController);
router.delete('/:id/participants/:employeeId', verifyToken, verifyPermission('batch_master', 'update'), removeBatchParticipantController);
router.put('/:id/participants/:employeeId', verifyToken, verifyPermission('batch_master', 'update'), updateBatchParticipantController);

// Training exceptions
router.post('/request-exception', verifyToken, verifyPermission('employee_training_approval', 'read'), createExceptionRequestController);
router.get('/exceptions/all', verifyToken, verifyPermission('employee_training_approval', 'read'), getExceptionRequestsController);
router.put('/exceptions/:id/status', verifyToken, verifyPermission('employee_training_approval', 'write'), updateExceptionStatusController);

module.exports = router;

