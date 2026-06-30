const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function rowsToArray(result) {
    if (!result[0]) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
        const obj = {};
        cols.forEach((c, i) => {
            if (c === 'items') {
                try { obj[c] = JSON.parse(row[i]); } catch(e) { obj[c] = row[i]; }
            } else {
                obj[c] = row[i];
            }
        });
        return obj;
    });
}

router.get('/', authMiddleware, (req, res) => {
    const db = getDb();
    const result = db.exec('SELECT * FROM orders ORDER BY id DESC');
    res.json(rowsToArray(result));
});

router.post('/', (req, res) => {
    const { items, total, customer_name, customer_email, customer_phone } = req.body;
    if (!items || !total) {
        return res.status(400).json({ error: 'items and total required' });
    }
    const db = getDb();
    db.run(
        'INSERT INTO orders (items, total, customer_name, customer_email, customer_phone) VALUES (?, ?, ?, ?, ?)',
        [JSON.stringify(items), total, customer_name || '', customer_email || '', customer_phone || '']
    );
    res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
    const db = getDb();
    db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;
