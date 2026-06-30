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
    const result = db.exec('SELECT * FROM gallery ORDER BY sort_order, id');
    res.json(rowsToArray(result));
});

router.post('/', authMiddleware, (req, res) => {
    const { image, caption } = req.body;
    if (!image) return res.status(400).json({ error: 'image required' });
    const db = getDb();
    db.run('INSERT INTO gallery (image, caption) VALUES (?, ?)', [image, caption || '']);
    res.json({ success: true });
});

router.put('/:id', authMiddleware, (req, res) => {
    const { image, caption, sort_order } = req.body;
    const db = getDb();
    db.run('UPDATE gallery SET image = ?, caption = ?, sort_order = ? WHERE id = ?',
        [image, caption || '', sort_order || 0, req.params.id]);
    res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
    const db = getDb();
    db.run('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;
