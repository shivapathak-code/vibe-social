document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');
  const formAlert = document.getElementById('form-alert');
  const forgotAlert = document.getElementById('forgot-alert');

  const showAlert = (alertEl, message, isError = true) => {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = isError ? 'form-error' : 'form-error success';
    alertEl.style.background = isError ? 'rgba(255, 118, 117, 0.1)' : 'rgba(0, 184, 148, 0.1)';
    alertEl.style.color = isError ? 'var(--danger)' : 'var(--success)';
    alertEl.classList.remove('hidden');
  };

  const hideAlert = (alertEl) => {
    if (!alertEl) return;
    alertEl.classList.add('hidden');
  };

  // Login handler
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(formAlert);

      const loginVal = document.getElementById('login').value.trim();
      const passwordVal = document.getElementById('password').value;
      const rememberVal = document.getElementById('remember').checked;

      const submitBtn = document.getElementById('submit-btn');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="btn-spinner"></div>';

      try {
        const data = await window.API.post('/auth/login', {
          login: loginVal,
          password: passwordVal,
          remember: rememberVal
        });

        if (data.success) {
          window.currentUser = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/feed';
        }
      } catch (err) {
        showAlert(formAlert, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // Register handler
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(formAlert);

      const fullName = document.getElementById('fullName').value.trim();
      const username = document.getElementById('username').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      const submitBtn = document.getElementById('submit-btn');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="btn-spinner"></div>';

      try {
        const data = await window.API.post('/auth/register', {
          fullName,
          username,
          email,
          password
        });

        if (data.success) {
          window.currentUser = data.user;
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/feed';
        }
      } catch (err) {
        showAlert(formAlert, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }

  // Forgot password handler
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(forgotAlert);

      const emailVal = document.getElementById('forgot-email').value.trim();
      const submitBtn = document.getElementById('forgot-submit-btn');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="btn-spinner"></div>';

      try {
        const data = await window.API.post('/auth/forgot-password', {
          email: emailVal
        });

        if (data.success) {
          showAlert(forgotAlert, data.message, false);
          // In development mode, mock email by outputting link
          if (data.resetUrl) {
            console.log("Mock recovery link:", data.resetUrl);
          }
        }
      } catch (err) {
        showAlert(forgotAlert, err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });
  }
});
