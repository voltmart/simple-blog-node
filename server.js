// server.js
// Мини-блог на чистом Node.js
// Запуск: node server.js
// Открывай в браузере http://localhost:3000

const http = require('http');
const url = require('url');
const qs = require('querystring');

// «База данных» — массив объектов в памяти
let posts = [
  { id: 1, title: 'Первый пост', body: 'Привет, мир!' },
  { id: 2, title: 'Второй пост', body: 'Это второй пост в нашем блоге.' }
];
let nextId = 3;

const PORT = process.env.PORT || 3000;

// Утилита для отправки HTML-ответа
function send(res, html, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// Шаблон общей обёртки
function layout(content) {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Простой блог</title>
  <style>
    body { font-family: Arial; max-width: 700px; margin: 40px auto; }
    h1 a { text-decoration: none; color: #000; }
    .post { border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 20px; }
    .post small { color: #888; }
    form textarea { width: 100%; height: 120px; }
    form input[type=text], form textarea { font-size: 1rem; padding: 6px; }
    form button { padding: 6px 14px; }
  </style>
</head>
<body>
  <h1><a href="/">Простой блог</a></h1>
  ${content}
</body>
</html>`;
}

// Главная страница — список постов
function listPage() {
  const list = posts.map(p => `
    <div class="post">
      <h3><a href="/post/${p.id}">${p.title}</a></h3>
      <p>${p.body}</p>
      <small><a href="/edit/${p.id}">править</a> |
             <a href="/delete/${p.id}">удалить</a></small>
    </div>`).join('');

  return layout(`
    <p><a href="/new">+ Новый пост</a></p>
    ${list}
  `);
}

// Страница одного поста
function postPage(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return layout('<p>Пост не найден. <a href="/">На главную</a></p>');
  return layout(`
    <h2>${post.title}</h2>
    <p>${post.body}</p>
    <p><a href="/">← к списку</a></p>
  `);
}

// Форма создания / редактирования
function formPage(id = null) {
  const post = id ? posts.find(p => p.id === id) : null;
  const action = id ? `/edit/${id}` : '/new';
  return layout(`
    <h2>${id ? 'Редактировать' : 'Новый пост'}</h2>
    <form method="post" action="${action}">
      <p><input type="text" name="title" placeholder="Заголовок"
                value="${post ? post.title : ''}" required></p>
      <p><textarea name="body" placeholder="Текст поста" required>${
        post ? post.body : ''
      }</textarea></p>
      <p><button>Сохранить</button></p>
    </form>
  `);
}

// Удаление
function deletePost(id, res) {
  posts = posts.filter(p => p.id !== id);
  res.writeHead(302, { Location: '/' }).end();
}

// Обработка POST-данных
function collectBody(req, cb) {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => cb(qs.parse(data)));
}

// Роутинг
const server = http.createServer((req, res) => {
  const { pathname } = url.parse(req.url, true);
  const id = Number(pathname.split('/')[2]);

  if (req.method === 'GET') {
    if (pathname === '/')               return send(res, listPage());
    if (pathname === '/new')            return send(res, formPage());
    if (pathname.startsWith('/post/'))  return send(res, postPage(id));
    if (pathname.startsWith('/edit/'))  return send(res, formPage(id));
    if (pathname.startsWith('/delete/')) return deletePost(id, res);
  }

  if (req.method === 'POST') {
    if (pathname === '/new') {
      return collectBody(req, data => {
        posts.push({ id: nextId++, title: data.title, body: data.body });
        res.writeHead(302, { Location: '/' }).end();
      });
    }
    if (pathname.startsWith('/edit/')) {
      return collectBody(req, data => {
        const p = posts.find(p => p.id === id);
        if (p) { p.title = data.title; p.body = data.body; }
        res.writeHead(302, { Location: '/' }).end();
      });
    }
  }

  send(res, layout('<h2>404</h2><p>Страница не найдена.</p>'), 404);
});

server.listen(PORT, () =>
  console.log(`Сервер запущен → http://localhost:${PORT}`));
