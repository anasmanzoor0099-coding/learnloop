import { api, getCurrentUser } from './api.js';
import { setButtonLoading, showToast } from './ui.js';

const mode = document.body.dataset.authPage;
const form = document.querySelector('[data-auth-form]');
const submitButton = form?.querySelector('button[type="submit"]');
const formError = form?.querySelector('[data-form-error]');

const DEMO_ACCOUNTS = {
  student: {
    email: 'student@learnloop.dev',
    password: 'Student123!'
  },
  instructor: {
    email: 'instructor@learnloop.dev',
    password: 'Teach123!'
  }
};

let submitting = false;

function nextPath(user) {
  const requested = new URLSearchParams(window.location.search).get('next');

  if (requested?.startsWith('/') && !requested.startsWith('//')) {
    return requested;
  }

  return user?.role === 'instructor' ? '/studio.html' : '/dashboard.html';
}

function fieldElement(name) {
  return form?.elements.namedItem(name);
}

function errorElement(name) {
  return form?.querySelector(`[data-error-for="${name}"]`);
}

function clearFieldError(name) {
  const error = errorElement(name);
  const field = fieldElement(name);

  if (error) error.textContent = '';
  if (field instanceof HTMLElement) field.removeAttribute('aria-invalid');
}

function clearErrors() {
  form?.querySelectorAll('[data-error-for]').forEach((element) => {
    element.textContent = '';
  });

  form?.querySelectorAll('[aria-invalid="true"]').forEach((element) => {
    element.removeAttribute('aria-invalid');
  });

  if (formError) {
    formError.hidden = true;
    formError.textContent = '';
  }
}

function setFieldError(name, message) {
  const error = errorElement(name);
  const field = fieldElement(name);

  if (error) error.textContent = message;
  if (field instanceof HTMLElement) field.setAttribute('aria-invalid', 'true');
}

function showFormError(message) {
  if (!formError) return;
  formError.textContent = message;
  formError.hidden = false;
}

function validate(values) {
  let firstInvalid = null;

  if (mode === 'register' && values.name.trim().length < 2) {
    setFieldError('name', 'Enter your full name (at least 2 characters).');
    firstInvalid ||= 'name';
  }

  if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    setFieldError('email', 'Enter a valid email address.');
    firstInvalid ||= 'email';
  }

  if (!values.password) {
    setFieldError('password', 'Enter your password.');
    firstInvalid ||= 'password';
  } else if (mode === 'register' && values.password.length < 8) {
    setFieldError('password', 'Use at least 8 characters.');
    firstInvalid ||= 'password';
  }

  if (firstInvalid) {
    const field = fieldElement(firstInvalid);
    if (field instanceof HTMLElement) field.focus();
    return false;
  }

  return true;
}

async function redirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user) window.location.replace(nextPath(user));
}

if (form) {
  form.addEventListener('input', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.name) {
      clearFieldError(target.name);
      if (formError) {
        formError.hidden = true;
        formError.textContent = '';
      }
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;

    clearErrors();

    const formData = new FormData(form);
    const values = {
      name: String(formData.get('name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      password: String(formData.get('password') || '')
    };

    if (!validate(values)) return;

    submitting = true;
    setButtonLoading(
      submitButton,
      true,
      mode === 'register' ? 'Creating account…' : 'Logging in…'
    );

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register'
          ? values
          : { email: values.email, password: values.password };

      const data = await api(endpoint, {
        method: 'POST',
        body: payload
      });

      showToast(
        mode === 'register'
          ? 'Your account is ready. Welcome to LearnLoop.'
          : `Welcome back, ${data.user.name.split(/\s+/)[0]}.`
      );

      window.setTimeout(() => {
        window.location.assign(nextPath(data.user));
      }, 350);
    } catch (error) {
      if (error.details && typeof error.details === 'object') {
        for (const [field, messages] of Object.entries(error.details)) {
          if (!errorElement(field)) continue;
          const message = Array.isArray(messages) ? messages[0] : String(messages);
          setFieldError(field, message);
        }
      }

      if (error.status === 409) {
        setFieldError('email', error.message);
      }

      showFormError(error.message || 'Something went wrong. Please try again.');
      setButtonLoading(submitButton, false);
      submitting = false;
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Password visibility                                                        */
/* -------------------------------------------------------------------------- */

document.querySelectorAll('[data-toggle-password]').forEach((button) => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.togglePassword);
    if (!(input instanceof HTMLInputElement)) return;

    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.textContent = show ? 'Hide' : 'Show';
    button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
});

/* -------------------------------------------------------------------------- */
/* Demo accounts                                                              */
/* -------------------------------------------------------------------------- */

document.querySelectorAll('[data-demo]').forEach((button) => {
  button.addEventListener('click', () => {
    const account = DEMO_ACCOUNTS[button.dataset.demo];
    if (!account || !form) return;

    const email = fieldElement('email');
    const password = fieldElement('password');

    if (email instanceof HTMLInputElement) email.value = account.email;
    if (password instanceof HTMLInputElement) password.value = account.password;

    form.requestSubmit();
  });
});

/* -------------------------------------------------------------------------- */
/* Preserve ?next= when switching between login and register                  */
/* -------------------------------------------------------------------------- */

const next = new URLSearchParams(window.location.search).get('next');

if (next) {
  document.querySelectorAll('a[href="/login.html"], a[href="/register.html"]').forEach((link) => {
    const url = new URL(link.getAttribute('href'), window.location.origin);
    url.searchParams.set('next', next);
    link.href = `${url.pathname}${url.search}`;
  });
}

redirectIfSignedIn();
