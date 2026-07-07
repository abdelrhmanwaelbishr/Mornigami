// ============================================
// PRODUCTIVITY HUB - UNIFIED APPLICATION
// ============================================

class ProductivityHub {
    constructor() {
        this.currentPage = 'habits';
        this.habits = this.loadData('habits') || [];
        this.tasks = this.loadData('tasks') || [];
        this.pomodoroSettings = this.loadData('pomodoroSettings') || {
            workDuration: 25,
            shortBreakDuration: 5,
            longBreakDuration: 15
        };
        this.pomodoroStats = this.loadData('pomodoroStats') || {
            sessionsToday: 0,
            totalFocusTime: 0,
            currentStreak: 0,
            lastSessionDate: null
        };
        this.pomodoroTimer = null;
        this.pomodoroTimeLeft = this.pomodoroSettings.workDuration * 60;
        this.pomodoroTotalTime = this.pomodoroSettings.workDuration * 60;
        this.pomodoroMode = 'work';
        this.pomodoroIsRunning = false;
        this.currentTaskFilter = 'pending';
        this.playlists = this.loadData('playlists') || [];
        this.youtubeApiKey = 'AIzaSyDOpHgt8xrp_SlMs0rWT8YDxeQsyeB3kvc';
        this.motivationalSettings = this.loadData('motivationalSettings') || {
            enabled: true,
            streakCount: 0,
            targetCount: 5
        };
        if (this.motivationalSettings.targetCount === undefined) {
            this.motivationalSettings.targetCount = 5;
        }

        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.renderPage(this.currentPage);
        this.checkPomodoroStats();
    }

    // ============================================
    // THEME & NAVIGATION
    // ============================================

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        const accentColor = localStorage.getItem('accentColor');
        if (accentColor) {
            const isDark = theme === 'dark';
            if (isDark && accentColor === '#1C1917') {
                this.setAccentColor('#FF6B35');
            } else if (!isDark && accentColor === '#FFFFFF') {
                this.setAccentColor('#FF6B35');
            } else {
                this.setAccentColor(accentColor);
            }
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        const accentColor = localStorage.getItem('accentColor');
        if (isDark && accentColor === '#1C1917') {
            this.setAccentColor('#FF6B35');
        } else if (!isDark && accentColor === '#FFFFFF') {
            this.setAccentColor('#FF6B35');
        }

        this.renderAccentDropdown();
    }

    toggleAccentDropdown(event) {
        if (event) event.stopPropagation();

        const dropdown = document.getElementById('accentColorDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                this.renderAccentDropdown();
            }
        }
    }

    renderAccentDropdown() {
        const dropdown = document.getElementById('accentColorDropdown');
        if (!dropdown) return;

        const isDark = document.body.classList.contains('dark-theme');
        const savedColor = localStorage.getItem('accentColor') || '#FF6B35';

        const allOptions = [
            { name: 'Orange', hex: '#FF6B35' },
            { name: 'Blue', hex: '#4A90E2' },
            { name: 'Purple', hex: '#8A2BE2' },
            { name: 'White', hex: '#FFFFFF', darkOnly: true },
            { name: 'Black', hex: '#1C1917', lightOnly: true }
        ];

        const options = allOptions.filter(opt => {
            if (opt.darkOnly && !isDark) return false;
            if (opt.lightOnly && isDark) return false;
            return true;
        });

        dropdown.innerHTML = `
            <div style="font-size: var(--font-size-xs); color: var(--color-text-secondary); font-weight: 700; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--color-border); text-transform: uppercase; letter-spacing: 0.5px;">Accent Theme</div>
            ${options.map(opt => {
            const isActive = savedColor.toUpperCase() === opt.hex.toUpperCase();
            return `
                    <button class="accent-color-option ${isActive ? 'active' : ''}" onclick="app.selectAccentColor('${opt.hex}')">
                        <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${opt.hex}; border: 1px solid ${opt.hex === '#FFFFFF' ? '#78716C' : 'transparent'};"></span>
                        <span style="flex: 1; font-weight: 600;">${opt.name}</span>
                        ${isActive ? '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8L6 11L13 4"/></svg>' : ''}
                    </button>
                `;
        }).join('')}
        `;
    }

    selectAccentColor(hex) {
        this.setAccentColor(hex);
        this.renderAccentDropdown();
    }

    setAccentColor(hex) {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', hex);
        root.style.setProperty('--color-primary-light', this.adjustColorBrightness(hex, 15));
        root.style.setProperty('--color-primary-dark', this.adjustColorBrightness(hex, -15));

        const contrastHex = this.getContrastColor(hex);
        root.style.setProperty('--color-primary-contrast', contrastHex);

        localStorage.setItem('accentColor', hex);
    }

    getContrastColor(hex) {
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 150) ? '#1C1917' : '#FFFFFF';
    }

    adjustColorBrightness(hex, percent) {
        let num = parseInt(hex.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Accent color picker toggle
        const accentColorBtn = document.getElementById('accentColorBtn');
        if (accentColorBtn) {
            accentColorBtn.addEventListener('click', (e) => this.toggleAccentDropdown(e));
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.switchPage(page);
            });
        });

        // Habit Modal
        document.getElementById('closeHabitModal').addEventListener('click', () => this.closeModal('habitModal'));
        document.getElementById('cancelHabitBtn').addEventListener('click', () => this.closeModal('habitModal'));
        document.getElementById('habitForm').addEventListener('submit', (e) => this.handleHabitSubmit(e));

        // Task Modal
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeModal('taskModal'));
        document.getElementById('cancelTaskBtn').addEventListener('click', () => this.closeModal('taskModal'));
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Pomodoro Settings Modal
        document.getElementById('closePomodoroSettings').addEventListener('click', () => this.closeModal('pomodoroSettingsModal'));
        document.getElementById('cancelPomodoroSettings').addEventListener('click', () => this.closeModal('pomodoroSettingsModal'));
        document.getElementById('pomodoroSettingsForm').addEventListener('submit', (e) => this.handlePomodoroSettingsSubmit(e));

        // Playlist Modal
        document.getElementById('closePlaylistModal').addEventListener('click', () => this.closeModal('playlistModal'));
        document.getElementById('cancelPlaylistBtn').addEventListener('click', () => this.closeModal('playlistModal'));
        document.getElementById('playlistForm').addEventListener('submit', (e) => this.handlePlaylistSubmit(e));

        // Close modals on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.playlist-speed-container')) {
                document.querySelectorAll('.playlist-speed-dropdown').forEach(dropdown => {
                    dropdown.classList.remove('show');
                });
            }
            if (!e.target.closest('.accent-picker-wrapper')) {
                const dropdown = document.getElementById('accentColorDropdown');
                if (dropdown) dropdown.classList.remove('show');
            }
        });
    }

    switchPage(page) {
        this.currentPage = page;

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        this.renderPage(page);
    }

    renderPage(page) {
        const content = document.getElementById('pageContent');

        switch (page) {
            case 'habits':
                content.innerHTML = this.getHabitsPageHTML();
                this.setupHabitsEventListeners();
                this.renderHabits();
                this.updateHabitsStats();
                break;
            case 'todo':
                content.innerHTML = this.getTodoPageHTML();
                this.setupTodoEventListeners();
                this.renderTasks();
                this.updateTodoStats();
                break;
            case 'pomodoro':
                content.innerHTML = this.getPomodoroPageHTML();
                this.setupPomodoroEventListeners();
                this.updatePomodoroDisplay();
                this.updatePomodoroStats();
                break;
            case 'playlist':
                content.innerHTML = this.getPlaylistPageHTML();
                this.setupPlaylistEventListeners();
                this.renderPlaylists();
                this.backfillMissingDurations();
                break;
        }
    }

    // ============================================
    // HABITS PAGE
    // ============================================

    getHabitsPageHTML() {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="brand-text">
                        <h1 class="brand-title">Habits</h1>
                        <p class="brand-subtitle">Build better, daily</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-primary" id="addHabitBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <span>New Habit</span>
                        </button>
                    </div>
                </div>
            </header>

            <main class="app-main">
                <section class="stats-section">
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Active Habits</p>
                            <p class="stat-value" id="activeHabitsCount">0</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Completed Today</p>
                            <p class="stat-value" id="completedTodayCount">0</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Current Streak</p>
                            <p class="stat-value" id="currentStreak">0</p>
                        </div>
                    </div>
                </section>

                <section class="habits-section">
                    <div class="section-header">
                        <h2 class="section-title">Your Habits</h2>
                        <div class="view-controls">
                            <button class="view-btn active" id="gridViewBtn" data-view="grid" title="Grid view">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                                    <rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                                    <rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                                    <rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                                </svg>
                            </button>
                            <button class="view-btn" id="listViewBtn" data-view="list" title="List view">
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                    <rect x="2" y="3" width="14" height="3" rx="1.5" fill="currentColor" />
                                    <rect x="2" y="8" width="14" height="3" rx="1.5" fill="currentColor" />
                                    <rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div id="emptyState" class="empty-state" style="display: none;">
                        <div class="empty-icon" onclick="app.openModal('habitModal')" title="Create habit">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <circle cx="40" cy="40" r="38" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2" />
                                <path d="M40 25V55M25 40H55" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" />
                            </svg>
                        </div>
                        <h3 class="empty-title">No habits yet</h3>
                        <p class="empty-description">Start building better routines by creating your first habit.</p>
                    </div>

                    <div id="habitsGrid" class="habits-grid"></div>
                </section>
            </main>
        `;
    }

    setupHabitsEventListeners() {
        const addBtn = document.getElementById('addHabitBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal('habitModal'));
        }

        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');

        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => this.switchHabitView('grid'));
        }
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.switchHabitView('list'));
        }

        this.setupDragAndDrop();
    }

    switchHabitView(view) {
        const habitsGrid = document.getElementById('habitsGrid');
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');

        if (view === 'list') {
            habitsGrid.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        } else {
            habitsGrid.classList.remove('list-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        }
    }

    setupDragAndDrop() {
        const grid = document.getElementById('habitsGrid');
        if (!grid) return;

        let draggedItem = null;

        grid.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.habit-card');
            if (card) {
                draggedItem = card;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.id);
                setTimeout(() => card.classList.add('dragging'), 0);
            }
        });

        grid.addEventListener('dragend', (e) => {
            const card = e.target.closest('.habit-card');
            if (card) {
                card.classList.remove('dragging');
                draggedItem = null;
            }
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(grid, e.clientY, e.clientX);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                grid.appendChild(draggable);
            } else {
                grid.insertBefore(draggable, afterElement);
            }
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            const newOrder = [...grid.querySelectorAll('.habit-card')].map(card => card.dataset.id);
            this.reorderHabits(newOrder);
        });
    }

    getDragAfterElement(container, y, x) {
        const draggableElements = [...container.querySelectorAll('.habit-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const distance = Math.hypot(
                x - (box.left + box.width / 2),
                y - (box.top + box.height / 2)
            );

            if (closest === null || distance < closest.distance) {
                return { distance: distance, element: child };
            } else {
                return closest;
            }
        }, null)?.element;
    }

    reorderHabits(newOrder) {
        const newHabits = [];
        newOrder.forEach(id => {
            const habit = this.habits.find(h => h.id === id);
            if (habit) {
                newHabits.push(habit);
            }
        });
        this.habits = newHabits;
        this.saveData('habits', this.habits);
    }

    renderHabits() {
        const habitsGrid = document.getElementById('habitsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.habits.length === 0) {
            habitsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        habitsGrid.innerHTML = this.habits.map(habit => this.getHabitCardHTML(habit)).join('');
    }

    getHabitCardHTML(habit) {
        const days = habit.days || 21;
        const completedDays = habit.progress.filter(Boolean).length;
        const progressPercent = Math.round((completedDays / days) * 100);
        const priority = habit.priority || 'low';
        const isCompleted = completedDays === days;
        const cardColor = habit.cardColor || 'default';

        return `
            <div class="habit-card${cardColor !== 'default' ? ' card-' + cardColor : ''}" draggable="true" data-id="${habit.id}">
                <div class="habit-header">
                    <div class="habit-info">
                        <h3 class="habit-name">${this.escapeHtml(habit.name)}</h3>
                        <div class="habit-meta">
                            <span class="priority-badge ${priority}">
                                <span class="priority-dot"></span>
                                ${priority}
                            </span>
                            <span>•</span>
                            <span>${days} days</span>
                            ${isCompleted ? '<span>•</span><span>✓ Completed</span>' : ''}
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="icon-btn" onclick="app.editHabit('${habit.id}')" title="Edit habit">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <path d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25C15.4142 1.83579 16.0858 1.83579 16.5 2.25C16.9142 2.66421 16.9142 3.33579 16.5 3.75Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="app.deleteHabit('${habit.id}')" title="Delete habit">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>

                ${isCompleted ? `
                    <div class="completion-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Habit Completed!</span>
                    </div>
                ` : ''}

                <div class="progress-grid">
                    ${habit.progress.map((isDone, dayIdx) => `
                        <div 
                            class="day-cell ${isDone ? 'completed' : ''}" 
                            onclick="app.toggleDay('${habit.id}', ${dayIdx})"
                            title="Day ${dayIdx + 1}"
                        >
                            ${dayIdx + 1}
                        </div>
                    `).join('')}
                </div>

                <div class="progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Progress</span>
                        <span class="progress-stats">${completedDays}/${days} • ${progressPercent}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>

                ${isCompleted ? `
                    <button class="btn-reset" onclick="app.resetHabit('${habit.id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                            <path d="M2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8C14 11.3137 11.3137 14 8 14C6.11438 14 4.44349 13.0602 3.38734 11.6458" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M2 11V8H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Reset Progress
                    </button>
                ` : ''}
            </div>
        `;
    }

    handleHabitSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('habitId').value;
        const name = document.getElementById('habitName').value.trim();
        const days = parseInt(document.getElementById('habitDays').value) || 21;
        const priority = document.querySelector('input[name="priority"]:checked')?.value || 'low';
        const cardColor = document.querySelector('input[name="cardColor"]:checked')?.value || 'default';

        if (id) {
            // Edit existing
            this.habits = this.habits.map(h => {
                if (h.id === id) {
                    let newProgress = h.progress;
                    if (days !== h.days) {
                        newProgress = Array(days).fill(false);
                        for (let i = 0; i < Math.min(h.progress.length, days); i++) {
                            newProgress[i] = h.progress[i];
                        }
                    }
                    return { ...h, name, priority, days, cardColor, progress: newProgress };
                }
                return h;
            });
        } else {
            // Create new
            const newHabit = {
                id: Date.now().toString(),
                name,
                priority,
                days,
                cardColor,
                createdAt: new Date().toISOString(),
                progress: Array(days).fill(false)
            };
            this.habits.push(newHabit);
        }

        this.saveData('habits', this.habits);
        this.renderHabits();
        this.updateHabitsStats();
        this.closeModal('habitModal');
    }

    editHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;

        document.getElementById('habitModalTitle').textContent = 'Edit Habit';
        document.getElementById('habitSubmitBtnText').textContent = 'Save Changes';
        document.getElementById('habitId').value = habit.id;
        document.getElementById('habitName').value = habit.name;
        document.getElementById('habitDays').value = habit.days || 21;

        const priority = habit.priority || 'low';
        document.querySelectorAll('input[name="priority"]').forEach(radio => {
            radio.checked = radio.value === priority;
        });

        const cardColor = habit.cardColor || 'default';
        document.querySelectorAll('input[name="cardColor"]').forEach(radio => {
            radio.checked = radio.value === cardColor;
        });

        this.openModal('habitModal', false);
    }

    deleteHabit(id) {
        if (confirm('Are you sure you want to delete this habit?')) {
            this.habits = this.habits.filter(h => h.id !== id);
            this.saveData('habits', this.habits);
            this.renderHabits();
            this.updateHabitsStats();
        }
    }

    resetHabit(id) {
        this.habits = this.habits.map(h => {
            if (h.id === id) {
                const days = h.days || 21;
                return { ...h, progress: Array(days).fill(false) };
            }
            return h;
        });
        this.saveData('habits', this.habits);
        this.renderHabits();
        this.updateHabitsStats();
    }

    toggleDay(habitId, dayIndex) {
        this.habits = this.habits.map(h => {
            if (h.id === habitId) {
                const newProgress = [...h.progress];
                newProgress[dayIndex] = !newProgress[dayIndex];
                return { ...h, progress: newProgress };
            }
            return h;
        });
        this.saveData('habits', this.habits);
        this.renderHabits();
        this.updateHabitsStats();
    }

    updateHabitsStats() {
        const activeHabitsCount = document.getElementById('activeHabitsCount');
        const completedTodayCount = document.getElementById('completedTodayCount');
        const currentStreak = document.getElementById('currentStreak');

        if (activeHabitsCount) activeHabitsCount.textContent = this.habits.length;

        if (completedTodayCount) {
            const completedToday = this.habits.filter(h => h.progress.some(Boolean)).length;
            completedTodayCount.textContent = completedToday;
        }

        if (currentStreak) {
            const streak = this.habits.filter(h => {
                const days = h.days || 21;
                const completedDays = h.progress.filter(Boolean).length;
                return completedDays === days;
            }).length;
            currentStreak.textContent = streak;
        }
    }

    // ============================================
    // TO-DO LIST PAGE
    // ============================================

    getTodoPageHTML() {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="brand-text">
                        <h1 class="brand-title">To-Do List</h1>
                        <p class="brand-subtitle">Stay organized, get things done</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn-primary" id="addTaskBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <span>New Task</span>
                        </button>
                    </div>
                </div>
            </header>

            <main class="app-main">
                <section class="stats-section">
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Total Tasks</p>
                            <p class="stat-value" id="totalTasksCount">0</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Completed</p>
                            <p class="stat-value" id="completedTasksCount">0</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Pending</p>
                            <p class="stat-value" id="pendingTasksCount">0</p>
                        </div>
                    </div>
                </section>

                <section class="tasks-section">
                    <div class="section-header">
                        <h2 class="section-title">Your Tasks</h2>
                        <div class="controls-wrapper" style="display: flex; gap: 12px; align-items: center;">
                            <!-- View Switches -->
                            <div class="view-controls">
                                <button class="view-btn active" id="taskListViewBtn" data-view="list" title="List view">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <rect x="2" y="3" width="14" height="3" rx="1.5" fill="currentColor" />
                                        <rect x="2" y="8" width="14" height="3" rx="1.5" fill="currentColor" />
                                        <rect x="2" y="13" width="14" height="3" rx="1.5" fill="currentColor" />
                                    </svg>
                                </button>
                                <button class="view-btn" id="taskGridViewBtn" data-view="grid" title="Grid view">
                                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                        <rect x="2" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                                        <rect x="10" y="2" width="6" height="6" rx="1.5" fill="currentColor" />
                                        <rect x="2" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                                        <rect x="10" y="10" width="6" height="6" rx="1.5" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>

                            <!-- Sort -->
                            <select id="taskSortSelect" class="sort-select">
                                <option value="default">Sort by...</option>
                                <option value="priority-high">Priority (High to Low)</option>
                                <option value="priority-low">Priority (Low to High)</option>
                            </select>

                            <!-- Filters -->
                            <div class="filter-controls">
                                <button class="filter-btn active" data-filter="pending">Pending</button>
                                <button class="filter-btn" data-filter="completed">Completed</button>
                            </div>
                        </div>
                    </div>

                    <div id="tasksList" class="tasks-list"></div>
                    
                    <div id="emptyTasksState" class="empty-state" style="display: none;">
                        <div class="empty-icon clickable" id="emptyStateAddBtn">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <rect x="15" y="15" width="50" height="50" rx="8" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2" />
                                <path d="M40 30V50M30 40H50" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3" class="plus-path"/>
                            </svg>
                        </div>
                        <h3 class="empty-title">Come on, Create your first task!</h3>
                    </div>

                    <div id="emptyCompletedState" class="empty-state" style="display: none;">
                        <h3 class="empty-title">Come on, Finish your first task!</h3>
                    </div>
                </section>
            </main>
        `;
    }

    setupTodoEventListeners() {
        const addBtn = document.getElementById('addTaskBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal('taskModal'));
        }

        const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
        if (emptyStateAddBtn) {
            emptyStateAddBtn.addEventListener('click', () => this.openModal('taskModal'));
        }

        const taskGridViewBtn = document.getElementById('taskGridViewBtn');
        const taskListViewBtn = document.getElementById('taskListViewBtn');

        if (taskGridViewBtn) {
            taskGridViewBtn.addEventListener('click', () => this.switchTaskView('grid'));
        }
        if (taskListViewBtn) {
            taskListViewBtn.addEventListener('click', () => this.switchTaskView('list'));
        }

        const sortSelect = document.getElementById('taskSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.sortTasks(e.target.value));
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTasks(e.target.dataset.filter));
        });

        this.setupTaskDragAndDrop();
    }

    filterTasks(filter) {
        this.currentTaskFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        this.renderTasks(filter);
    }

    renderTasks(filter = 'pending') {
        const tasksList = document.getElementById('tasksList');
        const emptyTasksState = document.getElementById('emptyTasksState');
        const emptyCompletedState = document.getElementById('emptyCompletedState');

        let filteredTasks = this.tasks;
        if (filter === 'pending') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        } else if (filter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        }

        // Hide all empty states first
        if (emptyTasksState) emptyTasksState.style.display = 'none';
        if (emptyCompletedState) emptyCompletedState.style.display = 'none';

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = '';
            if (filter === 'completed') {
                if (emptyCompletedState) emptyCompletedState.style.display = 'block';
            } else {
                if (emptyTasksState) emptyTasksState.style.display = 'block';
            }
            return;
        }

        // Always use date-based blocks in both views
        const groupedTasks = this.groupTasksByDate(filteredTasks);
        const isGridView = tasksList.classList.contains('grid-view');
        tasksList.innerHTML = groupedTasks.map(group => this.getDateCardHTML(group, isGridView)).join('');

        // Setup drag and drop after rendering
        this.setupTaskDragAndDrop();
    }

    groupTasksByDate(tasks) {
        const groups = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            // Use the task's dueDate directly if it's already in YYYY-MM-DD format
            // Otherwise parse and format it locally
            let dateKey = task.dueDate;

            // If the dueDate includes time info, extract just the date part
            if (dateKey && dateKey.includes('T')) {
                dateKey = dateKey.split('T')[0];
            }

            // Create a date object for display (parse as local date)
            const [year, month, day] = dateKey.split('-').map(Number);
            const dueDate = new Date(year, month - 1, day);

            if (!groups[dateKey]) {
                groups[dateKey] = {
                    dateKey: dateKey,
                    date: dueDate,
                    tasks: []
                };
            }
            groups[dateKey].tasks.push(task);
        });

        // Sort groups by date
        return Object.values(groups).sort((a, b) => a.date - b.date);
    }

    getDateLabel(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        } else if (date.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else if (date.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    }

    getDateCardHTML(group, isGridView = false) {
        const dateLabel = this.getDateLabel(group.date);
        const taskCount = group.tasks.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let cardClass = '';
        if (group.date < today) {
            cardClass = 'overdue';
        } else if (group.date.getTime() === today.getTime()) {
            cardClass = 'today';
        }

        return `
            <div class="date-card ${cardClass}" data-date="${group.dateKey}">
                <div class="date-card-header">
                    <div class="date-card-info">
                        <h3 class="date-card-title">${dateLabel}</h3>
                        <span class="date-card-count">${taskCount} task${taskCount !== 1 ? 's' : ''}</span>
                    </div>
                    <button class="date-card-add-btn" onclick="app.openModal('taskModal')" title="Add task">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="date-card-tasks" data-date="${group.dateKey}">
                    ${group.tasks.map(task => this.getTaskItemHTML(task)).join('')}
                </div>
            </div>
        `;
    }


    getTaskItemHTML(task) {
        // Parse the dueDate as local date to avoid timezone issues
        let dateStr = task.dueDate;
        if (dateStr && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        const dueDate = new Date(year, month - 1, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Format date for display
        const dateDisplay = dueDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        let dueDateClass = '';

        if (dueDate < today && !task.completed) {
            dueDateClass = 'overdue';
        } else if (dueDate.getTime() === today.getTime() && !task.completed) {
            dueDateClass = 'today';
        }

        const priority = task.priority || 'low';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${dueDateClass}" draggable="true" data-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="app.toggleTask('${task.id}')">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="task-main-content">
                    <div class="task-name">${this.escapeHtml(task.name)}</div>
                    <div class="task-time">${dateDisplay}</div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn edit" onclick="event.stopPropagation(); app.editTask('${task.id}')" title="Edit task">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <path d="M8.25 3H3C2.44772 3 2 3.44772 2 4V15C2 15.5523 2.44772 16 3 16H14C14.5523 16 15 15.5523 15 15V9.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            <path d="M13.5 2.25L15.75 4.5M16.5 3.75L10.5 9.75L8.25 10.5L9 8.25L15 2.25C15.4142 1.83579 16.0858 1.83579 16.5 2.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                    <button class="task-action-btn delete" onclick="event.stopPropagation(); app.deleteTask('${task.id}')" title="Delete task">
                        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <path d="M3 5H15M7 8V13M11 8V13M13 5V14C13 14.5 12.5 15 12 15H6C5.5 15 5 14.5 5 14V5M7 5V3C7 2.5 7.5 2 8 2H10C10.5 2 11 2.5 11 3V5" 
                                stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    handleTaskSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('taskId').value;
        const name = document.getElementById('taskName').value.trim();
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.querySelector('input[name="taskPriority"]:checked')?.value || 'low';

        if (id) {
            // Edit existing
            this.tasks = this.tasks.map(t => {
                if (t.id === id) {
                    return { ...t, name, dueDate, priority };
                }
                return t;
            });
        } else {
            // Create new
            const newTask = {
                id: Date.now().toString(),
                name,
                dueDate,
                priority,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
        }

        this.saveData('tasks', this.tasks);
        this.renderTasks(this.currentTaskFilter);
        this.updateTodoStats();
        this.closeModal('taskModal');
    }

    switchTaskView(view) {
        const tasksList = document.getElementById('tasksList');
        const gridViewBtn = document.getElementById('taskGridViewBtn');
        const listViewBtn = document.getElementById('taskListViewBtn');

        if (view === 'grid') {
            tasksList.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            tasksList.classList.remove('grid-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }

        // Re-render tasks to apply the correct view format
        this.renderTasks(this.currentTaskFilter);
    }

    sortTasks(criteria) {
        if (criteria === 'default') {
            this.tasks.sort((a, b) => b.id.localeCompare(a.id));
        } else if (criteria === 'priority-high') {
            const priorityMap = { high: 3, medium: 2, low: 1 };
            this.tasks.sort((a, b) => {
                const pA = priorityMap[a.priority || 'low'];
                const pB = priorityMap[b.priority || 'low'];
                return pB - pA;
            });
        } else if (criteria === 'priority-low') {
            const priorityMap = { high: 3, medium: 2, low: 1 };
            this.tasks.sort((a, b) => {
                const pA = priorityMap[a.priority || 'low'];
                const pB = priorityMap[b.priority || 'low'];
                return pA - pB;
            });
        }
        this.renderTasks(this.currentTaskFilter);
    }

    setupTaskDragAndDrop() {
        const list = document.getElementById('tasksList');
        if (!list) return;

        let draggedItem = null;
        let originalParent = null;

        list.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.task-item');
            if (item) {
                draggedItem = item;
                originalParent = item.parentElement;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', item.dataset.id);
                setTimeout(() => item.classList.add('dragging'), 0);
            }
        });

        list.addEventListener('dragend', (e) => {
            const item = e.target.closest('.task-item');
            if (item) {
                item.classList.remove('dragging');

                // Check if the item ended up outside a date-card-tasks container
                const currentParent = item.parentElement;
                if (!currentParent || !currentParent.classList.contains('date-card-tasks')) {
                    // Task is orphaned - re-render to fix
                    this.renderTasks(this.currentTaskFilter);
                    return;
                }

                draggedItem = null;
                originalParent = null;
            }
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();

            const draggable = document.querySelector('.task-item.dragging');
            if (!draggable) return;

            // ONLY allow dropping inside date-card-tasks containers
            const dateCardTasks = e.target.closest('.date-card-tasks');
            if (dateCardTasks) {
                e.dataTransfer.dropEffect = 'move';
                const afterElement = this.getTaskDragAfterElement(dateCardTasks, e.clientY, e.clientX);
                if (afterElement == null) {
                    dateCardTasks.appendChild(draggable);
                } else {
                    dateCardTasks.insertBefore(draggable, afterElement);
                }
            } else {
                // Not over a valid drop target - show "not allowed" cursor
                e.dataTransfer.dropEffect = 'none';
            }
        });

        list.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggable = document.querySelector('.task-item.dragging');

            if (!draggable) return;

            // Check if dropped inside a valid date-card-tasks container
            const dateCardTasks = draggable.closest('.date-card-tasks');
            if (dateCardTasks) {
                const newDateKey = dateCardTasks.dataset.date;
                const taskId = draggable.dataset.id;
                this.updateTaskDueDate(taskId, newDateKey);

                // Collect new order and save
                const newOrderIds = [...list.querySelectorAll('.task-item')].map(item => item.dataset.id);
                this.reorderTasks(newOrderIds);

                // Re-render to clean up empty cards
                this.renderTasks(this.currentTaskFilter);
            } else {
                // Dropped outside - restore to original position
                this.renderTasks(this.currentTaskFilter);
            }
        });
    }

    updateTaskDueDate(taskId, newDateKey) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // newDateKey is already in YYYY-MM-DD format from the data-date attribute
            // Just use it directly to avoid timezone conversion issues
            task.dueDate = newDateKey;
            this.saveData('tasks', this.tasks);
        }
    }

    getTaskDragAfterElement(container, y, x) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

        // If no elements, return null (append to end)
        if (draggableElements.length === 0) {
            return null;
        }

        // Find the element we should insert before based on vertical position
        // Since tasks within a date card are always in a vertical list
        let closestElement = null;
        let closestOffset = Number.NEGATIVE_INFINITY;

        for (const child of draggableElements) {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            // We want the element just below our cursor (negative offset closest to 0)
            if (offset < 0 && offset > closestOffset) {
                closestOffset = offset;
                closestElement = child;
            }
        }

        return closestElement;
    }

    reorderTasks(newOrderIds) {
        const newTasks = [];
        const taskMap = new Map(this.tasks.map(t => [t.id, t]));

        newOrderIds.forEach(id => {
            if (taskMap.has(id)) {
                newTasks.push(taskMap.get(id));
                taskMap.delete(id);
            }
        });
        taskMap.forEach(task => newTasks.push(task));
        this.tasks = newTasks;
        this.saveData('tasks', this.tasks);
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(t => {
            if (t.id === id) {
                return { ...t, completed: !t.completed };
            }
            return t;
        });
        this.saveData('tasks', this.tasks);
        this.renderTasks(this.currentTaskFilter);
        this.updateTodoStats();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskSubmitBtnText').textContent = 'Save Changes';
        document.getElementById('taskId').value = task.id;
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskDueDate').value = task.dueDate;

        const priority = task.priority || 'low';
        document.querySelectorAll('input[name="taskPriority"]').forEach(radio => {
            radio.checked = radio.value === priority;
        });

        this.openModal('taskModal', false);
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveData('tasks', this.tasks);
            this.renderTasks(this.currentTaskFilter);
            this.updateTodoStats();
        }
    }

    updateTodoStats() {
        const totalTasksCount = document.getElementById('totalTasksCount');
        const completedTasksCount = document.getElementById('completedTasksCount');
        const pendingTasksCount = document.getElementById('pendingTasksCount');

        if (totalTasksCount) totalTasksCount.textContent = this.tasks.length;
        if (completedTasksCount) {
            const completed = this.tasks.filter(t => t.completed).length;
            completedTasksCount.textContent = completed;
        }
        if (pendingTasksCount) {
            const pending = this.tasks.filter(t => !t.completed).length;
            pendingTasksCount.textContent = pending;
        }
    }

    // ============================================
    // POMODORO PAGE
    // ============================================

    getPomodoroPageHTML() {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="brand-text">
                        <h1 class="brand-title">Pomodoro Timer</h1>
                        <p class="brand-subtitle">Focus better, work smarter</p>
                    </div>
                </div>
            </header>

            <main class="app-main">
                <section class="stats-section">
                    <div class="stat-card">
                        <div class="stat-icon stat-icon-blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Sessions Today</p>
                            <p class="stat-value" id="sessionsToday">0</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Focus Time</p>
                            <p class="stat-value" id="totalFocusTime">0m</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon stat-icon-orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <div class="stat-content">
                            <p class="stat-label">Current Streak</p>
                            <p class="stat-value" id="currentStreak">0</p>
                        </div>
                    </div>
                </section>

                <section class="pomodoro-section">
                    <div class="pomodoro-card">
                        <div class="mode-selector">
                            <button class="mode-btn active" data-mode="work">Work</button>
                            <button class="mode-btn" data-mode="short">Short Break</button>
                            <button class="mode-btn" data-mode="long">Long Break</button>
                        </div>

                        <div class="timer-display">
                            <svg class="timer-ring" width="320" height="320" viewBox="0 0 320 320">
                                <circle class="timer-ring-bg" cx="160" cy="160" r="140" />
                                <circle class="timer-ring-progress" cx="160" cy="160" r="140" id="timerProgress" />
                            </svg>
                            <div class="timer-content">
                                <div class="timer-time" id="timerDisplay">25:00</div>
                                <div class="timer-label" id="timerLabel">Focus Time</div>
                            </div>
                        </div>

                        <div class="timer-controls">
                            <button class="btn-timer-primary" id="startBtn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                                </svg>
                                <span>Start</span>
                            </button>
                            <button class="btn-timer-secondary" id="resetBtn">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C9.25 4 6.82 5.38 5.38 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                    <path d="M4 4V8H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <span>Reset</span>
                            </button>
                        </div>

                        <button class="btn-settings" id="settingsBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="currentColor" stroke-width="1.5" />
                                <path d="M16.25 10C16.25 10.4 16.6 10.75 17 10.75C17.4 10.75 17.75 10.4 17.75 10C17.75 9.6 17.4 9.25 17 9.25C16.6 9.25 16.25 9.6 16.25 10ZM10 2.25C9.6 2.25 9.25 2.6 9.25 3C9.25 3.4 9.6 3.75 10 3.75C10.4 3.75 10.75 3.4 10.75 3C10.75 2.6 10.4 2.25 10 2.25ZM3 9.25C2.6 9.25 2.25 9.6 2.25 10C2.25 10.4 2.6 10.75 3 10.75C3.4 10.75 3.75 10.4 3.75 10C3.75 9.6 3.4 9.25 3 9.25ZM10 16.25C9.6 16.25 9.25 16.6 9.25 17C9.25 17.4 9.6 17.75 10 17.75C10.4 17.75 10.75 17.4 10.75 17C10.75 16.6 10.4 16.25 10 16.25Z" stroke="currentColor" stroke-width="1.5" />
                            </svg>
                            <span>Settings</span>
                        </button>
                    </div>
                </section>
            </main>
        `;
    }

    setupPomodoroEventListeners() {
        const startBtn = document.getElementById('startBtn');
        const resetBtn = document.getElementById('resetBtn');
        const settingsBtn = document.getElementById('settingsBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.togglePomodoro());
        }
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetPomodoro());
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openPomodoroSettings());
        }

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchPomodoroMode(e.target.dataset.mode));
        });
    }

    togglePomodoro() {
        const startBtn = document.getElementById('startBtn');

        if (this.pomodoroIsRunning) {
            this.pausePomodoro();
            startBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                </svg>
                <span>Resume</span>
            `;
        } else {
            this.startPomodoro();
            startBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                    <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                </svg>
                <span>Pause</span>
            `;
        }
    }

    startPomodoro() {
        this.pomodoroIsRunning = true;
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.classList.add('running');
            timerDisplay.classList.remove('paused');
        }

        this.pomodoroTimer = setInterval(() => {
            this.pomodoroTimeLeft--;
            this.updatePomodoroDisplay();

            if (this.pomodoroTimeLeft <= 0) {
                this.pomodoroComplete();
            }
        }, 1000);
    }

    pausePomodoro() {
        this.pomodoroIsRunning = false;
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.classList.remove('running');
            timerDisplay.classList.add('paused');
        }
        clearInterval(this.pomodoroTimer);
    }

    resetPomodoro() {
        this.pausePomodoro();
        this.pomodoroIsRunning = false;

        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.classList.remove('running', 'paused');
        }

        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            startBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
                </svg>
                <span>Start</span>
            `;
        }

        this.setTimeForMode(this.pomodoroMode);
        this.updatePomodoroDisplay();
    }

    pomodoroComplete() {
        this.pausePomodoro();

        // Update stats
        if (this.pomodoroMode === 'work') {
            this.pomodoroStats.sessionsToday++;
            this.pomodoroStats.totalFocusTime += this.pomodoroSettings.workDuration;
            this.pomodoroStats.currentStreak++;
            this.saveData('pomodoroStats', this.pomodoroStats);
            this.updatePomodoroStats();
        }

        // Notify
        alert(`${this.pomodoroMode === 'work' ? 'Work session' : 'Break'} complete!`);

        // Auto-switch
        if (this.pomodoroMode === 'work') {
            const breakMode = this.pomodoroStats.sessionsToday % 4 === 0 ? 'long' : 'short';
            this.switchPomodoroMode(breakMode);
        } else {
            this.switchPomodoroMode('work');
        }
    }

    switchPomodoroMode(mode) {
        this.pomodoroMode = mode;
        this.resetPomodoro();

        // Update active mode button
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });

        // Update timer display class
        const timerDisplay = document.querySelector('.timer-display');
        if (timerDisplay) {
            timerDisplay.classList.remove('running', 'paused', 'break');
            if (mode !== 'work') {
                timerDisplay.classList.add('break');
            }
        }

        // Update label
        const labels = {
            work: 'Focus Time',
            short: 'Short Break',
            long: 'Long Break'
        };
        const timerLabel = document.getElementById('timerLabel');
        if (timerLabel) {
            timerLabel.textContent = labels[mode];
        }
    }

    setTimeForMode(mode) {
        const durations = {
            work: this.pomodoroSettings.workDuration,
            short: this.pomodoroSettings.shortBreakDuration,
            long: this.pomodoroSettings.longBreakDuration
        };

        this.pomodoroTotalTime = durations[mode] * 60;
        this.pomodoroTimeLeft = this.pomodoroTotalTime;
    }

    updatePomodoroDisplay() {
        const minutes = Math.floor(this.pomodoroTimeLeft / 60);
        const seconds = this.pomodoroTimeLeft % 60;

        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = display;
        }

        // Update progress ring
        const progress = ((this.pomodoroTotalTime - this.pomodoroTimeLeft) / this.pomodoroTotalTime) * 880;
        const timerProgress = document.getElementById('timerProgress');
        if (timerProgress) {
            timerProgress.style.strokeDashoffset = progress;
        }

        // Update page title
        // Update page title
        document.title = "Bishr's Hub";
    }

    openPomodoroSettings() {
        document.getElementById('workDuration').value = this.pomodoroSettings.workDuration;
        document.getElementById('shortBreakDuration').value = this.pomodoroSettings.shortBreakDuration;
        document.getElementById('longBreakDuration').value = this.pomodoroSettings.longBreakDuration;
        this.openModal('pomodoroSettingsModal');
    }

    handlePomodoroSettingsSubmit(e) {
        e.preventDefault();

        this.pomodoroSettings.workDuration = parseInt(document.getElementById('workDuration').value);
        this.pomodoroSettings.shortBreakDuration = parseInt(document.getElementById('shortBreakDuration').value);
        this.pomodoroSettings.longBreakDuration = parseInt(document.getElementById('longBreakDuration').value);

        this.saveData('pomodoroSettings', this.pomodoroSettings);
        this.resetPomodoro();
        this.closeModal('pomodoroSettingsModal');
    }

    updatePomodoroStats() {
        const sessionsToday = document.getElementById('sessionsToday');
        const totalFocusTime = document.getElementById('totalFocusTime');
        const currentStreak = document.getElementById('currentStreak');

        if (sessionsToday) sessionsToday.textContent = this.pomodoroStats.sessionsToday;
        if (totalFocusTime) totalFocusTime.textContent = `${this.pomodoroStats.totalFocusTime}m`;
        if (currentStreak) currentStreak.textContent = this.pomodoroStats.currentStreak;
    }

    checkPomodoroStats() {
        const today = new Date().toDateString();
        if (this.pomodoroStats.lastSessionDate !== today) {
            this.pomodoroStats.sessionsToday = 0;
            this.pomodoroStats.totalFocusTime = 0;
            this.pomodoroStats.lastSessionDate = today;
            this.saveData('pomodoroStats', this.pomodoroStats);
        }
    }

    // ============================================
    // PLAYLIST TRACKER
    // ============================================

    getPlaylistPageHTML() {
        return `
            <header class="app-header">
                <div class="header-content">
                    <div class="brand-text">
                        <h1 class="brand-title">Playlist Tracker</h1>
                        <p class="brand-subtitle">Track your learning journey</p>
                    </div>
                    <div class="header-actions" style="display: flex; gap: var(--spacing-md); align-items: center;">
                        <div class="motivational-toggle-wrapper" style="display: flex; align-items: center; gap: var(--spacing-sm); background: var(--color-surface); padding: 0.5rem 1rem; border-radius: var(--radius-full); border: 1.5px solid var(--color-border); font-size: var(--font-size-sm); font-weight: 500; transition: opacity var(--transition-fast); ${this.motivationalSettings.enabled ? '' : 'opacity: 0.7;'}">
                            <span style="color: var(--color-text-secondary);">Streak:</span>
                            <span id="StreakCounter" style="font-weight: 700; color: var(--color-primary);">${this.motivationalSettings.enabled ? `${this.motivationalSettings.streakCount}/<input type="number" id="motivationalTargetInput" value="${this.motivationalSettings.targetCount || 5}" min="1" max="100" style="width: 32px; border: none; background: transparent; color: var(--color-primary); font-weight: 700; font-family: inherit; font-size: inherit; text-align: center; border-bottom: 1.5px dashed var(--color-primary); padding: 0; outline: none; margin: 0 2px;" onchange="app.changeMotivationalTarget(this.value)">` : 'Off'}</span>
                            <label class="switch">
                                <input type="checkbox" id="toggleMotivationalQuotes" ${this.motivationalSettings.enabled ? 'checked' : ''} onchange="app.toggleMotivationalQuotesSetting(this.checked)">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <button class="btn-primary" id="addPlaylistBtn">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                            <span>Add Playlist</span>
                        </button>
                    </div>
                </div>
            </header>

            <main class="app-main">
                <section class="playlists-section">
                    <div id="playlistsContainer"></div>
                    
                    <div id="playlistEmptyState" class="playlist-empty-state" style="display: none;">
                        <div class="empty-icon">
                            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                                <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" stroke-width="2" stroke-dasharray="8 8" opacity="0.2"/>
                                <path d="M35 30L50 40L35 50V30Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
                            </svg>
                        </div>
                        <h3 class="empty-title">No Playlists Yet</h3>
                        <p class="empty-description">Import a YouTube playlist to start tracking your progress.</p>
                        <button class="btn-secondary" onclick="app.openModal('playlistModal')">
                            Import Playlist
                        </button>
                    </div>
                </section>
            </main>
        `;
    }

    setupPlaylistEventListeners() {
        const addBtn = document.getElementById('addPlaylistBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                this.openModal('playlistModal');
            });
        }
    }

    async backfillMissingDurations() {
        const key = this.youtubeApiKey;
        let updated = false;

        for (const playlist of this.playlists) {
            // Find videos that are missing duration data
            const missing = playlist.videos.filter(v => !v.durationSeconds || v.durationSeconds === 0);
            if (missing.length === 0) continue;

            const missingIds = missing.map(v => v.id);
            const durationMap = {};

            for (let i = 0; i < missingIds.length; i += 50) {
                const batch = missingIds.slice(i, i + 50);
                try {
                    const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${key}`;
                    const durResp = await fetch(durUrl);
                    const durData = await durResp.json();

                    if (durData.items) {
                        durData.items.forEach(item => {
                            durationMap[item.id] = this.parseISO8601Duration(item.contentDetails.duration);
                        });
                    }
                } catch (err) {
                    console.warn('Failed to fetch durations for batch:', err);
                }
            }

            // Attach durations
            missing.forEach(v => {
                if (durationMap[v.id]) {
                    v.durationSeconds = durationMap[v.id];
                    updated = true;
                }
            });
        }

        if (updated) {
            this.saveData('playlists', this.playlists);
            this.renderPlaylists();
        }
    }

    async handlePlaylistSubmit(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('playlistSubmitBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Loading...</span>';
        submitBtn.disabled = true;

        const url = document.getElementById('playlistUrl').value.trim();

        try {
            const playlistId = this.extractPlaylistId(url);
            if (!playlistId) throw new Error('Invalid YouTube Playlist URL');

            // Check if already exists
            if (this.playlists.some(p => p.id === playlistId)) {
                throw new Error('Playlist already added');
            }

            const playlistData = await this.fetchYouTubePlaylist(playlistId);
            this.playlists.push(playlistData);
            this.saveData('playlists', this.playlists);
            this.renderPlaylists();
            this.closeModal('playlistModal');
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }

    extractPlaylistId(url) {
        const reg = /[?&]list=([^#\&\?]+)/;
        const match = url.match(reg);
        return match ? match[1] : null;
    }

    async fetchYouTubePlaylist(playlistId) {
        const key = this.youtubeApiKey;

        // 1. Get Playlist Details (Title, Thumb)
        const detailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${key}`;
        const detailsResp = await fetch(detailsUrl);
        const detailsData = await detailsResp.json();

        if (detailsData.error) {
            throw new Error(`YouTube API Error: ${detailsData.error.message}`);
        }

        if (!detailsData.items || detailsData.items.length === 0) {
            throw new Error('Playlist not found or private');
        }

        const details = detailsData.items[0].snippet;

        // 2. Get All Items using Pagination
        let videos = [];
        let nextPageToken = '';

        do {
            const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${key}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
            const itemsResp = await fetch(itemsUrl);
            const itemsData = await itemsResp.json();

            if (itemsData.error) {
                throw new Error(itemsData.error.message);
            }

            if (itemsData.items) {
                const pageVideos = itemsData.items.map(item => ({
                    id: item.snippet.resourceId.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails?.default?.url || '',
                    channelTitle: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle,
                    completed: false
                })).filter(v => v.title !== 'Private video' && v.title !== 'Deleted video');

                videos = [...videos, ...pageVideos];
            }

            nextPageToken = itemsData.nextPageToken || null;

        } while (nextPageToken);

        // 3. Fetch durations for all videos in batches of 50
        const videoIds = videos.map(v => v.id);
        const durationMap = {};

        for (let i = 0; i < videoIds.length; i += 50) {
            const batch = videoIds.slice(i, i + 50);
            const durUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(',')}&key=${key}`;
            const durResp = await fetch(durUrl);
            const durData = await durResp.json();

            if (durData.items) {
                durData.items.forEach(item => {
                    durationMap[item.id] = this.parseISO8601Duration(item.contentDetails.duration);
                });
            }
        }

        // Attach duration to each video
        videos.forEach(v => {
            v.durationSeconds = durationMap[v.id] || 0;
        });

        return {
            id: playlistId,
            title: details.title,
            thumbnail: details.thumbnails?.medium?.url || details.thumbnails?.default?.url,
            channel: details.channelTitle,
            videos: videos,
            expanded: false
        };
    }

    renderPlaylists() {
        const container = document.getElementById('playlistsContainer');
        const emptyState = document.getElementById('playlistEmptyState');

        if (!container) return;

        if (this.playlists.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        container.innerHTML = this.playlists.map(p => this.getPlaylistCardHTML(p)).join('');
    }

    getPlaylistCardHTML(playlist) {
        const total = playlist.videos.length;
        const completed = playlist.videos.filter(v => v.completed).length;
        const progress = total === 0 ? 0 : (completed / total) * 100;
        const expandedClass = playlist.expanded ? 'expanded' : '';

        // Calculate total and watched durations adjusted by speed
        const speed = playlist.speed || 1.0;
        const totalSeconds = playlist.videos.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
        const watchedSeconds = playlist.videos.filter(v => v.completed).reduce((sum, v) => sum + (v.durationSeconds || 0), 0);
        const adjustedTotalSeconds = Math.round(totalSeconds / speed);
        const adjustedWatchedSeconds = Math.round(watchedSeconds / speed);
        const leftSeconds = Math.max(0, totalSeconds - watchedSeconds);
        const adjustedLeftSeconds = Math.round(leftSeconds / speed);

        const totalTimeStr = this.formatDuration(adjustedTotalSeconds);
        const watchedTimeStr = this.formatDuration(adjustedWatchedSeconds);
        const leftTimeStr = this.formatDuration(adjustedLeftSeconds);

        // Group Progress Calculations
        playlist.groups = playlist.groups || [];
        const completedGroupsCount = playlist.groups.filter(g => {
            const startIdx = g.start - 1;
            const endIdx = g.end - 1;
            for (let i = startIdx; i <= endIdx; i++) {
                if (playlist.videos[i] && !playlist.videos[i].completed) {
                    return false;
                }
            }
            return true;
        }).length;
        const groupProgress = playlist.groups.length === 0 ? 0 : (completedGroupsCount / playlist.groups.length) * 100;

        // Group specific video statistics helper
        const getGroupProgressStats = (g) => {
            const startIdx = g.start - 1;
            const endIdx = g.end - 1;
            let groupTotal = 0;
            let groupCompleted = 0;
            for (let i = startIdx; i <= endIdx; i++) {
                if (playlist.videos[i]) {
                    groupTotal++;
                    if (playlist.videos[i].completed) {
                        groupCompleted++;
                    }
                }
            }
            return { completed: groupCompleted, total: groupTotal };
        };

        return `
            <div class="playlist-card ${expandedClass}" id="playlist-${playlist.id}">
                <div class="playlist-header" onclick="app.togglePlaylistExpand('${playlist.id}')">
                    <div class="playlist-info">
                        <img src="${playlist.thumbnail}" alt="" class="playlist-thumbnail">
                        <div class="playlist-details">
                            <div class="playlist-title-container" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                                <h3 class="playlist-title" style="margin-bottom: 0;">${this.escapeHtml(playlist.title)}</h3>
                                <div class="playlist-share-container" onclick="event.stopPropagation();" style="display: flex; align-items: center; gap: 6px; background: var(--color-bg); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid var(--color-border); max-width: fit-content; height: 22px;">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-text-tertiary); flex-shrink: 0;">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                    <span class="playlist-link-text" style="font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; font-family: monospace;">https://www.youtube.com/playlist?list=${playlist.id}</span>
                                    <button class="btn-copy" onclick="app.copyPlaylistLink(event, '${playlist.id}')" title="Copy Playlist Link" style="background: none; border: none; padding: 2px; cursor: pointer; color: var(--color-text-secondary); display: flex; align-items: center; transition: color var(--transition-fast); margin-left: 2px;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-secondary)'">
                                        <svg class="copy-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="playlist-meta">
                                ${completed} / ${total} watched • ${playlist.channel}
                            </div>
                            <div class="playlist-progress">
                                <div class="playlist-progress-bar-bg">
                                    <div class="playlist-progress-bar-fill" style="width: ${progress}%"></div>
                                </div>
                                <span class="playlist-progress-text">${Math.round(progress)}%</span>
                            </div>
                            ${playlist.groups.length > 0 ? `
                            <div class="playlist-progress group-progress" style="margin-top: 6px;">
                                <div class="playlist-progress-bar-bg" style="background: var(--color-border-light, rgba(0,0,0,0.05));">
                                    <div class="playlist-progress-bar-fill" style="width: ${groupProgress}%; background: var(--color-primary-light);"></div>
                                </div>
                                <span class="playlist-progress-text" style="font-weight: 700;">Groups: ${completedGroupsCount}/${playlist.groups.length} (${Math.round(groupProgress)}%)</span>
                            </div>
                            ` : ''}
                            <div class="playlist-time-info" onclick="event.stopPropagation();">
                                <span class="playlist-time-total" title="Original Total: ${this.formatDuration(totalSeconds)}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                                        <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>Total: ${totalTimeStr}${speed !== 1 ? ` (${speed}x)` : ''}
                                </span>
                                <span class="playlist-time-watched" title="Original Watched: ${this.formatDuration(watchedSeconds)}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align: -2px; margin-right: 4px;">
                                        <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.7088 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>Watched: ${watchedTimeStr}${speed !== 1 ? ` (${speed}x)` : ''}
                                </span>
                                <span class="playlist-time-left" title="Original Left: ${this.formatDuration(leftSeconds)}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;">
                                        <path d="M5 2h14"/>
                                        <path d="M5 22h14"/>
                                        <path d="M19 2c0 6.67-7 6.67-7 10s7 3.33 7 10"/>
                                        <path d="M5 2c0 6.67 7 6.67 7 10s-7 3.33-7 10"/>
                                    </svg>Left: ${leftTimeStr}${speed !== 1 ? ` (${speed}x)` : ''}
                                </span>
                                
                                <div class="playlist-speed-container">
                                    <button class="playlist-speed-btn" onclick="app.toggleSpeedDropdown(event, '${playlist.id}')" title="Choose Playback Speed">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <polygon points="10 8 16 12 10 16 10 8"/>
                                        </svg>
                                        <span>Speed: ${speed}x</span>
                                    </button>
                                    <div class="playlist-speed-dropdown" id="speed-dropdown-${playlist.id}">
                                        <div class="playlist-speed-title">Playback Speed</div>
                                        ${[1, 1.25, 1.5, 1.75, 2].map(s => {
            const isActive = Math.abs(s - speed) < 0.01;
            return `
                                                <button class="playlist-speed-option ${isActive ? 'active' : ''}" onclick="app.setPlaylistSpeed('${playlist.id}', ${s})">
                                                    ${s}x
                                                </button>
                                            `;
        }).join('')}
                                        <div class="playlist-speed-custom-container">
                                            <input type="text" class="playlist-speed-custom-input" placeholder="Custom (e.g. 2.5x)" value="${[1, 1.25, 1.5, 1.75, 2].some(s => Math.abs(s - speed) < 0.01) ? '' : speed + 'x'}" onkeydown="if(event.key === 'Enter') { app.setPlaylistSpeed('${playlist.id}', this.value); }">
                                            <button class="playlist-speed-custom-btn" onclick="app.setPlaylistSpeed('${playlist.id}', this.previousElementSibling.value)">Apply</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="playlist-actions" style="margin-left: 16px; display: flex; gap: 8px;">
                        <button class="icon-btn" onclick="event.stopPropagation(); app.downloadPlaylist('${playlist.id}')" title="Download Playlist">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 12.75V2.25M9 12.75L4.5 8.25M9 12.75L13.5 8.25M3.75 15.75H14.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="event.stopPropagation(); app.deletePlaylist('${playlist.id}')" title="Delete Playlist">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M3.75 4.5H14.25M7.5 8.25V12.75M10.5 8.25V12.75M13.5 4.5V14.25C13.5 14.6642 13.1642 15 12.75 15H5.25C4.83579 15 4.5 14.6642 4.5 14.25V4.5M6.75 4.5V3C6.75 2.58579 7.08579 2.25 7.5 2.25H10.5C10.9142 2.25 11.25 2.58579 11.25 3V4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <div class="playlist-expand-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div class="playlist-videos">
                    <div class="playlist-groups-section">
                        <div class="playlist-groups-header">
                            <span class="playlist-groups-title">Learning Groups</span>
                            <div class="playlist-groups-actions">
                                <button class="btn-secondary" style="padding: 4px 8px; font-size: var(--font-size-xs);" onclick="event.stopPropagation(); app.openGroupModal('${playlist.id}')">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>Add Group
                                </button>
                                ${playlist.groups.length > 0 ? `
                                <button class="btn-secondary" style="padding: 4px 8px; font-size: var(--font-size-xs); color: var(--color-danger, #EF4444); border-color: rgba(239, 68, 68, 0.2);" onclick="event.stopPropagation(); app.clearAllPlaylistGroups('${playlist.id}')">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>Clear All
                                </button>
                                ` : ''}
                            </div>
                        </div>

                        ${playlist.groups.length === 0 ? `
                        <div style="font-size: var(--font-size-xs); color: var(--color-text-tertiary); font-style: italic;">
                            No custom video groups defined. Click "Add Group" to specify learning sections or batch ranges.
                        </div>
                        ` : `
                        <div class="playlist-group-grid">
                            ${playlist.groups.map(g => {
                                const stats = getGroupProgressStats(g);
                                const gProgress = stats.total === 0 ? 0 : (stats.completed / stats.total) * 100;
                                const isCompleted = stats.completed === stats.total;
                                return `
                                    <div class="playlist-group-card group-${g.color || 'default'}">
                                        <div class="playlist-group-name" title="${this.escapeHtml(g.name)}">${this.escapeHtml(g.name)}</div>
                                        <div class="playlist-group-range">Videos ${g.start} - ${g.end}</div>
                                        <div class="playlist-group-progress">
                                            <div class="playlist-group-progress-bar">
                                                <div class="playlist-group-progress-fill" style="width: ${gProgress}%;"></div>
                                            </div>
                                            <span class="playlist-group-progress-text">${isCompleted ? 'Completed' : `${stats.completed}/${stats.total}`}</span>
                                        </div>
                                        <div class="playlist-group-card-actions" onclick="event.stopPropagation();">
                                            <button class="icon-btn" onclick="app.openGroupModal('${playlist.id}', '${g.id}')" title="Edit Group">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                                                </svg>
                                            </button>
                                            <button class="icon-btn delete" onclick="app.deletePlaylistGroup('${playlist.id}', '${g.id}')" title="Delete Group">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        `}
                    </div>

                    <div class="video-list">
                        ${playlist.videos.map((video, idx) => `
                            <div class="video-item ${video.completed ? 'completed' : ''}">
                                <div class="video-number">${idx + 1}.</div>
                                <div class="video-checkbox" onclick="app.toggleVideo('${playlist.id}', '${video.id}')">
                                    ${video.completed ? `
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                            <path d="M3 8L6 11L13 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    ` : ''}
                                </div>
                                <img src="${video.thumbnail}" class="video-thumbnail" loading="lazy">
                                <div class="video-info">
                                    <div class="video-title" title="${this.escapeHtml(video.title)}">
                                        <a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="video-link">${this.escapeHtml(video.title)}</a>
                                    </div>
                                    <div class="video-channel">${this.escapeHtml(video.channelTitle)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    togglePlaylistExpand(id) {
        const playlist = this.playlists.find(p => p.id === id);
        if (playlist) {
            playlist.expanded = !playlist.expanded;
            this.renderPlaylists(); // Re-render to update state
        }
    }

    toggleSpeedDropdown(event, playlistId) {
        event.stopPropagation();

        // Close other dropdowns first
        document.querySelectorAll('.playlist-speed-dropdown').forEach(dropdown => {
            if (dropdown.id !== `speed-dropdown-${playlistId}`) {
                dropdown.classList.remove('show');
            }
        });

        const dropdown = document.getElementById(`speed-dropdown-${playlistId}`);
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                const input = dropdown.querySelector('.playlist-speed-custom-input');
                if (input) input.focus();
            }
        }
    }

    setPlaylistSpeed(playlistId, speedString) {
        if (typeof speedString === 'string') {
            speedString = speedString.replace(/[xX]/g, '').trim();
        }
        const speed = parseFloat(speedString);
        if (isNaN(speed) || speed <= 0) {
            alert('Please enter a valid speed greater than 0');
            return;
        }

        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            playlist.speed = Math.round(speed * 100) / 100;
            this.saveData('playlists', this.playlists);
            this.renderPlaylists();
        }
    }

    toggleVideo(playlistId, videoId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            const video = playlist.videos.find(v => v.id === videoId);
            if (video) {
                video.completed = !video.completed;

                // Track completion count for motivational popups if enabled
                if (this.motivationalSettings.enabled) {
                    const target = this.motivationalSettings.targetCount || 5;
                    if (video.completed) {
                        this.motivationalSettings.streakCount = (this.motivationalSettings.streakCount || 0) + 1;
                        if (this.motivationalSettings.streakCount >= target) {
                            const message = this.getRandomMotivationalMessage();
                            this.showMotivationalPopup(message);
                        }
                    } else {
                        if (this.motivationalSettings.streakCount > 0) {
                            this.motivationalSettings.streakCount--;
                        }
                    }
                    this.saveData('motivationalSettings', this.motivationalSettings);
                    this.updateMotivationalCounterUI();
                }

                this.saveData('playlists', this.playlists);
                this.renderPlaylists();
            }
        }
    }

    getRandomMotivationalMessage() {
        const target = this.motivationalSettings.targetCount || 5;
        const messages = [
            `Unstoppable! You completed ${target} videos in a row. Keep riding this wave of momentum!`,
            `Consistency is the key to mastery. Outstanding work on checking off these ${target} videos!`,
            `Boom! ${target} in a row! You're turning learning into a habit. Keep crushing it!`,
            `Awesome streak! ${target} contiguous videos completed. Your future self is thanking you right now!`,
            `You are on fire! That's ${target} videos straight. What's stopping you from doing ${target} more?`,
            `Success is the sum of small efforts repeated day in and day out. Amazing job on this ${target}-video streak!`,
            `Completed your target of ${target} videos, and you're just getting started! Keep feeding your brain.`,
            `A streak of ${target}! Your dedication to growth is inspiring. Let's keep this momentum going!`,
            `Progress, not perfection, but this ${target}-video streak is pretty close to perfect! Keep it up!`,
            `Fantastic focus! Completing ${target} videos in a row takes real dedication. You've got this!`,
            `You're building momentum with every checkmark. ${target} consecutive videos completed—outstanding!`,
            `Every video you watch is an investment in yourself. Excellent job completing ${target} in a row!`,
            `Streak alert! ${target} videos in a row checked off. Keep showing up for yourself.`,
            `Small wins lead to massive victories. Celebrating your ${target}-video learning streak today!`,
            `Look at you go! ${target} continuous videos completed. Keep pushing the boundaries of your knowledge!`,
            `Mastery is a journey, and you just took ${target} giant steps forward. Proud of your progress!`,
            `The secret of getting ahead is getting started, and you are well on your way with this ${target}-video streak!`,
            `${target} in a row! Discipline beats motivation, but today you have both. Keep going!`,
            `You're leveling up! ${target} consecutive videos completed. Keep learning, keep growing!`,
            `Amazing determination! Completing ${target} videos continuously proves you have what it takes. Keep it up!`
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    toggleMotivationalQuotesSetting(enabled) {
        this.motivationalSettings.enabled = enabled;
        this.saveData('motivationalSettings', this.motivationalSettings);
        this.updateMotivationalCounterUI();
    }

    changeMotivationalTarget(val) {
        const target = parseInt(val, 10);
        if (isNaN(target) || target <= 0) {
            this.updateMotivationalCounterUI();
            return;
        }
        this.motivationalSettings.targetCount = target;
        this.saveData('motivationalSettings', this.motivationalSettings);

        if (this.motivationalSettings.streakCount >= this.motivationalSettings.targetCount) {
            const message = this.getRandomMotivationalMessage();
            this.showMotivationalPopup(message);
        } else {
            this.updateMotivationalCounterUI();
        }
    }

    updateMotivationalCounterUI() {
        const counterEl = document.getElementById('StreakCounter');
        const wrapperEl = document.querySelector('.motivational-toggle-wrapper');
        if (counterEl) {
            if (this.motivationalSettings.enabled) {
                const target = this.motivationalSettings.targetCount || 5;
                counterEl.innerHTML = `${this.motivationalSettings.streakCount}/<input type="number" id="motivationalTargetInput" value="${target}" min="1" max="100" style="width: 32px; border: none; background: transparent; color: var(--color-primary); font-weight: 700; font-family: inherit; font-size: inherit; text-align: center; border-bottom: 1.5px dashed var(--color-primary); padding: 0; outline: none; margin: 0 2px;" onchange="app.changeMotivationalTarget(this.value)">`;
                if (wrapperEl) wrapperEl.style.opacity = '1';
            } else {
                counterEl.textContent = 'Off';
                if (wrapperEl) wrapperEl.style.opacity = '0.7';
            }
        }
    }

    closeMotivationalPopup() {
        const existing = document.getElementById('motivationalPopup');
        if (existing) existing.remove();

        // Reset streak back to 0 when closed
        this.motivationalSettings.streakCount = 0;
        this.saveData('motivationalSettings', this.motivationalSettings);
        this.updateMotivationalCounterUI();
    }

    copyPlaylistLink(event, playlistId) {
        if (event) event.stopPropagation();
        const btn = event ? event.currentTarget : null;
        const url = `https://www.youtube.com/playlist?list=${playlistId}`;
        navigator.clipboard.writeText(url).then(() => {
            if (!btn) return;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-green, #10B981)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            `;
            btn.title = "Copied!";
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.title = "Copy Playlist Link";
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    }

    showMotivationalPopup(message) {
        // Remove existing if any
        const existing = document.getElementById('motivationalPopup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.id = 'motivationalPopup';
        popup.className = 'modal active';
        popup.innerHTML = `
            <div class="modal-backdrop" onclick="app.closeMotivationalPopup()"></div>
            <div class="modal-container">
                <div class="modal-content motivational-content" style="text-align: center; padding: var(--spacing-xl); max-width: 450px; margin: 0 auto; position: relative; z-index: 1001; animation: modalPop 0.4s var(--transition-spring);">
                    <div class="motivational-icon" style="font-size: 3.5rem; margin-bottom: var(--spacing-sm);">
                        🎉
                    </div>
                    <h2 class="modal-title" style="margin-bottom: var(--spacing-sm); font-family: var(--font-display); color: var(--color-primary); font-size: var(--font-size-2xl);">Streak Completed!</h2>
                    <p style="font-size: var(--font-size-base); color: var(--color-text-primary); margin-bottom: var(--spacing-lg); line-height: 1.6; font-weight: 500;">
                        ${message}
                    </p>
                    <button class="btn-primary" style="margin: 0 auto; display: block;" onclick="app.closeMotivationalPopup()">
                        Keep Going!
                    </button>
                </div>
            </div>
            <style>
                @keyframes modalPop {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(popup);
    }

    deletePlaylist(id) {
        if (confirm('Are you sure you want to delete this playlist?')) {
            this.playlists = this.playlists.filter(p => p.id !== id);
            this.saveData('playlists', this.playlists);
            this.renderPlaylists();
        }
    }

    downloadPlaylist(id) {
        const playlist = this.playlists.find(p => p.id === id);
        if (!playlist) return;

        // Create safe filename
        const safeTitle = playlist.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `download_${safeTitle}.bat`;

        // Sanitize title for batch script output
        const cleanTitle = playlist.title.replace(/[&|<>^%"]/g, '');

        // Construct batch script content
        // Using GOTO flow style to avoid crasing inside IF code blocks
        const scriptContent = `@echo off
set "playlist_url=https://www.youtube.com/playlist?list=${playlist.id}"

echo ==========================================
echo Downloading Playlist: ${cleanTitle}
echo ==========================================
echo.
echo This script will auto-configure everything needed.
echo.

:: ------------------------------------------------
:: 1. CHECK FOR YT-DLP
:: ------------------------------------------------
:CHECK_YTDLP
if exist "yt-dlp.exe" goto UPDATE_YTDLP
echo [1/3] Downloading yt-dlp...
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe -o yt-dlp.exe
if %errorlevel% neq 0 goto ERROR_YTDLP
goto CHECK_FFMPEG

:UPDATE_YTDLP
echo [1/3] Checking for yt-dlp updates...
yt-dlp.exe -U
goto CHECK_FFMPEG

:: ------------------------------------------------
:: 2. CHECK FOR FFMPEG
:: ------------------------------------------------
:CHECK_FFMPEG
if exist "ffmpeg.exe" goto START_DOWNLOAD
echo.
echo [2/3] FFmpeg not found. Downloading... 
echo This fixes "HTTP 403" errors. Please wait...

curl -L -o ffmpeg.zip "https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
if %errorlevel% neq 0 goto ERROR_FFMPEG

echo Extracting FFmpeg...
powershell -Command "Expand-Archive -Path ffmpeg.zip -DestinationPath . -Force"

echo Setting up FFmpeg...
for /d %%I in (ffmpeg-master-*) do (
    if exist "%%I\\bin\\ffmpeg.exe" (
        move "%%I\\bin\\ffmpeg.exe" . >nul
        move "%%I\\bin\\ffprobe.exe" . >nul
    )
)

:: Cleanup
if exist "ffmpeg.zip" del "ffmpeg.zip"
for /d %%I in (ffmpeg-master-*) do rd /s /q "%%I"

if not exist "ffmpeg.exe" goto ERROR_FFMPEG_INSTALL
goto START_DOWNLOAD

:: ------------------------------------------------
:: 3. START DOWNLOAD
:: ------------------------------------------------
:START_DOWNLOAD
echo.
echo [3/3] Starting download...
echo.

if not exist "yt-dlp.exe" goto ERROR_YTDLP

yt-dlp.exe -i --ffmpeg-location . -o "%%(playlist_index)s - %%(title)s.%%(ext)s" "%playlist_url%"

echo.
echo ==========================================
echo Download Complete!
echo ==========================================
goto END

:: ------------------------------------------------
:: ERROR HANDLERS
:: ------------------------------------------------
:ERROR_YTDLP
echo.
echo ERROR: Could not download or find yt-dlp.exe.
echo Please check your internet connection.
goto END

:ERROR_FFMPEG
echo.
echo ERROR: Could not download FFmpeg.
goto END

:ERROR_FFMPEG_INSTALL
echo.
echo WARNING: FFmpeg extraction failed. Downloads might still fail.
goto START_DOWNLOAD

:END
pause
`;

        // Trigger download of the batch file
        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('Script updated to "Safety Mode"!\\n\\nI have completely rewritten the script structure to prevent it from closing instantly.\\n\\n1. Delete the old .bat files.\\n2. Run this new one.');
    }

    // ============================================
    // MODAL MANAGEMENT
    // ============================================

    openModal(modalId, shouldReset = true) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';

            if (!shouldReset) return;

            // Reset forms
            if (modalId === 'habitModal') {
                document.getElementById('habitModalTitle').textContent = 'Create New Habit';
                document.getElementById('habitSubmitBtnText').textContent = 'Create Habit';
                document.getElementById('habitForm').reset();
                document.getElementById('habitId').value = '';
                document.getElementById('habitDays').value = 21;
            } else if (modalId === 'taskModal') {
                document.getElementById('taskModalTitle').textContent = 'Create New Task';
                document.getElementById('taskSubmitBtnText').textContent = 'Create Task';
                document.getElementById('taskForm').reset();
                document.getElementById('taskId').value = '';
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('taskDueDate').value = today;
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    switchGroupTab(tab) {
        const tabSingle = document.getElementById('groupTabSingle');
        const tabQuick = document.getElementById('groupTabQuick');
        const contentSingle = document.getElementById('groupTabContentSingle');
        const contentQuick = document.getElementById('groupTabContentQuick');

        if (tab === 'single') {
            if (tabSingle) tabSingle.classList.add('active');
            if (tabQuick) tabQuick.classList.remove('active');
            if (contentSingle) contentSingle.style.display = 'block';
            if (contentQuick) contentQuick.style.display = 'none';
            
            const nameEl = document.getElementById('groupName');
            const startEl = document.getElementById('groupStart');
            const endEl = document.getElementById('groupEnd');
            if (nameEl) nameEl.required = true;
            if (startEl) startEl.required = true;
            if (endEl) endEl.required = true;
        } else {
            if (tabSingle) tabSingle.classList.remove('active');
            if (tabQuick) tabQuick.classList.add('active');
            if (contentSingle) contentSingle.style.display = 'none';
            if (contentQuick) contentQuick.style.display = 'block';
            
            const nameEl = document.getElementById('groupName');
            const startEl = document.getElementById('groupStart');
            const endEl = document.getElementById('groupEnd');
            if (nameEl) nameEl.required = false;
            if (startEl) startEl.required = false;
            if (endEl) endEl.required = false;
        }
    }

    openGroupModal(playlistId, groupId = '') {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        const maxVideos = playlist.videos.length;
        const gPlaylistIdEl = document.getElementById('groupPlaylistId');
        const gIdEl = document.getElementById('groupId');
        if (gPlaylistIdEl) gPlaylistIdEl.value = playlistId;
        if (gIdEl) gIdEl.value = groupId;

        const startInput = document.getElementById('groupStart');
        const endInput = document.getElementById('groupEnd');
        if (startInput) startInput.max = maxVideos;
        if (endInput) endInput.max = maxVideos;

        const titleEl = document.getElementById('playlistGroupModalTitle');
        const btnTextEl = document.getElementById('groupSubmitBtnText');
        const tabsEl = document.querySelector('#playlistGroupModal .modal-tabs');

        if (groupId) {
            const group = playlist.groups.find(g => g.id === groupId);
            if (!group) return;

            if (titleEl) titleEl.textContent = 'Edit Group';
            if (btnTextEl) btnTextEl.textContent = 'Save Changes';
            
            const nameEl = document.getElementById('groupName');
            if (nameEl) nameEl.value = group.name;
            if (startInput) startInput.value = group.start;
            if (endInput) endInput.value = group.end;

            const colorRadios = document.getElementsByName('groupColor');
            colorRadios.forEach(radio => {
                radio.checked = (radio.value === (group.color || 'default'));
            });

            if (tabsEl) tabsEl.style.display = 'none';
            this.switchGroupTab('single');
        } else {
            if (titleEl) titleEl.textContent = 'Create Group';
            if (btnTextEl) btnTextEl.textContent = 'Create Group';
            
            const formEl = document.getElementById('playlistGroupForm');
            if (formEl) formEl.reset();
            
            if (startInput) startInput.value = 1;
            if (endInput) endInput.value = maxVideos;

            if (tabsEl) tabsEl.style.display = 'flex';
            this.switchGroupTab('single');
        }

        this.openModal('playlistGroupModal', false); // Do not reset custom values inside openModal
    }

    parseRangeSpecification(inputString) {
        const regex = /(\d+)[\s:-]+(\d+)/g;
        const ranges = [];
        let match;
        while ((match = regex.exec(inputString)) !== null) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            if (start > 0 && end >= start) {
                ranges.push({ start, end });
            }
        }
        return ranges;
    }

    handleGroupSubmit(e) {
        e.preventDefault();
        const playlistId = document.getElementById('groupPlaylistId').value;
        const groupId = document.getElementById('groupId').value;
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;

        playlist.groups = playlist.groups || [];

        const quickTab = document.getElementById('groupTabQuick');
        const isQuickTab = quickTab && quickTab.classList.contains('active');

        if (isQuickTab) {
            const rangesInput = document.getElementById('groupRangesInput').value.trim();
            const ranges = this.parseRangeSpecification(rangesInput);
            if (ranges.length === 0) {
                alert('No valid ranges found. Please specify ranges like 1-10, 11-20.');
                return;
            }

            const maxVideos = playlist.videos.length;
            const parsedRanges = ranges.map(r => ({
                start: Math.min(maxVideos, Math.max(1, r.start)),
                end: Math.min(maxVideos, Math.max(1, r.end))
            }));

            // Check quick range internal overlaps
            for (let i = 0; i < parsedRanges.length; i++) {
                const r1 = parsedRanges[i];
                if (r1.start > r1.end) {
                    alert('Invalid range: Start video number cannot be greater than End video number.');
                    return;
                }
                for (let j = i + 1; j < parsedRanges.length; j++) {
                    const r2 = parsedRanges[j];
                    if (r1.start <= r2.end && r1.end >= r2.start) {
                        alert(`Conflict: Specified quick split ranges overlap with each other: (Videos ${r1.start}-${r1.end}) and (Videos ${r2.start}-${r2.end}).`);
                        return;
                    }
                }
            }

            // Check overlaps with pre-existing groups
            for (const r of parsedRanges) {
                const overlappingGroup = playlist.groups.find(g => {
                    return (r.start <= g.end && r.end >= g.start);
                });
                if (overlappingGroup) {
                    alert(`Conflict: The range (Videos ${r.start} - ${r.end}) overlaps with an existing group: "${overlappingGroup.name}" (Videos ${overlappingGroup.start} - ${overlappingGroup.end}). Each video can only belong to one group.`);
                    return;
                }
            }

            // Add all valid ranges
            parsedRanges.forEach((r, idx) => {
                const colors = ['rose', 'amber', 'emerald', 'sky', 'violet', 'slate'];
                const color = colors[idx % colors.length];

                playlist.groups.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: `Group ${playlist.groups.length + 1} (${r.start}-${r.end})`,
                    start: r.start,
                    end: r.end,
                    color: color
                });
            });
        } else {
            const name = document.getElementById('groupName').value.trim();
            const start = parseInt(document.getElementById('groupStart').value, 10);
            const end = parseInt(document.getElementById('groupEnd').value, 10);
            
            const colorRadios = document.getElementsByName('groupColor');
            let color = 'default';
            for (const radio of colorRadios) {
                if (radio.checked) {
                    color = radio.value;
                    break;
                }
            }

            const maxVideos = playlist.videos.length;
            const clampedStart = Math.min(maxVideos, Math.max(1, start));
            const clampedEnd = Math.min(maxVideos, Math.max(1, end));

            if (clampedStart > clampedEnd) {
                alert('Start video cannot be greater than end video.');
                return;
            }

            // Check overlaps with other groups
            const overlappingGroup = playlist.groups.find(g => {
                if (groupId && g.id === groupId) return false;
                return (clampedStart <= g.end && clampedEnd >= g.start);
            });

            if (overlappingGroup) {
                alert(`Conflict: The range (Videos ${clampedStart} - ${clampedEnd}) overlaps with an existing group: "${overlappingGroup.name}" (Videos ${overlappingGroup.start} - ${overlappingGroup.end}). Each video can only belong to one group.`);
                return;
            }

            if (groupId) {
                const group = playlist.groups.find(g => g.id === groupId);
                if (group) {
                    group.name = name;
                    group.start = clampedStart;
                    group.end = clampedEnd;
                    group.color = color;
                }
            } else {
                playlist.groups.push({
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: name,
                    start: clampedStart,
                    end: clampedEnd,
                    color: color
                });
            }
        }

        this.saveData('playlists', this.playlists);
        this.renderPlaylists();
        this.closeModal('playlistGroupModal');
    }

    deletePlaylistGroup(playlistId, groupId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (playlist) {
            playlist.groups = (playlist.groups || []).filter(g => g.id !== groupId);
            this.saveData('playlists', this.playlists);
            this.renderPlaylists();
        }
    }

    clearAllPlaylistGroups(playlistId) {
        if (confirm('Are you sure you want to delete all groups for this playlist? This action cannot be undone.')) {
            const playlist = this.playlists.find(p => p.id === playlistId);
            if (playlist) {
                playlist.groups = [];
                this.saveData('playlists', this.playlists);
                this.renderPlaylists();
            }
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadData(key) {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parse ISO 8601 duration (e.g. PT1H23M45S) into total seconds
    parseISO8601Duration(iso) {
        const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        const hours = parseInt(match[1] || 0);
        const minutes = parseInt(match[2] || 0);
        const seconds = parseInt(match[3] || 0);
        return hours * 3600 + minutes * 60 + seconds;
    }

    // Format seconds into a human-readable string (e.g. "3h 24m" or "45m 12s")
    formatDuration(totalSeconds) {
        if (totalSeconds === 0) return '0m';
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }
}

// Initialize the app and make it globally accessible
window.app = new ProductivityHub();
