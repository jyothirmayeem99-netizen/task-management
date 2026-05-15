const STORAGE_KEY = 'simple-task-management-tasks';

let tasks = loadTasks();
let currentFilter = 'All';
let searchText = '';

const taskForm = document.getElementById('taskForm');
const taskId = document.getElementById('taskId');
const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const priorityInput = document.getElementById('priorityInput');
const statusInput = document.getElementById('statusInput');
const dueDateInput = document.getElementById('dueDateInput');
const saveButton = document.getElementById('saveButton');
const cancelButton = document.getElementById('cancelButton');
const taskList = document.getElementById('taskList');
const filters = document.getElementById('filters');
const searchInput = document.getElementById('searchInput');
const stats = document.getElementById('stats');
const clearDoneButton = document.getElementById('clearDoneButton');

function loadTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function resetForm() {
  taskForm.reset();
  taskId.value = '';
  priorityInput.value = 'Medium';
  statusInput.value = 'To do';
  saveButton.textContent = 'Add task';
  cancelButton.classList.add('hidden');
}

function upsertTask(event) {
  event.preventDefault();

  const data = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
    status: statusInput.value,
    dueDate: dueDateInput.value
  };

  if (!data.title) return;

  if (taskId.value) {
    tasks = tasks.map((task) => task.id === taskId.value ? { ...task, ...data } : task);
  } else {
    tasks.unshift({ id: createId(), ...data });
  }

  saveTasks();
  resetForm();
  render();
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  taskId.value = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  priorityInput.value = task.priority;
  statusInput.value = task.status;
  dueDateInput.value = task.dueDate;
  saveButton.textContent = 'Update task';
  cancelButton.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  render();
}

function clearDoneTasks() {
  tasks = tasks.filter((task) => task.status !== 'Done');
  saveTasks();
  render();
}

function getVisibleTasks() {
  const search = searchText.toLowerCase();

  return tasks.filter((task) => {
    const matchesFilter = currentFilter === 'All' || task.status === currentFilter;
    const matchesSearch = [task.title, task.description, task.priority, task.status]
      .join(' ')
      .toLowerCase()
      .includes(search);

    return matchesFilter && matchesSearch;
  });
}

function renderStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === 'Done').length;
  const progress = tasks.filter((task) => task.status === 'In progress').length;

  stats.innerHTML = `
    <span class="stat-pill">Total: ${total}</span>
    <span class="stat-pill">In progress: ${progress}</span>
    <span class="stat-pill">Done: ${done}</span>
  `;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  if (!visibleTasks.length) {
    taskList.innerHTML = '<div class="empty-state">No tasks found. Add your first task above.</div>';
    return;
  }

  taskList.innerHTML = visibleTasks.map((task) => `
    <article class="task-card">
      <div>
        <h2>${escapeHtml(task.title)}</h2>
        <p>${escapeHtml(task.description || 'No description')}</p>
      </div>
      <div class="badges">
        <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
        <span class="badge ${task.status === 'Done' ? 'done' : ''}">${task.status}</span>
        ${task.dueDate ? `<span class="badge">Due ${task.dueDate}</span>` : ''}
      </div>
      <div class="card-actions">
        <button class="card-button" type="button" data-action="edit" data-id="${task.id}">Edit</button>
        <button class="card-button danger" type="button" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </article>
  `).join('');
}

function render() {
  renderStats();
  renderTasks();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

taskForm.addEventListener('submit', upsertTask);
cancelButton.addEventListener('click', resetForm);
clearDoneButton.addEventListener('click', clearDoneTasks);

filters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;

  currentFilter = button.dataset.filter;
  document.querySelectorAll('.chip').forEach((chip) => chip.classList.toggle('active', chip === button));
  render();
});

searchInput.addEventListener('input', (event) => {
  searchText = event.target.value;
  render();
});

taskList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;

  if (button.dataset.action === 'edit') editTask(button.dataset.id);
  if (button.dataset.action === 'delete') deleteTask(button.dataset.id);
});

render();
