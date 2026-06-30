const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.post('/', (req, res) => {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'name, email, and message required' });
    }
    const db = getDb();
    db.run('INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
        [name, email, phone || '', message]);
    res.json({ success: true });
});

module.exports = router;
