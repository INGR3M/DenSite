function validateEmail(email) {
    var re = /^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,4}$/i;
    return re.test(String(email).toLowerCase());
}


document.getElementById('contactForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const formData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      email: document.getElementById('email').value,
      message: document.getElementById('message').value
  };
  if (validateEmail(document.getElementById('email').value)){
    fetch('/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        alert(result.message || 'Заявка отправлена! Теперь вы можете скачать каталог.');
        
    })
    .then(document.getElementById('catalog-btn').setAttribute('onclick', 'alert("Кнопка нажата")'))
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Произошла ошибка, попробуйте снова.');
    });
  
    document.getElementById('contactForm').reset();
  }
  else{
    alert("Почта введена некорректно!")
  }
});
