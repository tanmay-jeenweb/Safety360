const db = require('../config/db.js');

// ─── Table creation ──────────────────────────────────────────────────────────
const createClientsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS clients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(150) NOT NULL UNIQUE,
            address TEXT DEFAULT NULL,
            representatives JSON DEFAULT NULL,
            work_order_no VARCHAR(150) DEFAULT NULL,
            work_order_date DATE DEFAULT NULL,
            added_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE RESTRICT
        )
    `;

    await db.execute(query);

    const columnsToEnsure = [
        {
            name: 'address',
            query: 'ALTER TABLE clients ADD COLUMN address TEXT DEFAULT NULL'
        },
        {
            name: 'representatives',
            query: 'ALTER TABLE clients ADD COLUMN representatives JSON DEFAULT NULL'
        },
        {
            name: 'work_order_no',
            query: 'ALTER TABLE clients ADD COLUMN work_order_no VARCHAR(150) DEFAULT NULL'
        },
        {
            name: 'work_order_date',
            query: 'ALTER TABLE clients ADD COLUMN work_order_date DATE DEFAULT NULL'
        }
    ];

    for (const column of columnsToEnsure) {
        const [rows] = await db.execute(`SHOW COLUMNS FROM clients LIKE '${column.name}'`);
        if (rows.length === 0) {
            await db.execute(column.query);
        }
    }

    console.log("Clients table ready");
};

// ─── Client CRUD ──────────────────────────────────────────────────────────────
const createClient = async (data, addedBy) => {
    const { clientName, address, representatives, workOrderNo, workOrderDate } = data;
    const repsJson = JSON.stringify(representatives || []);
    const query = `
        INSERT INTO clients (client_name, address, representatives, work_order_no, work_order_date, added_by) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [
        clientName,
        address || null,
        repsJson,
        workOrderNo || null,
        workOrderDate || null,
        addedBy
    ]);
    return result;
};

const getAllClients = async () => {
    const query = `
        SELECT 
            c.id,
            c.client_name,
            c.address,
            c.representatives,
            c.work_order_no,
            c.work_order_date,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM clients c
        LEFT JOIN users u ON c.added_by = u.id
        ORDER BY c.created_at DESC
    `;
    const [results] = await db.execute(query);
    return results.map(row => ({
        ...row,
        representatives: typeof row.representatives === 'string' ? JSON.parse(row.representatives) : (row.representatives || [])
    }));
};

const updateClient = async (id, data) => {
    const { clientName, address, representatives, workOrderNo, workOrderDate } = data;
    const repsJson = JSON.stringify(representatives || []);
    const query = `
        UPDATE clients 
        SET client_name = ?, address = ?, representatives = ?, work_order_no = ?, work_order_date = ? 
        WHERE id = ?
    `;
    const [result] = await db.execute(query, [
        clientName,
        address || null,
        repsJson,
        workOrderNo || null,
        workOrderDate || null,
        id
    ]);
    return result;
};

const deleteClient = async (id) => {
    const query = `DELETE FROM clients WHERE id = ?`;
    const [result] = await db.execute(query, [id]);
    return result;
};

const getClientById = async (id) => {
    const query = `
        SELECT 
            c.id,
            c.client_name,
            c.address,
            c.representatives,
            c.work_order_no,
            c.work_order_date,
            c.added_by,
            COALESCE(u.name, 'Unknown') AS added_by_name,
            c.created_at,
            c.updated_at
        FROM clients c
        LEFT JOIN users u ON c.added_by = u.id
        WHERE c.id = ?
    `;
    const [rows] = await db.execute(query, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
        ...row,
        representatives: typeof row.representatives === 'string' ? JSON.parse(row.representatives) : (row.representatives || [])
    };
};

module.exports = {
    createClientsTable,
    createClient,
    getAllClients,
    updateClient,
    deleteClient,
    getClientById
};
