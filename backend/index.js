const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const { sendSMS } = require('./smsService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let db;

(async () => {
    db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            document_type TEXT NOT NULL,
            submission_date TEXT NOT NULL,
            network_provider TEXT,
            status TEXT DEFAULT 'pending',
            notified_at TEXT
        );

        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `);

    console.log('Database initialized');
})();

app.get('/', (req, res) => {
    res.send('Document Notification System API');
});

// User Registration Endpoint
app.post('/api/register', async (req, res) => {
    const { name, phone_number, document_type, submission_date, network_provider } = req.body;
    try {
        const result = await db.run(
            `INSERT INTO users (name, phone_number, document_type, submission_date, network_provider) 
             VALUES (?, ?, ?, ?, ?)`,
            [name, phone_number, document_type, submission_date, network_provider]
        );
        res.status(201).json({ id: result.lastID, message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Statistics
app.get('/api/stats', async (req, res) => {
    try {
        const total = await db.get('SELECT COUNT(*) as count FROM users');
        const pending = await db.get('SELECT COUNT(*) as count FROM users WHERE status = "pending"');
        const ready = await db.get('SELECT COUNT(*) as count FROM users WHERE status = "ready"');
        res.json({
            total: total.count,
            pending: pending.count,
            ready: ready.count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Registrations (Archiving)
app.get('/api/registrations/all', async (req, res) => {
    try {
        const rows = await db.all('SELECT * FROM users ORDER BY submission_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Today's Registrations
app.get('/api/registrations/today', async (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const rows = await db.all('SELECT * FROM users WHERE submission_date = ?', [today]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Notify User Endpoint
app.post('/api/notify', async (req, res) => {
    const { userId, message, gatewayId } = req.body;
    try {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const result = await sendSMS(user.phone_number, message, gatewayId);

        await db.run(
            'UPDATE users SET status = "ready", notified_at = ? WHERE id = ?',
            [new Date().toISOString(), userId]
        );

        res.json({ success: true, api_response: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
