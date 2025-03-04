const express = require('express');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');

const app = express();
const port = 3000;

app.use(cors());

// Подключение к PostgreSQL
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'gds',
    password: '1234',
    port: 5432,
});

client.connect()
    .then(() => console.log('Подключение к базе данных успешно установлено!'))
    .catch(err => console.error('Ошибка подключения к базе данных:', err));

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, '../public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Маршрут для скачивания файла catalog.docx
app.get('/catalog.docx', (req, res) => {
    const filePath = path.join(__dirname, '../public', 'catalog.docx');
    res.download(filePath, 'catalog.docx', (err) => {
        if (err) {
            console.error('Ошибка при скачивании файла:', err);
            res.status(500).send('Не удалось скачать файл.');
        }
    });
});

// Маршрут для скачивания Excel-файла с данными из базы данных
app.get('/download-catalog', async (req, res) => {
    try {
        // Получаем данные из базы данных
        const result = await client.query('SELECT * FROM товары');

        // Преобразуем данные в формат, подходящий для Excel
        const data = result.rows.map(row => ({
            Название: row.name,
            Описание: row.description,
            Цена: row.price,
        }));

        // Создаем новый Excel-документ
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Каталог');

        // Генерируем файл в памяти
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Отправляем файл пользователю
        res.setHeader('Content-Disposition', 'attachment; filename="catalog.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Ошибка при создании Excel-файла:', err);
        res.status(500).send('Ошибка при создании файла.');
    }
});

// Обработка формы (пример для будущей логики)
app.post('/send-form', express.json(), (req, res) => {
    const { name, phone, message } = req.body;
    console.log('Получены данные формы:', { name, phone, message });
    res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});