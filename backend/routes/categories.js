const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function rowsToArray(result) {
    if (!result[0]) return [];
    const cols = result[0].columns;
    return result[0].values.map(row => {
        const obj = {};
        cols.forEach((c, i) => obj[c] = row[i]);
        return obj;
    });
}

router.get('/', (req, res) => {
    const db = getDb();
    const result = db.exec('SELECT * FROM categories ORDER BY id');
    res.json(rowsToArray(result));
});

router.post('/', authMiddleware, (req, res) => {
    const { key_id, label, icon } = req.body;
    if (!key_id || !label) {
        return res.status(400).json({ error: 'key_id and label required' });
    }
    const db = getDb();
    try {
        db.run('INSERT INTO categories (key_id, label, icon) VALUES (?, ?, ?)', [key_id, label, icon || 'fas fa-box']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:key', authMiddleware, (req, res) => {
    const { label, icon } = req.body;
    const db = getDb();
    db.run('UPDATE categories SET label = ?, icon = ? WHERE key_id = ?', [label, icon, req.params.key]);
    res.json({ success: true });
});

router.delete('/:key', authMiddleware, (req, res) => {
    const db = getDb();
    db.run('DELETE FROM products WHERE category_key = ?', [req.params.key]);
    db.run('DELETE FROM categories WHERE key_id = ?', [req.params.key]);
    res.json({ success: true });
});

module.exports = router;
