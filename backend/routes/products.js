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
    const { search, category } = req.query;
    let sql = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
        conditions.push('category_key = ?');
        params.push(category);
    }
    if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY id';

    const result = db.exec(sql, params);
    res.json(rowsToArray(result));
});

router.get('/:id', (req, res) => {
    const db = getDb();
    const result = db.exec('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const products = rowsToArray(result);
    if (!products.length) return res.status(404).json({ error: 'Product not found' });
    res.json(products[0]);
});

router.post('/', authMiddleware, (req, res) => {
    const { name, category_key, price, image, icon, description } = req.body;
    if (!name || !category_key || price === undefined) {
        return res.status(400).json({ error: 'name, category_key, and price required' });
    }
    const db = getDb();
    const catResult = db.exec('SELECT icon FROM categories WHERE key_id = ?', [category_key]);
    const catIcon = catResult[0]?.values[0]?.[0] || 'fas fa-box';
    db.run(
        'INSERT INTO products (name, category_key, price, image, icon, description) VALUES (?, ?, ?, ?, ?, ?)',
        [name, category_key, price, image || '', icon || catIcon, description || '']
    );
    res.json({ success: true });
});

router.put('/:id', authMiddleware, (req, res) => {
    const { name, category_key, price, image, icon, description } = req.body;
    const db = getDb();
    db.run(
        'UPDATE products SET name = ?, category_key = ?, price = ?, image = ?, icon = ?, description = ? WHERE id = ?',
        [name, category_key, price, image, icon, description, req.params.id]
    );
    res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
    const db = getDb();
    db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
});

module.exports = router;
