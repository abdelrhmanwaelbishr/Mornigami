// ============================================
// PRODUCTIVITY HUB - UNIFIED APPLICATION
// ============================================

class ProductivityHub {
    constructor() {
        this.currentPage = 'home';
        this.userBadges = [];

        // Daily Bounties
        this.bountyInterval = null;
        this.dailyBounties = [];
        this.bountyStats = {
            pomodorosCompletedToday: 0,
            habitsCompletedToday: 0,
            tasksCompletedToday: 0,
            dateStr: ''
        };

        // Focus Ambience Audio
        this.focusAudio = new Audio();
        this.focusAudio.loop = true;
        this.focusAudioTrack = 'lofi';
        this.focusAudioPlaying = false;
        this.audioTracks = {
            lofi: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            rain: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg",
            cafe: "https://actions.google.com/sounds/v1/ambiences/coffee_shop_atmosphere.ogg"
        };

        // Customizer Store
        this.spentXP = parseInt(localStorage.getItem('spentXP')) || 0;
        this.unlockedItems = this.loadData('unlockedItems') || { colors: [], avatars: [], borders: [] };
        this.activeAvatar = localStorage.getItem('activeAvatar') || '';
        this.activeBorder = localStorage.getItem('activeBorder') || '';
        this.currentStoreTab = 'colors';
        this.storeItems = {
            colors: [
                { id: 'color_sakura', name: 'Sakura Pink', value: '#FDA4AF', cost: 300, desc: 'Unlocks a pastel cherry blossom accent color.' },
                { id: 'color_mint', name: 'Mint Sage', value: '#A7F3D0', cost: 300, desc: 'Unlocks a fresh minty green accent color.' },
                { id: 'color_butter', name: 'Butter Cream', value: '#FDE68A', cost: 300, desc: 'Unlocks a warm, creamy morning yellow accent color.' },
                { id: 'color_lavender', name: 'Lavender Mist', value: '#DDD6FE', cost: 300, desc: 'Unlocks a soothing lavender accent color.' }
            ],
            avatars: [
                { id: 'avatar_fox', name: 'Origami Fox', value: '🦊', cost: 500, desc: 'Set foxy origami as your profile avatar.' },
                { id: 'avatar_crane', name: 'Origami Crane', value: '🕊️', cost: 500, desc: 'Set graceful crane as your profile avatar.' },
                { id: 'avatar_frog', name: 'Origami Frog', value: '🐸', cost: 500, desc: 'Set jumping frog as your profile avatar.' },
                { id: 'avatar_dragon', name: 'Origami Dragon', value: '🐉', cost: 1000, desc: 'Set legendary dragon as your profile avatar.' }
            ],
            borders: [
                { id: 'border_spark', name: 'Sparkling Border', value: 'spark-border', cost: 400, desc: 'A subtle gold sparkling animation border for your badge.' },
                { id: 'border_fire', name: 'Fire Border', value: 'fire-border', cost: 400, desc: 'A hot fire flame animation border for your badge.' },
                { id: 'border_rainbow', name: 'Rainbow Border', value: 'rainbow-border', cost: 800, desc: 'A premium cycling rainbow gradient border for your badge.' }
            ]
        };

        // Friends list
        this.friendsList = [];

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

        // Initialize Level and XP System
        this.userLevel = parseInt(localStorage.getItem('userLevel')) || 1;
        this.userXP = parseInt(localStorage.getItem('userXP')) || 0;

        // Initialize XP Scaling parameters
        this.xpConfig = {
            habit: 50,
            task: 30,
            pomodoro: 150,
            video: 40,
            groupBonus: 200,
            levelBase: 500,
            financeBonus: 50
        };

        // Initialize Role-Based Access Control
        this.userRole = null;
        this.activeAdminTab = 'analytics';

        // Load Finance Data
        this.financeData = this.loadData('financeData') || {
            monthYear: '',
            monthlyIncome: 0,
            dailyBudget: 0,
            expenses: [],
            xpBonusClaimedDates: {},
            categories: ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗']
        };
        if (!this.financeData.categories || this.financeData.categories.length === 0) {
            this.financeData.categories = ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗'];
        }

        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.setupOverlayAuthEventListeners();
        this.checkAndResetDailyBounties();
        this.bountyInterval = setInterval(() => this.updateBountyCountdown(), 1000);
        this.updateBountyCountdown();
        this.renderPage(this.currentPage);
        this.checkPomodoroStats();
        this.updateXPUI();

        // Handle pre-initialized auth state if any
        if (window.currentUser !== undefined) {
            this.onUserStatusChanged(window.currentUser);
        }
    }

    // ============================================
    // GAMIFICATION AND XP SYSTEM
    // ============================================

    gainXP(amount, reason) {
        this.userXP += amount;
        let leveledUp = false;

        while (this.userXP >= this.getXPNeededForLevel(this.userLevel)) {
            this.userXP -= this.getXPNeededForLevel(this.userLevel);
            this.userLevel++;
            leveledUp = true;
        }

        // Save locally
        localStorage.setItem('userLevel', this.userLevel);
        localStorage.setItem('userXP', this.userXP);

        // Save to Firestore if authenticated
        if (this.currentUser && window.db && window.firestoreUtils) {
            const { doc, setDoc } = window.firestoreUtils;
            setDoc(doc(window.db, "users", this.currentUser.uid), {
                userLevel: this.userLevel,
                userXP: this.userXP
            }, { merge: true }).catch(err => console.error("Error saving XP to firestore:", err));
        }

        this.updateXPUI();
        this.showXPFloatingText(amount, reason);

        if (leveledUp) {
            this.showLevelUpCelebration();
        }
    }

    getXPNeededForLevel(level) {
        return level * (this.xpConfig ? this.xpConfig.levelBase : 500);
    }

    updateXPUI() {
        const levelBadge = document.getElementById('globalLevelBadge');
        const xpText = document.getElementById('globalXPText');
        const xpBarFill = document.getElementById('globalXPBarFill');

        const needed = this.getXPNeededForLevel(this.userLevel);
        const percent = Math.min(100, Math.max(0, (this.userXP / needed) * 100));

        if (levelBadge) levelBadge.textContent = `L${this.userLevel}`;
        if (xpText) xpText.textContent = `${this.userXP} / ${needed} XP`;
        if (xpBarFill) xpBarFill.style.width = `${percent}%`;
    }

    updateBadgeUI() {
        const iconEl = document.getElementById('globalBadgeIcon');
        const tooltipEl = document.getElementById('globalBadgeTooltip');
        if (!iconEl || !tooltipEl) return;

        const badge = (this.userBadges && this.userBadges.length > 0)
            ? this.userBadges[0]
            : "🌱 Mornigami Novice";

        // Extract emoji if present at start of badge string
        const match = badge.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Emoji_Presentation}|\p{Emoji}\s*)?\s*(.*)$/u);
        let emoji = "🌱";
        if (match && match[1]) {
            emoji = match[1].trim();
        }

        iconEl.textContent = emoji;
        tooltipEl.textContent = badge;

        // Apply active custom border if any
        iconEl.className = 'global-badge-icon'; // Reset
        if (this.activeBorder) {
            iconEl.classList.add(this.activeBorder);
        }
    }

    showXPFloatingText(amount, reason) {
        const badge = document.getElementById('globalLevelBadge');
        if (!badge) return;

        const rect = badge.getBoundingClientRect();
        const floatingText = document.createElement('div');
        floatingText.className = 'xp-floating-text';
        floatingText.style.left = `${rect.left + rect.width / 2}px`;
        floatingText.style.top = `${rect.top}px`;
        floatingText.style.transform = 'translate(-50%, -100%)';
        floatingText.style.color = 'var(--color-primary)';
        floatingText.style.fontWeight = '800';
        floatingText.style.fontSize = 'var(--font-size-lg)';
        floatingText.innerHTML = `+${amount} XP <span style="font-size: var(--font-size-xs); font-weight: 500; color: var(--color-text-secondary); display: block; text-align: center;">${reason}</span>`;

        document.body.appendChild(floatingText);

        setTimeout(() => {
            floatingText.remove();
        }, 1200);
    }

    showLevelUpCelebration() {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        overlay.style.backdropFilter = 'blur(4px)';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '10000';
        overlay.style.animation = 'fadeIn var(--transition-fast) ease-out forwards';

        const card = document.createElement('div');
        card.style.background = 'var(--color-surface)';
        card.style.padding = 'var(--spacing-2xl)';
        card.style.borderRadius = 'var(--radius-2xl)';
        card.style.border = '2px solid var(--color-primary)';
        card.style.boxShadow = 'var(--shadow-2xl)';
        card.style.textAlign = 'center';
        card.style.maxWidth = '400px';
        card.style.width = '90%';
        card.style.animation = 'authOverlayPop var(--transition-slow) cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

        card.innerHTML = `
            <div style="font-size: 64px; margin-bottom: var(--spacing-md); line-height: 1;">🎉</div>
            <h2 style="font-family: var(--font-display); font-size: var(--font-size-3xl); font-weight: 800; color: var(--color-primary); margin-bottom: var(--spacing-xs);">Level Up!</h2>
            <p style="font-family: var(--font-body); color: var(--color-text-secondary); margin-bottom: var(--spacing-xl);">Congratulations! You have reached <strong>Level ${this.userLevel}</strong>.</p>
            <button class="btn-primary" style="width: 100%;" onclick="this.parentElement.parentElement.remove()">Awesome!</button>
        `;

        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Confetti Burst animation
        const colors = ['#0EA5A0', '#38BDF8', '#F59E0B', '#8A2BE2', '#EF4444', '#10B981'];
        for (let i = 0; i < 80; i++) {
            const p = document.createElement('div');
            p.style.position = 'fixed';
            p.style.left = '50vw';
            p.style.top = '50vh';
            p.style.width = `${Math.random() * 8 + 6}px`;
            p.style.height = `${Math.random() * 12 + 6}px`;
            p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            p.style.zIndex = '10001';
            p.style.borderRadius = '2px';

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 15 + 10;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity - 4;

            p.dataset.dx = dx;
            p.dataset.dy = dy;
            p.dataset.x = window.innerWidth / 2;
            p.dataset.y = window.innerHeight / 2;
            p.dataset.rotation = Math.random() * 360;
            p.dataset.spin = Math.random() * 10 - 5;

            document.body.appendChild(p);

            let gravity = 0.4;
            let opacity = 1;
            const animate = () => {
                let x = parseFloat(p.dataset.x) + parseFloat(p.dataset.dx);
                let y = parseFloat(p.dataset.y) + parseFloat(p.dataset.dy);
                let currentDy = parseFloat(p.dataset.dy) + gravity;
                let rotation = parseFloat(p.dataset.rotation) + parseFloat(p.dataset.spin);

                p.dataset.x = x;
                p.dataset.y = y;
                p.dataset.dy = currentDy;
                p.dataset.rotation = rotation;

                p.style.left = `${x}px`;
                p.style.top = `${y}px`;
                p.style.transform = `rotate(${rotation}deg)`;

                opacity -= 0.015;
                p.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    p.remove();
                }
            };
            requestAnimationFrame(animate);
        }
    }

    // ============================================
    // THEME & NAVIGATION
    // ============================================

    applyTheme() {
        const theme = localStorage.getItem('theme') || 'light';
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        }

        let accentColor = localStorage.getItem('accentColor');
        if (accentColor === '#10B981' || accentColor === '#FF6B35') {
            accentColor = '#0EA5A0';
            localStorage.setItem('accentColor', '#0EA5A0');
        }
        if (accentColor) {
            const isDark = theme === 'dark';
            if (isDark && accentColor === '#0F172A') {
                this.setAccentColor('#0EA5A0');
            } else if (!isDark && accentColor === '#FFFFFF') {
                this.setAccentColor('#0EA5A0');
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
        if (isDark && accentColor === '#0F172A') {
            this.setAccentColor('#0EA5A0');
        } else if (!isDark && accentColor === '#FFFFFF') {
            this.setAccentColor('#0EA5A0');
        }

        this.renderAccentDropdowns();
    }

    toggleAccentDropdown(event, dropdownId = 'accentColorDropdown') {
        if (event) event.stopPropagation();

        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                this.renderAccentDropdown(dropdownId);
            }
        }
    }

    renderAccentDropdowns() {
        const dropdownIds = ['accentColorDropdown', 'overlayAccentColorDropdown', 'pageAccentColorDropdown'];
        dropdownIds.forEach(id => {
            if (document.getElementById(id)) {
                this.renderAccentDropdown(id);
            }
        });
    }

    renderAccentDropdown(dropdownId = 'accentColorDropdown') {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const isDark = document.body.classList.contains('dark-theme');
        const savedColor = localStorage.getItem('accentColor') || '#0EA5A0';

        const allOptions = [
            { name: 'Teal', hex: '#0EA5A0' },
            { name: 'Sky Blue', hex: '#38BDF8' },
            { name: 'Sunrise', hex: '#F59E0B' },
            { name: 'Purple', hex: '#8A2BE2' },
            { name: 'White', hex: '#FFFFFF', darkOnly: true },
            { name: 'Slate', hex: '#0F172A', lightOnly: true }
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
        this.renderAccentDropdowns();
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

        // Overlay theme toggle
        const overlayThemeToggle = document.getElementById('overlayThemeToggle');
        if (overlayThemeToggle) {
            overlayThemeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Accent color picker toggle
        const accentColorBtn = document.getElementById('accentColorBtn');
        if (accentColorBtn) {
            accentColorBtn.addEventListener('click', (e) => this.toggleAccentDropdown(e));
        }

        // Overlay accent color picker toggle
        const overlayAccentColorBtn = document.getElementById('overlayAccentColorBtn');
        if (overlayAccentColorBtn) {
            overlayAccentColorBtn.addEventListener('click', (e) => this.toggleAccentDropdown(e, 'overlayAccentColorDropdown'));
        }

        // Login Button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.switchPage('auth'));
        }

        // User Profile Toggle
        const userProfileBtn = document.getElementById('userProfileBtn');
        if (userProfileBtn) {
            userProfileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('userMenuDropdown');
                if (dropdown) dropdown.classList.toggle('show');
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (window.firebaseAuth && window.auth) {
                    window.firebaseAuth.signOut(window.auth)
                        .then(() => {
                            this.switchPage('habits');
                        })
                        .catch(err => {
                            console.error("Logout error:", err);
                        });
                }
            });
        }

        // Edit Profile Button
        const editProfileBtn = document.getElementById('editProfileBtn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                const dropdown = document.getElementById('userMenuDropdown');
                if (dropdown) dropdown.classList.remove('show');
                this.switchPage('settings');
            });
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.switchPage(page);
            });
        });

        const navBrand = document.getElementById('navBrand');
        if (navBrand) {
            navBrand.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchPage('home');
            });
        }

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
                const dropdowns = ['accentColorDropdown', 'overlayAccentColorDropdown', 'pageAccentColorDropdown'];
                dropdowns.forEach(id => {
                    const dropdown = document.getElementById(id);
                    if (dropdown) dropdown.classList.remove('show');
                });
            }
            // Close user profile dropdown on outside click
            if (!e.target.closest('#userMenuWrapper')) {
                const dropdown = document.getElementById('userMenuDropdown');
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
            case 'home':
                content.innerHTML = document.getElementById('homePageTemplate').innerHTML;
                this.renderDailyBounties();
                break;
            case 'habits':
                content.innerHTML = document.getElementById('habitsPageTemplate').innerHTML;
                this.setupHabitsEventListeners();
                this.renderHabits();
                this.updateHabitsStats();
                this.renderUserChallenges();
                break;
            case 'todo':
                content.innerHTML = document.getElementById('todoPageTemplate').innerHTML;
                this.setupTodoEventListeners();
                this.renderTasks();
                this.updateTodoStats();
                break;
            case 'pomodoro':
                content.innerHTML = document.getElementById('pomodoroPageTemplate').innerHTML;
                this.setupPomodoroEventListeners();
                this.updatePomodoroDisplay();
                this.updatePomodoroStats();
                this.syncFocusAudioUI();
                break;
            case 'store':
                content.innerHTML = document.getElementById('storePageTemplate').innerHTML;
                this.renderStore();
                break;
            case 'community':
                content.innerHTML = document.getElementById('communityPageTemplate').innerHTML;
                this.renderCommunity();
                break;
            case 'playlist':
                content.innerHTML = document.getElementById('playlistPageTemplate').innerHTML;
                const toggleBtn = document.getElementById('toggleMotivationalQuotes');
                if (toggleBtn) {
                    toggleBtn.checked = this.motivationalSettings.enabled;
                }
                this.updateMotivationalCounterUI();
                this.setupPlaylistEventListeners();
                this.renderPlaylists();
                this.backfillMissingDurations();
                break;
            case 'auth':
                content.innerHTML = document.getElementById('authPageTemplate').innerHTML;
                this.setupAuthEventListeners();
                break;
            case 'settings':
                if (!this.currentUser) {
                    content.innerHTML = '<p style="padding: var(--spacing-xl); text-align: center; color: var(--color-text-secondary);">Please log in to access settings.</p>';
                    return;
                }
                content.innerHTML = document.getElementById('settingsPageTemplate').innerHTML;

                // Populate dynamic fields
                const displayName = this.currentUser.displayName || '';
                const email = this.currentUser.email || '';
                const photoURL = this._cachedProfilePic || this.currentUser.photoURL || '';
                const initial = (displayName || email || 'U').charAt(0).toUpperCase();

                const settingsUsername = document.getElementById('settingsUsername');
                if (settingsUsername) settingsUsername.value = displayName;

                const settingsEmail = document.getElementById('settingsEmail');
                if (settingsEmail) settingsEmail.value = email;

                const settingsAvatarPreview = document.getElementById('settingsAvatarPreview');
                if (settingsAvatarPreview) {
                    settingsAvatarPreview.innerHTML = photoURL
                        ? `<img src="${this.escapeHtml(photoURL)}" alt="Profile">`
                        : `<div class="avatar-fallback-lg">${initial}</div>`;
                }

                this.setupSettingsEventListeners();
                this.renderUserBadges();
                break;
            case 'admin':
                if (this.userRole !== 'admin') {
                    content.innerHTML = `
                        <div class="admin-access-denied">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <line x1="9" y1="9" x2="15" y2="15"/>
                                <line x1="15" y1="9" x2="9" y2="15"/>
                            </svg>
                            <h2>Access Denied</h2>
                            <p>You do not have permission to view the Admin Dashboard.</p>
                        </div>`;
                    return;
                }
                content.innerHTML = document.getElementById('adminPageTemplate').innerHTML;
                this.setupAdminEventListeners();
                this.loadAllUsers();
                break;
            case 'finance':
                content.innerHTML = document.getElementById('financePageTemplate').innerHTML;
                this.initFinancePage();
                break;
        }
    }

    // ============================================
    // HABITS PAGE
    // ============================================



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
        let gained = false;
        let earnedXP = 0;
        let streakMsg = '';

        this.habits = this.habits.map(h => {
            if (h.id === habitId) {
                const newProgress = [...h.progress];
                newProgress[dayIndex] = !newProgress[dayIndex];

                if (newProgress[dayIndex]) {
                    gained = true;
                    earnedXP = this.xpConfig ? this.xpConfig.habit : 50; // Daily habit checked

                    // Streak calculation
                    let consecutive = 0;
                    let idx = dayIndex;
                    while (idx >= 0 && newProgress[idx]) {
                        consecutive++;
                        idx--;
                    }
                    if (consecutive === 3) {
                        earnedXP += 100;
                        streakMsg = ' (3-day Streak Bonus!)';
                    } else if (consecutive === 7) {
                        earnedXP += 250;
                        streakMsg = ' (7-day Streak Bonus!)';
                    } else if (consecutive === 30) {
                        earnedXP += 1000;
                        streakMsg = ' (30-day Streak Bonus!)';
                    }
                }
                return { ...h, progress: newProgress };
            }
            return h;
        });

        this.saveData('habits', this.habits);
        this.renderHabits();
        this.updateHabitsStats();

        if (gained) {
            this.gainXP(earnedXP, `Habit completed${streakMsg}`);
            this.trackBountyProgress('habits', 1);
        }
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
        let completedNow = false;
        this.tasks = this.tasks.map(t => {
            if (t.id === id) {
                if (!t.completed) completedNow = true;
                return { ...t, completed: !t.completed };
            }
            return t;
        });
        this.saveData('tasks', this.tasks);
        this.renderTasks(this.currentTaskFilter);
        this.updateTodoStats();

        if (completedNow) {
            this.gainXP(this.xpConfig ? this.xpConfig.task : 30, "Task Completed");
            this.trackBountyProgress('tasks', 1);
        }
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

            // Award XP
            this.gainXP(this.xpConfig ? this.xpConfig.pomodoro : 150, "Focus Session Complete");
            this.trackBountyProgress('pomodoro', 1);
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
        document.title = "Mornigami";
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

            let groupCellsHTML = '';
            const rangeStart = Math.min(g.start, g.end);
            const rangeEnd = Math.max(g.start, g.end);
            for (let vNum = rangeStart; vNum <= rangeEnd; vNum++) {
                const videoIdx = vNum - 1;
                const video = playlist.videos[videoIdx];
                if (video) {
                    const isDone = video.completed;
                    groupCellsHTML += `
                                                <div 
                                                    class="group-video-cell ${isDone ? 'completed' : ''}" 
                                                    onclick="event.stopPropagation(); app.toggleVideo('${playlist.id}', '${video.id}')"
                                                    title="Video ${vNum}: ${this.escapeHtml(video.title)}"
                                                >
                                                    ${isDone ? `
                                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="display: block;">
                                                            <path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                                        </svg>
                                                    ` : vNum}
                                                </div>
                    `;
                }
            }
            const cellsContainerHTML = groupCellsHTML ? `
                                        <div class="playlist-group-cells" onclick="event.stopPropagation();">
                                            ${groupCellsHTML}
                                        </div>
            ` : '';

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
                                        ${cellsContainerHTML}
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
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style="display: block;">
                                            <path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
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
                // Get previously completed groups
                playlist.groups = playlist.groups || [];
                const previouslyCompletedGroups = playlist.groups.filter(g => {
                    const startIdx = g.start - 1;
                    const endIdx = g.end - 1;
                    for (let i = startIdx; i <= endIdx; i++) {
                        if (playlist.videos[i] && !playlist.videos[i].completed) {
                            return false;
                        }
                    }
                    return true;
                });

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

                // XP awards
                if (video.completed) {
                    let xpGained = this.xpConfig ? this.xpConfig.video : 40; // Base XP for completed video
                    let reason = "Video Completed";

                    // Check if any new groups were completed
                    const currentlyCompletedGroups = playlist.groups.filter(g => {
                        const startIdx = g.start - 1;
                        const endIdx = g.end - 1;
                        for (let i = startIdx; i <= endIdx; i++) {
                            if (playlist.videos[i] && !playlist.videos[i].completed) {
                                return false;
                            }
                        }
                        return true;
                    });

                    if (currentlyCompletedGroups.length > previouslyCompletedGroups.length) {
                        xpGained += this.xpConfig ? this.xpConfig.groupBonus : 200; // Bonus for learning group completion
                        reason = "Learning Group Completed!";
                    }

                    this.gainXP(xpGained, reason);
                }
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
        const resetBtn = document.getElementById('resetStreakBtn');
        if (counterEl) {
            if (this.motivationalSettings.enabled) {
                const target = this.motivationalSettings.targetCount || 5;
                counterEl.innerHTML = `${this.motivationalSettings.streakCount}/<input type="number" id="motivationalTargetInput" value="${target}" min="1" max="100" style="width: 32px; border: none; background: transparent; color: var(--color-primary); font-weight: 700; font-family: inherit; font-size: inherit; text-align: center; border-bottom: 1.5px dashed var(--color-primary); padding: 0; outline: none; margin: 0 2px;" onchange="app.changeMotivationalTarget(this.value)">`;
                if (wrapperEl) wrapperEl.style.opacity = '1';
                if (resetBtn) resetBtn.style.display = 'flex';
            } else {
                counterEl.textContent = 'Off';
                if (wrapperEl) wrapperEl.style.opacity = '0.7';
                if (resetBtn) resetBtn.style.display = 'none';
            }
        }
    }

    resetPlaylistStreak() {
        this.motivationalSettings.streakCount = 0;
        this.saveData('motivationalSettings', this.motivationalSettings);
        this.updateMotivationalCounterUI();
    }

    closeMotivationalPopup() {
        const popup = document.getElementById('motivationalPopup');
        if (popup) popup.classList.remove('active');

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
        const popup = document.getElementById('motivationalPopup');
        const msgEl = document.getElementById('motivationalMessage');
        if (popup && msgEl) {
            msgEl.textContent = message;
            popup.classList.add('active');
        }
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

        if (this.currentUser && window.db && window.firestoreUtils) {
            const { doc, setDoc } = window.firestoreUtils;
            const userRef = doc(window.db, "users", this.currentUser.uid);
            setDoc(userRef, { [key]: data }, { merge: true })
                .catch(err => console.error("Error saving to cloud:", err));
        }
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

    updateNavbarAvatar(photoURL, displayName, email) {
        const avatarImg = document.getElementById('userAvatarImg');
        const avatarFallback = document.getElementById('userAvatarFallback');

        if (photoURL && avatarImg) {
            avatarImg.src = photoURL;
            avatarImg.style.display = 'block';
            if (avatarFallback) avatarFallback.style.display = 'none';
        } else {
            if (avatarImg) avatarImg.style.display = 'none';
            if (avatarFallback) {
                avatarFallback.style.display = 'flex';
                if (this.activeAvatar) {
                    avatarFallback.textContent = this.activeAvatar;
                } else {
                    const initial = (displayName || email || 'U').charAt(0).toUpperCase();
                    avatarFallback.textContent = initial;
                }
            }
        }
    }

    resizeImageToBase64(file, maxSize = 200) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width;
                    let h = img.height;
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else { w = Math.round(w * maxSize / h); h = maxSize; }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = () => reject(new Error('Failed to load image.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file.'));
            reader.readAsDataURL(file);
        });
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

    // ============================================
    // AUTHENTICATION AND REGISTRATION
    // ============================================

    async onUserStatusChanged(user) {
        this.currentUser = user;
        const loginBtn = document.getElementById('loginBtn');
        const userMenuWrapper = document.getElementById('userMenuWrapper');
        const userEmailText = document.getElementById('userEmailText');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        const authOverlay = document.getElementById('authOverlay');

        if (user) {
            this.userBadges = [];
            this.updateBadgeUI();
            // Hide the mandatory auth overlay with a smooth transition
            if (authOverlay) {
                authOverlay.style.opacity = '0';
                setTimeout(() => {
                    authOverlay.style.display = 'none';
                }, 300);
            }

            // Cache user photo URL and show avatar on navbar immediately
            this._cachedProfilePic = user.photoURL || null;
            this.updateNavbarAvatar(this._cachedProfilePic, user.displayName, user.email);

            // 1. تصفير البيانات المحلية فوراً قبل تحميل بيانات الحساب الجديد (لمنع التسريب)
            this.clearAllLocalData();

            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'flex';
                if (userEmailText) {
                    const displayName = user.displayName || user.email.split('@')[0];
                    userEmailText.textContent = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                }
                if (dropdownUserEmail) {
                    dropdownUserEmail.textContent = user.displayName ? `Logged in as ${user.displayName}` : `Logged in as ${user.email}`;
                }
            }
            if (this.currentPage === 'auth') {
                this.switchPage('habits');
            }

            // 2. جلب بيانات الحساب الجديد من السيرفر
            if (window.db && window.firestoreUtils) {
                const { doc, getDoc } = window.firestoreUtils;
                try {
                    const userRef = doc(window.db, "users", user.uid);
                    const docSnap = await getDoc(userRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Load profile picture from Firestore if exists
                        if (data.profilePicUrl) {
                            this._cachedProfilePic = data.profilePicUrl;
                            this.updateNavbarAvatar(this._cachedProfilePic, user.displayName, user.email);
                        }

                        // تحميل البيانات من السيرفر للذاكرة وللـ localStorage
                        if (data.habits) {
                            this.habits = data.habits;
                            localStorage.setItem('habits', JSON.stringify(this.habits));
                        }
                        if (data.tasks) {
                            this.tasks = data.tasks;
                            localStorage.setItem('tasks', JSON.stringify(this.tasks));
                        }
                        if (data.playlists) {
                            this.playlists = data.playlists;
                            localStorage.setItem('playlists', JSON.stringify(this.playlists));
                        }
                        if (data.pomodoroStats) {
                            this.pomodoroStats = data.pomodoroStats;
                            localStorage.setItem('pomodoroStats', JSON.stringify(this.pomodoroStats));
                        }
                        if (data.motivationalSettings) {
                            this.motivationalSettings = data.motivationalSettings;
                            localStorage.setItem('motivationalSettings', JSON.stringify(this.motivationalSettings));
                        }

                        // Load Level and XP from Firestore
                        if (data.userLevel !== undefined) {
                            this.userLevel = data.userLevel;
                            localStorage.setItem('userLevel', this.userLevel);
                        }
                        if (data.userXP !== undefined) {
                            this.userXP = data.userXP;
                            localStorage.setItem('userXP', this.userXP);
                        }
                        if (data.badges) {
                            this.userBadges = data.badges;
                        }
                        this.spentXP = data.spentXP || 0;
                        this.unlockedItems = data.unlockedItems || { colors: [], avatars: [], borders: [] };
                        this.activeAvatar = data.activeAvatar || '';
                        this.activeBorder = data.activeBorder || '';
                        this.friendsList = data.friends || [];

                        localStorage.setItem('spentXP', this.spentXP);
                        this.saveData('unlockedItems', this.unlockedItems);
                        localStorage.setItem('activeAvatar', this.activeAvatar);
                        localStorage.setItem('activeBorder', this.activeBorder);
                        this.saveData('friendsList', this.friendsList);
                        if (data.activeColor) {
                            localStorage.setItem('accentColor', data.activeColor);
                            this.applyTheme();
                        }
                        this.updateXPUI();
                        this.updateBadgeUI();

                        // Load user role (RBAC)
                        if (data.role) {
                            this.userRole = data.role;
                        } else {
                            // Auto-assign: if the user has displayName 'Bishr', set as admin; otherwise default to 'user'
                            const autoRole = (user.displayName && user.displayName.toLowerCase() === 'bishr') ? 'admin' : 'user';
                            this.userRole = autoRole;
                            // Persist the default role to Firestore
                            const { doc: docRef, setDoc: setDocRef } = window.firestoreUtils;
                            setDocRef(docRef(window.db, "users", user.uid), { role: autoRole }, { merge: true })
                                .catch(err => console.error('Error setting default role:', err));
                        }
                        this.applyRoleVisibility();
                        await this.loadGlobalSettings();

                        // Log activity and set default status
                        const { doc: docRef, setDoc: setDocRef } = window.firestoreUtils;
                        const userRef = docRef(window.db, "users", user.uid);
                        const updates = { 
                            lastActive: new Date().toISOString(),
                            email: user.email,
                            displayName: user.displayName || user.email.split('@')[0]
                        };
                        if (data.status === undefined) updates.status = 'active';
                        setDocRef(userRef, updates, { merge: true })
                            .catch(err => console.error("Error logging user activity:", err));

                        // Check lockout status
                        if (data.status === 'suspended' || data.status === 'banned') {
                            this.showLockoutScreen(data.status);
                            return;
                        } else {
                            this.removeLockoutScreen();
                        }

                        // إعادة رندر الصفحة بالبيانات الجديدة
                        this.renderPage(this.currentPage);
                    }
                } catch (err) {
                    console.error("Error loading from cloud:", err);
                }
            }

        } else {
            // Show the mandatory auth overlay, hide loading spinner, show form card
            if (authOverlay) {
                authOverlay.style.display = 'flex';
                authOverlay.style.opacity = '1';
                const loader = document.getElementById('authOverlayLoader');
                const card = document.getElementById('authOverlayCard');
                if (loader) loader.style.display = 'none';
                if (card) card.style.display = 'block';
            }

            // Clear cached profile pic and update navbar avatar
            this._cachedProfilePic = null;
            this.updateNavbarAvatar(null, null, null);

            // Clear login/signup input fields and messages
            this.clearAuthInputs();

            this.userBadges = [];
            this.updateBadgeUI();

            // لو المستخدم سجل خروج، بنظف الـ localStorage تماماً عشان يرجع anonymous نضيف
            this.clearAllLocalData();

            // Reset role
            this.userRole = null;
            this.applyRoleVisibility();

            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'none';
            }
        }
    }

    clearAuthInputs() {
        const inputs = [
            'overlayUsernameInput',
            'overlayEmailInput',
            'overlayPasswordInput',
            'usernameInput',
            'emailInput',
            'passwordInput'
        ];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
            }
        });

        const messages = [
            'overlayAuthMessage',
            'authMessage'
        ];
        messages.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.textContent = '';
                el.className = 'auth-message';
            }
        });

        // Reset submit buttons states
        const overlaySubmitAuthBtn = document.getElementById('overlaySubmitAuthBtn');
        const overlayAuthSubmitText = document.getElementById('overlayAuthSubmitText');
        if (overlaySubmitAuthBtn) overlaySubmitAuthBtn.disabled = false;
        if (overlayAuthSubmitText) {
            overlayAuthSubmitText.textContent = this.overlayAuthMode === 'signup' ? 'Create Account' : 'Sign In';
        }

        const submitAuthBtn = document.getElementById('submitAuthBtn');
        const authSubmitText = document.getElementById('authSubmitText');
        if (submitAuthBtn) submitAuthBtn.disabled = false;
        if (authSubmitText) {
            authSubmitText.textContent = this.authMode === 'signup' ? 'Create Account' : 'Sign In';
        }
    }

    setupOverlayAuthEventListeners() {
        const authForm = document.getElementById('overlayAuthForm');
        const toggleAuthMode = document.getElementById('overlayToggleAuthMode');

        this.overlayAuthMode = 'signin';

        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', (e) => {
                e.preventDefault();
                const authTitle = document.getElementById('overlayAuthTitle');
                const authSubtitle = document.getElementById('overlayAuthSubtitle');
                const authSubmitText = document.getElementById('overlayAuthSubmitText');
                const authToggleText = document.getElementById('overlayAuthToggleText');
                const authMessage = document.getElementById('overlayAuthMessage');
                const emailLabel = document.getElementById('overlayEmailLabel');
                const emailInput = document.getElementById('overlayEmailInput');

                // عناصر اليوزرنيم
                const usernameGroup = document.getElementById('overlayUsernameGroup');
                const usernameInput = document.getElementById('overlayUsernameInput');

                if (authMessage) {
                    authMessage.className = 'auth-message';
                    authMessage.style.display = 'none';
                }

                if (this.overlayAuthMode === 'signin') {
                    this.overlayAuthMode = 'signup';
                    authTitle.textContent = 'Create Account';
                    authSubtitle.textContent = 'Start tracking your goals today';
                    authSubmitText.textContent = 'Create Account';
                    authToggleText.textContent = 'Already have an account? ';
                    toggleAuthMode.textContent = 'Sign In';
                    if (emailLabel) emailLabel.textContent = 'Email Address';
                    if (emailInput) emailInput.placeholder = 'email@domain.com';
                    // إظهار حقل اليوزرنيم وجعله إجباري
                    if (usernameGroup) {
                        usernameGroup.style.display = 'block';
                        usernameInput.required = true;
                    }
                } else {
                    this.overlayAuthMode = 'signin';
                    authTitle.textContent = 'Sign In';
                    authSubtitle.textContent = 'Access your productivity hub';
                    authSubmitText.textContent = 'Sign In';
                    authToggleText.textContent = "Don't have an account? ";
                    toggleAuthMode.textContent = 'Sign Up';
                    if (emailLabel) emailLabel.textContent = 'Email or Username';
                    if (emailInput) emailInput.placeholder = 'Email/Username';
                    // إخفاء حقل اليوزرنيم
                    if (usernameGroup) {
                        usernameGroup.style.display = 'none';
                        usernameInput.required = false;
                    }
                }
            });
        }

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('overlayEmailInput').value.trim();
                const password = document.getElementById('overlayPasswordInput').value;
                const username = document.getElementById('overlayUsernameInput')?.value.trim();

                const authMessage = document.getElementById('overlayAuthMessage');
                const submitAuthBtn = document.getElementById('overlaySubmitAuthBtn');
                const authSubmitText = document.getElementById('overlayAuthSubmitText');

                if (!email || !password) return;

                if (submitAuthBtn) submitAuthBtn.disabled = true;
                const originalBtnText = authSubmitText.textContent;
                authSubmitText.textContent = this.overlayAuthMode === 'signin' ? 'Signing In...' : 'Creating Account...';

                if (authMessage) {
                    authMessage.className = 'auth-message';
                    authMessage.style.display = 'none';
                }

                const handleSuccess = (userCredential) => {
                    if (authMessage) {
                        authMessage.textContent = this.overlayAuthMode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!';
                        authMessage.className = 'auth-message success';
                        authMessage.style.display = 'block';
                    }
                };

                const handleError = (error) => {
                    console.error("Overlay Auth error:", error);
                    if (submitAuthBtn) submitAuthBtn.disabled = false;
                    authSubmitText.textContent = originalBtnText;

                    let userFriendlyMsg = error.message;
                    if (error.code === 'auth/email-already-in-use') {
                        userFriendlyMsg = 'This email address is already in use.';
                    } else if (error.code === 'auth/invalid-email') {
                        userFriendlyMsg = 'Please enter a valid email address.';
                    } else if (error.code === 'auth/weak-password') {
                        userFriendlyMsg = 'The password must be at least 6 characters long.';
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                        userFriendlyMsg = 'Invalid email or password. Please try again.';
                    } else if (error.code === 'auth/username-taken') {
                        userFriendlyMsg = 'This username is already taken. Please choose another one.';
                    } else if (error.code === 'auth/username-not-found') {
                        userFriendlyMsg = 'Username not found. Please check your spelling or sign up.';
                    }

                    if (authMessage) {
                        authMessage.textContent = userFriendlyMsg;
                        authMessage.className = 'auth-message error';
                        authMessage.style.display = 'block';
                    }
                };

                if (this.overlayAuthMode === 'signin') {
                    const isEmail = email.includes('@');
                    const getEmailPromise = isEmail ? Promise.resolve(email) : (async () => {
                        if (window.db && window.firestoreUtils) {
                            const { doc, getDoc } = window.firestoreUtils;
                            const usernameRef = doc(window.db, "usernames", email.toLowerCase());
                            const usernameSnap = await getDoc(usernameRef);
                            if (usernameSnap.exists()) {
                                return usernameSnap.data().email;
                            } else {
                                throw { code: 'auth/username-not-found', message: 'Username not found.' };
                            }
                        } else {
                            throw { code: 'auth/no-firestore', message: 'Cloud database is unavailable.' };
                        }
                    })();

                    getEmailPromise
                        .then((resolvedEmail) => {
                            return window.firebaseAuth.signInWithEmailAndPassword(window.auth, resolvedEmail, password);
                        })
                        .then(handleSuccess)
                        .catch(handleError);
                } else {
                    const checkUsernamePromise = username ? (async () => {
                        if (window.db && window.firestoreUtils) {
                            const { doc, getDoc } = window.firestoreUtils;
                            const usernameRef = doc(window.db, "usernames", username.toLowerCase());
                            const usernameSnap = await getDoc(usernameRef);
                            if (usernameSnap.exists()) {
                                throw { code: 'auth/username-taken', message: 'This username is already taken.' };
                            }
                        }
                    })() : Promise.resolve();

                    checkUsernamePromise
                        .then(() => {
                            return window.firebaseAuth.createUserWithEmailAndPassword(window.auth, email, password);
                        })
                        .then((userCredential) => {
                            const user = userCredential.user;
                            const promises = [];
                            if (username) {
                                if (window.firebaseAuth.updateProfile) {
                                    promises.push(window.firebaseAuth.updateProfile(user, { displayName: username }));
                                }
                                if (window.db && window.firestoreUtils) {
                                    const { doc, setDoc } = window.firestoreUtils;
                                    const usernameRef = doc(window.db, "usernames", username.toLowerCase());
                                    promises.push(setDoc(usernameRef, { email: email, uid: user.uid }));
                                }
                            }
                            // Create user document with default role
                            if (window.db && window.firestoreUtils) {
                                const { doc, setDoc } = window.firestoreUtils;
                                const userRef = doc(window.db, "users", user.uid);
                                promises.push(setDoc(userRef, { role: 'user', email: email, displayName: username || '' }, { merge: true }));
                            }
                            return Promise.all(promises).then(() => userCredential);
                        })
                        .then(handleSuccess)
                        .catch(handleError);
                }
            });
        }
    }



    setupAuthEventListeners() {
        const authForm = document.getElementById('authForm');
        const toggleAuthMode = document.getElementById('toggleAuthMode');

        // Page theme toggle
        const pageThemeToggle = document.getElementById('pageThemeToggle');
        if (pageThemeToggle) {
            pageThemeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Page accent color picker toggle
        const pageAccentColorBtn = document.getElementById('pageAccentColorBtn');
        if (pageAccentColorBtn) {
            pageAccentColorBtn.addEventListener('click', (e) => this.toggleAccentDropdown(e, 'pageAccentColorDropdown'));
        }

        this.authMode = 'signin';

        if (toggleAuthMode) {
            toggleAuthMode.addEventListener('click', (e) => {
                e.preventDefault();
                const authTitle = document.getElementById('authTitle');
                const authSubtitle = document.getElementById('authSubtitle');
                const authSubmitText = document.getElementById('authSubmitText');
                const authToggleText = document.getElementById('authToggleText');
                const authMessage = document.getElementById('authMessage');
                const emailLabel = document.getElementById('emailLabel');
                const emailInput = document.getElementById('emailInput');

                // عناصر اليوزرنيم
                const usernameGroup = document.getElementById('usernameGroup');
                const usernameInput = document.getElementById('usernameInput');

                if (authMessage) {
                    authMessage.className = 'auth-message';
                    authMessage.style.display = 'none';
                }

                if (this.authMode === 'signin') {
                    this.authMode = 'signup';
                    authTitle.textContent = 'Create Account';
                    authSubtitle.textContent = 'Start tracking your goals today';
                    authSubmitText.textContent = 'Create Account';
                    authToggleText.textContent = 'Already have an account? ';
                    toggleAuthMode.textContent = 'Sign In';
                    if (emailLabel) emailLabel.textContent = 'Email Address';
                    if (emailInput) emailInput.placeholder = 'email@domain.com';
                    // إظهار حقل اليوزرنيم وجعله إجباري
                    if (usernameGroup) {
                        usernameGroup.style.display = 'block';
                        usernameInput.required = true;
                    }
                } else {
                    this.authMode = 'signin';
                    authTitle.textContent = 'Sign In';
                    authSubtitle.textContent = 'Access your productivity hub';
                    authSubmitText.textContent = 'Sign In';
                    authToggleText.textContent = "Don't have an account? ";
                    toggleAuthMode.textContent = 'Sign Up';
                    if (emailLabel) emailLabel.textContent = 'Email or Username';
                    if (emailInput) emailInput.placeholder = 'username or email@example.com';
                    // إخفاء حقل اليوزرنيم
                    if (usernameGroup) {
                        usernameGroup.style.display = 'none';
                        usernameInput.required = false;
                    }
                }
            });
        }

        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('emailInput').value.trim();
                const password = document.getElementById('passwordInput').value;
                const username = document.getElementById('usernameInput')?.value.trim();

                const authMessage = document.getElementById('authMessage');
                const submitAuthBtn = document.getElementById('submitAuthBtn');
                const authSubmitText = document.getElementById('authSubmitText');

                if (!email || !password) return;

                if (submitAuthBtn) submitAuthBtn.disabled = true;
                const originalBtnText = authSubmitText.textContent;
                authSubmitText.textContent = this.authMode === 'signin' ? 'Signing In...' : 'Creating Account...';

                if (authMessage) {
                    authMessage.className = 'auth-message';
                    authMessage.style.display = 'none';
                }

                const handleSuccess = (userCredential) => {
                    if (authMessage) {
                        authMessage.textContent = this.authMode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!';
                        authMessage.className = 'auth-message success';
                        authMessage.style.display = 'block';
                    }
                    setTimeout(() => {
                        this.switchPage('habits');
                    }, 1000);
                };

                const handleError = (error) => {
                    console.error("Auth error:", error);
                    if (submitAuthBtn) submitAuthBtn.disabled = false;
                    authSubmitText.textContent = originalBtnText;

                    let userFriendlyMsg = error.message;
                    if (error.code === 'auth/email-already-in-use') {
                        userFriendlyMsg = 'This email address is already in use.';
                    } else if (error.code === 'auth/invalid-email') {
                        userFriendlyMsg = 'Please enter a valid email address.';
                    } else if (error.code === 'auth/weak-password') {
                        userFriendlyMsg = 'The password must be at least 6 characters long.';
                    } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                        userFriendlyMsg = 'Invalid email or password. Please try again.';
                    } else if (error.code === 'auth/username-taken') {
                        userFriendlyMsg = 'This username is already taken. Please choose another one.';
                    } else if (error.code === 'auth/username-not-found') {
                        userFriendlyMsg = 'Username not found. Please check your spelling or sign up.';
                    }

                    if (authMessage) {
                        authMessage.textContent = userFriendlyMsg;
                        authMessage.className = 'auth-message error';
                        authMessage.style.display = 'block';
                    }
                };

                if (this.authMode === 'signin') {
                    const isEmail = email.includes('@');
                    const getEmailPromise = isEmail ? Promise.resolve(email) : (async () => {
                        if (window.db && window.firestoreUtils) {
                            const { doc, getDoc } = window.firestoreUtils;
                            const usernameRef = doc(window.db, "usernames", email.toLowerCase());
                            const usernameSnap = await getDoc(usernameRef);
                            if (usernameSnap.exists()) {
                                return usernameSnap.data().email;
                            } else {
                                throw { code: 'auth/username-not-found', message: 'Username not found.' };
                            }
                        } else {
                            throw { code: 'auth/no-firestore', message: 'Cloud database is unavailable.' };
                        }
                    })();

                    getEmailPromise
                        .then((resolvedEmail) => {
                            return window.firebaseAuth.signInWithEmailAndPassword(window.auth, resolvedEmail, password);
                        })
                        .then(handleSuccess)
                        .catch(handleError);
                } else {
                    const checkUsernamePromise = username ? (async () => {
                        if (window.db && window.firestoreUtils) {
                            const { doc, getDoc } = window.firestoreUtils;
                            const usernameRef = doc(window.db, "usernames", username.toLowerCase());
                            const usernameSnap = await getDoc(usernameRef);
                            if (usernameSnap.exists()) {
                                throw { code: 'auth/username-taken', message: 'This username is already taken.' };
                            }
                        }
                    })() : Promise.resolve();

                    checkUsernamePromise
                        .then(() => {
                            return window.firebaseAuth.createUserWithEmailAndPassword(window.auth, email, password);
                        })
                        .then((userCredential) => {
                            const user = userCredential.user;
                            const promises = [];
                            if (username) {
                                if (window.firebaseAuth.updateProfile) {
                                    promises.push(window.firebaseAuth.updateProfile(user, { displayName: username }));
                                }
                                if (window.db && window.firestoreUtils) {
                                    const { doc, setDoc } = window.firestoreUtils;
                                    const usernameRef = doc(window.db, "usernames", username.toLowerCase());
                                    promises.push(setDoc(usernameRef, { email: email, uid: user.uid }));
                                }
                            }
                            // Create user document with default role
                            if (window.db && window.firestoreUtils) {
                                const { doc, setDoc } = window.firestoreUtils;
                                const userRef = doc(window.db, "users", user.uid);
                                promises.push(setDoc(userRef, { role: 'user', email: email, displayName: username || '' }, { merge: true }));
                            }
                            return Promise.all(promises).then(() => userCredential);
                        })
                        .then(handleSuccess)
                        .catch(handleError);
                }
            });
        }
    }
    // دالة لتصفير بيانات التطبيق بالكامل محلياً
    clearAllLocalData() {
        // 1. مسح البيانات من الـ localStorage
        const keysToClear = ['habits', 'tasks', 'playlists', 'pomodoroStats', 'motivationalSettings', 'userLevel', 'userXP', 'spentXP', 'unlockedItems', 'activeAvatar', 'activeBorder', 'friendsList'];
        keysToClear.forEach(key => localStorage.removeItem(key));

        // 2. إعادة تعيين متغيرات التطبيق في الذاكرة لقيمها الافتراضية
        this.habits = [];
        this.tasks = [];
        this.playlists = [];
        this.pomodoroStats = {
            sessionsToday: 0,
            totalFocusTime: 0,
            currentStreak: 0,
            lastSessionDate: null
        };
        this.motivationalSettings = {
            enabled: true,
            streakCount: 0,
            targetCount: 5
        };
        this.userLevel = 1;
        this.userXP = 0;
        this.spentXP = 0;
        this.unlockedItems = { colors: [], avatars: [], borders: [] };
        this.activeAvatar = '';
        this.activeBorder = '';
        this.friendsList = [];
        this.userBadges = [];
        this.updateXPUI();
        this.updateBadgeUI();

        // 3. إعادة تحميل الصفحة المعروضة حالياً عشان تظهر فاضية
        this.renderPage(this.currentPage);
    }

    // ============================================
    // ROLE-BASED ACCESS CONTROL (RBAC) & ADMIN
    // ============================================

    applyRoleVisibility() {
        const adminNavLink = document.getElementById('adminNavLink');
        if (adminNavLink) {
            adminNavLink.style.display = this.userRole === 'admin' ? '' : 'none';
        }
    }

    switchAdminTab(tabName) {
        this.activeAdminTab = tabName;

        // Toggle tab buttons
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Toggle tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            if (content.id === `adminTab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        });

        // If switching to user management or analytics, make sure we reload data
        if (tabName === 'users' || tabName === 'analytics') {
            this.loadAllUsers();
        } else if (tabName === 'gamification') {
            this.loadGamificationSetup();
        } else if (tabName === 'finance') {
            this.loadAdminFinancePanel();
        }
    }

    setupAdminEventListeners() {
        const backBtn = document.getElementById('adminBackBtn');
        if (backBtn) backBtn.addEventListener('click', () => this.switchPage('habits'));

        const refreshBtn = document.getElementById('adminRefreshBtn');
        if (refreshBtn) refreshBtn.addEventListener('click', () => {
            this.loadAllUsers();
            this.loadGamificationSetup();
            this.loadGlobalSettings();
        });

        // Load correct tab content
        this.switchAdminTab(this.activeAdminTab || 'analytics');
    }

    async loadGamificationSetup() {
        if (!window.db || !window.firestoreUtils) return;
        const { doc, getDoc, collection, getDocs } = window.firestoreUtils;

        // Populate user award dropdown
        const badgeSelectUser = document.getElementById('badgeTargetUser');
        if (badgeSelectUser) {
            try {
                const snapshot = await getDocs(collection(window.db, "users"));
                badgeSelectUser.innerHTML = '<option value="">-- Choose User --</option>';
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    const name = data.displayName || data.username || docSnap.id;
                    badgeSelectUser.innerHTML += `<option value="${docSnap.id}">${this.escapeHtml(name)} (${this.escapeHtml(data.email || 'No email')})</option>`;
                });
            } catch (err) {
                console.error("Error loading users for badge assignment:", err);
            }
        }

        // Fill Scaling form values from current xpConfig
        const scaleHabit = document.getElementById('xpScaleHabit');
        const scaleTask = document.getElementById('xpScaleTask');
        const scalePomodoro = document.getElementById('xpScalePomodoro');
        const scaleVideo = document.getElementById('xpScaleVideo');
        const scaleBase = document.getElementById('xpScaleBase');

        if (scaleHabit && this.xpConfig) scaleHabit.value = this.xpConfig.habit;
        if (scaleTask && this.xpConfig) scaleTask.value = this.xpConfig.task;
        if (scalePomodoro && this.xpConfig) scalePomodoro.value = this.xpConfig.pomodoro;
        if (scaleVideo && this.xpConfig) scaleVideo.value = this.xpConfig.video;
        if (scaleBase && this.xpConfig) scaleBase.value = this.xpConfig.levelBase;

        const scaleBountyHours = document.getElementById('bountyExpireHours');
        if (scaleBountyHours && this.xpConfig) scaleBountyHours.value = this.xpConfig.bountyExpireHours || 24;

        // Load active challenges
        this.loadAdminActiveChallenges();
    }

    async loadAdminActiveChallenges() {
        const listEl = document.getElementById('adminActiveChallengesList');
        if (!listEl || !window.db || !window.firestoreUtils) return;

        try {
            const { collection, getDocs } = window.firestoreUtils;
            const snapshot = await getDocs(collection(window.db, "globalChallenges"));

            let html = '';
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                html += `
                    <div class="admin-challenge-card" data-id="${docSnap.id}">
                        <div class="admin-challenge-info">
                            <span class="admin-challenge-title">${this.escapeHtml(data.title)}</span>
                            <span class="admin-challenge-desc">${this.escapeHtml(data.description)}</span>
                            <span class="admin-challenge-prize">🏆 Reward: +${data.prize} XP</span>
                        </div>
                        <button class="btn-action-danger-sm" onclick="app.deleteGlobalChallenge('${docSnap.id}')">Delete</button>
                    </div>`;
            });

            listEl.innerHTML = html || '<p style="color: var(--color-text-secondary); text-align: center; margin: 0; padding: var(--spacing-md);">No active platform challenges.</p>';
        } catch (err) {
            console.error("Error loading admin challenges:", err);
            listEl.innerHTML = '<p style="color: var(--color-danger);">Error loading challenges.</p>';
        }
    }

    async loadAllUsers() {
        if (!window.db || !window.firestoreUtils) return;

        const tableBody = document.getElementById('adminUserTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <div class="admin-loading">
                    <div class="admin-loading-spinner"></div>
                    <span>Loading users...</span>
                </div>`;
        }

        try {
            const { collection, getDocs } = window.firestoreUtils;
            const usersCol = collection(window.db, "users");
            const snapshot = await getDocs(usersCol);

            const users = [];
            let totalXP = 0;
            let totalLevel = 0;
            let totalAdmins = 0;

            // Stats aggregations
            let totalHabitsCount = 0;
            let totalTasksCount = 0;
            let totalFocusSessionsCount = 0;
            let totalPlaylistsCount = 0;
            let activeTodayCount = 0;
            let activeWeekCount = 0;

            const now = new Date();
            const oneDayMs = 24 * 60 * 60 * 1000;
            const sevenDaysMs = 7 * oneDayMs;

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const u = {
                    uid: docSnap.id,
                    displayName: data.displayName || data.username || '',
                    email: data.email || '',
                    role: data.role || 'user',
                    userLevel: data.userLevel || 1,
                    userXP: data.userXP || 0,
                    spentXP: data.spentXP || 0,
                    status: data.status || 'active',
                    profilePicUrl: data.profilePicUrl || '',
                    lastActive: data.lastActive || '',
                    habits: data.habits || [],
                    tasks: data.tasks || [],
                    pomodoroStats: data.pomodoroStats || { sessionsToday: 0 },
                    playlists: data.playlists || [],
                    badges: data.badges || []
                };

                users.push(u);

                totalLevel += u.userLevel;
                totalXP += u.userXP;
                if (u.role === 'admin') totalAdmins++;

                totalHabitsCount += u.habits.length;
                totalTasksCount += u.tasks.length;
                totalFocusSessionsCount += (u.pomodoroStats.sessionsToday || 0);
                totalPlaylistsCount += u.playlists.length;

                if (u.lastActive) {
                    const lastActiveDate = new Date(u.lastActive);
                    const diff = now - lastActiveDate;
                    if (diff <= oneDayMs) activeTodayCount++;
                    if (diff <= sevenDaysMs) activeWeekCount++;
                }
            });

            // Update KPI elements
            const totalUsersEl = document.getElementById('adminTotalUsers');
            const totalAdminsEl = document.getElementById('adminTotalAdmins');
            const avgLevelEl = document.getElementById('adminAvgLevel');
            const activeTodayEl = document.getElementById('adminActiveUsersToday');
            const activeWeekEl = document.getElementById('adminActiveUsersWeek');

            if (totalUsersEl) totalUsersEl.textContent = users.length;
            if (totalAdminsEl) totalAdminsEl.textContent = totalAdmins;
            if (avgLevelEl) {
                const avg = users.length > 0 ? (totalLevel / users.length).toFixed(1) : '—';
                avgLevelEl.textContent = avg;
            }
            if (activeTodayEl) activeTodayEl.textContent = activeTodayCount;
            if (activeWeekEl) activeWeekEl.textContent = activeWeekCount;

            // Breakdown Stats
            const habitsCountEl = document.getElementById('adminTotalHabits');
            const tasksCountEl = document.getElementById('adminTotalTasks');
            const focusSessionsCountEl = document.getElementById('adminTotalFocusSessions');
            const playlistsCountEl = document.getElementById('adminTotalPlaylists');

            if (habitsCountEl) habitsCountEl.textContent = totalHabitsCount;
            if (tasksCountEl) habitsCountEl.textContent = totalTasksCount;
            if (focusSessionsCountEl) focusSessionsCountEl.textContent = totalFocusSessionsCount;
            if (playlistsCountEl) playlistsCountEl.textContent = totalPlaylistsCount;

            this.renderAdminUserTable(users);
        } catch (err) {
            console.error("Error loading users for admin:", err);
            if (tableBody) {
                tableBody.innerHTML = `
                    <div class="admin-loading" style="color: var(--color-danger);">
                        <span>Failed to load users. Please check your credentials or network.</span>
                    </div>`;
            }
        }
    }

    renderAdminUserTable(users) {
        const tableBody = document.getElementById('adminUserTableBody');
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <div class="admin-loading">
                    <span>No registered users found.</span>
                </div>`;
            return;
        }

        const currentUid = this.currentUser ? this.currentUser.uid : null;

        tableBody.innerHTML = users.map(user => {
            const initial = (user.displayName || user.email || 'U').charAt(0).toUpperCase();
            const avatarHTML = user.profilePicUrl
                ? `<img src="${this.escapeHtml(user.profilePicUrl)}" alt="${this.escapeHtml(user.displayName)}">`
                : `<span class="admin-user-avatar-fallback">${initial}</span>`;

            const isCurrentUser = user.uid === currentUid;
            const rowClass = isCurrentUser ? 'admin-user-row is-current-user' : 'admin-user-row';
            const roleDisabled = isCurrentUser ? 'disabled' : '';
            const statusDisabled = isCurrentUser ? 'disabled' : '';

            // Format last active date
            let lastActiveStr = 'Never active';
            if (user.lastActive) {
                lastActiveStr = new Date(user.lastActive).toLocaleString();
            }

            // Badges string
            const badgesStr = user.badges.length > 0 ? user.badges.join(', ') : 'None';

            return `
                <div class="${rowClass}" data-uid="${user.uid}" data-status="${user.status}">
                    <div class="admin-user-avatar">${avatarHTML}</div>
                    <div class="admin-user-info">
                        <div class="admin-user-name" style="font-weight: 700;">${this.escapeHtml(user.displayName || 'No Name')}${isCurrentUser ? ' <span style="font-size: 10px; color: var(--color-primary); font-weight: 600;">(You)</span>' : ''}</div>
                        <div class="admin-user-email">${this.escapeHtml(user.email || 'N/A')}</div>
                    </div>
                    <div>
                        <label class="admin-col-label">Role</label>
                        <select class="admin-role-select" data-field="role" ${roleDisabled}>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div>
                        <label class="admin-col-label">Level</label>
                        <input type="number" class="admin-input" data-field="level" value="${user.userLevel}" min="1">
                    </div>
                    <div>
                        <label class="admin-col-label">XP</label>
                        <input type="number" class="admin-input" data-field="xp" value="${user.userXP}" min="0">
                    </div>
                    <div>
                        <label class="admin-col-label">Spendable XP</label>
                        <input type="number" class="admin-input" data-field="spendableXp" value="${Math.max(0, user.userXP - (user.spentXP || 0))}" min="0">
                    </div>
                    <div>
                        <label class="admin-col-label">Status</label>
                        <select class="admin-role-select" data-field="status" ${statusDisabled} style="text-transform: capitalize;">
                            <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                            <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 4px; align-self: end;">
                        <button class="admin-save-btn" onclick="app.saveUserData('${user.uid}')">Save</button>
                        <button class="btn-action-sm" onclick="app.toggleActivityLog('${user.uid}')" title="Activity Logs">📝 Logs</button>
                        <button class="btn-action-sm" onclick="app.sendAdminPasswordReset('${user.email}')" title="Password Reset">🔑 Reset</button>
                        <button class="btn-action-danger-sm" ${isCurrentUser ? 'disabled' : ''} onclick="app.deleteUserAccount('${user.uid}')" title="Delete User">🗑️ Delete</button>
                    </div>

                    <!-- Collapsible Activity Panel -->
                    <div id="activityLog-${user.uid}" class="admin-activity-panel">
                        <h4 style="margin: 0 0 10px 0; font-family: var(--font-display); font-size: var(--font-size-sm); color: var(--color-primary);">User Activity Log & Stats</h4>
                        <div class="admin-activity-grid">
                            <div class="activity-stat-card">
                                <div class="activity-stat-title">Last Login Timestamp</div>
                                <div class="activity-stat-value" style="font-size: var(--font-size-xs);">${lastActiveStr}</div>
                            </div>
                            <div class="activity-stat-card">
                                <div class="activity-stat-title">Habits Configured</div>
                                <div class="activity-stat-value">${user.habits.length}</div>
                            </div>
                            <div class="activity-stat-card">
                                <div class="activity-stat-title">To-Do Tasks</div>
                                <div class="activity-stat-value">${user.tasks.length}</div>
                            </div>
                            <div class="activity-stat-card">
                                <div class="activity-stat-title">Badges Awarded</div>
                                <div class="activity-stat-value" style="font-size: var(--font-size-xs); white-space: normal; line-height: 1.4;">${badgesStr}</div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    }

    toggleActivityLog(uid) {
        const panel = document.getElementById(`activityLog-${uid}`);
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    filterUserTable() {
        const searchQuery = document.getElementById('adminUserSearch').value.toLowerCase().trim();
        const statusFilter = document.getElementById('adminUserStatusFilter').value;

        document.querySelectorAll('.admin-user-row').forEach(row => {
            const name = row.querySelector('.admin-user-name').textContent.toLowerCase();
            const email = row.querySelector('.admin-user-email').textContent.toLowerCase();
            const uid = row.getAttribute('data-uid').toLowerCase();
            const status = row.getAttribute('data-status');

            const matchesSearch = name.includes(searchQuery) || email.includes(searchQuery) || uid.includes(searchQuery);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;

            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    async saveUserData(uid) {
        if (!window.db || !window.firestoreUtils) return;

        const row = document.querySelector(`.admin-user-row[data-uid="${uid}"]`);
        if (!row) return;

        const roleSelect = row.querySelector('[data-field="role"]');
        const statusSelect = row.querySelector('[data-field="status"]');
        const levelInput = row.querySelector('[data-field="level"]');
        const xpInput = row.querySelector('[data-field="xp"]');
        const spendableXpInput = row.querySelector('[data-field="spendableXp"]');
        const saveBtn = row.querySelector('.admin-save-btn');

        const newRole = roleSelect ? roleSelect.value : 'user';
        const newStatus = statusSelect ? statusSelect.value : 'active';
        const newLevel = levelInput ? Math.max(1, parseInt(levelInput.value) || 1) : 1;
        const newXP = xpInput ? Math.max(0, parseInt(xpInput.value) || 0) : 0;
        const newSpendableXp = spendableXpInput ? Math.max(0, parseInt(spendableXpInput.value) || 0) : 0;
        const newSpentXp = Math.max(0, newXP - newSpendableXp);

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        try {
            const { doc, setDoc } = window.firestoreUtils;
            const userRef = doc(window.db, "users", uid);
            await setDoc(userRef, {
                role: newRole,
                status: newStatus,
                userLevel: newLevel,
                userXP: newXP,
                spentXP: newSpentXp
            }, { merge: true });

            // Update row dataset status for filters
            row.setAttribute('data-status', newStatus);

            // If editing current admin
            if (this.currentUser && uid === this.currentUser.uid) {
                this.userLevel = newLevel;
                this.userXP = newXP;
                this.spentXP = newSpentXp;
                localStorage.setItem('userLevel', newLevel);
                localStorage.setItem('userXP', newXP);
                localStorage.setItem('spentXP', newSpentXp);
                this.updateXPUI();
                this.updateBadgeUI();
            }

            const toast = document.createElement('div');
            toast.className = 'admin-save-toast';
            toast.textContent = '✓ Saved';
            row.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        } catch (err) {
            console.error("Error saving user data:", err);
            alert("Failed to save user data.");
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        }
    }

    async deleteUserAccount(uid) {
        if (!window.db || !window.firestoreUtils) return;
        if (!confirm("⚠️ WARNING: Are you sure you want to permanently delete this user document? This action is irreversible.")) return;

        try {
            const { doc, deleteDoc } = window.firestoreUtils;
            await deleteDoc(doc(window.db, "users", uid));
            alert("User document successfully deleted.");
            this.loadAllUsers();
        } catch (err) {
            console.error("Error deleting user document:", err);
            alert("Failed to delete user document.");
        }
    }

    async sendAdminPasswordReset(email) {
        if (!email) return;
        if (!window.firebaseAuth || !window.auth) return;

        try {
            await window.firebaseAuth.sendPasswordResetEmail(window.auth, email);
            alert(`Password reset link successfully broadcasted to ${email}!`);
        } catch (err) {
            console.error("Error broadcasting password reset email:", err);
            alert(`Failed to send password reset: ${err.message}`);
        }
    }

    async saveXPScalingSettings(e) {
        if (e) e.preventDefault();
        if (!window.db || !window.firestoreUtils) return;

        const habitVal = parseInt(document.getElementById('xpScaleHabit').value) || 50;
        const taskVal = parseInt(document.getElementById('xpScaleTask').value) || 30;
        const pomodoroVal = parseInt(document.getElementById('xpScalePomodoro').value) || 150;
        const videoVal = parseInt(document.getElementById('xpScaleVideo').value) || 40;
        const baseVal = parseInt(document.getElementById('xpScaleBase').value) || 500;
        const bountyHoursVal = parseInt(document.getElementById('bountyExpireHours').value) || 24;

        try {
            const { doc, setDoc } = window.firestoreUtils;
            await setDoc(doc(window.db, "settings", "gamification"), {
                habit: habitVal,
                task: taskVal,
                pomodoro: pomodoroVal,
                video: videoVal,
                groupBonus: 200,
                levelBase: baseVal,
                bountyExpireHours: bountyHoursVal
            }, { merge: true });

            alert("Dynamic XP Scaling configurations updated globally!");
            await this.loadGlobalSettings();
        } catch (err) {
            console.error("Error saving dynamic XP scaling settings:", err);
            alert("Failed to save scaling configurations.");
        }
    }

    async createGlobalChallenge(e) {
        if (e) e.preventDefault();
        if (!window.db || !window.firestoreUtils) return;

        const title = document.getElementById('challengeTitle').value;
        const description = document.getElementById('challengeDesc').value;
        const target = parseInt(document.getElementById('challengeTarget').value) || 5;
        const prize = parseInt(document.getElementById('challengePrize').value) || 500;

        try {
            const { doc, setDoc } = window.firestoreUtils;
            const challengeId = "challenge_" + Date.now();
            await setDoc(doc(window.db, "globalChallenges", challengeId), {
                title,
                description,
                target,
                prize,
                created: new Date().toISOString()
            });

            alert("Global challenge published successfully!");
            document.getElementById('adminChallengeForm').reset();
            this.loadAdminActiveChallenges();
        } catch (err) {
            console.error("Error creating global challenge:", err);
            alert("Failed to publish global challenge.");
        }
    }

    async deleteGlobalChallenge(challengeId) {
        if (!window.db || !window.firestoreUtils) return;
        if (!confirm("Are you sure you want to delete this global challenge?")) return;

        try {
            const { doc, deleteDoc } = window.firestoreUtils;
            await deleteDoc(doc(window.db, "globalChallenges", challengeId));
            this.loadAdminActiveChallenges();
        } catch (err) {
            console.error("Error deleting global challenge:", err);
            alert("Failed to delete challenge.");
        }
    }

    async awardBadgeToUser(e) {
        if (e) e.preventDefault();
        if (!window.db || !window.firestoreUtils) return;

        const uid = document.getElementById('badgeTargetUser').value;
        const badge = document.getElementById('badgeName').value;

        if (!uid) {
            alert("Please choose a user to award.");
            return;
        }

        try {
            const { doc, getDoc, setDoc } = window.firestoreUtils;
            const userRef = doc(window.db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const userBadges = userData.badges || [];

                if (userBadges.includes(badge)) {
                    alert("This user already owns this badge!");
                    return;
                }

                userBadges.push(badge);
                await setDoc(userRef, { badges: userBadges }, { merge: true });
                if (uid === this.currentUser.uid) {
                    this.userBadges = userBadges;
                    this.updateBadgeUI();
                }
                alert(`Successfully awarded ${badge} achievement!`);
                document.getElementById('adminBadgeForm').reset();
            }
        } catch (err) {
            console.error("Error awarding badge:", err);
            alert("Failed to award badge.");
        }
    }

    async publishAnnouncement(e) {
        if (e) e.preventDefault();
        if (!window.db || !window.firestoreUtils) return;

        const text = document.getElementById('announcementInputText').value;
        const type = document.getElementById('announcementStyleType').value;
        const active = document.getElementById('announcementIsActive').checked;

        try {
            const { doc, setDoc } = window.firestoreUtils;
            await setDoc(doc(window.db, "settings", "announcements"), {
                text,
                type,
                active,
                publishedAt: new Date().toISOString()
            }, { merge: true });

            alert("System-wide announcement published!");
            await this.loadGlobalSettings();
        } catch (err) {
            console.error("Error publishing announcement:", err);
            alert("Failed to broadcast announcement.");
        }
    }

    showLockoutScreen(status) {
        let lockoutOverlay = document.getElementById('userLockoutScreenOverlay');
        if (!lockoutOverlay) {
            lockoutOverlay = document.createElement('div');
            lockoutOverlay.id = 'userLockoutScreenOverlay';
            lockoutOverlay.className = 'lockout-overlay';
            document.body.appendChild(lockoutOverlay);
        }

        const msg = status === 'banned'
            ? 'This account has been permanently BANNED due to a violation of Mornigami platform guidelines.'
            : 'This account has been temporarily SUSPENDED by the platform administrator.';

        lockoutOverlay.innerHTML = `
            <div class="lockout-card">
                <div class="lockout-icon">🛡️</div>
                <div class="lockout-title">Account Restricted</div>
                <div class="lockout-desc">${msg} Please contact system administration for details.</div>
                <button class="btn-primary" style="width: 100%;" onclick="app.handleLockoutLogout()">Sign Out</button>
            </div>`;
    }

    removeLockoutScreen() {
        const overlay = document.getElementById('userLockoutScreenOverlay');
        if (overlay) {
            overlay.remove();
        }
    }

    handleLockoutLogout() {
        this.removeLockoutScreen();
        if (window.firebaseAuth && window.auth) {
            window.firebaseAuth.signOut(window.auth)
                .then(() => {
                    this.switchPage('habits');
                })
                .catch(err => console.error("Lockout signout error:", err));
        }
    }

    closeAnnouncement() {
        const banner = document.getElementById('globalAnnouncementBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    async renderUserBadges() {
        const showcaseCard = document.getElementById('userBadgesShowcaseCard');
        const container = document.getElementById('userBadgesContainer');
        if (!container || !this.currentUser || !window.db || !window.firestoreUtils) return;

        try {
            const { doc, getDoc } = window.firestoreUtils;
            const snap = await getDoc(doc(window.db, "users", this.currentUser.uid));
            if (snap.exists()) {
                const data = snap.data();
                const badges = data.badges || [];
                if (badges.length > 0) {
                    if (showcaseCard) showcaseCard.style.display = 'block';
                    container.innerHTML = badges.map(b => `
                        <div class="badge-item-pill">
                            <span>${this.escapeHtml(b)}</span>
                        </div>`).join('');
                } else {
                    if (showcaseCard) showcaseCard.style.display = 'none';
                }
            }
        } catch (err) {
            console.error("Error loading user badges showcase:", err);
        }
    }

    async renderUserChallenges() {
        const container = document.getElementById('globalChallengesContainer');
        const listEl = document.getElementById('globalChallengesList');
        if (!listEl || !window.db || !window.firestoreUtils || !this.currentUser) return;

        try {
            const { collection, getDocs, doc, getDoc } = window.firestoreUtils;

            // Get user level progression to check completed challenges
            const userSnap = await getDoc(doc(window.db, "users", this.currentUser.uid));
            const userData = userSnap.data() || {};
            const completedChallenges = userData.completedChallenges || [];

            const snapshot = await getDocs(collection(window.db, "globalChallenges"));
            let html = '';
            let count = 0;

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const challengeId = docSnap.id;

                if (completedChallenges.includes(challengeId)) {
                    return;
                }

                count++;
                html += `
                    <div class="user-challenge-card" data-challenge-id="${challengeId}">
                        <div class="user-challenge-details">
                            <div class="user-challenge-header">
                                <span class="user-challenge-title">${this.escapeHtml(data.title)}</span>
                                <span class="user-challenge-reward">+${data.prize} XP</span>
                            </div>
                            <div class="user-challenge-desc">${this.escapeHtml(data.description)}</div>
                        </div>
                        <button class="user-challenge-complete-btn" onclick="app.claimChallengeReward('${challengeId}', ${data.prize})">Claim</button>
                    </div>`;
            });

            if (count > 0) {
                if (container) container.style.display = 'block';
                listEl.innerHTML = html;
            } else {
                if (container) container.style.display = 'none';
            }
        } catch (err) {
            console.error("Error loading global challenges for user:", err);
        }
    }

    async claimChallengeReward(challengeId, prizeXP) {
        if (!this.currentUser || !window.db || !window.firestoreUtils) return;

        try {
            const { doc, getDoc, setDoc } = window.firestoreUtils;
            const userRef = doc(window.db, "users", this.currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                const completed = userData.completedChallenges || [];

                if (completed.includes(challengeId)) return;
                completed.push(challengeId);

                await setDoc(userRef, { completedChallenges: completed }, { merge: true });

                // Award XP
                this.gainXP(prizeXP, "Platform Challenge Completed!");

                // Refresh challenges list
                this.renderUserChallenges();
            }
        } catch (err) {
            console.error("Error claiming challenge reward:", err);
            alert("Failed to claim challenge reward.");
        }
    }

    async loadGlobalSettings() {
        if (!window.db || !window.firestoreUtils) return;
        const { doc, getDoc } = window.firestoreUtils;

        // 1. Load XP Scaling Settings
        try {
            const snap = await getDoc(doc(window.db, "settings", "gamification"));
            if (snap.exists()) {
                const data = snap.data();
                this.xpConfig = {
                    habit: data.habit || 50,
                    task: data.task || 30,
                    pomodoro: data.pomodoro || 150,
                    video: data.video || 40,
                    groupBonus: data.groupBonus || 200,
                    levelBase: data.levelBase || 500,
                    bountyExpireHours: data.bountyExpireHours || 24,
                    financeBonus: data.financeBonus || 50
                };
                this.updateXPUI();
            }
        } catch (err) {
            console.error("Error loading scaling settings:", err);
        }

        // 2. Load System-Wide Announcement
        try {
            const snap = await getDoc(doc(window.db, "settings", "announcements"));
            if (snap.exists()) {
                const data = snap.data();
                const banner = document.getElementById('globalAnnouncementBanner');
                const bannerText = document.getElementById('announcementText');
                if (data.active && data.text) {
                    if (banner && bannerText) {
                        bannerText.textContent = data.text;
                        banner.className = `announcement-banner banner-${data.type || 'info'}`;
                        banner.style.display = 'flex';
                    }
                } else {
                    if (banner) banner.style.display = 'none';
                }
            }
        } catch (err) {
            console.error("Error loading system announcements:", err);
        }
    }

    // ============================================
    // SETTINGS PAGE
    // ============================================



    setupSettingsEventListeners() {
        const eyeOpenSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        const eyeClosedSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

        const showMsg = (elId, text, type) => {
            const el = document.getElementById(elId);
            if (el) {
                el.textContent = text;
                el.className = `settings-msg ${type}`;
            }
        };

        const clearMsg = (elId) => {
            const el = document.getElementById(elId);
            if (el) { el.className = 'settings-msg'; el.style.display = 'none'; }
        };

        // Back button
        const backBtn = document.getElementById('settingsBackBtn');
        if (backBtn) backBtn.addEventListener('click', () => this.switchPage('habits'));

        // Password eye toggles
        document.querySelectorAll('.password-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (!input) return;
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.innerHTML = eyeOpenSVG;
                } else {
                    input.type = 'password';
                    btn.innerHTML = eyeClosedSVG;
                }
            });
        });

        // Upload Picture — trigger hidden file input
        const uploadPictureBtn = document.getElementById('uploadPictureBtn');
        const pictureFileInput = document.getElementById('pictureFileInput');
        if (uploadPictureBtn && pictureFileInput) {
            uploadPictureBtn.addEventListener('click', () => pictureFileInput.click());

            pictureFileInput.addEventListener('change', async () => {
                const file = pictureFileInput.files[0];
                if (!file) return;

                // Validate file type and size (max 2MB)
                if (!file.type.startsWith('image/')) {
                    showMsg('pictureMsg', 'Please select an image file.', 'error');
                    return;
                }
                if (file.size > 2 * 1024 * 1024) {
                    showMsg('pictureMsg', 'Image must be smaller than 2MB.', 'error');
                    return;
                }

                clearMsg('pictureMsg');
                showMsg('pictureMsg', 'Uploading...', 'success');

                try {
                    // Read and resize image to base64
                    const base64 = await this.resizeImageToBase64(file, 200);

                    // Save to Firestore (base64 stored directly)
                    if (window.db && window.firestoreUtils) {
                        const { doc, setDoc } = window.firestoreUtils;
                        await setDoc(doc(window.db, "users", this.currentUser.uid), { profilePicUrl: base64 }, { merge: true });
                    }

                    // Update Firebase Auth photoURL with the base64 (short data URIs work)
                    await window.firebaseAuth.updateProfile(window.auth.currentUser, { photoURL: base64 }).catch(() => {
                        // photoURL has a length limit in Firebase Auth — store only in Firestore if too long
                        console.warn('photoURL too long for Auth profile, stored in Firestore only.');
                    });

                    // Update preview
                    this._cachedProfilePic = base64;
                    document.getElementById('settingsAvatarPreview').innerHTML = `<img src="${base64}" alt="Profile">`;
                    this.updateNavbarAvatar(base64, this.currentUser.displayName, this.currentUser.email);
                    showMsg('pictureMsg', 'Profile picture updated!', 'success');
                } catch (err) {
                    showMsg('pictureMsg', err.message || 'Failed to upload picture.', 'error');
                }
            });
        }

        // Remove Picture
        const removePictureBtn = document.getElementById('removePictureBtn');
        if (removePictureBtn) {
            removePictureBtn.addEventListener('click', async () => {
                clearMsg('pictureMsg');
                try {
                    await window.firebaseAuth.updateProfile(window.auth.currentUser, { photoURL: '' });
                    if (window.db && window.firestoreUtils) {
                        const { doc, setDoc } = window.firestoreUtils;
                        await setDoc(doc(window.db, "users", this.currentUser.uid), { profilePicUrl: null }, { merge: true });
                    }
                    this._cachedProfilePic = null;
                    const initial = ((this.currentUser?.displayName || this.currentUser?.email || 'U').charAt(0)).toUpperCase();
                    document.getElementById('settingsAvatarPreview').innerHTML = `<div class="avatar-fallback-lg">${initial}</div>`;
                    this.updateNavbarAvatar(null, this.currentUser.displayName, this.currentUser.email);
                    showMsg('pictureMsg', 'Profile picture removed.', 'success');
                } catch (err) {
                    showMsg('pictureMsg', err.message || 'Failed to remove picture.', 'error');
                }
            });
        }

        // Save Username
        const saveUsernameBtn = document.getElementById('saveUsernameBtn');
        if (saveUsernameBtn) {
            saveUsernameBtn.addEventListener('click', async () => {
                clearMsg('usernameMsg');
                const newUsername = document.getElementById('settingsUsername')?.value.trim();
                if (!newUsername) { showMsg('usernameMsg', 'Username cannot be empty.', 'error'); return; }

                const oldUsername = this.currentUser?.displayName;
                if (newUsername === oldUsername) { showMsg('usernameMsg', 'Username is already set to this.', 'success'); return; }

                try {
                    // Check if new username is taken
                    if (window.db && window.firestoreUtils) {
                        const { doc, getDoc, setDoc, deleteDoc } = window.firestoreUtils;
                        const newRef = doc(window.db, "usernames", newUsername.toLowerCase());
                        const snap = await getDoc(newRef);
                        if (snap.exists() && snap.data().uid !== this.currentUser.uid) {
                            showMsg('usernameMsg', 'This username is already taken.', 'error');
                            return;
                        }

                        // Update profile
                        await window.firebaseAuth.updateProfile(window.auth.currentUser, { displayName: newUsername });

                        // Delete old mapping
                        if (oldUsername) {
                            const oldRef = doc(window.db, "usernames", oldUsername.toLowerCase());
                            await deleteDoc(oldRef).catch(() => { });
                        }
                        // Create new mapping
                        await setDoc(newRef, { email: this.currentUser.email, uid: this.currentUser.uid });
                    } else {
                        await window.firebaseAuth.updateProfile(window.auth.currentUser, { displayName: newUsername });
                    }

                    this.onUserStatusChanged(window.auth.currentUser);
                    showMsg('usernameMsg', 'Username updated successfully!', 'success');
                } catch (err) {
                    showMsg('usernameMsg', err.message || 'Failed to update username.', 'error');
                }
            });
        }

        // Save Email
        const saveEmailBtn = document.getElementById('saveEmailBtn');
        if (saveEmailBtn) {
            saveEmailBtn.addEventListener('click', async () => {
                clearMsg('emailMsg');
                const newEmail = document.getElementById('settingsEmail')?.value.trim();
                const password = document.getElementById('emailReauthPassword')?.value;

                if (!newEmail) { showMsg('emailMsg', 'Email cannot be empty.', 'error'); return; }
                if (!password) { showMsg('emailMsg', 'Please enter your current password to change email.', 'error'); return; }
                if (newEmail === this.currentUser?.email) { showMsg('emailMsg', 'Email is already set to this.', 'success'); return; }

                try {
                    const credential = window.firebaseAuth.EmailAuthProvider.credential(this.currentUser.email, password);
                    await window.firebaseAuth.reauthenticateWithCredential(window.auth.currentUser, credential);
                    await window.firebaseAuth.updateEmail(window.auth.currentUser, newEmail);

                    // Update username mapping if exists
                    if (this.currentUser.displayName && window.db && window.firestoreUtils) {
                        const { doc, setDoc } = window.firestoreUtils;
                        const usernameRef = doc(window.db, "usernames", this.currentUser.displayName.toLowerCase());
                        await setDoc(usernameRef, { email: newEmail, uid: this.currentUser.uid }, { merge: true });
                    }

                    this.onUserStatusChanged(window.auth.currentUser);
                    showMsg('emailMsg', 'Email updated successfully!', 'success');
                    document.getElementById('emailReauthPassword').value = '';
                } catch (err) {
                    let msg = err.message;
                    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Incorrect password.';
                    else if (err.code === 'auth/email-already-in-use') msg = 'This email is already in use.';
                    else if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email.';
                    showMsg('emailMsg', msg, 'error');
                }
            });
        }

        // Change Password
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', async () => {
                clearMsg('passwordMsg');
                const currentPw = document.getElementById('currentPassword')?.value;
                const newPw = document.getElementById('newPassword')?.value;
                const confirmPw = document.getElementById('confirmPassword')?.value;

                if (!currentPw) { showMsg('passwordMsg', 'Please enter your current password.', 'error'); return; }
                if (!newPw) { showMsg('passwordMsg', 'Please enter a new password.', 'error'); return; }
                if (newPw.length < 6) { showMsg('passwordMsg', 'New password must be at least 6 characters.', 'error'); return; }
                if (newPw !== confirmPw) { showMsg('passwordMsg', 'New passwords do not match.', 'error'); return; }

                try {
                    const credential = window.firebaseAuth.EmailAuthProvider.credential(this.currentUser.email, currentPw);
                    await window.firebaseAuth.reauthenticateWithCredential(window.auth.currentUser, credential);
                    await window.firebaseAuth.updatePassword(window.auth.currentUser, newPw);

                    showMsg('passwordMsg', 'Password updated successfully!', 'success');
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                } catch (err) {
                    let msg = err.message;
                    if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'Current password is incorrect.';
                    else if (err.code === 'auth/weak-password') msg = 'New password is too weak. Use at least 6 characters.';
                    showMsg('passwordMsg', msg, 'error');
                }
            });
        }
    }

    // ============================================
    // DAILY BOUNTIES SYSTEM
    // ============================================

    checkAndResetDailyBounties(force = false) {
        const now = new Date();
        const dateStr = now.toDateString();
        
        let savedStats = this.loadData('bountyStats');
        let savedBounties = this.loadData('dailyBounties');
        
        const expireHours = this.xpConfig?.bountyExpireHours || 24;
        const expireMs = expireHours * 3600 * 1000;
        
        let shouldReset = force || !savedStats || savedStats.dateStr !== dateStr;
        if (!shouldReset && savedStats && savedStats.generationTime) {
            const elapsed = now.getTime() - savedStats.generationTime;
            if (elapsed >= expireMs) {
                shouldReset = true;
            }
        }
        
        if (shouldReset) {
            this.bountyStats = {
                pomodorosCompletedToday: 0,
                habitsCompletedToday: 0,
                tasksCompletedToday: 0,
                dateStr: dateStr,
                generationTime: now.getTime()
            };
            this.dailyBounties = [
                { id: 'bounty_pomodoro', text: '🍅 Pomodoro Blitz: Complete a Focus Session today', reward: 300, completed: false, countNeeded: 1, currentCount: 0 },
                { id: 'bounty_habits', text: '⚡ Habit Crease: Complete 3 habits today', reward: 200, completed: false, countNeeded: 3, currentCount: 0 },
                { id: 'bounty_todo', text: '📝 Task Fold: Complete 2 checklist tasks today', reward: 150, completed: false, countNeeded: 2, currentCount: 0 }
            ];
            this.saveData('bountyStats', this.bountyStats);
            this.saveData('dailyBounties', this.dailyBounties);
        } else {
            this.bountyStats = savedStats;
            this.dailyBounties = savedBounties || [];
        }
    }

    updateBountyCountdown() {
        if (!this.bountyStats || !this.bountyStats.generationTime) return;
        const now = new Date();
        
        const expireHours = this.xpConfig?.bountyExpireHours || 24;
        const expireMs = expireHours * 3600 * 1000;
        const expirationTime = this.bountyStats.generationTime + expireMs;
        const diffMs = expirationTime - now.getTime();
        
        if (diffMs <= 0) {
            this.checkAndResetDailyBounties(true);
            return;
        }
        
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        
        const pad = (num) => String(num).padStart(2, '0');
        const el = document.getElementById('bountyCountdown');
        if (el) {
            el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }
    }

    renderDailyBounties() {
        const el = document.getElementById('dailyBountiesList');
        if (!el) return;
        
        el.innerHTML = '';
        if (this.dailyBounties.length === 0) {
            el.innerHTML = '<p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); text-align: center; margin: 0;">No bounties active today.</p>';
            return;
        }
        
        this.dailyBounties.forEach(b => {
            const item = document.createElement('div');
            item.className = `bounty-item ${b.completed ? 'completed' : ''}`;
            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                    <input type="checkbox" disabled ${b.completed ? 'checked' : ''} style="accent-color: var(--color-success); width: 16px; height: 16px;">
                    <span class="bounty-title-text" style="color: var(--color-text-primary); font-size: var(--font-size-sm); font-weight: 600; ${b.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${b.text} (${b.currentCount}/${b.countNeeded})</span>
                </div>
                <span class="bounty-reward-badge" style="${b.completed ? 'opacity: 0.5;' : ''}">+${b.reward} XP</span>
            `;
            el.appendChild(item);
        });
    }

    trackBountyProgress(type, amount = 1) {
        this.checkAndResetDailyBounties();
        
        if (type === 'pomodoro') this.bountyStats.pomodorosCompletedToday += amount;
        else if (type === 'habits') this.bountyStats.habitsCompletedToday += amount;
        else if (type === 'tasks') this.bountyStats.tasksCompletedToday += amount;
        
        this.saveData('bountyStats', this.bountyStats);
        
        let changed = false;
        this.dailyBounties.forEach(b => {
            if (b.id === 'bounty_pomodoro') b.currentCount = this.bountyStats.pomodorosCompletedToday;
            else if (b.id === 'bounty_habits') b.currentCount = this.bountyStats.habitsCompletedToday;
            else if (b.id === 'bounty_todo') b.currentCount = this.bountyStats.tasksCompletedToday;
            
            if (b.currentCount >= b.countNeeded && !b.completed) {
                b.completed = true;
                changed = true;
                this.gainXP(b.reward, `Bounty Completed: ${b.id}`);
            }
        });
        
        if (changed) {
            this.saveData('dailyBounties', this.dailyBounties);
        }
        
        if (this.currentPage === 'home') {
            this.renderDailyBounties();
        }
    }

    // ============================================
    // AMBIENT FOCUS AUDIO PLAYER
    // ============================================

    toggleFocusAudio() {
        const btn = document.getElementById('audioPlayPauseBtn');
        if (!btn) return;
        
        if (this.focusAudioPlaying) {
            this.focusAudio.pause();
            this.focusAudioPlaying = false;
            btn.textContent = '▶';
            btn.classList.remove('active');
        } else {
            this.focusAudio.src = this.audioTracks[this.focusAudioTrack];
            this.focusAudio.play().catch(err => console.error("Error playing ambience:", err));
            this.focusAudioPlaying = true;
            btn.textContent = '⏸️';
            btn.classList.add('active');
        }
        this.syncFocusAudioUI();
    }

    setFocusAudioVolume(val) {
        this.focusAudio.volume = parseFloat(val);
    }

    selectFocusAudioTrack(track) {
        this.focusAudioTrack = track;
        if (this.focusAudioPlaying) {
            this.focusAudio.src = this.audioTracks[track];
            this.focusAudio.play().catch(err => console.error("Error changing ambience track:", err));
        }
        this.syncFocusAudioUI();
    }

    syncFocusAudioUI() {
        // Update track active class
        ['lofi', 'rain', 'cafe'].forEach(t => {
            const btn = document.getElementById(`track${t.charAt(0).toUpperCase() + t.slice(1)}`);
            if (btn) {
                if (this.focusAudioTrack === t) btn.classList.add('active');
                else btn.classList.remove('active');
            }
        });
        
        const btn = document.getElementById('audioPlayPauseBtn');
        if (btn) {
            btn.textContent = this.focusAudioPlaying ? '⏸️' : '▶';
            if (this.focusAudioPlaying) btn.classList.add('active');
            else btn.classList.remove('active');
        }
        
        const slider = document.getElementById('audioVolumeSlider');
        if (slider) {
            slider.value = this.focusAudio.volume;
        }
    }

    // ============================================
    // VIRTUAL STORE & PROFILE CUSTOMIZATION
    // ============================================

    switchStoreTab(tab) {
        this.currentStoreTab = tab;
        ['colors', 'avatars', 'borders'].forEach(t => {
            const btn = document.getElementById(`storeTab${t.charAt(0).toUpperCase() + t.slice(1)}Btn`);
            if (btn) {
                if (t === tab) {
                    btn.style.borderBottom = '3px solid var(--color-primary)';
                    btn.style.color = 'var(--color-primary)';
                } else {
                    btn.style.borderBottom = '3px solid transparent';
                    btn.style.color = 'var(--color-text-secondary)';
                }
            }
        });
        this.renderStore();
    }

    renderStore() {
        const balanceEl = document.getElementById('storeBalanceText');
        const gridEl = document.getElementById('storeGrid');
        if (!gridEl) return;
        
        const spendableXP = Math.max(0, this.userXP - this.spentXP);
        if (balanceEl) balanceEl.textContent = spendableXP;
        
        gridEl.innerHTML = '';
        const items = this.storeItems[this.currentStoreTab] || [];
        
        items.forEach(item => {
            const unlockedList = this.unlockedItems[this.currentStoreTab] || [];
            const isUnlocked = unlockedList.includes(item.id);
            
            let isActive = false;
            if (this.currentStoreTab === 'colors') {
                isActive = (localStorage.getItem('accentColor') === item.value);
            } else if (this.currentStoreTab === 'avatars') {
                isActive = (this.activeAvatar === item.value);
            } else if (this.currentStoreTab === 'borders') {
                isActive = (this.activeBorder === item.value);
            }
            
            let btnHtml = '';
            let statusHtml = '';
            
            if (isActive) {
                btnHtml = `<button class="btn-secondary" disabled style="width: 100%; cursor: default; font-weight: 700;">Applied</button>`;
                statusHtml = `<span class="store-card-badge applied">Applied</span>`;
            } else if (isUnlocked) {
                btnHtml = `<button class="btn-primary" onclick="app.applyStoreItem('${this.currentStoreTab}', '${item.value}')" style="width: 100%; font-weight: 700; cursor: pointer;">Apply customize</button>`;
                statusHtml = `<span class="store-card-badge purchased">Purchased</span>`;
            } else {
                const canAfford = spendableXP >= item.cost;
                btnHtml = `<button class="btn-primary" onclick="app.buyStoreItem('${this.currentStoreTab}', '${item.id}', ${item.cost})" ${canAfford ? '' : 'disabled'} style="width: 100%; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; ${canAfford ? '' : 'opacity: 0.6;'}">Unlock: ${item.cost} XP</button>`;
                statusHtml = `<span class="store-card-badge locked">Locked</span>`;
            }
            
            const card = document.createElement('div');
            card.className = `store-card ${isUnlocked ? 'unlocked' : ''} ${isActive ? 'active' : ''}`;
            card.innerHTML = `
                ${statusHtml}
                <div style="font-size: 2.2rem; text-align: center; margin-top: 10px; height: 50px; display: flex; align-items: center; justify-content: center;">
                    ${this.currentStoreTab === 'colors' ? `<div style="width: 38px; height: 38px; border-radius: 50%; background: ${item.value}; border: 1.5px solid var(--color-border);"></div>` : item.value}
                </div>
                <div style="text-align: center;">
                    <h3 style="font-family: var(--font-display); font-size: var(--font-size-md); font-weight: 700; margin: 0 0 4px 0;">${item.name}</h3>
                    <p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); margin: 0; line-height: 1.4; height: 36px; overflow: hidden;">${item.desc}</p>
                </div>
                <div style="margin-top: auto; padding-top: var(--spacing-sm);">
                    ${btnHtml}
                </div>
            `;
            gridEl.appendChild(card);
        });
    }

    buyStoreItem(tab, itemId, cost) {
        const spendableXP = Math.max(0, this.userXP - this.spentXP);
        if (spendableXP < cost) {
            alert("Not enough XP balance!");
            return;
        }
        
        this.spentXP += cost;
        if (!this.unlockedItems[tab]) {
            this.unlockedItems[tab] = [];
        }
        this.unlockedItems[tab].push(itemId);
        
        this.saveCustomizerState();
        this.renderStore();
        alert("Unlock successful!");
    }

    applyStoreItem(tab, val) {
        if (tab === 'colors') {
            localStorage.setItem('accentColor', val);
            this.applyTheme();
            if (this.currentUser && window.db && window.firestoreUtils) {
                const { doc, setDoc } = window.firestoreUtils;
                setDoc(doc(window.db, "users", this.currentUser.uid), { activeColor: val }, { merge: true }).catch(() => {});
            }
        } else if (tab === 'avatars') {
            this.activeAvatar = val;
            this.updateNavbarAvatar(this._cachedProfilePic, this.currentUser?.displayName, this.currentUser?.email);
        } else if (tab === 'borders') {
            this.activeBorder = val;
            this.updateBadgeUI();
        }
        
        this.saveCustomizerState();
        this.renderStore();
    }

    saveCustomizerState() {
        localStorage.setItem('spentXP', this.spentXP);
        localStorage.setItem('unlockedItems', JSON.stringify(this.unlockedItems));
        localStorage.setItem('activeAvatar', this.activeAvatar);
        localStorage.setItem('activeBorder', this.activeBorder);
        localStorage.setItem('friendsList', JSON.stringify(this.friendsList));

        if (this.currentUser && window.db && window.firestoreUtils) {
            const { doc, setDoc } = window.firestoreUtils;
            const userRef = doc(window.db, "users", this.currentUser.uid);
            setDoc(userRef, {
                spentXP: this.spentXP,
                unlockedItems: this.unlockedItems,
                activeAvatar: this.activeAvatar,
                activeBorder: this.activeBorder,
                friends: this.friendsList
            }, { merge: true }).catch(err => console.error("Error saving customization state to cloud:", err));
        }
    }

    // ============================================
    // HONOR SYSTEM & MONTHLY WRAP-UP
    // ============================================

    openMonthlyWrapUp() {
        const modal = document.getElementById('monthlyWrapUpModal');
        if (!modal) return;
        
        const totalFocusMin = this.pomodoroStats.totalFocusTime || 0;
        const totalFocusHr = Math.round(totalFocusMin / 60);
        const habitsKept = this.habits.reduce((acc, h) => acc + (h.progress ? h.progress.filter(Boolean).length : 0), 0);
        const tasksFinished = this.tasks.filter(t => t.completed).length;
        
        const xpGained = (this.userLevel - 1) * 500 + this.userXP;
        
        document.getElementById('wrapUpFocusTime').textContent = `${totalFocusHr}h`;
        document.getElementById('wrapUpHabitsKept').textContent = habitsKept;
        document.getElementById('wrapUpTasksDone').textContent = tasksFinished;
        document.getElementById('wrapUpXPGained').textContent = `${xpGained} XP`;
        
        let honorStatus = "Bronze Origami Seedling 🌱 - Shaping your routine creases!";
        if (habitsKept + tasksFinished + totalFocusHr > 20) {
            honorStatus = "Gold Origami Crane 🕊️ - Master Consistency!";
        } else if (habitsKept + tasksFinished + totalFocusHr > 8) {
            honorStatus = "Silver Origami Frog 🐸 - Steady Progress!";
        }
        
        document.getElementById('wrapUpHonorStatus').textContent = honorStatus;
        
        modal.classList.add('active');
    }

    // ============================================
    // COMMUNITY LEADERBOARD & FRIENDS
    // ============================================

    async renderCommunity() {
        const leaderboardList = document.getElementById('leaderboardList');
        const friendsList = document.getElementById('friendsList');
        if (!leaderboardList || !friendsList) return;
        
        leaderboardList.innerHTML = '<div class="admin-loading" style="padding: var(--spacing-lg);">Loading Top Achievers...</div>';
        friendsList.innerHTML = '<div class="admin-loading" style="padding: var(--spacing-lg);">Loading Friends Camp...</div>';
        
        try {
            let sortedUsers = [];
            if (window.db && window.firestoreUtils) {
                const { collection, getDocs } = window.firestoreUtils;
                const snapshot = await getDocs(collection(window.db, "users"));
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    sortedUsers.push({
                        uid: docSnap.id,
                        displayName: data.displayName || data.username || "Anonymous Folder",
                        userLevel: data.userLevel || 1,
                        userXP: data.userXP || 0,
                        avatar: data.activeAvatar || '🌱'
                    });
                });
            }
            
            if (sortedUsers.length === 0) {
                sortedUsers = [
                    { uid: 'mock1', displayName: 'Fold Master 🏆', userLevel: 12, userXP: 340, avatar: '🕊️' },
                    { uid: 'mock2', displayName: 'Morning Light 🌅', userLevel: 8, userXP: 210, avatar: '🦊' },
                    { uid: 'mock3', displayName: 'Pomodoro King 🍅', userLevel: 7, userXP: 150, avatar: '🐸' },
                    { uid: this.currentUser?.uid || 'curr', displayName: this.currentUser?.displayName || 'You', userLevel: this.userLevel, userXP: this.userXP, avatar: this.activeAvatar || '🌱' }
                ];
            }
            
            sortedUsers.sort((a, b) => {
                if (b.userLevel !== a.userLevel) return b.userLevel - a.userLevel;
                return b.userXP - a.userXP;
            });
            
            leaderboardList.innerHTML = '';
            sortedUsers.forEach((u, idx) => {
                const rank = idx + 1;
                let rankClass = 'normal';
                let rankText = rank;
                if (rank === 1) { rankClass = 'first'; rankText = '🥇'; }
                else if (rank === 2) { rankClass = 'second'; rankText = '🥈'; }
                else if (rank === 3) { rankClass = 'third'; rankText = '🥉'; }
                
                const isCurrent = (u.uid === this.currentUser?.uid);
                
                const row = document.createElement('div');
                row.className = `leaderboard-row ${isCurrent ? 'current-user' : ''}`;
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                        <span class="rank-badge ${rankClass}">${rankText}</span>
                        <span style="font-size: 1.25rem;">${u.avatar}</span>
                        <span style="font-weight: 700; font-size: var(--font-size-sm); color: var(--color-text-primary);">${u.displayName}</span>
                    </div>
                    <div style="font-size: var(--font-size-xs); font-weight: 700; color: var(--color-primary);">Lvl ${u.userLevel} (${u.userXP} XP)</div>
                `;
                leaderboardList.appendChild(row);
            });
            
        } catch (err) {
            console.error("Leaderboard error:", err);
            leaderboardList.innerHTML = '<p style="font-size: var(--font-size-sm); color: var(--color-danger); text-align: center;">Failed to load leaderboard ranking.</p>';
        }
        
        this.renderFriendsCamp();
    }

    async renderFriendsCamp() {
        const friendsList = document.getElementById('friendsList');
        if (!friendsList) return;
        
        friendsList.innerHTML = '';
        if (this.friendsList.length === 0) {
            friendsList.innerHTML = '<p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); text-align: center; margin: auto;">No friends added yet. Enter a username above to start competing!</p>';
            return;
        }
        
        try {
            if (window.db && window.firestoreUtils) {
                const { doc, getDoc } = window.firestoreUtils;
                for (const friendUid of this.friendsList) {
                    const friendRef = doc(window.db, "users", friendUid);
                    const friendSnap = await getDoc(friendRef);
                    if (friendSnap.exists()) {
                        const data = friendSnap.data();
                        
                        const row = document.createElement('div');
                        row.className = 'friend-row';
                        row.innerHTML = `
                            <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                                <span style="font-size: 1.25rem;">${data.activeAvatar || '🌱'}</span>
                                <div>
                                    <div style="font-weight: 700; font-size: var(--font-size-sm); color: var(--color-text-primary);">${data.displayName || data.username || 'Friend'}</div>
                                    <div style="font-size: 10px; color: var(--color-text-secondary); font-weight: 600;">Level ${data.userLevel || 1} • Streak: ${data.pomodoroStats?.currentStreak || 0}🍅</div>
                                </div>
                            </div>
                            <button class="btn-icon" onclick="app.removeFriend('${friendUid}')" title="Remove Friend" style="color: var(--color-danger); padding: 4px; font-size: var(--font-size-sm); border: none; background: transparent; cursor: pointer;">
                                &times;
                            </button>
                        `;
                        friendsList.appendChild(row);
                    }
                }
            } else {
                friendsList.innerHTML = '<p style="font-size: var(--font-size-xs); color: var(--color-text-secondary); text-align: center;">Connect to Firebase online to sync friends.</p>';
            }
        } catch (err) {
            console.error("Friends load error:", err);
            friendsList.innerHTML = '<p style="font-size: var(--font-size-xs); color: var(--color-danger); text-align: center;">Failed to load friends camp.</p>';
        }
    }

    async handleAddFriend(e) {
        if (e) e.preventDefault();
        const input = document.getElementById('friendUsernameInput');
        const msgEl = document.getElementById('friendAddMsg');
        if (!input || !msgEl) return;
        
        const username = input.value.trim();
        if (!username) return;
        
        msgEl.textContent = 'Searching...';
        msgEl.style.color = 'var(--color-text-secondary)';
        
        try {
            if (window.db && window.firestoreUtils) {
                const { doc, getDoc } = window.firestoreUtils;
                const usernameRef = doc(window.db, "usernames", username.toLowerCase());
                const snap = await getDoc(usernameRef);
                
                if (snap.exists()) {
                    const friendUid = snap.data().uid;
                    
                    if (friendUid === this.currentUser?.uid) {
                        msgEl.textContent = "You cannot add yourself!";
                        msgEl.style.color = 'var(--color-danger)';
                        return;
                    }
                    
                    if (this.friendsList.includes(friendUid)) {
                        msgEl.textContent = "This friend is already added!";
                        msgEl.style.color = 'var(--color-warning)';
                        return;
                    }
                    
                    this.friendsList.push(friendUid);
                    this.saveCustomizerState();
                    msgEl.textContent = "Friend added successfully!";
                    msgEl.style.color = 'var(--color-success)';
                    input.value = '';
                    this.renderFriendsCamp();
                } else {
                    msgEl.textContent = "Username not found.";
                    msgEl.style.color = 'var(--color-danger)';
                }
            } else {
                msgEl.textContent = "Database offline.";
                msgEl.style.color = 'var(--color-danger)';
            }
        } catch (err) {
            console.error("Add friend error:", err);
            msgEl.textContent = "Error adding friend.";
            msgEl.style.color = 'var(--color-danger)';
        }
    }

    removeFriend(friendUid) {
        this.friendsList = this.friendsList.filter(id => id !== friendUid);
        this.saveCustomizerState();
        this.renderFriendsCamp();
    }

    // ============================================
    // FINANCIAL TRACKER MODULE
    // ============================================

    initFinancePage() {
        const currentMonthYear = new Date().toISOString().substring(0, 7); // YYYY-MM
        
        // If current month is different, auto-reset for new month
        if (this.financeData.monthYear !== currentMonthYear) {
            this.financeData = {
                monthYear: currentMonthYear,
                monthlyIncome: 0,
                dailyBudget: 0,
                expenses: [],
                xpBonusClaimedDates: {}
            };
            this.saveData('financeData', this.financeData);
        }

        const setupContainer = document.getElementById('financeSetupContainer');
        const dashboardContainer = document.getElementById('financeDashboardContainer');
        const headerActions = document.getElementById('financeHeaderActions');

        if (!setupContainer || !dashboardContainer || !headerActions) return;

        if (this.financeData.monthlyIncome === 0) {
            setupContainer.style.display = 'block';
            dashboardContainer.style.display = 'none';
            headerActions.style.display = 'none';
        } else {
            setupContainer.style.display = 'none';
            dashboardContainer.style.display = 'block';
            headerActions.style.display = 'flex';
            this.checkYesterdayFinanceXP();
            this.renderFinanceDashboard();
        }
    }

    handleFinanceSetup(event) {
        if (event) event.preventDefault();
        const incomeInput = document.getElementById('financeIncomeInput');
        if (!incomeInput) return;

        const income = parseFloat(incomeInput.value);
        if (isNaN(income) || income <= 0) return;

        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyBudget = parseFloat((income / daysInMonth).toFixed(2));

        this.financeData.monthlyIncome = income;
        this.financeData.dailyBudget = dailyBudget;
        this.financeData.monthYear = now.toISOString().substring(0, 7);
        this.financeData.expenses = [];
        this.financeData.xpBonusClaimedDates = {};

        const defaults = this.loadData('adminDefaultCategories') || ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗'];
        this.financeData.categories = [...defaults];

        this.saveData('financeData', this.financeData);
        this.switchPage('finance');
    }

    resetFinanceMonth() {
        if (confirm("Are you sure you want to reset your budget and expenses for this month? This action cannot be undone.")) {
            this.financeData.monthlyIncome = 0;
            this.financeData.dailyBudget = 0;
            this.financeData.expenses = [];
            this.financeData.xpBonusClaimedDates = {};

            this.saveData('financeData', this.financeData);
            this.switchPage('finance');
        }
    }

    selectPresetTag(button, text, category) {
        // Clear active class from all tag buttons
        const grid = button.parentElement;
        if (grid) {
            grid.querySelectorAll('.preset-tag-btn').forEach(btn => btn.classList.remove('active'));
        }
        button.classList.add('active');

        // Populate fields
        const descInput = document.getElementById('expenseNameInput');
        if (descInput) {
            descInput.value = text;
        }

        const catInput = document.getElementById('selectedExpenseCategory');
        if (catInput) {
            catInput.value = category;
        }
    }

    handleLogExpense(event) {
        if (event) event.preventDefault();

        const nameInput = document.getElementById('expenseNameInput');
        const amountInput = document.getElementById('expenseAmountInput');
        const catInput = document.getElementById('selectedExpenseCategory');

        if (!nameInput || !amountInput || !catInput) return;

        const name = nameInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const category = catInput.value || 'General';

        if (!name || isNaN(amount) || amount <= 0) return;

        const expense = {
            id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name,
            amount: amount,
            category: category,
            date: new Date().toISOString()
        };

        this.financeData.expenses.push(expense);
        this.saveData('financeData', this.financeData);

        // Reset fields
        nameInput.value = '';
        amountInput.value = '';
        catInput.value = '';
        
        // Remove active class from buttons
        document.querySelectorAll('.preset-tags-grid .preset-tag-btn').forEach(btn => btn.classList.remove('active'));

        // Update dashboard
        this.renderFinanceDashboard();
    }

    deleteExpense(id) {
        if (confirm("Are you sure you want to delete this purchase log?")) {
            this.financeData.expenses = this.financeData.expenses.filter(e => e.id !== id);
            this.saveData('financeData', this.financeData);
            this.renderFinanceDashboard();
        }
    }

    claimFinanceXP() {
        const todayDateStr = new Date().toDateString();
        
        // Calculate today's spent
        const todayExpenses = this.financeData.expenses.filter(e => new Date(e.date).toDateString() === todayDateStr);
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        if (todaySpent <= this.financeData.dailyBudget && !this.financeData.xpBonusClaimedDates[todayDateStr]) {
            this.financeData.xpBonusClaimedDates[todayDateStr] = true;
            this.saveData('financeData', this.financeData);
            const rewardXP = this.xpConfig.financeBonus || 50;
            this.gainXP(rewardXP, "Mindful Spending Daily Bonus");
            this.renderFinanceDashboard();
        }
    }

    checkYesterdayFinanceXP() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        // Calculate yesterday's spent
        const yesterdayExpenses = this.financeData.expenses.filter(e => new Date(e.date).toDateString() === yesterdayStr);
        const yesterdaySpent = yesterdayExpenses.reduce((sum, e) => sum + e.amount, 0);

        // If stayed under budget and not claimed yet
        if (this.financeData.dailyBudget > 0 && yesterdaySpent <= this.financeData.dailyBudget && !this.financeData.xpBonusClaimedDates[yesterdayStr]) {
            this.financeData.xpBonusClaimedDates[yesterdayStr] = true;
            this.saveData('financeData', this.financeData);
            
            // Trigger XP gain with slight delay to ensure UI is ready
            setTimeout(() => {
                const rewardXP = this.xpConfig.financeBonus || 50;
                this.gainXP(rewardXP, "Yesterday's Mindful Spending Bonus");
            }, 800);
        }
    }

    renderFinanceDashboard() {
        const monthlyBudgetVal = document.getElementById('financeMonthlyBudgetVal');
        const dailyLimitVal = document.getElementById('financeDailyLimitVal');
        const todaySpentVal = document.getElementById('financeTodaySpentVal');
        const totalSpentText = document.getElementById('financeTotalSpentText');
        const remainingText = document.getElementById('financeRemainingText');
        const percentSpentText = document.getElementById('financePercentSpentText');
        const progressCircleFill = document.getElementById('financeProgressCircleFill');
        const alertBanner = document.getElementById('financeAlertBanner');
        const xpRewardStatusText = document.getElementById('financeXPRewardStatusText');
        const claimBtn = document.getElementById('claimFinanceXPBtn');

        if (!monthlyBudgetVal) return; // Guard clause

        // Render dynamic preset tags
        const tagsGrid = document.getElementById('financePresetTagsGrid');
        if (tagsGrid) {
            tagsGrid.innerHTML = this.financeData.categories.map(cat => {
                const cleanName = cat.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDC00-\uDFFF]/g, '').trim();
                return `<button type="button" class="preset-tag-btn" onclick="app.selectPresetTag(this, '${cat}', '${cleanName}')">${cat}</button>`;
            }).join('');
        }

        const income = this.financeData.monthlyIncome;
        const dailyLimit = this.financeData.dailyBudget;

        // Calculate spends
        const todayDateStr = new Date().toDateString();
        const todayExpenses = this.financeData.expenses.filter(e => new Date(e.date).toDateString() === todayDateStr);
        const todaySpent = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

        const totalSpent = this.financeData.expenses.reduce((sum, e) => sum + e.amount, 0);
        const remainingBalance = income - totalSpent;

        // Render standard values
        monthlyBudgetVal.textContent = `$${income.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        dailyLimitVal.textContent = `$${dailyLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        todaySpentVal.textContent = `$${todaySpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        totalSpentText.textContent = `$${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        remainingText.textContent = `$${remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Today's limit card color indication
        const todaySpentCard = document.getElementById('financeTodaySpentCard');
        const todaySpentIcon = document.getElementById('financeTodaySpentIcon');
        if (todaySpentCard && todaySpentIcon) {
            if (todaySpent > dailyLimit) {
                todaySpentCard.className = 'stat-card limit-exceeded';
                todaySpentIcon.style.background = 'linear-gradient(135deg, #FEF2F2, #FCA5A5)';
                todaySpentIcon.style.color = 'var(--color-danger)';
            } else {
                todaySpentCard.className = 'stat-card limit-ok';
                todaySpentIcon.style.background = 'linear-gradient(135deg, #DCFCE7, #BBF7D0)';
                todaySpentIcon.style.color = 'var(--color-success)';
            }
        }

        // Circular progress ring updates
        const percent = income > 0 ? Math.min(100, Math.max(0, (totalSpent / income) * 100)) : 0;
        percentSpentText.textContent = `${Math.round(percent)}%`;

        if (progressCircleFill) {
            const offset = 439.8 * (1 - percent / 100);
            progressCircleFill.style.strokeDashoffset = offset;
            if (percent >= 100 || remainingBalance < 0) {
                progressCircleFill.classList.add('danger');
            } else {
                progressCircleFill.classList.remove('danger');
            }
        }

        // Dynamic alerts (depletion indicator)
        const currentDay = new Date().getDate();
        const now = new Date();
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const avgDailySpend = currentDay > 0 ? (totalSpent / currentDay) : 0;

        if (remainingBalance <= 0) {
            alertBanner.className = 'finance-alert danger';
            alertBanner.innerHTML = `🚨 <div><strong>Out of Budget!</strong> You have completely depleted your monthly funds. Consider resetting or restricting your spending.</div>`;
        } else if (avgDailySpend > dailyLimit) {
            const remainingDays = remainingBalance / avgDailySpend;
            const depletionDay = currentDay + remainingDays;
            
            if (depletionDay < totalDays) {
                const depDayInt = Math.min(totalDays, Math.ceil(depletionDay));
                const suffix = (day) => {
                    const s = ["th", "st", "nd", "rd"],
                          v = day % 100;
                    return day + (s[(v - 20) % 10] || s[v] || s[0]);
                };
                alertBanner.className = 'finance-alert warning';
                alertBanner.innerHTML = `⚠️ <div><strong>Early Depletion Risk!</strong> At your current velocity of <strong>$${avgDailySpend.toFixed(2)}/day</strong> (vs recommended $${dailyLimit.toFixed(2)}/day), you are on track to deplete all funds by the <strong>${suffix(depDayInt)}</strong> of the month.</div>`;
            } else {
                alertBanner.className = 'finance-alert success';
                alertBanner.innerHTML = `✅ <div><strong>On Track!</strong> Your remaining balance of $${remainingBalance.toFixed(2)} is healthy and will last until the end of the month.</div>`;
            }
        } else {
            alertBanner.className = 'finance-alert success';
            alertBanner.innerHTML = `✅ <div><strong>Safe Spending!</strong> Your average spending of <strong>$${avgDailySpend.toFixed(2)}/day</strong> is under the recommended limit. You are on track to finish the month with a surplus of <strong>$${remainingBalance.toFixed(2)}</strong>!</div>`;
        }

        // Gamification Reward section
        if (this.financeData.xpBonusClaimedDates[todayDateStr] === true) {
            xpRewardStatusText.textContent = `🎉 Today's mindful spending bonus claimed!`;
            xpRewardStatusText.style.color = 'var(--color-success)';
            if (claimBtn) {
                claimBtn.textContent = 'Claimed ✓';
                claimBtn.disabled = true;
                claimBtn.style.opacity = '0.6';
                claimBtn.style.cursor = 'not-allowed';
            }
        } else if (todaySpent > dailyLimit) {
            xpRewardStatusText.textContent = `❌ Daily limit exceeded ($${todaySpent.toFixed(2)} / $${dailyLimit.toFixed(2)}).`;
            xpRewardStatusText.style.color = 'var(--color-danger)';
            if (claimBtn) {
                claimBtn.textContent = 'Limit Exceeded';
                claimBtn.disabled = true;
                claimBtn.style.opacity = '0.6';
                claimBtn.style.cursor = 'not-allowed';
            }
        } else {
            xpRewardStatusText.textContent = `✨ Staying under limit! Ready to claim.`;
            xpRewardStatusText.style.color = 'var(--color-text-secondary)';
            if (claimBtn) {
                claimBtn.textContent = 'Claim +' + (this.xpConfig.financeBonus || 50) + ' XP';
                claimBtn.disabled = false;
                claimBtn.style.opacity = '1';
                claimBtn.style.cursor = 'pointer';
            }
        }

        // Render expense history
        const listEmpty = document.getElementById('expenseListEmpty');
        const listContent = document.getElementById('expenseListContent');

        if (listEmpty && listContent) {
            if (this.financeData.expenses.length === 0) {
                listEmpty.style.display = 'block';
                listContent.style.display = 'none';
            } else {
                listEmpty.style.display = 'none';
                listContent.style.display = 'flex';
                listContent.innerHTML = '';

                // Sort expenses descending by date
                const sortedExpenses = [...this.financeData.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

                sortedExpenses.forEach(exp => {
                    const row = document.createElement('div');
                    row.className = 'expense-row';

                    const dateObj = new Date(exp.date);
                    const dateFormatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                    row.innerHTML = `
                        <div class="expense-details">
                            <span class="expense-name">${this.escapeHtml(exp.name)}</span>
                            <div class="expense-meta">
                                <span class="expense-tag">${this.escapeHtml(exp.category)}</span>
                                <span>•</span>
                                <span>${dateFormatted}</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: var(--spacing-md);">
                            <span class="expense-amount">$${exp.amount.toFixed(2)}</span>
                            <button class="btn-icon" onclick="app.deleteExpense('${exp.id}')" title="Delete purchase log" style="color: var(--color-danger); padding: 4px; border: none; background: transparent; cursor: pointer; font-size: 1.25rem;">
                                &times;
                            </button>
                        </div>
                    `;
                    listContent.appendChild(row);
                });
            }
        }
    }

    // User Category Customizer Methods
    toggleCategoryCustomizer(event) {
        if (event) event.preventDefault();
        const customizer = document.getElementById('categoryCustomizer');
        if (!customizer) return;

        if (customizer.style.display === 'none') {
            customizer.style.display = 'block';
            this.renderCustomizerCategories();
        } else {
            customizer.style.display = 'none';
        }
    }

    renderCustomizerCategories() {
        const list = document.getElementById('customizerCategoriesList');
        if (!list) return;

        list.innerHTML = this.financeData.categories.map(cat => {
            return `
                <div class="preset-tag-btn" style="cursor: default; display: inline-flex; align-items: center; gap: 4px;">
                    <span>${cat}</span>
                    <span onclick="app.removeCustomCategory('${this.escapeHtml(cat)}')" style="color: var(--color-danger); cursor: pointer; font-weight: 800; font-size: 1.15rem; margin-left: 2px; line-height: 1;">&times;</span>
                </div>
            `;
        }).join('');
    }

    addCustomCategory() {
        const input = document.getElementById('newCategoryInput');
        if (!input) return;

        const val = input.value.trim();
        if (!val) return;

        if (!this.financeData.categories.includes(val)) {
            this.financeData.categories.push(val);
            this.saveData('financeData', this.financeData);
            input.value = '';
            this.renderCustomizerCategories();
            this.renderFinanceDashboard();
        }
    }

    removeCustomCategory(cat) {
        this.financeData.categories = this.financeData.categories.filter(c => c !== cat);
        this.saveData('financeData', this.financeData);
        this.renderCustomizerCategories();
        this.renderFinanceDashboard();
    }

    // Admin Panel Finance Manager Methods
    async loadAdminFinancePanel() {
        // 1. XP Reward
        const rewardInput = document.getElementById('adminFinanceXPReward');
        if (rewardInput) {
            rewardInput.value = this.xpConfig.financeBonus || 50;
        }

        // 2. Categories
        this.defaultCategories = this.loadData('adminDefaultCategories') || ['Coffee ☕', 'Diet & Groceries 🍏', 'Gaming 🎮', 'PC Accessories 💻', 'Transportation 🚗'];
        this.renderAdminFinanceCategories();

        // 3. Platform Metrics
        let totalBudget = 0;
        let totalExpensesCount = 0;
        let totalExpensesAmt = 0;
        let userCount = 0;

        const avgBudgetEl = document.getElementById('adminAvgBudget');
        const totalExpensesEl = document.getElementById('adminTotalExpenses');
        const totalTransactionsEl = document.getElementById('adminTotalTransactionsCount');

        if (avgBudgetEl && totalExpensesEl && totalTransactionsEl) {
            avgBudgetEl.textContent = 'Calculating...';
            totalExpensesEl.textContent = 'Calculating...';
            totalTransactionsEl.textContent = 'Calculating...';

            if (window.db && window.firestoreUtils) {
                const { collection, getDocs } = window.firestoreUtils;
                try {
                    const snapshot = await getDocs(collection(window.db, "users"));
                    snapshot.forEach(docSnap => {
                        const data = docSnap.data();
                        if (data.financeData) {
                            userCount++;
                            totalBudget += parseFloat(data.financeData.monthlyIncome || 0);
                            if (data.financeData.expenses) {
                                totalExpensesCount += data.financeData.expenses.length;
                                totalExpensesAmt += data.financeData.expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                            }
                        }
                    });
                } catch(e) {
                    console.error("Error loading global metrics from DB:", e);
                }
            }

            if (userCount === 0) {
                // Fallback to local user
                totalBudget = this.financeData.monthlyIncome || 0;
                totalExpensesCount = this.financeData.expenses ? this.financeData.expenses.length : 0;
                totalExpensesAmt = this.financeData.expenses ? this.financeData.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
                userCount = 1;
            }

            const avgBudget = totalBudget / userCount;
            avgBudgetEl.textContent = `$${avgBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            totalExpensesEl.textContent = `$${totalExpensesAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            totalTransactionsEl.textContent = totalExpensesCount;
        }
    }

    renderAdminFinanceCategories() {
        const list = document.getElementById('adminDefaultCategoriesList');
        if (!list) return;

        list.innerHTML = this.defaultCategories.map(cat => {
            return `
                <div class="preset-tag-btn" style="cursor: default; display: inline-flex; align-items: center; gap: 4px;">
                    <span>${cat}</span>
                    <span onclick="app.removeAdminDefaultCategory('${this.escapeHtml(cat)}')" style="color: var(--color-danger); cursor: pointer; font-weight: 800; font-size: 1.15rem; margin-left: 2px; line-height: 1;">&times;</span>
                </div>
            `;
        }).join('');
    }

    handleAddDefaultCategory(event) {
        if (event) event.preventDefault();
        const input = document.getElementById('adminNewCategoryInput');
        if (!input) return;

        const val = input.value.trim();
        if (!val) return;

        if (!this.defaultCategories.includes(val)) {
            this.defaultCategories.push(val);
            this.saveData('adminDefaultCategories', this.defaultCategories);
            input.value = '';
            this.renderAdminFinanceCategories();
        }
    }

    removeAdminDefaultCategory(cat) {
        this.defaultCategories = this.defaultCategories.filter(c => c !== cat);
        this.saveData('adminDefaultCategories', this.defaultCategories);
        this.renderAdminFinanceCategories();
    }

    async saveAdminFinanceSettings(event) {
        if (event) event.preventDefault();
        const input = document.getElementById('adminFinanceXPReward');
        if (!input) return;

        const val = parseInt(input.value) || 50;

        try {
            if (window.db && window.firestoreUtils) {
                const { doc, setDoc } = window.firestoreUtils;
                await setDoc(doc(window.db, "settings", "gamification"), {
                    financeBonus: val
                }, { merge: true });
            }
            this.xpConfig.financeBonus = val;
            alert("Finance scaling configurations updated globally!");
            await this.loadGlobalSettings();
        } catch (err) {
            console.error("Error saving dynamic finance scaling settings:", err);
            alert("Failed to save scaling configurations.");
        }
    }
}

// Initialize the app and make it globally accessible
window.app = new ProductivityHub();
