const express = require('express');
const {
    addSite,
    getAllSitesController,
    updateSiteController,
    deleteSiteController
} = require('../controllers/siteController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('site_master', 'write'), addSite);
router.get('/all', verifyToken, verifyPermission('site_master', 'read'), getAllSitesController);
router.put('/update/:id', verifyToken, verifyPermission('site_master', 'update'), updateSiteController);
router.delete('/delete/:id', verifyToken, verifyPermission('site_master', 'delete'), deleteSiteController);

module.exports = router;
