const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getDb, query, run } = require('./db');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');
const galleryRoutes = require('./routes/gallery');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, '..');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(PUBLIC_DIR));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/gallery', galleryRoutes);

app.get('/api/stats', (req, res) => {
    const d = getDb();
    const prod = d.exec('SELECT COUNT(*) as c FROM products');
    const cat = d.exec('SELECT COUNT(*) as c FROM categories');
    const ord = d.exec('SELECT COUNT(*) as c FROM orders');
    const rev = d.exec('SELECT COALESCE(SUM(total),0) as t FROM orders');
    const gal = d.exec('SELECT COUNT(*) as c FROM gallery');
    res.json({
        productCount: prod[0]?.values[0][0] || 0,
        categoryCount: cat[0]?.values[0][0] || 0,
        orderCount: ord[0]?.values[0][0] || 0,
        totalRevenue: rev[0]?.values[0][0] || 0,
        galleryCount: gal[0]?.values[0][0] || 0
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Raj Studio Gift server running at http://localhost:${PORT}`);
    });
});
