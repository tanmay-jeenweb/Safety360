const express = require('express');
const {
    addClient,
    getAllClientsController,
    updateClientController,
    deleteClientController
} = require('../controllers/clientController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('client_master', 'write'), addClient);
router.get('/all', verifyToken, verifyPermission('client_master', 'read'), getAllClientsController);
router.put('/update/:id', verifyToken, verifyPermission('client_master', 'update'), updateClientController);
router.delete('/delete/:id', verifyToken, verifyPermission('client_master', 'delete'), deleteClientController);

module.exports = router;
