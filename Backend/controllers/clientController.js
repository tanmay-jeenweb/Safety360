const {
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    getClientById
} = require('../models/clientModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addClient = async (req, res) => {
    try {
        const { clientName } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        if (!clientName || !clientName.trim()) {
            return res.status(400).json({ success: false, message: 'Client name is required' });
        }

        const result = await createClient(clientName.trim(), addedBy);
        const newId = result.insertId;

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Client Master',
            'created',
            null,
            {
                id: newId,
                client_name: clientName.trim(),
                added_by: addedBy,
                device_id: deviceId
            }
        );

        res.status(201).json({
            success: true,
            message: 'Client added successfully',
            data: { id: newId, client_name: clientName.trim(), added_by: addedBy }
        });
    } catch (error) {
        console.error('Error adding client:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Client name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllClientsController = async (req, res) => {
    try {
        const clients = await getAllClients();
        res.status(200).json({
            success: true,
            message: 'Clients retrieved successfully',
            data: clients
        });
    } catch (error) {
        console.error('Error retrieving clients:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateClientController = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientName } = req.body;

        if (!clientName || !clientName.trim()) {
            return res.status(400).json({ success: false, message: 'Client name is required' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        const beforeData = await getClientById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        await updateClient(id, clientName.trim());
        const afterData = await getClientById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Client Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Client updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating client:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Client name already exists' });
        }
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteClientController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getClientById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteClient(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Client Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    addClient,
    getAllClientsController,
    updateClientController,
    deleteClientController
};
