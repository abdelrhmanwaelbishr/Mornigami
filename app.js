class ProductivityHub {
    constructor() {
        this.currentPage = 'habits';
        this.habits = this.loadData('habits') || [];
        this.tasks = this.loadData('tasks') || [];
        this.pomodoroSettings = this.loadData('pomodoroSettings') || { workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15 };
        this.pomodoroStats = this.loadData('pomodoroStats') || { sessionsToday: 0, totalFocusTime: 0, currentStreak: 0, lastSessionDate: null };
        this.pomodoroTimer = null;
        this.pomodoroTimeLeft = this.pomodoroTotalTime = this.pomodoroSettings.workDuration * 60;
        this.pomodoroMode = 'work';
        this.pomodoroIsRunning = false;
        this.currentTaskFilter = 'pending';
        this.playlists = this.loadData('playlists') || [];
        this.youtubeApiKey = 'AIzaSyDOpHgt8xrp_SlMs0rWT8YDxeQsyeB3kvc';
        this.motivationalSettings = this.loadData('motivationalSettings') || { enabled: true, streakCount: 0, targetCount: 5 };
        if (this.motivationalSettings.targetCount === undefined) this.motivationalSettings.targetCount = 5;
        this.$ = id => document.getElementById(id);
        this.$$ = s => document.querySelectorAll(s);
        this.init();
    }

    init() {
        this.applyTheme(); this.setupEventListeners(); this.renderPage(this.currentPage); this.checkPomodoroStats();
    }

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') document.body.classList.add('dark-theme');
        const accent = localStorage.getItem('accentColor');
        if (accent) this.setAccentColor((theme === 'dark' && accent === '#1C1917') || (theme !== 'dark' && accent === '#FFFFFF') ? '#FF6B35' : accent);
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        const accent = localStorage.getItem('accentColor');
        if ((isDark && accent === '#1C1917') || (!isDark && accent === '#FFFFFF')) this.setAccentColor('#FF6B35');
        this.renderAccentDropdown();
    }

    toggleAccentDropdown(e) {
        if (e) e.stopPropagation();
        const d = this.$('accentColorDropdown');
        if (d && d.classList.toggle('show')) this.renderAccentDropdown();
    }

    renderAccentDropdown() {
        const d = this.$('accentColorDropdown'); if (!d) return;
        const isDark = document.body.classList.contains('dark-theme'), saved = localStorage.getItem('accentColor') || '#FF6B35';
        const opts = [{ name: 'Orange', hex: '#FF6B35' }, { name: 'Blue', hex: '#4A90E2' }, { name: 'Purple', hex: '#8A2BE2' }, { name: 'White', hex: '#FFFFFF', darkOnly: true }, { name: 'Black', hex: '#1C1917', lightOnly: true }].filter(o => !(o.darkOnly && !isDark) && !(o.lightOnly && isDark));
        d.innerHTML = `<div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); font-weight: 700; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--color-border); text-transform: uppercase; letter-spacing: 0.5px;">Accent Theme</div>` +
            opts.map(o => `<button class="accent-color-option ${saved.toUpperCase() === o.hex.toUpperCase() ? 'active' : ''}" onclick="app.selectAccentColor('${o.hex}')"><span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${o.hex}; border: 1px solid ${o.hex === '#FFFFFF' ? '#78716C' : 'transparent'};"></span><span style="flex: 1; font-weight: 600;">${o.name}</span>${saved.toUpperCase() === o.hex.toUpperCase() ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8L6 11L13 4"/></svg>' : ''}</button>`).join('');
    }

    selectAccentColor(hex) { this.setAccentColor(hex); this.renderAccentDropdown(); }

    setAccentColor(hex) {
        const r = document.documentElement; r.style.setProperty('--color-primary', hex);
        r.style.setProperty('--color-primary-light', this.adjustColorBrightness(hex, 15));
        r.style.setProperty('--color-primary-dark', this.adjustColorBrightness(hex, -15));
        r.style.setProperty('--color-primary-contrast', this.getContrastColor(hex));
        localStorage.setItem('accentColor', hex);
    }

    getContrastColor(hex) {
        const c = hex.replace('#', ''), r = parseInt(c.substring(0, 2), 16), g = parseInt(c.substring(2, 4), 16), b = parseInt(c.substring(4, 6), 16);
        return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 150) ? '#1C1917' : '#FFFFFF';
    }

    adjustColorBrightness(hex, percent) {
        let n = parseInt(hex.replace("#", ""), 16), a = Math.round(2.55 * percent), R = (n >> 16) + a, G = (n >> 8 & 0x00FF) + a, B = (n & 0x0000FF) + a;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    }

    setupEventListeners() {
        this.$('themeToggle').addEventListener('click', () => this.toggleTheme());
        const ab = this.$('accentColorBtn'); if (ab) ab.addEventListener('click', e => this.toggleAccentDropdown(e));
        this.$$('.nav-link').forEach(l => l.addEventListener('click', e => { e.preventDefault(); this.switchPage(e.target.dataset.page); }));
        ['habit', 'task', 'pomodoroSettings', 'playlist'].forEach(m => {
            const id = m === 'pomodoroSettings' ? 'pomodoroSettingsModal' : `${m}Modal`;
            const closeBtn = this.$(`close${m.charAt(0).toUpperCase() + m.slice(1)}`);
            const cancelBtn = this.$(`cancel${m.charAt(0).toUpperCase() + m.slice(1)}${m === 'pomodoroSettings' ? '' : 'Btn'}`);
            const form = this.$(`${m}Form`);
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal(id));
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal(id));
            if (form) form.addEventListener('submit', e => this[`handle${m.charAt(0).toUpperCase() + m.slice(1)}Submit`](e));
        });
        this.$$('.modal-backdrop').forEach(b => b.addEventListener('click', e => { const m = e.target.closest('.modal'); if (m) this.closeModal(m.id); }));
        document.addEventListener('click', e => {
            if (!e.target.closest('.playlist-speed-container')) this.$$('.playlist-speed-dropdown').forEach(d => d.classList.remove('show'));
            if (!e.target.closest('.accent-picker-wrapper')) { const d = this.$('accentColorDropdown'); if (d) d.classList.remove('show'); }
        });
    }

    switchPage(page) {
        this.currentPage = page;
        this.$$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
        this.renderPage(page);
    }

    renderPage(page) {
        const c = this.$('pageContent');
        if (page === 'habits') { c.innerHTML = this.getHabitsPageHTML(); this.setupHabitsEventListeners(); this.renderHabits(); this.updateHabitsStats(); }
        else if (page === 'todo') { c.innerHTML = this.getTodoPageHTML(); this.setupTodoEventListeners(); this.renderTasks(); this.updateTodoStats(); }
        else if (page === 'pomodoro') { c.innerHTML = this.getPomodoroPageHTML(); this.setupPomodoroEventListeners(); this.updatePomodoroDisplay(); this.updatePomodoroStats(); }
        else if (page === 'playlist') { c.innerHTML = this.getPlaylistPageHTML(); this.setupPlaylistEventListeners(); this.renderPlaylists(); this.backfillMissingDurations(); }
    }

    getHabitsPageHTML() {
        return `<header class="app-header"><div class="header-content"><div class="brand-text"><h1 class="brand-title">Habits</h1><p class="brand-subtitle">Build better, daily</p></div><div class="header-actions"><button class="btn-primary" id="addHabitBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>New Habit</span></button></div></div></header>
        <main class="app-main"><section class="stats-section">
        <div class="stat-card"><div class="stat-icon stat-icon-blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg></div><div class="stat-content"><p class="stat-label">Active Habits</p><p class="stat-value" id="activeHabitsCount">0</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="stat-content"><p class="stat-label">Completed Today</p><p class="stat-value" id="completedTodayCount">0</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-orange"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/></svg></div><div class="stat-content"><p class="stat-label">Current Streak</p><p class="stat-value" id="currentStreak">0</p></div></div></section>
        <section class="habits-section"><div class="section-header"><h2 class="section-title">Your Habits</h2><div class="view-controls"><button class="view-btn active" id="gridViewBtn" data-view="grid" title="Grid view"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor"/></svg></button><button class="view-btn" id="listViewBtn" data-view="list" title="List view"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="3" rx="1.5" fill="currentColor"/><rect x="2" y="8" width="14" height="3" rx="1.5" fill="currentColor"/><rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor"/></svg></button></div></div>
        <div id="emptyState" class="empty-state" style="display: none;"><div class="empty-icon" onclick="app.openModal('habitModal')" title="Create habit"><svg width="80" height="80" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2"/><path d="M40 25V55M25 40H55" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/></svg></div><h3 class="empty-title">No habits yet</h3><p class="empty-description">Start building better routines by creating your first habit.</p></div><div id="habitsGrid" class="habits-grid"></div></section></main>`;
    }

    setupHabitsEventListeners() {
        const ab = this.$('addHabitBtn'), gb = this.$('gridViewBtn'), lb = this.$('listViewBtn');
        if (ab) ab.addEventListener('click', () => this.openModal('habitModal'));
        if (gb) gb.addEventListener('click', () => this.switchHabitView('grid'));
        if (lb) lb.addEventListener('click', () => this.switchHabitView('list'));
        this.setupDragAndDrop();
    }

    switchHabitView(view) {
        const g = this.$('habitsGrid'), gb = this.$('gridViewBtn'), lb = this.$('listViewBtn');
        g.classList.toggle('list-view', view === 'list');
        gb.classList.toggle('active', view !== 'list'); lb.classList.toggle('active', view === 'list');
    }

    setupDragAndDrop() {
        const g = this.$('habitsGrid'); if (!g) return; let d = null;
        g.addEventListener('dragstart', e => { const c = e.target.closest('.habit-card'); if (c) { d = c; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.id); setTimeout(() => c.classList.add('dragging'), 0); } });
        g.addEventListener('dragend', e => { const c = e.target.closest('.habit-card'); if (c) { c.classList.remove('dragging'); d = null; } });
        g.addEventListener('dragover', e => { e.preventDefault(); const a = this.getDragAfterElement(g, e.clientY, e.clientX), dr = document.querySelector('.dragging'); if (!a) g.appendChild(dr); else g.insertBefore(dr, a); });
        g.addEventListener('drop', e => { e.preventDefault(); this.reorderHabits([...g.querySelectorAll('.habit-card')].map(c => c.dataset.id)); });
    }

    getDragAfterElement(container, y, x) {
        return [...container.querySelectorAll('.habit-card:not(.dragging)')].reduce((closest, child) => {
            const b = child.getBoundingClientRect(), dist = Math.hypot(x - (b.left + b.width / 2), y - (b.top + b.height / 2));
            return (!closest || dist < closest.distance) ? { distance: dist, element: child } : closest;
        }, null)?.element;
    }

    reorderHabits(newOrder) {
        this.habits = newOrder.map(id => this.habits.find(h => h.id === id)).filter(Boolean);
        this.saveData('habits', this.habits);
    }

    renderHabits() {
        const g = this.$('habitsGrid'), e = this.$('emptyState');
        if (!this.habits.length) { g.innerHTML = ''; e.style.display = 'block'; return; }
        e.style.display = 'none'; g.innerHTML = this.habits.map(h => this.getHabitCardHTML(h)).join('');
    }

    getHabitCardHTML(h) {
        const d = h.days || 21, c = h.progress.filter(Boolean).length, p = Math.round((c / d) * 100), pr = h.priority || 'low', isC = c === d, col = h.cardColor || 'default';
        return `<div class="habit-card${col !== 'default' ? ' card-' + col : ''}" draggable="true" data-id="${h.id}"><div class="habit-header"><div class="habit-info"><h3 class="habit-name">${this.escapeHtml(h.name)}</h3><div class="habit-meta"><span class="priority-badge ${pr}"><span class="priority-dot"></span>${pr}</span><span>•</span><span>${d} days</span>${isC ? '<span>•</span><span>✓ Completed</span>' : ''}</div></div><div class="habit-actions"><button class="icon-btn" onclick="app.editHabit('${h.id}')" title="Edit habit"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25C15.4142 1.83579 16.0858 1.83579 16.5 2.25C16.9142 2.66421 16.9142 3.33579 16.5 3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="icon-btn delete" onclick="app.deleteHabit('${h.id}')" title="Delete habit"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>
        ${isC ? `<div class="completion-badge"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Habit Completed!</span></div>` : ''}
        <div class="progress-grid">${h.progress.map((done, i) => `<div class="day-cell ${done ? 'completed' : ''}" onclick="app.toggleDay('${h.id}', ${i})" title="Day ${i + 1}">${i + 1}</div>`).join('')}</div>
        <div class="progress-section"><div class="progress-header"><span class="progress-label">Progress</span><span class="progress-stats">${c}/${d} • ${p}%</span></div><div class="progress-bar-container"><div class="progress-bar" style="width: ${p}%"></div></div></div>
        ${isC ? `<button class="btn-reset" onclick="app.resetHabit('${h.id}')"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C6.11438 14 4.44349 13.0602 3.38734 11.6458" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 11V8H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Reset Progress</button>` : ''}</div>`;
    }

    handleHabitSubmit(e) {
        e.preventDefault();
        const id = this.$('habitId').value, name = this.$('habitName').value.trim(), days = parseInt(this.$('habitDays').value) || 21;
        const priority = document.querySelector('input[name="priority"]:checked')?.value || 'low', cardColor = document.querySelector('input[name="cardColor"]:checked')?.value || 'default';
        if (id) {
            this.habits = this.habits.map(h => h.id === id ? { ...h, name, priority, days, cardColor, progress: days !== h.days ? Array(days).fill(false).map((v, i) => h.progress[i] || false) : h.progress } : h);
        } else {
            this.habits.push({ id: Date.now().toString(), name, priority, days, cardColor, createdAt: new Date().toISOString(), progress: Array(days).fill(false) });
        }
        this.saveData('habits', this.habits); this.renderHabits(); this.updateHabitsStats(); this.closeModal('habitModal');
    }

    editHabit(id) {
        const h = this.habits.find(h => h.id === id); if (!h) return;
        this.$('habitModalTitle').textContent = 'Edit Habit'; this.$('habitSubmitBtnText').textContent = 'Save Changes';
        this.$('habitId').value = h.id; this.$('habitName').value = h.name; this.$('habitDays').value = h.days || 21;
        document.querySelectorAll('input[name="priority"]').forEach(r => r.checked = r.value === (h.priority || 'low'));
        document.querySelectorAll('input[name="cardColor"]').forEach(r => r.checked = r.value === (h.cardColor || 'default'));
        this.openModal('habitModal', false);
    }

    deleteHabit(id) {
        if (confirm('Are you sure you want to delete this habit?')) { this.habits = this.habits.filter(h => h.id !== id); this.saveData('habits', this.habits); this.renderHabits(); this.updateHabitsStats(); }
    }

    resetHabit(id) {
        this.habits = this.habits.map(h => h.id === id ? { ...h, progress: Array(h.days || 21).fill(false) } : h);
        this.saveData('habits', this.habits); this.renderHabits(); this.updateHabitsStats();
    }

    toggleDay(id, idx) {
        this.habits = this.habits.map(h => h.id === id ? { ...h, progress: h.progress.map((v, i) => i === idx ? !v : v) } : h);
        this.saveData('habits', this.habits); this.renderHabits(); this.updateHabitsStats();
    }

    updateHabitsStats() {
        const ac = this.$('activeHabitsCount'), cc = this.$('completedTodayCount'), cs = this.$('currentStreak');
        if (ac) ac.textContent = this.habits.length;
        if (cc) cc.textContent = this.habits.filter(h => h.progress.some(Boolean)).length;
        if (cs) cs.textContent = this.habits.filter(h => h.progress.filter(Boolean).length === (h.days || 21)).length;
    }

    getTodoPageHTML() {
        return `<header class="app-header"><div class="header-content"><div class="brand-text"><h1 class="brand-title">To-Do List</h1><p class="brand-subtitle">Stay organized, get things done</p></div><div class="header-actions"><button class="btn-primary" id="addTaskBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>New Task</span></button></div></div></header>
        <main class="app-main"><section class="stats-section">
        <div class="stat-card"><div class="stat-icon stat-icon-blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="stat-content"><p class="stat-label">Total Tasks</p><p class="stat-value" id="totalTasksCount">0</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="stat-content"><p class="stat-label">Completed</p><p class="stat-value" id="completedTasksCount">0</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-orange"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="stat-content"><p class="stat-label">Pending</p><p class="stat-value" id="pendingTasksCount">0</p></div></div></section>
        <section class="tasks-section"><div class="section-header"><h2 class="section-title">Your Tasks</h2><div class="controls-wrapper" style="display: flex; gap: 12px; align-items: center;"><div class="view-controls"><button class="view-btn active" id="taskListViewBtn" data-view="list" title="List view"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="3" rx="1.5" fill="currentColor"/><rect x="2" y="8" width="14" height="3" rx="1.5" fill="currentColor"/><rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor"/></svg></button><button class="view-btn" id="taskGridViewBtn" data-view="grid" title="Grid view"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor"/></svg></button></div><select id="taskSortSelect" class="sort-select"><option value="default">Sort by...</option><option value="priority-high">Priority (High to Low)</option><option value="priority-low">Priority (Low to High)</option></select><div class="filter-controls"><button class="filter-btn active" data-filter="pending">Pending</button><button class="filter-btn" data-filter="completed">Completed</button></div></div></div>
        <div id="tasksList" class="tasks-list"></div><div id="emptyTasksState" class="empty-state" style="display: none;"><div class="empty-icon clickable" id="emptyStateAddBtn"><svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="15" y="15" width="50" height="50" rx="8" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2"/><path d="M40 30V50M30 40H50" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" class="plus-path"/></svg></div><h3 class="empty-title">Come on, Create your first task!</h3></div><div id="emptyCompletedState" class="empty-state" style="display: none;"><h3 class="empty-title">Come on, Finish your first task!</h3></div></section></main>`;
    }

    setupTodoEventListeners() {
        const ab = this.$('addTaskBtn'), eb = this.$('emptyStateAddBtn'), gb = this.$('taskGridViewBtn'), lb = this.$('taskListViewBtn'), ss = this.$('taskSortSelect');
        if (ab) ab.addEventListener('click', () => this.openModal('taskModal'));
        if (eb) eb.addEventListener('click', () => this.openModal('taskModal'));
        if (gb) gb.addEventListener('click', () => this.switchTaskView('grid'));
        if (lb) lb.addEventListener('click', () => this.switchTaskView('list'));
        if (ss) ss.addEventListener('change', e => this.sortTasks(e.target.value));
        this.$$('.filter-btn').forEach(b => b.addEventListener('click', e => this.filterTasks(e.target.dataset.filter)));
        this.setupTaskDragAndDrop();
    }

    filterTasks(filter) {
        this.currentTaskFilter = filter;
        this.$$('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
        this.renderTasks(filter);
    }

    renderTasks(filter = 'pending') {
        const l = this.$('tasksList'), et = this.$('emptyTasksState'), ec = this.$('emptyCompletedState');
        const tasks = this.tasks.filter(t => filter === 'pending' ? !t.completed : t.completed);
        if (et) et.style.display = 'none'; if (ec) ec.style.display = 'none';
        if (!tasks.length) { l.innerHTML = ''; if (filter === 'completed' && ec) ec.style.display = 'block'; else if (et) et.style.display = 'block'; return; }
        const isGrid = l.classList.contains('grid-view');
        l.innerHTML = this.groupTasksByDate(tasks).map(g => this.getDateCardHTML(g, isGrid)).join('');
        this.setupTaskDragAndDrop();
    }

    groupTasksByDate(tasks) {
        const g = {}, today = new Date(); today.setHours(0, 0, 0, 0);
        tasks.forEach(t => {
            const dk = t.dueDate?.includes('T') ? t.dueDate.split('T')[0] : t.dueDate, [y, m, d] = dk.split('-').map(Number);
            if (!g[dk]) g[dk] = { dateKey: dk, date: new Date(y, m - 1, d), tasks: [] };
            g[dk].tasks.push(t);
        });
        return Object.values(g).sort((a, b) => a.date - b.date);
    }

    getDateLabel(date) {
        const t = new Date(); t.setHours(0, 0, 0, 0); const tm = new Date(t); tm.setDate(tm.getDate() + 1); const y = new Date(t); y.setDate(y.getDate() - 1);
        return date.getTime() === t.getTime() ? 'Today' : date.getTime() === tm.getTime() ? 'Tomorrow' : date.getTime() === y.getTime() ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    getDateCardHTML(g, isGrid = false) {
        const t = new Date(); t.setHours(0, 0, 0, 0); const cls = g.date < t ? 'overdue' : g.date.getTime() === t.getTime() ? 'today' : '';
        return `<div class="date-card ${cls}" data-date="${g.dateKey}"><div class="date-card-header"><div class="date-card-info"><h3 class="date-card-title">${this.getDateLabel(g.date)}</h3><span class="date-card-count">${g.tasks.length} task${g.tasks.length !== 1 ? 's' : ''}</span></div><button class="date-card-add-btn" onclick="app.openModal('taskModal')" title="Add task"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></div><div class="date-card-tasks" data-date="${g.dateKey}">${g.tasks.map(task => this.getTaskItemHTML(task)).join('')}</div></div>`;
    }

    getTaskItemHTML(t) {
        const ds = t.dueDate?.includes('T') ? t.dueDate.split('T')[0] : t.dueDate, [y, m, d] = ds.split('-').map(Number), dd = new Date(y, m - 1, d), today = new Date(); today.setHours(0, 0, 0, 0);
        const cls = dd < today && !t.completed ? 'overdue' : dd.getTime() === today.getTime() && !t.completed ? 'today' : '', pr = t.priority || 'low';
        return `<div class="task-item ${t.completed ? 'completed' : ''} ${cls}" draggable="true" data-id="${t.id}"><div class="task-checkbox ${t.completed ? 'checked' : ''}" onclick="app.toggleTask('${t.id}')"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="task-main-content"><div class="task-name">${this.escapeHtml(t.name)}</div><div class="task-time">${dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div></div><div class="task-actions"><button class="task-action-btn edit" onclick="event.stopPropagation(); app.editTask('${t.id}')" title="Edit task"><svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="task-action-btn delete" onclick="event.stopPropagation(); app.deleteTask('${t.id}')" title="Delete task"><svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M7 8V13M11 8V13M13 5V14C13 14.5 12.5 15 12 15H6C5.5 15 5 14.5 5 14V5M7 5V3C7 2.5 7.5 2 8 2H10C10.5 2 11 2.5 11 3V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div>`;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const id = this.$('taskId').value, name = this.$('taskName').value.trim(), dueDate = this.$('taskDueDate').value, priority = document.querySelector('input[name="taskPriority"]:checked')?.value || 'low';
        if (id) { this.tasks = this.tasks.map(t => t.id === id ? { ...t, name, dueDate, priority } : t); }
        else { this.tasks.push({ id: Date.now().toString(), name, dueDate, priority, completed: false, createdAt: new Date().toISOString() }); }
        this.saveData('tasks', this.tasks); this.renderTasks(this.currentTaskFilter); this.updateTodoStats(); this.closeModal('taskModal');
    }

    switchTaskView(view) {
        const l = this.$('tasksList'), gb = this.$('taskGridViewBtn'), lb = this.$('taskListViewBtn');
        l.classList.toggle('grid-view', view === 'grid');
        gb.classList.toggle('active', view === 'grid'); lb.classList.toggle('active', view !== 'grid');
        this.renderTasks(this.currentTaskFilter);
    }

    sortTasks(c) {
        const pm = { high: 3, medium: 2, low: 1 };
        this.tasks.sort((a, b) => c === 'default' ? b.id.localeCompare(a.id) : c === 'priority-high' ? pm[b.priority || 'low'] - pm[a.priority || 'low'] : pm[a.priority || 'low'] - pm[b.priority || 'low']);
        this.renderTasks(this.currentTaskFilter);
    }

    setupTaskDragAndDrop() {
        const l = this.$('tasksList'); if (!l) return;
        l.addEventListener('dragstart', e => { const i = e.target.closest('.task-item'); if (i) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', i.dataset.id); setTimeout(() => i.classList.add('dragging'), 0); } });
        l.addEventListener('dragend', e => { const i = e.target.closest('.task-item'); if (i) { i.classList.remove('dragging'); if (!i.parentElement || !i.parentElement.classList.contains('date-card-tasks')) this.renderTasks(this.currentTaskFilter); } });
        l.addEventListener('dragover', e => {
            e.preventDefault(); const dr = document.querySelector('.task-item.dragging'), c = e.target.closest('.date-card-tasks');
            if (dr && c) { e.dataTransfer.dropEffect = 'move'; const a = this.getTaskDragAfterElement(c, e.clientY, e.clientX); if (!a) c.appendChild(dr); else c.insertBefore(dr, a); }
            else e.dataTransfer.dropEffect = 'none';
        });
        l.addEventListener('drop', e => {
            e.preventDefault(); const dr = document.querySelector('.task-item.dragging'), c = dr?.closest('.date-card-tasks');
            if (dr && c) { this.updateTaskDueDate(dr.dataset.id, c.dataset.date); this.reorderTasks([...l.querySelectorAll('.task-item')].map(i => i.dataset.id)); }
            this.renderTasks(this.currentTaskFilter);
        });
    }

    updateTaskDueDate(id, d) { const t = this.tasks.find(t => t.id === id); if (t) { t.dueDate = d; this.saveData('tasks', this.tasks); } }

    getTaskDragAfterElement(c, y) {
        return [...c.querySelectorAll('.task-item:not(.dragging)')].reduce((closest, child) => {
            const b = child.getBoundingClientRect(), off = y - b.top - b.height / 2;
            return (off < 0 && off > closest.offset) ? { offset: off, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element || null;
    }

    reorderTasks(ids) {
        const tm = new Map(this.tasks.map(t => [t.id, t])), nt = [];
        ids.forEach(id => { if (tm.has(id)) { nt.push(tm.get(id)); tm.delete(id); } });
        tm.forEach(t => nt.push(t)); this.tasks = nt; this.saveData('tasks', this.tasks);
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        this.saveData('tasks', this.tasks); this.renderTasks(this.currentTaskFilter); this.updateTodoStats();
    }

    editTask(id) {
        const t = this.tasks.find(t => t.id === id); if (!t) return;
        this.$('taskModalTitle').textContent = 'Edit Task'; this.$('taskSubmitBtnText').textContent = 'Save Changes';
        this.$('taskId').value = t.id; this.$('taskName').value = t.name; this.$('taskDueDate').value = t.dueDate;
        document.querySelectorAll('input[name="taskPriority"]').forEach(r => r.checked = r.value === (t.priority || 'low'));
        this.openModal('taskModal', false);
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) { this.tasks = this.tasks.filter(t => t.id !== id); this.saveData('tasks', this.tasks); this.renderTasks(this.currentTaskFilter); this.updateTodoStats(); }
    }

    updateTodoStats() {
        const tc = this.$('totalTasksCount'), cc = this.$('completedTasksCount'), pc = this.$('pendingTasksCount');
        if (tc) tc.textContent = this.tasks.length;
        if (cc) cc.textContent = this.tasks.filter(t => t.completed).length;
        if (pc) pc.textContent = this.tasks.filter(t => !t.completed).length;
    }

    getPomodoroPageHTML() {
        return `<header class="app-header"><div class="header-content"><div class="brand-text"><h1 class="brand-title">Pomodoro Timer</h1><p class="brand-subtitle">Focus better, work smarter</p></div></div></header>
        <main class="app-main"><section class="stats-section">
        <div class="stat-card"><div class="stat-icon stat-icon-blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="stat-content"><p class="stat-label">Sessions Today</p><p class="stat-value" id="sessionsToday">0</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/></svg></div><div class="stat-content"><p class="stat-label">Focus Time</p><p class="stat-value" id="totalFocusTime">0m</p></div></div>
        <div class="stat-card"><div class="stat-icon stat-icon-orange"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/></svg></div><div class="stat-content"><p class="stat-label">Current Streak</p><p class="stat-value" id="currentStreak">0</p></div></div></section>
        <section class="pomodoro-section"><div class="pomodoro-card"><div class="mode-selector"><button class="mode-btn active" data-mode="work">Work</button><button class="mode-btn" data-mode="short">Short Break</button><button class="mode-btn" data-mode="long">Long Break</button></div>
        <div class="timer-display"><svg class="timer-ring" width="320" height="320" viewBox="0 0 320 320"><circle class="timer-ring-bg" cx="160" cy="160" r="140"/><circle class="timer-ring-progress" cx="160" cy="160" r="140" id="timerProgress"/></svg><div class="timer-content"><div class="timer-time" id="timerDisplay">25:00</div><div class="timer-label" id="timerLabel">Focus Time</div></div></div>
        <div class="timer-controls"><button class="btn-timer-primary" id="startBtn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg><span>Start</span></button><button class="btn-timer-secondary" id="resetBtn"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25 4 6.82 5.38 5.38 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 4V8H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Reset</span></button></div>
        <button class="btn-settings" id="settingsBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5"/><path d="M16.25 10C16.25 10.4 16.6 10.75 17 10.75C17.4 10.75 17.75 10.4 17.75 10C17.75 9.6 17.4 9.25 17 9.25C16.6 9.25 16.25 9.6 16.25 10ZM10 2.25C9.6 2.25 9.25 2.6 9.25 3C9.25 3.4 9.6 3.75 10 3.75C10.4 3.75 10.75 3.4 10.75 3C10.75 2.6 10.4 2.25 10 2.25ZM3 9.25C2.6 9.25 2.25 9.6 2.25 10C2.25 10.4 2.6 10.75 3 10.75C3.4 10.75 3.75 10.4 3.75 10C3.75 9.6 3.4 9.25 3 9.25ZM10 16.25C9.6 16.25 9.25 16.6 9.25 17C9.25 17.4 9.6 17.75 10 17.75C10.4 17.75 10.75 17.4 10.75 17C10.75 16.6 10.4 16.25 10 16.25Z" stroke="currentColor" stroke-width="1.5"/></svg><span>Settings</span></button></div></section></main>`;
    }

    setupPomodoroEventListeners() {
        const sb = this.$('startBtn'), rb = this.$('resetBtn'), st = this.$('settingsBtn');
        if (sb) sb.addEventListener('click', () => this.togglePomodoro());
        if (rb) rb.addEventListener('click', () => this.resetPomodoro());
        if (st) st.addEventListener('click', () => this.openPomodoroSettings());
        this.$$('.mode-btn').forEach(b => b.addEventListener('click', e => this.switchPomodoroMode(e.target.dataset.mode)));
    }

    togglePomodoro() {
        const sb = this.$('startBtn');
        if (this.pomodoroIsRunning) {
            this.pausePomodoro(); sb.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg><span>Resume</span>`;
        } else {
            this.startPomodoro(); sb.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg><span>Pause</span>`;
        }
    }

    startPomodoro() {
        this.pomodoroIsRunning = true; const td = document.querySelector('.timer-display');
        if (td) { td.classList.add('running'); td.classList.remove('paused'); }
        this.pomodoroTimer = setInterval(() => { this.pomodoroTimeLeft--; this.updatePomodoroDisplay(); if (this.pomodoroTimeLeft <= 0) this.pomodoroComplete(); }, 1000);
    }

    pausePomodoro() {
        this.pomodoroIsRunning = false; const td = document.querySelector('.timer-display');
        if (td) { td.classList.remove('running'); td.classList.add('paused'); }
        clearInterval(this.pomodoroTimer);
    }

    resetPomodoro() {
        this.pausePomodoro(); const td = document.querySelector('.timer-display'), sb = this.$('startBtn');
        if (td) td.classList.remove('running', 'paused');
        if (sb) sb.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5V19L19 12L8 5Z" fill="currentColor"/></svg><span>Start</span>`;
        this.setTimeForMode(this.pomodoroMode); this.updatePomodoroDisplay();
    }

    pomodoroComplete() {
        this.pausePomodoro();
        if (this.pomodoroMode === 'work') {
            this.pomodoroStats.sessionsToday++; this.pomodoroStats.totalFocusTime += this.pomodoroSettings.workDuration; this.pomodoroStats.currentStreak++;
            this.saveData('pomodoroStats', this.pomodoroStats); this.updatePomodoroStats();
        }
        alert(`${this.pomodoroMode === 'work' ? 'Work session' : 'Break'} complete!`);
        this.switchPomodoroMode(this.pomodoroMode === 'work' ? (this.pomodoroStats.sessionsToday % 4 === 0 ? 'long' : 'short') : 'work');
    }

    switchPomodoroMode(mode) {
        this.pomodoroMode = mode; this.resetPomodoro();
        this.$$('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        const td = document.querySelector('.timer-display'), tl = this.$('timerLabel');
        if (td) { td.classList.remove('running', 'paused', 'break'); if (mode !== 'work') td.classList.add('break'); }
        if (tl) tl.textContent = { work: 'Focus Time', short: 'Short Break', long: 'Long Break' }[mode];
    }

    setTimeForMode(m) {
        this.pomodoroTotalTime = { work: this.pomodoroSettings.workDuration, short: this.pomodoroSettings.shortBreakDuration, long: this.pomodoroSettings.longBreakDuration }[m] * 60;
        this.pomodoroTimeLeft = this.pomodoroTotalTime;
    }

    updatePomodoroDisplay() {
        const td = this.$('timerDisplay'), tp = this.$('timerProgress');
        if (td) td.textContent = `${Math.floor(this.pomodoroTimeLeft / 60).toString().padStart(2, '0')}:${(this.pomodoroTimeLeft % 60).toString().padStart(2, '0')}`;
        if (tp) tp.style.strokeDashoffset = ((this.pomodoroTotalTime - this.pomodoroTimeLeft) / this.pomodoroTotalTime) * 880;
        document.title = "Bishr's Hub";
    }

    openPomodoroSettings() {
        this.$('workDuration').value = this.pomodoroSettings.workDuration;
        this.$('shortBreakDuration').value = this.pomodoroSettings.shortBreakDuration;
        this.$('longBreakDuration').value = this.pomodoroSettings.longBreakDuration;
        this.openModal('pomodoroSettingsModal');
    }

    handlePomodoroSettingsSubmit(e) {
        e.preventDefault();
        Object.assign(this.pomodoroSettings, { workDuration: parseInt(this.$('workDuration').value), shortBreakDuration: parseInt(this.$('shortBreakDuration').value), longBreakDuration: parseInt(this.$('longBreakDuration').value) });
        this.saveData('pomodoroSettings', this.pomodoroSettings); this.resetPomodoro(); this.closeModal('pomodoroSettingsModal');
    }

    updatePomodoroStats() {
        const st = this.$('sessionsToday'), ft = this.$('totalFocusTime'), cs = this.$('currentStreak');
        if (st) st.textContent = this.pomodoroStats.sessionsToday; if (ft) ft.textContent = `${this.pomodoroStats.totalFocusTime}m`; if (cs) cs.textContent = this.pomodoroStats.currentStreak;
    }

    checkPomodoroStats() {
        const t = new Date().toDateString();
        if (this.pomodoroStats.lastSessionDate !== t) { Object.assign(this.pomodoroStats, { sessionsToday: 0, totalFocusTime: 0, lastSessionDate: t }); this.saveData('pomodoroStats', this.pomodoroStats); }
    }

    getPlaylistPageHTML() {
        return `<header class="app-header"><div class="header-content"><div class="brand-text"><h1 class="brand-title">Playlist Tracker</h1><p class="brand-subtitle">Track your learning journey</p></div><div class="header-actions" style="display: flex; gap: var(--spacing-md); align-items: center;"><div class="motivational-toggle-wrapper" style="display: flex; align-items: center; gap: var(--spacing-sm); background: var(--color-surface); padding: 0.5rem 1rem; border-radius: var(--radius-full); border: 1.5px solid var(--color-border); font-size: var(--font-size-sm); font-weight: 500; transition: opacity var(--transition-fast); ${this.motivationalSettings.enabled ? '' : 'opacity: 0.7;'}"><span style="color: var(--color-text-secondary);">Streak:</span><span id="StreakCounter" style="font-weight: 700; color: var(--color-primary);">${this.motivationalSettings.enabled ? `${this.motivationalSettings.streakCount}/<input type="number" id="motivationalTargetInput" value="${this.motivationalSettings.targetCount || 5}" min="1" max="100" style="width: 32px; border: none; background: transparent; color: var(--color-primary); font-weight: 700; font-family: inherit; font-size: inherit; text-align: center; border-bottom: 1.5px dashed var(--color-primary); padding: 0; outline: none; margin: 0 2px;" onchange="app.changeMotivationalTarget(this.value)">` : 'Off'}</span><label class="switch"><input type="checkbox" id="toggleMotivationalQuotes" ${this.motivationalSettings.enabled ? 'checked' : ''} onchange="app.toggleMotivationalQuotesSetting(this.checked)"><span class="slider"></span></label></div><button class="btn-primary" id="addPlaylistBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Add Playlist</span></button></div></div></header>
        <main class="app-main"><section class="playlists-section"><div id="playlistsContainer"></div><div id="playlistEmptyState" class="playlist-empty-state" style="display: none;"><div class="empty-icon"><svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2"/><path d="M35 30L50 40L35 50V30Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/></svg></div><h3 class="empty-title">No Playlists Yet</h3><p class="empty-description">Import a YouTube playlist to start tracking your progress.</p><button class="btn-secondary" onclick="app.openModal('playlistModal')">Import Playlist</button></div></section></main>`;
    }

    setupPlaylistEventListeners() { const ab = this.$('addPlaylistBtn'); if (ab) ab.addEventListener('click', () => this.openModal('playlistModal')); }

    async backfillMissingDurations() {
        let updated = false;
        for (const p of this.playlists) {
            const m = p.videos.filter(v => !v.durationSeconds); if (!m.length) continue;
            const mIds = m.map(v => v.id), dm = {};
            for (let i = 0; i < mIds.length; i += 50) {
                try {
                    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${mIds.slice(i, i + 50).join(',')}&key=${this.youtubeApiKey}`);
                    const d = await r.json(); d.items?.forEach(it => dm[it.id] = this.parseISO8601Duration(it.contentDetails.duration));
                } catch (e) { console.warn(e); }
            }
            m.forEach(v => { if (dm[v.id]) { v.durationSeconds = dm[v.id]; updated = true; } });
        }
        if (updated) { this.saveData('playlists', this.playlists); this.renderPlaylists(); }
    }

    async handlePlaylistSubmit(e) {
        e.preventDefault(); const sb = this.$('playlistSubmitBtn'), orig = sb.innerHTML, url = this.$('playlistUrl').value.trim();
        sb.innerHTML = '<span>Loading...</span>'; sb.disabled = true;
        try {
            const pid = this.extractPlaylistId(url); if (!pid) throw new Error('Invalid YouTube Playlist URL');
            if (this.playlists.some(p => p.id === pid)) throw new Error('Playlist already added');
            this.playlists.push(await this.fetchYouTubePlaylist(pid));
            this.saveData('playlists', this.playlists); this.renderPlaylists(); this.closeModal('playlistModal');
        } catch (err) { alert(err.message); } finally { sb.innerHTML = orig; sb.disabled = false; }
    }

    extractPlaylistId(url) { return url.match(/[?&]list=([^#\&\?]+)/)?.[1] || null; }

    async fetchYouTubePlaylist(pid) {
        const k = this.youtubeApiKey, dr = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${pid}&key=${k}`), dd = await dr.json();
        if (dd.error) throw new Error(`YouTube API Error: ${dd.error.message}`);
        if (!dd.items?.length) throw new Error('Playlist not found or private');
        const sn = dd.items[0].snippet; let vids = [], npt = '';
        do {
            const ir = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${pid}&maxResults=50&key=${k}${npt ? `&pageToken=${npt}` : ''}`), id = await ir.json();
            if (id.error) throw new Error(id.error.message);
            if (id.items) vids.push(...id.items.map(i => ({ id: i.snippet.resourceId.videoId, title: i.snippet.title, thumbnail: i.snippet.thumbnails?.default?.url || '', channelTitle: i.snippet.videoOwnerChannelTitle || i.snippet.channelTitle, completed: false })).filter(v => v.title !== 'Private video' && v.title !== 'Deleted video'));
            npt = id.nextPageToken || null;
        } while (npt);
        const vIds = vids.map(v => v.id), dm = {};
        for (let i = 0; i < vIds.length; i += 50) {
            const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${vIds.slice(i, i + 50).join(',')}&key=${k}`), vd = await vr.json();
            vd.items?.forEach(it => dm[it.id] = this.parseISO8601Duration(it.contentDetails.duration));
        }
        vids.forEach(v => v.durationSeconds = dm[v.id] || 0);
        return { id: pid, title: sn.title, thumbnail: sn.thumbnails?.medium?.url || sn.thumbnails?.default?.url, channel: sn.channelTitle, videos: vids, expanded: false };
    }

    renderPlaylists() {
        const c = this.$('playlistsContainer'), e = this.$('playlistEmptyState'); if (!c) return;
        if (!this.playlists.length) { c.innerHTML = ''; if (e) e.style.display = 'block'; return; }
        if (e) e.style.display = 'none'; c.innerHTML = this.playlists.map(p => this.getPlaylistCardHTML(p)).join('');
    }

    getPlaylistCardHTML(p) {
        const tot = p.videos.length, comp = p.videos.filter(v => v.completed).length, prog = tot ? (comp / tot) * 100 : 0, spd = p.speed || 1.0;
        const ts = p.videos.reduce((s, v) => s + (v.durationSeconds || 0), 0), ws = p.videos.filter(v => v.completed).reduce((s, v) => s + (v.durationSeconds || 0), 0);
        const ats = Math.round(ts / spd), aws = Math.round(ws / spd), als = Math.round(Math.max(0, ts - ws) / spd);
        p.groups = p.groups || [];
        const cG = p.groups.filter(g => { for (let i = g.start - 1; i <= g.end - 1; i++) if (p.videos[i] && !p.videos[i].completed) return false; return true; }).length;
        const gp = p.groups.length ? (cG / p.groups.length) * 100 : 0;
        const gStats = g => { let t = 0, c = 0; for (let i = g.start - 1; i <= g.end - 1; i++) if (p.videos[i]) { t++; if (p.videos[i].completed) c++; } return { completed: c, total: t }; };
        return `<div class="playlist-card ${p.expanded ? 'expanded' : ''}" id="playlist-${p.id}"><div class="playlist-header" onclick="app.togglePlaylistExpand('${p.id}')"><div class="playlist-info"><img src="${p.thumbnail}" alt="" class="playlist-thumbnail"><div class="playlist-details"><div class="playlist-title-container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;"><h3 class="playlist-title" style="margin-bottom: 0;">${this.escapeHtml(p.title)}</h3><div class="playlist-share-container" onclick="event.stopPropagation();" style="display: flex; align-items: center; gap: 6px; background: var(--color-bg); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); max-width: fit-content; height: 22px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary); flex-shrink: 0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span class="playlist-link-text" style="font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; overflow-x: auto; max-width: 320px; font-family: monospace; user-select: all; cursor: text; scrollbar-width: none;">https://www.youtube.com/playlist?list=${p.id}</span><button class="btn-copy" onclick="app.copyPlaylistLink(event, '${p.id}')" title="Copy Playlist Link" style="background: none; border: none; padding: 2px; cursor: pointer; color: var(--color-text-secondary); display: flex; align-items: center; transition: color var(--transition-fast); margin-left: 2px;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-secondary)'"><svg class="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button></div></div><div class="playlist-meta">${comp} / ${tot} watched • ${p.channel}</div><div class="playlist-progress"><div class="playlist-progress-bar-bg"><div class="playlist-progress-bar-fill" style="width: ${prog}%"></div></div><span class="playlist-progress-text">${Math.round(prog)}%</span></div>
        ${p.groups.length ? `<div class="playlist-progress group-progress" style="margin-top: 6px;"><div class="playlist-progress-bar-bg" style="background: var(--color-border-light, rgba(0,0,0,0.05));"><div class="playlist-progress-bar-fill" style="width: ${gp}%; background: var(--color-primary-light);"></div></div><span class="playlist-progress-text" style="font-weight: 700;">Groups: ${cG}/${p.groups.length} (${Math.round(gp)}%)</span></div>` : ''}
        <div class="playlist-time-info" onclick="event.stopPropagation();"><span class="playlist-time-total" title="Original Total: ${this.formatDuration(ts)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Total: ${this.formatDuration(ats)}${spd !== 1 ? ` (${spd}x)` : ''}</span><span class="playlist-time-watched" title="Original Watched: ${this.formatDuration(ws)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Watched: ${this.formatDuration(aws)}${spd !== 1 ? ` (${spd}x)` : ''}</span><span class="playlist-time-left" title="Original Left: ${this.formatDuration(ts - ws)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M19 2c0 6.67-7 6.67-7 10s7 3.33 7 10"/><path d="M5 2c0 6.67 7 6.67 7 10s-7 3.33-7 10"/></svg>Left: ${this.formatDuration(als)}${spd !== 1 ? ` (${spd}x)` : ''}</span>
        <div class="playlist-speed-container"><button class="playlist-speed-btn" onclick="app.toggleSpeedDropdown(event, '${p.id}')" title="Choose Playback Speed"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><span>Speed: ${spd}x</span></button><div class="playlist-speed-dropdown" id="speed-dropdown-${p.id}"><div class="playlist-speed-title">Playback Speed</div>${[1, 1.25, 1.5, 1.75, 2].map(s => `<button class="playlist-speed-option ${Math.abs(s - spd) < 0.01 ? 'active' : ''}" onclick="app.setPlaylistSpeed('${p.id}', ${s})">${s}x</button>`).join('')}<div class="playlist-speed-custom-container"><input type="text" class="playlist-speed-custom-input" placeholder="Custom (e.g. 2.5x)" value="${[1, 1.25, 1.5, 1.75, 2].some(s => Math.abs(s - spd) < 0.01) ? '' : spd + 'x'}" onkeydown="if(event.key === 'Enter') app.setPlaylistSpeed('${p.id}', this.value);"><button class="playlist-speed-custom-btn" onclick="app.setPlaylistSpeed('${p.id}', this.previousElementSibling.value)">Apply</button></div></div></div></div></div></div><div class="playlist-actions" style="margin-left: 16px; display: flex; gap: 8px;"><button class="icon-btn" onclick="event.stopPropagation(); app.downloadPlaylist('${p.id}')" title="Download Playlist"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12.75V2.25M9 12.75L4.5 8.25M9 12.75L13.5 8.25M3.75 15.75H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="icon-btn delete" onclick="event.stopPropagation(); app.deletePlaylist('${p.id}')" title="Delete Playlist"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="playlist-expand-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div></div>
        ${p.groups.length ? `<div class="playlist-progress group-progress" style="margin-top: 6px;"><div class="playlist-progress-bar-bg" style="background: var(--color-border-light, rgba(0,0,0,0.05));"><div class="playlist-progress-bar-fill" style="width: ${gp}%; background: var(--color-primary-light);"></div></div><span class="playlist-progress-text" style="font-weight: 700;">Groups: ${cG}/${p.groups.length} (${Math.round(gp)}%)</span></div>` : ''}
        <div class="playlist-time-info" onclick="event.stopPropagation();"><span class="playlist-time-total" title="Original Total: ${this.formatDuration(ts)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Total: ${this.formatDuration(ats)}${spd !== 1 ? ` (${spd}x)` : ''}</span><span class="playlist-time-watched" title="Original Watched: ${this.formatDuration(ws)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;"><path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Watched: ${this.formatDuration(aws)}${spd !== 1 ? ` (${spd}x)` : ''}</span><span class="playlist-time-left" title="Original Left: ${this.formatDuration(ts - ws)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M5 2h14"/><path d="M5 22h14"/><path d="M19 2c0 6.67-7 6.67-7 10s7 3.33 7 10"/><path d="M5 2c0 6.67 7 6.67 7 10s-7 3.33-7 10"/></svg>Left: ${this.formatDuration(als)}${spd !== 1 ? ` (${spd}x)` : ''}</span>
        <div class="playlist-speed-container"><button class="playlist-speed-btn" onclick="app.toggleSpeedDropdown(event, '${p.id}')" title="Choose Playback Speed"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg><span>Speed: ${spd}x</span></button><div class="playlist-speed-dropdown" id="speed-dropdown-${p.id}"><div class="playlist-speed-title">Playback Speed</div>${[1, 1.25, 1.5, 1.75, 2].map(s => `<button class="playlist-speed-option ${Math.abs(s - spd) < 0.01 ? 'active' : ''}" onclick="app.setPlaylistSpeed('${p.id}', ${s})">${s}x</button>`).join('')}<div class="playlist-speed-custom-container"><input type="text" class="playlist-speed-custom-input" placeholder="Custom (e.g. 2.5x)" value="${[1, 1.25, 1.5, 1.75, 2].some(s => Math.abs(s - spd) < 0.01) ? '' : spd + 'x'}" onkeydown="if(event.key === 'Enter') app.setPlaylistSpeed('${p.id}', this.value);"><button class="playlist-speed-custom-btn" onclick="app.setPlaylistSpeed('${p.id}', this.previousElementSibling.value)">Apply</button></div></div></div></div></div></div><div class="playlist-actions" style="margin-left: 16px; display: flex; gap: 8px;"><button class="icon-btn" onclick="event.stopPropagation(); app.downloadPlaylist('${p.id}')" title="Download Playlist"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 12.75V2.25M9 12.75L4.5 8.25M9 12.75L13.5 8.25M3.75 15.75H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><button class="icon-btn delete" onclick="event.stopPropagation(); app.deletePlaylist('${p.id}')" title="Delete Playlist"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="playlist-expand-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div></div>
        <div class="playlist-videos"><div class="playlist-groups-section"><div class="playlist-groups-header"><span class="playlist-groups-title">Learning Groups</span><div class="playlist-groups-actions"><button class="btn-secondary" style="padding: 4px 8px; font-size: var(--font-size-xs);" onclick="event.stopPropagation(); app.openGroupModal('${p.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Add Group</button>${p.groups.length ? `<button class="btn-secondary" style="padding: 4px 8px; font-size: var(--font-size-xs); color: var(--color-danger, #EF4444); border-color: rgba(239, 68, 68, 0.2);" onclick="event.stopPropagation(); app.clearAllPlaylistGroups('${p.id}')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Clear All</button>` : ''}</div></div>
        ${!p.groups.length ? `<div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); font-style: italic;">No custom video groups defined. Click "Add Group" to specify learning sections or batch ranges.</div>` : `<div class="playlist-group-grid">${p.groups.map(g => { const st = gStats(g), gp = st.total ? (st.completed / st.total) * 100 : 0; return `<div class="playlist-group-card group-${g.color || 'default'}"><div class="playlist-group-name" title="${this.escapeHtml(g.name)}">${this.escapeHtml(g.name)}</div><div class="playlist-group-range">Videos ${g.start} - ${g.end}</div><div class="playlist-group-progress"><div class="playlist-group-progress-bar"><div class="playlist-group-progress-fill" style="width: ${gp}%;"></div></div><span class="playlist-group-progress-text">${st.completed === st.total ? 'Completed' : `${st.completed}/${st.total}`}</span></div><div class="playlist-group-card-actions" onclick="event.stopPropagation();"><button class="icon-btn" onclick="app.openGroupModal('${p.id}', '${g.id}')" title="Edit Group"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg></button><button class="icon-btn delete" onclick="app.deletePlaylistGroup('${p.id}', '${g.id}')" title="Delete Group"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button></div></div>`; }).join('')}</div>`}</div>
        <div class="video-list">${p.videos.map((v, i) => `<div class="video-item ${v.completed ? 'completed' : ''}"><div class="video-number">${i + 1}.</div><div class="video-checkbox" onclick="app.toggleVideo('${p.id}', '${v.id}')">${v.completed ? `<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8L6 11L13 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ''}</div><img src="${v.thumbnail}" class="video-thumbnail" loading="lazy"><div class="video-info"><div class="video-title" title="${this.escapeHtml(v.title)}"><a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" class="video-link">${this.escapeHtml(v.title)}</a></div><div class="video-channel">${this.escapeHtml(v.channelTitle)}</div></div></div>`).join('')}</div></div></div>`;
    }

    togglePlaylistExpand(id) { const p = this.playlists.find(p => p.id === id); if (p) { p.expanded = !p.expanded; this.renderPlaylists(); } }

    toggleSpeedDropdown(e, id) {
        e.stopPropagation(); this.$$('.playlist-speed-dropdown').forEach(d => { if (d.id !== `speed-dropdown-${id}`) d.classList.remove('show'); });
        const d = this.$(`speed-dropdown-${id}`); if (d && d.classList.toggle('show')) { const i = d.querySelector('.playlist-speed-custom-input'); if (i) i.focus(); }
    }

    setPlaylistSpeed(id, str) {
        const s = parseFloat(typeof str === 'string' ? str.replace(/[xX]/g, '').trim() : str);
        if (isNaN(s) || s <= 0) return alert('Please enter a valid speed greater than 0');
        const p = this.playlists.find(p => p.id === id); if (p) { p.speed = Math.round(s * 100) / 100; this.saveData('playlists', this.playlists); this.renderPlaylists(); }
    }

    toggleVideo(pid, vid) {
        const p = this.playlists.find(p => p.id === pid), v = p?.videos.find(v => v.id === vid); if (!v) return;
        v.completed = !v.completed;
        if (this.motivationalSettings.enabled) {
            const t = this.motivationalSettings.targetCount || 5;
            if (v.completed && ++this.motivationalSettings.streakCount >= t) this.showMotivationalPopup(this.getRandomMotivationalMessage());
            else if (!v.completed && this.motivationalSettings.streakCount > 0) this.motivationalSettings.streakCount--;
            this.saveData('motivationalSettings', this.motivationalSettings); this.updateMotivationalCounterUI();
        }
        this.saveData('playlists', this.playlists); this.renderPlaylists();
    }

    getRandomMotivationalMessage() {
        const t = this.motivationalSettings.targetCount || 5;
        return [`Unstoppable! You completed ${t} videos in a row. Keep riding this wave of momentum!`, `Consistency is the key to mastery. Outstanding work on checking off these ${t} videos!`, `Boom! ${t} in a row! You're turning learning into a habit. Keep crushing it!`, `Awesome streak! ${t} contiguous videos completed. Your future self is thanking you right now!`, `You are on fire! That's ${t} videos straight. What's stopping you from doing ${t} more?`, `Success is the sum of small efforts repeated day in and day out. Amazing job on this ${t}-video streak!`, `Completed your target of ${t} videos, and you're just getting started! Keep feeding your brain.`, `A streak of ${t}! Your dedication to growth is inspiring. Let's keep this momentum going!`, `Progress, not perfection, but this ${t}-video streak is pretty close to perfect! Keep it up!`, `Fantastic focus! Completing ${t} videos in a row takes real dedication. You've got this!`, `You're building momentum with every checkmark. ${t} consecutive videos completed—outstanding!`, `Every video you watch is an investment in yourself. Excellent job completing ${t} in a row!`, `Streak alert! ${t} videos in a row checked off. Keep showing up for yourself.`, `Small wins lead to massive victories. Celebrating your ${t}-video learning streak today!`, `Look at you go! ${t} continuous videos completed. Keep pushing the boundaries of your knowledge!`, `Mastery is a journey, and you just took ${t} giant steps forward. Proud of your progress!`, `The secret of getting ahead is getting started, and you are well on your way with this ${t}-video streak!`, `${t} in a row! Discipline beats motivation, but today you have both. Keep going!`, `You're leveling up! ${t} consecutive videos completed. Keep learning, keep growing!`, `Amazing determination! Completing ${t} videos continuously proves you have what it takes. Keep it up!`][Math.floor(Math.random() * 20)];
    }

    toggleMotivationalQuotesSetting(e) { this.motivationalSettings.enabled = e; this.saveData('motivationalSettings', this.motivationalSettings); this.updateMotivationalCounterUI(); }

    changeMotivationalTarget(val) {
        const t = parseInt(val, 10); if (isNaN(t) || t <= 0) return this.updateMotivationalCounterUI();
        this.motivationalSettings.targetCount = t; this.saveData('motivationalSettings', this.motivationalSettings);
        if (this.motivationalSettings.streakCount >= t) this.showMotivationalPopup(this.getRandomMotivationalMessage()); else this.updateMotivationalCounterUI();
    }

    updateMotivationalCounterUI() {
        const c = this.$('StreakCounter'), w = document.querySelector('.motivational-toggle-wrapper'); if (!c) return;
        if (this.motivationalSettings.enabled) {
            c.innerHTML = `${this.motivationalSettings.streakCount}/<input type="number" id="motivationalTargetInput" value="${this.motivationalSettings.targetCount || 5}" min="1" max="100" style="width: 32px; border: none; background: transparent; color: var(--color-primary); font-weight: 700; font-family: inherit; font-size: inherit; text-align: center; border-bottom: 1.5px dashed var(--color-primary); padding: 0; outline: none; margin: 0 2px;" onchange="app.changeMotivationalTarget(this.value)">`;
            if (w) w.style.opacity = '1';
        } else { c.textContent = 'Off'; if (w) w.style.opacity = '0.7'; }
    }

    closeMotivationalPopup() {
        const e = this.$('motivationalPopup'); if (e) e.remove();
        this.motivationalSettings.streakCount = 0; this.saveData('motivationalSettings', this.motivationalSettings); this.updateMotivationalCounterUI();
    }

    copyPlaylistLink(e, id) {
        if (e) e.stopPropagation(); const btn = e?.currentTarget;
        navigator.clipboard.writeText(`https://www.youtube.com/playlist?list=${id}`).then(() => {
            if (!btn) return; const orig = btn.innerHTML;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-green, #10B981)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
            btn.title = "Copied!"; setTimeout(() => { btn.innerHTML = orig; btn.title = "Copy Playlist Link"; }, 2000);
        }).catch(err => console.error(err));
    }

    showMotivationalPopup(msg) {
        const e = this.$('motivationalPopup'); if (e) e.remove();
        const p = document.createElement('div'); p.id = 'motivationalPopup'; p.className = 'modal active';
        p.innerHTML = `<div class="modal-backdrop" onclick="app.closeMotivationalPopup()"></div><div class="modal-container"><div class="modal-content motivational-content" style="text-align: center; padding: var(--spacing-xl); max-width: 450px; margin: 0 auto; position: relative; z-index: 1001; animation: modalPop 0.4s var(--transition-spring);"><div class="motivational-icon" style="font-size: 3.5rem; margin-bottom: var(--spacing-sm);">🎉</div><h2 class="modal-title" style="margin-bottom: var(--spacing-sm); font-family: var(--font-display); color: var(--color-primary); font-size: var(--font-size-2xl);">Streak Completed!</h2><p style="font-size: var(--font-size-base); color: var(--color-text-primary); margin-bottom: var(--spacing-lg); line-height: 1.6; font-weight: 500;">${msg}</p><button class="btn-primary" style="margin: 0 auto; display: block;" onclick="app.closeMotivationalPopup()">Keep Going!</button></div></div><style>@keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }</style>`;
        document.body.appendChild(p);
    }

    deletePlaylist(id) { if (confirm('Are you sure you want to delete this playlist?')) { this.playlists = this.playlists.filter(p => p.id !== id); this.saveData('playlists', this.playlists); this.renderPlaylists(); } }

    downloadPlaylist(id) {
        const p = this.playlists.find(p => p.id === id); if (!p) return;
        const st = p.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(), ct = p.title.replace(/[&|<>^%"]/g, '');
        const sc = `@echo off\nset "playlist_url=https://www.youtube.com/playlist?list=${p.id}"\necho ==========================================\necho Downloading Playlist: ${ct}\necho ==========================================\necho.\necho This script will auto-configure everything needed.\necho.\n:CHECK_YTDLP\nif exist "yt-dlp.exe" goto UPDATE_YTDLP\necho [1/3] Downloading yt-dlp...\ncurl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp.exe\nif %errorlevel% neq 0 goto ERROR_YTDLP\ngoto CHECK_FFMPEG\n:UPDATE_YTDLP\necho [1/3] Checking for yt-dlp updates...\nyt-dlp.exe -U\ngoto CHECK_FFMPEG\n:CHECK_FFMPEG\nif exist "ffmpeg.exe" goto START_DOWNLOAD\necho.\necho [2/3] FFmpeg not found. Downloading... \necho This fixes "HTTP 403" errors. Please wait...\ncurl -L -o ffmpeg.zip "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"\nif %errorlevel% neq 0 goto ERROR_FFMPEG\necho Extracting FFmpeg...\npowershell -Command "Expand-Archive -Path ffmpeg.zip -DestinationPath . -Force"\necho Setting up FFmpeg...\nfor /d %%I in (ffmpeg-master-*) do (if exist "%%I\\bin\\ffmpeg.exe" (move "%%I\\bin\\ffmpeg.exe" . >nul\nmove "%%I\\bin\\ffprobe.exe" . >nul))\nif exist "ffmpeg.zip" del "ffmpeg.zip"\nfor /d %%I in (ffmpeg-master-*) do rd /s /q "%%I"\nif not exist "ffmpeg.exe" goto ERROR_FFMPEG_INSTALL\ngoto START_DOWNLOAD\n:START_DOWNLOAD\necho.\necho [3/3] Starting download...\necho.\nif not exist "yt-dlp.exe" goto ERROR_YTDLP\nyt-dlp.exe -i --ffmpeg-location . -o "%%(playlist_index)s - %%(title)s.%%(ext)s" "%playlist_url%"\necho.\necho ==========================================\necho Download Complete!\necho ==========================================\ngoto END\n:ERROR_YTDLP\necho.\necho ERROR: Could not download or find yt-dlp.exe.\necho Please check your internet connection.\ngoto END\n:ERROR_FFMPEG\necho.\necho ERROR: Could not download FFmpeg.\ngoto END\n:ERROR_FFMPEG_INSTALL\necho.\necho WARNING: FFmpeg extraction failed. Downloads might still fail.\ngoto START_DOWNLOAD\n:END\npause\n`;
        const a = document.createElement('a'); a.href = window.URL.createObjectURL(new Blob([sc], { type: 'text/plain' })); a.download = `download_${st}.bat`;
        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(a.href); document.body.removeChild(a);
        alert('Script updated to "Safety Mode"!\\n\\nI have completely rewritten the script structure to prevent it from closing instantly.\\n\\n1. Delete the old .bat files.\\n2. Run this new one.');
    }

    openModal(id, reset = true) {
        const m = this.$(id); if (!m) return; m.classList.add('active'); document.body.style.overflow = 'hidden'; if (!reset) return;
        if (id === 'habitModal') { this.$('habitModalTitle').textContent = 'Create New Habit'; this.$('habitSubmitBtnText').textContent = 'Create Habit'; this.$('habitForm').reset(); this.$('habitId').value = ''; this.$('habitDays').value = 21; }
        else if (id === 'taskModal') { this.$('taskModalTitle').textContent = 'Create New Task'; this.$('taskSubmitBtnText').textContent = 'Create Task'; this.$('taskForm').reset(); this.$('taskId').value = ''; this.$('taskDueDate').value = new Date().toISOString().split('T')[0]; }
    }

    closeModal(id) { const m = this.$(id); if (m) { m.classList.remove('active'); document.body.style.overflow = ''; } }

    switchGroupTab(t) {
        const ts = this.$('groupTabSingle'), tq = this.$('groupTabQuick'), cs = this.$('groupTabContentSingle'), cq = this.$('groupTabContentQuick'), [n, s, e] = [this.$('groupName'), this.$('groupStart'), this.$('groupEnd')];
        if (ts) ts.classList.toggle('active', t === 'single'); if (tq) tq.classList.toggle('active', t !== 'single');
        if (cs) cs.style.display = t === 'single' ? 'block' : 'none'; if (cq) cq.style.display = t === 'single' ? 'none' : 'block';
        if (n) n.required = t === 'single'; if (s) s.required = t === 'single'; if (e) e.required = t === 'single';
    }

    openGroupModal(pid, gid = '') {
        const p = this.playlists.find(p => p.id === pid); if (!p) return;
        const mv = p.videos.length, [gpEl, gEl, sIn, eIn, tEl, bEl, tbEl] = [this.$('groupPlaylistId'), this.$('groupId'), this.$('groupStart'), this.$('groupEnd'), this.$('playlistGroupModalTitle'), this.$('groupSubmitBtnText'), document.querySelector('#playlistGroupModal .modal-tabs')];
        if (gpEl) gpEl.value = pid; if (gEl) gEl.value = gid; if (sIn) sIn.max = mv; if (eIn) eIn.max = mv;
        if (gid) {
            const g = p.groups.find(g => g.id === gid); if (!g) return;
            if (tEl) tEl.textContent = 'Edit Group'; if (bEl) bEl.textContent = 'Save Changes';
            if (this.$('groupName')) this.$('groupName').value = g.name; if (sIn) sIn.value = g.start; if (eIn) eIn.value = g.end;
            document.getElementsByName('groupColor').forEach(r => r.checked = r.value === (g.color || 'default'));
            if (tbEl) tbEl.style.display = 'none'; this.switchGroupTab('single');
        } else {
            if (tEl) tEl.textContent = 'Create Group'; if (bEl) bEl.textContent = 'Create Group';
            const f = this.$('playlistGroupForm'); if (f) f.reset(); if (sIn) sIn.value = 1; if (eIn) eIn.value = mv;
            if (tbEl) tbEl.style.display = 'flex'; this.switchGroupTab('single');
        }
        this.openModal('playlistGroupModal', false);
    }

    parseRangeSpecification(str) {
        const reg = /(\d+)[\s:-]+(\d+)/g, res = []; let m;
        while ((m = reg.exec(str)) !== null) { const s = parseInt(m[1], 10), e = parseInt(m[2], 10); if (s > 0 && e >= s) res.push({ start: s, end: e }); }
        return res;
    }

    handleGroupSubmit(e) {
        e.preventDefault(); const p = this.playlists.find(p => p.id === this.$('groupPlaylistId').value), gid = this.$('groupId').value; if (!p) return;
        p.groups = p.groups || []; const isQ = this.$('groupTabQuick')?.classList.contains('active'), mv = p.videos.length;
        if (isQ) {
            const r = this.parseRangeSpecification(this.$('groupRangesInput').value.trim());
            if (!r.length) return alert('No valid ranges found. Please specify ranges like 1-10, 11-20.');
            const pr = r.map(r => ({ start: Math.min(mv, Math.max(1, r.start)), end: Math.min(mv, Math.max(1, r.end)) }));
            for (let i = 0; i < pr.length; i++) {
                if (pr[i].start > pr[i].end) return alert('Invalid range: Start video number cannot be greater than End video number.');
                for (let j = i + 1; j < pr.length; j++) if (pr[i].start <= pr[j].end && pr[i].end >= pr[j].start) return alert(`Conflict: Specified quick split ranges overlap with each other: (Videos ${pr[i].start}-${pr[i].end}) and (Videos ${pr[j].start}-${pr[j].end}).`);
            }
            for (const r of pr) { const og = p.groups.find(g => r.start <= g.end && r.end >= g.start); if (og) return alert(`Conflict: The range (Videos ${r.start} - ${r.end}) overlaps with an existing group: "${og.name}" (Videos ${og.start} - ${og.end}). Each video can only belong to one group.`); }
            pr.forEach((r, i) => p.groups.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name: `Group ${p.groups.length + 1} (${r.start}-${r.end})`, start: r.start, end: r.end, color: ['rose', 'amber', 'emerald', 'sky', 'violet', 'slate'][i % 6] }));
        } else {
            const name = this.$('groupName').value.trim(), s = Math.min(mv, Math.max(1, parseInt(this.$('groupStart').value, 10))), end = Math.min(mv, Math.max(1, parseInt(this.$('groupEnd').value, 10)));
            let col = 'default'; for (const r of document.getElementsByName('groupColor')) if (r.checked) { col = r.value; break; }
            if (s > end) return alert('Start video cannot be greater than end video.');
            const og = p.groups.find(g => (!gid || g.id !== gid) && (s <= g.end && end >= g.start));
            if (og) return alert(`Conflict: The range (Videos ${s} - ${end}) overlaps with an existing group: "${og.name}" (Videos ${og.start} - ${og.end}). Each video can only belong to one group.`);
            if (gid) { const g = p.groups.find(g => g.id === gid); if (g) Object.assign(g, { name, start: s, end, color: col }); }
            else { p.groups.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 5), name, start: s, end, color: col }); }
        }
        this.saveData('playlists', this.playlists); this.renderPlaylists(); this.closeModal('playlistGroupModal');
    }

    deletePlaylistGroup(pid, gid) { const p = this.playlists.find(p => p.id === pid); if (p) { p.groups = (p.groups || []).filter(g => g.id !== gid); this.saveData('playlists', this.playlists); this.renderPlaylists(); } }

    clearAllPlaylistGroups(pid) { if (confirm('Are you sure you want to delete all groups for this playlist? This action cannot be undone.')) { const p = this.playlists.find(p => p.id === pid); if (p) { p.groups = []; this.saveData('playlists', this.playlists); this.renderPlaylists(); } } }

    saveData(k, d) { localStorage.setItem(k, JSON.stringify(d)); }
    loadData(k) { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; }
    formatDate(ds) { return new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
    parseISO8601Duration(iso) { const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return !m ? 0 : (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0); }
    formatDuration(s) { if (!s) return '0m'; const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`; }
}

window.app = new ProductivityHub();