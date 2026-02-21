const express = require('express');
const { WebSocketServer, WebSocket } = require('ws');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'knb_dev_secret_2024';
const OWNER_EMAIL = process.env.OWNER_EMAIL || 'foxi@knb.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'admin005';
const DB_FILE = path.join(__dirname, 'data', 'db.json');

// ── DB ──────────────────────────────────────────────
const EMPTY = {
  users: [], posts: [], commPosts: [], communities: [],
  commMembers: [], friendships: [], messages: [], groups: [],
  verReqs: [], bans: [], notifications: []
};

let DB = { ...EMPTY };

async function loadDB() {
  try {
    await fs.ensureDir(path.dirname(DB_FILE));
    if (await fs.pathExists(DB_FILE)) DB = await fs.readJson(DB_FILE);
    else await fs.writeJson(DB_FILE, DB, { spaces: 2 });
  } catch (e) { console.error('DB load:', e.message); }
}
async function saveDB() {
  try { await fs.writeJson(DB_FILE, DB, { spaces: 2 }); }
  catch (e) { console.error('DB save:', e.message); }
}

// ── MIDDLEWARE ───────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

function auth(req, res, next) {
  const t = (req.headers.authorization || '').split(' ')[1];
  if (!t) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Bad token' }); }
}
function adminOnly(req, res, next) {
  const u = DB.users.find(x => x.id === req.user.id);
  if (!u || u.email !== OWNER_EMAIL) return res.status(403).json({ error: 'Admin only' });
  next();
}
function fu(id) { return DB.users.find(u => u.id === id); }
function isBanned(uid) { return DB.bans.some(b => b.uid === uid); }
function addNotif(uid, text) {
  DB.notifications.push({ id: 'n_' + uuid(), uid, text, read: false, ts: new Date().toISOString() });
}

// ── WEBSOCKET ────────────────────────────────────────
const clients = new Map(); // uid -> Set<ws>

function sendTo(uid, data) {
  const socks = clients.get(uid);
  if (!socks) return;
  const msg = JSON.stringify(data);
  socks.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
}

wss.on('connection', ws => {
  ws.uid = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }

    if (m.type === 'auth') {
      try {
        const d = jwt.verify(m.token, JWT_SECRET);
        ws.uid = d.id;
        if (!clients.has(ws.uid)) clients.set(ws.uid, new Set());
        clients.get(ws.uid).add(ws);
        ws.send(JSON.stringify({ type: 'authed' }));
      } catch { ws.send(JSON.stringify({ type: 'auth_error' })); }
      return;
    }
    if (!ws.uid) return;

    // WebRTC signaling
    if (m.type === 'call_offer') {
      const caller = fu(ws.uid);
      sendTo(m.to, { type: 'call_incoming', from: ws.uid, callerName: caller && caller.name, callerAva: caller && caller.avatar, offer: m.offer, callType: m.callType });
    }
    if (m.type === 'call_answer') sendTo(m.to, { type: 'call_answer', answer: m.answer, from: ws.uid });
    if (m.type === 'call_ice')    sendTo(m.to, { type: 'call_ice', candidate: m.candidate, from: ws.uid });
    if (m.type === 'call_reject') sendTo(m.to, { type: 'call_rejected', from: ws.uid });
    if (m.type === 'call_end')    sendTo(m.to, { type: 'call_ended', from: ws.uid });

    // Typing
    if (m.type === 'typing') {
      const u = fu(ws.uid);
      chatMembers(m.chatId, ws.uid).forEach(uid => sendTo(uid, { type: 'typing', chatId: m.chatId, name: u && u.name }));
    }
  });
  ws.on('close', () => {
    if (ws.uid && clients.has(ws.uid)) {
      clients.get(ws.uid).delete(ws);
      if (!clients.get(ws.uid).size) clients.delete(ws.uid);
    }
  });
});

function chatMembers(chatId, excludeId) {
  if (chatId.startsWith('g_')) {
    const g = DB.groups.find(x => x.id === chatId);
    return (g ? g.members : []).filter(id => id !== excludeId);
  }
  if (chatId.startsWith('cc_')) {
    return DB.commMembers.filter(m => m.cid === chatId.replace('cc_', '')).map(m => m.uid).filter(id => id !== excludeId);
  }
  return chatId.replace(/^chat_/, '').split('_').filter(id => id !== excludeId && fu(id));
}

// ── AUTH ROUTES ──────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, username, bio, avatar } = req.body;
    if (!email || !password || !name || !username) return res.status(400).json({ error: 'Заполните все поля' });
    if (DB.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email уже занят' });
    const uname = username.startsWith('@') ? username : '@' + username;
    if (DB.users.find(u => u.username === uname)) return res.status(400).json({ error: 'Username занят' });
    const hash = await bcrypt.hash(password, 10);
    const user = { id: 'u_' + uuid(), email, password: hash, name, username: uname, bio: bio || '', avatar: avatar || '', banner: '', verified: false, friends: [], createdAt: new Date().toISOString() };
    DB.users.push(user);
    await saveDB();
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { id: loginId, password } = req.body;
    const user = DB.users.find(u => u.email === loginId) || DB.users.find(u => u.username === (loginId.startsWith('@') ? loginId : '@' + loginId));
    if (!user) return res.status(401).json({ error: 'Пользователь не найден' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Неверный пароль' });
    if (isBanned(user.id)) return res.status(403).json({ error: 'Аккаунт заблокирован' });
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
    const { password: _, ...safe } = user;
    res.json({ token, user: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── USERS ────────────────────────────────────────────
app.get('/api/users', auth, (req, res) => res.json(DB.users.map(({ password, ...u }) => u)));

app.put('/api/users/:id', auth, async (req, res) => {
  if (req.user.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const user = fu(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { name, username, bio, avatar, banner, password } = req.body;
  if (name) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = avatar;
  if (banner) user.banner = banner;
  if (username) {
    const uname = username.startsWith('@') ? username : '@' + username;
    if (DB.users.some(u => u.username === uname && u.id !== user.id)) return res.status(400).json({ error: 'Username занят' });
    user.username = uname;
  }
  if (password) user.password = await bcrypt.hash(password, 10);
  await saveDB();
  const { password: _, ...safe } = user;
  res.json(safe);
});

// ── POSTS ────────────────────────────────────────────
app.get('/api/posts', auth, (req, res) => {
  const posts = [...DB.posts, ...DB.commPosts].sort((a, b) => new Date(b.ts) - new Date(a.ts));
  res.json(posts);
});

app.post('/api/posts', auth, async (req, res) => {
  const { text, media, communityId } = req.body;
  if (!text && !media) return res.status(400).json({ error: 'Пустой пост' });
  const post = { id: 'p_' + uuid(), authorId: req.user.id, text: text || '', media: media || null, likes: [], comments: [], reposts: 0, ts: new Date().toISOString() };
  if (communityId) { post.communityId = communityId; DB.commPosts.push(post); }
  else DB.posts.push(post);
  await saveDB();
  // broadcast to all online users
  clients.forEach((socks, uid) => {
    if (uid !== req.user.id) sendTo(uid, { type: 'new_post', post });
  });
  res.json(post);
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  const post = [...DB.posts, ...DB.commPosts].find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (!post.likes) post.likes = [];
  const idx = post.likes.indexOf(req.user.id);
  if (idx >= 0) post.likes.splice(idx, 1);
  else {
    post.likes.push(req.user.id);
    if (post.authorId !== req.user.id) {
      const liker = fu(req.user.id);
      addNotif(post.authorId, (liker ? liker.name : '?') + ' лайкнул ваш пост');
      sendTo(post.authorId, { type: 'notification', text: (liker ? liker.name : '?') + ' лайкнул ваш пост' });
    }
  }
  await saveDB();
  res.json(post);
});

app.post('/api/posts/:id/comment', auth, async (req, res) => {
  const post = [...DB.posts, ...DB.commPosts].find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Not found' });
  if (!post.comments) post.comments = [];
  post.comments.push({ uid: req.user.id, text: req.body.text, ts: new Date().toISOString() });
  if (post.authorId !== req.user.id) {
    const u = fu(req.user.id);
    addNotif(post.authorId, (u ? u.name : '?') + ' прокомментировал ваш пост');
    sendTo(post.authorId, { type: 'notification', text: (u ? u.name : '?') + ' прокомментировал ваш пост' });
  }
  await saveDB();
  res.json(post);
});

app.delete('/api/posts/:id', auth, async (req, res) => {
  const owner = fu(req.user.id);
  const isAdmin = owner && owner.email === OWNER_EMAIL;
  const ip = DB.posts.findIndex(p => p.id === req.params.id && (p.authorId === req.user.id || isAdmin));
  const ic = DB.commPosts.findIndex(p => p.id === req.params.id && (p.authorId === req.user.id || isAdmin));
  if (ip >= 0) DB.posts.splice(ip, 1);
  else if (ic >= 0) DB.commPosts.splice(ic, 1);
  else return res.status(403).json({ error: 'Forbidden' });
  await saveDB();
  res.json({ ok: true });
});

// ── FRIENDSHIPS ──────────────────────────────────────
app.get('/api/friendships', auth, (req, res) => {
  res.json(DB.friendships.filter(f => f.from === req.user.id || f.to === req.user.id));
});

app.post('/api/friendships', auth, async (req, res) => {
  const { to } = req.body;
  if (DB.friendships.find(f => f.from === req.user.id && f.to === to)) return res.status(400).json({ error: 'Уже отправлено' });
  const f = { id: 'f_' + uuid(), from: req.user.id, to, status: 'pending', ts: new Date().toISOString() };
  DB.friendships.push(f);
  const sender = fu(req.user.id);
  addNotif(to, (sender ? sender.name : '?') + ' отправил заявку в друзья');
  sendTo(to, { type: 'friend_request', friendship: f, senderName: sender && sender.name });
  await saveDB();
  res.json(f);
});

app.put('/api/friendships/:id/accept', auth, async (req, res) => {
  const f = DB.friendships.find(x => x.id === req.params.id && x.to === req.user.id);
  if (!f) return res.status(404).json({ error: 'Not found' });
  f.status = 'accepted';
  const from = fu(f.from), to = fu(f.to);
  if (from) { if (!from.friends) from.friends = []; if (!from.friends.includes(to.id)) from.friends.push(to.id); }
  if (to)   { if (!to.friends)   to.friends = [];   if (!to.friends.includes(from.id))   to.friends.push(from.id); }
  addNotif(f.from, (to ? to.name : '?') + ' принял вашу заявку');
  sendTo(f.from, { type: 'friend_accepted', byName: to && to.name });
  await saveDB();
  res.json(f);
});

app.delete('/api/friendships/:id', auth, async (req, res) => {
  const idx = DB.friendships.findIndex(f => f.id === req.params.id && (f.from === req.user.id || f.to === req.user.id));
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const f = DB.friendships.splice(idx, 1)[0];
  const u1 = fu(f.from), u2 = fu(f.to);
  if (u1) u1.friends = (u1.friends || []).filter(id => id !== f.to);
  if (u2) u2.friends = (u2.friends || []).filter(id => id !== f.from);
  await saveDB();
  res.json({ ok: true });
});

// ── MESSAGES ─────────────────────────────────────────
app.get('/api/messages', auth, (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: 'chatId required' });
  res.json(DB.messages.filter(m => m.chatId === chatId).sort((a, b) => new Date(a.ts) - new Date(b.ts)));
});

app.post('/api/messages', auth, async (req, res) => {
  const { chatId, text, img, voice } = req.body;
  if (!chatId) return res.status(400).json({ error: 'chatId required' });
  const msg = { id: 'm_' + uuid(), chatId, senderId: req.user.id, text: text || null, img: img || null, voice: voice || null, ts: new Date().toISOString() };
  DB.messages.push(msg);
  await saveDB();
  chatMembers(chatId, req.user.id).forEach(uid => sendTo(uid, { type: 'new_message', message: msg }));
  res.json(msg);
});

app.delete('/api/messages/:id', auth, async (req, res) => {
  const idx = DB.messages.findIndex(m => m.id === req.params.id && m.senderId === req.user.id);
  if (idx < 0) return res.status(403).json({ error: 'Forbidden' });
  DB.messages.splice(idx, 1);
  await saveDB();
  res.json({ ok: true });
});

// ── COMMUNITIES ──────────────────────────────────────
app.get('/api/communities', auth, (req, res) => res.json(DB.communities));

app.post('/api/communities', auth, async (req, res) => {
  const { name, description, avatar } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const comm = { id: 'c_' + uuid(), name, description: description || '', avatar: avatar || '', banner: '', verified: false, createdBy: req.user.id, ts: new Date().toISOString() };
  DB.communities.push(comm);
  DB.commMembers.push({ uid: req.user.id, cid: comm.id, ts: new Date().toISOString() });
  await saveDB();
  res.json(comm);
});

app.get('/api/communities/:id/members', auth, (req, res) => {
  res.json(DB.commMembers.filter(m => m.cid === req.params.id));
});

app.post('/api/communities/:id/join', auth, async (req, res) => {
  if (!DB.commMembers.find(m => m.cid === req.params.id && m.uid === req.user.id))
    DB.commMembers.push({ uid: req.user.id, cid: req.params.id, ts: new Date().toISOString() });
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/communities/:id/leave', auth, async (req, res) => {
  DB.commMembers = DB.commMembers.filter(m => !(m.cid === req.params.id && m.uid === req.user.id));
  await saveDB();
  res.json({ ok: true });
});

// ── GROUPS ───────────────────────────────────────────
app.get('/api/groups', auth, (req, res) => {
  res.json(DB.groups.filter(g => (g.members || []).includes(req.user.id)));
});

app.post('/api/groups', auth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Название обязательно' });
  const g = { id: 'g_' + uuid(), name, members: [req.user.id], createdBy: req.user.id, ts: new Date().toISOString() };
  DB.groups.push(g);
  await saveDB();
  res.json(g);
});

app.post('/api/groups/:id/add', auth, async (req, res) => {
  const g = DB.groups.find(x => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'Not found' });
  if (!g.members.includes(req.body.userId)) g.members.push(req.body.userId);
  await saveDB();
  res.json(g);
});

// ── NOTIFICATIONS ────────────────────────────────────
app.get('/api/notifications', auth, (req, res) => {
  res.json(DB.notifications.filter(n => n.uid === req.user.id).sort((a, b) => new Date(b.ts) - new Date(a.ts)));
});

app.post('/api/notifications/read', auth, async (req, res) => {
  DB.notifications.filter(n => n.uid === req.user.id).forEach(n => n.read = true);
  await saveDB();
  res.json({ ok: true });
});

// ── VERIFY REQUESTS ──────────────────────────────────
app.post('/api/verify-request', auth, async (req, res) => {
  if (DB.verReqs.find(r => r.uid === req.user.id && r.status === 'pending'))
    return res.status(400).json({ error: 'Заявка уже отправлена' });
  DB.verReqs.push({ id: 'vr_' + uuid(), uid: req.user.id, status: 'pending', ts: new Date().toISOString() });
  await saveDB();
  res.json({ ok: true });
});

// ── ADMIN ─────────────────────────────────────────────
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  res.json({
    users: DB.users.length, posts: DB.posts.length + DB.commPosts.length,
    communities: DB.communities.length, messages: DB.messages.length,
    pendingVerify: DB.verReqs.filter(r => r.status === 'pending').length,
    banned: DB.bans.length, verified: DB.users.filter(u => u.verified).length
  });
});

app.get('/api/admin/verReqs', auth, adminOnly, (req, res) => res.json(DB.verReqs));

app.post('/api/admin/verReqs/:id/approve', auth, adminOnly, async (req, res) => {
  const r = DB.verReqs.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  r.status = 'approved';
  const u = fu(r.uid);
  if (u) { u.verified = true; addNotif(u.id, '🎉 Ваш аккаунт верифицирован!'); sendTo(u.id, { type: 'verified' }); }
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/admin/verReqs/:id/reject', auth, adminOnly, async (req, res) => {
  const idx = DB.verReqs.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const r = DB.verReqs.splice(idx, 1)[0];
  addNotif(r.uid, 'Заявка на верификацию отклонена.');
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/ban', auth, adminOnly, async (req, res) => {
  if (!DB.bans.find(b => b.uid === req.params.id)) DB.bans.push({ uid: req.params.id, ts: new Date().toISOString() });
  addNotif(req.params.id, '🚫 Ваш аккаунт заблокирован.');
  sendTo(req.params.id, { type: 'banned' });
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/unban', auth, adminOnly, async (req, res) => {
  DB.bans = DB.bans.filter(b => b.uid !== req.params.id);
  addNotif(req.params.id, 'Вы разблокированы.');
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/admin/users/:id/verify', auth, adminOnly, async (req, res) => {
  const u = fu(req.params.id);
  if (!u) return res.status(404).json({ error: 'Not found' });
  u.verified = !u.verified;
  if (u.verified) { addNotif(u.id, '🎉 Вы верифицированы!'); sendTo(u.id, { type: 'verified' }); }
  await saveDB();
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
  const uid = req.params.id;
  DB.users = DB.users.filter(u => u.id !== uid);
  DB.posts = DB.posts.filter(p => p.authorId !== uid);
  DB.messages = DB.messages.filter(m => m.senderId !== uid);
  DB.friendships = DB.friendships.filter(f => f.from !== uid && f.to !== uid);
  DB.bans = DB.bans.filter(b => b.uid !== uid);
  DB.users.forEach(u => { if (u.friends) u.friends = u.friends.filter(id => id !== uid); });
  await saveDB();
  res.json({ ok: true });
});

app.delete('/api/admin/posts/:id', auth, adminOnly, async (req, res) => {
  DB.posts = DB.posts.filter(p => p.id !== req.params.id);
  DB.commPosts = DB.commPosts.filter(p => p.id !== req.params.id);
  await saveDB();
  res.json({ ok: true });
});

app.post('/api/admin/communities/:id/verify', auth, adminOnly, async (req, res) => {
  const c = DB.communities.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.verified = !c.verified;
  await saveDB();
  res.json({ ok: true });
});

app.delete('/api/admin/communities/:id', auth, adminOnly, async (req, res) => {
  const cid = req.params.id;
  DB.communities = DB.communities.filter(c => c.id !== cid);
  DB.commMembers = DB.commMembers.filter(m => m.cid !== cid);
  DB.commPosts = DB.commPosts.filter(p => p.communityId !== cid);
  await saveDB();
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ── INIT OWNER & START ────────────────────────────────
async function main() {
  await loadDB();
  if (!DB.users.find(u => u.email === OWNER_EMAIL)) {
    const hash = await bcrypt.hash(OWNER_PASSWORD, 10);
    DB.users.push({ id: 'user_owner', email: OWNER_EMAIL, password: hash, name: 'Foxi005305', username: '@foxi', bio: 'Владелец KNB', avatar: '', banner: '', verified: true, friends: [], createdAt: new Date().toISOString() });
    DB.posts.push({ id: 'p_welcome', authorId: 'user_owner', text: 'Добро пожаловать в KNB! 🎉', media: null, likes: [], comments: [], reposts: 0, ts: new Date().toISOString() });
    await saveDB();
    console.log('Owner created:', OWNER_EMAIL);
  }
  server.listen(PORT, () => {
    console.log('KNB Server → http://localhost:' + PORT);
    console.log('WebSocket  → ws://localhost:' + PORT);
  });
}
main();