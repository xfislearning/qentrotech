// ===== Mobile menu =====
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMenu() {
  if (!navLinks) return;
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || menuToggle.contains(e.target)) return;
    closeMenu();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(); });
}

// ===== Footer year =====
document.querySelectorAll('.year').forEach(el => { el.textContent = new Date().getFullYear(); });

// ===== Ask AI widget =====
const askAiWidget = document.createElement('section');
askAiWidget.className = 'ask-ai-widget';
askAiWidget.innerHTML = `
  <button class="ask-ai-toggle" type="button" aria-expanded="false" aria-controls="ask-ai-panel">
    <span class="ask-ai-spark">AI</span>
    <span>Ask AI</span>
  </button>
  <div class="ask-ai-panel" id="ask-ai-panel" aria-hidden="true">
    <div class="ask-ai-head">
      <div>
        <p>Qentro Assistant</p>
        <strong>Ask about private AI</strong>
      </div>
      <button class="ask-ai-close" type="button" aria-label="Close Ask AI">×</button>
    </div>
    <div class="ask-ai-messages" aria-live="polite">
      <div class="ask-ai-message bot">Hi, I can help you explore where private AI may fit your business.</div>
    </div>
    <div class="ask-ai-prompts" aria-label="Suggested questions">
      <button type="button">What can AI do for my business?</button>
      <button type="button">How do privacy levels work?</button>
      <button type="button">Where should I start?</button>
    </div>
    <form class="ask-ai-form">
      <input type="text" name="question" placeholder="Ask a question..." aria-label="Ask a question" autocomplete="off" />
      <button type="submit">Send</button>
    </form>
  </div>
`;
document.body.appendChild(askAiWidget);

const askAiToggle = askAiWidget.querySelector('.ask-ai-toggle');
const askAiPanel = askAiWidget.querySelector('.ask-ai-panel');
const askAiClose = askAiWidget.querySelector('.ask-ai-close');
const askAiMessages = askAiWidget.querySelector('.ask-ai-messages');
const askAiPrompts = askAiWidget.querySelector('.ask-ai-prompts');
const askAiForm = askAiWidget.querySelector('.ask-ai-form');
const askAiInput = askAiWidget.querySelector('.ask-ai-form input');

function setAskAiOpen(open) {
  askAiWidget.classList.toggle('open', open);
  askAiToggle.setAttribute('aria-expanded', String(open));
  askAiPanel.setAttribute('aria-hidden', String(!open));
  if (open) askAiInput.focus();
}

function addAskAiMessage(text, type = 'bot') {
  if (type === 'user') hideAskAiPrompts();
  const message = document.createElement('div');
  message.className = `ask-ai-message ${type}`;
  message.textContent = text;
  askAiMessages.appendChild(message);
  askAiMessages.scrollTop = askAiMessages.scrollHeight;
}

function hideAskAiPrompts() {
  if (askAiPrompts) askAiPrompts.hidden = true;
}

let websiteSearchIndexPromise;

function normalizeSearchText(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearchText(text) {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'do', 'for', 'from',
    'how', 'i', 'in', 'is', 'it', 'of', 'on', 'or', 'our', 'the', 'their', 'this', 'to',
    'we', 'what', 'where', 'with', 'you', 'your'
  ]);
  return normalizeSearchText(text)
    .split(' ')
    .filter(word => word.length > 2 && !stopWords.has(word));
}

function buildCurrentPageIndex() {
  const pageTitle = document.title.replace(/\s*\|\s*Qentro\s*$/, '') || 'Current page';
  const nodes = Array.from(document.querySelectorAll('main h1, main h2, main h3, main p, main li'));
  return nodes
    .map(node => node.textContent.trim())
    .filter(text => text.length > 30)
    .map((text, index) => ({
      title: pageTitle,
      url: window.location.pathname.split('/').pop() || 'index.html',
      heading: pageTitle,
      text,
      id: `current-${index}`
    }));
}

function loadWebsiteSearchIndex() {
  if (!websiteSearchIndexPromise) {
    websiteSearchIndexPromise = fetch('website-search-index.json', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      })
      .then(data => Array.isArray(data.pages) ? data.pages : [])
      .catch(() => buildCurrentPageIndex());
  }
  return websiteSearchIndexPromise;
}

function scoreSearchItem(item, queryTokens, normalizedQuery) {
  const haystack = normalizeSearchText(`${item.title} ${item.heading} ${item.text}`);
  let score = 0;
  queryTokens.forEach(token => {
    if (haystack.includes(token)) score += 4;
    if (normalizeSearchText(item.title).includes(token)) score += 3;
    if (normalizeSearchText(item.heading).includes(token)) score += 2;
  });
  if (normalizedQuery && haystack.includes(normalizedQuery)) score += 8;
  return score;
}

async function answerAskAi(question) {
  const queryTokens = tokenizeSearchText(question);
  if (!queryTokens.length) {
    return 'Ask a little more specifically, like "How do privacy levels work?" or "What can AI do for operations?"';
  }

  const index = await loadWebsiteSearchIndex();
  const normalizedQuery = normalizeSearchText(question);
  const best = index
    .map(item => ({ item, score: scoreSearchItem(item, queryTokens, normalizedQuery) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (!best) {
    return 'I could not find a strong match in the website content. Try asking about privacy levels, pricing, business outcomes, the process, or Qentro services.';
  }

  const location = best.item.heading && best.item.heading !== best.item.title
    ? `${best.item.title} - ${best.item.heading}`
    : best.item.title;
  return `${location}: ${best.item.text}`;
}

askAiToggle.addEventListener('click', () => setAskAiOpen(!askAiWidget.classList.contains('open')));
askAiClose.addEventListener('click', () => setAskAiOpen(false));
askAiWidget.querySelectorAll('.ask-ai-prompts button').forEach(button => {
  button.addEventListener('click', async () => {
    const question = button.textContent.trim();
    hideAskAiPrompts();
    addAskAiMessage(question, 'user');
    addAskAiMessage('Searching the website...', 'bot');
    askAiMessages.lastElementChild.textContent = await answerAskAi(question);
  });
});
askAiForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = askAiInput.value.trim();
  if (!question) return;
  askAiInput.value = '';
  hideAskAiPrompts();
  addAskAiMessage(question, 'user');
  addAskAiMessage('Searching the website...', 'bot');
  askAiMessages.lastElementChild.textContent = await answerAskAi(question);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && askAiWidget.classList.contains('open')) setAskAiOpen(false);
});

// ===== Community custom Google Forms =====
const communityFormSection = document.querySelector('.community-form-section');
if (communityFormSection) {
  const communityForms = Array.from(communityFormSection.querySelectorAll('.community-form'));

  document.querySelectorAll('.community-form-trigger').forEach(button => {
    button.addEventListener('click', () => {
      const formType = button.dataset.form;
      communityFormSection.classList.add('open');
      communityFormSection.setAttribute('aria-hidden', 'false');
      communityForms.forEach(form => form.classList.toggle('active', form.dataset.form === formType));
      communityFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  communityForms.forEach(form => {
    form.addEventListener('submit', () => {
      const status = form.querySelector('.quiz-status');
      const submitButton = form.querySelector('button[type="submit"]');
      status.textContent = 'Sending...';
      status.className = 'quiz-status';
      submitButton.disabled = true;
      window.setTimeout(() => {
        status.textContent = 'Sent. Thank you for signing up.';
        status.className = 'quiz-status ok';
        submitButton.textContent = 'Sent \u2713';
        window.setTimeout(() => { window.location.href = 'index.html'; }, 900);
      }, 900);
    });
  });
}

// ===== Self-assessment quiz (assessment.html) =====
const googleFormConfig = {
  action: 'https://docs.google.com/forms/d/e/1FAIpQLSc0BLVj6cjsB7-FIK5EAGlntAufweepR5WbBHdw_IM3vXqjSQ/formResponse',
  entries: {
    name: 'entry.80795223',
    email: 'entry.1011285081',
    message: 'entry.23195374'
  }
};

function submitGoogleForm(payload) {
  return new Promise((resolve, reject) => {
    if (!googleFormConfig.action || Object.values(googleFormConfig.entries).some(value => !value)) {
      reject(new Error('Google Form is not configured yet.'));
      return;
    }

    const frameName = `google-form-target-${Date.now()}`;
    const iframe = document.createElement('iframe');
    iframe.name = frameName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = googleFormConfig.action;
    form.target = frameName;
    form.style.display = 'none';

    Object.entries(googleFormConfig.entries).forEach(([key, entryName]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = entryName;
      input.value = payload[key] || '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    iframe.addEventListener('load', () => {
      form.remove();
      iframe.remove();
      resolve();
    }, { once: true });

    form.submit();
    window.setTimeout(() => {
      if (document.body.contains(form)) form.remove();
      if (document.body.contains(iframe)) iframe.remove();
      resolve();
    }, 1500);
  });
}

const quiz = document.querySelector('.quiz-card');
if (quiz) {
  const questions = Array.from(quiz.querySelectorAll('.quiz-q'));
  const bar = quiz.querySelector('.quiz-progress i');
  const counter = quiz.querySelector('.quiz-count');
  const answers = {};
  let index = 0;

  function show(i) {
    index = Math.max(0, Math.min(i, questions.length - 1));
    questions.forEach((q, n) => q.classList.toggle('current', n === index));
    bar.style.width = Math.round(((index + 1) / questions.length) * 100) + '%';
    counter.textContent = index < questions.length - 1
      ? `Question ${index + 1} of ${questions.length - 1}`
      : 'Last step';
  }

  quiz.querySelectorAll('.quiz-opts button').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.closest('.quiz-q');
      if (q.dataset.multi === 'true') {
        const selected = Array.from(q.querySelectorAll('.quiz-opts button.selected'));
        const max = Number(q.dataset.max || 0);
        const status = q.querySelector('.quiz-status');
        if (!btn.classList.contains('selected') && max && selected.length >= max) {
          status.textContent = `Choose up to ${max}.`;
          status.className = 'quiz-status err';
          return;
        }
        btn.classList.toggle('selected');
        status.textContent = '';
        status.className = 'quiz-status';
        answers[q.dataset.key] = Array.from(q.querySelectorAll('.quiz-opts button.selected')).map(button => button.textContent.trim());
      } else {
        answers[q.dataset.key] = btn.textContent.trim();
        show(index + 1);
      }
    });
  });
  quiz.querySelectorAll('.quiz-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.closest('.quiz-q');
      const selected = Array.from(q.querySelectorAll('.quiz-opts button.selected')).map(button => button.textContent.trim());
      const status = q.querySelector('.quiz-status');
      if (!selected.length) {
        status.textContent = 'Please choose at least one option.';
        status.className = 'quiz-status err';
        return;
      }
      answers[q.dataset.key] = selected;
      status.textContent = '';
      status.className = 'quiz-status';
      show(index + 1);
    });
  });
  quiz.querySelectorAll('.quiz-back').forEach(btn => {
    btn.addEventListener('click', () => show(index - 1));
  });

  const submitBtn = quiz.querySelector('#quiz-submit');
  const statusEl = quiz.querySelector('.quiz-status');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const name = quiz.querySelector('#q-name').value.trim();
      const company = quiz.querySelector('#q-company').value.trim();
      const email = quiz.querySelector('#q-email').value.trim();
      if (!name || !company || !email) {
        statusEl.textContent = 'Please fill in name, company, and email.';
        statusEl.className = 'quiz-status err';
        return;
      }
      submitBtn.disabled = true;
      statusEl.textContent = 'Sending…';
      statusEl.className = 'quiz-status';
      try {
        const message = [
          `Company: ${company}`,
          '',
          `Biggest business challenge: ${Array.isArray(answers.biggest_challenge) ? answers.biggest_challenge.join(', ') : ''}`,
          `Department that could benefit most: ${Array.isArray(answers.department) ? answers.department.join(', ') : ''}`,
          `Business statements: ${Array.isArray(answers.business_statement) ? answers.business_statement.join(', ') : ''}`,
          `Desired business outcome: ${answers.business_outcome || ''}`,
          `Data privacy importance: ${answers.privacy_importance || ''}`,
          `Timeline: ${answers.timeline || ''}`
        ].join('\n');
        await submitGoogleForm({
          name,
          email,
          message
        });
        statusEl.textContent = 'Sent. We\u2019ll reply with your written recommendation shortly.';
        statusEl.className = 'quiz-status ok';
        submitBtn.textContent = 'Sent \u2713';
        window.setTimeout(() => { window.location.href = 'index.html'; }, 900);
      } catch (err) {
        statusEl.textContent = err.message === 'Google Form is not configured yet.'
          ? 'Google Form is not configured yet. Please add the Google Form submit URL and entry IDs.'
          : 'Something went wrong sending the form. Please email us instead: customerfirst@qentrotech.com';
        statusEl.className = 'quiz-status err';
        submitBtn.disabled = false;
      }
    });
  }

  if (window.location.hash === '#contact-form') {
    show(questions.length - 1);
    quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    show(0);
  }
}
