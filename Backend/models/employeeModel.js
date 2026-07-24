const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createEmployeesTable = async () => {
    // Drop existing table to ensure schema migration runs correctly in dev mode
    try {
        await db.execute("DROP TABLE IF EXISTS employees");
    } catch (err) {
        console.error("Error dropping old employees table:", err);
    }

    const query = `
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employee_code VARCHAR(50) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            department_id INT NOT NULL,
            designation VARCHAR(150) NOT NULL,
            employee_type ENUM('Direct', 'Contractor') NOT NULL DEFAULT 'Direct',
            contractor_name VARCHAR(150) DEFAULT NULL,
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

    await db.execute(query);
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
            client_id,
            site_id,
            added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
        data.employeeCode,
        data.fullName,
        data.departmentId,
        data.designation,
        data.employeeType || 'Direct',
        data.employeeType === 'Contractor' ? (data.contractorName || null) : null,
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

module.exports = {
    createEmployeesTable,
    createEmployee,
    getAllEmployees,
    updateEmployee,
    deleteEmployee,
    getEmployeeById
};
