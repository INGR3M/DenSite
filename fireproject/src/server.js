const express = require('express');
const path = require('path');
const { Client } = require('pg');
const XLSX = require('xlsx');
const fetch = require('node-fetch'); // Для отправки запросов к Telegram API

const app = express();
const port = 3000;

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

// Middleware для обработки JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздача статических файлов из папки public
app.use(express.static(path.join(__dirname, '../public')));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
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

        // Настройка ширины столбцов
        const columnWidths = calculateColumnWidths(data); // Функция для расчета ширины столбцов
        worksheet['!cols'] = columnWidths;

        // Генерируем файл в памяти
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Отправляем файл пользователю
        res.setHeader('Content-Disposition', 'attachment; filename="catalog.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Ошибка при создании Excel-фильма:', err);
        res.status(500).send('Ошибка при создании файла.');
    }
});

// Функция для расчета ширины столбцов
function calculateColumnWidths(data) {
    const maxLengths = {};

    // Находим максимальную длину текста в каждом столбце
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            const length = String(row[key]).length;
            if (!maxLengths[key] || length > maxLengths[key]) {
                maxLengths[key] = length;
            }
        });
    });

    // Преобразуем максимальные длины в ширину столбцов
    return Object.keys(maxLengths).map(key => ({
        wch: maxLengths[key] + 2, // Добавляем небольшой отступ
    }));
}

 /* Маршрут для обработки формы и отправки данных в Telegram
app.post('/send-form', async (req, res) => {
    const { name, phone, message } = req.body;

    try {
        // Отправляем данные в Telegram
        const botToken = '7973300187:AAF8LXe-T4KleDIdRGg9K0mkWVtH04FkdaA';
        const chatId = '647544438';
        const telegramMessage = `Новая заявка с сайта:\nИмя: ${name}\nТелефон: ${phone}\nСообщение: ${message}`;

        console.log('Отправка сообщения в Telegram:', telegramMessage);

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: telegramMessage
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Ошибка при отправке в Telegram:', errorText);
            throw new Error('Ошибка при отправке в Telegram');
        }

        const result = await response.json();
        console.log('Сообщение отправлено в Telegram:', result);

        // Отправляем ответ клиенту
        res.json({ success: true, message: 'Ваша заявка успешно отправлена!' });
    } catch (error) {
        console.error('Ошибка при отправке в Telegram:', error);
        res.status(500).json({ success: false, message: 'Произошла ошибка при отправке заявки.' });
    }
});*/ //пока не работает, не уверен, что хочу разбираться в этом

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});