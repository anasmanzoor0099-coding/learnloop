const toastStack = document.querySelector('[data-toast-stack]');

export function showToast(message, options = {}) {
  if (!toastStack) return;

  const toast = document.createElement('div');
  toast.className = `toast${options.tone === 'error' ? ' is-error' : ''}`;
  toast.setAttribute('role', 'status');

  const dot = document.createElement('span');
  dot.className = 'toast-dot';
  dot.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.textContent = message;

  toast.append(dot, text);
  toastStack.append(toast);

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    window.setTimeout(() => toast.remove(), 180);
  }, 3600);
}

export function setButtonLoading(button, loading, loadingText = 'Please wait…') {
  if (!button) return;

  if (loading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;
    button.textContent = loadingText;
    return;
  }

  button.disabled = false;
  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
    delete button.dataset.originalHtml;
  }
}
