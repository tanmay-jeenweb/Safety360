const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createEmployeesTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_code VARCHAR(50) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            department_id INT NOT NULL,
            designation VARCHAR(150) NOT NULL,
            employee_type ENUM('Direct', 'Contractor') NOT NULL DEFAULT 'Direct',
            contractor_name VARCHAR(150) DEFAULT NULL,
            phone_no VARCHAR(20) NOT NULL,
            password VARCHAR(255) NOT NULL,
            is_first_login TINYINT(1) DEFAULT 1,
            client_id INT NOT NULL,
            site_id INT NOT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT,
            FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE RESTRICT,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    try {
        await db.execute(query);
    } catch (err) {
        console.log("Employees table creation failed/skipped (probably exists), running schema alter queries...");
    }

    try {
        await db.execute("ALTER TABLE employees ADD COLUMN phone_no VARCHAR(20) NOT NULL AFTER contractor_name");
    } catch (e1) {}
    try {
        await db.execute("ALTER TABLE employees ADD COLUMN password VARCHAR(255) NOT NULL AFTER phone_no");
    } catch (e2) {}
    try {
        await db.execute("ALTER TABLE employees ADD COLUMN is_first_login TINYINT(1) DEFAULT 1 AFTER password");
    } catch (e3) {}
    try {
        await db.execute("ALTER TABLE employees ADD COLUMN email VARCHAR(150) DEFAULT NULL AFTER phone_no");
    } catch (e4) {}
    try {
        await db.execute("ALTER TABLE employees ADD COLUMN joining_date DATE DEFAULT NULL AFTER email");
    } catch (e5) {}
    try {
        await db.execute("ALTER TABLE employees ADD UNIQUE INDEX idx_employees_email (email)");
    } catch (e6) {}

    console.log("Employees table ready");
};

// ─── Employee CRUD ────────────────────────────────────────────────────────────
const createEmployee = async (data, addedBy) => {
    const query = `
        INSERT INTO employees (
            employee_code,
            full_name,
            department_id,
            designation,
            employee_type,
            contractor_name,
            phone_no,
            password,
            email,
            joining_date,
            client_id,
            site_id,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.employeeCode,
        data.fullName,
        data.departmentId,
        data.designation,
        data.employeeType || 'Direct',
        data.employeeType === 'Contractor' ? (data.contractorName || null) : null,
        data.phoneNo,
        data.password,
        data.email,
        data.joiningDate,
        data.clientId,
        data.siteId,
        addedBy
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const getAllEmployees = async () => {
    const query = `
        SELECT 
            e.id,
            e.employee_code,
            e.full_name,
            e.department_id,
            COALESCE(d.department_name, 'Unknown') AS department_name,
            e.designation,
            e.employee_type,
            e.contractor_name,
            e.phone_no,
            e.email,
            e.joining_date,
            e.client_id,
            COALESCE(c.client_name, 'Unknown') AS client_name,
            e.site_id,
            COALESCE(s.site_name, 'Unknown') AS site_name,
            e.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            e.created_at,
            e.updated_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN clients c ON e.client_id = c.id
        LEFT JOIN sites s ON e.site_id = s.id
        LEFT JOIN users u ON e.added_by = u.id
        ORDER BY e.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results;
};

const updateEmployee = async (id, data) => {
    const query = `
        UPDATE employees SET 
            employee_code = ?,
            full_name = ?,
            department_id = ?,
            designation = ?,
            employee_type = ?,
            contractor_name = ?,
            phone_no = ?,
            email = ?,
            joining_date = ?,
            client_id = ?,
            site_id = ?
        WHERE id = ?
    `;

    const params = [
        data.employeeCode,
        data.fullName,
        data.departmentId,
        data.designation,
        data.employeeType || 'Direct',
        data.employeeType === 'Contractor' ? (data.contractorName || null) : null,
        data.phoneNo,
        data.email,
        data.joiningDate,
        data.clientId,
        data.siteId,
        id
    ];

    const [result] = await db.execute(query, params);
    return result;
};

const deleteEmployee = async (id) => {
    const query = `DELETE FROM employees WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getEmployeeById = async (id) => {
    const query = `
        SELECT 
            e.id,
            e.employee_code,
            e.full_name,
            e.department_id,
            COALESCE(d.department_name, 'Unknown') AS department_name,
            e.designation,
            e.employee_type,
            e.contractor_name,
            e.phone_no,
            e.email,
            e.joining_date,
            e.client_id,
            COALESCE(c.client_name, 'Unknown') AS client_name,
            e.site_id,
            COALESCE(s.site_name, 'Unknown') AS site_name,
            e.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            e.created_at,
            e.updated_at
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        LEFT JOIN clients c ON e.client_id = c.id
        LEFT JOIN sites s ON e.site_id = s.id
        LEFT JOIN users u ON e.added_by = u.id
        WHERE e.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
};

const importEmployees = async (records, addedBy) => {
    const connection = await db.getConnection();
    await connection.beginTransaction();
    try {
        const [depts] = await connection.execute("SELECT id, LOWER(TRIM(department_name)) AS name FROM departments");
        const [clients] = await connection.execute("SELECT id, LOWER(TRIM(client_name)) AS name FROM clients");
        const [sites] = await connection.execute("SELECT id, client_id, LOWER(TRIM(site_name)) AS name FROM sites");
        const [existing] = await connection.execute("SELECT id, LOWER(TRIM(employee_code)) AS code FROM employees");

        const deptMap = new Map(depts.map(d => [d.name, d.id]));
        const clientMap = new Map(clients.map(c => [c.name, c.id]));
        const siteMap = new Map(sites.map(s => [`${s.client_id}_${s.name}`, s.id]));
        const employeeMap = new Map(existing.map(e => [e.code, e.id]));

        const results = [];
        const bcrypt = require('bcryptjs');

        for (const record of records) {
            const code = String(record.employeeCode || '').trim();
            const fullName = String(record.fullName || '').trim();
            const deptName = String(record.departmentName || '').trim().toLowerCase();
            const designation = String(record.designation || '').trim();
            const employeeType = String(record.employeeType || 'Direct').trim();
            const contractorName = record.contractorName ? String(record.contractorName).trim() : null;
            const phoneNo = String(record.phoneNo || '').trim();
            const email = record.email ? String(record.email).trim() : null;
            const joiningDate = record.joiningDate ? String(record.joiningDate).trim() : null;
            const clientName = String(record.clientName || '').trim().toLowerCase();
            const siteName = String(record.siteName || '').trim().toLowerCase();

            if (!code || !fullName || !deptName || !designation || !phoneNo || !clientName || !siteName || !email || !joiningDate) {
                throw new Error(`Row with code '${code || 'Unknown'}' is missing required fields (Code, Name, Dept, Designation, Phone, Email, Joining Date, Client, Site).`);
            }

            if (employeeType !== 'Direct' && employeeType !== 'Contractor') {
                throw new Error(`Employee '${code}': Employee Type must be 'Direct' or 'Contractor'.`);
            }

            if (employeeType === 'Contractor' && !contractorName) {
                throw new Error(`Employee '${code}': Contractor Name is required when type is Contractor.`);
            }

            const departmentId = deptMap.get(deptName);
            if (!departmentId) {
                throw new Error(`Employee '${code}': Department '${record.departmentName}' not found in master list.`);
            }

            const clientId = clientMap.get(clientName);
            if (!clientId) {
                throw new Error(`Employee '${code}': Client '${record.clientName}' not found in master list.`);
            }

            const siteId = siteMap.get(`${clientId}_${siteName}`);
            if (!siteId) {
                throw new Error(`Employee '${code}': Site '${record.siteName}' not found or not mapped under client '${record.clientName}'.`);
            }

            const lowerCode = code.toLowerCase();
            const existingId = employeeMap.get(lowerCode);

            if (existingId) {
                const updateQuery = `
                    UPDATE employees SET
                        full_name = ?,
                        department_id = ?,
                        designation = ?,
                        employee_type = ?,
                        contractor_name = ?,
                        phone_no = ?,
                        email = ?,
                        joining_date = ?,
                        client_id = ?,
                        site_id = ?
                    WHERE id = ?
                `;
                await connection.execute(updateQuery, [
                    fullName,
                    departmentId,
                    designation,
                    employeeType,
                    employeeType === 'Contractor' ? contractorName : null,
                    phoneNo,
                    email,
                    joiningDate,
                    clientId,
                    siteId,
                    existingId
                ]);
                results.push({ id: existingId, employeeCode: code, action: 'updated' });
            } else {
                const hashedPassword = await bcrypt.hash(phoneNo, 10);
                const insertQuery = `
                    INSERT INTO employees (
                        employee_code,
                        full_name,
                        department_id,
                        designation,
                        employee_type,
                        contractor_name,
                        phone_no,
                        password,
                        email,
                        joining_date,
                        client_id,
                        site_id,
                        added_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                await connection.execute(insertQuery, [
                    code,
                    fullName,
                    departmentId,
                    designation,
                    employeeType,
                    employeeType === 'Contractor' ? contractorName : null,
                    phoneNo,
                    hashedPassword,
                    email,
                    joiningDate,
                    clientId,
                    siteId,
                    addedBy
                ]);
                results.push({ employeeCode: code, action: 'created' });
            }
        }

        await connection.commit();
        return results;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    createEmployeesTable,
    createEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    importEmployees
};
