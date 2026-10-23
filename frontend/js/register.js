import { api } from './api.js';
import { showToast } from './ui.js';

const form = document.querySelector('[data-auth-form]');
const heading = document.querySelector('.auth-heading');
const switchText = document.querySelector('.auth-switch');
const legalText = document.querySelector('.auth-legal');

if (!form) {
  throw new Error('Registration form was not found.');
}

let currentStep = 'email';
let verifiedEmail = '';
let verificationToken = '';
let busy = false;
let resendTimer = null;

const originalHeading = heading.innerHTML;
const originalSwitch = switchText.innerHTML;
const originalLegal = legalText.innerHTML;

function renderStep(step) {
  currentStep = step;
  form.innerHTML = '';
  form.noValidate = true;

  if (step === 'email') {
    heading.innerHTML = `
      <p class="eyebrow">Create your account</p>
      <h2>Start your first loop.</h2>
      <p>First, verify your email address.</p>
    `;

    form.innerHTML = `
      <div class="field">
        <label for="register-email">Email address</label>
        <input id="register-email" name="email" type="email"
          inputmode="email" autocomplete="email"
          placeholder="you@example.com" maxlength="120" required />
        <p class="field-error" data-error-for="email"></p>
      </div>
      <div class="form-error" data-form-error hidden></div>
      <button class="button button-primary button-full auth-submit"
        type="submit">Send verification code</button>
    `;

    switchText.innerHTML =
      'Already have an account? <a href="/login.html">Log in</a>';

    legalText.innerHTML =
      'We will email you a one-time verification code. Never share it with anyone.';
  }

  if (step === 'otp') {
    heading.innerHTML = `
      <p class="eyebrow">Email verification</p>
      <h2>Check your inbox.</h2>
      <p>Enter the 6-digit code sent to <strong class="verified-email"></strong>.</p>
    `;

    heading.querySelector('.verified-email').textContent = verifiedEmail;

    form.innerHTML = `
      <div class="field">
        <label for="register-code">6-digit verification code</label>
        <input id="register-code" name="code" type="text"
          inputmode="numeric" autocomplete="one-time-code"
          placeholder="123456" maxlength="6" pattern="[0-9]{6}" required />
        <p class="field-error" data-error-for="code"></p>
      </div>
      <div class="form-error" data-form-error hidden></div>
      <button class="button button-primary button-full auth-submit"
        type="submit">Verify email</button>
      <button class="button button-full" type="button" data-resend>
        Resend code
      </button>
      <button class="button button-full" type="button" data-change-email>
        Use a different email
      </button>
    `;

    switchText.innerHTML =
      'Already have an account? <a href="/login.html">Log in</a>';

    legalText.textContent =
      'Your code expires after 10 minutes. Check your spam folder if needed.';
  }

  if (step === 'details') {
    heading.innerHTML = `
      <p class="eyebrow">Email verified</p>
      <h2>Make it official.</h2>
      <p>Create your LearnLoop student account.</p>
    `;

    form.innerHTML = `
      <div class="field">
        <label for="register-name">Full name</label>
        <input id="register-name" name="name" type="text"
          autocomplete="name" placeholder="Your full name"
          minlength="2" maxlength="60" required />
        <p class="field-error" data-error-for="name"></p>
      </div>
      <div class="field">
        <label for="register-password">Password</label>
        <div class="password-wrap">
          <input id="register-password" name="password" type="password"
            autocomplete="new-password" placeholder="At least 8 characters"
            minlength="8" maxlength="72" required />
          <button class="password-toggle" type="button"
            data-toggle-password="register-password"
            aria-label="Show password">Show</button>
        </div>
        <p class="field-hint">Use at least 8 characters.</p>
        <p class="field-error" data-error-for="password"></p>
      </div>
      <div class="form-error" data-form-error hidden></div>
      <button class="button button-primary button-full auth-submit"
        type="submit">Create my free account</button>
    `;

    switchText.innerHTML =
      'Already have an account? <a href="/login.html">Log in</a>';

    legalText.textContent =
      'Keep your password private and secure.';
  }

  busy = false;
}

function showError(message) {
  const box = form.querySelector('[data-form-error]');
  if (!box) return;

  box.textContent = message;
  box.hidden = false;
}

function setBusy(value, label) {
  busy = value;
  const button = form.querySelector('button[type="submit"]');

  if (button) {
    if (value) {
      button.dataset.originalText = button.textContent;
      button.textContent = label;
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;
      delete button.dataset.originalText;
    }

    button.disabled = value;
  }
}

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function startResendCooldown() {
  const button = form.querySelector('[data-resend]');
  if (!button) return;

  let seconds = 60;
  button.disabled = true;
  button.textContent = `Resend code in ${seconds}s`;

  if (resendTimer) clearInterval(resendTimer);

  resendTimer = setInterval(() => {
    seconds -= 1;

    if (seconds <= 0) {
      clearInterval(resendTimer);
      resendTimer = null;

      const currentButton = form.querySelector('[data-resend]');
      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent = 'Resend code';
      }

      return;
    }

    const currentButton = form.querySelector('[data-resend]');
    if (currentButton) {
      currentButton.textContent = `Resend code in ${seconds}s`;
    }
  }, 1000);
}

form.addEventListener('input', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) return;

  const error = form.querySelector(
    `[data-error-for="${target.name}"]`
  );

  if (error) error.textContent = '';

  const box = form.querySelector('[data-form-error]');
  if (box) {
    box.hidden = true;
    box.textContent = '';
  }

  if (target.name === 'code') {
    target.value = target.value.replace(/\D/g, '').slice(0, 6);
  }
});

form.addEventListener('click', async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const toggle = target.closest('[data-toggle-password]');

  if (toggle) {
    const input = document.getElementById(
      toggle.dataset.togglePassword
    );

    if (!(input instanceof HTMLInputElement)) return;

    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    toggle.textContent = show ? 'Hide' : 'Show';
    toggle.setAttribute(
      'aria-label',
      show ? 'Hide password' : 'Show password'
    );
    return;
  }

  if (target.closest('[data-change-email]')) {
    if (resendTimer) clearInterval(resendTimer);
    verifiedEmail = '';
    verificationToken = '';
    renderStep('email');
    return;
  }

  if (target.closest('[data-resend]')) {
    if (busy) return;

    setBusy(true, 'Sending code…');

    try {
      await api('/api/auth/send-otp', {
        method: 'POST',
        body: { email: verifiedEmail }
      });

      showToast('A new verification code has been sent.');
      startResendCooldown();
    } catch (error) {
      showError(error.message || 'Could not resend the code.');
    } finally {
      setBusy(false);
    }
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;

  const data = new FormData(form);

  try {
    if (currentStep === 'email') {
      const email = String(data.get('email') || '')
        .trim()
        .toLowerCase();

      if (!validEmail(email)) {
        showError('Enter a valid email address.');
        return;
      }

      setBusy(true, 'Sending code…');

      await api('/api/auth/send-otp', {
        method: 'POST',
        body: { email }
      });

      verifiedEmail = email;
      renderStep('otp');
      startResendCooldown();
      showToast('Check your email for the verification code.');
      return;
    }

    if (currentStep === 'otp') {
      const code = String(data.get('code') || '').trim();

      if (!/^\d{6}$/.test(code)) {
        showError('Enter the 6-digit code from your email.');
        return;
      }

      setBusy(true, 'Verifying…');

      const result = await api('/api/auth/verify-otp', {
        method: 'POST',
        body: { email: verifiedEmail, code }
      });

      verificationToken = result.verificationToken;

      if (!verificationToken) {
        throw new Error('Verification succeeded but no token was returned.');
      }

      if (resendTimer) clearInterval(resendTimer);

      renderStep('details');
      showToast('Email verified successfully.');
      return;
    }

    if (currentStep === 'details') {
      const name = String(data.get('name') || '').trim();
      const password = String(data.get('password') || '');

      if (name.length < 2) {
        showError('Enter your full name (at least 2 characters).');
        return;
      }

      if (password.length < 8) {
        showError('Your password must be at least 8 characters.');
        return;
      }

      if (!verificationToken) {
        throw new Error('Please verify your email again.');
      }

      setBusy(true, 'Creating account…');

      const result = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name,
          email: verifiedEmail,
          password,
          verificationToken
        }
      });

      showToast(`Welcome to LearnLoop, ${result.user.name.split(/\s+/)[0]}!`);

      const next = new URLSearchParams(window.location.search).get('next');
      const destination =
        next?.startsWith('/') && !next.startsWith('//')
          ? next
          : '/dashboard.html';

      window.setTimeout(() => {
        window.location.assign(destination);
      }, 350);
    }
  } catch (error) {
    showError(error.message || 'Something went wrong. Please try again.');
  } finally {
    setBusy(false);
  }
});

// Start with the email verification stage.
renderStep('email');