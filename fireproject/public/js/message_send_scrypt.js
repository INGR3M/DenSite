//отправка через тухлого бота в тг
document.getElementById('contactForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      message: document.getElementById('message').value
    };

    sendToTelegram(formData);
  });

  function sendToTelegram(data) {
    const botToken = '7973300187:AAF8LXe-T4KleDIdRGg9K0mkWVtH04FkdaA';
    const chatId = '647544438';
    const message = `Новая заявка с сайта:\nИмя: ${data.name}\nТелефон: ${data.phone}\nСообщение: ${data.message}`;

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