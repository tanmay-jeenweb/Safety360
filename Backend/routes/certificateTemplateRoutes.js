const express = require('express');
const {
    addCertificateTemplate,
    getAllCertificateTemplatesController,
    updateCertificateTemplateController,
    deleteCertificateTemplateController
} = require('../controllers/certificateTemplateController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('certificate_template_master', 'write'), addCertificateTemplate);
router.get('/all', verifyToken, verifyPermission('certificate_template_master', 'read'), getAllCertificateTemplatesController);
router.put('/update/:id', verifyToken, verifyPermission('certificate_template_master', 'update'), updateCertificateTemplateController);
router.delete('/delete/:id', verifyToken, verifyPermission('certificate_template_master', 'delete'), deleteCertificateTemplateController);

module.exports = router;
