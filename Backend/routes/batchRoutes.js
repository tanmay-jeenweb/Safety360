const express = require('express');
const {
    addBatch,
    getAllBatchesController,
    updateBatchController,
    deleteBatchController
} = require('../controllers/batchController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('batch_master', 'write'), addBatch);
router.get('/all', verifyToken, verifyPermission('batch_master', 'read'), getAllBatchesController);
router.put('/update/:id', verifyToken, verifyPermission('batch_master', 'update'), updateBatchController);
router.delete('/delete/:id', verifyToken, verifyPermission('batch_master', 'delete'), deleteBatchController);

module.exports = router;
