const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  message.textContent = '';

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: form.elements.password.value })
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || '로그인에 실패했습니다.');
    }
    window.location.assign('/admin');
  } catch (error) {
    message.textContent = error.message;
    message.className = 'notice notice-error';
  } finally {
    button.disabled = false;
  }
});
