require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const path = require("path");
const uploadConfig = require("./config/uploadConfig.js");
const { connectDB } = require("./config/db.js");

// Routes
const authRoutes = require("./routes/authRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const userTypeMasterRoutes = require("./routes/userTypeMasterRoutes.js");
const clientRoutes = require("./routes/clientRoutes.js");
const siteRoutes = require("./routes/siteRoutes.js");
const roleRoutes = require("./routes/roleRoutes.js");
const trainerRoutes = require("./routes/trainerRoutes.js");
const certificateTemplateRoutes = require("./routes/certificateTemplateRoutes.js");
const ratingScaleRoutes = require("./routes/ratingScaleRoutes.js");
const categoryRoutes = require("./routes/categoryRoutes.js");
const trainingModuleRoutes = require("./routes/trainingModuleRoutes.js");
const departmentRoutes = require("./routes/departmentRoutes.js");
const questionBankRoutes = require("./routes/questionBankRoutes.js");
const questionPaperRoutes = require("./routes/questionPaperRoutes.js");
const employeeRoutes = require("./routes/employeeRoutes.js");
const batchRoutes = require("./routes/batchRoutes.js");
const feedbackQuestionBankRoutes = require("./routes/feedbackQuestionBankRoutes.js");
const feedbackPaperRoutes = require("./routes/feedbackPaperRoutes.js");

// Model Initializations
const { initUserModel } = require("./models/userModel.js");
const { createUserTypesTable, createUserTypePermissionsTable } = require("./models/userTypeModel.js");
const { createAuditLogsTable } = require("./models/auditLogModel.js");
const { createUserDevicesTable } = require("./models/deviceModel.js");
const { createClientsTable } = require("./models/clientModel.js");
const { createSitesTable } = require("./models/siteModel.js");
const { createRolesTable } = require("./models/roleModel.js");
const { createTrainersTable } = require("./models/trainerModel.js");
const { createCertificateTemplatesTable } = require("./models/certificateTemplateModel.js");
const { createRatingScalesTable } = require("./models/ratingScaleModel.js");
const { createCategoriesTable } = require("./models/categoryModel.js");
const { createTrainingModulesTable } = require("./models/trainingModuleModel.js");
const { createDepartmentsTable } = require("./models/departmentModel.js");
const { createQuestionBankTable } = require("./models/questionBankModel.js");
const { createQuestionPaperTable } = require("./models/questionPaperModel.js");
const { createEmployeesTable } = require("./models/employeeModel.js");
const { createBatchesTable, createBatchParticipantsTable, createPostTestAttemptsTable } = require("./models/batchModel.js");
const { createFeedbackQuestionBankTable } = require("./models/feedbackQuestionBankModel.js");
const { createFeedbackPapersTable } = require("./models/feedbackPaperModel.js");

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://thesafety360.com",
    "http://thesafety360.com",
    "https://www.thesafety360.com",
    "http://www.thesafety360.com",
    "https://training.thesafety360.com",
    "http://training.thesafety360.com",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-HTTP-Method-Override", "x-device-id", "device-id"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
}));
app.use(express.json());
app.use(cookieParser());

// Serve uploaded files statically if set to express
if (uploadConfig.serveMethod === "express") {
    console.log(`Serving uploaded files statically from: ${uploadConfig.uploadDir}`);
    app.use("/uploads", express.static(uploadConfig.uploadDir));
}

// HTTP Method Override middleware for environments that block PUT and DELETE requests
app.use((req, res, next) => {
    const methodOverride = req.headers['x-http-method-override'];
    if (req.method === 'POST' && methodOverride) {
        req.method = methodOverride.toUpperCase();
    }
    next();
});

app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/admin", "/admin"], adminRoutes);
app.use(["/api/usertypes", "/usertypes"], userTypeMasterRoutes);
app.use(["/api/clients", "/clients"], clientRoutes);
app.use(["/api/sites", "/sites"], siteRoutes);
app.use(["/api/roles", "/roles"], roleRoutes);
app.use(["/api/trainers", "/trainers"], trainerRoutes);
app.use(["/api/certificate-templates", "/certificate-templates"], certificateTemplateRoutes);
app.use(["/api/rating-scales", "/rating-scales"], ratingScaleRoutes);
app.use(["/api/categories", "/categories"], categoryRoutes);
app.use(["/api/training-modules", "/training-modules"], trainingModuleRoutes);
app.use(["/api/departments", "/departments"], departmentRoutes);
app.use(["/api/question-bank", "/question-bank"], questionBankRoutes);
app.use(["/api/question-paper", "/question-paper"], questionPaperRoutes);
app.use(["/api/employees", "/employees"], employeeRoutes);
app.use(["/api/batches", "/batches"], batchRoutes);
app.use(["/api/feedback-question-bank", "/feedback-question-bank"], feedbackQuestionBankRoutes);
app.use(["/api/feedback-papers", "/feedback-papers"], feedbackPaperRoutes);

// Global 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack);
    res.status(500).json({ success: false, message: "Something went wrong" });
});

const startServer = async () => {
    try {
        await connectDB();

        console.log("Initializing database tables...");
        // Initialize tables in correct dependency order
        await initUserModel();
        await createUserTypesTable();
        await createUserTypePermissionsTable();
        await createAuditLogsTable();
        await createUserDevicesTable();
        await createClientsTable();
        await createSitesTable();
        await createRolesTable();
        await createTrainersTable();
        await createCertificateTemplatesTable();
        await createRatingScalesTable();
        await createCategoriesTable();
        await createTrainingModulesTable();
        await createDepartmentsTable();
        await createQuestionBankTable();
        await createQuestionPaperTable();
        await createEmployeesTable();
        await createBatchesTable();
        await createBatchParticipantsTable();
        await createPostTestAttemptsTable();
        await createFeedbackQuestionBankTable();
        await createFeedbackPapersTable();

        console.log("All database tables are initialized and ready.");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server Running on Port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start application server:", error);
        process.exit(1);
    }
};

startServer();