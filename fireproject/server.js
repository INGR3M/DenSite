delete require.cache[require.resolve('dotenv/config')]; // без этого в теории могут возникнуть ошибки
require('dotenv').config(); // Перезагрузить переменные окружения
const express = require('express');
const path = require('path');
const { Client } = require('pg');
//const XLSX = require('xlsx-style');
const ExcelJS = require('exceljs');
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
app.use(express.static(path.join(__dirname, 'public')));


// Маршрут для главной страницы
const filePath = path.join(__dirname, '../public', 'index.html');

app.get('/download-catalog', async (req, res) => {
    try {
        const result = await client.query(`
            SELECT t.type_id, tt.name as type_name, t.name, t.shtuka, t.priceopt, t.priceneopt
            FROM tovary t
            JOIN typetovara tt ON t.type_id = tt.id
            ORDER BY t.type_id;
        `);

        const rows = result.rows;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Каталог');

        let currentRow = 1;
        let currentTypeId = null;

        rows.forEach(row => {
            if (row.type_id !== currentTypeId) {
                // Добавляем заголовок группы товаров (Объединённая ячейка)
                worksheet.mergeCells(currentRow, 1, currentRow, 4);
                const titleCell = worksheet.getCell(currentRow, 1);
                titleCell.value = row.type_name;
                titleCell.font = { bold: true, size: 14 };
                titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
                titleCell.border = { 
                    top: { style: 'thick' },    // Жирная граница сверху
                    bottom: { style: 'thick' }, // Жирная граница снизу
                    left: { style: 'thick' },   // Жирная граница слева
                    right: { style: 'thick' }   // Жирная граница справа
                };
                currentRow++;

                // Заголовки столбцов
                worksheet.addRow(['Наименование', 'Ед. изм.', 'Цена розничная, руб.', 'Цена оптовая, руб.']);
                worksheet.getRow(currentRow).font = { bold: true };
                worksheet.getRow(currentRow).alignment = { horizontal: 'center' };
                worksheet.getRow(currentRow).border = {
                    bottom: { style: 'thin' },
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                };
                currentRow++;

                currentTypeId = row.type_id;
            }

            // Проверяем цены
            let priceopt = row.priceopt || 'По запросу';
            let priceneopt = row.priceneopt || '';

            if (!row.priceopt && !row.priceneopt) {
                priceneopt = 'По запросу';
            }

            //  Добавляем строку товара
            worksheet.addRow([row.name, 'шт', priceopt, priceneopt]);

            //  Добавляем границы для строки
            worksheet.getRow(currentRow).eachCell(cell => {
                cell.border = {
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                };
            });

            currentRow++;
        });

        //  Автоматическая ширина колонок
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const text = cell.value ? cell.value.toString() : '';
                maxLength = Math.max(maxLength, text.length);
            });
            column.width = maxLength + 2;
        });

        //  Отправляем файл пользователю
        res.setHeader('Content-Disposition', 'attachment; filename="catalog.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Ошибка при создании Excel-файла:', err);
        res.status(500).send('Ошибка при создании файла.');
    }
});

// Маршрут для получения конфигурации
app.post('/send-message', (req, res) => {
    const { name, phone, email, message } = req.body;

    if (!name || !phone || !email || !message) {
        return res.status(400).json({ message: 'Не все поля заполнены!' });
    }

    // Проверим, что токен и чат ID существуют
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        return res.status(500).json({ message: 'Ошибка: Не указаны токен или чат ID.' });
    }

    // Формируем сообщение для Telegram
    const telegramMessage = `Новая заявка с сайта:\nИмя: ${name}\nТелефон: ${phone}\nEmail: ${email}\nСообщение: ${message}`;

    // Отправляем сообщение в Telegram
    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage
        })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Ответ от Telegram:', result);
        res.json({ success: true, message: 'Заявка успешно отправлена!' });
    })
    .catch(error => {
        console.error('Ошибка при отправке сообщения в Telegram:', error);
        res.status(500).json({ message: 'Произошла ошибка при отправке заявки.' });
    });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});