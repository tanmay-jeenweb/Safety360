const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
    getCategoryById
} = require('../models/categoryModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const result = await createCategory(categoryName.trim(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Category Master',
            'created',
            null,
            {
                id: newId,
                category_name: categoryName.trim(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Category added successfully',
            data: { id: newId, category_name: categoryName.trim(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding category:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllCategoriesController = async (req, res) => {
    try {
        const categories = await getAllCategories();
        res.status(200).json({
            success: true,
            message: 'Categories retrieved successfully',
            data: categories
        });
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName } = req.body;

        if (!categoryName || !categoryName.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getCategoryById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await updateCategory(id, categoryName.trim());
        const afterData = await getCategoryById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Category Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating category:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Category name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteCategoryController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getCategoryById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteCategory(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Category Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addCategory,
    getAllCategoriesController,
    updateCategoryController,
    deleteCategoryController
};
