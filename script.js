(function() {
    // ================== ДАННЫЕ ==================
    let currentUser = null;
    let users = [];
    let posts = [];
    let notifications = [];
    let friendships = [];
    let messages = [];
    let communities = [];
    let communityMembers = [];
    let communityPosts = [];
    let verificationRequests = [];
    let communityVerifyRequests = [];
    let typingStatus = {};
    let communityChats = [];
    let bannedUsers = [];

    const OWNER_EMAIL = 'foxi@knb.com';

    const STORAGE_KEYS = {
        USERS: 'knb_users',
        POSTS: 'knb_posts',
        NOTIFICATIONS: 'knb_notifications',
        FRIENDSHIPS: 'knb_friendships',
        MESSAGES: 'knb_messages',
        COMMUNITIES: 'knb_communities',
        COMMUNITY_MEMBERS: 'knb_community_members',
        COMMUNITY_POSTS: 'knb_community_posts',
        VERIFY_REQUESTS: 'knb_verify_requests',
        COMMUNITY_VERIFY_REQUESTS: 'knb_community_verify_requests',
        CURRENT_USER: 'knb_current_user',
        TYPING: 'knb_typing',
        COMMUNITY_CHATS: 'knb_community_chats',
        GROUPS: 'knb_groups',
        BANNED_USERS: 'knb_banned_users'
    };

    function loadData() {
        users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
        posts = JSON.parse(localStorage.getItem(STORAGE_KEYS.POSTS)) || [];
        notifications = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
        friendships = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDSHIPS)) || [];
        messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES)) || [];
        communities = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITIES)) || [];
        communityMembers = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_MEMBERS)) || [];
        communityPosts = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS)) || [];
        verificationRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.VERIFY_REQUESTS)) || [];
        communityVerifyRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_VERIFY_REQUESTS)) || [];
        typingStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.TYPING)) || {};
        communityChats = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMMUNITY_CHATS)) || [];
        bannedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.BANNED_USERS)) || [];

        const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (savedUserId) {
            currentUser = users.find(u => u.id === savedUserId) || null;
        }

        if (users.length === 0) {
            const owner = {
                id: 'user_' + Date.now() + '_1',
                email: OWNER_EMAIL,
                password: 'admin005',
                name: 'Foxi005305',
                username: '@foxi005305',
                bio: 'Владелец KNB',
                avatar: '',
                banner: '',
                verified: true,
                theme: 'dark',
                friends: [],
                createdAt: new Date().toISOString()
            };
            users.push(owner);
            saveUsers();

            const welcomePost = {
                id: 'post_' + Date.now(),
                authorId: owner.id,
                text: 'Добро пожаловать в KNB! Это первый пост.',
                media: null,
                likes: [],
                comments: [],
                reposts: 0,
                timestamp: new Date().toISOString()
            };
            posts.push(welcomePost);
            savePosts();
        }
    }

    function saveUsers() { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }
    function savePosts() { localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts)); }
    function saveNotifications() { localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)); }
    function saveFriendships() { localStorage.setItem(STORAGE_KEYS.FRIENDSHIPS, JSON.stringify(friendships)); }
    function saveMessages() { localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages)); }
    function saveCommunities() { localStorage.setItem(STORAGE_KEYS.COMMUNITIES, JSON.stringify(communities)); }
    function saveCommunityMembers() { localStorage.setItem(STORAGE_KEYS.COMMUNITY_MEMBERS, JSON.stringify(communityMembers)); }
    function saveCommunityPosts() { localStorage.setItem(STORAGE_KEYS.COMMUNITY_POSTS, JSON.stringify(communityPosts)); }
    function saveVerifyRequests() { localStorage.setItem(STORAGE_KEYS.VERIFY_REQUESTS, JSON.stringify(verificationRequests)); }
    function saveCommunityVerifyRequests() { localStorage.setItem(STORAGE_KEYS.COMMUNITY_VERIFY_REQUESTS, JSON.stringify(communityVerifyRequests)); }
    function saveTyping() { localStorage.setItem(STORAGE_KEYS.TYPING, JSON.stringify(typingStatus)); }
    function saveCommunityChats() { localStorage.setItem(STORAGE_KEYS.COMMUNITY_CHATS, JSON.stringify(communityChats)); }
    function saveBannedUsers() { localStorage.setItem(STORAGE_KEYS.BANNED_USERS, JSON.stringify(bannedUsers)); }
    function saveCurrentUser() {
        if (currentUser) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser.id);
        else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    function findUserById(id) { return users.find(u => u.id === id); }
    function findUserByEmail(email) { return users.find(u => u.email === email); }
    function findUserByUsername(username) { return users.find(u => u.username === username); }
    function findCommunityById(id) { return communities.find(c => c.id === id); }
    function isUserBanned(userId) { return bannedUsers.some(b => b.userId === userId); }

    // Тема
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.remove('light-theme');
    } else {
        document.documentElement.classList.add('light-theme');
    }

    // ================== ЭЛЕМЕНТЫ ==================
    const centerPanel = document.getElementById('center-panel');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const userActions = document.getElementById('user-actions');
    const navMenu = document.getElementById('nav-menu');
    const authModal = document.getElementById('auth-modal');
    const postModal = document.getElementById('post-modal');
    const commentsModal = document.getElementById('comments-modal');
    const verifyModal = document.getElementById('verify-modal');
    const callModal = document.getElementById('call-modal');
    const createCommunityModal = document.getElementById('create-community-modal');
    const adminPanelBtn = document.getElementById('admin-panel-btn');
    const menuToggle = document.getElementById('menuToggle');
    const rightPanelToggle = document.getElementById('rightPanelToggle');

    let currentPage = 'feed';
    let currentChatId = null;
    let typingTimer = null;
    let adminTab = 'overview'; // вкладка в админ панели

    // Мобильное меню
    menuToggle.addEventListener('click', () => {
        leftPanel.classList.toggle('open');
        rightPanel.classList.remove('open');
    });
    rightPanelToggle.addEventListener('click', () => {
        rightPanel.classList.toggle('open');
        leftPanel.classList.remove('open');
    });
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!leftPanel.contains(e.target) && !menuToggle.contains(e.target)) leftPanel.classList.remove('open');
            if (!rightPanel.contains(e.target) && !rightPanelToggle.contains(e.target)) rightPanel.classList.remove('open');
        }
    });

    function render() {
        renderHeader();
        renderNav();
        renderRightPanel();
        renderCenter(currentPage);
    }

    function renderHeader() {
        if (currentUser) {
            const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
            userActions.innerHTML = `
                <span class="header-icon" id="theme-toggle"><i class="fas fa-adjust"></i></span>
                <span class="header-icon" id="notifications-icon" style="position:relative;">
                    <i class="fas fa-bell"></i>
                    ${unreadCount > 0 ? `<span class="notif-badge">${unreadCount}</span>` : ''}
                </span>
                <img src="${currentUser.avatar || 'https://via.placeholder.com/40'}" alt="avatar" class="avatar" style="width:40px;height:40px; cursor:pointer; object-fit:cover;" id="profile-avatar-header">
            `;
            document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
            document.getElementById('notifications-icon')?.addEventListener('click', () => setPage('notifications'));
            document.getElementById('profile-avatar-header')?.addEventListener('click', () => setPage('profile'));
        } else {
            userActions.innerHTML = `<button id="show-auth-btn">Войти</button>`;
            document.getElementById('show-auth-btn')?.addEventListener('click', () => showAuthModal('login'));
        }
    }

    function renderNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === currentPage) item.classList.add('active');
        });
        if (currentUser && currentUser.email === OWNER_EMAIL) {
            adminPanelBtn.style.display = 'flex';
        } else {
            adminPanelBtn.style.display = 'none';
        }

        // Онлайн друзья (условно — те, кто зарегистрирован за последние 7 дней)
        const friendsOnlineEl = document.getElementById('friends-online');
        if (friendsOnlineEl && currentUser) {
            const friendsList = (currentUser.friends || []).map(id => findUserById(id)).filter(u => u);
            if (friendsList.length === 0) {
                friendsOnlineEl.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;">Нет друзей онлайн</p>';
            } else {
                friendsOnlineEl.innerHTML = friendsList.slice(0, 5).map(f =>
                    `<div class="friend-item pointer" onclick="viewProfile('${f.id}')" style="padding:0.4rem 0.5rem;">
                        <img src="${f.avatar || 'https://via.placeholder.com/32'}" class="avatar" style="width:32px;height:32px;">
                        <span style="font-size:0.85rem;">${f.name}</span>
                        <span class="online-dot"></span>
                    </div>`
                ).join('');
            }
        }
    }

    function renderRightPanel() {
        if (!currentUser) {
            document.getElementById('suggested-users').innerHTML = '<p style="color:var(--text-secondary);">Войдите, чтобы видеть рекомендации</p>';
            document.getElementById('recent-notifications').innerHTML = '<p style="color:var(--text-secondary);">Войдите, чтобы видеть уведомления</p>';
            return;
        }

        const suggested = users.filter(u => u.id !== currentUser?.id && !currentUser?.friends?.includes(u.id) && !isUserBanned(u.id)).slice(0, 3);
        let html = '';
        suggested.forEach(u => {
            html += `<div class="friend-item pointer" onclick="viewProfile('${u.id}')">
                <img src="${u.avatar || 'https://via.placeholder.com/40'}" class="avatar" style="width:40px;height:40px; object-fit:cover;">
                <div>
                    <div style="display:flex; align-items:center; gap:0.2rem;">${u.name} ${u.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</div>
                    <div style="color:var(--text-secondary);">${u.username}</div>
                </div>
            </div>`;
        });
        document.getElementById('suggested-users').innerHTML = html || '<p style="color:var(--text-secondary);">Нет рекомендаций</p>';

        const recent = notifications.filter(n => n.userId === currentUser?.id).slice(-3).reverse();
        let notifHtml = '';
        recent.forEach(n => {
            notifHtml += `<div class="notification">${n.text}</div>`;
        });
        document.getElementById('recent-notifications').innerHTML = notifHtml || '<p style="color:var(--text-secondary);">Нет уведомлений</p>';
    }

    function renderCenter(page) {
        if (!currentUser) {
            centerPanel.innerHTML = `
                <div class="welcome-screen">
                    <h1>KNB</h1>
                    <p>Войдите, чтобы увидеть ленту, общаться с друзьями и многое другое</p>
                    <button id="welcome-login-btn">Войти</button>
                    <button class="secondary" id="welcome-register-btn">Зарегистрироваться</button>
                </div>
            `;
            document.getElementById('welcome-login-btn')?.addEventListener('click', () => showAuthModal('login'));
            document.getElementById('welcome-register-btn')?.addEventListener('click', () => showAuthModal('register'));
            return;
        }

        switch(page) {
            case 'feed': renderFeed(); break;
            case 'profile': renderProfile(currentUser); break;
            case 'communities': renderCommunities(); break;
            case 'friends': renderFriends(); break;
            case 'messages': renderMessagesList(); break;
            case 'notifications': renderNotifications(); break;
            case 'settings': renderSettings(); break;
            case 'admin': renderAdminPanel(); break;
            case 'search': renderSearchResults(window._lastSearchQuery || ''); break;
            default: renderFeed();
        }
    }

    // ================== FEED ==================
    function renderFeed() {
        let allPosts = [
            ...posts.map(p => ({ ...p, type: 'user', author: findUserById(p.authorId) })),
            ...communityPosts.map(p => ({ ...p, type: 'community', author: findCommunityById(p.communityId) }))
        ];
        // Фильтруем посты от забаненных пользователей
        allPosts = allPosts.filter(p => p.author && !isUserBanned(p.authorId));
        allPosts.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        let html = `<div style="margin-bottom:1rem;"><button id="create-post-btn" class="secondary"><i class="fas fa-plus"></i> Создать пост</button></div>`;
        allPosts.forEach(post => {
            if (!post.author) return;
            const isLiked = currentUser && post.likes?.includes(currentUser.id);
            html += `
            <div class="post" data-post-id="${post.id}">
                <div class="post-header" onclick="${post.type === 'user' ? `viewProfile('${post.authorId}')` : `viewCommunity('${post.communityId}')`}">
                    <img src="${post.author.avatar || 'https://via.placeholder.com/48'}" class="avatar">
                    <div>
                        <div class="post-author">
                            ${post.author.name} ${post.author.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''} ${post.type === 'community' ? '<i class="fas fa-users" style="font-size:0.8rem;"></i>' : ''}
                            <span class="post-time"> · ${new Date(post.timestamp).toLocaleString()}</span>
                        </div>
                        <div style="color:var(--text-secondary);">${post.author.username || ''}</div>
                    </div>
                </div>
                <div class="post-content">${post.text}</div>
                ${post.media ? (post.media.type.startsWith('image/') ? `<img src="${post.media.url}" class="post-media">` : 
                    post.media.type.startsWith('video/') ? `<video controls src="${post.media.url}" class="post-media"></video>` : 
                    post.media.type.startsWith('audio/') ? `<audio controls src="${post.media.url}" class="post-media"></audio>` : '') : ''}
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" data-type="${post.type}"><i class="fas fa-heart"></i> ${post.likes?.length || 0}</button>
                    <button class="action-btn comment-btn" data-post-id="${post.id}" data-type="${post.type}"><i class="fas fa-comment"></i> ${post.comments?.length || 0}</button>
                    <button class="action-btn repost-btn" data-post-id="${post.id}" data-type="${post.type}"><i class="fas fa-retweet"></i> ${post.reposts || 0}</button>
                    ${currentUser && (post.authorId === currentUser.id || currentUser.email === OWNER_EMAIL) ? 
                        `<button class="action-btn delete-post-btn" data-post-id="${post.id}" data-type="${post.type}" style="color:var(--accent-red);"><i class="fas fa-trash"></i></button>` : ''}
                </div>
                <div class="comment-section">
                    ${post.comments?.slice(-2).map(c => {
                        const commentAuthor = findUserById(c.userId);
                        return commentAuthor ? `
                        <div class="comment">
                            <img src="${commentAuthor.avatar || 'https://via.placeholder.com/32'}" class="comment-avatar">
                            <div class="comment-content">
                                <span class="comment-author">${commentAuthor.name} ${commentAuthor.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</span>
                                <span>${c.text}</span>
                            </div>
                        </div>` : '';
                    }).join('')}
                </div>
            </div>`;
        });
        centerPanel.innerHTML = html || '<p style="text-align:center;">Нет постов.</p>';

        document.getElementById('create-post-btn')?.addEventListener('click', () => postModal.classList.add('active'));

        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = btn.dataset.postId;
                const type = btn.dataset.type;
                let post;
                if (type === 'user') post = posts.find(p => p.id === postId);
                else post = communityPosts.find(p => p.id === postId);
                if (!post) return;
                if (post.likes.includes(currentUser.id)) {
                    post.likes = post.likes.filter(id => id !== currentUser.id);
                } else {
                    post.likes.push(currentUser.id);
                    if (type === 'user' && post.authorId !== currentUser.id) {
                        addNotification(post.authorId, `${currentUser.name} лайкнул ваш пост.`);
                    }
                }
                if (type === 'user') savePosts(); else saveCommunityPosts();
                renderFeed();
            });
        });

        document.querySelectorAll('.comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                const type = btn.dataset.type;
                let post;
                if (type === 'user') post = posts.find(p => p.id === postId);
                else post = communityPosts.find(p => p.id === postId);
                if (post) openCommentsModal(post, type);
            });
        });

        document.querySelectorAll('.repost-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = btn.dataset.postId;
                const type = btn.dataset.type;
                let original;
                if (type === 'user') original = posts.find(p => p.id === postId);
                else original = communityPosts.find(p => p.id === postId);
                if (!original) return;
                const newPost = {
                    id: 'post_' + Date.now(),
                    authorId: currentUser.id,
                    text: `🔁 Репост: ${original.text}`,
                    media: original.media,
                    likes: [],
                    comments: [],
                    reposts: 0,
                    timestamp: new Date().toISOString()
                };
                posts.push(newPost);
                original.reposts = (original.reposts || 0) + 1;
                if (type === 'user') savePosts(); else { saveCommunityPosts(); savePosts(); }
                renderFeed();
            });
        });

        document.querySelectorAll('.delete-post-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!confirm('Удалить этот пост?')) return;
                const postId = btn.dataset.postId;
                const type = btn.dataset.type;
                if (type === 'user') {
                    posts = posts.filter(p => p.id !== postId);
                    savePosts();
                } else {
                    communityPosts = communityPosts.filter(p => p.id !== postId);
                    saveCommunityPosts();
                }
                renderFeed();
            });
        });
    }

    // ================== ПРОФИЛЬ ==================
    // ИСПРАВЛЕНИЕ: была ошибка — viewProfile не была глобальной до конца IIFE
    window.viewProfile = function(userId) {
        const user = findUserById(userId);
        if (!user) return;
        currentPage = 'profile';
        renderProfile(user);
    };

    function renderProfile(user) {
        if (!user) user = currentUser;
        if (!currentUser) return;
        const isOwner = currentUser.id === user.id;
        const isFriend = currentUser.friends?.includes(user.id);
        const outgoingRequest = friendships.find(f => f.from === currentUser.id && f.to === user.id && f.status === 'pending');
        const incomingRequest = friendships.find(f => f.from === user.id && f.to === currentUser.id && f.status === 'pending');
        const banned = isUserBanned(user.id);

        let html = `
            <div class="profile-banner" style="background-image: url('${user.banner || 'https://via.placeholder.com/800x200?text=KNB'}');"></div>
            <div style="display:flex; align-items:flex-end; gap:1rem; padding:0 2rem; flex-wrap:wrap;">
                <img src="${user.avatar || 'https://via.placeholder.com/120'}" class="profile-avatar">
                <div style="display:flex; gap:0.5rem; margin-left:auto; flex-wrap:wrap;">
                    ${isOwner ? '<button id="edit-profile-btn" class="secondary">Редактировать</button>' : ''}
                    ${!isOwner ? (isFriend ? '<button class="secondary" disabled>В друзьях</button>' : 
                        (outgoingRequest ? '<button disabled>Заявка отправлена</button>' : 
                        (incomingRequest ? '<button id="accept-friend-btn">Принять заявку</button>' : 
                        '<button id="add-friend-btn">Добавить в друзья</button>'))) : ''}
                    ${!isOwner && !banned ? '<button id="send-msg-btn" class="secondary"><i class="fas fa-envelope"></i> Сообщение</button>' : ''}
                    ${banned ? '<span style="color:var(--accent-red);font-weight:600;">🚫 Забанен</span>' : ''}
                </div>
            </div>
            <div class="profile-info">
                <h2 style="display:flex; align-items:center; gap:0.4rem;">${user.name} ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</h2>
                <div style="color:var(--text-secondary);">${user.username}</div>
                <p style="margin:1rem 0;">${user.bio || ''}</p>
                <div style="display:flex; gap:1.5rem; color:var(--text-secondary);">
                    <span><strong style="color:var(--text-primary);">${user.friends?.length || 0}</strong> друзей</span>
                    <span><strong style="color:var(--text-primary);">${posts.filter(p => p.authorId === user.id).length}</strong> постов</span>
                    <span>С нами с <strong style="color:var(--text-primary);">${new Date(user.createdAt).toLocaleDateString()}</strong></span>
                </div>
            </div>
            <h3 style="padding:0 2rem 1rem;">Посты пользователя</h3>
        `;

        const userPosts = posts.filter(p => p.authorId === user.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (userPosts.length === 0) {
            html += '<p style="padding:0 2rem; color:var(--text-secondary);">Пока нет постов.</p>';
        }
        userPosts.forEach(post => {
            const isLiked = post.likes?.includes(currentUser.id);
            html += `<div class="post" style="margin:0.5rem 2rem 1rem;">
                <div class="post-content">${post.text}</div>
                ${post.media ? (post.media.type.startsWith('image/') ? `<img src="${post.media.url}" class="post-media">` : '') : ''}
                <div class="post-actions">
                    <span style="color:var(--text-secondary);"><i class="fas fa-heart"></i> ${post.likes?.length || 0}</span>
                    <span style="color:var(--text-secondary);"><i class="fas fa-comment"></i> ${post.comments?.length || 0}</span>
                    <span style="color:var(--text-secondary);">${new Date(post.timestamp).toLocaleDateString()}</span>
                </div>
            </div>`;
        });
        centerPanel.innerHTML = html;

        if (isOwner) document.getElementById('edit-profile-btn')?.addEventListener('click', () => setPage('settings'));
        
        if (!isOwner) {
            if (incomingRequest) {
                document.getElementById('accept-friend-btn')?.addEventListener('click', () => {
                    const req = friendships.find(f => f.from === user.id && f.to === currentUser.id);
                    if (req) {
                        req.status = 'accepted';
                        if (!currentUser.friends) currentUser.friends = [];
                        if (!user.friends) user.friends = [];
                        currentUser.friends.push(user.id);
                        user.friends.push(currentUser.id);
                        addNotification(user.id, `${currentUser.name} принял вашу заявку в друзья.`);
                        saveUsers(); saveFriendships();
                        renderProfile(user);
                    }
                });
            } else if (!isFriend && !outgoingRequest) {
                document.getElementById('add-friend-btn')?.addEventListener('click', () => {
                    friendships.push({ id: 'f_' + Date.now(), from: currentUser.id, to: user.id, status: 'pending', timestamp: new Date().toISOString() });
                    addNotification(user.id, `${currentUser.name} отправил вам заявку в друзья.`);
                    saveFriendships();
                    renderProfile(user);
                });
            }
            if (!banned) {
                document.getElementById('send-msg-btn')?.addEventListener('click', () => {
                    const chatId = getChatId(currentUser.id, user.id);
                    setPage('messages');
                    setTimeout(() => openChat(chatId), 100);
                });
            }
        }
    }

    function getChatId(uid1, uid2) {
        const sorted = [uid1, uid2].sort();
        return `chat_${sorted[0]}_${sorted[1]}`;
    }

    // ================== ПОИСК (ИСПРАВЛЕНИЕ: был только alert) ==================
    window.renderSearchResults = function(query) {
        if (!currentUser) return;
        const q = query.toLowerCase();
        const userResults = users.filter(u => 
            (u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)) && !isUserBanned(u.id)
        );
        const communityResults = communities.filter(c =>
            c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
        );
        const postResults = posts.filter(p => p.text.toLowerCase().includes(q) && !isUserBanned(p.authorId));

        let html = `<h2>Результаты поиска: "${query}"</h2>`;
        
        if (userResults.length > 0) {
            html += '<h3 style="margin:1rem 0 0.5rem;">Пользователи</h3>';
            userResults.forEach(u => {
                html += `<div class="friend-item pointer" onclick="viewProfile('${u.id}')">
                    <img src="${u.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                    <div>
                        <div>${u.name} ${u.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</div>
                        <div style="color:var(--text-secondary);">${u.username}</div>
                    </div>
                </div>`;
            });
        }

        if (communityResults.length > 0) {
            html += '<h3 style="margin:1rem 0 0.5rem;">Сообщества</h3>';
            communityResults.forEach(c => {
                html += `<div class="community-card pointer" onclick="viewCommunity('${c.id}')">
                    <img src="${c.avatar || 'https://via.placeholder.com/64'}" class="community-avatar">
                    <div><strong>${c.name}</strong><p style="color:var(--text-secondary);">${c.description || ''}</p></div>
                </div>`;
            });
        }

        if (postResults.length > 0) {
            html += '<h3 style="margin:1rem 0 0.5rem;">Посты</h3>';
            postResults.forEach(p => {
                const author = findUserById(p.authorId);
                if (!author) return;
                html += `<div class="post">
                    <div class="post-header" onclick="viewProfile('${author.id}')">
                        <img src="${author.avatar || 'https://via.placeholder.com/48'}" class="avatar">
                        <div>
                            <div class="post-author">${author.name}</div>
                            <div style="color:var(--text-secondary);">${new Date(p.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="post-content">${p.text}</div>
                </div>`;
            });
        }

        if (userResults.length === 0 && communityResults.length === 0 && postResults.length === 0) {
            html += '<p style="color:var(--text-secondary); margin-top:1rem;">Ничего не найдено.</p>';
        }
        centerPanel.innerHTML = html;
    };

    document.getElementById('search-input')?.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length < 2) {
            if (currentPage === 'search') setPage('feed');
            return;
        }
        window._lastSearchQuery = query;
        currentPage = 'search';
        renderSearchResults(query);
    });

    // ================== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ УВЕДОМЛЕНИЙ ==================
    function addNotification(userId, text) {
        notifications.push({
            id: 'notif_' + Date.now() + '_' + Math.random(),
            userId,
            text,
            read: false,
            timestamp: new Date().toISOString()
        });
        saveNotifications();
    }

    // ================== ДРУЗЬЯ ==================
    function renderFriends() {
        if (!currentUser) return;
        const friendsList = (currentUser.friends || []).map(id => findUserById(id)).filter(u => u);
        let html = '<h2>Мои друзья</h2>';
        if (friendsList.length === 0) html += '<p style="color:var(--text-secondary);">У вас пока нет друзей.</p>';
        friendsList.forEach(f => {
            html += `
            <div class="friend-item pointer" onclick="viewProfile('${f.id}')">
                <img src="${f.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                <div style="flex:1;">
                    <div>${f.name} ${f.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</div>
                    <div style="color:var(--text-secondary); font-size:0.85rem;">${f.username}</div>
                </div>
                <button style="margin-left:auto;" class="secondary" onclick="event.stopPropagation(); removeFriend('${f.id}')">Удалить</button>
            </div>`;
        });
        const incoming = friendships.filter(f => f.to === currentUser.id && f.status === 'pending').map(f => ({ ...f, user: findUserById(f.from) })).filter(f => f.user);
        if (incoming.length) {
            html += '<h3 style="margin:1rem 0 0.5rem;">Заявки в друзья</h3>';
            incoming.forEach(req => {
                html += `<div class="friend-item">
                    <img src="${req.user.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                    <div style="flex:1;">${req.user.name}</div>
                    <button onclick="acceptFriend('${req.id}')">Принять</button>
                    <button class="secondary" onclick="rejectFriend('${req.id}')">Отклонить</button>
                </div>`;
            });
        }
        centerPanel.innerHTML = html;
    }

    window.removeFriend = function(friendId) {
        currentUser.friends = currentUser.friends.filter(id => id !== friendId);
        const friend = findUserById(friendId);
        if (friend && friend.friends) friend.friends = friend.friends.filter(id => id !== currentUser.id);
        // Удалить запись дружбы
        friendships = friendships.filter(f => !((f.from === currentUser.id && f.to === friendId) || (f.from === friendId && f.to === currentUser.id)));
        saveUsers(); saveFriendships(); renderFriends();
    };
    window.acceptFriend = function(requestId) {
        const req = friendships.find(f => f.id === requestId);
        if (!req) return;
        req.status = 'accepted';
        const fromUser = findUserById(req.from);
        const toUser = findUserById(req.to);
        if (!fromUser.friends) fromUser.friends = [];
        if (!toUser.friends) toUser.friends = [];
        fromUser.friends.push(toUser.id);
        toUser.friends.push(fromUser.id);
        addNotification(fromUser.id, `${toUser.name} принял вашу заявку в друзья.`);
        saveUsers(); saveFriendships(); renderFriends();
    };
    window.rejectFriend = function(requestId) {
        friendships = friendships.filter(f => f.id !== requestId);
        saveFriendships(); renderFriends();
    };

    // ================== СООБЩЕСТВА ==================
    function renderCommunities() {
        let html = '<h2>Сообщества</h2><div style="margin-bottom:1rem;"><button id="create-community-btn" class="secondary"><i class="fas fa-plus"></i> Создать сообщество</button></div><div>';
        communities.forEach(c => {
            const memberCount = communityMembers.filter(m => m.communityId === c.id).length;
            html += `<div class="community-card pointer" onclick="viewCommunity('${c.id}')">
                <img src="${c.avatar || 'https://via.placeholder.com/64'}" class="community-avatar">
                <div>
                    <h3 style="display:flex;align-items:center;gap:0.3rem;">${c.name} ${c.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</h3>
                    <p style="color:var(--text-secondary);">${c.description || ''}</p>
                    <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:0.3rem;"><i class="fas fa-users"></i> ${memberCount} участников</p>
                </div>
            </div>`;
        });
        html += '</div>';
        centerPanel.innerHTML = html;
        document.getElementById('create-community-btn')?.addEventListener('click', () => createCommunityModal.classList.add('active'));
    }

    window.viewCommunity = function(communityId) {
        const community = findCommunityById(communityId);
        if (!community) return;
        renderCommunity(community);
    };

    function renderCommunity(community) {
        const isMember = communityMembers.some(m => m.communityId === community.id && m.userId === currentUser.id);
        const cPosts = communityPosts.filter(p => p.communityId === community.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        const memberCount = communityMembers.filter(m => m.communityId === community.id).length;
        let html = `
            <div class="profile-banner" style="background-image: url('${community.banner || 'https://via.placeholder.com/800x200'}');"></div>
            <div style="display:flex; align-items:flex-end; gap:1rem; padding:0 2rem;">
                <img src="${community.avatar || 'https://via.placeholder.com/120'}" class="profile-avatar">
                <div style="margin-left:auto; display:flex; gap:0.5rem; flex-wrap:wrap;">
                    ${!isMember ? '<button id="join-community-btn">Вступить</button>' : '<button id="leave-community-btn" class="secondary">Покинуть</button>'}
                    ${isMember ? '<button id="create-community-post-btn" class="secondary"><i class="fas fa-pen"></i> Пост</button>' : ''}
                    ${isMember ? '<button id="community-chat-btn" class="secondary"><i class="fas fa-comment"></i> Чат</button>' : ''}
                </div>
            </div>
            <div class="profile-info">
                <h2 style="display:flex;align-items:center;gap:0.4rem;">${community.name} ${community.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</h2>
                <p>${community.description || ''}</p>
                <p style="color:var(--text-secondary);"><i class="fas fa-users"></i> ${memberCount} участников</p>
            </div>
            <h3 style="padding:0 2rem 1rem;">Посты сообщества</h3>
        `;
        if (cPosts.length === 0) html += '<p style="padding:0 2rem;color:var(--text-secondary);">Пока нет постов.</p>';
        cPosts.forEach(post => {
            const author = findUserById(post.authorId);
            if (!author) return;
            html += `<div class="post" style="margin:0.5rem 2rem 1rem;">
                <div class="post-header" onclick="viewProfile('${author.id}')">
                    <img src="${author.avatar || 'https://via.placeholder.com/32'}" class="avatar" style="width:32px;height:32px;">
                    <span>${author.name}</span>
                </div>
                <div class="post-content">${post.text}</div>
            </div>`;
        });
        centerPanel.innerHTML = html;

        if (!isMember) {
            document.getElementById('join-community-btn')?.addEventListener('click', () => {
                communityMembers.push({ communityId: community.id, userId: currentUser.id, joinedAt: new Date().toISOString() });
                const chat = communityChats.find(c => c.communityId === community.id);
                if (chat) chat.members.push(currentUser.id);
                saveCommunityMembers(); saveCommunityChats();
                renderCommunity(community);
            });
        } else {
            document.getElementById('leave-community-btn')?.addEventListener('click', () => {
                communityMembers = communityMembers.filter(m => !(m.communityId === community.id && m.userId === currentUser.id));
                const chat = communityChats.find(c => c.communityId === community.id);
                if (chat) chat.members = chat.members.filter(id => id !== currentUser.id);
                saveCommunityMembers(); saveCommunityChats();
                renderCommunity(community);
            });
            document.getElementById('create-community-post-btn')?.addEventListener('click', () => {
                const text = prompt('Введите текст поста:');
                if (text && text.trim()) {
                    communityPosts.push({ id: 'commPost_' + Date.now(), communityId: community.id, authorId: currentUser.id, text: text.trim(), media: null, likes: [], comments: [], reposts: 0, timestamp: new Date().toISOString() });
                    saveCommunityPosts();
                    renderCommunity(community);
                }
            });
            document.getElementById('community-chat-btn')?.addEventListener('click', () => {
                const chat = communityChats.find(c => c.communityId === community.id);
                if (chat) openChat(chat.id);
            });
        }
    }

    // ================== СООБЩЕНИЯ ==================
    function renderMessagesList() {
        let allChats = [];
        const uniqueChatIds = [...new Set(messages.map(m => m.chatId))];
        uniqueChatIds.forEach(id => {
            if (id.startsWith('group_') || id.startsWith('commChat_')) return;
            const chatMsgs = messages.filter(m => m.chatId === id);
            const isParticipant = chatMsgs.some(m => m.senderId === currentUser.id) || id.includes(currentUser.id);
            if (!isParticipant) return;
            const lastMsg = chatMsgs.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
            const parts = id.replace('chat_', '').split('_');
            const otherId = parts.find(pid => pid !== currentUser.id);
            const other = findUserById(otherId);
            if (other) allChats.push({ id, title: other.name, avatar: other.avatar, lastMsg });
        });
        const groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
        groups.forEach(g => {
            if (g.members.includes(currentUser.id)) {
                const lastMsg = messages.filter(m => m.chatId === g.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                allChats.push({ id: g.id, title: g.name, avatar: null, lastMsg, type: 'group' });
            }
        });
        communityChats.forEach(cc => {
            if (cc.members.includes(currentUser.id)) {
                const lastMsg = messages.filter(m => m.chatId === cc.id).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
                allChats.push({ id: cc.id, title: cc.name, avatar: null, lastMsg, type: 'community' });
            }
        });
        allChats.sort((a,b) => new Date(b.lastMsg?.timestamp || 0) - new Date(a.lastMsg?.timestamp || 0));
        
        let html = '<h2>Сообщения</h2><div style="margin-bottom:1rem;"><button id="create-group-btn" class="secondary"><i class="fas fa-users"></i> Создать группу</button></div><div>';
        if (allChats.length === 0) html += '<p style="color:var(--text-secondary);">Нет диалогов.</p>';
        allChats.forEach(chat => {
            const icon = chat.type === 'group' ? 'fa-users' : (chat.type === 'community' ? 'fa-users-cog' : 'fa-user');
            html += `<div class="friend-item pointer" onclick="openChat('${chat.id}')">
                ${chat.avatar ? `<img src="${chat.avatar}" class="avatar" style="width:48px;height:48px;">` : `<div style="width:48px;height:48px;border-radius:50%;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center;"><i class="fas ${icon}"></i></div>`}
                <div style="flex:1;">
                    <div>${chat.title}</div>
                    ${chat.lastMsg ? `<div style="color:var(--text-secondary);font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;">${chat.lastMsg.text}</div>` : ''}
                </div>
            </div>`;
        });
        html += '</div>';
        centerPanel.innerHTML = html;
        document.getElementById('create-group-btn')?.addEventListener('click', createGroupModal);
    }

    function createGroupModal() {
        const existing = document.getElementById('create-group-modal');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.innerHTML = `
            <div class="modal active" id="create-group-modal">
                <div class="modal-content">
                    <h2>Создать группу</h2>
                    <div class="form-group"><label>Название группы</label><input type="text" id="group-name" placeholder="Моя группа"></div>
                    <button id="create-group-submit">Создать</button>
                    <button class="secondary" id="cancel-group" style="margin-top:0.5rem;">Отмена</button>
                </div>
            </div>`;
        document.body.appendChild(div);
        document.getElementById('cancel-group').addEventListener('click', () => div.remove());
        document.getElementById('create-group-submit').addEventListener('click', () => {
            const name = document.getElementById('group-name').value.trim();
            if (!name) return;
            const groupId = 'group_' + Date.now();
            const group = { id: groupId, name, members: [currentUser.id], createdBy: currentUser.id, createdAt: new Date().toISOString() };
            let groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
            groups.push(group);
            localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
            div.remove();
            openChat(groupId);
        });
    }

    window.openChat = function(chatId) {
        currentChatId = chatId;
        setPage('messages');
        setTimeout(() => renderChat(chatId), 50);
    };

    function renderChat(chatId) {
        let title = '', isGroup = false;
        const groups = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
        if (chatId.startsWith('group_')) {
            isGroup = true;
            const group = groups.find(g => g.id === chatId);
            title = group ? group.name : 'Группа';
        } else if (chatId.startsWith('commChat_')) {
            const cc = communityChats.find(c => c.id === chatId);
            if (cc) {
                const comm = findCommunityById(cc.communityId);
                title = comm ? comm.name + ' — чат' : 'Чат сообщества';
            }
        } else {
            const parts = chatId.replace('chat_', '').split('_');
            const otherId = parts.find(pid => pid !== currentUser.id);
            const other = findUserById(otherId);
            title = other ? other.name : 'Пользователь';
        }

        const chatMessages = messages.filter(m => m.chatId === chatId).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

        let html = `
            <div style="margin-bottom:0.5rem;">
                <button class="secondary" onclick="setPage('messages')" style="padding:0.4rem 0.8rem;"><i class="fas fa-arrow-left"></i> Назад</button>
            </div>
            <div class="chat-container">
                <div class="chat-header">
                    <h3>${title}</h3>
                    <div style="margin-left:auto; display:flex; gap:0.5rem;">
                        ${isGroup ? '<button id="add-members-btn" class="secondary" title="Добавить участников"><i class="fas fa-user-plus"></i></button>' : ''}
                        <button id="audio-call-btn" class="secondary" title="Аудиозвонок"><i class="fas fa-phone"></i></button>
                        <button id="video-call-btn" class="secondary" title="Видеозвонок"><i class="fas fa-video"></i></button>
                    </div>
                </div>
                <div class="chat-messages" id="chat-messages">`;
        
        chatMessages.forEach(msg => {
            const isOwn = msg.senderId === currentUser.id;
            const sender = findUserById(msg.senderId);
            if (!sender) return;
            html += `<div class="message ${isOwn ? 'own' : ''}" data-msg-id="${msg.id}">
                ${!isOwn ? `<div class="message-author">${sender.name} ${sender.verified ? '<i class="fas fa-check-circle verified-badge" style="font-size:0.75rem;"></i>' : ''}</div>` : ''}
                <div>${msg.text}</div>
                <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                ${isOwn ? `<span class="delete-msg" onclick="deleteMessage('${msg.id}')"><i class="fas fa-times"></i></span>` : ''}
            </div>`;
        });
        
        html += `</div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Написать сообщение...">
                    <button id="send-chat-btn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>`;
        centerPanel.innerHTML = html;

        // Прокрутка вниз
        const chatMsgsEl = document.getElementById('chat-messages');
        if (chatMsgsEl) chatMsgsEl.scrollTop = chatMsgsEl.scrollHeight;

        const input = document.getElementById('chat-input');

        // Отправка по Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('send-chat-btn')?.click();
        });

        document.getElementById('send-chat-btn').addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) return;
            messages.push({ id: 'msg_' + Date.now(), chatId, senderId: currentUser.id, text, timestamp: new Date().toISOString() });
            saveMessages();
            input.value = '';
            renderChat(chatId);
        });

        document.getElementById('audio-call-btn')?.addEventListener('click', () => startCall(chatId, 'audio'));
        document.getElementById('video-call-btn')?.addEventListener('click', () => startCall(chatId, 'video'));
        
        if (isGroup) {
            document.getElementById('add-members-btn')?.addEventListener('click', () => {
                const group = groups.find(g => g.id === chatId);
                if (!group) return;
                const friends = (currentUser.friends || []).map(fId => findUserById(fId)).filter(f => f && !group.members.includes(f.id));
                if (friends.length === 0) { alert('Нет друзей для добавления'); return; }
                const options = friends.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
                const div = document.createElement('div');
                div.innerHTML = `
                    <div class="modal active" id="add-members-modal">
                        <div class="modal-content">
                            <h2>Добавить участников</h2>
                            <select multiple id="new-members" size="5" style="width:100%;padding:0.5rem;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:8px;color:var(--text-primary);">${options}</select>
                            <button id="add-members-submit" style="margin-top:1rem;">Добавить</button>
                            <button class="secondary" id="cancel-add" style="margin-top:0.5rem;">Отмена</button>
                        </div>
                    </div>`;
                document.body.appendChild(div);
                document.getElementById('cancel-add').addEventListener('click', () => div.remove());
                document.getElementById('add-members-submit').addEventListener('click', () => {
                    const selected = Array.from(document.getElementById('new-members').selectedOptions).map(o => o.value);
                    if (selected.length) {
                        group.members.push(...selected);
                        let allGroups = JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS)) || [];
                        allGroups = allGroups.map(g => g.id === group.id ? group : g);
                        localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(allGroups));
                    }
                    div.remove();
                    renderChat(chatId);
                });
            });
        }
    }

    window.deleteMessage = function(msgId) {
        messages = messages.filter(m => m.id !== msgId);
        saveMessages();
        if (currentChatId) renderChat(currentChatId);
    };

    function startCall(chatId, type) {
        let otherId = null;
        if (chatId.startsWith('chat_')) {
            const parts = chatId.replace('chat_', '').split('_');
            otherId = parts.find(pid => pid !== currentUser.id);
        }
        const other = otherId ? findUserById(otherId) : null;
        document.getElementById('call-title').innerText = type === 'audio' ? '📞 Аудиозвонок' : '📹 Видеозвонок';
        document.getElementById('call-info').innerText = other ? `Звонок с ${other.name}...` : 'Звонок...';
        callModal.classList.add('active');
        document.getElementById('accept-call').onclick = () => { alert('Вы приняли звонок.'); callModal.classList.remove('active'); };
        document.getElementById('reject-call').onclick = () => callModal.classList.remove('active');
    }

    // ================== УВЕДОМЛЕНИЯ ==================
    function renderNotifications() {
        const userNotifs = notifications.filter(n => n.userId === currentUser.id).reverse();
        // Отметим все как прочитанные
        userNotifs.forEach(n => n.read = true);
        saveNotifications();
        
        let html = '<h2>Уведомления</h2>';
        if (userNotifs.length === 0) html += '<p style="color:var(--text-secondary);">Нет уведомлений.</p>';
        userNotifs.forEach(n => html += `<div class="notification">${n.text} <span style="color:var(--text-secondary); font-size:0.8rem;">${new Date(n.timestamp).toLocaleString()}</span></div>`);
        centerPanel.innerHTML = html;
        renderHeader(); // Обновим значок уведомлений
    }

    // ================== НАСТРОЙКИ ==================
    function renderSettings() {
        centerPanel.innerHTML = `
            <h2>Настройки</h2>
            <div class="form-group"><label>Имя</label><input type="text" id="settings-name" value="${currentUser.name}"></div>
            <div class="form-group"><label>@username</label><input type="text" id="settings-username" value="${currentUser.username}"></div>
            <div class="form-group"><label>Описание</label><textarea id="settings-bio">${currentUser.bio || ''}</textarea></div>
            <div class="form-group"><label>Аватар</label><input type="file" id="settings-avatar" accept="image/*"></div>
            <div class="form-group"><label>Баннер</label><input type="file" id="settings-banner" accept="image/*"></div>
            <div class="form-group"><label>Новый пароль</label><input type="password" id="settings-password" placeholder="Оставьте пустым, чтобы не менять"></div>
            <div class="form-group"><label>Тема</label>
                <select id="settings-theme">
                    <option value="dark" ${currentUser.theme === 'dark' ? 'selected' : ''}>Тёмная</option>
                    <option value="light" ${currentUser.theme === 'light' ? 'selected' : ''}>Светлая</option>
                </select>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
                <button id="save-settings">Сохранить</button>
                <button id="request-verify" class="secondary">Заявка на верификацию</button>
                <button id="logout-btn" class="secondary" style="border-color:var(--accent-red);color:var(--accent-red);">Выйти</button>
            </div>
        `;
        document.getElementById('save-settings').addEventListener('click', () => {
            const name = document.getElementById('settings-name').value.trim();
            const username = document.getElementById('settings-username').value.trim();
            if (!name || !username) { alert('Имя и username обязательны'); return; }
            if (!username.startsWith('@')) { alert('Username должен начинаться с @'); return; }
            if (users.some(u => u.username === username && u.id !== currentUser.id)) { alert('Username занят'); return; }
            currentUser.name = name;
            currentUser.username = username;
            currentUser.bio = document.getElementById('settings-bio').value.trim();
            const themeVal = document.getElementById('settings-theme').value;
            currentUser.theme = themeVal;
            if (themeVal === 'light') document.documentElement.classList.add('light-theme');
            else document.documentElement.classList.remove('light-theme');
            const password = document.getElementById('settings-password').value;
            if (password) currentUser.password = password;
            const avatarFile = document.getElementById('settings-avatar').files[0];
            const bannerFile = document.getElementById('settings-banner').files[0];
            Promise.all([
                avatarFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { currentUser.avatar = e.target.result; r(); }; fr.readAsDataURL(avatarFile); }) : Promise.resolve(),
                bannerFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { currentUser.banner = e.target.result; r(); }; fr.readAsDataURL(bannerFile); }) : Promise.resolve()
            ]).then(() => { saveUsers(); saveCurrentUser(); render(); alert('Сохранено!'); });
        });
        document.getElementById('request-verify').addEventListener('click', () => {
            if (verificationRequests.some(r => r.userId === currentUser.id && r.status === 'pending')) { alert('Заявка уже отправлена'); return; }
            if (currentUser.verified) { alert('Вы уже верифицированы'); return; }
            verificationRequests.push({ id: 'vreq_' + Date.now(), userId: currentUser.id, status: 'pending', timestamp: new Date().toISOString() });
            saveVerifyRequests();
            alert('Заявка отправлена администратору.');
        });
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите выйти?')) {
                currentUser = null; saveCurrentUser(); render();
            }
        });
    }

    // ================== УЛУЧШЕННАЯ АДМИН ПАНЕЛЬ ==================
    function renderAdminPanel() {
        if (!currentUser || currentUser.email !== OWNER_EMAIL) {
            centerPanel.innerHTML = '<p style="color:var(--accent-red);">🚫 Доступ запрещён</p>';
            return;
        }

        const tabs = [
            { id: 'overview', label: '📊 Обзор' },
            { id: 'verify', label: '✅ Верификация' },
            { id: 'users', label: '👥 Пользователи' },
            { id: 'posts', label: '📝 Посты' },
            { id: 'communities', label: '🏘 Сообщества' }
        ];

        let html = `
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
                <h2 style="margin:0;"><i class="fas fa-shield-alt" style="color:var(--accent-blue);"></i> Админ панель</h2>
            </div>
            <div class="admin-tabs" style="display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap;border-bottom:2px solid var(--border-color);padding-bottom:0.5rem;">
                ${tabs.map(t => `<button class="${adminTab === t.id ? '' : 'secondary'} admin-tab-btn" data-tab="${t.id}" style="border-radius:8px;padding:0.5rem 1rem;">${t.label}</button>`).join('')}
            </div>
            <div id="admin-content">
        `;

        if (adminTab === 'overview') {
            const totalUsers = users.length;
            const totalPosts = posts.length + communityPosts.length;
            const totalCommunities = communities.length;
            const totalMessages = messages.length;
            const pendingVerify = verificationRequests.filter(r => r.status === 'pending').length;
            const bannedCount = bannedUsers.length;
            const verifiedUsers = users.filter(u => u.verified).length;

            html += `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem;">
                    ${[
                        { icon:'fa-users', label:'Пользователей', value:totalUsers, color:'var(--accent-blue)' },
                        { icon:'fa-file-alt', label:'Постов', value:totalPosts, color:'var(--accent-green)' },
                        { icon:'fa-users-cog', label:'Сообществ', value:totalCommunities, color:'#9b59b6' },
                        { icon:'fa-envelope', label:'Сообщений', value:totalMessages, color:'#e67e22' },
                        { icon:'fa-clock', label:'Заявок верификации', value:pendingVerify, color:'var(--accent-red)' },
                        { icon:'fa-ban', label:'Забанено', value:bannedCount, color:'var(--accent-red)' },
                        { icon:'fa-check-circle', label:'Верифицировано', value:verifiedUsers, color:'var(--accent-green)' }
                    ].map(s => `
                        <div style="background:var(--card-bg);border:1px solid var(--border-color);border-radius:16px;padding:1.25rem;text-align:center;">
                            <i class="fas ${s.icon}" style="font-size:2rem;color:${s.color};margin-bottom:0.5rem;display:block;"></i>
                            <div style="font-size:1.8rem;font-weight:800;color:${s.color};">${s.value}</div>
                            <div style="color:var(--text-secondary);font-size:0.85rem;">${s.label}</div>
                        </div>`
                    ).join('')}
                </div>
                <h3>Последние зарегистрированные</h3>
                ${users.slice(-5).reverse().map(u => `
                    <div class="friend-item">
                        <img src="${u.avatar || 'https://via.placeholder.com/40'}" class="avatar" style="width:40px;height:40px;">
                        <div style="flex:1;"><div>${u.name} ${u.verified ? '✅' : ''} ${isUserBanned(u.id) ? '🚫' : ''}</div><div style="color:var(--text-secondary);font-size:0.8rem;">${u.username} · ${new Date(u.createdAt).toLocaleDateString()}</div></div>
                    </div>`
                ).join('')}
            `;
        }

        else if (adminTab === 'verify') {
            const userRequests = verificationRequests.filter(r => r.status === 'pending');
            const communityReqs = communityVerifyRequests.filter(r => r.status === 'pending');

            html += '<h3>Заявки пользователей</h3>';
            if (userRequests.length === 0) html += '<p style="color:var(--text-secondary);">Нет заявок.</p>';
            userRequests.forEach(r => {
                const u = findUserById(r.userId);
                if (!u) return;
                html += `<div class="post" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <img src="${u.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                    <div style="flex:1;">
                        <div style="font-weight:600;">${u.name}</div>
                        <div style="color:var(--text-secondary);">${u.username} · ${u.email}</div>
                        <div style="color:var(--text-secondary);font-size:0.8rem;">Заявка от ${new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                    <button onclick="approveUserVerify('${r.id}')" style="background:var(--accent-green);">✅ Одобрить</button>
                    <button class="secondary" onclick="rejectUserVerify('${r.id}')">❌ Отклонить</button>
                </div>`;
            });

            html += '<h3 style="margin-top:1.5rem;">Заявки сообществ</h3>';
            if (communityReqs.length === 0) html += '<p style="color:var(--text-secondary);">Нет заявок.</p>';
            communityReqs.forEach(r => {
                const c = findCommunityById(r.communityId);
                if (!c) return;
                html += `<div class="post" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <img src="${c.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                    <div style="flex:1;"><div style="font-weight:600;">${c.name}</div><div style="color:var(--text-secondary);">${c.description || ''}</div></div>
                    <button onclick="approveCommunityVerify('${r.id}')" style="background:var(--accent-green);">✅ Одобрить</button>
                    <button class="secondary" onclick="rejectCommunityVerify('${r.id}')">❌ Отклонить</button>
                </div>`;
            });
        }

        else if (adminTab === 'users') {
            html += `
                <div style="margin-bottom:1rem;">
                    <input type="text" id="admin-user-search" placeholder="🔍 Поиск пользователя..." style="width:100%;padding:0.75rem;background:var(--bg-tertiary);border:1px solid var(--border-color);border-radius:12px;color:var(--text-primary);">
                </div>
                <div id="admin-users-list">
            `;
            users.forEach(u => {
                if (u.email === OWNER_EMAIL) return; // Нельзя управлять собой
                const banned = isUserBanned(u.id);
                html += `<div class="post admin-user-row" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;" data-name="${u.name.toLowerCase()}" data-username="${u.username.toLowerCase()}">
                    <img src="${u.avatar || 'https://via.placeholder.com/40'}" class="avatar" style="width:40px;height:40px;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:0.4rem;font-weight:600;">
                            ${u.name} ${u.verified ? '<span style="color:var(--accent-blue);">✅</span>' : ''} ${banned ? '<span style="color:var(--accent-red);">🚫</span>' : ''}
                        </div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">${u.username} · ${u.email}</div>
                        <div style="color:var(--text-secondary);font-size:0.8rem;">Постов: ${posts.filter(p => p.authorId === u.id).length} · Друзей: ${u.friends?.length || 0}</div>
                    </div>
                    <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                        <button onclick="toggleUserVerify('${u.id}')" style="padding:0.4rem 0.8rem;background:${u.verified ? 'var(--accent-red)' : 'var(--accent-green)'};">
                            ${u.verified ? '❌ Снять верификацию' : '✅ Верифицировать'}
                        </button>
                        <button onclick="toggleBanUser('${u.id}')" style="padding:0.4rem 0.8rem;background:${banned ? 'var(--accent-green)' : 'var(--accent-red)'};">
                            ${banned ? '✅ Разбанить' : '🚫 Бан'}
                        </button>
                        <button onclick="deleteUserAdmin('${u.id}')" class="secondary" style="padding:0.4rem 0.8rem;color:var(--accent-red);border-color:var(--accent-red);">
                            🗑 Удалить
                        </button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        else if (adminTab === 'posts') {
            const allPosts = [
                ...posts.map(p => ({ ...p, type: 'user' })),
                ...communityPosts.map(p => ({ ...p, type: 'community' }))
            ].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));

            html += `<p style="color:var(--text-secondary);margin-bottom:1rem;">Всего постов: ${allPosts.length}</p>`;
            allPosts.forEach(post => {
                const author = post.type === 'user' ? findUserById(post.authorId) : findCommunityById(post.communityId);
                if (!author) return;
                html += `<div class="post" style="display:flex;gap:0.75rem;align-items:flex-start;flex-wrap:wrap;">
                    <div style="flex:1;">
                        <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.4rem;">${author.name} · ${new Date(post.timestamp).toLocaleString()} · ❤️ ${post.likes?.length || 0} 💬 ${post.comments?.length || 0}</div>
                        <div>${post.text.substring(0, 200)}${post.text.length > 200 ? '...' : ''}</div>
                    </div>
                    <button onclick="deletePostAdmin('${post.id}','${post.type}')" style="background:var(--accent-red);padding:0.4rem 0.8rem;white-space:nowrap;">🗑 Удалить</button>
                </div>`;
            });
        }

        else if (adminTab === 'communities') {
            html += `<p style="color:var(--text-secondary);margin-bottom:1rem;">Всего сообществ: ${communities.length}</p>`;
            communities.forEach(c => {
                const memberCount = communityMembers.filter(m => m.communityId === c.id).length;
                const postCount = communityPosts.filter(p => p.communityId === c.id).length;
                html += `<div class="post" style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                    <img src="${c.avatar || 'https://via.placeholder.com/48'}" class="avatar" style="width:48px;height:48px;">
                    <div style="flex:1;">
                        <div style="font-weight:600;">${c.name} ${c.verified ? '✅' : ''}</div>
                        <div style="color:var(--text-secondary);font-size:0.85rem;">👥 ${memberCount} участников · 📝 ${postCount} постов</div>
                    </div>
                    <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                        <button onclick="toggleCommunityVerify('${c.id}')" style="padding:0.4rem 0.8rem;background:${c.verified ? 'var(--accent-red)' : 'var(--accent-green)'};">
                            ${c.verified ? '❌ Снять' : '✅ Верифицировать'}
                        </button>
                        <button onclick="deleteCommunityAdmin('${c.id}')" class="secondary" style="padding:0.4rem 0.8rem;color:var(--accent-red);border-color:var(--accent-red);">
                            🗑 Удалить
                        </button>
                    </div>
                </div>`;
            });
        }

        html += '</div>';
        centerPanel.innerHTML = html;

        // Вкладки
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                adminTab = btn.dataset.tab;
                renderAdminPanel();
            });
        });

        // Поиск в списке пользователей
        document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll('.admin-user-row').forEach(row => {
                const name = row.dataset.name || '';
                const username = row.dataset.username || '';
                row.style.display = (name.includes(q) || username.includes(q)) ? '' : 'none';
            });
        });
    }

    // Верификация
    window.approveUserVerify = function(requestId) {
        const req = verificationRequests.find(r => r.id === requestId);
        if (req) {
            req.status = 'approved';
            const u = findUserById(req.userId);
            if (u) {
                u.verified = true;
                addNotification(u.id, '🎉 Ваш аккаунт верифицирован администратором!');
            }
            saveUsers(); saveVerifyRequests(); renderAdminPanel();
        }
    };
    window.rejectUserVerify = function(requestId) {
        const req = verificationRequests.find(r => r.id === requestId);
        if (req) {
            const u = findUserById(req.userId);
            if (u) addNotification(u.id, 'Ваша заявка на верификацию отклонена.');
        }
        verificationRequests = verificationRequests.filter(r => r.id !== requestId);
        saveVerifyRequests(); renderAdminPanel();
    };
    window.approveCommunityVerify = function(requestId) {
        const req = communityVerifyRequests.find(r => r.id === requestId);
        if (req) {
            req.status = 'approved';
            const c = findCommunityById(req.communityId);
            if (c) c.verified = true;
            saveCommunities(); saveCommunityVerifyRequests(); renderAdminPanel();
        }
    };
    window.rejectCommunityVerify = function(requestId) {
        communityVerifyRequests = communityVerifyRequests.filter(r => r.id !== requestId);
        saveCommunityVerifyRequests(); renderAdminPanel();
    };
    window.toggleUserVerify = function(userId) {
        const u = findUserById(userId);
        if (!u) return;
        u.verified = !u.verified;
        if (u.verified) addNotification(userId, '🎉 Ваш аккаунт верифицирован администратором!');
        saveUsers(); renderAdminPanel();
    };
    window.toggleCommunityVerify = function(communityId) {
        const c = findCommunityById(communityId);
        if (c) { c.verified = !c.verified; saveCommunities(); renderAdminPanel(); }
    };

    // БАН / РАЗБАН
    window.toggleBanUser = function(userId) {
        if (isUserBanned(userId)) {
            bannedUsers = bannedUsers.filter(b => b.userId !== userId);
            addNotification(userId, 'Вы разбанены администратором.');
        } else {
            bannedUsers.push({ userId, bannedAt: new Date().toISOString() });
            // Выгоняем пользователя если он залогинен
            addNotification(userId, '🚫 Ваш аккаунт заблокирован администратором.');
        }
        saveBannedUsers(); renderAdminPanel();
    };

    // УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЯ
    window.deleteUserAdmin = function(userId) {
        if (!confirm('Удалить пользователя? Это действие необратимо.')) return;
        users = users.filter(u => u.id !== userId);
        posts = posts.filter(p => p.authorId !== userId);
        messages = messages.filter(m => m.senderId !== userId);
        friendships = friendships.filter(f => f.from !== userId && f.to !== userId);
        bannedUsers = bannedUsers.filter(b => b.userId !== userId);
        verificationRequests = verificationRequests.filter(r => r.userId !== userId);
        // Убираем из списков друзей
        users.forEach(u => { if (u.friends) u.friends = u.friends.filter(id => id !== userId); });
        saveUsers(); savePosts(); saveMessages(); saveFriendships(); saveBannedUsers(); saveVerifyRequests();
        renderAdminPanel();
    };

    // УДАЛЕНИЕ ПОСТА (из админки)
    window.deletePostAdmin = function(postId, type) {
        if (!confirm('Удалить пост?')) return;
        if (type === 'user') {
            posts = posts.filter(p => p.id !== postId);
            savePosts();
        } else {
            communityPosts = communityPosts.filter(p => p.id !== postId);
            saveCommunityPosts();
        }
        renderAdminPanel();
    };

    // УДАЛЕНИЕ СООБЩЕСТВА
    window.deleteCommunityAdmin = function(communityId) {
        if (!confirm('Удалить сообщество?')) return;
        communities = communities.filter(c => c.id !== communityId);
        communityMembers = communityMembers.filter(m => m.communityId !== communityId);
        communityPosts = communityPosts.filter(p => p.communityId !== communityId);
        communityChats = communityChats.filter(c => c.communityId !== communityId);
        saveCommunities(); saveCommunityMembers(); saveCommunityPosts(); saveCommunityChats();
        renderAdminPanel();
    };

    // ================== КОММЕНТАРИИ ==================
    function openCommentsModal(post, type) {
        const listDiv = document.getElementById('comments-list');
        listDiv.innerHTML = post.comments.length ? post.comments.map(c => {
            const user = findUserById(c.userId);
            return user ? `<div class="comment">
                <img src="${user.avatar || 'https://via.placeholder.com/32'}" class="comment-avatar">
                <div class="comment-content">
                    <span class="comment-author">${user.name} ${user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}</span>
                    <p style="margin:0.2rem 0 0;">${c.text}</p>
                    <span style="color:var(--text-secondary);font-size:0.75rem;">${new Date(c.timestamp).toLocaleString()}</span>
                </div>
            </div>` : '';
        }).join('') : '<p style="color:var(--text-secondary);">Нет комментариев.</p>';
        
        commentsModal.classList.add('active');
        const newCommentInput = document.getElementById('new-comment');
        newCommentInput.focus();

        document.getElementById('add-comment').onclick = () => {
            const text = newCommentInput.value.trim();
            if (!text) return;
            post.comments.push({ userId: currentUser.id, text, timestamp: new Date().toISOString() });
            if (type === 'user' && post.authorId !== currentUser.id) {
                addNotification(post.authorId, `💬 ${currentUser.name} прокомментировал ваш пост: "${text.substring(0,50)}"`);
            }
            if (type === 'user') savePosts(); else saveCommunityPosts();
            openCommentsModal(post, type);
            newCommentInput.value = '';
        };
        
        // Отправка по Enter
        newCommentInput.onkeydown = (e) => {
            if (e.key === 'Enter') document.getElementById('add-comment').click();
        };
    }

    // ================== АВТОРИЗАЦИЯ ==================
    function showAuthModal(type) {
        authModal.classList.add('active');
        if (type === 'login') {
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('setup-profile').style.display = 'none';
            document.getElementById('auth-title').innerText = 'Вход';
        } else {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            document.getElementById('setup-profile').style.display = 'none';
            document.getElementById('auth-title').innerText = 'Регистрация';
        }
    }

    document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); showAuthModal('register'); });
    document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); showAuthModal('login'); });

    let tempEmail = '', tempCode = '';
    document.getElementById('send-code-btn')?.addEventListener('click', () => {
        const email = document.getElementById('reg-email').value.trim();
        if (!email || !email.includes('@')) { alert('Введите корректный email'); return; }
        if (findUserByEmail(email)) { alert('Пользователь с таким email уже существует'); return; }
        tempEmail = email;
        tempCode = Math.floor(100000 + Math.random() * 900000).toString();
        alert(`Ваш код подтверждения: ${tempCode}\n(В реальном приложении это отправится на почту)`);
        document.getElementById('code-verification').style.display = 'block';
    });

    document.getElementById('verify-code-btn')?.addEventListener('click', () => {
        if (document.getElementById('reg-code').value.trim() === tempCode) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('setup-profile').style.display = 'block';
            document.getElementById('auth-title').innerText = 'Настройка профиля';
        } else alert('Неверный код');
    });

    document.getElementById('complete-registration')?.addEventListener('click', () => {
        const name = document.getElementById('setup-name').value.trim();
        let username = document.getElementById('setup-username').value.trim();
        if (!name || !username) { alert('Имя и username обязательны'); return; }
        if (!username.startsWith('@')) username = '@' + username;
        if (findUserByUsername(username)) { alert('Username занят'); return; }
        const newUser = {
            id: 'user_' + Date.now(),
            email: tempEmail,
            password: 'temp123',
            name, username,
            bio: document.getElementById('setup-bio').value.trim() || '',
            avatar: '', banner: '', verified: false, theme: 'dark', friends: [], createdAt: new Date().toISOString()
        };
        const avatarFile = document.getElementById('setup-avatar').files[0];
        const bannerFile = document.getElementById('setup-banner').files[0];
        Promise.all([
            avatarFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { newUser.avatar = e.target.result; r(); }; fr.readAsDataURL(avatarFile); }) : Promise.resolve(),
            bannerFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { newUser.banner = e.target.result; r(); }; fr.readAsDataURL(bannerFile); }) : Promise.resolve()
        ]).then(() => {
            users.push(newUser);
            saveUsers();
            currentUser = newUser;
            saveCurrentUser();
            authModal.classList.remove('active');
            render();
        });
    });

    document.getElementById('login-btn')?.addEventListener('click', () => {
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value.trim();
        let user = findUserByEmail(identifier) || findUserByUsername(identifier.startsWith('@') ? identifier : '@' + identifier);
        
        if (!user) { alert('Пользователь не найден'); return; }
        if (user.password !== password) { alert('Неверный пароль'); return; }
        if (isUserBanned(user.id)) { alert('🚫 Ваш аккаунт заблокирован.'); return; }
        
        currentUser = user;
        saveCurrentUser();
        authModal.classList.remove('active');
        render();
    });

    // Вход по Enter
    document.getElementById('login-password')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('login-btn')?.click();
    });

    // ================== НАВИГАЦИЯ ==================
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            if (!page) return;
            if (page === 'admin' && currentUser?.email !== OWNER_EMAIL) return;
            setPage(page);
        });
    });

    window.setPage = function(page) {
        currentPage = page;
        render();
        if (window.innerWidth <= 768) {
            leftPanel.classList.remove('open');
            rightPanel.classList.remove('open');
        }
    };

    function setPage(page) { window.setPage(page); }

    function toggleTheme() {
        document.documentElement.classList.toggle('light-theme');
        if (currentUser) {
            currentUser.theme = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
            saveUsers();
        }
    }

    // ================== ЗАКРЫТИЕ МОДАЛОК ==================
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    });

    // ================== СОЗДАНИЕ ПОСТА ==================
    document.getElementById('publish-post')?.addEventListener('click', () => {
        const text = document.getElementById('post-text').value.trim();
        const file = document.getElementById('post-image').files[0] || document.getElementById('post-video').files[0] || document.getElementById('post-audio').files[0];
        if (!text && !file) { alert('Добавьте текст или медиа'); return; }
        const post = { id: 'post_' + Date.now(), authorId: currentUser.id, text: text || '', media: null, likes: [], comments: [], reposts: 0, timestamp: new Date().toISOString() };
        if (file) {
            const reader = new FileReader();
            reader.onload = e => {
                post.media = { url: e.target.result, type: file.type };
                posts.push(post); savePosts();
                postModal.classList.remove('active');
                document.getElementById('post-text').value = '';
                document.getElementById('post-image').value = '';
                document.getElementById('post-video').value = '';
                document.getElementById('post-audio').value = '';
                if (currentPage === 'feed') renderFeed();
            };
            reader.readAsDataURL(file);
        } else {
            posts.push(post); savePosts();
            postModal.classList.remove('active');
            document.getElementById('post-text').value = '';
            if (currentPage === 'feed') renderFeed();
        }
    });

    // Публикация по Ctrl+Enter
    document.getElementById('post-text')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) document.getElementById('publish-post')?.click();
    });

    // ================== ВЕРИФИКАЦИЯ ==================
    document.getElementById('send-verify-request')?.addEventListener('click', () => {
        if (!currentUser) return;
        if (currentUser.verified) { alert('Вы уже верифицированы'); verifyModal.classList.remove('active'); return; }
        if (verificationRequests.some(r => r.userId === currentUser.id && r.status === 'pending')) { alert('Заявка уже отправлена'); verifyModal.classList.remove('active'); return; }
        verificationRequests.push({ id: 'vreq_' + Date.now(), userId: currentUser.id, status: 'pending', timestamp: new Date().toISOString() });
        saveVerifyRequests();
        alert('Заявка отправлена администратору');
        verifyModal.classList.remove('active');
    });

    // ================== СОЗДАНИЕ СООБЩЕСТВА ==================
    document.getElementById('create-community')?.addEventListener('click', () => {
        const name = document.getElementById('community-name').value.trim();
        const desc = document.getElementById('community-description').value.trim();
        if (!name) { alert('Введите название'); return; }
        const community = { id: 'comm_' + Date.now(), name, description: desc, avatar: '', banner: '', verified: false, createdBy: currentUser.id, createdAt: new Date().toISOString() };
        const avatarFile = document.getElementById('community-avatar').files[0];
        const bannerFile = document.getElementById('community-banner').files[0];
        Promise.all([
            avatarFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { community.avatar = e.target.result; r(); }; fr.readAsDataURL(avatarFile); }) : Promise.resolve(),
            bannerFile ? new Promise(r => { let fr = new FileReader(); fr.onload = e => { community.banner = e.target.result; r(); }; fr.readAsDataURL(bannerFile); }) : Promise.resolve()
        ]).then(() => {
            communities.push(community);
            communityMembers.push({ communityId: community.id, userId: currentUser.id, joinedAt: new Date().toISOString() });
            communityChats.push({ id: 'commChat_' + Date.now(), communityId: community.id, name: 'Чат ' + community.name, members: [currentUser.id] });
            saveCommunities(); saveCommunityMembers(); saveCommunityChats();
            createCommunityModal.classList.remove('active');
            renderCommunities();
        });
    });

    // ================== ЗАПУСК ==================
    loadData();

    // Применяем сохранённую тему
    if (currentUser?.theme === 'light') document.documentElement.classList.add('light-theme');
    else if (currentUser?.theme === 'dark') document.documentElement.classList.remove('light-theme');

    render();

    // Синхронизация вкладок
    window.addEventListener('storage', (e) => {
        if (Object.values(STORAGE_KEYS).includes(e.key)) {
            loadData();
            if (currentChatId && currentPage === 'messages') renderChat(currentChatId);
            else render();
        }
    });
})();