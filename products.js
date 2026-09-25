const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static('public'));

// Ініціалізація бази даних при першому запуску
if (!fs.existsSync(DB_FILE)) {
    const initialData = {
        users: [
            { username: 'admin', password: 'adminpassword', role: 'admin' }
        ],
        products: [
            { id: 1, name: 'VENT PHANTOM I', category: 'Вентилятори', price: 12500, description: 'Преміальний безшумний вентилятор високої потужності.' },
            { id: 2, name: 'RECU AIR PRO', category: 'Рекуператори', price: 28900, description: 'Компактна система рекуперації для спальні або офісу.' }
        ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

/* --- API МАРШРУТИ --- */

// Отримати товари
app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

// Додати новий товар (Тільки Адмін)
app.post('/api/products', (req, res) => {
    const { name, category, price, description } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Заповніть назву та ціну' });

    const db = readDB();
    const newProduct = {
        id: Date.now(),
        name,
        category: category || 'Вентилятори',
        price: Number(price),
        description: description || ''
    };

    db.products.push(newProduct);
    writeDB(db);
    res.json({ success: true, product: newProduct });
});

// Змінити ціну товару (Тільки Адмін)
app.patch('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const { price } = req.body;

    const db = readDB();
    const product = db.products.find(p => p.id === productId);

    if (!product) return res.status(404).json({ error: 'Товар не знайдено' });

    product.price = Number(price);
    writeDB(db);
    res.json({ success: true, product });
});

// Видалити товар
app.delete('/api/products/:id', (req, res) => {
    const productId = Number(req.params.id);
    const db = readDB();
    db.products = db.products.filter(p => p.id !== productId);
    writeDB(db);
    res.json({ success: true });
});

// Авторизація / Реєстрація
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const db = readDB();

    let user = db.users.find(u => u.username === username);

    if (!user) {
        // Якщо користувача немає — реєструємо як звичайного покупця
        user = { username, password, role: 'user' };
        db.users.push(user);
        writeDB(db);
    } else if (user.password !== password) {
        return res.status(401).json({ error: 'Невірний пароль' });
    }

    res.json({ success: true, user: { username: user.username, role: user.role } });
});

app.listen(PORT, () => {
    console.log(Сервер працює на http://localhost:${PORT});
});
