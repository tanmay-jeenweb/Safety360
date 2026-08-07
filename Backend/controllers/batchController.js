const {
    createBatch,
    getAllBatches,
    updateBatch,
    deleteBatch,
    getBatchById,
    getParticipantsByBatchId,
    addParticipantToBatch,
    removeParticipantFromBatch,
    updateParticipantDetails,
    createTrainingExceptionRequest,
    getAllTrainingExceptionRequests,
    updateTrainingExceptionRequestStatus
} = require('../models/batchModel.js');
const { createAuditLog } = require('../models/auditLogModel.js');

const addBatch = async (req, res) => {
    try {
        const { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status, preTestQuestionPaperId, postTestQuestionPaperId, preTestWeightage, feedbackPaperId } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        // Validation - all fields are mandatory
        if (!clientId || !siteId || !trainingModuleId || !trainerId || !scheduledDate || !venue || !batchSize) {
            return res.status(400).json({ success: false, message: 'All fields are mandatory' });
        }

        // Specific pretest status activation validation
        if (status === 'Pretest Active' && !preTestQuestionPaperId) {
            return res.status(400).json({ success: false, message: 'A pre-test question paper must be selected to activate the pre-test' });
        }

        const result = await createBatch({
            clientId,
            siteId,
            trainingModuleId,
            trainerId,
            scheduledDate,
            venue,
            batchSize,
            status: status || 'Draft',
            preTestQuestionPaperId: preTestQuestionPaperId ? parseInt(preTestQuestionPaperId, 10) : null,
            postTestQuestionPaperId: postTestQuestionPaperId ? parseInt(postTestQuestionPaperId, 10) : null,
            preTestWeightage: preTestWeightage !== undefined ? parseInt(preTestWeightage, 10) : 0,
            feedbackPaperId: feedbackPaperId ? parseInt(feedbackPaperId, 10) : null
        }, addedBy);

        const newId = result.insertId;
        const newBatch = await getBatchById(newId);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'created',
            null,
            newBatch
        );

        res.status(201).json({
            success: true,
            message: 'Batch added successfully',
            data: newBatch
        });
    } catch (error) {
        console.error('Error adding batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getAllBatchesController = async (req, res) => {
    try {
        const batches = await getAllBatches();
        res.status(200).json({
            success: true,
            message: 'Batches retrieved successfully',
            data: batches
        });
    } catch (error) {
        console.error('Error retrieving batches:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const updateBatchController = async (req, res) => {
    try {
        const { id } = req.params;
        const { clientId, siteId, trainingModuleId, trainerId, scheduledDate, venue, batchSize, status, preTestQuestionPaperId, postTestQuestionPaperId, preTestWeightage, feedbackPaperId } = req.body;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        // Validation - all fields are mandatory
        if (!clientId || !siteId || !trainingModuleId || !trainerId || !scheduledDate || !venue || !batchSize || !status) {
            return res.status(400).json({ success: false, message: 'All fields are mandatory' });
        }

        const beforeData = await getBatchById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        // Specific pretest status activation validation
        if (status === 'Pretest Active') {
            const paperIdToCheck = preTestQuestionPaperId !== undefined ? preTestQuestionPaperId : beforeData.pre_test_question_paper_id;
            if (!paperIdToCheck) {
                return res.status(400).json({ success: false, message: 'A pre-test question paper must be selected to activate the pre-test' });
            }
        }

        const finalPreQpId = preTestQuestionPaperId !== undefined ? (preTestQuestionPaperId ? parseInt(preTestQuestionPaperId, 10) : null) : beforeData.pre_test_question_paper_id;
        let finalPostQpId = postTestQuestionPaperId !== undefined ? (postTestQuestionPaperId ? parseInt(postTestQuestionPaperId, 10) : null) : beforeData.post_test_question_paper_id;
        

        await updateBatch(id, {
            clientId,
            siteId,
            trainingModuleId,
            trainerId,
            scheduledDate,
            venue,
            batchSize,
            status,
            preTestQuestionPaperId: finalPreQpId,
            postTestQuestionPaperId: finalPostQpId,
            preTestWeightage: preTestWeightage !== undefined ? parseInt(preTestWeightage, 10) : beforeData.pre_test_weightage,
            feedbackPaperId: feedbackPaperId !== undefined ? (feedbackPaperId ? parseInt(feedbackPaperId, 10) : null) : beforeData.feedback_paper_id
        });

        const afterData = await getBatchById(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'updated',
            beforeData,
            afterData
        );

        res.status(200).json({
            success: true,
            message: 'Batch updated successfully',
            data: afterData
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const deleteBatchController = async (req, res) => {
    try {
        const { id } = req.params;
        const beforeData = await getBatchById(id);
        if (!beforeData) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';
        await deleteBatch(id);

        await createAuditLog(
            req.user?.id,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'deleted',
            beforeData,
            null
        );

        res.status(200).json({ success: true, message: 'Batch deleted successfully' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const getBatchByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await getBatchById(id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Batch retrieved successfully',
            data: batch
        });
    } catch (error) {
        console.error('Error retrieving batch details:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getBatchParticipantsController = async (req, res) => {
    try {
        const { id } = req.params;
        const participants = await getParticipantsByBatchId(id);
        res.status(200).json({
            success: true,
            message: 'Batch participants retrieved successfully',
            data: participants
        });
    } catch (error) {
        console.error('Error retrieving batch participants:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const addBatchParticipantController = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, employeeIds } = req.body;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        const batch = await getBatchById(id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        if (batch.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Participants can only be added when the batch is in Draft status' });
        }

        const idsToAdd = employeeIds || (employeeId ? [employeeId] : []);
        if (idsToAdd.length === 0) {
            return res.status(400).json({ success: false, message: 'Employee ID(s) required' });
        }

        const participants = await getParticipantsByBatchId(id);
        if (participants.length + idsToAdd.length > batch.batch_size) {
            return res.status(400).json({ success: false, message: `Adding these participants exceeds the batch size limit of ${batch.batch_size}` });
        }

        for (const empId of idsToAdd) {
            try {
                await addParticipantToBatch(id, empId);
            } catch (err) {
                if (err.code !== 'ER_DUP_ENTRY') {
                    throw err;
                }
            }
        }

        const updatedParticipants = await getParticipantsByBatchId(id);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'updated',
            batch,
            { ...batch, action: 'add_participants', employeeIds: idsToAdd }
        );

        res.status(201).json({
            success: true,
            message: 'Participants added successfully',
            data: updatedParticipants
        });
    } catch (error) {
        console.error('Error adding batch participant:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const removeBatchParticipantController = async (req, res) => {
    try {
        const { id, employeeId } = req.params;
        const addedBy = req.user.id;
        const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || 'Unknown';

        const batch = await getBatchById(id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        if (batch.status !== 'Draft') {
            return res.status(400).json({ success: false, message: 'Participants can only be removed when the batch is in Draft status' });
        }

        await removeParticipantFromBatch(id, employeeId);
        const updatedParticipants = await getParticipantsByBatchId(id);

        await createAuditLog(
            addedBy,
            req.user?.name || req.user?.username || 'Unknown',
            deviceId,
            'Batch Master',
            'updated',
            batch,
            { ...batch, action: 'remove_participant', employeeId }
        );

        res.status(200).json({
            success: true,
            message: 'Participant removed successfully',
            data: updatedParticipants
        });
    } catch (error) {
        console.error('Error removing batch participant:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateBatchParticipantController = async (req, res) => {
    try {
        const { id, employeeId } = req.params;
        const { attendance, preTestScore, postTestScore, finalScore, bandBadge } = req.body;

        const batch = await getBatchById(id);
        if (!batch) {
            return res.status(404).json({ success: false, message: 'Batch not found' });
        }

        const participants = await getParticipantsByBatchId(id);
        const participant = participants.find(p => String(p.employee_id) === String(employeeId));
        if (!participant) {
            return res.status(404).json({ success: false, message: 'Participant not found in this batch' });
        }

        // Enforce that attendance cannot be set to present if they did not complete the pre-test and no exception is approved
        if (attendance && participant.pre_test_score === null && !participant.allow_training_exception) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot mark attendance as present because this trainee has not attended the pre-test.' 
            });
        }

        await updateParticipantDetails(id, employeeId, { attendance, preTestScore, postTestScore, finalScore, bandBadge });
        const updatedParticipants = await getParticipantsByBatchId(id);

        res.status(200).json({
            success: true,
            message: 'Participant updated successfully',
            data: updatedParticipants
        });
    } catch (error) {
        console.error('Error updating batch participant:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const createExceptionRequestController = async (req, res) => {
    try {
        const { batchId, employeeId, comments } = req.body;
        const requestedBy = req.user.id;

        if (!batchId || !employeeId) {
            return res.status(400).json({ success: false, message: 'Batch ID and Employee ID are required' });
        }

        await createTrainingExceptionRequest(batchId, employeeId, requestedBy, comments || "");

        // Log audit
        await createAuditLog(
            req.user.id,
            req.headers['x-device-id'] || 'Unknown',
            'employee_training_approval',
            batchId,
            'create_request',
            { batchId, employeeId, comments }
        );

        res.status(200).json({ success: true, message: 'Exception approval request submitted successfully' });
    } catch (error) {
        console.error('Error creating exception request:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getExceptionRequestsController = async (req, res) => {
    try {
        const requests = await getAllTrainingExceptionRequests();
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error('Error getting exception requests:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateExceptionStatusController = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'

        if (!status || !['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        await updateTrainingExceptionRequestStatus(id, status);

        // Log audit
        await createAuditLog(
            req.user.id,
            req.headers['x-device-id'] || 'Unknown',
            'employee_training_approval',
            id,
            'update_request_status',
            { status }
        );

        res.status(200).json({ success: true, message: `Request status updated to ${status}` });
    } catch (error) {
        console.error('Error updating exception status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
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
};
