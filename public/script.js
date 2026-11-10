// --- グローバル状態 ---
    let state = { currentDate: '2026-07-17', theme: '', plannerData: {}, marks: {}, monthlyTodos: [], tutorialShown: false };
    let calYear = 2026, calMonth = 6; 
    let pendingMarkDate = null;
    let deleteContext = { type: null, date: null, index: null };
    let holdTimer = null;
 
 
    function getDayData(dateStr) {
        if (!state.plannerData[dateStr]) state.plannerData[dateStr] = { title: "", note: "", images: [], todos: [] };
        return state.plannerData[dateStr];
    }
    function saveState() { localStorage.setItem('finalPlannerStateV2', JSON.stringify(state)); }
    function loadState() {
        const saved = localStorage.getItem('finalPlannerStateV2');
        if (saved) { 
            const parsed = JSON.parse(saved); 
            state = { ...state, ...parsed }; 
            if(!state.plannerData) state.plannerData = {}; 
            if(!state.marks) state.marks = {}; 
            if(!state.monthlyTodos) state.monthlyTodos = []; 
        }
    }
 
 
    // --- テーマ切り替え ---
    function setTheme(themeClass) {
        const app = document.querySelector('.app-container');
        app.className = 'app-container'; // リセット
        if(themeClass) app.classList.add(themeClass);
        state.theme = themeClass; saveState();
        renderCalendar(); 
        document.getElementById('themeDrawer').classList.remove('open');
    }
 
 
    // --- 大きなリアルタイム時計 ---
    function updateClock() {
        const now = new Date();
        document.getElementById('liveClockHM').innerText = now.toTimeString().substring(0,8); // 12:34:56
    }
    setInterval(updateClock, 1000); updateClock();
 
 
    // --- 日付を軸にした核心ロジック ---
    function setCurrentDate(dateStr) {
        state.currentDate = dateStr; saveState();
        const d = new Date(dateStr + 'T00:00:00');
        const weeks = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
        
        document.getElementById('sideDate').innerText = `${d.getMonth()+1}/${d.getDate()}`;
        document.getElementById('sideWeek').innerText = weeks[d.getDay()];
        document.getElementById('noteSubtitle').innerText = `flip through · ${d.getMonth()+1}月${d.getDate()}日`;
 
 
        renderWeekList(); renderNote(); renderTodos(); renderMonthScroll();
    }
 
 
    // --- 左側バー ---
    function renderMonthScroll() {
        const container = document.getElementById('monthScroll');
        const curDate = new Date(state.currentDate + 'T00:00:00');
        container.innerHTML = '';
        for(let i=0; i<12; i++) {
            let d = new Date(curDate.getFullYear(), i, 1);
            const pill = document.createElement('div');
            pill.className = 'month-pill';
            if(i === curDate.getMonth()) pill.classList.add('active');
            pill.innerText = `${d.getFullYear()}.${String(i+1).padStart(2,'0')}`;
            pill.onclick = () => {
                const targetDate = new Date(curDate.getFullYear(), i, 1);
                const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2,'0')}-${String(targetDate.getDate()).padStart(2,'0')}`;
                setCurrentDate(dateStr);
            };
            container.appendChild(pill);
        }
    }
 
 
    function renderWeekList() {
        const container = document.getElementById('weekList');
        container.innerHTML = '';
        const cur = new Date(state.currentDate + 'T00:00:00');
        for(let i=-7; i<=7; i++) { 
            let d = new Date(cur); d.setDate(d.getDate() + i);
            const weeks = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const card = document.createElement('div'); card.className = 'day-card';
            if(dateStr === state.currentDate) card.classList.add('active');
            const data = state.plannerData[dateStr];
            let preview = '今日はまだありません';
            if(data && data.todos && data.todos.length > 0) preview = data.todos[0].text;
            
            card.innerHTML = `<div class="date">${d.getMonth()+1}/${d.getDate()}</div><div class="week">${weeks[d.getDay()]}</div><div class="preview-todo">• ${preview}</div>`;
            card.onclick = () => setCurrentDate(dateStr);
            container.appendChild(card);
        }
    }
 
 
    // --- ノートと画像 ---
    function renderNote() {
        const data = getDayData(state.currentDate);
        document.getElementById('noteTitleInput').value = data.title || "マイノート";
        document.getElementById('noteInput').value = data.note || "";
        renderImages();
    }
    document.getElementById('noteTitleInput').addEventListener('input', function() {
        const data = getDayData(state.currentDate); data.title = this.value; saveState();
    });
    document.getElementById('noteInput').addEventListener('input', function() {
        const data = getDayData(state.currentDate); data.note = this.value; saveState();
    });
 
 
    function renderImages() {
        const container = document.getElementById('imagesContainer');
        container.innerHTML = '';
        const data = getDayData(state.currentDate);
        if(data.images && data.images.length > 0) {
            data.images.forEach((src) => {
                const img = document.createElement('img');
                img.src = src; img.className = 'img-embedded';
                img.onclick = () => { document.getElementById('lightboxImg').src = src; document.getElementById('lightbox').classList.add('open'); };
                // 图片长按删除
                img.addEventListener('mousedown', () => { holdTimer = setTimeout(() => { data.images.splice(data.images.indexOf(src), 1); saveState(); renderImages(); }, 600); });
                img.addEventListener('mouseup', () => clearTimeout(holdTimer));
                img.addEventListener('touchstart', () => { holdTimer = setTimeout(() => { data.images.splice(data.images.indexOf(src), 1); saveState(); renderImages(); }, 600); }, {passive: true});
                img.addEventListener('touchend', () => clearTimeout(holdTimer));
                container.appendChild(img);
            });
        }
    }
 
 
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const data = getDayData(state.currentDate);
            for (let file of files) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    data.images.push(ev.target.result);
                    saveState(); renderImages();
                }
                reader.readAsDataURL(file);
            }
        }
        e.target.value = '';
    });
 
 
    // --- 毎日のリスト（長押し削除対応） ---
    function renderTodos() {
        const container = document.getElementById('todoExpandedList');
        container.innerHTML = '';
        const data = getDayData(state.currentDate);
        if(!data.todos) data.todos = [];
        data.todos.forEach((todo, index) => {
            const li = document.createElement('li'); 
            li.className = `todo-item-wrap ${todo.done ? 'done' : ''}`;
            li.innerHTML = `<div class="todo-check-box">✓</div><span class="todo-text">${todo.text}</span>`;
            
            // 点击打勾
            li.onclick = () => { todo.done = !todo.done; saveState(); renderTodos(); };
            
            // 长按呼出删除
            li.addEventListener('mousedown', () => { holdTimer = setTimeout(() => { showDeleteModal('daily', state.currentDate, index); }, 600); });
            li.addEventListener('mouseup', () => clearTimeout(holdTimer));
            li.addEventListener('touchstart', () => { holdTimer = setTimeout(() => { showDeleteModal('daily', state.currentDate, index); }, 600); }, {passive: true});
            li.addEventListener('touchend', () => clearTimeout(holdTimer));
 
 
            container.appendChild(li);
        });
    }
    function addExpTodo() {
        const input = document.getElementById('newTodoExpInput');
        const text = input.value.trim();
        if(text) {
            const data = getDayData(state.currentDate);
            data.todos.push({ id: Date.now(), text: text, done: false });
            saveState(); renderTodos(); input.value = '';
        }
    }
    document.getElementById('newTodoExpInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExpTodo(); });
 
 
    // --- カレンダー画面 ---
    function renderCalendar() {
        const grid = document.getElementById('calGrid');
        const heads = grid.querySelectorAll('.cal-head');
        grid.innerHTML = ''; heads.forEach(h => grid.appendChild(h));
 
 
        document.getElementById('calTitle').innerText = `${calYear}年 ${calMonth+1}月`;
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
        const prevDays = new Date(calYear, calMonth, 0).getDate();
        const today = new Date();
 
 
        for(let i=firstDay-1; i>=0; i--) {
            const d = document.createElement('div'); d.className = 'cal-day other'; d.innerText = prevDays - i; grid.appendChild(d);
        }
        
        for(let i=1; i<=totalDays; i++) {
            const d = document.createElement('div');
            const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            d.className = 'cal-day';
            
            if(today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === i) {
                d.classList.add('today');
            }
            if(state.marks[dateStr]) {
                d.classList.add('marked');
                d.setAttribute('data-mark-label', state.marks[dateStr]);
            }
            d.innerText = i;
            d.onclick = () => { setCurrentDate(dateStr); switchView('planner'); };
 
 
            let holdTimerCal;
            d.addEventListener('mousedown', () => { holdTimerCal = setTimeout(() => openMarkModal(dateStr), 600); });
            d.addEventListener('mouseup', () => clearTimeout(holdTimerCal));
            d.addEventListener('touchstart', () => { holdTimerCal = setTimeout(() => openMarkModal(dateStr), 600); }, {passive: true});
            d.addEventListener('touchend', () => clearTimeout(holdTimerCal));
            grid.appendChild(d);
        }
 
 
        const remaining = 42 - (firstDay + totalDays);
        for(let i=1; i<=remaining; i++) {
            const d = document.createElement('div'); d.className = 'cal-day other'; d.innerText = i; grid.appendChild(d);
        }
        renderCalFooter();
    }
 
 
    function changeCalMonth(delta) {
        calMonth += delta; if(calMonth > 11) { calMonth = 0; calYear++; } if(calMonth < 0) { calMonth = 11; calYear--; }
        renderCalendar();
    }
 
 
    // カレンダーの記録
    function openMarkModal(dateStr) {
        pendingMarkDate = dateStr;
        const d = new Date(dateStr + 'T00:00:00');
        document.getElementById('markTitle').innerText = `記録 ${d.getMonth()+1}月${d.getDate()}日`;
        document.getElementById('markInput').value = state.marks[dateStr] || '';
        document.getElementById('markModal').classList.add('open');
    }
    function closeMarkModal() { document.getElementById('markModal').classList.remove('open'); pendingMarkDate = null; }
    function confirmMark() {
        if(pendingMarkDate) {
            const text = document.getElementById('markInput').value.trim();
            if(text) state.marks[pendingMarkDate] = text;
            else delete state.marks[pendingMarkDate];
            saveState(); renderCalendar(); closeMarkModal();
        }
    }
 
 
    // カレンダー下部
    function renderCalFooter() {
        const markList = document.getElementById('calMarkList'); markList.innerHTML = '';
        const todoList = document.getElementById('monthlyTodoList'); todoList.innerHTML = '';
        const prefix = `${calYear}-${String(calMonth+1).padStart(2,'0')}`;
 
 
        for (const [dateStr, val] of Object.entries(state.marks)) {
            if(dateStr.startsWith(prefix)) {
                const item = document.createElement('div'); item.className = 'calendar-mark-item';
                item.innerHTML = `<span class="calendar-mark-dot">●</span> ${dateStr.split('-')[2]}日: ${val}`;
                markList.appendChild(item);
            }
        }
        if(markList.children.length === 0) markList.innerHTML = '<div class="empty-state">今月の特別な日はまだありません</div>';
 
 
        // 月間リスト（長押し削除対応）
        if(state.monthlyTodos && state.monthlyTodos.length > 0) {
            state.monthlyTodos.forEach((t, idx) => {
                if(typeof t === 'string') state.monthlyTodos[idx] = { text: t, done: false };
                t = state.monthlyTodos[idx];
                
                const item = document.createElement('div'); item.className = `cal-todo-item ${t.done ? 'done' : ''}`;
                item.innerHTML = `<div class="cal-todo-check">✓</div><span class="cal-todo-text">${t.text}</span>`;
                item.onclick = () => { t.done = !t.done; saveState(); renderCalFooter(); };
                
                // 月度清单长按删除
                item.addEventListener('mousedown', () => { holdTimer = setTimeout(() => { showDeleteModal('monthly', null, idx); }, 600); });
                item.addEventListener('mouseup', () => clearTimeout(holdTimer));
                item.addEventListener('touchstart', () => { holdTimer = setTimeout(() => { showDeleteModal('monthly', null, idx); }, 600); }, {passive: true});
                item.addEventListener('touchend', () => clearTimeout(holdTimer));
 
 
                todoList.appendChild(item);
            });
        } else {
            todoList.innerHTML = '<div class="empty-state">月間目標はまだありません</div>';
        }
    }
 
 
    function addMonthlyTodo() {
        const input = document.getElementById('monthlyTodoInput');
        const text = input.value.trim();
        if(text) { state.monthlyTodos.push({ text: text, done: false }); saveState(); renderCalFooter(); input.value = ''; }
    }
 
 
    // --- 長押し削除のロジック ---
    function showDeleteModal(type, date, index) {
        deleteContext.type = type;
        deleteContext.date = date;
        deleteContext.index = index;
        document.getElementById('deleteTextPlaceholder').innerText = type === 'daily' ? '今日のリストからこのタスクを削除してもよろしいですか？' : '月間リストからこの目標を削除してもよろしいですか？';
        document.getElementById('deleteConfirmModal').classList.add('open');
    }
 
 
    function closeDeleteModal() {
        document.getElementById('deleteConfirmModal').classList.remove('open');
        deleteContext = { type: null, date: null, index: null };
    }
 
 
    function executeDelete() {
        if(deleteContext.type === 'daily' && deleteContext.date) {
            const data = getDayData(deleteContext.date);
            if(data && data.todos && data.todos.length > deleteContext.index) {
                data.todos.splice(deleteContext.index, 1);
                saveState(); renderTodos();
            }
        } else if(deleteContext.type === 'monthly') {
            if(state.monthlyTodos && state.monthlyTodos.length > deleteContext.index) {
                state.monthlyTodos.splice(deleteContext.index, 1);
                saveState(); renderCalFooter();
            }
        }
        closeDeleteModal();
    }
 
 
    // --- 日期跳转 ---
    function openDatePicker() {
        const d = new Date(state.currentDate + 'T00:00:00');
        const selYear = document.getElementById('jumpYear'); selYear.innerHTML = '';
        for(let i=d.getFullYear()-5; i<=d.getFullYear()+5; i++) {
            const opt = document.createElement('option'); opt.value = i; opt.innerText = i; if(i===d.getFullYear()) opt.selected = true; selYear.appendChild(opt);
        }
        const selMonth = document.getElementById('jumpMonth'); selMonth.innerHTML = '';
        for(let i=0; i<12; i++) {
            const opt = document.createElement('option'); opt.value = i; opt.innerText = i+1; if(i===d.getMonth()) opt.selected = true; selMonth.appendChild(opt);
        }
        document.getElementById('jumpDay').value = d.getDate();
        document.getElementById('datePickerModal').classList.add('open');
    }
    function closeDatePicker() { document.getElementById('datePickerModal').classList.remove('open'); }
    function applyJumpDate() {
        const y = parseInt(document.getElementById('jumpYear').value);
        const m = parseInt(document.getElementById('jumpMonth').value);
        const d = parseInt(document.getElementById('jumpDay').value);
        if(y && m>=0 && m<=11 && d>=1 && d<=new Date(y, m+1, 0).getDate()) {
            const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            setCurrentDate(dateStr); closeDatePicker();
        } else { alert("有効な日付を入力してください"); }
    }
 
 
    // --- ビュー切り替え ---
    function switchView(viewId, el) {
        document.querySelectorAll('.view-page').forEach(v => v.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        if(el) el.classList.add('active');
        if(viewId === 'calendar') renderCalendar();
        if(viewId === 'planner') { renderWeekList(); renderMonthScroll(); }
    }
 
 
    // ==================== 初心者ガイド + オープニングアニメーション ====================
    
    // オープニングアニメーション制御
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.getElementById('splashScreen').classList.add('hidden');
        }, 1500); // 1.5秒後に自動で消える
 
 
        // チュートリアルを見たか確認
        setTimeout(() => {
            if (!state.tutorialShown) {
                openTutorial();
                state.tutorialShown = true;
                saveState();
            }
        }, 1600); // アニメーション終了後に判定
    });
 
 
    // チュートリアルを開く（グローバル呼び出し）
    function openTutorial() {
        document.getElementById('tutorialOverlay').classList.add('open');
    }
 
 
    // チュートリアルを閉じる（既読状態にする）
    function closeTutorial() {
        document.getElementById('tutorialOverlay').classList.remove('open');
        state.tutorialShown = true;
        saveState();
    }
 
 
    // テーマパネル内でチュートリアルをもう一度見るための連動関数
    function closeThemeAndOpenTutorial() {
        document.getElementById('themeDrawer').classList.remove('open');
        setTimeout(() => {
            openTutorial();
        }, 300); // パネルを閉じた後に少し遅延させる
    }
 
 
    const clickActions = {
        'open-date-picker': openDatePicker,
        'select-image': () => document.getElementById('fileInput').click(),
        'add-daily-todo': addExpTodo,
        'add-monthly-todo': addMonthlyTodo,
        'open-theme-drawer': () => document.getElementById('themeDrawer').classList.add('open'),
        'close-lightbox': () => document.getElementById('lightbox').classList.remove('open'),
        'close-date-picker': closeDatePicker,
        'apply-jump-date': applyJumpDate,
        'close-mark-modal': closeMarkModal,
        'confirm-mark': confirmMark,
        'close-delete-modal': closeDeleteModal,
        'execute-delete': executeDelete,
        'close-tutorial': closeTutorial,
        'close-theme-drawer': () => document.getElementById('themeDrawer').classList.remove('open'),
        'open-tutorial-from-theme': closeThemeAndOpenTutorial
    };
 
 
    document.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) return;
 
 
        const actionElement = event.target.closest('[data-action]');
        if (actionElement) {
            clickActions[actionElement.dataset.action]?.();
            return;
        }
 
 
        const viewElement = event.target.closest('[data-view]');
        if (viewElement) {
            switchView(viewElement.dataset.view, viewElement);
            return;
        }
 
 
        const monthElement = event.target.closest('[data-month-change]');
        if (monthElement) {
            changeCalMonth(Number(monthElement.dataset.monthChange));
            return;
        }
 
 
        const themeElement = event.target.closest('[data-theme]');
        if (themeElement) {
            setTheme(themeElement.dataset.theme);
            return;
        }
 
 
        const backdrop = event.target.closest('[data-backdrop-action]');
        if (backdrop === event.target) {
            clickActions[backdrop.dataset.backdropAction]?.();
        }
    });
 
 
    // --- 起動 ---
    loadState();
    if(state.theme) document.querySelector('.app-container').classList.add(state.theme);
    renderMonthScroll();
    setCurrentDate(state.currentDate);
