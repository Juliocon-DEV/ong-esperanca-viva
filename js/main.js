document.addEventListener('DOMContentLoaded', () => {
  const safeStorage = {
    get(key) {
      try { return localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
    }
  };

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  /* Gerenciamento do Modo Claro / Escuro */
  const themeToggleBtn = document.querySelector('#theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = safeStorage.get('esperancaVivaTema');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = '<span aria-hidden="true">☀️</span> Modo Claro';
        themeToggleBtn.setAttribute('aria-label', 'Alternar para Modo Claro');
      }
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = '<span aria-hidden="true">🌙</span> Modo Escuro';
        themeToggleBtn.setAttribute('aria-label', 'Alternar para Modo Escuro');
      }
    }
  };

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDark) {
    applyTheme('dark');
  }

  themeToggleBtn?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    safeStorage.set('esperancaVivaTema', newTheme);
  });

  const impactSection = document.querySelector('#impacto');
  const counters = document.querySelectorAll('[data-counter]');

  const animateCounters = () => {
    counters.forEach((counter) => {
      const target = Number(counter.dataset.counter);
      const prefix = counter.dataset.prefix || '';
      const suffix = counter.dataset.suffix || '';
      const totalSteps = 80;
      let currentStep = 0;
      const interval = window.setInterval(() => {
        currentStep += 1;
        const value = Math.round(target * (currentStep / totalSteps));
        counter.textContent = `${prefix}${value.toLocaleString('pt-BR')}${suffix}`;
        if (currentStep === totalSteps) window.clearInterval(interval);
      }, 20);
    });
  };

  if (impactSection && counters.length) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          animateCounters();
          observer.disconnect();
        }
      }, { threshold: 0.25 });
      observer.observe(impactSection);
    } else {
      animateCounters();
    }
  }

  const toast = document.querySelector('.toast-container');
  if (toast && !safeStorage.get('esperancaVivaToastFechado')) {
    window.setTimeout(() => {
      toast.classList.add('is-visible');
      toast.setAttribute('aria-hidden', 'false');
    }, 3000);

    toast.querySelector('.toast-close')?.addEventListener('click', () => {
      toast.classList.remove('is-visible');
      toast.setAttribute('aria-hidden', 'true');
      safeStorage.set('esperancaVivaToastFechado', 'true');
    });
  }

  const modal = document.querySelector('#modal-doacao');
  if (!modal) return;

  let lastFocusedElement;
  const openModal = () => {
    lastFocusedElement = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.querySelector('[data-modal-close]')?.focus();
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    safeStorage.set('esperancaVivaModalFechado', 'true');
    window.setTimeout(() => { modal.hidden = true; }, 250);
    lastFocusedElement?.focus();
  };

  document.querySelectorAll('[data-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  });
  modal.querySelectorAll('[data-modal-close]').forEach((button) => {
    button.addEventListener('click', closeModal);
  });
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    if (event.key !== 'Tab' || !modal.classList.contains('is-open')) return;

    const focusable = [...modal.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const copyButton = modal.querySelector('[data-copy-pix]');
  copyButton?.addEventListener('click', async () => {
    const pix = copyButton.dataset.pixValue;
    const originalLabel = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(pix);
      copyButton.textContent = 'Chave PIX copiada!';
    } catch {
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = pix;
      temporaryInput.setAttribute('readonly', '');
      temporaryInput.style.position = 'fixed';
      temporaryInput.style.opacity = '0';
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand('copy');
      temporaryInput.remove();
      copyButton.textContent = copied ? 'Chave PIX copiada!' : 'Não foi possível copiar';
    }
    window.setTimeout(() => { copyButton.textContent = originalLabel; }, 2200);
  });
});
