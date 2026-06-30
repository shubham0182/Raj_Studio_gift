const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'rajstudio.db');
let db = null;

function getDb() {
    return db;
}

async function initDb() {
    const SQL = await initSqlJs();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }

    db.run('PRAGMA foreign_keys = ON');
    createSchema();
    seedData();
    saveDb();
    return db;
}

function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

function createSchema() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_id TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            icon TEXT NOT NULL DEFAULT 'fas fa-box',
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category_key TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL DEFAULT '',
            icon TEXT NOT NULL DEFAULT 'fas fa-box',
            description TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (category_key) REFERENCES categories(key_id) ON DELETE CASCADE
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            customer_name TEXT DEFAULT '',
            customer_email TEXT DEFAULT '',
            customer_phone TEXT DEFAULT '',
            status TEXT DEFAULT 'delivered',
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT DEFAULT '',
            message TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS gallery (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image TEXT NOT NULL,
            caption TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);
}

function seedData() {
    const userCount = db.exec('SELECT COUNT(*) as c FROM users');
    if (!userCount[0] || userCount[0].values[0][0] === 0) {
        const hash = bcrypt.hashSync('2006', 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['shubham', hash]);
    }

    const catCount = db.exec('SELECT COUNT(*) as c FROM categories');
    if (!catCount[0] || catCount[0].values[0][0] === 0) {
        db.run('INSERT INTO categories (key_id, label, icon) VALUES (?, ?, ?)', ['tshirt', 'T-shirt Printing', 'fas fa-tshirt']);
        db.run('INSERT INTO categories (key_id, label, icon) VALUES (?, ?, ?)', ['mug', 'Mug Printing', 'fas fa-mug-hot']);
        db.run('INSERT INTO categories (key_id, label, icon) VALUES (?, ?, ?)', ['frame', 'Photo Frames', 'fas fa-image']);
        db.run('INSERT INTO categories (key_id, label, icon) VALUES (?, ?, ?)', ['pen', 'Pen Printing', 'fas fa-pen']);
    }

    const prodCount = db.exec('SELECT COUNT(*) as c FROM products');
    if (!prodCount[0] || prodCount[0].values[0][0] === 0) {
        const stmt = db.prepare('INSERT INTO products (name, category_key, price, image, icon, description) VALUES (?, ?, ?, ?, ?, ?)');
        stmt.run(['Premium Cotton T-Shirt', 'tshirt', 24.99, 'images/img-tshirt.jpg', 'fas fa-tshirt', '100% premium cotton with vibrant print quality']);
        stmt.run(['Classic Polo T-Shirt', 'tshirt', 29.99, 'images/img-polo.jpg', 'fas fa-tshirt', 'Elegant polo design for corporate events']);
        stmt.run(['Ceramic Coffee Mug', 'mug', 12.99, 'images/img-mug.jpg', 'fas fa-mug-hot', 'Premium ceramic mug with custom printing']);
        stmt.run(['Travel Insulated Mug', 'mug', 18.99, 'images/img-travel-mug.jpg', 'fas fa-mug-hot', 'Double-wall insulated for hot & cold drinks']);
        stmt.run(['Wooden Photo Frame', 'frame', 15.99, 'images/img-frame.jpg', 'fas fa-image', 'Handcrafted wooden frame with glass cover']);
        stmt.run(['Acrylic Modern Frame', 'frame', 19.99, 'images/img-acrylic-frame.jpg', 'fas fa-image', 'Sleek acrylic design for contemporary spaces']);
        stmt.run(['Executive Ballpoint Pen', 'pen', 8.99, 'images/img-pen.jpg', 'fas fa-pen', 'Metal barrel with smooth writing mechanism']);
        stmt.run(['Fountain Pen Set', 'pen', 34.99, 'images/img-fountain-pen.jpg', 'fas fa-pen-fancy', 'Luxury fountain pen with ink and gift box']);
        stmt.free();
    }
}

function query(sql, params) {
    if (params && params.length) {
        return db.exec(sql, params);
    }
    return db.exec(sql);
}

function run(sql, params) {
    if (params) {
        db.run(sql, params);
    } else {
        db.run(sql);
    }
    saveDb();
}

module.exports = { initDb, getDb, query, run };
