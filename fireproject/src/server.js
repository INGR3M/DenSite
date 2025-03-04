const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

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