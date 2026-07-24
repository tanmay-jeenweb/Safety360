const express = require('express');
const {
    addCategory,
    getAllCategoriesController,
    updateCategoryController,
    deleteCategoryController
} = require('../controllers/categoryController.js');
const { verifyToken, verifyPermission } = require('../middleware/authMiddleware.js');

const router = express.Router();

router.post('/add', verifyToken, verifyPermission('category_master', 'write'), addCategory);
router.get('/all', verifyToken, verifyPermission('category_master', 'read'), getAllCategoriesController);
router.put('/update/:id', verifyToken, verifyPermission('category_master', 'update'), updateCategoryController);
router.delete('/delete/:id', verifyToken, verifyPermission('category_master', 'delete'), deleteCategoryController);

module.exports = router;
