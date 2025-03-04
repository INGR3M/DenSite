//отправка через тухлого бота в тг
require('dotenv').config(); // Загружаем переменные окружения

document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      message: document.getElementById('message').value
    };

    sendToTelegram(formData);
  });

  function sendToTelegram(data) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const message = `Новая заявка с сайта:\nИмя: ${data.name}\nТелефон: ${data.phone} \nПочта: ${data.email}\nСообщение: ${data.message}`;

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Сообщение отправлено в Telegram:', result);
      alert('Заявка отправлена! Мы свяжемся с вами в ближайшее время.');
    })
    .catch(error => {
      console.error('Ошибка при отправке в Telegram:', error);
      alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
    });
    document.getElementById('contactForm').reset();
  }