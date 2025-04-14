// --- START OF EMBEDDED JAVASCRIPT ---
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Add/Modify) ---
    const clockElement = document.getElementById('clock');
    const dateElement = document.getElementById('date');
    const greetingElement = document.getElementById('greeting'); // Added
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const searchEngineSelect = document.getElementById('search-engine');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const shortcutsContainer = document.getElementById('shortcuts-container');
    const weatherInfoElement = document.getElementById('weather-info');
    const themeCheckbox = document.getElementById('theme-checkbox');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = settingsModal.querySelector('.close-btn');
    const modalShortcutsList = document.getElementById('modal-shortcuts-list');
    const addShortcutBtn = document.getElementById('add-shortcut-btn');
    const newShortcutNameInput = document.getElementById('new-shortcut-name');
    const newShortcutUrlInput = document.getElementById('new-shortcut-url');
    const newShortcutIconInput = document.getElementById('new-shortcut-icon');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const bgTypeSelect = document.getElementById('bg-type');
    const bgValueContainer = document.getElementById('bg-value-input');
    const applyBgBtn = document.getElementById('apply-bg-btn');
    const userNameInput = document.getElementById('user-name-input'); // Added

    // Task List Elements
    const taskListUl = document.getElementById('task-list'); // Added
    const newTaskInput = document.getElementById('new-task-input'); // Added
    const addTaskBtn = document.getElementById('add-task-btn'); // Added

    // Daily Goal Elements
    const dailyGoalInput = document.getElementById('daily-goal-input'); // Added

    // Pomodoro Elements
    const pomodoroTimeElement = document.getElementById('pomodoro-time');
    const pomodoroStatusElement = document.getElementById('pomodoro-status');
    const pomodoroStartPauseBtn = document.getElementById('pomodoro-start-pause');
    const pomodoroResetBtn = document.getElementById('pomodoro-reset');
    const pomodoroModeBtns = document.querySelectorAll('.mode-btn');
    const pomodoroAlarmSound = document.getElementById('pomodoro-alarm-sound');
    const pomodoroAlarmControls = document.querySelector('.pomodoro-alarm-controls'); // <-- Get controls container
    const pomodoroPauseAlarmBtn = document.getElementById('pomodoro-pause-alarm'); // <-- Get pause button
    const pomodoroStopAlarmBtn = document.getElementById('pomodoro-stop-alarm');   // <-- Get stop button

    // --- Default Data & State (Add/Modify) ---
    // ... (other state variables)
    

    // --- Default Data & State (Add/Modify) ---
    const DEFAULT_SHORTCUTS = [
        { name: 'GitHub', url: 'https://github.com', icon: 'fab fa-github' },
        { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'fab fa-stack-overflow' },
        { name: 'DevDocs', url: 'https://devdocs.io', icon: 'fas fa-book' },
        { name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'fas fa-robot' },
        { name: 'MDN', url: 'https://developer.mozilla.org/', icon: 'fab fa-firefox-browser' },
        { name: 'CodePen', url: 'https://codepen.io/', icon: 'fab fa-codepen' },
     ];
    const WEATHER_API_KEY = '6e0c2f7a6eaf708ac59413a675381188'; // <-- IMPORTANT: Replace with your actual API key!

    let suggestionFetchTimeout;
    let currentSuggestionIndex = -1;
    let userName = ''; // Added

    // Task List State
    let tasks = []; // Added

    // Daily Goal State
    let dailyGoal = { text: '', date: '' }; // Added

    // Pomodoro State
    const POMODORO_TIMES = { work: 25 * 60, shortBreak: 0.1 * 60, longBreak: 15 * 60 }; // Seconds
    let pomodoroInterval = null;
    let pomodoroTimeLeft = POMODORO_TIMES.work;
    let pomodoroCurrentMode = 'work'; // 'work', 'shortBreak', 'longBreak'
    let pomodoroIsRunning = false;
    let pomodoroIsAlarmPlaying = false; // <-- Track if alarm is active
    let pomodoroNextModeTimeoutId = null; // <-- Store timeout ID for mode switch

    // --- Utility Functions ---
    const getLocalStorage = (key, defaultValue) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error("Error reading localStorage key “" + key + "”:", e);
            return defaultValue;
        }
    };
    const setLocalStorage = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("Error setting localStorage key “" + key + "”:", e);
        }
    };
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // --- Core Functionality ---

    // 1. Live Clock, Date, and Greeting (Enhanced)
    function updateTimeAndGreeting() {
        const now = new Date();
        const hours = now.getHours();

        // Clock & Date
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        clockElement.textContent = timeString;
        dateElement.textContent = dateString;

        // Greeting
        let greetingText = 'Hello';
        if (hours < 12) {
            greetingText = 'Good morning';
        } else if (hours < 18) {
            greetingText = 'Good afternoon';
        } else {
            greetingText = 'Good evening';
        }
         // Ensure greetingElement exists before setting textContent
        if(greetingElement) {
            greetingElement.textContent = `${greetingText}${userName ? ', ' + userName : ''}!`;
        }
    }

    function loadUserName() {
        userName = getLocalStorage('devHomeUserName', '');
         // Ensure userNameInput exists
         if(userNameInput) {
             userNameInput.value = userName; // Pre-fill settings input
         }
        updateTimeAndGreeting(); // Update greeting immediately
    }

    setInterval(updateTimeAndGreeting, 1000);
    loadUserName();
    updateTimeAndGreeting();

     // Ensure userNameInput exists before adding listener
    if(userNameInput) {
        userNameInput.addEventListener('input', () => { // Use input for immediate feedback
            userName = userNameInput.value.trim();
            setLocalStorage('devHomeUserName', userName);
            updateTimeAndGreeting();
        });
    }


    // 2. Daily Goal (New)
    function loadDailyGoal() {
        const savedGoal = getLocalStorage('devHomeDailyGoal', { text: '', date: '' });
        const today = new Date().toLocaleDateString();

        if (dailyGoalInput) { // Check if element exists
            if (savedGoal.date === today) {
                dailyGoalInput.value = savedGoal.text;
                dailyGoal = savedGoal;
            } else {
                dailyGoalInput.value = '';
                dailyGoal = { text: '', date: today };
                setLocalStorage('devHomeDailyGoal', dailyGoal);
            }
        }
    }

     if(dailyGoalInput) { // Check if element exists
        dailyGoalInput.addEventListener('change', () => {
            dailyGoal.text = dailyGoalInput.value.trim();
            dailyGoal.date = new Date().toLocaleDateString();
            setLocalStorage('devHomeDailyGoal', dailyGoal);
        });
     }

    loadDailyGoal();

    // 4. Search Bar & Suggestions
    function performSearch(queryOverride = null) {
        const query = queryOverride !== null ? queryOverride : searchInput.value.trim();
        if (query && searchEngineSelect) {
            const selectedOption = searchEngineSelect.options[searchEngineSelect.selectedIndex];
            const searchUrl = selectedOption.value + encodeURIComponent(query);
            window.open(searchUrl, '_blank');
            clearSuggestions();
        }
    }
    function fetchSuggestions(query) {
         if (!searchEngineSelect || !suggestionsContainer) return; // Add checks
         const selectedOption = searchEngineSelect.options[searchEngineSelect.selectedIndex];
         const suggestUrlBase = selectedOption.getAttribute('data-suggest-url');

         if (!suggestUrlBase || query.length < 1) {
             clearSuggestions(); return;
         }
         const callbackName = 'handleSuggestions' + Date.now();
         let fullSuggestUrl = '';
         if (suggestUrlBase.includes('google.com')) { fullSuggestUrl = `${suggestUrlBase}${encodeURIComponent(query)}&callback=${callbackName}`; }
         else if (suggestUrlBase.includes('duckduckgo.com')) { fullSuggestUrl = `${suggestUrlBase}${encodeURIComponent(query)}&callback=${callbackName}`; }
         else { clearSuggestions(); return; }

         const oldScript = document.getElementById('jsonp-script'); if (oldScript) oldScript.remove();
         window[callbackName] = (data) => {
             let suggestions = [];
             if (suggestUrlBase.includes('google.com')) { suggestions = data[1] || []; }
             else if (suggestUrlBase.includes('duckduckgo.com')) { suggestions = (data || []).map(item => item.phrase); }
             displaySuggestions(suggestions);
             document.getElementById('jsonp-script')?.remove();
             try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
         };
         const script = document.createElement('script'); script.id = 'jsonp-script'; script.src = fullSuggestUrl;
         script.onerror = () => { console.error("Error fetching suggestions."); clearSuggestions(); document.getElementById('jsonp-script')?.remove(); try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; } };
         document.head.appendChild(script);
    }
    function displaySuggestions(suggestions) {
        if (!suggestionsContainer) return; // Add check
        clearSuggestions();
        if (!suggestions || suggestions.length === 0) return;
        suggestions.slice(0, 7).forEach((suggestion, index) => {
            const item = document.createElement('div'); item.classList.add('suggestion-item'); item.textContent = suggestion; item.dataset.index = index;
            item.addEventListener('mousedown', (e) => { e.preventDefault(); searchInput.value = suggestion; performSearch(suggestion); });
            suggestionsContainer.appendChild(item);
        });
        suggestionsContainer.style.display = 'block'; currentSuggestionIndex = -1;
    }
    function clearSuggestions() {
        if (suggestionsContainer) { // Add check
            suggestionsContainer.innerHTML = ''; suggestionsContainer.style.display = 'none';
        }
        currentSuggestionIndex = -1;
    }
    const debouncedFetchSuggestions = debounce(fetchSuggestions, 250);
     if (searchForm) searchForm.addEventListener('submit', (e) => { e.preventDefault(); performSearch(); });
     if (searchInput) {
         searchInput.addEventListener('input', () => { const query = searchInput.value.trim(); if (query) { debouncedFetchSuggestions(query); } else { clearSuggestions(); } });
         searchInput.addEventListener('blur', () => { setTimeout(clearSuggestions, 150); });
     }
    if (searchEngineSelect) searchEngineSelect.addEventListener('change', clearSuggestions);

    // 5. Shortcuts
    let shortcuts = getLocalStorage('devHomeShortcuts', DEFAULT_SHORTCUTS);
    function renderShortcuts() {
         if (!shortcutsContainer || !modalShortcutsList) return; // Add checks
         shortcutsContainer.innerHTML = ''; modalShortcutsList.innerHTML = '';
         shortcuts.forEach((shortcut, index) => {
             const shortcutLink = document.createElement('a'); shortcutLink.href = shortcut.url; shortcutLink.className = 'shortcut-item'; shortcutLink.target = '_blank'; shortcutLink.rel = 'noopener noreferrer';
             shortcutLink.setAttribute('title', `Ctrl + ${index + 1}: Open ${shortcut.name}`);
             shortcutLink.innerHTML = `<i class="${shortcut.icon || 'fas fa-link'}"></i><span>${shortcut.name}</span>`;
             shortcutsContainer.appendChild(shortcutLink);

             const modalEntry = document.createElement('div'); modalEntry.className = 'shortcut-entry';
             modalEntry.innerHTML = `<span><i class="${shortcut.icon || 'fas fa-link'}"></i> ${shortcut.name} (${shortcut.url.substring(0, 30)}...)</span><button data-index="${index}" class="delete-shortcut-btn" title="Delete Shortcut">Delete</button>`;
             modalShortcutsList.appendChild(modalEntry);
         });
         document.querySelectorAll('.delete-shortcut-btn').forEach(button => {
            button.addEventListener('click', (e) => { const indexToDelete = parseInt(e.target.getAttribute('data-index'), 10); deleteShortcut(indexToDelete); });
         });
    }
    function addShortcut(name, url, icon) {
        if (name && url) {
            try { new URL(url); } catch (_) { alert('Please enter a valid URL (e.g., https://example.com)'); return; }
            shortcuts.push({ name, url, icon: icon || 'fas fa-link' }); setLocalStorage('devHomeShortcuts', shortcuts); renderShortcuts();
             if (newShortcutNameInput) newShortcutNameInput.value = '';
             if (newShortcutUrlInput) newShortcutUrlInput.value = '';
             if (newShortcutIconInput) newShortcutIconInput.value = '';
        } else { alert('Please provide both a name and a URL for the shortcut.'); }
    }
    function deleteShortcut(index) {
        if (index >= 0 && index < shortcuts.length) { shortcuts.splice(index, 1); setLocalStorage('devHomeShortcuts', shortcuts); renderShortcuts(); }
    }
    if (addShortcutBtn) addShortcutBtn.addEventListener('click', () => { if(newShortcutNameInput && newShortcutUrlInput && newShortcutIconInput) { addShortcut(newShortcutNameInput.value.trim(), newShortcutUrlInput.value.trim(), newShortcutIconInput.value.trim()); }});
    renderShortcuts();

    // 6. Task List
    function loadTasks() {
        tasks = getLocalStorage('devHomeTasks', []); renderTasks();
    }
    function renderTasks() {
        if (!taskListUl) return; // Add check
        taskListUl.innerHTML = ''; if (!Array.isArray(tasks)) tasks = [];
        tasks.forEach((task, index) => {
            const li = document.createElement('li'); li.className = task.completed ? 'completed' : ''; li.dataset.index = index;
            const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = task.completed; checkbox.id = `task-${index}`; checkbox.addEventListener('change', toggleTaskComplete);
            const label = document.createElement('label'); label.htmlFor = `task-${index}`; label.textContent = task.text;
            const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-task-btn'; deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; deleteBtn.title = "Delete Task"; deleteBtn.addEventListener('click', deleteTask);
            li.appendChild(checkbox); li.appendChild(label); li.appendChild(deleteBtn); taskListUl.appendChild(li);
        });
    }
    function addTask() {
         if (!newTaskInput) return; // Add check
        const taskText = newTaskInput.value.trim();
        if (taskText) { tasks.push({ text: taskText, completed: false }); newTaskInput.value = ''; saveAndRenderTasks(); }
    }
    function deleteTask(event) {
        const li = event.target.closest('li'); if (!li) return; const index = parseInt(li.dataset.index, 10);
        if (!isNaN(index) && index >= 0 && index < tasks.length) { tasks.splice(index, 1); saveAndRenderTasks(); }
    }
    function toggleTaskComplete(event) {
        const checkbox = event.target; const li = checkbox.closest('li'); if (!li) return; const index = parseInt(li.dataset.index, 10);
        if (!isNaN(index) && index >= 0 && index < tasks.length) { tasks[index].completed = checkbox.checked; saveAndRenderTasks(); }
    }
    function saveAndRenderTasks() { setLocalStorage('devHomeTasks', tasks); renderTasks(); }
     if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
     if (newTaskInput) newTaskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { addTask(); } });
    loadTasks();

    // 7. Pomodoro Timer
    function formatTime(seconds) { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`; }
    function updatePomodoroDisplay() { if (pomodoroTimeElement) pomodoroTimeElement.textContent = formatTime(pomodoroTimeLeft); }
    function updatePomodoroStatus(statusText = '') {
         if (!pomodoroStatusElement) return; // Add check
         if (statusText) { pomodoroStatusElement.textContent = statusText; }
         else {
             const modeText = pomodoroCurrentMode.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
             pomodoroStatusElement.textContent = pomodoroIsRunning ? `${modeText} in progress...` : `Ready for ${modeText}`;
         }
    }
    function switchPomodoroMode(newMode) {
        stopAlarmCompletely(); // Stop any lingering alarm sound/controls when switching mode
        if (pomodoroIsRunning) stopPomodoroTimer();
        pomodoroCurrentMode = newMode;
        pomodoroTimeLeft = POMODORO_TIMES[newMode];
        pomodoroModeBtns.forEach(btn => { btn.classList.toggle('active', btn.dataset.mode === newMode); });
        updatePomodoroDisplay();
        updatePomodoroStatus();
        document.body.classList.remove('work-mode', 'break-mode');
        if (newMode === 'work') document.body.classList.add('work-mode');
        else document.body.classList.add('break-mode');
    }

    function startPausePomodoro() {
        stopAlarmCompletely(); // Ensure alarm is off if user manually starts/pauses timer
        if (pomodoroIsRunning) {
             pausePomodoroTimer();
        } else {
             startPomodoroTimer();
        }
    }

    // Function to update the pause/resume button state
    function updatePauseResumeButton(isPaused) {
        if (pomodoroPauseAlarmBtn) {
            if (isPaused) {
                pomodoroPauseAlarmBtn.innerHTML = '<i class="fas fa-volume-up"></i> Resume Alarm';
                pomodoroPauseAlarmBtn.title = 'Resume Alarm Sound';
            } else {
                pomodoroPauseAlarmBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Pause Alarm';
                pomodoroPauseAlarmBtn.title = 'Pause Alarm Sound';
            }
        }
    }

    function startPomodoroTimer() {
        if (pomodoroIsRunning || !pomodoroStartPauseBtn) return;
        stopAlarmCompletely(); // Ensure previous alarm state is cleared
        pomodoroIsRunning = true;
        pomodoroStartPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        pomodoroStartPauseBtn.classList.add('running');
        updatePomodoroStatus();

        pomodoroInterval = setInterval(() => {
            pomodoroTimeLeft--;
            updatePomodoroDisplay();

            if (pomodoroTimeLeft <= 0) {
                // Timer finished
                stopPomodoroTimer(); // Stop the interval

                // --- Alarm Sound Logic ---
                if (pomodoroAlarmSound) {
                    pomodoroIsAlarmPlaying = true; // Set flag
                    if (pomodoroAlarmControls) pomodoroAlarmControls.classList.add('visible'); // Show controls
                    updatePauseResumeButton(false);


                    pomodoroAlarmSound.currentTime = 0; // Rewind
                    pomodoroAlarmSound.play().catch(e => {
                        console.warn("Audio play failed. User interaction might be required first.", e);
                        alert(`${pomodoroCurrentMode.replace(/([A-Z])/g, ' $1')} finished!`);
                        stopAlarmCompletely(); // Clean up if sound fails
                    });
                } else {
                     alert(`${pomodoroCurrentMode.replace(/([A-Z])/g, ' $1')} finished!`);
                     stopAlarmCompletely(); // Clean up if sound element doesn't exist
                }
                // --- End Alarm Sound Logic ---

                // Determine next mode
                let nextMode = 'work';
                if (pomodoroCurrentMode === 'work') nextMode = 'shortBreak';
                else if (pomodoroCurrentMode === 'shortBreak') nextMode = 'work';
                else if (pomodoroCurrentMode === 'longBreak') nextMode = 'work';

                const finishedModeText = pomodoroCurrentMode.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
                updatePomodoroStatus(`${finishedModeText} finished! Alarm playing...`);

                // Schedule the mode switch, store the ID
                clearTimeout(pomodoroNextModeTimeoutId); // Clear any previous pending switch
                pomodoroNextModeTimeoutId = setTimeout(() => {
                    if (pomodoroIsAlarmPlaying) { // Only auto-switch if alarm wasn't manually stopped
                       stopAlarmCompletely(); // Ensure alarm stops if it was still playing somehow
                    }
                    switchPomodoroMode(nextMode);
                    // Optional: Auto-start next timer
                    // startPomodoroTimer();
                }, pomodoroAlarmSound ? pomodoroAlarmSound.duration * 1000 + 500 : 500); // Wait for sound duration + buffer, or short delay
            }
        }, 1000);
    }

    function pausePomodoroTimer() {
        if (!pomodoroIsRunning || !pomodoroStartPauseBtn) return;
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        pomodoroIsRunning = false;
        pomodoroStartPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        pomodoroStartPauseBtn.classList.remove('running');
        updatePomodoroStatus('Paused');
    }

    function resetPomodoroTimer() {
        stopAlarmCompletely(); // Stop alarm sound/controls on reset
        stopPomodoroTimer();
        pomodoroTimeLeft = POMODORO_TIMES[pomodoroCurrentMode];
        updatePomodoroDisplay();
        updatePomodoroStatus();
    }

    function stopPomodoroTimer() {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        pomodoroIsRunning = false;
        if (pomodoroStartPauseBtn) {
            pomodoroStartPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            pomodoroStartPauseBtn.classList.remove('running');
        }
        // Don't stop alarm here necessarily, let specific actions decide
    }

    // --- NEW: Function to completely stop the alarm and cleanup ---
    function stopAlarmCompletely() {
        clearTimeout(pomodoroNextModeTimeoutId); // Cancel pending mode switch
        pomodoroNextModeTimeoutId = null;

        if (pomodoroAlarmSound && pomodoroIsAlarmPlaying) {
            pomodoroAlarmSound.pause();
            pomodoroAlarmSound.currentTime = 0;
        }
        pomodoroIsAlarmPlaying = false;
        if (pomodoroAlarmControls) {
            pomodoroAlarmControls.classList.remove('visible'); // Hide controls
        }
        updatePauseResumeButton(false);
    }

    // --- Event Listeners for Pomodoro ---
    if (pomodoroStartPauseBtn) pomodoroStartPauseBtn.addEventListener('click', startPausePomodoro);
    if (pomodoroResetBtn) pomodoroResetBtn.addEventListener('click', resetPomodoroTimer);
    pomodoroModeBtns.forEach(btn => { btn.addEventListener('click', () => switchPomodoroMode(btn.dataset.mode)); });

    // --- MODIFIED: Event Listener for Pause/Resume Alarm Button ---
    if (pomodoroPauseAlarmBtn) {
        pomodoroPauseAlarmBtn.addEventListener('click', () => {
            // Only act if the alarm *should* be playing and the element exists
            if (pomodoroIsAlarmPlaying && pomodoroAlarmSound) {
                if (pomodoroAlarmSound.paused) {
                    // It's paused, so RESUME
                    pomodoroAlarmSound.play().catch(e => { // Added catch for safety
                         console.warn("Audio resume failed.", e);
                         // Optionally handle resume failure, maybe stop the alarm?
                         stopAlarmCompletely();
                    });
                    updatePauseResumeButton(false); // Set button back to "Pause"
                    updatePomodoroStatus('Alarm playing...'); // Update status
                } else {
                    // It's playing, so PAUSE
                    pomodoroAlarmSound.pause();
                    updatePauseResumeButton(true); // Set button to "Resume"
                    updatePomodoroStatus('Alarm Sound Paused'); // Update status
                }
            }
        });
    }

    // --- Event Listener for Stop Alarm Button ---
    if (pomodoroStopAlarmBtn) {
        pomodoroStopAlarmBtn.addEventListener('click', () => {
            stopAlarmCompletely(); // Use the central cleanup function
            const finishedModeText = pomodoroCurrentMode.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
            let nextMode = 'work';
            if (pomodoroCurrentMode === 'work') nextMode = 'shortBreak';
            const nextModeText = nextMode.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
            updatePomodoroStatus(`${finishedModeText} Finished. Alarm stopped. Press Play for ${nextModeText}.`);
        });
    }

    // --- Event Listener for when the sound finishes playing naturally ---
    if (pomodoroAlarmSound) {
        pomodoroAlarmSound.addEventListener('ended', () => {
             // Only run cleanup if the alarm was supposed to be playing
             // This check prevents issues if 'ended' fires unexpectedly
             if (pomodoroIsAlarmPlaying) {
                 pomodoroIsAlarmPlaying = false; // Sound finished
                 if (pomodoroAlarmControls) {
                    pomodoroAlarmControls.classList.remove('visible'); // Hide controls
                 }
                 updatePauseResumeButton(false); // <<< Reset button state
                 // The automatic mode switch will still happen via the timeout set earlier
                 updatePomodoroStatus(`${pomodoroCurrentMode.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())} Finished. Preparing next mode...`);
             }
        });
    }



    // Initial setup
    switchPomodoroMode('work');

    // 8. Weather Widget
    function fetchWeather(options = {}) {
        const { coords, locationName } = options; let apiUrl = ''; const units = 'metric';
        if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_OPENWEATHERMAP_API_KEY') { if(weatherInfoElement) weatherInfoElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Weather API key missing/invalid.'; console.warn("API Key missing."); return; }
        if(weatherInfoElement) weatherInfoElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading weather...';
        if (coords) { apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${WEATHER_API_KEY}&units=${units}`; }
        else if (locationName) { apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationName)}&appid=${WEATHER_API_KEY}&units=${units}`; }
        else { if(weatherInfoElement) weatherInfoElement.innerHTML = '<i class="fas fa-map-marker-slash"></i> Location unavailable.'; return; }
        fetch(apiUrl)
            .then(response => { if (!response.ok) { return response.json().then(errData => { throw new Error(`HTTP error! Status: ${response.status}. Message: ${errData.message || 'Unknown'}`); }); } return response.json(); })
            .then(data => {
                 if (weatherInfoElement && data.cod === 200) {
                    const weatherDesc = data.weather[0].description; const temp = Math.round(data.main.temp); const iconCode = data.weather[0].icon; const iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`; const city = data.name; const tempUnit = units === 'metric' ? '°C' : '°F';
                    weatherInfoElement.innerHTML = `<img src="${iconUrl}" alt="${weatherDesc}" style="vertical-align: middle; width: 40px; height: 40px; margin-right: 5px;"> ${temp}${tempUnit}, ${weatherDesc} in ${city}`;
                    setLocalStorage('devHomeWeatherLastCity', city);
                } else if (weatherInfoElement) { weatherInfoElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${data.message || 'Data error.'}`; }
            })
            .catch(error => { console.error('Error fetching weather:', error); if(weatherInfoElement) weatherInfoElement.innerHTML = `<i class="fas fa-cloud-slash"></i> Could not fetch weather. ${error.message.includes('not found') ? '(City?)' : ''}`; });
    }
    function initWeather() {
        if (navigator.geolocation) {
            if(weatherInfoElement) weatherInfoElement.innerHTML = '<i class="fas fa-map-marker-alt"></i> Getting location...';
            navigator.geolocation.getCurrentPosition(
                (position) => { fetchWeather({ coords: position.coords }); },
                (error) => {
                    console.warn(`Geolocation error (${error.code}): ${error.message}`); let fallbackMessage = 'Could not get location. ';
                    if (error.code === error.PERMISSION_DENIED) { fallbackMessage = 'Location access denied. '; } else if (error.code === error.POSITION_UNAVAILABLE) { fallbackMessage = 'Location info unavailable. '; } else if (error.code === error.TIMEOUT) { fallbackMessage = 'Location request timed out. '; }
                    const lastCity = getLocalStorage('devHomeWeatherLastCity', 'London');
                     if(weatherInfoElement) weatherInfoElement.innerHTML = `<i class="fas fa-info-circle"></i> ${fallbackMessage} Showing weather for ${lastCity}.`;
                    fetchWeather({ locationName: lastCity });
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
            );
        } else {
            const lastCity = getLocalStorage('devHomeWeatherLastCity', 'London');
             if(weatherInfoElement) weatherInfoElement.innerHTML = `<i class="fas fa-map-marker-slash"></i> Geolocation not supported. Showing for ${lastCity}.`;
            fetchWeather({ locationName: lastCity });
        }
    }
    initWeather();

    // 9. Dark Mode Toggle & Persistence
    function applyTheme(theme) {
        if (theme === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); if (themeCheckbox) themeCheckbox.checked = true; }
        else { document.documentElement.removeAttribute('data-theme'); if (themeCheckbox) themeCheckbox.checked = false; }
        setLocalStorage('devHomeTheme', theme);
    }
     if (themeCheckbox) {
         themeCheckbox.addEventListener('change', () => { const newTheme = themeCheckbox.checked ? 'dark' : 'light'; applyTheme(newTheme); });
     }
    const savedTheme = getLocalStorage('devHomeTheme', null);
    if (savedTheme) { applyTheme(savedTheme); }
    else { const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; applyTheme(prefersDark ? 'dark' : 'light'); }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => { if (!getLocalStorage('devHomeTheme', null)) { applyTheme(e.matches ? 'dark' : 'light'); } });


    // 10. Settings Modal Logic
    if (settingsBtn) settingsBtn.addEventListener('click', () => { if(settingsModal) settingsModal.style.display = 'block'; renderShortcuts(); const currentBg = getLocalStorage('devHomeBackground', null); if (currentBg && bgTypeSelect) { bgTypeSelect.value = currentBg.type; renderBackgroundInputs(currentBg.type); } else { renderBackgroundInputs('color'); } });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if(settingsModal) settingsModal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target == settingsModal) { settingsModal.style.display = 'none'; } });


    // 11. Background Customization
    function renderBackgroundInputs(type) {
        if (!bgValueContainer) return; // Add check
        bgValueContainer.innerHTML = ''; let inputHtml = '';
        const defaultBgColor = getLocalStorage('devHomeTheme', 'light') === 'dark' ? '#1a1a1a' : '#f4f7f6';
        const currentBg = getLocalStorage('devHomeBackground', { type: 'color', value: defaultBgColor });
        switch (type) {
            case 'color': inputHtml = `<input type="color" id="bg-color-input" value="${currentBg.type === 'color' ? currentBg.value : defaultBgColor}">`; break;
            case 'gradient': const gradValue = currentBg.type === 'gradient' ? currentBg.value : ['#4dabf7', '#282c34']; inputHtml = `<label>Color 1: <input type="color" id="bg-gradient-color1" value="${gradValue[0] || '#4dabf7'}"></label><label>Color 2: <input type="color" id="bg-gradient-color2" value="${gradValue[1] || '#282c34'}"></label>`; break;
            case 'image': const imgValue = currentBg.type === 'image' ? currentBg.value : ''; inputHtml = `<input type="url" id="bg-image-url" placeholder="Enter Image URL" value="${imgValue}">`; break;
        }
        bgValueContainer.innerHTML = inputHtml;
    }
    function applyBackground(settings) {
        document.body.style.backgroundImage = ''; document.body.style.backgroundColor = 'var(--bg-color)';
        switch (settings.type) {
            case 'color': document.body.style.backgroundColor = settings.value; document.body.style.backgroundImage = 'none'; break;
            case 'gradient': document.body.style.backgroundImage = `linear-gradient(to bottom right, ${settings.value[0]}, ${settings.value[1]})`; document.body.style.backgroundColor = ''; break;
            case 'image': document.body.style.backgroundImage = `url('${settings.value}')`; document.body.style.backgroundSize = 'cover'; document.body.style.backgroundPosition = 'center'; document.body.style.backgroundRepeat = 'no-repeat'; document.body.style.backgroundColor = ''; break;
        }
        setLocalStorage('devHomeBackground', settings);
    }
    if (bgTypeSelect) bgTypeSelect.addEventListener('change', (e) => { renderBackgroundInputs(e.target.value); });
    if (applyBgBtn) applyBgBtn.addEventListener('click', () => {
        if (!bgTypeSelect) return; // Add check
        const type = bgTypeSelect.value; let value; let isValid = true;
        switch (type) {
            case 'color': value = document.getElementById('bg-color-input')?.value; break;
            case 'gradient': value = [document.getElementById('bg-gradient-color1')?.value, document.getElementById('bg-gradient-color2')?.value]; break;
            case 'image': value = document.getElementById('bg-image-url')?.value.trim(); if (!value) { alert('Please enter an Image URL.'); isValid = false; } else { try { new URL(value); } catch (_) { alert('Please enter a valid Image URL.'); isValid = false; } } break;
        }
        if (isValid && value !== undefined && value !== null && !(Array.isArray(value) && value.some(v => v === undefined))) { applyBackground({ type, value }); }
        else if (isValid) { alert('Please provide a value for the background.'); }
    });
    const savedBackground = getLocalStorage('devHomeBackground', null);
    if (savedBackground) { applyBackground(savedBackground); }
    else { document.body.style.backgroundColor = 'var(--bg-color)'; }


    // 12. Combined Keyboard Shortcuts Listener
    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement; const isInputFocused = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (e.key === '/' && !isInputFocused) { e.preventDefault(); if(searchInput) searchInput.focus(); return; }
        if (e.ctrlKey && e.key >= '1' && e.key <= '9' && !isInputFocused) { e.preventDefault(); const index = parseInt(e.key) - 1; if (index < shortcuts.length) { window.open(shortcuts[index].url, '_blank'); } return; }
        if (activeEl === searchInput && suggestionsContainer && suggestionsContainer.style.display === 'block') {
            const items = suggestionsContainer.querySelectorAll('.suggestion-item'); if (items.length === 0) return;
            switch (e.key) {
                case 'ArrowDown': e.preventDefault(); currentSuggestionIndex = Math.min(currentSuggestionIndex + 1, items.length - 1); updateSuggestionHighlight(items); break;
                case 'ArrowUp': e.preventDefault(); currentSuggestionIndex = Math.max(currentSuggestionIndex - 1, -1); updateSuggestionHighlight(items); break;
                case 'Enter': if (currentSuggestionIndex > -1) { e.preventDefault(); items[currentSuggestionIndex].dispatchEvent(new MouseEvent('mousedown')); } break;
                case 'Escape': e.preventDefault(); clearSuggestions(); break;
            }
        }
    });
    function updateSuggestionHighlight(items) {
         if (!items) return; // Add check
         items.forEach((item, index) => { item.classList.toggle('active', index === currentSuggestionIndex); if(index === currentSuggestionIndex) item.scrollIntoView({ block: 'nearest' }); });
    }

    // 13. Reset Settings
    if (resetSettingsBtn) resetSettingsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset ALL settings (theme, name, shortcuts, tasks, goal, background, weather location)? This cannot be undone.')) {
            localStorage.removeItem('devHomeTheme'); localStorage.removeItem('devHomeUserName'); localStorage.removeItem('devHomeShortcuts'); localStorage.removeItem('devHomeTasks'); localStorage.removeItem('devHomeDailyGoal'); localStorage.removeItem('devHomeWeatherLastCity'); localStorage.removeItem('devHomeBackground');
            window.location.reload();
        }
    });

}); // End DOMContentLoaded
// --- END OF EMBEDDED JAVASCRIPT ---
