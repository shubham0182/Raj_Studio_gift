const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    const db = getDb();
    const result = db.exec('SELECT * FROM users WHERE username = ?', [username]);
    if (!result[0] || !result[0].values.length) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    const row = result[0].values[0];
    const cols = result[0].columns;
    const user = {};
    cols.forEach((c, i) => user[c] = row[i]);

    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
});

router.get('/me', authMiddleware, (req, res) => {
    res.json({ username: req.user.username });
});

module.exports = router;
