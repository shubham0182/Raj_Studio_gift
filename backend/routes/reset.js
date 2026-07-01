const express = require('express');
const { resetData } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, (req, res) => {
    try {
        resetData();
        res.json({ success: true, message: 'All data has been reset to default' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

module.exports = router;
