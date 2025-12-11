const LOCAL_STORAGE_KEY = 'ai-task-assistant-plans';
const form = document.getElementById('planner-form');
const inputText = document.getElementById('input-text');
const modeSelect = document.getElementById('mode');
const titleInput = document.getElementById('title');
const output = document.getElementById('output');
const saveBtn = document.getElementById('save');
const clearAllBtn = document.getElementById('clear-all');
const savedPlansContainer = document.getElementById('saved-plans');

let currentPlan = null;

function loadPlans() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Could not parse plans', e);
    return [];
  }
}

function persistPlans(plans) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plans));
}

function formatDate(ts) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function getModeLabel(mode) {
  return {
    daily: 'Daily plan',
    project: 'Project breakdown',
    study: 'Study plan',
  }[mode] ?? 'Plan';
}

function parseTasks(text) {
  const rawItems = text
    .split(/\n|[.;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!rawItems.length) {
    return ['Review your notes and jot a few tasks to get started.'];
  }

  return rawItems;
}

function prioritizeTasks(tasks, mode) {
  return tasks.map((task, index) => {
    const priorityTag = index === 0 ? 'Now' : index === 1 ? 'Next' : 'Later';
    const focus = mode === 'study' ? 'Focus block' : mode === 'project' ? 'Milestone' : 'Quick win';
    return `${task} — ${priorityTag} · ${focus}`;
  });
}

function buildTimeBlocks(tasks, mode) {
  const baseDurations = {
    daily: 45,
    project: 90,
    study: 60,
  };

  const duration = baseDurations[mode] ?? 45;
  return tasks.slice(0, 5).map((task, index) => ({
    label: `Block ${index + 1}`,
    duration,
    focus: task,
  }));
}

function buildRecommendations(tasks, mode) {
  const recs = [
    'Group similar tasks to reduce context switching.',
    'Leave a buffer at the end of each block for quick notes.',
    'Celebrate small wins to keep momentum high.',
  ];

  if (mode === 'project') recs.unshift('Define a clear "definition of done" for the project scope.');
  if (mode === 'study') recs.unshift('Use spaced repetition: quick review after each focus block.');
  if (mode === 'daily') recs.unshift('Protect one deep-work block where notifications are off.');

  if (tasks.length > 5) recs.push('Park anything extra on a later list so today stays realistic.');

  return recs;
}

function generatePlan(input, mode) {
  const tasks = parseTasks(input);
  const prioritized = prioritizeTasks(tasks, mode);
  const timeBlocks = buildTimeBlocks(tasks, mode);
  const recommendations = buildRecommendations(tasks, mode);
  const summary = `Planned ${tasks.length} ${tasks.length === 1 ? 'item' : 'items'} with a ${getModeLabel(mode).toLowerCase()} focus.`;

  return { summary, prioritized, timeBlocks, recommendations };
}

function renderPlan(plan) {
  const stepsList = plan.prioritized
    .map((item, idx) => `<li><strong>Step ${idx + 1}:</strong> ${item}</li>`)
    .join('');

  const timeList = plan.timeBlocks
    .map((block) => `<li><span class="badge">${block.duration} min</span> ${block.label} — ${block.focus}</li>`)
    .join('');

  const recommendationsList = plan.recommendations
    .map((item) => `<li>${item}</li>`)
    .join('');

  output.innerHTML = `
    <div class="output__section">
      <div class="flex-between">
        <h4>Summary</h4>
        <span class="badge">Ready</span>
      </div>
      <p>${plan.summary}</p>
    </div>
    <div class="output__section">
      <h4>Step-by-step tasks</h4>
      <ol>${stepsList}</ol>
    </div>
    <div class="output__section">
      <h4>Time blocks</h4>
      <ul>${timeList}</ul>
    </div>
    <div class="output__section">
      <h4>Recommendations</h4>
      <ul>${recommendationsList}</ul>
    </div>
  `;
}

function renderSavedPlans(plans) {
  savedPlansContainer.innerHTML = '';
  if (!plans.length) {
    savedPlansContainer.innerHTML = '<p class="muted">No saved plans yet. Generate and save one to get started.</p>';
    return;
  }

  plans
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((plan) => {
      const item = document.createElement('div');
      item.className = 'saved-plan';
      item.innerHTML = `
        <div>
          <p class="saved-plan__title">${plan.title}</p>
          <p class="saved-plan__meta">${getModeLabel(plan.mode)} · ${formatDate(plan.createdAt)}</p>
        </div>
        <div class="saved-plan__actions">
          <button class="btn primary" data-load="${plan.id}" type="button">Load</button>
          <button class="btn ghost" data-delete="${plan.id}" type="button">Delete</button>
        </div>
      `;
      savedPlansContainer.appendChild(item);
    });
}

function handleLoad(planId) {
  const plans = loadPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;

  output.innerHTML = plan.output;
  inputText.value = plan.input;
  modeSelect.value = plan.mode;
  titleInput.value = plan.title;
  currentPlan = plan;
  saveBtn.disabled = false;
}

function handleDelete(planId) {
  const plans = loadPlans();
  const filtered = plans.filter((p) => p.id !== planId);
  persistPlans(filtered);
  renderSavedPlans(filtered);
}

function handleClearAll() {
  persistPlans([]);
  renderSavedPlans([]);
}

function createPlanId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildTitle(rawTitle, mode) {
  if (rawTitle) return rawTitle.trim();
  const sample = inputText.value.split('\n')[0].slice(0, 32) || getModeLabel(mode);
  return `${getModeLabel(mode)} – ${sample}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = inputText.value.trim();
  const mode = modeSelect.value;

  if (!input) {
    inputText.focus();
    return;
  }

  const plan = generatePlan(input, mode);
  currentPlan = {
    id: createPlanId(),
    title: buildTitle(titleInput.value, mode),
    mode,
    input,
    output: '',
    createdAt: Date.now(),
  };
  renderPlan(plan);
  currentPlan.output = output.innerHTML;
  saveBtn.disabled = false;
});

saveBtn.addEventListener('click', () => {
  if (!currentPlan) return;
  const plans = loadPlans();
  const updated = [currentPlan, ...plans];
  persistPlans(updated);
  renderSavedPlans(updated);
  saveBtn.disabled = true;
});

savedPlansContainer.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const loadId = target.getAttribute('data-load');
  const deleteId = target.getAttribute('data-delete');

  if (loadId) {
    handleLoad(loadId);
  } else if (deleteId) {
    handleDelete(deleteId);
  }
});

clearAllBtn.addEventListener('click', handleClearAll);

renderSavedPlans(loadPlans());
