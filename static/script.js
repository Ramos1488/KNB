(function () {
'use strict';

// ===== STORAGE KEYS =====
const SK = {
    USERS:'knb_users',POSTS:'knb_posts',NOTIFICATIONS:'knb_notifications',
    FRIENDSHIPS:'knb_friendships',MESSAGES:'knb_messages',
    COMMUNITIES:'knb_communities',COMMUNITY_MEMBERS:'knb_community_members',
    COMMUNITY_POSTS:'knb_community_posts',VERIFY_REQUESTS:'knb_verify_requests',
    COMMUNITY_VERIFY_REQUESTS:'knb_community_verify_requests',
    CURRENT_USER:'knb_current_user',TYPING:'knb_typing',
    COMMUNITY_CHATS:'knb_community_chats',GROUPS:'knb_groups',
    STORIES:'knb_stories',ACHIEVEMENTS:'knb_achievements',
    REPORTS:'knb_reports',SUPPORT_TICKETS:'knb_support_tickets',
    BANS:'knb_bans',BADGES:'knb_badges',USER_BADGES:'knb_user_badges',
    MAINTENANCE:'knb_maintenance',CUSTOM_SCRIPTS:'knb_custom_scripts'
};

const OWNER_EMAIL = 'foxi@knb.com';
const CATEGORY_MAP = {general:'🌐 Общее',gaming:'🎮 Игры',news:'📰 Новости',music:'🎵 Музыка',art:'🎨 Искусство',tech:'💻 Технологии',sports:'⚽ Спорт',science:'🔬 Наука',food:'🍕 Еда',travel:'✈️ Путешествия',humor:'😂 Юмор',other:'📦 Другое'};

// ===== DATA =====
let currentUser=null,users=[],posts=[],notifications=[],friendships=[],messages=[];
let communities=[],communityMembers=[],communityPosts=[];
let verificationRequests=[],communityVerifyRequests=[];
let typingStatus={},communityChats=[],stories=[],achievements=[];
let reports=[],supportTickets=[],bans=[],badges=[],userBadges=[];

// ===== LOAD/SAVE =====
const gj=(k,def=[])=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):def;}catch{return def;}};
const sj=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

function loadData(){
    users=gj(SK.USERS);posts=gj(SK.POSTS);notifications=gj(SK.NOTIFICATIONS);
    friendships=gj(SK.FRIENDSHIPS);messages=gj(SK.MESSAGES);
    communities=gj(SK.COMMUNITIES);communityMembers=gj(SK.COMMUNITY_MEMBERS);
    communityPosts=gj(SK.COMMUNITY_POSTS);verificationRequests=gj(SK.VERIFY_REQUESTS);
    communityVerifyRequests=gj(SK.COMMUNITY_VERIFY_REQUESTS);
    typingStatus=gj(SK.TYPING,{});communityChats=gj(SK.COMMUNITY_CHATS);
    stories=gj(SK.STORIES);achievements=gj(SK.ACHIEVEMENTS);
    reports=gj(SK.REPORTS);supportTickets=gj(SK.SUPPORT_TICKETS);
    bans=gj(SK.BANS);badges=gj(SK.BADGES);userBadges=gj(SK.USER_BADGES);
    const sid=localStorage.getItem(SK.CURRENT_USER);
    if(sid)currentUser=users.find(u=>u.id===sid)||null;
    if(users.length===0){
        const owner={id:'user_init_1',email:OWNER_EMAIL,password:'admin005',name:'Foxi005305',username:'@foxi',bio:'Владелец KNB',avatar:'',banner:'',verified:true,theme:'dark',role:'owner',friends:[],createdAt:new Date().toISOString()};
        users.push(owner);
        posts.push({id:'post_init',authorId:owner.id,text:'👋 Добро пожаловать в KNB!',media:null,likes:[],comments:[],reposts:0,timestamp:new Date().toISOString()});
        sj(SK.USERS,users);sj(SK.POSTS,posts);
    }
}

const saveUsers=()=>sj(SK.USERS,users);
const savePosts=()=>sj(SK.POSTS,posts);
const saveNotifications=()=>sj(SK.NOTIFICATIONS,notifications);
const saveFriendships=()=>sj(SK.FRIENDSHIPS,friendships);
const saveMessages=()=>sj(SK.MESSAGES,messages);
const saveCommunities=()=>sj(SK.COMMUNITIES,communities);
const saveCommunityMembers=()=>sj(SK.COMMUNITY_MEMBERS,communityMembers);
const saveCommunityPosts=()=>sj(SK.COMMUNITY_POSTS,communityPosts);
const saveVerifyRequests=()=>sj(SK.VERIFY_REQUESTS,verificationRequests);
const saveCommunityVerifyRequests=()=>sj(SK.COMMUNITY_VERIFY_REQUESTS,communityVerifyRequests);
const saveTyping=()=>sj(SK.TYPING,typingStatus);
const saveCommunityChats=()=>sj(SK.COMMUNITY_CHATS,communityChats);
const saveStories=()=>sj(SK.STORIES,stories);
const saveAchievements=()=>sj(SK.ACHIEVEMENTS,achievements);
const saveReports=()=>sj(SK.REPORTS,reports);
const saveSupportTickets=()=>sj(SK.SUPPORT_TICKETS,supportTickets);
const saveBans=()=>sj(SK.BANS,bans);
const saveBadges=()=>sj(SK.BADGES,badges);
const saveUserBadges=()=>sj(SK.USER_BADGES,userBadges);
const saveCurrentUser=()=>currentUser?localStorage.setItem(SK.CURRENT_USER,currentUser.id):localStorage.removeItem(SK.CURRENT_USER);

const findUserById=id=>users.find(u=>u.id===id);
const findCommunityById=id=>communities.find(c=>c.id===id);

// ===== HELPERS =====
function timeAgo(ts){
    const d=(Date.now()-new Date(ts))/1000;
    if(d<60)return'только что';
    if(d<3600)return Math.floor(d/60)+' мин.';
    if(d<86400)return Math.floor(d/3600)+' ч.';
    if(d<2592000)return Math.floor(d/86400)+' дн.';
    return new Date(ts).toLocaleDateString('ru');
}
function escHtml(s){if(!s)return'';return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function av(u,sz=40){const initials=encodeURIComponent((u?.name||'?')[0]);return u?.avatar||`https://placehold.co/${sz}x${sz}/1d2230/8090a8?text=${initials}`;}
function isMod(u){return u&&(u.email===OWNER_EMAIL||u.role==='moderator');}
function isOwner(u){return u&&u.email===OWNER_EMAIL;}

// ===== BAN CHECK =====
function getUserBan(userId){
    const b=bans.find(b=>b.userId===userId&&!b.lifted);
    if(!b)return null;
    if(b.duration>0&&Date.now()>b.expiresAt){b.lifted=true;saveBans();return null;}
    return b;
}

// ===== CUSTOM SCRIPTS =====
function loadCustomScripts(){
    const scripts=gj(SK.CUSTOM_SCRIPTS,[]);
    scripts.forEach(s=>{
        if(!s.active)return;
        try{const fn=new Function(s.code);fn();}catch(e){console.warn('Custom script error:',s.name,e);}
    });
}

// ===== MAINTENANCE =====
function checkMaintenance(){
    const m=gj(SK.MAINTENANCE,{active:false});
    const ms=document.getElementById('maintenance-screen');
    const app=document.getElementById('app');
    if(ms&&app){
        if(m.active&&!isOwner(currentUser)){
            ms.style.display='flex';
            app.style.display='none';
            const el=document.getElementById('maintenance-msg');
            if(el)el.textContent=m.message||'Сайт временно недоступен. Скоро вернёмся!';
            return true;
        } else {
            ms.style.display='none';
            app.style.display='';
        }
    }
    return false;
}

// ===== THEME =====
function applyTheme(t){
    if(t==='light')document.documentElement.classList.add('light-theme');
    else if(t==='dark')document.documentElement.classList.remove('light-theme');
    else{if(window.matchMedia('(prefers-color-scheme:light)').matches)document.documentElement.classList.add('light-theme');else document.documentElement.classList.remove('light-theme');}
}

// ===== DOM =====
const $=id=>document.getElementById(id);
const centerPanel=$('center-panel');
const leftPanel=$('leftPanel');
const rightPanel=$('rightPanel');
const userActions=$('user-actions');
const authModal=$('auth-modal');
const postModal=$('post-modal');
const commentsModal=$('comments-modal');

let currentPage='feed',currentChatId=null,typingTimer=null;

// ===== MOBILE MENU =====
$('menuToggle')?.addEventListener('click',e=>{e.stopPropagation();leftPanel?.classList.toggle('open');rightPanel?.classList.remove('open');});
$('rightPanelToggle')?.addEventListener('click',e=>{e.stopPropagation();rightPanel?.classList.toggle('open');leftPanel?.classList.remove('open');});
document.addEventListener('click',e=>{
    if(window.innerWidth>768)return;
    if(!leftPanel?.contains(e.target)&&!$('menuToggle')?.contains(e.target))leftPanel?.classList.remove('open');
    if(!rightPanel?.contains(e.target)&&!$('rightPanelToggle')?.contains(e.target))rightPanel?.classList.remove('open');
});

// ===== RENDER =====
function render(){
    if(checkMaintenance())return;
    renderHeader();renderNav();renderRightPanel();renderCenter(currentPage);
    applyTheme(currentUser?.theme||'dark');
    updateNotifBadge();
}

function renderHeader(){
    if(currentUser){
        userActions.innerHTML=`
            <button class="header-icon" id="theme-toggle" title="Тема"><i class="fas fa-adjust"></i></button>
            <button class="header-icon" id="notif-icon" title="Уведомления"><i class="fas fa-bell"></i></button>
            <img src="${av(currentUser,36)}" alt="avatar" class="avatar" style="width:36px;height:36px;cursor:pointer;border:2px solid var(--brd);" id="hdr-avatar">`;
        $('theme-toggle')?.addEventListener('click',toggleTheme);
        $('notif-icon')?.addEventListener('click',()=>setPage('notifications'));
        $('hdr-avatar')?.addEventListener('click',()=>setPage('profile'));
    } else {
        userActions.innerHTML=`<button id="show-auth-btn" style="padding:8px 18px;"><i class="fas fa-sign-in-alt"></i> Войти</button>`;
        $('show-auth-btn')?.addEventListener('click',()=>showAuthModal('login'));
    }
}

function renderNav(){
    document.querySelectorAll('.nav-item').forEach(item=>item.classList.toggle('active',item.dataset.page===currentPage));
    const adminBtn=$('admin-panel-btn');
    if(adminBtn)adminBtn.style.display=isOwner(currentUser)?'flex':'none';
}

function updateNotifBadge(){
    const badge=$('notif-badge');
    if(!badge)return;
    if(!currentUser){badge.style.display='none';return;}
    const unread=notifications.filter(n=>n.userId===currentUser.id&&!n.read).length;
    if(unread>0){badge.style.display='flex';badge.textContent=unread>9?'9+':unread;}
    else badge.style.display='none';
}

function renderRightPanel(){
    const sugEl=$('suggested-users');
    const notifEl=$('recent-notifications');
    if(!currentUser){
        if(sugEl)sugEl.innerHTML='<p style="color:var(--t3);font-size:12px;padding:4px;">Войдите для рекомендаций</p>';
        if(notifEl)notifEl.innerHTML='<p style="color:var(--t3);font-size:12px;padding:4px;">Войдите для уведомлений</p>';
        return;
    }
    const suggested=users.filter(u=>u.id!==currentUser.id&&!currentUser.friends?.includes(u.id)&&!getUserBan(u.id)).slice(0,4);
    if(sugEl)sugEl.innerHTML=suggested.length?suggested.map(u=>`
        <div class="friend-item pointer" onclick="viewProfile('${u.id}')">
            <img src="${av(u,38)}" class="avatar" style="width:38px;height:38px;">
            <div style="min-width:0;flex:1;"><div style="font-size:13px;font-weight:600;">${escHtml(u.name.slice(0,16))} ${u.verified?'<i class="fas fa-check-circle verified-badge" style="font-size:11px;"></i>':''}</div><div style="color:var(--t3);font-size:11px;">${escHtml(u.username)}</div></div>
        </div>`).join(''):'<p style="color:var(--t3);font-size:12px;padding:4px;">Нет рекомендаций</p>';
    const recent=notifications.filter(n=>n.userId===currentUser.id).slice(-4).reverse();
    if(notifEl)notifEl.innerHTML=recent.length?recent.map(n=>`<div class="notification">${escHtml(n.text)}</div>`).join(''):'<p style="color:var(--t3);font-size:12px;padding:4px;">Нет уведомлений</p>';
    renderAchievements();
}

function renderCenter(page){
    if(!currentUser){
        centerPanel.innerHTML=`<div class="welcome-screen"><h1>KNB<span style="color:var(--blue)">.</span></h1><p>Войдите, чтобы видеть ленту, общаться с друзьями и многое другое.</p><button id="wl"><i class="fas fa-sign-in-alt"></i> Войти</button><button class="secondary" id="wr"><i class="fas fa-user-plus"></i> Зарегистрироваться</button></div>`;
        $('wl')?.addEventListener('click',()=>showAuthModal('login'));
        $('wr')?.addEventListener('click',()=>showAuthModal('register'));
        return;
    }
    const ban=getUserBan(currentUser.id);
    if(ban){
        centerPanel.innerHTML=`<div class="banned-screen"><div class="ban-icon"><i class="fas fa-ban"></i></div><h2>Вы заблокированы</h2><p style="color:var(--t2);max-width:380px;">Причина: <strong>${escHtml(ban.reason)}</strong>${ban.comment?`<br><em>${escHtml(ban.comment)}</em>`:''}<br>${ban.duration===0?'<span style="color:var(--red);">Навсегда</span>':`До: ${new Date(ban.expiresAt).toLocaleDateString('ru')}`}</p><button class="secondary" onclick="currentUser=null;saveCurrentUser();render();" style="margin-top:1rem;"><i class="fas fa-sign-out-alt"></i> Выйти</button></div>`;
        return;
    }
    switch(page){
        case'feed':renderFeed();break;
        case'stories':renderStoriesPage();break;
        case'profile':renderProfile(currentUser);break;
        case'communities':renderCommunities();break;
        case'friends':renderFriends();break;
        case'messages':renderMessagesList();break;
        case'notifications':renderNotifications();break;
        case'support':renderSupportPage();break;
        case'settings':renderSettings();break;
        case'admin':renderAdminPanel();break;
        default:renderFeed();
    }
}

// ===== USER BADGES RENDER =====
function renderUserBadges(userId){
    const ub=userBadges.filter(ub=>ub.userId===userId);
    if(!ub.length)return'';
    return ub.map(ub=>{
        const badge=badges.find(b=>b.id===ub.badgeId);
        if(!badge)return'';
        return`<span class="user-badge" style="color:${badge.color||'#fff'};border-color:${badge.color||'var(--brd)'};">${badge.image?`<img src="${badge.image}">`:''}${escHtml(badge.name)}</span>`;
    }).join('');
}

// ===== FEED =====
function renderFeed(){
    let all=[
        ...posts.map(p=>({...p,_type:'user',_author:findUserById(p.authorId)})),
        ...communityPosts.map(p=>({...p,_type:'community',_author:findCommunityById(p.communityId)}))
    ].filter(p=>p._author).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));

    let html=`<div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;">
        <button id="cpb" class="secondary"><i class="fas fa-plus"></i> Пост</button>
        <button id="cpoll" class="secondary"><i class="fas fa-chart-bar"></i> Опрос</button>
    </div>`;
    if(!all.length)html+='<p style="text-align:center;color:var(--t3);margin-top:3rem;">Нет постов. Создайте первый!</p>';
    all.forEach(post=>{
        const isLiked=post.likes?.includes(currentUser.id);
        html+=`<div class="post" data-post-id="${post.id}">
            <div class="post-header" onclick="${post._type==='user'?`viewProfile('${post.authorId}')`:`viewCommunity('${post.communityId||post._author?.id}')`}">
                <img src="${av(post._author,44)}" class="avatar" style="width:44px;height:44px;">
                <div>
                    <div class="post-author">${escHtml(post._author.name)} ${post._author.verified?'<i class="fas fa-check-circle verified-badge"></i>':''} ${post._type==='community'?'<i class="fas fa-users" style="color:var(--t3);font-size:11px;"></i>':''}${renderUserBadges(post._type==='user'?post.authorId:'')}
                        <span class="post-time">· ${timeAgo(post.timestamp)}</span>
                    </div>
                    <div style="color:var(--t3);font-size:12px;">${escHtml(post._author.username||'')}</div>
                </div>
                <div style="margin-left:auto;display:flex;gap:4px;">
                    ${post._type==='user'&&post.authorId===currentUser.id?`<button class="secondary" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();deletePost('${post.id}')"><i class="fas fa-trash"></i></button>`:''}
                    ${post._type==='user'&&post.authorId!==currentUser.id?`<button class="secondary" style="padding:4px 10px;font-size:12px;" onclick="event.stopPropagation();openReport('${post.id}','post')"><i class="fas fa-flag"></i></button>`:''}
                </div>
            </div>
            <div class="post-content">${escHtml(post.text)}</div>
            ${post.poll?renderPoll(post.poll,post.id):''}
            ${post.media?renderMedia(post.media):''}
            <div class="post-actions">
                <button class="action-btn like-btn ${isLiked?'liked':''}" data-pid="${post.id}" data-type="${post._type}"><i class="fas fa-heart"></i> ${post.likes?.length||0}</button>
                <button class="action-btn comment-btn" data-pid="${post.id}" data-type="${post._type}"><i class="fas fa-comment"></i> ${post.comments?.length||0}</button>
                <button class="action-btn repost-btn" data-pid="${post.id}" data-type="${post._type}"><i class="fas fa-retweet"></i> ${post.reposts||0}</button>
            </div>
            ${post.comments?.length?`<div class="comment-section">${post.comments.slice(-2).map(c=>{const ca=findUserById(c.userId);return ca?`<div class="comment"><img src="${av(ca,28)}" class="comment-avatar"><div><span class="comment-author">${escHtml(ca.name)}</span> ${escHtml(c.text)}</div></div>`:''}).join('')}</div>`:''}</div>`;
    });
    centerPanel.innerHTML=html;
    $('cpb')?.addEventListener('click',()=>{
        const pi=$('post-author-info');
        if(pi)pi.innerHTML=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><img src="${av(currentUser,36)}" class="avatar" style="width:36px;height:36px;"><strong>${escHtml(currentUser.name)}</strong></div>`;
        postModal?.classList.add('active');$('post-text')?.focus();
    });
    $('cpoll')?.addEventListener('click',()=>$('poll-modal')?.classList.add('active'));
    document.querySelectorAll('.like-btn').forEach(btn=>btn.addEventListener('click',e=>{
        e.stopPropagation();
        const {pid,type}=btn.dataset;
        const arr=type==='user'?posts:communityPosts;
        const p=arr.find(p=>p.id===pid);if(!p)return;
        if(p.likes.includes(currentUser.id))p.likes=p.likes.filter(id=>id!==currentUser.id);
        else{p.likes.push(currentUser.id);if(type==='user'&&p.authorId!==currentUser.id)addNotif(p.authorId,`❤️ ${currentUser.name} лайкнул ваш пост.`);}
        type==='user'?savePosts():saveCommunityPosts();renderFeed();
    }));
    document.querySelectorAll('.comment-btn').forEach(btn=>btn.addEventListener('click',()=>{
        const{pid,type}=btn.dataset;
        const p=(type==='user'?posts:communityPosts).find(p=>p.id===pid);
        if(p)openCommentsModal(p,type);
    }));
    document.querySelectorAll('.repost-btn').forEach(btn=>btn.addEventListener('click',()=>{
        const{pid,type}=btn.dataset;
        const orig=(type==='user'?posts:communityPosts).find(p=>p.id===pid);
        if(!orig)return;
        posts.push({id:'p_'+Date.now(),authorId:currentUser.id,text:`🔁 ${orig.text}`,media:orig.media,likes:[],comments:[],reposts:0,timestamp:new Date().toISOString()});
        orig.reposts=(orig.reposts||0)+1;
        type==='user'?savePosts():saveCommunityPosts();savePosts();renderFeed();
    }));
}

window.deletePost=function(id){if(!confirm('Удалить пост?'))return;posts=posts.filter(p=>p.id!==id);savePosts();renderFeed();};
function renderMedia(m){if(!m)return'';if(m.type?.startsWith('image/'))return`<img src="${m.url}" class="post-media">`;if(m.type?.startsWith('video/'))return`<video controls src="${m.url}" class="post-media"></video>`;if(m.type?.startsWith('audio/'))return`<audio controls src="${m.url}" style="width:100%;margin-bottom:8px;"></audio>`;return'';}
function addNotif(userId,text){notifications.push({id:'n_'+Date.now(),userId,text,read:false,timestamp:new Date().toISOString()});saveNotifications();}

// ===== STORIES PAGE =====
function renderStoriesPage(){
    stories=stories.filter(s=>Date.now()-new Date(s.timestamp).getTime()<86400000);
    saveStories();
    stories.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    let html=`<h2 style="font-family:var(--font-d);margin-bottom:1rem;">📸 Сторис</h2>
    <div class="stories-row" style="margin-bottom:1.5rem;">
        <div class="add-story-thumb" id="add-story-trigger"><div class="add-story-circle"><i class="fas fa-plus"></i></div><span style="font-size:11px;color:var(--t2);">Добавить</span></div>`;
    stories.forEach(s=>{
        const a=findUserById(s.userId);if(!a)return;
        const viewed=(s.views||[]).includes(currentUser?.id);
        html+=`<div class="story-thumb" onclick="viewStoryById('${s.id}')"><div class="story-thumb-ring ${viewed?'viewed':''}"><img src="${s.media||av(a,74)}" onerror="this.src='${av(a,74)}'"></div><div class="story-thumb-name">${escHtml(a.name)}</div></div>`;
    });
    html+=`</div>`;
    if(!stories.length)html+='<p style="color:var(--t3);text-align:center;padding:2rem;">Нет активных сторис (исчезают через 24 ч.)</p>';
    centerPanel.innerHTML=html;
    $('add-story-trigger')?.addEventListener('click',()=>{
        const inp=document.createElement('input');inp.type='file';inp.accept='image/*,video/*';
        inp.onchange=async e=>{
            const file=e.target.files[0];if(!file)return;
            const fr=new FileReader();
            fr.onload=ev=>{
                stories.push({id:'s_'+Date.now(),userId:currentUser.id,media:ev.target.result,mediaType:file.type,views:[],timestamp:new Date().toISOString()});
                saveStories();renderStoriesPage();
            };fr.readAsDataURL(file);
        };inp.click();
    });
}

// ===== STORY VIEWER =====
let currentStoryIdx=0,storyTimer=null;
window.viewStoryById=function(storyId){
    currentStoryIdx=stories.findIndex(s=>s.id===storyId);
    if(currentStoryIdx<0)return;
    showStory(currentStoryIdx);
};
function showStory(idx){
    const s=stories[idx];if(!s)return;
    const a=findUserById(s.userId);if(!a)return;
    // Mark as viewed
    if(currentUser&&!s.views.includes(currentUser.id)){
        s.views.push(currentUser.id);saveStories();
    }
    const sc=$('story-content');
    if(!sc)return;
    sc.innerHTML=s.mediaType?.startsWith('video/')||s.media?.includes('.mp4')||s.media?.includes('video')?
        `<video autoplay loop src="${s.media}" style="width:100%;height:100%;object-fit:cover;"></video>`:
        `<img src="${s.media}" style="width:100%;height:100%;object-fit:cover;">`;
    const ab=$('story-author-bar');
    if(ab)ab.innerHTML=`<img src="${av(a,32)}" onerror="this.src='${av(a,32)}'"><div><span>${escHtml(a.name)}</span><br><small>${timeAgo(s.timestamp)}</small></div>`;
    const vc=$('story-views-count');
    if(vc)vc.textContent=s.views.length;
    const vb=$('story-views-btn');
    if(vb)vb.onclick=()=>showStoryViewers(s.id);
    const db=$('story-delete-btn');
    if(db){db.style.display=s.userId===currentUser?.id?'flex':'none';db.onclick=()=>{if(confirm('Удалить сторис?')){stories=stories.filter(st=>st.id!==s.id);saveStories();closeStoryModal();renderStoriesPage();}};}
    // Progress bars
    const prog=$('story-progress');
    if(prog){prog.innerHTML=stories.map((_,i)=>`<div class="story-prog-bar"><div class="fill" style="width:${i<idx?100:i===idx?50:0}%"></div></div>`).join('');}
    $('story-modal')?.classList.add('active');
    clearTimeout(storyTimer);
    storyTimer=setTimeout(()=>{if(idx<stories.length-1)showStory(idx+1);else closeStoryModal();},5000);
}
window.closeStoryModal=function(){$('story-modal')?.classList.remove('active');clearTimeout(storyTimer);};
function showStoryViewers(storyId){
    const s=stories.find(st=>st.id===storyId);if(!s)return;
    const vlist=$('story-viewers-list');
    if(vlist)vlist.innerHTML=s.views.length?s.views.map(uid=>{const u=findUserById(uid);return u?`<div class="friend-item"><img src="${av(u,38)}" class="avatar" style="width:38px;height:38px;"><div><strong>${escHtml(u.name)}</strong><div style="color:var(--t3);font-size:12px;">${escHtml(u.username)}</div></div></div>`:''}).join(''):'<p style="color:var(--t3);text-align:center;padding:1rem;">Никто не смотрел</p>';
    $('story-viewers-modal')?.classList.add('active');
}
$('prev-story')?.addEventListener('click',()=>{clearTimeout(storyTimer);if(currentStoryIdx>0)showStory(--currentStoryIdx);});
$('next-story')?.addEventListener('click',()=>{clearTimeout(storyTimer);if(currentStoryIdx<stories.length-1)showStory(++currentStoryIdx);else closeStoryModal();});

// ===== POLL =====
function createPoll(){
    const q=$('poll-question')?.value.trim();
    const optsRaw=$('poll-options')?.value.trim();
    if(!q||!optsRaw){alert('Заполните все поля');return;}
    const opts=optsRaw.split(',').map(o=>o.trim()).filter(Boolean);
    if(opts.length<2){alert('Минимум 2 варианта');return;}
    const poll={id:'poll_'+Date.now(),question:q,options:opts,votes:opts.map(()=>[]),authorId:currentUser.id};
    posts.push({id:'p_'+Date.now(),authorId:currentUser.id,text:`📊 ${q}`,poll,likes:[],comments:[],reposts:0,timestamp:new Date().toISOString()});
    savePosts();$('poll-modal')?.classList.remove('active');
    if($('poll-question'))$('poll-question').value='';
    if($('poll-options'))$('poll-options').value='';
    renderFeed();
}
window.voteInPoll=function(postId,idx){
    const p=posts.find(p=>p.id===postId);if(!p?.poll)return;
    if(p.poll.votes.some(v=>v.includes(currentUser.id))){alert('Вы уже голосовали');return;}
    p.poll.votes[idx].push(currentUser.id);savePosts();renderFeed();
};
function renderPoll(poll,postId){
    const total=poll.votes.reduce((s,v)=>s+v.length,0);
    const voted=poll.votes.some(v=>v.includes(currentUser?.id));
    let html='<div class="poll">';
    poll.options.forEach((opt,i)=>{
        const pct=total>0?(poll.votes[i].length/total*100).toFixed(0):0;
        html+=`<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>${escHtml(opt)}</span><span style="color:var(--t3);">${pct}%</span></div><div style="background:var(--bg0);height:6px;border-radius:3px;overflow:hidden;"><div style="width:${pct}%;height:100%;background:var(--gbrand);border-radius:3px;transition:width .4s;"></div></div>${!voted?`<button onclick="voteInPoll('${postId}',${i})" class="secondary" style="margin-top:4px;padding:4px 12px;font-size:12px;">${escHtml(opt)}</button>`:''}</div>`;
    });
    html+=`<small style="color:var(--t3);">Всего голосов: ${total}</small></div>`;
    return html;
}

// ===== PROFILE =====
window.viewProfile=function(userId){const u=findUserById(userId);if(u){renderProfile(u);currentPage='profile';renderNav();}};
function renderProfile(user){
    if(!user)user=currentUser;
    const isOwn=currentUser?.id===user.id;
    const isFriend=currentUser?.friends?.includes(user.id);
    const outgoing=friendships.find(f=>f.from===currentUser?.id&&f.to===user.id&&f.status==='pending');
    const incoming=friendships.find(f=>f.from===user.id&&f.to===currentUser?.id&&f.status==='pending');
    const ban=getUserBan(user.id);
    let html=`
        <div class="profile-banner" style="background-image:url('${user.banner||''}');"></div>
        <div style="display:flex;align-items:flex-end;gap:1rem;padding:0 1rem;flex-wrap:wrap;">
            <img src="${av(user,90)}" class="profile-avatar">
            <div style="display:flex;gap:.5rem;margin-left:auto;flex-wrap:wrap;padding-bottom:.5rem;">
                ${isOwn?'<button id="ep" class="secondary"><i class="fas fa-edit"></i> Редактировать</button>':''}
                ${!isOwn&&currentUser?(isFriend?'<button class="secondary" disabled><i class="fas fa-user-check"></i> В друзьях</button>':outgoing?'<button disabled><i class="fas fa-clock"></i> Отправлено</button>':incoming?'<button id="afb"><i class="fas fa-user-plus"></i> Принять</button>':'<button id="afb2"><i class="fas fa-user-plus"></i> В друзья</button>'):''}
                ${!isOwn&&currentUser?`<button class="secondary" id="ocb"><i class="fas fa-envelope"></i> Сообщение</button>`:''}
                ${!isOwn&&currentUser?`<button class="secondary" id="rpb" style="color:var(--t3);"><i class="fas fa-flag"></i></button>`:''}
                ${!isOwn&&isMod(currentUser)&&!ban?`<button class="secondary" style="color:var(--red);" id="ban-btn"><i class="fas fa-ban"></i> Бан</button>`:''}
                ${!isOwn&&isMod(currentUser)&&ban?`<button class="secondary" style="color:var(--green);" id="unban-btn"><i class="fas fa-unlock"></i> Снять бан</button>`:''}
            </div>
        </div>
        <div class="profile-info">
            <h2 style="font-family:var(--font-d);font-size:1.3rem;display:flex;align-items:center;flex-wrap:wrap;gap:6px;">
                ${escHtml(user.name)} ${user.verified?'<i class="fas fa-check-circle verified-badge"></i>':''}
                ${renderUserBadges(user.id)}
                ${ban?`<span class="ban-badge"><i class="fas fa-ban"></i> Забанен</span>`:''}
                ${user.role==='moderator'?'<span class="user-badge" style="color:#a855f7;border-color:#a855f7;">🛡 Модератор</span>':''}
            </h2>
            <div style="color:var(--t3);margin-bottom:.5rem;">${escHtml(user.username)}</div>
            <p style="color:var(--t2);margin-bottom:.75rem;">${escHtml(user.bio||'')}</p>
            <div style="display:flex;gap:1.5rem;font-size:13px;color:var(--t3);">
                <span><b style="color:var(--t1);">${(user.friends||[]).length}</b> Друзей</span>
                <span><b style="color:var(--t1);">${posts.filter(p=>p.authorId===user.id).length}</b> Постов</span>
            </div>
        </div>
        <div style="padding:0 1rem;"><h3 style="font-family:var(--font-d);margin-bottom:.75rem;">Посты</h3></div>`;
    posts.filter(p=>p.authorId===user.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).forEach(p=>{
        html+=`<div class="post" style="margin:0 0 .75rem;"><div class="post-content">${escHtml(p.text)}</div>${p.media?renderMedia(p.media):''}<div style="color:var(--t3);font-size:11px;margin-top:6px;">${timeAgo(p.timestamp)} · ❤️ ${p.likes?.length||0}</div></div>`;
    });
    centerPanel.innerHTML=html;
    $('ep')?.addEventListener('click',()=>setPage('settings'));
    $('ocb')?.addEventListener('click',()=>{openChat(getChatId(currentUser.id,user.id));});
    $('rpb')?.addEventListener('click',()=>openReport(user.id,'user'));
    $('afb')?.addEventListener('click',()=>{if(incoming){incoming.status='accepted';if(!currentUser.friends)currentUser.friends=[];if(!user.friends)user.friends=[];currentUser.friends.push(user.id);user.friends.push(currentUser.id);saveUsers();saveFriendships();renderProfile(user);}});
    $('afb2')?.addEventListener('click',()=>{friendships.push({id:'f_'+Date.now(),from:currentUser.id,to:user.id,status:'pending',timestamp:new Date().toISOString()});addNotif(user.id,`👤 ${currentUser.name} отправил вам заявку в друзья.`);saveFriendships();renderProfile(user);});
    $('ban-btn')?.addEventListener('click',()=>openBanModal(user.id));
    $('unban-btn')?.addEventListener('click',()=>{const b=bans.find(b=>b.userId===user.id&&!b.lifted);if(b){b.lifted=true;saveBans();addNotif(user.id,'✅ Вы разблокированы.');renderProfile(user);}});
}
function getChatId(a,b){const s=[a,b].sort();return`chat_${s[0]}_${s[1]}`;}

// ===== REPORTS =====
let _reportTargetId='',_reportTargetType='';
window.openReport=function(targetId,targetType){
    _reportTargetId=targetId;_reportTargetType=targetType;
    document.querySelectorAll('.report-reasons input').forEach(r=>r.checked=false);
    if($('report-comment'))$('report-comment').value='';
    $('report-modal')?.classList.add('active');
};
$('submit-report-btn')?.addEventListener('click',()=>{
    const reason=document.querySelector('.report-reasons input:checked')?.value;
    if(!reason){alert('Выберите причину');return;}
    reports.push({id:'rep_'+Date.now(),targetId:_reportTargetId,targetType:_reportTargetType,reporterId:currentUser.id,reason,comment:$('report-comment')?.value||'',status:'open',timestamp:new Date().toISOString()});
    saveReports();$('report-modal')?.classList.remove('active');
    alert('✅ Жалоба отправлена. Мы рассмотрим её в ближайшее время.');
});

// ===== BAN MODAL =====
window.openBanModal=function(userId){
    const u=findUserById(userId);if(!u)return;
    const bi=$('ban-user-info');
    if(bi)bi.innerHTML=`<div class="friend-item"><img src="${av(u,40)}" class="avatar" style="width:40px;height:40px;"><div><strong>${escHtml(u.name)}</strong><div style="color:var(--t3);font-size:12px;">${escHtml(u.username)}</div></div></div>`;
    if($('ban-target-id'))$('ban-target-id').value=userId;
    if($('ban-comment'))$('ban-comment').value='';
    $('ban-modal')?.classList.add('active');
};
$('confirm-ban-btn')?.addEventListener('click',()=>{
    const userId=$('ban-target-id')?.value;
    if(!userId)return;
    const reason=$('ban-reason')?.value||'other';
    const comment=$('ban-comment')?.value||'';
    const days=parseInt($('ban-duration')?.value||'1');
    bans.push({id:'ban_'+Date.now(),userId,bannedBy:currentUser.id,reason:REASON_LABELS[reason]||reason,comment,duration:days,expiresAt:days>0?Date.now()+days*86400000:0,lifted:false,timestamp:new Date().toISOString()});
    saveBans();$('ban-modal')?.classList.remove('active');
    addNotif(userId,`🚫 Вы заблокированы. Причина: ${REASON_LABELS[reason]||reason}${comment?'. '+comment:''}${days===0?'. Навсегда':`. На ${days} дн.`}`);
    render();
});
const REASON_LABELS={spam:'Спам',harassment:'Оскорбления/Травля',hate:'Язык ненависти',violence:'Насилие/Угрозы',misinformation:'Дезинформация',nsfw:'Неприемлемый контент',cheating:'Читинг/Мошенничество',other:'Другое'};

// ===== FRIENDS =====
function renderFriends(){
    if(!currentUser)return;
    const fl=(currentUser.friends||[]).map(id=>findUserById(id)).filter(Boolean);
    let html='<h2 style="font-family:var(--font-d);margin-bottom:1rem;">Мои друзья</h2>';
    if(!fl.length)html+='<p style="color:var(--t3);">У вас пока нет друзей.</p>';
    fl.forEach(f=>html+=`<div class="friend-item pointer" onclick="viewProfile('${f.id}')"><img src="${av(f,44)}" class="avatar" style="width:44px;height:44px;"><div style="flex:1;"><div style="font-weight:600;">${escHtml(f.name)} ${f.verified?'<i class="fas fa-check-circle verified-badge"></i>':''}</div><div style="color:var(--t3);font-size:12px;">${escHtml(f.username)}</div></div><button class="secondary" onclick="event.stopPropagation();removeFriend('${f.id}')"><i class="fas fa-user-minus"></i></button></div>`);
    const inc=friendships.filter(f=>f.to===currentUser.id&&f.status==='pending');
    if(inc.length){html+='<h3 style="font-family:var(--font-d);margin:1rem 0 .5rem;">Заявки</h3>';inc.forEach(req=>{const u=findUserById(req.from);if(u)html+=`<div class="friend-item"><img src="${av(u,44)}" class="avatar" style="width:44px;height:44px;"><div style="flex:1;font-weight:600;">${escHtml(u.name)}</div><button onclick="acceptFriend('${req.id}')"><i class="fas fa-check"></i></button><button class="secondary" onclick="rejectFriend('${req.id}')"><i class="fas fa-times"></i></button></div>`;});}
    centerPanel.innerHTML=html;
}
window.removeFriend=function(fId){if(!confirm('Удалить из друзей?'))return;currentUser.friends=currentUser.friends.filter(id=>id!==fId);const f=findUserById(fId);if(f)f.friends=(f.friends||[]).filter(id=>id!==currentUser.id);saveUsers();renderFriends();};
window.acceptFriend=function(reqId){const req=friendships.find(f=>f.id===reqId);if(!req)return;req.status='accepted';const from=findUserById(req.from),to=findUserById(req.to);if(!from.friends)from.friends=[];if(!to.friends)to.friends=[];from.friends.push(to.id);to.friends.push(from.id);saveUsers();saveFriendships();renderFriends();};
window.rejectFriend=function(reqId){friendships=friendships.filter(f=>f.id!==reqId);saveFriendships();renderFriends();};

// ===== COMMUNITIES =====
function renderCommunities(){
    let html=`<h2 style="font-family:var(--font-d);margin-bottom:1rem;">Сообщества</h2>
    <div style="display:flex;gap:.5rem;margin-bottom:1rem;flex-wrap:wrap;">
        <button id="ccb" class="secondary"><i class="fas fa-plus"></i> Создать</button>
        ${Object.entries(CATEGORY_MAP).slice(0,6).map(([k,v])=>`<button class="secondary cat-filter" data-cat="${k}" style="font-size:12px;padding:6px 12px;">${v}</button>`).join('')}
    </div>`;
    let filtered=communities;
    // Filter by category if active
    const active=document.querySelector('.cat-filter.active');
    if(active)filtered=communities.filter(c=>c.category===active.dataset.cat);
    if(!filtered.length)html+='<p style="color:var(--t3);">Нет сообществ.</p>';
    filtered.forEach(c=>{html+=`<div class="community-card" onclick="viewCommunity('${c.id}')"><img src="${av({avatar:c.avatar,name:c.name},56)}" class="community-avatar"><div><h3 style="font-weight:600;">${escHtml(c.name)} ${c.verified?'<i class="fas fa-check-circle verified-badge"></i>':''}</h3><p style="color:var(--t3);font-size:13px;">${escHtml(c.description||'')}</p><span class="category-badge">${CATEGORY_MAP[c.category]||'🌐 Общее'}</span></div></div>`;});
    centerPanel.innerHTML=html;
    $('ccb')?.addEventListener('click',()=>$('create-community-modal')?.classList.add('active'));
    document.querySelectorAll('.cat-filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.cat-filter').forEach(b=>b.classList.remove('active'));btn.classList.toggle('active');renderCommunities();}));
}
window.viewCommunity=function(id){const c=findCommunityById(id);if(c)renderCommunity(c);};
function renderCommunity(c){
    const isMember=communityMembers.some(m=>m.communityId===c.id&&m.userId===currentUser?.id);
    const isCreator=c.createdBy===currentUser?.id;
    const cPosts=communityPosts.filter(p=>p.communityId===c.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
    let html=`<div class="profile-banner" style="background-image:url('${c.banner||''}');"></div>
        <div style="display:flex;align-items:flex-end;gap:1rem;padding:0 1rem;flex-wrap:wrap;">
            <img src="${av({avatar:c.avatar,name:c.name},90)}" class="profile-avatar">
            <div style="margin-left:auto;display:flex;gap:.5rem;flex-wrap:wrap;padding-bottom:.5rem;">
                ${!isMember?'<button id="jcb"><i class="fas fa-user-plus"></i> Вступить</button>':'<button id="lcb" class="secondary"><i class="fas fa-sign-out-alt"></i> Покинуть</button>'}
                ${isMember?'<button id="ncp" class="secondary"><i class="fas fa-plus"></i> Пост</button>':''}
                ${isMember?'<button id="ccht" class="secondary"><i class="fas fa-comments"></i> Чат</button>':''}
                ${isCreator?'<button id="rvcomm" class="secondary"><i class="fas fa-check-circle"></i> Верификация</button>':''}
            </div>
        </div>
        <div class="profile-info">
            <h2 style="font-family:var(--font-d);">${escHtml(c.name)} ${c.verified?'<i class="fas fa-check-circle verified-badge"></i>':''}</h2>
            <span class="category-badge">${CATEGORY_MAP[c.category]||'🌐 Общее'}</span>
            <p style="color:var(--t2);margin-top:.5rem;">${escHtml(c.description||'')}</p>
            <div style="font-size:13px;color:var(--t3);margin-top:.5rem;">👥 ${communityMembers.filter(m=>m.communityId===c.id).length} участников</div>
        </div>
        <div style="padding:0 1rem;"><h3 style="font-family:var(--font-d);margin-bottom:.75rem;">Посты</h3></div>`;
    cPosts.forEach(p=>{const a=findUserById(p.authorId);if(a)html+=`<div class="post" style="margin:0 0 .75rem;"><div class="post-header" onclick="viewProfile('${a.id}')"><img src="${av(a,36)}" class="avatar" style="width:36px;height:36px;"><span style="font-weight:600;">${escHtml(a.name)}</span></div><div class="post-content">${escHtml(p.text)}</div></div>`;});
    if(!cPosts.length&&isMember)html+='<p style="padding:1rem;color:var(--t3);">Нет постов. Будьте первым!</p>';
    centerPanel.innerHTML=html;
    $('jcb')?.addEventListener('click',()=>{communityMembers.push({communityId:c.id,userId:currentUser.id,joinedAt:new Date().toISOString()});const chat=communityChats.find(ch=>ch.communityId===c.id);if(chat&&!chat.members.includes(currentUser.id))chat.members.push(currentUser.id);saveCommunityMembers();saveCommunityChats();checkAchievements();renderCommunity(c);});
    $('lcb')?.addEventListener('click',()=>{communityMembers=communityMembers.filter(m=>!(m.communityId===c.id&&m.userId===currentUser.id));const chat=communityChats.find(ch=>ch.communityId===c.id);if(chat)chat.members=chat.members.filter(id=>id!==currentUser.id);saveCommunityMembers();saveCommunityChats();renderCommunity(c);});
    $('ncp')?.addEventListener('click',()=>{const text=prompt('Текст поста:');if(text?.trim()){communityPosts.push({id:'cp_'+Date.now(),communityId:c.id,authorId:currentUser.id,text:text.trim(),media:null,likes:[],comments:[],reposts:0,timestamp:new Date().toISOString()});saveCommunityPosts();renderCommunity(c);}});
    $('ccht')?.addEventListener('click',()=>{const chat=communityChats.find(ch=>ch.communityId===c.id);if(chat)openChat(chat.id);});
    $('rvcomm')?.addEventListener('click',()=>{if(communityVerifyRequests.some(r=>r.communityId===c.id&&r.status==='pending')){alert('Заявка уже отправлена');return;}communityVerifyRequests.push({id:'cvr_'+Date.now(),communityId:c.id,status:'pending',timestamp:new Date().toISOString()});saveCommunityVerifyRequests();alert('✅ Заявка отправлена!');});
}

// ===== MESSAGES =====
function renderMessagesList(){
    let chats=[];
    const uids=[...new Set(messages.map(m=>m.chatId))];
    uids.forEach(id=>{
        if(id.startsWith('group_')||id.startsWith('commChat_'))return;
        const parts=id.replace('chat_','').split('_');
        if(!parts.some(p=>p===currentUser.id))return;
        const otherId=parts.find(p=>p!==currentUser.id);
        const other=findUserById(otherId);if(!other)return;
        const last=messages.filter(m=>m.chatId===id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];
        chats.push({id,title:other.name,avatar:other.avatar,last});
    });
    const groups=gj(SK.GROUPS,[]);
    groups.filter(g=>g.members.includes(currentUser.id)).forEach(g=>{const last=messages.filter(m=>m.chatId===g.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];chats.push({id:g.id,title:g.name,icon:'fa-users',last});});
    communityChats.filter(cc=>cc.members.includes(currentUser.id)).forEach(cc=>{const comm=findCommunityById(cc.communityId);const last=messages.filter(m=>m.chatId===cc.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp))[0];chats.push({id:cc.id,title:comm?comm.name+' — чат':'Чат',icon:'fa-users-cog',last});});
    chats.sort((a,b)=>new Date(b.last?.timestamp||0)-new Date(a.last?.timestamp||0));
    let html=`<h2 style="font-family:var(--font-d);margin-bottom:1rem;">Сообщения</h2><button id="cgb" class="secondary" style="margin-bottom:1rem;"><i class="fas fa-users"></i> Создать группу</button>`;
    if(!chats.length)html+='<p style="color:var(--t3);">Начните переписку через профиль пользователя.</p>';
    chats.forEach(chat=>html+=`<div class="friend-item pointer" onclick="openChat('${chat.id}')">
        ${chat.avatar?`<img src="${chat.avatar}" class="avatar" style="width:42px;height:42px;">`:`<div style="width:42px;height:42px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas ${chat.icon||'fa-user'}" style="color:var(--t3);"></i></div>`}
        <div style="min-width:0;flex:1;"><div style="font-weight:600;font-size:14px;">${escHtml(chat.title)}</div>${chat.last?`<div style="color:var(--t3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(chat.last.text||'🎤')}</div>`:''}</div>
        ${chat.last?`<div style="color:var(--t3);font-size:11px;flex-shrink:0;">${timeAgo(chat.last.timestamp)}</div>`:''}</div>`);
    centerPanel.innerHTML=html;
    $('cgb')?.addEventListener('click',showCreateGroupModal);
}
function showCreateGroupModal(){
    const div=document.createElement('div');
    div.innerHTML=`<div class="modal active"><div class="modal-content" style="max-width:360px;"><div class="modal-header"><h2>Создать группу</h2><button class="close-modal-btn" onclick="this.closest('.modal').remove()"><i class="fas fa-times"></i></button></div><div class="form-group"><label>Название</label><input type="text" id="tmp-gn" placeholder="Название группы"></div><button class="auth-btn" id="tmp-cg"><i class="fas fa-check"></i> Создать</button></div></div>`;
    document.body.appendChild(div);
    div.querySelector('#tmp-cg').addEventListener('click',()=>{const name=div.querySelector('#tmp-gn').value.trim();if(!name)return;const gId='group_'+Date.now();const groups=gj(SK.GROUPS,[]);groups.push({id:gId,name,members:[currentUser.id],createdBy:currentUser.id,createdAt:new Date().toISOString()});sj(SK.GROUPS,groups);div.remove();openChat(gId);});
}
window.openChat=function(chatId){currentChatId=chatId;renderChat(chatId);};
function renderChat(chatId){
    let title='',isGroup=false;
    if(chatId.startsWith('group_')){isGroup=true;const groups=gj(SK.GROUPS,[]);title=groups.find(g=>g.id===chatId)?.name||'Группа';}
    else if(chatId.startsWith('commChat_')){const cc=communityChats.find(c=>c.id===chatId);const comm=cc?findCommunityById(cc.communityId):null;title=comm?comm.name+' — чат':'Чат сообщества';}
    else{const otherId=chatId.replace('chat_','').split('_').find(p=>p!==currentUser.id);title=findUserById(otherId)?.name||'Пользователь';}
    const chatMsgs=messages.filter(m=>m.chatId===chatId).sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
    const now=Date.now();const typing=Object.entries(typingStatus[chatId]||{}).filter(([uid,t])=>uid!==currentUser.id&&now-t<3000).map(([uid])=>findUserById(uid)?.name).filter(Boolean);
    let html=`<div class="chat-container"><div class="chat-header">
        <button class="secondary" style="padding:6px 12px;" onclick="setPage('messages')"><i class="fas fa-arrow-left"></i></button>
        <h3>${escHtml(title)}</h3>
        <div style="margin-left:auto;display:flex;gap:6px;">
            ${isGroup?'<button class="secondary" id="amb" title="Добавить"><i class="fas fa-user-plus"></i></button>':''}
            <button class="secondary" id="acb"><i class="fas fa-phone"></i></button>
            <button class="secondary" id="vcb"><i class="fas fa-video"></i></button>
        </div></div>
        <div class="chat-messages" id="chat-messages">`;
    chatMsgs.forEach(msg=>{
        const isOwn=msg.senderId===currentUser.id;
        const sender=findUserById(msg.senderId);
        html+=`<div class="message ${isOwn?'own':''}" data-mid="${msg.id}">
            ${!isOwn&&isGroup?`<div class="message-author">${escHtml(sender?.name||'?')}</div>`:''}
            <div>${escHtml(msg.text||'')}</div>
            ${msg.audio?`<audio controls src="${msg.audio}" style="max-width:200px;margin-top:4px;"></audio>`:''}
            <div class="message-time">${new Date(msg.timestamp).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}</div>
            ${!isOwn?`<div style="display:flex;gap:3px;margin-top:4px;opacity:0;transition:opacity .2s;" class="msg-react-bar">
                ${['❤️','👍','😂','😮','😢'].map(r=>`<span style="cursor:pointer;font-size:13px;" onclick="addReaction('${msg.id}','${r}')">${r}</span>`).join('')}
            </div>`:''}
            ${isOwn?`<span class="delete-msg" onclick="deleteMessage('${msg.id}')"><i class="fas fa-times"></i></span>`:''}
            ${renderReactions(msg)}
        </div>`;
    });
    if(typing.length)html+=`<div class="typing-indicator">${escHtml(typing.join(', '))} печатает <span>.</span><span>.</span><span>.</span></div>`;
    html+=`</div><div class="chat-input-area"><input type="text" id="ci" placeholder="Сообщение..." autocomplete="off"><button id="vrb" class="secondary" title="Голосовое"><i class="fas fa-microphone"></i></button><button id="scb" class="send-btn"><i class="fas fa-paper-plane"></i></button></div></div>`;
    centerPanel.innerHTML=html;
    const msgs=$('chat-messages');if(msgs)msgs.scrollTop=msgs.scrollHeight;
    document.querySelectorAll('.message').forEach(el=>{const rb=el.querySelector('.msg-react-bar');if(rb){el.addEventListener('mouseenter',()=>rb.style.opacity='1');el.addEventListener('mouseleave',()=>rb.style.opacity='0');}});
    const inp=$('ci');
    function sendMsg(){const text=inp?.value.trim();if(!text)return;messages.push({id:'m_'+Date.now(),chatId,senderId:currentUser.id,text,timestamp:new Date().toISOString()});saveMessages();if(inp)inp.value='';if(typingStatus[chatId])delete typingStatus[chatId][currentUser.id];saveTyping();renderChat(chatId);}
    inp?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}});
    inp?.addEventListener('input',()=>{if(!typingStatus[chatId])typingStatus[chatId]={};typingStatus[chatId][currentUser.id]=Date.now();saveTyping();clearTimeout(typingTimer);typingTimer=setTimeout(()=>{if(typingStatus[chatId])delete typingStatus[chatId][currentUser.id];saveTyping();},3000);});
    $('scb')?.addEventListener('click',sendMsg);
    $('vrb')?.addEventListener('click',startVoiceRecording);
    $('acb')?.addEventListener('click',()=>startCall(chatId,'audio'));
    $('vcb')?.addEventListener('click',()=>startCall(chatId,'video'));
    if(isGroup)$('amb')?.addEventListener('click',()=>{const groups=gj(SK.GROUPS,[]);const group=groups.find(g=>g.id===chatId);if(!group)return;const avail=(currentUser.friends||[]).map(id=>findUserById(id)).filter(f=>f&&!group.members.includes(f.id));if(!avail.length){alert('Нет друзей для добавления');return;}const name=prompt(`Добавить:\n${avail.map((f,i)=>`${i+1}. ${f.name}`).join('\n')}\nВведите номер:`);const idx=parseInt(name)-1;if(idx>=0&&avail[idx]){group.members.push(avail[idx].id);const updated=groups.map(g=>g.id===group.id?group:g);sj(SK.GROUPS,updated);renderChat(chatId);}});
}
window.deleteMessage=function(id){if(!confirm('Удалить?'))return;messages=messages.filter(m=>m.id!==id);saveMessages();if(currentChatId)renderChat(currentChatId);};
window.addReaction=function(msgId,reaction){const msg=messages.find(m=>m.id===msgId);if(!msg)return;if(!msg.reactions)msg.reactions=[];const ex=msg.reactions.find(r=>r.userId===currentUser.id);if(ex)ex.reaction=reaction;else msg.reactions.push({userId:currentUser.id,reaction});saveMessages();if(currentChatId)renderChat(currentChatId);};
function renderReactions(msg){if(!msg.reactions?.length)return'';const map={};msg.reactions.forEach(r=>{map[r.reaction]=(map[r.reaction]||0)+1;});return`<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;">${Object.entries(map).map(([r,c])=>`<span style="background:var(--bg0);padding:2px 6px;border-radius:50px;font-size:11px;">${r} ${c}</span>`).join('')}</div>`;}

// ===== NOTIFICATIONS =====
function renderNotifications(){
    notifications.filter(n=>n.userId===currentUser.id).forEach(n=>n.read=true);
    saveNotifications();updateNotifBadge();
    const all=notifications.filter(n=>n.userId===currentUser.id).reverse();
    let html='<h2 style="font-family:var(--font-d);margin-bottom:1rem;">Уведомления</h2>';
    if(!all.length)html+='<p style="color:var(--t3);">Нет уведомлений.</p>';
    all.forEach(n=>html+=`<div class="notification">${escHtml(n.text)} <span style="float:right;font-size:11px;color:var(--t3);">${timeAgo(n.timestamp)}</span></div>`);
    if(all.length)html+=`<button class="secondary" style="margin-top:.5rem;" id="cnb"><i class="fas fa-trash"></i> Очистить</button>`;
    centerPanel.innerHTML=html;
    $('cnb')?.addEventListener('click',()=>{notifications=notifications.filter(n=>n.userId!==currentUser.id);saveNotifications();renderNotifications();});
}

// ===== SUPPORT =====
function renderSupportPage(){
    let html=`<div class="support-page"><h2 style="font-family:var(--font-d);">🛟 Поддержка</h2>
    <div class="admin-section">
        <h3><i class="fas fa-plus-circle"></i> Создать тикет</h3>
        <div class="form-group"><label>Тема</label><input type="text" id="tkt-subject" placeholder="Опишите проблему кратко"></div>
        <div class="form-group"><label>Сообщение</label><textarea id="tkt-msg" placeholder="Подробно опишите вашу проблему..." rows="4"></textarea></div>
        <div class="form-group"><label>Категория</label><select id="tkt-cat"><option value="bug">🐛 Ошибка</option><option value="account">👤 Аккаунт</option><option value="ban">🚫 Апелляция бана</option><option value="feature">💡 Предложение</option><option value="other">📦 Другое</option></select></div>
        <button id="send-ticket"><i class="fas fa-paper-plane"></i> Отправить</button>
    </div>
    <h3 style="font-family:var(--font-d);margin-bottom:.75rem;">Мои тикеты</h3>`;
    const myTickets=supportTickets.filter(t=>t.userId===currentUser.id).reverse();
    if(!myTickets.length)html+='<p style="color:var(--t3);">У вас нет тикетов.</p>';
    myTickets.forEach(t=>{html+=`<div class="ticket-card" onclick="openTicket('${t.id}')"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem;"><strong>${escHtml(t.subject)}</strong><span class="ticket-status ${t.status}">${{open:'✅ Открыт',closed:'✖ Закрыт',pending:'⏳ Ожидает'}[t.status]}</span></div><p style="color:var(--t2);font-size:13px;">${escHtml(t.message.slice(0,80))}${t.message.length>80?'…':''}</p><small style="color:var(--t3);">${timeAgo(t.createdAt)}</small></div>`;});
    html+='</div>';
    centerPanel.innerHTML=html;
    $('send-ticket')?.addEventListener('click',()=>{const subj=$('tkt-subject')?.value.trim();const msg=$('tkt-msg')?.value.trim();if(!subj||!msg){alert('Заполните все поля');return;}supportTickets.push({id:'tkt_'+Date.now(),userId:currentUser.id,subject:subj,message:msg,category:$('tkt-cat')?.value||'other',status:'open',replies:[],createdAt:new Date().toISOString()});saveSupportTickets();renderSupportPage();alert('✅ Тикет создан. Ответим в ближайшее время!');});
}
window.openTicket=function(id){
    const t=supportTickets.find(t=>t.id===id);if(!t)return;
    const td=$('ticket-detail');
    if(td)td.innerHTML=`<div style="margin-bottom:1rem;"><strong>${escHtml(t.subject)}</strong> <span class="ticket-status ${t.status}">${{open:'Открыт',closed:'Закрыт',pending:'Ожидает'}[t.status]}</span></div><div class="ticket-message">${escHtml(t.message)}</div>${t.replies?.map(r=>`<div class="ticket-message ${r.isAdmin?'admin-reply':''}">${r.isAdmin?'<strong style="color:var(--blue);">Поддержка:</strong> ':''}${escHtml(r.text)}<br><small style="color:var(--t3);">${timeAgo(r.timestamp)}</small></div>`).join('')||''}`;
    const rarea=$('ticket-reply-area');
    if(rarea)rarea.style.display=t.status!=='closed'?'flex':'none';
    $('ticket-reply-btn')?.addEventListener('click',()=>{const text=$('ticket-reply-input')?.value.trim();if(!text)return;if(!t.replies)t.replies=[];t.replies.push({text,userId:currentUser.id,isAdmin:false,timestamp:new Date().toISOString()});saveSupportTickets();if($('ticket-reply-input'))$('ticket-reply-input').value='';openTicket(id);});
    $('support-ticket-modal')?.classList.add('active');
};

// ===== SETTINGS =====
function renderSettings(){
    centerPanel.innerHTML=`<h2 style="font-family:var(--font-d);margin-bottom:1.25rem;">Настройки</h2>
    <div class="form-group"><label><i class="fas fa-user"></i> Имя</label><input type="text" id="s-name" value="${escHtml(currentUser.name)}"></div>
    <div class="form-group"><label><i class="fas fa-at"></i> Username</label><div class="username-wrapper"><span class="username-prefix">@</span><input type="text" id="s-username" value="${escHtml(currentUser.username.replace('@',''))}"></div></div>
    <div class="form-group"><label><i class="fas fa-align-left"></i> О себе</label><textarea id="s-bio">${escHtml(currentUser.bio||'')}</textarea></div>
    <div class="form-group"><label><i class="fas fa-camera"></i> Аватар</label><input type="file" id="s-avatar" accept="image/*"></div>
    <div class="form-group"><label><i class="fas fa-image"></i> Баннер</label><input type="file" id="s-banner" accept="image/*"></div>
    <div class="form-group"><label><i class="fas fa-lock"></i> Новый пароль</label><div class="password-wrapper"><input type="password" id="s-pass" placeholder="Оставьте пустым чтобы не менять"><button type="button" class="toggle-pass" onclick="togglePassword('s-pass',this)"><i class="fas fa-eye"></i></button></div></div>
    <div class="form-group"><label><i class="fas fa-palette"></i> Тема</label><select id="s-theme"><option value="dark" ${currentUser.theme==='dark'?'selected':''}>🌙 Тёмная</option><option value="light" ${currentUser.theme==='light'?'selected':''}>☀️ Светлая</option><option value="system">💻 Системная</option></select></div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem;">
        <button id="ss"><i class="fas fa-save"></i> Сохранить</button>
        <button class="secondary" id="rv"><i class="fas fa-check-circle"></i> Верификация</button>
        <button class="secondary" id="logout-btn" style="color:var(--red);"><i class="fas fa-sign-out-alt"></i> Выйти</button>
    </div>`;
    $('s-theme')?.addEventListener('change',e=>applyTheme(e.target.value));
    $('ss')?.addEventListener('click',()=>{
        const name=$('s-name')?.value.trim();const uname='@'+$('s-username')?.value.trim().replace('@','');
        if(!name||uname==='@'){alert('Имя и username обязательны');return;}
        if(users.some(u=>u.username===uname&&u.id!==currentUser.id)){alert('Username занят');return;}
        currentUser.name=name;currentUser.username=uname;currentUser.bio=$('s-bio')?.value.trim();currentUser.theme=$('s-theme')?.value;
        const pass=$('s-pass')?.value;if(pass&&pass.length>=6)currentUser.password=pass;
        const av=$('s-avatar')?.files[0];const bn=$('s-banner')?.files[0];
        const reads=[];
        if(av)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{currentUser.avatar=e.target.result;r();};fr.readAsDataURL(av);}));
        if(bn)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{currentUser.banner=e.target.result;r();};fr.readAsDataURL(bn);}));
        Promise.all(reads).then(()=>{saveUsers();saveCurrentUser();applyTheme(currentUser.theme);render();alert('✅ Сохранено');});
    });
    $('rv')?.addEventListener('click',()=>{if(verificationRequests.some(r=>r.userId===currentUser.id&&r.status==='pending')){alert('Заявка уже отправлена');return;}verificationRequests.push({id:'vr_'+Date.now(),userId:currentUser.id,status:'pending',timestamp:new Date().toISOString()});saveVerifyRequests();alert('✅ Заявка отправлена.');});
    $('logout-btn')?.addEventListener('click',()=>{if(confirm('Выйти?')){currentUser=null;saveCurrentUser();render();}});
}

// ===== ACHIEVEMENTS =====
const ACHS=[
    {id:'first_post',name:'Первый пост',icon:'fa-pen',desc:'Опубликовал первый пост',check:()=>posts.filter(p=>p.authorId===currentUser.id).length>=1},
    {id:'writer',name:'Писатель',icon:'fa-pen-fancy',desc:'5 постов',check:()=>posts.filter(p=>p.authorId===currentUser.id).length>=5},
    {id:'popular',name:'Популярный',icon:'fa-users',desc:'5 друзей',check:()=>(currentUser.friends||[]).length>=5},
    {id:'talkative',name:'Говорун',icon:'fa-comments',desc:'50 сообщений',check:()=>messages.filter(m=>m.senderId===currentUser.id).length>=50},
    {id:'activist',name:'Активист',icon:'fa-user-friends',desc:'В 3 сообществах',check:()=>communityMembers.filter(m=>m.userId===currentUser.id).length>=3}
];
function checkAchievements(){
    if(!currentUser)return;
    ACHS.forEach(def=>{if(!achievements.some(a=>a.id===def.id&&a.userId===currentUser.id)&&def.check()){achievements.push({...def,userId:currentUser.id,earnedAt:new Date().toISOString()});addNotif(currentUser.id,`🏆 Получено достижение: ${def.name}!`);saveAchievements();}});
}
function renderAchievements(){const el=$('achievements');if(!el)return;const ua=achievements.filter(a=>a.userId===currentUser?.id);el.innerHTML=ua.length?ua.map(a=>`<div class="achievement"><i class="fas ${a.icon}"></i><div><strong>${a.name}</strong><small>${a.desc||a.description}</small></div></div>`).join(''):'<p style="color:var(--t3);font-size:12px;padding:4px;">Пока нет достижений</p>';}

// ===== ADMIN PANEL =====
function renderAdminPanel(){
    if(!isOwner(currentUser)){centerPanel.innerHTML='<p style="color:var(--red);">Доступ запрещён</p>';return;}
    const pendingV=verificationRequests.filter(r=>r.status==='pending');
    const pendingCV=communityVerifyRequests.filter(r=>r.status==='pending');
    const openReports=reports.filter(r=>r.status==='open');
    const openTickets=supportTickets.filter(t=>t.status==='open');
    const maintenance=gj(SK.MAINTENANCE,{active:false});
    const scripts=gj(SK.CUSTOM_SCRIPTS,[]);
    let html=`<div class="admin-panel">
    <div class="admin-header">
        <div class="admin-header-icon"><i class="fas fa-shield-alt"></i></div>
        <div><h2>Панель администратора</h2><p>Управление платформой KNB</p></div>
    </div>
    <div class="admin-stats">
        <div class="stat-card"><div class="stat-num">${users.length}</div><div class="stat-label">Пользователей</div></div>
        <div class="stat-card"><div class="stat-num">${posts.length}</div><div class="stat-label">Постов</div></div>
        <div class="stat-card"><div class="stat-num">${communities.length}</div><div class="stat-label">Сообществ</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--amber);">${openReports.length+pendingV.length}</div><div class="stat-label">Ожидают</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--green);">${badges.length}</div><div class="stat-label">Бейджей</div></div>
        <div class="stat-card"><div class="stat-num" style="color:var(--red);">${bans.filter(b=>!b.lifted).length}</div><div class="stat-label">Банов</div></div>
    </div>
    <div class="admin-tabs">
        <button class="tab-btn active" data-tab="verification"><i class="fas fa-check-circle"></i> Верификация ${pendingV.length+pendingCV.length?`<span class="notif-badge">${pendingV.length+pendingCV.length}</span>`:''}</button>
        <button class="tab-btn" data-tab="reports"><i class="fas fa-flag"></i> Жалобы ${openReports.length?`<span class="notif-badge">${openReports.length}</span>`:''}</button>
        <button class="tab-btn" data-tab="support"><i class="fas fa-life-ring"></i> Тикеты ${openTickets.length?`<span class="notif-badge">${openTickets.length}</span>`:''}</button>
        <button class="tab-btn" data-tab="users"><i class="fas fa-users"></i> Пользователи</button>
        <button class="tab-btn" data-tab="bans"><i class="fas fa-ban"></i> Баны</button>
        <button class="tab-btn" data-tab="badges"><i class="fas fa-medal"></i> Бейджи</button>
        <button class="tab-btn" data-tab="maintenance"><i class="fas fa-tools"></i> Система</button>
        <button class="tab-btn" data-tab="scripts"><i class="fas fa-code"></i> Скрипты</button>
    </div>

    <!-- VERIFICATION -->
    <div class="tab-pane active" id="tab-verification">
        <div class="admin-section"><h3><i class="fas fa-user-check"></i> Заявки пользователей (${pendingV.length})</h3>
        ${pendingV.length?pendingV.map(r=>{const u=findUserById(r.userId);return u?`<div class="admin-row"><img src="${av(u,36)}" class="avatar" style="width:36px;height:36px;"><div class="admin-row-info"><strong>${escHtml(u.name)}</strong><small>${escHtml(u.username)}</small></div><button onclick="approveUserVerify('${r.id}')"><i class="fas fa-check"></i></button><button class="secondary" onclick="rejectUserVerify('${r.id}')"><i class="fas fa-times"></i></button></div>`:''}).join(''):'<p style="color:var(--t3);font-size:13px;">Нет заявок</p>'}
        </div>
        <div class="admin-section"><h3><i class="fas fa-users"></i> Заявки сообществ (${pendingCV.length})</h3>
        ${pendingCV.length?pendingCV.map(r=>{const c=findCommunityById(r.communityId);return c?`<div class="admin-row"><div class="admin-row-info"><strong>${escHtml(c.name)}</strong><small>${CATEGORY_MAP[c.category]||''}</small></div><button onclick="approveCommunityVerify('${r.id}')"><i class="fas fa-check"></i></button><button class="secondary" onclick="rejectCommunityVerify('${r.id}')"><i class="fas fa-times"></i></button></div>`:''}).join(''):'<p style="color:var(--t3);font-size:13px;">Нет заявок</p>'}
        </div>
    </div>

    <!-- REPORTS -->
    <div class="tab-pane" id="tab-reports">
        <div class="admin-section"><h3><i class="fas fa-flag"></i> Жалобы (${openReports.length})</h3>
        ${openReports.length?openReports.map(r=>{const reporter=findUserById(r.reporterId);return`<div class="admin-row"><div class="admin-row-info"><strong>${REASON_LABELS[r.reason]||r.reason}</strong><small>Тип: ${r.targetType==='post'?'Пост':'Пользователь'} · ${reporter?escHtml(reporter.name):''} · ${timeAgo(r.timestamp)}</small>${r.comment?`<br><em style="font-size:11px;color:var(--t2);">${escHtml(r.comment)}</em>`:''}</div><button onclick="resolveReport('${r.id}')"><i class="fas fa-check"></i> Закрыть</button></div>`;}).join(''):'<p style="color:var(--t3);font-size:13px;">Нет жалоб</p>'}
        </div>
    </div>

    <!-- SUPPORT TICKETS -->
    <div class="tab-pane" id="tab-support">
        <div class="admin-section"><h3><i class="fas fa-life-ring"></i> Тикеты поддержки</h3>
        ${supportTickets.slice().reverse().map(t=>{const u=findUserById(t.userId);return`<div class="admin-row"><div class="admin-row-info"><strong>${escHtml(t.subject)}</strong><small>${u?escHtml(u.name):''} · ${timeAgo(t.createdAt)}</small></div><span class="ticket-status ${t.status}">${{open:'Открыт',closed:'Закрыт',pending:'Ожидает'}[t.status]}</span><button onclick="adminReplyTicket('${t.id}')" class="secondary" style="font-size:12px;"><i class="fas fa-reply"></i></button>${t.status!=='closed'?`<button onclick="closeTicket('${t.id}')" class="secondary" style="font-size:12px;color:var(--t3);"><i class="fas fa-times"></i></button>`:''}</div>`;}).join('')||'<p style="color:var(--t3);font-size:13px;">Нет тикетов</p>'}
        </div>
    </div>

    <!-- USERS -->
    <div class="tab-pane" id="tab-users">
        <div class="admin-section"><h3><i class="fas fa-users"></i> Все пользователи (${users.length})</h3>
        ${users.map(u=>{const ban=getUserBan(u.id);return`<div class="admin-row"><img src="${av(u,36)}" class="avatar" style="width:36px;height:36px;"><div class="admin-row-info"><strong>${escHtml(u.name)} ${u.verified?'<i class="fas fa-check-circle verified-badge" style="font-size:11px;"></i>':''} ${ban?'<span class="ban-badge" style="font-size:10px;"><i class="fas fa-ban"></i></span>':''}</strong><small>${escHtml(u.email)} ${u.role==='moderator'?'· 🛡 Мод':''}</small></div><button onclick="toggleUserVerify('${u.id}')" class="secondary" style="font-size:11px;">${u.verified?'Снять ✓':'Выдать ✓'}</button><button onclick="toggleModerator('${u.id}')" class="secondary" style="font-size:11px;">${u.role==='moderator'?'Снять мод':'Сделать мод'}</button><button onclick="openBanModal('${u.id}')" class="secondary" style="font-size:11px;color:var(--red);"><i class="fas fa-ban"></i></button><button onclick="openAssignBadgeFor('${u.id}')" class="secondary" style="font-size:11px;color:var(--amber);"><i class="fas fa-medal"></i></button></div>`;}).join('')}
        </div>
    </div>

    <!-- BANS -->
    <div class="tab-pane" id="tab-bans">
        <div class="admin-section"><h3><i class="fas fa-ban"></i> Активные баны</h3>
        ${bans.filter(b=>!b.lifted).length?bans.filter(b=>!b.lifted).map(b=>{const u=findUserById(b.userId);const by=findUserById(b.bannedBy);return`<div class="admin-row"><img src="${av(u,36)}" class="avatar" style="width:36px;height:36px;"><div class="admin-row-info"><strong>${u?escHtml(u.name):'?'}</strong><small>Причина: ${escHtml(b.reason)} · ${b.duration===0?'Навсегда':'До '+new Date(b.expiresAt).toLocaleDateString('ru')} · Бан выдан: ${by?escHtml(by.name):'?'}</small>${b.comment?`<br><em style="font-size:11px;color:var(--t2);">${escHtml(b.comment)}</em>`:''}</div><button onclick="liftBan('${b.id}')"><i class="fas fa-unlock"></i> Снять</button></div>`;}).join(''):'<p style="color:var(--t3);font-size:13px;">Нет активных банов</p>'}
        </div>
    </div>

    <!-- BADGES -->
    <div class="tab-pane" id="tab-badges">
        <div class="admin-section">
            <h3><i class="fas fa-medal"></i> Создать бейдж</h3>
            <div class="badge-creator">
                <div class="form-group"><label>Название бейджа</label><input type="text" id="badge-name" placeholder="Например: Ветеран"></div>
                <div class="form-group"><label>Картинка бейджа</label><input type="file" id="badge-img" accept="image/*"></div>
                <div class="form-group"><label>Цвет (hex)</label><input type="color" id="badge-color" value="#3b82f6" style="height:40px;"></div>
                <button id="create-badge-btn"><i class="fas fa-plus"></i> Создать бейдж</button>
            </div>
            <div style="margin-top:1rem;"><h3 style="font-size:14px;margin-bottom:.75rem;">Существующие бейджи</h3>
            <div class="badge-list" id="admin-badge-list">
                ${badges.map(b=>`<div class="badge-item-admin">${b.image?`<img src="${b.image}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">`:''}<span style="color:${b.color||'var(--t1)'};">${escHtml(b.name)}</span><button onclick="openAssignBadge('${b.id}')" style="font-size:11px;padding:4px 8px;"><i class="fas fa-user-plus"></i></button><button onclick="deleteBadge('${b.id}')" class="secondary" style="font-size:11px;padding:4px 8px;color:var(--red);"><i class="fas fa-trash"></i></button></div>`).join('')||'<p style="color:var(--t3);font-size:12px;">Нет бейджей</p>'}
            </div></div>
        </div>
    </div>

    <!-- MAINTENANCE / SYSTEM -->
    <div class="tab-pane" id="tab-maintenance">
        <div class="admin-section">
            <h3><i class="fas fa-power-off"></i> Режим обслуживания</h3>
            <div class="maintenance-toggle">
                <label class="toggle-switch"><input type="checkbox" id="maint-toggle" ${maintenance.active?'checked':''}><span class="toggle-slider"></span></label>
                <div><strong>${maintenance.active?'🔴 Сайт на обслуживании':'🟢 Сайт работает нормально'}</strong><div style="color:var(--t3);font-size:12px;">При включении пользователи увидят экран обслуживания</div></div>
            </div>
            <div class="form-group" style="margin-top:1rem;"><label>Сообщение обслуживания</label><input type="text" id="maint-msg" value="${escHtml(maintenance.message||'Сайт временно недоступен. Скоро вернёмся!')}" placeholder="Сообщение для пользователей"></div>
            <button id="save-maint"><i class="fas fa-save"></i> Сохранить</button>
        </div>
    </div>

    <!-- SCRIPTS -->
    <div class="tab-pane" id="tab-scripts">
        <div class="admin-section">
            <h3><i class="fas fa-code"></i> Кастомные скрипты</h3>
            <p style="color:var(--t2);font-size:13px;margin-bottom:1rem;">Скрипты выполняются у всех пользователей при загрузке сайта. Используйте осторожно!</p>
            <div class="form-group"><label>Название скрипта</label><input type="text" id="sc-name" placeholder="Название"></div>
            <div class="form-group"><label>JavaScript код</label><textarea class="script-editor" id="sc-code" placeholder="// Введите JavaScript...\nconsole.log('KNB Script');" rows="8"></textarea></div>
            <button id="add-script-btn"><i class="fas fa-plus"></i> Добавить скрипт</button>
            <div style="margin-top:1rem;"><h3 style="font-size:14px;margin-bottom:.75rem;">Активные скрипты</h3>
            ${scripts.map((s,i)=>`<div class="admin-row"><div class="admin-row-info"><strong>${escHtml(s.name)}</strong><small>${new Date(s.createdAt).toLocaleDateString('ru')} · ${s.code.length} симв.</small></div><label class="toggle-switch" style="flex-shrink:0;"><input type="checkbox" ${s.active?'checked':''} onchange="toggleScript(${i})"><span class="toggle-slider"></span></label><button onclick="deleteScript(${i})" class="secondary" style="font-size:11px;padding:4px 8px;color:var(--red);"><i class="fas fa-trash"></i></button></div>`).join('')||'<p style="color:var(--t3);font-size:13px;">Нет скриптов</p>'}
            </div>
        </div>
    </div>
    </div>`;
    centerPanel.innerHTML=html;

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
        btn.classList.add('active');
        $('tab-'+btn.dataset.tab)?.classList.add('active');
    }));

    // Maintenance toggle
    $('save-maint')?.addEventListener('click',()=>{
        const active=$('maint-toggle')?.checked;
        const message=$('maint-msg')?.value||'';
        sj(SK.MAINTENANCE,{active,message});
        alert(active?'🔴 Режим обслуживания включён':'🟢 Сайт снова доступен');
        renderAdminPanel();
        checkMaintenance();
    });
    $('maint-toggle')?.addEventListener('change',()=>{});

    // Create badge
    $('create-badge-btn')?.addEventListener('click',()=>{
        const name=$('badge-name')?.value.trim();if(!name){alert('Введите название');return;}
        const color=$('badge-color')?.value||'#3b82f6';
        const imgFile=$('badge-img')?.files[0];
        const createBadge=(imgData)=>{badges.push({id:'bdg_'+Date.now(),name,color,image:imgData||'',createdAt:new Date().toISOString()});saveBadges();if($('badge-name'))$('badge-name').value='';renderAdminPanel();$('tab-badges')?.click&&document.querySelector('[data-tab="badges"]')?.click();};
        if(imgFile){const fr=new FileReader();fr.onload=e=>createBadge(e.target.result);fr.readAsDataURL(imgFile);}else createBadge('');
    });

    // Add script
    $('add-script-btn')?.addEventListener('click',()=>{
        const name=$('sc-name')?.value.trim();const code=$('sc-code')?.value.trim();
        if(!name||!code){alert('Заполните название и код');return;}
        const scripts=gj(SK.CUSTOM_SCRIPTS,[]);
        scripts.push({id:'sc_'+Date.now(),name,code,active:true,createdAt:new Date().toISOString()});
        sj(SK.CUSTOM_SCRIPTS,scripts);
        if($('sc-name'))$('sc-name').value='';if($('sc-code'))$('sc-code').value='';
        renderAdminPanel();document.querySelector('[data-tab="scripts"]')?.click();
        // Run it immediately
        try{const fn=new Function(code);fn();}catch(e){console.warn('Script error:',e);}
    });
}

// Admin actions
window.resolveReport=function(id){const r=reports.find(r=>r.id===id);if(r){r.status='resolved';saveReports();renderAdminPanel();}};
window.approveUserVerify=function(id){const r=verificationRequests.find(r=>r.id===id);if(r){r.status='approved';const u=findUserById(r.userId);if(u){u.verified=true;addNotif(u.id,'✅ Ваш аккаунт верифицирован!');}saveUsers();saveVerifyRequests();renderAdminPanel();}};
window.rejectUserVerify=function(id){verificationRequests=verificationRequests.filter(r=>r.id!==id);saveVerifyRequests();renderAdminPanel();};
window.approveCommunityVerify=function(id){const r=communityVerifyRequests.find(r=>r.id===id);if(r){r.status='approved';const c=findCommunityById(r.communityId);if(c)c.verified=true;saveCommunities();saveCommunityVerifyRequests();renderAdminPanel();}};
window.rejectCommunityVerify=function(id){communityVerifyRequests=communityVerifyRequests.filter(r=>r.id!==id);saveCommunityVerifyRequests();renderAdminPanel();};
window.toggleUserVerify=function(id){const u=findUserById(id);if(u){u.verified=!u.verified;saveUsers();renderAdminPanel();}};
window.toggleModerator=function(id){const u=findUserById(id);if(!u)return;u.role=u.role==='moderator'?'user':'moderator';saveUsers();renderAdminPanel();};
window.liftBan=function(id){const b=bans.find(b=>b.id===id);if(b){b.lifted=true;saveBans();addNotif(b.userId,'✅ Ваш бан снят.');renderAdminPanel();}};
window.deleteBadge=function(id){if(!confirm('Удалить бейдж?'))return;badges=badges.filter(b=>b.id!==id);userBadges=userBadges.filter(ub=>ub.badgeId!==id);saveBadges();saveUserBadges();renderAdminPanel();};
window.toggleScript=function(idx){const scripts=gj(SK.CUSTOM_SCRIPTS,[]);if(scripts[idx])scripts[idx].active=!scripts[idx].active;sj(SK.CUSTOM_SCRIPTS,scripts);renderAdminPanel();document.querySelector('[data-tab="scripts"]')?.click();};
window.deleteScript=function(idx){if(!confirm('Удалить скрипт?'))return;const scripts=gj(SK.CUSTOM_SCRIPTS,[]);scripts.splice(idx,1);sj(SK.CUSTOM_SCRIPTS,scripts);renderAdminPanel();document.querySelector('[data-tab="scripts"]')?.click();};
window.adminReplyTicket=function(id){const text=prompt('Ответ поддержки:');if(!text?.trim())return;const t=supportTickets.find(t=>t.id===id);if(t){if(!t.replies)t.replies=[];t.replies.push({text:text.trim(),userId:currentUser.id,isAdmin:true,timestamp:new Date().toISOString()});t.status='pending';saveSupportTickets();addNotif(t.userId,`💬 Поддержка ответила на ваш тикет "${t.subject}"`);renderAdminPanel();}};
window.closeTicket=function(id){const t=supportTickets.find(t=>t.id===id);if(t){t.status='closed';saveSupportTickets();renderAdminPanel();}};

// Assign badge
window.openAssignBadge=function(badgeId){
    const sel=$('assign-badge-user');
    if(sel){sel.innerHTML='<option value="all">Всем пользователям</option>';users.forEach(u=>sel.innerHTML+=`<option value="${u.id}">${escHtml(u.name)}</option>`);}
    const bl=$('assign-badge-list');
    const badge=badges.find(b=>b.id===badgeId);
    if(bl&&badge)bl.innerHTML=`<div class="badge-item-admin" style="margin-bottom:1rem;">${badge.image?`<img src="${badge.image}">`:''}  <span style="color:${badge.color};">${escHtml(badge.name)}</span></div>`;
    if($('assign-badge-id'))$('assign-badge-id').value=badgeId;
    $('assign-badge-modal')?.classList.add('active');
};
window.openAssignBadgeFor=function(userId){
    if(!badges.length){alert('Нет бейджей. Сначала создайте бейдж.');return;}
    const sel=$('assign-badge-user');
    if(sel){sel.innerHTML='<option value="all">Всем пользователям</option>';users.forEach(u=>sel.innerHTML+=`<option value="${u.id}" ${u.id===userId?'selected':''}>${escHtml(u.name)}</option>`);}
    const bl=$('assign-badge-list');
    if(bl)bl.innerHTML=badges.map(b=>`<label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg2);border-radius:8px;margin-bottom:4px;cursor:pointer;"><input type="radio" name="assign-badge-radio" value="${b.id}"> ${b.image?`<img src="${b.image}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">`:''}  <span style="color:${b.color};">${escHtml(b.name)}</span></label>`).join('');
    $('assign-badge-modal')?.classList.add('active');
    const existingId=$('assign-badge-id');if(existingId)existingId.value='';
};
$('confirm-assign-badge')?.addEventListener('click',()=>{
    let badgeId=$('assign-badge-id')?.value;
    if(!badgeId){badgeId=document.querySelector('[name="assign-badge-radio"]:checked')?.value;}
    if(!badgeId){alert('Выберите бейдж');return;}
    const targetUser=$('assign-badge-user')?.value;
    const targets=targetUser==='all'?users.map(u=>u.id):[targetUser];
    targets.forEach(uid=>{if(!userBadges.some(ub=>ub.userId===uid&&ub.badgeId===badgeId)){userBadges.push({userId:uid,badgeId,grantedAt:new Date().toISOString()});const badge=badges.find(b=>b.id===badgeId);if(badge)addNotif(uid,`🏅 Вам выдан бейдж "${badge.name}"!`);}});
    saveUserBadges();$('assign-badge-modal')?.classList.remove('active');
    alert(targetUser==='all'?`✅ Бейдж выдан всем ${targets.length} пользователям`:'✅ Бейдж выдан!');
    renderAdminPanel();
});

// ===== AUTH =====
function showAuthModal(type){
    authModal?.classList.add('active');
    $('login-form').style.display=type==='login'?'block':'none';
    $('register-form').style.display=type==='register'?'block':'none';
    $('setup-profile').style.display='none';
    if(type==='login')setTimeout(()=>$('login-identifier')?.focus(),100);
    else setTimeout(()=>$('reg-email')?.focus(),100);
}
$('show-register')?.addEventListener('click',e=>{e.preventDefault();showAuthModal('register');});
$('show-login')?.addEventListener('click',e=>{e.preventDefault();showAuthModal('login');});

let tempEmail='',tempCode='';
$('send-code-btn')?.addEventListener('click',()=>{
    const email=$('reg-email')?.value.trim();
    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showInputError('reg-email','Введите корректный email');return;}
    if(users.find(u=>u.email===email)){showInputError('reg-email','Этот email уже используется');return;}
    tempEmail=email;tempCode=Math.floor(100000+Math.random()*900000).toString();
    $('code-verification').style.display='block';
    const btn=$('send-code-btn');if(btn){btn.textContent='Отправить снова';btn.style.background='var(--bg2)';btn.style.color='var(--t1)';}
    $('reg-code')?.focus();
    alert(`📧 Ваш код подтверждения: ${tempCode}`);
});
$('verify-code-btn')?.addEventListener('click',()=>{
    if($('reg-code')?.value.trim()===tempCode){$('register-form').style.display='none';$('setup-profile').style.display='block';setTimeout(()=>$('setup-name')?.focus(),100);}
    else showInputError('reg-code','Неверный код');
});
$('reg-code')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('verify-code-btn')?.click();});
$('setup-avatar')?.addEventListener('change',e=>{
    const file=e.target.files[0];if(!file)return;
    const fr=new FileReader();fr.onload=ev=>{const prev=$('avatar-preview');if(prev)prev.innerHTML=`<img src="${ev.target.result}">`;};fr.readAsDataURL(file);
});
$('complete-registration')?.addEventListener('click',()=>{
    const name=$('setup-name')?.value.trim();
    const uname=$('setup-username')?.value.trim().replace(/^@/,'');
    const pass=$('setup-password')?.value;
    if(!name){showInputError('setup-name','Введите имя');return;}
    if(!uname){showInputError('setup-username','Введите username');return;}
    if(!pass||pass.length<6){showInputError('setup-password','Минимум 6 символов');return;}
    if(users.find(u=>u.username==='@'+uname)){showInputError('setup-username','Username занят');return;}
    const newUser={id:'u_'+Date.now(),email:tempEmail,password:pass,name,username:'@'+uname,bio:$('setup-bio')?.value.trim()||'',avatar:'',banner:'',verified:false,theme:'dark',role:'user',friends:[],createdAt:new Date().toISOString()};
    const reads=[];
    const a=$('setup-avatar')?.files[0];const b=$('setup-banner')?.files[0];
    if(a)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{newUser.avatar=e.target.result;r();};fr.readAsDataURL(a);}));
    if(b)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{newUser.banner=e.target.result;r();};fr.readAsDataURL(b);}));
    Promise.all(reads).then(()=>{users.push(newUser);saveUsers();currentUser=newUser;saveCurrentUser();authModal?.classList.remove('active');addNotif(newUser.id,`👋 Добро пожаловать в KNB, ${newUser.name}!`);render();});
});
$('login-btn')?.addEventListener('click',doLogin);
$('login-password')?.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
$('login-identifier')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('login-password')?.focus();});
function doLogin(){
    const id=$('login-identifier')?.value.trim();const pass=$('login-password')?.value;
    if(!id||!pass){alert('Заполните все поля');return;}
    const uname=id.startsWith('@')?id:'@'+id;
    const user=users.find(u=>u.email===id)||users.find(u=>u.username===uname)||users.find(u=>u.username===id);
    if(user&&user.password===pass){currentUser=user;saveCurrentUser();authModal?.classList.remove('active');applyTheme(currentUser.theme);render();}
    else showInputError('login-password','Неверный email/username или пароль');
}
function showInputError(id,msg){const el=document.getElementById(id);if(!el){alert(msg);return;}el.style.borderColor='var(--red)';el.style.boxShadow='0 0 0 3px rgba(239,68,68,.15)';const old=el.parentElement.querySelector('.ferr');if(old)old.remove();const err=document.createElement('div');err.className='ferr';err.style.cssText='color:var(--red);font-size:11px;margin-top:4px;';err.textContent=msg;el.parentElement.appendChild(err);el.addEventListener('input',()=>{el.style.borderColor='';el.style.boxShadow='';err.remove();},{once:true});el.focus();}

// ===== NAV =====
document.querySelectorAll('.nav-item').forEach(item=>item.addEventListener('click',()=>{const page=item.dataset.page;if(!page)return;if(page==='admin'&&!isOwner(currentUser))return;setPage(page);}));
function setPage(page){currentPage=page;currentChatId=null;render();if(window.innerWidth<=768){leftPanel?.classList.remove('open');rightPanel?.classList.remove('open');}window.scrollTo({top:0,behavior:'smooth'});}
window.setPage=setPage;
function toggleTheme(){document.documentElement.classList.toggle('light-theme');if(currentUser){currentUser.theme=document.documentElement.classList.contains('light-theme')?'light':'dark';saveUsers();}}

// ===== SEARCH =====
const searchInput=$('search-input');const searchResults=$('search-results');
searchInput?.addEventListener('input',e=>{
    const q=e.target.value.trim().toLowerCase();
    if(q.length<2){searchResults?.classList.remove('visible');return;}
    const res=users.filter(u=>u.name.toLowerCase().includes(q)||u.username.toLowerCase().includes(q)).slice(0,5);
    if(!res.length){searchResults?.classList.remove('visible');return;}
    if(searchResults){searchResults.innerHTML=res.map(u=>`<div class="search-result-item" onclick="viewProfile('${u.id}');$('search-input').value='';searchResults.classList.remove('visible');"><img src="${av(u,36)}" class="avatar" style="width:36px;height:36px;"><div><div style="font-weight:600;font-size:13px;">${escHtml(u.name)} ${u.verified?'<i class="fas fa-check-circle verified-badge" style="font-size:10px;"></i>':''}</div><div style="color:var(--t3);font-size:11px;">${escHtml(u.username)}</div></div></div>`).join('');searchResults.classList.add('visible');}
});
document.addEventListener('click',e=>{if(!searchInput?.contains(e.target))searchResults?.classList.remove('visible');});

// ===== MODALS CLOSE =====
document.querySelectorAll('.modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('active');}));

// ===== POST =====
const postText=$('post-text');const charCount=$('char-count');
postText?.addEventListener('input',()=>{const l=postText.value.length;if(charCount){charCount.textContent=l;charCount.style.color=l>450?'var(--red)':'';}showMediaPreview();});
['post-image','post-video','post-audio'].forEach(id=>document.getElementById(id)?.addEventListener('change',showMediaPreview));
function showMediaPreview(){const prev=$('post-media-previews');if(!prev)return;prev.innerHTML='';const f=document.getElementById('post-image')?.files[0]||document.getElementById('post-video')?.files[0]||document.getElementById('post-audio')?.files[0];if(!f)return;const fr=new FileReader();fr.onload=e=>{if(f.type.startsWith('image/'))prev.innerHTML=`<img src="${e.target.result}" style="max-height:120px;border-radius:8px;">`;else if(f.type.startsWith('video/'))prev.innerHTML=`<video src="${e.target.result}" style="max-height:120px;border-radius:8px;"></video>`;else prev.innerHTML=`<div style="padding:8px;background:var(--bg2);border-radius:8px;font-size:12px;"><i class="fas fa-music"></i> ${f.name}</div>`;};fr.readAsDataURL(f);}
$('publish-post')?.addEventListener('click',()=>{
    const text=postText?.value.trim();
    if(text&&text.length>500){alert('Пост не может быть длиннее 500 символов');return;}
    const f=document.getElementById('post-image')?.files[0]||document.getElementById('post-video')?.files[0]||document.getElementById('post-audio')?.files[0];
    if(!text&&!f){alert('Добавьте текст или медиа');return;}
    const post={id:'p_'+Date.now(),authorId:currentUser.id,text:text||'',media:null,likes:[],comments:[],reposts:0,timestamp:new Date().toISOString()};
    if(f){const fr=new FileReader();fr.onload=e=>{post.media={url:e.target.result,type:f.type};posts.push(post);savePosts();postModal?.classList.remove('active');if(postText)postText.value='';['post-image','post-video','post-audio'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});checkAchievements();renderFeed();};fr.readAsDataURL(f);}
    else{posts.push(post);savePosts();postModal?.classList.remove('active');if(postText)postText.value='';checkAchievements();renderFeed();}
});

// ===== COMMENTS =====
function openCommentsModal(post,type){
    const list=$('comments-list');
    if(list)list.innerHTML=post.comments?.length?post.comments.map(c=>{const u=findUserById(c.userId);return u?`<div class="comment"><img src="${av(u,28)}" class="comment-avatar"><div><span class="comment-author">${escHtml(u.name)}</span> ${escHtml(c.text)}</div></div>`:''}).join(''):'<p style="color:var(--t3);text-align:center;padding:1rem;">Нет комментариев</p>';
    commentsModal?.classList.add('active');
    $('add-comment').onclick=()=>{const text=$('new-comment')?.value.trim();if(!text)return;if(!post.comments)post.comments=[];post.comments.push({userId:currentUser.id,text,timestamp:new Date().toISOString()});if(type==='user'&&post.authorId!==currentUser.id)addNotif(post.authorId,`💬 ${currentUser.name} прокомментировал ваш пост.`);type==='user'?savePosts():saveCommunityPosts();if($('new-comment'))$('new-comment').value='';openCommentsModal(post,type);};
    $('new-comment')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('add-comment')?.click();},{once:true});
}

// ===== POLL =====
$('create-poll')?.addEventListener('click',createPoll);

// ===== VERIFY =====
$('send-verify-request')?.addEventListener('click',()=>{if(!currentUser)return;if(verificationRequests.some(r=>r.userId===currentUser.id&&r.status==='pending')){alert('Заявка уже отправлена');return;}verificationRequests.push({id:'vr_'+Date.now(),userId:currentUser.id,status:'pending',timestamp:new Date().toISOString()});saveVerifyRequests();$('verify-modal')?.classList.remove('active');alert('✅ Заявка отправлена');});

// ===== CREATE COMMUNITY =====
$('create-community')?.addEventListener('click',()=>{
    const name=$('community-name')?.value.trim();if(!name){alert('Введите название');return;}
    const comm={id:'c_'+Date.now(),name,description:$('community-description')?.value.trim()||'',category:$('community-category')?.value||'general',avatar:'',banner:'',verified:false,createdBy:currentUser.id,createdAt:new Date().toISOString()};
    const a=$('community-avatar')?.files[0];const b=$('community-banner')?.files[0];
    const reads=[];
    if(a)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{comm.avatar=e.target.result;r();};fr.readAsDataURL(a);}));
    if(b)reads.push(new Promise(r=>{const fr=new FileReader();fr.onload=e=>{comm.banner=e.target.result;r();};fr.readAsDataURL(b);}));
    Promise.all(reads).then(()=>{communities.push(comm);communityMembers.push({communityId:comm.id,userId:currentUser.id,joinedAt:new Date().toISOString()});communityChats.push({id:'cc_'+Date.now(),communityId:comm.id,name:comm.name+' — чат',members:[currentUser.id]});saveCommunities();saveCommunityMembers();saveCommunityChats();if($('community-name'))$('community-name').value='';if($('community-description'))$('community-description').value='';$('create-community-modal')?.classList.remove('active');checkAchievements();renderCommunities();});
});

// ===== WEBRTC =====
let localStream=null,peerConnection=null,currentCall=null;
window.startCall=async function(chatId,type){
    if(!currentUser)return;
    const otherId=chatId.startsWith('chat_')?chatId.replace('chat_','').split('_').find(p=>p!==currentUser.id):null;
    const other=otherId?findUserById(otherId):null;
    if(!other){alert('Не удалось найти собеседника');return;}
    try{localStream=await navigator.mediaDevices.getUserMedia({video:type==='video',audio:true});const lv=$('local-video');if(lv)lv.srcObject=localStream;$('call-name').innerText=other.name;const ca=$('call-avatar');if(ca)ca.style.backgroundImage=`url(${av(other,100)})`;$('call-status').innerText='Соединение...';$('call-modal')?.classList.add('active');}catch(e){alert('Нет доступа к камере/микрофону');}
};
window.endCall=function(){localStream?.getTracks().forEach(t=>t.stop());localStream=null;peerConnection?.close();peerConnection=null;$('call-modal')?.classList.remove('active');};

// ===== VOICE =====
let mediaRecorder=null,audioChunks=[];
async function startVoiceRecording(){
    if(mediaRecorder&&mediaRecorder.state==='recording'){mediaRecorder.stop();const btn=$('vrb');if(btn){btn.style.color='';btn.innerHTML='<i class="fas fa-microphone"></i>';}return;}
    try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});mediaRecorder=new MediaRecorder(stream);audioChunks=[];mediaRecorder.ondataavailable=e=>audioChunks.push(e.data);mediaRecorder.onstop=()=>{const blob=new Blob(audioChunks,{type:'audio/webm'});const fr=new FileReader();fr.onload=()=>{messages.push({id:'m_'+Date.now(),chatId:currentChatId,senderId:currentUser.id,text:'🎤 Голосовое',audio:fr.result,timestamp:new Date().toISOString()});saveMessages();renderChat(currentChatId);};fr.readAsDataURL(blob);stream.getTracks().forEach(t=>t.stop());};mediaRecorder.start();const btn=$('vrb');if(btn){btn.style.color='var(--red)';btn.innerHTML='<i class="fas fa-stop"></i>';}}catch(e){alert('Нет доступа к микрофону');}
}

// ===== STORAGE SYNC =====
window.addEventListener('storage',e=>{if(!e.key)return;if([SK.MESSAGES,SK.TYPING].includes(e.key)){loadData();if(currentChatId)renderChat(currentChatId);}if(SK.NOTIFICATIONS===e.key){loadData();updateNotifBadge();renderRightPanel();}if(SK.MAINTENANCE===e.key)checkMaintenance();});

// ===== CHAT REFRESH =====
setInterval(()=>{if(currentChatId){loadData();renderChat(currentChatId);}},4000);
setInterval(()=>{if(currentUser){checkAchievements();updateNotifBadge();}},10000);

// ===== BOOT =====
loadData();
loadCustomScripts();
render();

window.saveCurrentUser=saveCurrentUser;
})();