const express = require('express');
const session = require('express-session');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, 'public');
const viewsDirectory = path.join(__dirname, 'views');
const databasePath = process.env.DB_PATH || path.join(__dirname, 'data', 'findit.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    found_location TEXT NOT NULL,
    storage_location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '보관 중'
      CHECK (status IN ('보관 중', '반환 완료')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'find-it-development-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
}));

function isAdmin(request) {
  return request.session.isAdmin === true;
}

function requireAdmin(request, response, next) {
  if (!isAdmin(request)) {
    return response.status(401).json({ error: '관리자 로그인이 필요합니다.' });
  }
  next();
}

function validateItem(body, includeStatus) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: '물건 정보를 입력해 주세요.' };
  }

  const item = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    found_location: typeof body.found_location === 'string' ? body.found_location.trim() : '',
    storage_location: typeof body.storage_location === 'string' ? body.storage_location.trim() : ''
  };

  if (!item.name || !item.found_location || !item.storage_location) {
    return { error: '물건 이름, 발견 장소, 보관 장소를 모두 입력해 주세요.' };
  }

  if (item.name.length > 100 || item.found_location.length > 100 || item.storage_location.length > 100) {
    return { error: '각 항목은 100자 이내로 입력해 주세요.' };
  }

  if (includeStatus) {
    if (body.status !== '보관 중' && body.status !== '반환 완료') {
      return { error: '반환 상태를 올바르게 선택해 주세요.' };
    }
    item.status = body.status;
  }

  return { item };
}

function getItemId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

app.get('/admin/login', (request, response) => {
  response.sendFile(path.join(viewsDirectory, 'admin-login.html'));
});

app.get('/admin', (request, response) => {
  if (!isAdmin(request)) {
    return response.redirect('/admin/login');
  }
  response.sendFile(path.join(viewsDirectory, 'admin.html'));
});

app.use(express.static(publicDirectory, { index: 'index.html' }));

app.get('/api/items', (request, response) => {
  const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
  const items = search
    ? database.prepare(`
        SELECT id, name, found_location, storage_location, status, created_at, updated_at
        FROM items
        WHERE name LIKE ?
        ORDER BY id DESC
      `).all(`%${search}%`)
    : database.prepare(`
        SELECT id, name, found_location, storage_location, status, created_at, updated_at
        FROM items
        ORDER BY id DESC
      `).all();
  response.json(items);
});

app.post('/api/items', (request, response) => {
  const result = validateItem(request.body, false);
  if (result.error) {
    return response.status(400).json({ error: result.error });
  }

  const insert = database.prepare(`
    INSERT INTO items (name, found_location, storage_location)
    VALUES (?, ?, ?)
  `);
  const inserted = insert.run(
    result.item.name,
    result.item.found_location,
    result.item.storage_location
  );
  const item = database.prepare('SELECT * FROM items WHERE id = ?').get(inserted.lastInsertRowid);
  response.status(201).json(item);
});

app.put('/api/items/:id', (request, response) => {
  if (Object.prototype.hasOwnProperty.call(request.body || {}, 'status')) {
    return response.status(403).json({ error: '반환 상태는 관리자만 변경할 수 있습니다.' });
  }

  const id = getItemId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: '올바르지 않은 물건 번호입니다.' });
  }

  const result = validateItem(request.body, false);
  if (result.error) {
    return response.status(400).json({ error: result.error });
  }

  const update = database.prepare(`
    UPDATE items
    SET name = ?, found_location = ?, storage_location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const updated = update.run(
    result.item.name,
    result.item.found_location,
    result.item.storage_location,
    id
  );
  if (updated.changes === 0) {
    return response.status(404).json({ error: '분실물을 찾을 수 없습니다.' });
  }

  response.json(database.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

app.post('/api/admin/login', (request, response, next) => {
  const password = typeof request.body?.password === 'string' ? request.body.password : '';
  if (!process.env.ADMIN_PASSWORD) {
    return response.status(500).json({ error: '서버의 ADMIN_PASSWORD 설정이 필요합니다.' });
  }
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return response.status(401).json({ error: '관리자 비밀번호가 올바르지 않습니다.' });
  }

  request.session.regenerate((error) => {
    if (error) {
      return next(error);
    }
    request.session.isAdmin = true;
    response.json({ message: '관리자 로그인에 성공했습니다.' });
  });
});

app.post('/api/admin/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    response.clearCookie('connect.sid');
    response.json({ message: '로그아웃했습니다.' });
  });
});

app.put('/api/admin/items/:id', requireAdmin, (request, response) => {
  const id = getItemId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: '올바르지 않은 물건 번호입니다.' });
  }

  const result = validateItem(request.body, true);
  if (result.error) {
    return response.status(400).json({ error: result.error });
  }

  const update = database.prepare(`
    UPDATE items
    SET name = ?, found_location = ?, storage_location = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const updated = update.run(
    result.item.name,
    result.item.found_location,
    result.item.storage_location,
    result.item.status,
    id
  );
  if (updated.changes === 0) {
    return response.status(404).json({ error: '분실물을 찾을 수 없습니다.' });
  }

  response.json(database.prepare('SELECT * FROM items WHERE id = ?').get(id));
});

app.delete('/api/admin/items/:id', requireAdmin, (request, response) => {
  const id = getItemId(request.params.id);
  if (!id) {
    return response.status(400).json({ error: '올바르지 않은 물건 번호입니다.' });
  }

  const deleted = database.prepare('DELETE FROM items WHERE id = ?').run(id);
  if (deleted.changes === 0) {
    return response.status(404).json({ error: '분실물을 찾을 수 없습니다.' });
  }
  response.status(204).end();
});

app.use((error, request, response, next) => {
  console.error(error);
  if (response.headersSent) {
    return next(error);
  }
  const status = error.status || 500;
  response.status(status).json({
    error: status === 500 ? '서버 오류가 발생했습니다.' : error.message
  });
});

app.listen(port, () => {
  console.log(`찾아줘 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
