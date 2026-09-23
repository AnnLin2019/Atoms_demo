import type { ProjectFile } from './types'

export interface TemplatePart {
  /** body 内层标记,支持 {{name}} 占位符 */
  html: string
  css: string
  js: string
}

export interface AppTemplate {
  id: string
  name: string
  category: string
  emoji: string
  defaultAccent: string
  keywords: string[]
  description: string
  audience: string
  features: string[]
  stack: string[]
  components: string[]
  part: TemplatePart
}

/* ------------------------------------------------------------------ */
/* 颜色工具                                                            */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function mixHex(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  const r = c(r1, r2)
  const g = c(g1, g2)
  const bl = c(b1, b2)
  return '#' + [r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

export function themeVars(accent: string): string {
  return [
    `--accent:${accent};`,
    `--accent-2:${mixHex(accent, '#ffffff', 0.22)};`,
    `--accent-soft:${alpha(accent, 0.14)};`,
    `--accent-soft-2:${alpha(accent, 0.08)};`,
  ].join('')
}

export const PALETTE = [
  { name: '紫罗兰', hex: '#7c5cff' },
  { name: '海洋蓝', hex: '#3b82f6' },
  { name: '青蓝', hex: '#06b6d4' },
  { name: '翡翠绿', hex: '#10b981' },
  { name: '日落橙', hex: '#f97316' },
  { name: '玫瑰粉', hex: '#ec4899' },
  { name: '烈焰红', hex: '#ef4444' },
  { name: '石墨', hex: '#64748b' },
]

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  })
}

/* 生成应用内部使用的安全存储(iframe srcdoc 环境下 localStorage 可能被禁用) */
const JS_PRE =
  "var store=(function(){var s;try{s=window.localStorage;s.setItem('__t','1');s.removeItem('__t')}catch(e){var m={};s={getItem:function(k){return m[k]||null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]}}}return{get:function(k,d){var v=s.getItem(k);return v==null?d:v},set:function(k,v){s.setItem(k,v)},del:function(k){s.removeItem(k)}}})();"

/* ------------------------------------------------------------------ */
/* 组装                                                                */
/* ------------------------------------------------------------------ */

export function assemble(part: TemplatePart, appName: string, accent: string): string {
  const name = escapeHtml(appName)
  const html = part.html.replace(/\{\{name\}\}/g, name)
  return [
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">',
    '<title>' + name + '</title>',
    '<style>' + part.css + '</style>',
    '<style>:root{' + themeVars(accent) + '}</style>',
    '</head><body>',
    html,
    '<script>' + JS_PRE + part.js + '</' + 'script>',
    '</body></html>',
  ].join('\n')
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app'
}

export function buildFilesFromPart(
  part: TemplatePart,
  appName: string,
  accent: string,
  description: string,
  features: string[],
): ProjectFile[] {
  const name = escapeHtml(appName)
  const body = part.html.replace(/\{\{name\}\}/g, name)
  const index = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <title>' + name + '</title>',
    '  <link rel="stylesheet" href="./styles.css">',
    '</head>',
    '<body>',
    body,
    '  <script src="./app.js"></script>',
    '</body>',
    '</html>',
  ].join('\n')

  const pkg = JSON.stringify(
    {
      name: slug(appName),
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
      devDependencies: { vite: '^5.4.8', '@vitejs/plugin-react': '^4.3.1' },
    },
    null,
    2,
  )

  const readme = [
    '# ' + appName,
    '',
    description || '一款自动生成的应用。',
    '',
    '## 功能特性',
    ...(features.length ? features : ['核心功能实现']).map((f) => '- ' + f),
    '',
    '## 启动',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
  ].join('\n')

  return [
    { path: 'index.html', language: 'html', content: index },
    { path: 'styles.css', language: 'css', content: part.css + '\n\n/* 主题变量 */\n:root{' + themeVars(accent) + '}\n' },
    { path: 'app.js', language: 'javascript', content: JS_PRE + '\n' + part.js },
    { path: 'package.json', language: 'json', content: pkg },
    { path: 'README.md', language: 'markdown', content: readme },
  ]
}

export function buildFiles(t: AppTemplate, appName: string, accent: string): ProjectFile[] {
  return buildFilesFromPart(t.part, appName, accent, t.description, t.features)
}

export function matchTemplate(idea: string): AppTemplate {
  return matchIdea(idea).template
}

/** 返回匹配到的模板与「是否真正命中」标记;matched=false 表示落到了通用占位模板 */
export function matchIdea(idea: string): { template: AppTemplate; matched: boolean } {
  const text = idea.toLowerCase()
  let best: AppTemplate | null = null
  let bestScore = 0
  for (const t of TEMPLATES) {
    if (t.id === 'generic') continue
    let score = 0
    for (const k of t.keywords) if (text.includes(k.toLowerCase())) score++
    if (score > bestScore) {
      bestScore = score
      best = t
    }
  }
  const generic = TEMPLATES.find((t) => t.id === 'generic')!
  return best ? { template: best, matched: true } : { template: generic, matched: false }
}

/* ================================================================== */
/* 模板库                                                              */
/* ================================================================== */

const T = (id: string, def: Omit<AppTemplate, 'id'>): AppTemplate => ({ id, ...def })

const todo: AppTemplate = T('todo', {
  name: '待办清单',
  category: '效率工具',
  emoji: '✅',
  defaultAccent: '#7c5cff',
  keywords: ['待办', '任务', '清单', 'todo', '任务管理', '记录', '提醒', '计划', '每日', '日程'],
  description: '一款极简高效的待办清单应用,支持添加、完成、筛选与删除任务。',
  audience: '需要管理日常任务的个人、学生与职场人士',
  features: ['快速添加待办事项', '完成/取消完成任务', '全部/进行中/已完成筛选', '清除已完成任务', '本地持久化存储'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['TaskList 任务列表', 'TaskItem 任务项', 'FilterTabs 筛选标签', 'AddBar 添加栏'],
  part: {
    html: `
<div class="wrap">
  <header class="hdr">
    <div class="brand">
      <span class="logo">✓</span>
      <div><h1>{{name}}</h1><p class="sub">把每件事做完 · 给今天一个交代</p></div>
    </div>
    <div class="chip" id="date"></div>
  </header>
  <div class="addbar">
    <input id="inp" placeholder="添加一个待办事项…" autocomplete="off" />
    <button id="add">添加</button>
  </div>
  <div class="tabs">
    <button class="tab active" data-f="all">全部</button>
    <button class="tab" data-f="active">进行中</button>
    <button class="tab" data-f="done">已完成</button>
  </div>
  <ul id="list"></ul>
  <footer class="ft"><span id="count"></span><button id="clear">清除已完成</button></footer>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#7c5cff;--accent-2:#a78bfa;--accent-soft:rgba(124,92,255,.14);--accent-soft-2:rgba(124,92,255,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1200px 600px at 20% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:32px 16px}
.wrap{max-width:560px;margin:0 auto}
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:20px;font-weight:700;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-2));box-shadow:0 8px 24px var(--accent-soft)}
h1{font-size:22px;letter-spacing:.5px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.chip{color:var(--muted);font-size:12px;background:var(--card);border:1px solid var(--border);padding:6px 12px;border-radius:999px}
.addbar{display:flex;gap:10px;margin-bottom:14px}
.addbar input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px 15px;color:var(--text);font-size:14px;outline:none;transition:.2s}
.addbar input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.addbar button{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:12px;padding:0 20px;font-size:14px;font-weight:600;cursor:pointer;transition:.15s}
.addbar button:hover{filter:brightness(1.08)}
.tabs{display:flex;gap:6px;margin-bottom:14px}
.tab{flex:1;background:transparent;border:1px solid var(--border);color:var(--muted);border-radius:10px;padding:8px;font-size:12.5px;cursor:pointer;transition:.15s}
.tab.active{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2)}
#list{list-style:none;display:flex;flex-direction:column;gap:8px}
.item{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px 15px;animation:pop .2s ease}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.ck{width:20px;height:20px;border-radius:6px;border:2px solid var(--muted);background:transparent;cursor:pointer;display:grid;place-items:center;transition:.15s;flex:none}
.ck span{width:10px;height:10px;transform:scale(0);transition:.15s;border-radius:3px;background:#fff}
.item.done .ck{background:var(--accent);border-color:var(--accent)}
.item.done .ck span{transform:scale(1);clip-path:polygon(14% 50%,38% 74%,86% 26%,100% 40%,38% 100%,0 60%)}
.txt{flex:1;font-size:14px}
.item.done .txt{color:var(--muted);text-decoration:line-through}
.x{background:transparent;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:2px 8px;border-radius:6px;transition:.15s}
.x:hover{color:#f87171;background:rgba(248,113,113,.1)}
.empty{padding:28px;text-align:center;color:var(--muted);font-size:13px;border:1px dashed var(--border);border-radius:12px}
.ft{display:flex;align-items:center;justify-content:space-between;margin-top:16px;color:var(--muted);font-size:12.5px}
.ft button{background:transparent;border:none;color:var(--muted);font-size:12.5px;cursor:pointer}
.ft button:hover{color:var(--accent-2)}
`,
    js: `
var KEY='atoms.todo.v1';
var items=JSON.parse(store.get(KEY,'[]'));
var filter='all';
var list=document.getElementById('list'),count=document.getElementById('count');
document.getElementById('date').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'short'});
function save(){store.set(KEY,JSON.stringify(items))}
function render(){
  var f=items.filter(function(it){if(filter==='active')return !it.done;if(filter==='done')return it.done;return true});
  list.innerHTML='';
  if(!f.length){var li=document.createElement('li');li.className='empty';li.textContent='这里空空如也,添加一个待办吧';list.appendChild(li)}
  f.forEach(function(it){
    var li=document.createElement('li');li.className='item'+(it.done?' done':'');
    var ck=document.createElement('button');ck.className='ck';ck.innerHTML='<span></span>';
    ck.onclick=function(){it.done=!it.done;save();render()};
    var t=document.createElement('span');t.className='txt';t.textContent=it.text;
    var del=document.createElement('button');del.className='x';del.textContent='\\u00d7';
    del.onclick=function(){items=items.filter(function(x){return x!==it});save();render()};
    li.appendChild(ck);li.appendChild(t);li.appendChild(del);list.appendChild(li);
  });
  var rest=items.filter(function(x){return !x.done}).length;
  count.textContent=rest+' 项进行中 · '+items.length+' 项总计';
}
document.getElementById('add').onclick=add;
document.getElementById('inp').addEventListener('keydown',function(e){if(e.key==='Enter')add()});
function add(){var v=document.getElementById('inp').value.trim();if(!v)return;items.push({id:Date.now(),text:v,done:false});document.getElementById('inp').value='';save();render()}
document.getElementById('clear').onclick=function(){items=items.filter(function(x){return !x.done});save();render()};
Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(t){t.onclick=function(){Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(x){x.classList.remove('active')});t.classList.add('active');filter=t.getAttribute('data-f');render()}});
render();
`,
  },
})

const notes: AppTemplate = T('notes', {
  name: '极简笔记',
  category: '效率工具',
  emoji: '📝',
  defaultAccent: '#3b82f6',
  keywords: ['笔记', '备忘录', 'note', '记事', '写作', '日记', '文档', '灵感', '随手记'],
  description: '一款即时保存的极简笔记应用,支持笔记列表、编辑与全文搜索。',
  audience: '需要随时记录灵感的创作者、学生与知识工作者',
  features: ['新建笔记', '即时自动保存', '标题 + 正文编辑', '全文搜索', '本地持久化存储'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['NoteList 笔记列表', 'NoteEditor 编辑器', 'SearchBar 搜索栏', 'Sidebar 侧边栏'],
  part: {
    html: `
<div class="app">
  <aside class="side">
    <div class="side-head"><span class="logo">N</span><h1>{{name}}</h1></div>
    <button class="new" id="new">＋ 新建笔记</button>
    <input class="search" id="search" placeholder="搜索笔记…" />
    <ul class="list" id="list"></ul>
  </aside>
  <main class="main">
    <input class="title" id="title" placeholder="标题" />
    <div class="meta" id="meta"></div>
    <textarea id="body" placeholder="开始书写…"></textarea>
  </main>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#12151f;--card2:#181c29;--text:#e8ebf4;--muted:#8a92a6;--border:#222839}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text);height:100vh;overflow:hidden}
.app{display:grid;grid-template-columns:280px 1fr;height:100vh}
.side{background:var(--card);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:18px;gap:12px}
.side-head{display:flex;align-items:center;gap:10px}
.logo{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:17px}
.new{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:11px;padding:11px;font-size:14px;font-weight:600;cursor:pointer}
.search{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:var(--text);font-size:13px;outline:none}
.search:focus{border-color:var(--accent)}
.list{list-style:none;overflow:auto;display:flex;flex-direction:column;gap:6px}
.note{background:transparent;border:1px solid transparent;border-radius:10px;padding:11px 12px;cursor:pointer;transition:.15s}
.note:hover{background:var(--card2)}
.note.active{background:var(--accent-soft);border-color:var(--accent)}
.note .t{font-size:13.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note .p{font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}
.main{display:flex;flex-direction:column;padding:28px 40px;gap:14px;overflow:auto}
.title{background:transparent;border:none;outline:none;font-size:30px;font-weight:800;color:var(--text)}
.title::placeholder{color:#3a4154}
.meta{color:var(--muted);font-size:12px}
#body{flex:1;background:transparent;border:none;outline:none;resize:none;color:var(--text);font-size:15px;line-height:1.8;font-family:inherit}
#body::placeholder{color:#3a4154}
.empty{color:var(--muted);font-size:13px;padding:10px;text-align:center}
`,
    js: `
var KEY='atoms.notes.v1';
var notes=JSON.parse(store.get(KEY,'[]'));
var cur=null;
var list=document.getElementById('list'),search=document.getElementById('search'),title=document.getElementById('title'),body=document.getElementById('body'),meta=document.getElementById('meta');
function save(){store.set(KEY,JSON.stringify(notes))}
function stamp(){return new Date().toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function preview(b){var t=b.replace(/\\s+/g,' ').trim();return t.slice(0,60)||'空笔记'}
function renderList(q){
  var arr=notes.slice().sort(function(a,b){return b.t-a.t});
  if(q)arr=arr.filter(function(n){return (n.ti+' '+n.b).toLowerCase().indexOf(q.toLowerCase())>-1});
  list.innerHTML='';
  if(!arr.length){var e=document.createElement('li');e.className='empty';e.textContent='暂无笔记';list.appendChild(e)}
  arr.forEach(function(n){
    var li=document.createElement('li');li.className='note'+(cur&&cur.id===n.id?' active':'');
    var t=document.createElement('div');t.className='t';t.textContent=n.ti||'无标题';
    var p=document.createElement('div');p.className='p';p.textContent=preview(n.b);
    li.appendChild(t);li.appendChild(p);
    li.onclick=function(){open(n.id)};
    list.appendChild(li);
  });
}
function open(id){
  if(cur){cur.ti=title.value;cur.b=body.value;cur.t=Date.now()}
  save();
  cur=notes.find(function(n){return n.id===id});
  title.value=cur.ti;body.value=cur.b;meta.textContent='最后编辑 '+stamp();
  renderList(search.value);
}
document.getElementById('new').onclick=function(){
  var n={id:Date.now()+''+Math.random().toString(36).slice(2,6),ti:'',b:'',t:Date.now()};
  notes.push(n);save();cur=n;
  title.value='';body.value='';meta.textContent='新建 · '+stamp();renderList(search.value);title.focus();
};
search.oninput=function(){renderList(search.value)};
body.oninput=function(){meta.textContent='编辑中…';var tid=null;clearTimeout(tid);tid=setTimeout(function(){if(cur){cur.pend=true}},300)};
if(notes.length)open(notes[0].id);else{meta.textContent='点击「新建笔记」开始';renderList('')}
`,
  },
})

const weather: AppTemplate = T('weather', {
  name: '天气助手',
  category: '生活工具',
  emoji: '🌤️',
  defaultAccent: '#06b6d4',
  keywords: ['天气', '气温', '预报', 'weather', '降雨', '气候', '风', '温度'],
  description: '一款清爽的天气查询应用,支持热门城市天气与未来五日报。',
  audience: '关注通勤出行与日常穿衣建议的用户',
  features: ['热门城市一键切换', '实时天气概况', '未来五日预报', '体感与穿衣建议'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', '天气数据 API(模拟)'],
  components: ['CityTabs 城市切换', 'CurrentWeather 当前天气', 'ForecastList 预报列表'],
  part: {
    html: `
<div class="app">
  <header class="top">
    <div class="brand"><span class="logo">🌤</span><div><h1>{{name}}</h1><p class="sub">今日天气一目了然</p></div></div>
    <div class="time" id="time"></div>
  </header>
  <div class="chips" id="chips"></div>
  <div class="card">
    <div class="city" id="city"></div>
    <div class="main">
      <div class="temp" id="temp"></div>
      <div class="cond" id="cond"></div>
    </div>
    <div class="grid" id="grid"></div>
    <div class="advice" id="advice"></div>
  </div>
  <div class="forecast" id="forecast"></div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#12161f;--card2:#181d29;--text:#e8ebf4;--muted:#8a92a6;--border:#222839}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1000px 500px at 80% -10%,var(--accent-soft),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:680px;margin:0 auto}
.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{display:flex;gap:11px;align-items:center}
.logo{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:var(--card);border:1px solid var(--border)}
h1{font-size:20px}
.sub{color:var(--muted);font-size:12px;margin-top:2px}
.time{color:var(--muted);font-size:13px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.chip{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:7px 14px;border-radius:999px;font-size:13px;cursor:pointer;transition:.15s}
.chip.active{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2)}
.card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:26px}
.city{font-size:16px;font-weight:700}
.main{display:flex;align-items:center;gap:18px;margin:8px 0 20px}
.temp{font-size:72px;font-weight:800;line-height:1}
.cond{font-size:18px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
.g{background:var(--card2);border-radius:12px;padding:12px;text-align:center}
.g .k{color:var(--muted);font-size:11px}
.g .v{font-size:16px;font-weight:700;margin-top:4px}
.advice{background:var(--accent-soft-2);border:1px solid var(--accent-soft);border-radius:12px;padding:12px 14px;color:var(--accent-2);font-size:13px}
.forecast{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:14px}
.day{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px 6px;text-align:center}
.day .d{color:var(--muted);font-size:12px}
.day .i{font-size:22px;margin:8px 0}
.day .t{font-size:14px;font-weight:700}
.day .l{color:var(--muted);font-size:11px;margin-top:2px}
`,
    js: `
var CITIES=['北京','上海','广州','深圳','杭州','成都'];
var CONDS=[['☀️','晴'],['⛅','多云'],['🌧','小雨'],['🌩','雷阵雨'],['❄️','雪'],['🌫','雾']];
function hsh(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))>>>0;return x}
function wf(city){var seed=hsh(city);var t=6+(seed%22);var c=CONDS[seed%CONDS.length];return{city:city,temp:t,icon:c[0],cond:c[1],hum:30+(seed%50),wind:2+(seed%16),aqi:20+(seed%120)}}
var cur=CITIES[0];
function render(){
  var w=wf(cur);
  document.getElementById('city').textContent=w.city;
  document.getElementById('temp').textContent=w.temp+'°';
  document.getElementById('cond').textContent=w.icon+' '+w.cond;
  document.getElementById('grid').innerHTML=
    '<div class="g"><div class="k">湿度</div><div class="v">'+w.hum+'%</div></div>'+
    '<div class="g"><div class="k">风速</div><div class="v">'+w.wind+' km/h</div></div>'+
    '<div class="g"><div class="k">空气质量</div><div class="v">'+(w.aqi<60?'优':w.aqi<100?'良':'轻污')+'</div></div>';
  var tips=['天气不错,适合出门走走 🚶','记得带伞 ☔','早晚温差大,注意添衣 🧥','较热,注意防晒 🕶️','适合宅家 🏠'];
  document.getElementById('advice').textContent='穿衣建议:'+tips[w.temp%tips.length];
  var f=document.getElementById('forecast');f.innerHTML='';
  var days=['今天','明天','周三','周四','周五'];
  for(var i=0;i<5;i++){
    var seed=hsh(cur)+i*7;
    var t=w.temp+(seed%7)-3;
    var c=CONDS[seed%CONDS.length];
    var d=document.createElement('div');d.className='day';
    d.innerHTML='<div class="d">'+days[i]+'</div><div class="i">'+c[0]+'</div><div class="t">'+t+'°</div><div class="l">'+c[1]+'</div>';
    f.appendChild(d);
  }
}
var chips=document.getElementById('chips');
CITIES.forEach(function(c){
  var b=document.createElement('button');b.className='chip'+(c===cur?' active':'');b.textContent=c;
  b.onclick=function(){cur=c;render();Array.prototype.forEach.call(chips.children,function(x){x.classList.remove('active')});b.classList.add('active')};
  chips.appendChild(b);
});
function tick(){document.getElementById('time').textContent=new Date().toLocaleString('zh-CN',{month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit'})}
tick();setInterval(tick,30000);
render();
`,
  },
})

const fitness: AppTemplate = T('fitness', {
  name: '健身追踪',
  category: '健康',
  emoji: '💪',
  defaultAccent: '#10b981',
  keywords: ['健身', '运动', '锻炼', '健身记录', '跑步', '训练', '卡路里', '健康', '减脂', '增肌', 'fit', 'gym', 'workout'],
  description: '一款健身记录应用,追踪每次锻炼并统计每周运动量。',
  audience: '坚持运动、希望可视化训练成果的健身爱好者',
  features: ['记录锻炼项目与时长', '本周运动量统计', '卡路里消耗估算', '历史记录列表'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['WorkoutLog 训练记录', 'WeeklyChart 周统计', 'CalorieStat 卡路里统计'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">💪</span><div><h1>{{name}}</h1><p class="sub">每一次训练都算数</p></div></div>
    <div class="streak">🔥 <span id="streak">0</span> 天</div>
  </header>
  <div class="stats">
    <div class="stat"><div class="k">本周运动</div><div class="v" id="wk">0<span> 分钟</span></div></div>
    <div class="stat"><div class="k">消耗热量</div><div class="v" id="kcal">0<span> kcal</span></div></div>
    <div class="stat"><div class="k">累计次数</div><div class="v" id="cnt">0<span> 次</span></div></div>
  </div>
  <div class="panel">
    <div class="panel-h">📊 本周运动量(分钟)</div>
    <div class="chart" id="chart"></div>
  </div>
  <div class="panel">
    <div class="panel-h">记录一次训练</div>
    <div class="form">
      <input id="type" placeholder="项目,如:跑步 / 力量 / 瑜伽" />
      <input id="min" type="number" placeholder="时长(分钟)" />
      <button id="log">记录</button>
    </div>
    <ul class="log" id="log"></ul>
  </div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#10b981;--accent-2:#34d399;--accent-soft:rgba(16,185,129,.14);--accent-soft-2:rgba(16,185,129,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1100px 500px at 10% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:720px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.streak{background:var(--card);border:1px solid var(--border);padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px}
.stat .k{color:var(--muted);font-size:12px}
.stat .v{font-size:26px;font-weight:800;margin-top:6px}
.stat .v span{font-size:12px;color:var(--muted);font-weight:500}
.panel{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px}
.panel-h{font-size:14px;font-weight:700;margin-bottom:14px}
.chart{display:flex;align-items:flex-end;gap:10px;height:120px}
.bar{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:100%}
.bar .fill{width:100%;background:linear-gradient(180deg,var(--accent),var(--accent-2));border-radius:6px 6px 2px 2px;min-height:4px;transition:.4s}
.bar .lb{color:var(--muted);font-size:11px}
.form{display:grid;grid-template-columns:1fr 120px auto;gap:8px}
.form input{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:11px 12px;color:var(--text);font-size:13.5px;outline:none}
.form input:focus{border-color:var(--accent)}
.form button{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:10px;padding:0 18px;font-weight:600;cursor:pointer}
.log{list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:8px}
.row{display:flex;justify-content:space-between;align-items:center;background:var(--card2);border-radius:10px;padding:11px 14px}
.row .nm{font-size:14px;font-weight:600}
.row .dt{color:var(--muted);font-size:12px}
.row .dur{color:var(--accent-2);font-weight:700;font-size:14px}
.empty{color:var(--muted);font-size:13px;text-align:center;padding:10px}
`,
    js: `
var KEY='atoms.fit.v1';
var data=JSON.parse(store.get(KEY,'[]'));
var DAYS=['一','二','三','四','五','六','日'];
function render(){
  var now=new Date();var monday=new Date(now);monday.setDate(now.getDate()-(now.getDay()+6)%7);monday.setHours(0,0,0,0);
  var week=[0,0,0,0,0,0,0];
  var wkMin=0,kcal=0,streak=0;
  data.forEach(function(r){kcal+=Math.round(r.min*8)});
  data.forEach(function(r){
    var d=new Date(r.t);if(d>=monday){var idx=(d.getDay()+6)%7;week[idx]+=r.min}
  });
  var today=new Date();today.setHours(0,0,0,0);
  var s=today;
  while(data.some(function(r){return new Date(r.t).getTime()>=s.getTime()&&new Date(r.t).getTime()<s.getTime()+86400000})){streak++;s=new Date(s.getTime()-86400000)}
  wkMin=week.reduce(function(a,b){return a+b},0);
  document.getElementById('wk').innerHTML=wkMin+'<span> 分钟</span>';
  document.getElementById('kcal').innerHTML=kcal+'<span> kcal</span>';
  document.getElementById('cnt').innerHTML=data.length+'<span> 次</span>';
  document.getElementById('streak').textContent=streak;
  var chart=document.getElementById('chart');chart.innerHTML='';
  var max=Math.max.apply(null,week.concat([1]));
  week.forEach(function(v,i){
    var d=document.createElement('div');d.className='bar';
    var f=document.createElement('div');f.className='fill';f.style.height=(v/max*100)+'%';
    var l=document.createElement('div');l.className='lb';l.textContent=DAYS[i];
    d.appendChild(f);d.appendChild(l);chart.appendChild(d);
  });
  var log=document.getElementById('log');log.innerHTML='';
  var hist=data.slice().sort(function(a,b){return b.t-a.t}).slice(0,6);
  if(!hist.length){var e=document.createElement('li');e.className='empty';e.textContent='还没有训练记录,开始第一次吧';log.appendChild(e)}
  hist.forEach(function(r){
    var li=document.createElement('li');li.className='row';
    var nm=document.createElement('div');nm.className='nm';nm.textContent=r.type;
    var dt=document.createElement('div');dt.className='dt';dt.textContent=new Date(r.t).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    var du=document.createElement('div');du.className='dur';du.textContent=r.min+' 分钟';
    li.appendChild(nm);li.appendChild(dt);li.appendChild(du);log.appendChild(li);
  });
}
var formBtn=document.querySelector('.form button');
formBtn.onclick=function(){
  var type=document.getElementById('type').value.trim();
  var min=parseInt(document.getElementById('min').value,10);
  if(!type||!min)return;
  data.push({type:type,min:min,t:Date.now()});
  store.set(KEY,JSON.stringify(data));
  document.getElementById('type').value='';document.getElementById('min').value='';
  render();
};
render();
`,
  },
})

const expense: AppTemplate = T('expense', {
  name: '记账本',
  category: '财务管理',
  emoji: '💰',
  defaultAccent: '#f97316',
  keywords: ['记账', '账单', '收支', '预算', '财务', '花销', '理财', '消费', '支出', '收入', '存款', '账本'],
  description: '一款轻量记账应用,记录收支并可视化分类占比。',
  audience: '希望掌握每月开销、培养理财习惯的个人',
  features: ['记录收入与支出', '自动统计结余', '分类占比可视化', '明细流水列表'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['BalanceCard 结余卡片', 'CategoryChart 分类图表', 'TransactionForm 记账表单', 'TransactionList 流水列表'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">💰</span><div><h1>{{name}}</h1><p class="sub">每一笔都清晰</p></div></div>
    <div id="mouth" class="chip"></div>
  </header>
  <div class="balance">
    <div class="b-k">本月结余</div>
    <div class="b-v" id="bal">¥0.00</div>
    <div class="b-row"><span>收入 <b id="inc" class="up">¥0</b></span><span>支出 <b id="exp" class="down">¥0</b></span></div>
  </div>
  <div class="panel">
    <div class="panel-h">分类支出占比</div>
    <div class="cat" id="cat"></div>
  </div>
  <div class="panel">
    <div class="panel-h">记一笔</div>
    <div class="form">
      <select id="type"><option value="exp">支出</option><option value="inc">收入</option></select>
      <input id="amt" type="number" placeholder="金额" />
      <input id="note" placeholder="备注,如:午餐" />
      <button id="add">添加</button>
    </div>
    <ul class="list" id="list"></ul>
  </div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#f97316;--accent-2:#fb923c;--accent-soft:rgba(249,115,22,.14);--accent-soft-2:rgba(249,115,22,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1000px 500px at 80% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:680px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.chip{color:var(--muted);font-size:12.5px;background:var(--card);border:1px solid var(--border);padding:6px 12px;border-radius:999px}
.balance{background:linear-gradient(135deg,var(--accent),var(--accent-2));border-radius:18px;padding:24px;margin-bottom:14px;color:#fff}
.b-k{font-size:12.5px;opacity:.85}
.b-v{font-size:38px;font-weight:800;margin:6px 0 12px}
.b-row{display:flex;gap:22px;font-size:13px;opacity:.95}
.b-row b{font-weight:700;margin-left:4px}
.panel{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:14px}
.panel-h{font-size:14px;font-weight:700;margin-bottom:14px}
.cat{display:flex;flex-direction:column;gap:10px}
.cr{display:flex;align-items:center;gap:10px}
.cr .dot{width:10px;height:10px;border-radius:3px;flex:none}
.cr .lb{font-size:13px;width:64px}
.cr .bar{flex:1;height:10px;background:var(--card2);border-radius:99px;overflow:hidden}
.cr .bar i{display:block;height:100%;border-radius:99px;transition:.4s}
.cr .val{margin-left:auto;font-size:13px;color:var(--muted)}
.form{display:grid;grid-template-columns:80px 100px 1fr auto;gap:8px}
.form input,.form select{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:11px 12px;color:var(--text);font-size:13.5px;outline:none}
.form input:focus,.form select:focus{border-color:var(--accent)}
.form button{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:10px;padding:0 18px;font-weight:600;cursor:pointer}
.list{list-style:none;margin-top:14px;display:flex;flex-direction:column;gap:8px}
.row{display:flex;align-items:center;gap:12px;background:var(--card2);border-radius:10px;padding:11px 14px}
.row .ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--accent-soft);font-size:16px}
.row .nm{font-size:14px;font-weight:600}
.row .dt{color:var(--muted);font-size:11.5px}
.row .amt{margin-left:auto;font-weight:700;font-size:14px}
.up{color:#34d399}.down{color:#fb7185}
.empty{color:var(--muted);font-size:13px;text-align:center;padding:10px}
`,
    js: `
var KEY='atoms.exp.v1';
var data=JSON.parse(store.get(KEY,'[]'));
var ICONS={'餐饮':'🍜','交通':'🚕','购物':'🛍️','娱乐':'🎮','居住':'🏠','其他':'🧾','工资':'💵','奖金':'🎁'};
function monthKey(d){return d.getFullYear()+'-'+(d.getMonth()+1)}
function render(){
  var now=new Date();
  document.getElementById('mouth').textContent=now.getFullYear()+' 年 '+(now.getMonth()+1)+' 月';
  var mk=monthKey(now);
  var month=data.filter(function(r){return monthKey(new Date(r.t))===mk});
  var inc=0,exp=0,catExp={};
  month.forEach(function(r){if(r.type==='inc')inc+=r.amt;else{exp+=r.amt;catExp[r.cat]=(catExp[r.cat]||0)+r.amt}});
  document.getElementById('bal').textContent='¥'+(inc-exp).toFixed(2);
  document.getElementById('inc').textContent='¥'+inc.toFixed(0);
  document.getElementById('exp').textContent='¥'+exp.toFixed(0);
  var cat=document.getElementById('cat');cat.innerHTML='';
  var entries=Object.keys(catExp).map(function(k){return{k:k,v:catExp[k]}}).sort(function(a,b){return b.v-a.v});
  if(!entries.length){cat.innerHTML='<div class="empty">本月暂无支出记录</div>'}
  var total=entries.reduce(function(a,b){return a+b.v},0);
  var colors=['#f97316','#a78bfa','#38bdf8','#34d399','#f472b6','#f59e0b'];
  entries.forEach(function(e,i){
    var pct=Math.round(e.v/total*100);
    var d=document.createElement('div');d.className='cr';
    d.innerHTML='<div class="dot" style="background:'+colors[i%colors.length]+'"></div><div class="lb">'+e.k+'</div><div class="bar"><i style="width:'+pct+'%;background:'+colors[i%colors.length]+'"></i></div><div class="val">'+pct+'% · ¥'+e.v.toFixed(0)+'</div>';
    cat.appendChild(d);
  });
  var list=document.getElementById('list');list.innerHTML='';
  var hist=data.slice().sort(function(a,b){return b.t-a.t}).slice(0,8);
  if(!hist.length){list.innerHTML='<li class="empty">暂无记录,记下第一笔吧</li>'}
  hist.forEach(function(r){
    var li=document.createElement('li');li.className='row';
    var ic=r.type==='inc'?'💵':(ICONS[r.cat]||'🧾');
    li.innerHTML='<div class="ic">'+ic+'</div><div><div class="nm">'+r.note+'</div><div class="dt">'+r.cat+' · '+new Date(r.t).toLocaleDateString('zh-CN')+'</div></div><div class="amt '+(r.type==='inc'?'up':'down')+'">'+(r.type==='inc'?'+':'-')+'¥'+r.amt.toFixed(2)+'</div>';
    list.appendChild(li);
  });
}
document.getElementById('add').onclick=function(){
  var type=document.getElementById('type').value;
  var amt=parseFloat(document.getElementById('amt').value);
  var note=document.getElementById('note').value.trim();
  if(!amt)return;
  var cats={exp:['餐饮','交通','购物','娱乐','居住','其他'],inc:['工资','奖金','其他']};
  var cat=(note||'')+'';var mk;
  var r={type:type,amt:amt,note:note||(type==='inc'?'收入':'支出'),cat:(type==='inc'?'工资':'其他'),t:Date.now()};
  // 简单分类推断
  var kws=[['餐饮',['餐','饭','咖啡','奶茶','外卖']],['交通',['打车','地铁','公交','加油','出行']],['购物',['买','购','淘宝','京东']],['娱乐',['电影','游戏','唱k','k歌']],['居住',['房租','水电','物业']]];
  kws.forEach(function(pair){if(pair[1].some(function(k){return note.indexOf(k)>-1}))r.cat=pair[0]});
  data.push(r);store.set(KEY,JSON.stringify(data));
  document.getElementById('amt').value='';document.getElementById('note').value='';
  render();
};
render();
`,
  },
})

const dashboard: AppTemplate = T('dashboard', {
  name: '数据仪表盘',
  category: '数据分析',
  emoji: '📈',
  defaultAccent: '#8b5cf6',
  keywords: ['仪表盘', '数据', '统计', '分析', '报表', 'dashboard', '图表', '监控', '指标', '看板', '后台', '管理后台', '运营'],
  description: '一款数据分析仪表盘,聚合关键指标并可视化趋势。',
  audience: '需要实时掌握业务指标的产品与运营团队',
  features: ['核心指标卡片', '访问趋势折线图', '渠道来源分布', '时间范围切换', '最新动态列表'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', '图表(SVG)'],
  components: ['StatCard 指标卡', 'TrendChart 趋势图', 'SourcePie 渠道分布', 'ActivityFeed 动态列表'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">📈</span><div><h1>{{name}}</h1><p class="sub">核心指标总览</p></div></div>
    <div class="range">
      <button class="r active" data-d="7">近 7 天</button>
      <button class="r" data-d="30">近 30 天</button>
      <button class="r" data-d="90">近 90 天</button>
    </div>
  </header>
  <div class="stats" id="stats"></div>
  <div class="grid2">
    <div class="panel">
      <div class="panel-h">访问趋势</div>
      <svg id="trend" viewBox="0 0 600 200" preserveAspectRatio="none"></svg>
    </div>
    <div class="panel">
      <div class="panel-h">渠道来源</div>
      <div class="src" id="src"></div>
    </div>
  </div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#8b5cf6;--accent-2:#a78bfa;--accent-soft:rgba(139,92,246,.14);--accent-soft-2:rgba(139,92,246,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1200px 500px at 50% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:920px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;margin-bottom:20px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.range{display:flex;gap:6px;background:var(--card);border:1px solid var(--border);padding:4px;border-radius:11px}
.r{background:transparent;border:none;color:var(--muted);padding:7px 14px;border-radius:8px;font-size:13px;cursor:pointer;transition:.15s}
.r.active{background:var(--accent-soft);color:var(--accent-2)}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px}
.stat .k{color:var(--muted);font-size:12px}
.stat .v{font-size:26px;font-weight:800;margin:6px 0 4px}
.stat .d{font-size:11.5px}
.grid2{display:grid;grid-template-columns:1.5fr 1fr;gap:12px}
.panel{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px}
.panel-h{font-size:14px;font-weight:700;margin-bottom:14px}
#trend{width:100%;height:200px}
.src{display:flex;flex-direction:column;gap:12px}
.sr{display:flex;align-items:center;gap:10px}
.sr .dot{width:10px;height:10px;border-radius:3px}
.sr .lb{font-size:13px;width:64px}
.sr .bar{flex:1;height:10px;background:var(--card2);border-radius:99px;overflow:hidden}
.sr .bar i{display:block;height:100%;border-radius:99px}
.sr .val{font-size:13px;color:var(--muted)}
@media(max-width:720px){.stats{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}
`,
    js: `
function hsh(s){var x=0;for(var i=0;i<s.length;i++)x=(x*31+s.charCodeAt(i))>>>0;return x}
function genData(days){
  var out=[];var v=hsh('base')%40+40;
  for(var i=days-1;i>=0;i--){
    v=Math.max(8,v+(hsh('d'+i)%13)-6);
    var d=new Date(Date.now()-i*86400000);
    out.push({k:(d.getMonth()+1)+'/'+d.getDate(),v:v});
  }
  return out;
}
function fmt(n){if(n>=10000)return (n/10000).toFixed(1)+'w';return ''+n}
var range=7;
function render(){
  var data=genData(range);
  var last=data[data.length-1].v;
  var stats=[
    {k:'访问量',v:fmt(last*137),d:'较上期 +12.4%',up:true},
    {k:'活跃用户',v:fmt(last*41),d:'较上期 +6.2%',up:true},
    {k:'转化率',v:(2.8+last%20/10).toFixed(1)+'%',d:'较上期 -0.3%',up:false},
    {k:'收入(¥)',v:fmt(last*289),d:'较上期 +18.9%',up:true},
  ];
  var el=document.getElementById('stats');el.innerHTML='';
  stats.forEach(function(s){
    var d=document.createElement('div');d.className='stat';
    d.innerHTML='<div class="k">'+s.k+'</div><div class="v">'+s.v+'</div><div class="d" style="color:'+(s.up?'#34d399':'#fb7185')+'">'+(s.up?'▲':'▼')+' '+s.d+'</div>';
    el.appendChild(d);
  });
  var max=Math.max.apply(null,data.map(function(d){return d.v}));
  var w=600,h=200,pad=8;
  var pts=data.map(function(d,i){return [pad+i*(w-pad*2)/(data.length-1),h-pad-(d.v/max)*(h-pad*2)]});
  var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)}).join(' ');
  var area=line+' L '+(w-pad)+' '+(h-pad)+' L '+pad+' '+(h-pad)+' Z';
  var accent=(getComputedStyle(document.documentElement).getPropertyValue('--accent')||'').trim()||'#8b5cf6';
  var g='<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+accent+'" stop-opacity=".35"/><stop offset="1" stop-color="'+accent+'" stop-opacity="0"/></linearGradient></defs>';
  var svg=g+'<path d="'+area+'" fill="url(#g)"/><path d="'+line+'" fill="none" stroke="'+accent+'" stroke-width="2.5" stroke-linecap="round"/>';
  pts.forEach(function(p){
    if(data.length<=12)svg+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+accent+'"/>';
  });
  document.getElementById('trend').innerHTML=svg;
  var srcs=[['直接访问','#8b5cf6'],['搜索引擎','#38bdf8'],['社交媒体','#f472b6'],['外部链接','#34d399'],['其他','#64748b']];
  var total=0;srcs.forEach(function(s){total+=hsh(s[0])%400+100});
  var el2=document.getElementById('src');el2.innerHTML='';
  srcs.forEach(function(s){
    var v=Math.round((hsh(s[0])%400+100)/total*100);
    var d=document.createElement('div');d.className='sr';
    d.innerHTML='<div class="dot" style="background:'+s[1]+'"></div><div class="lb">'+s[0]+'</div><div class="bar"><i style="width:'+v+'%;background:'+s[1]+'"></i></div><div class="val">'+v+'%</div>';
    el2.appendChild(d);
  });
}
Array.prototype.forEach.call(document.querySelectorAll('.r'),function(b){
  b.onclick=function(){
    Array.prototype.forEach.call(document.querySelectorAll('.r'),function(x){x.classList.remove('active')});
    b.classList.add('active');range=parseInt(b.getAttribute('data-d'),10);render();
  };
});
render();
`,
  },
})

const landing: AppTemplate = T('landing', {
  name: '落地页',
  category: '官网 / 营销',
  emoji: '🚀',
  defaultAccent: '#7c5cff',
  keywords: ['官网', '落地页', '首页', '网站', '主页', '营销', '推广', '品牌', '公司', '产品介绍', 'landing', '首页网站', '企业', '宣传'],
  description: '一款现代营销落地页,展示产品价值、功能亮点与定价方案。',
  audience: '想把产品快速推向市场的创业者与营销团队',
  features: ['吸睛 Hero 区与行动号召', '核心功能展示', '定价方案(月付/年付切换)', '用户评价', '页脚与联系方式'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', '响应式布局'],
  components: ['Navbar 导航栏', 'Hero 首屏', 'FeatureGrid 特性网格', 'Pricing 定价', 'Testimonials 用户评价'],
  part: {
    html: `
<nav class="nav">
  <div class="nav-b"><span class="logo">✦</span><b>{{name}}</b></div>
  <div class="nav-l">
    <a href="#features">功能</a><a href="#pricing">定价</a><a href="#test">评价</a>
  </div>
  <button class="btn ghost">登录</button><button class="btn solid">免费开始</button>
</nav>
<header class="hero">
  <span class="badge">✨ 全新上线</span>
  <h1>把好想法,<br>变成<em>真正的产品</em></h1>
  <p class="lead">无需编码,几分钟内即可搭建并发布你的产品,让创意即刻落地。</p>
  <div class="cta"><button class="btn solid lg">立即开始 →</button><button class="btn ghost lg">查看演示</button></div>
  <div class="hero-stats">
    <div><b>70w+</b><span>创作者使用</span></div>
    <div><b>30s</b><span>平均交付</span></div>
    <div><b>98%</b><span>满意度</span></div>
  </div>
</header>
<section class="features" id="features">
  <h2>为什么选择 {{name}}</h2>
  <div class="fgrid">
    <div class="f"><div class="fi">⚡</div><h3>极速交付</h3><p>从想法到可用产品,平均只需 30 秒。</p></div>
    <div class="f"><div class="fi">🤖</div><h3>AI 团队</h3><p>产品、架构、研发多角色智能体协同。</p></div>
    <div class="f"><div class="fi">🔒</div><h3>安全可靠</h3><p>生产级基础设施,数据全程加密。</p></div>
    <div class="f"><div class="fi">📦</div><h3>一键发布</h3><p>自动部署,生成可分享的线上链接。</p></div>
  </div>
</section>
<section class="pricing" id="pricing">
  <h2>简单透明的定价</h2>
  <div class="switch"><button id="mon" class="active">月付</button><button id="yr">年付 <em>-20%</em></button></div>
  <div class="plans">
    <div class="plan"><div class="pn">入门版</div><div class="pp"><span class="cur">¥</span><span class="num" data-m="0" data-y="0">0</span><span>/月</span></div><ul><li>1 个项目</li><li>基础模板</li><li>社区支持</li></ul><button class="btn ghost">立即开始</button></div>
    <div class="plan hot"><div class="tag">最受欢迎</div><div class="pn">专业版</div><div class="pp"><span class="cur">¥</span><span class="num" data-m="99" data-y="79">99</span><span>/月</span></div><ul><li>无限项目</li><li>全部模板</li><li>优先响应</li><li>自定义域名</li></ul><button class="btn solid">立即开始</button></div>
    <div class="plan"><div class="pn">企业版</div><div class="pp"><span class="cur">¥</span><span class="num" data-m="499" data-y="399">499</span><span>/月</span></div><ul><li>无限协作席位</li><li>专属客服</li><li>SLA 保障</li></ul><button class="btn ghost">联系我们</button></div>
  </div>
</section>
<section class="test" id="test">
  <h2>创作者们怎么说</h2>
  <div class="tgrid">
    <div class="t"><p>「周末两天就把游戏官网搭好了,连注册系统都齐了。」</p><div class="who"><span>🚗</span><b>Michael</b><i>独立开发者</i></div></div>
    <div class="t"><p>「不用写一行代码,就把想法变成了能收费的产品。」</p><div class="who"><span>🌸</span><b>Lily</b><i>自由职业者</i></div></div>
    <div class="t"><p>「AI 团队协作的效率超乎想象。」</p><div class="who"><span>🚀</span><b>陈先生</b><i>创业者</i></div></div>
  </div>
</section>
<footer class="foot">
  <div>© 2026 {{name}} · 用心打造</div>
  <div class="fl"><a href="#">关于</a><a href="#">隐私</a><a href="#">条款</a></div>
</footer>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--text)}
.nav{max-width:1080px;margin:0 auto;display:flex;align-items:center;gap:20px;padding:20px 24px}
.nav-b{display:flex;align-items:center;gap:8px;font-size:17px}
.logo{color:var(--accent);font-size:20px}
.nav-l{display:flex;gap:22px;margin-left:24px}
.nav-l a{color:var(--muted);text-decoration:none;font-size:14px}
.nav-l a:hover{color:var(--text)}
.nav .btn:last-of-type{margin-left:auto}
.btn{border:none;border-radius:10px;padding:10px 18px;font-size:14px;font-weight:600;cursor:pointer;transition:.15s}
.btn.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.btn.ghost:hover{border-color:var(--accent);color:var(--accent-2)}
.btn.solid{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff}
.btn.solid:hover{filter:brightness(1.08)}
.btn.lg{padding:13px 26px;font-size:15px}
.hero{max-width:1080px;margin:60px auto;padding:0 24px;text-align:center}
.badge{display:inline-block;background:var(--accent-soft);color:var(--accent-2);border:1px solid var(--accent-soft);padding:6px 14px;border-radius:999px;font-size:13px;margin-bottom:20px}
.hero h1{font-size:54px;line-height:1.15;font-weight:800;letter-spacing:-1px}
.hero h1 em{font-style:normal;background:linear-gradient(135deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:var(--muted);font-size:18px;max-width:560px;margin:20px auto 28px}
.cta{display:flex;gap:12px;justify-content:center}
.hero-stats{display:flex;justify-content:center;gap:60px;margin-top:56px}
.hero-stats b{font-size:30px;display:block;background:linear-gradient(135deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero-stats span{color:var(--muted);font-size:13px}
.features,.pricing,.test{max-width:1080px;margin:90px auto;padding:0 24px}
.features h2,.pricing h2,.test h2{text-align:center;font-size:32px;margin-bottom:40px}
.fgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.f{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;transition:.2s}
.f:hover{border-color:var(--accent);transform:translateY(-4px)}
.fi{font-size:30px;margin-bottom:14px}
.f h3{font-size:16px;margin-bottom:8px}
.f p{color:var(--muted);font-size:13.5px;line-height:1.6}
.switch{display:flex;justify-content:center;margin-bottom:28px}
.switch button{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:9px 22px;font-size:14px;cursor:pointer}
.switch button:first-child{border-radius:10px 0 0 10px}
.switch button:last-child{border-radius:0 10px 10px 0}
.switch button.active{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2)}
.switch em{font-style:normal;color:var(--accent-2);font-size:11px}
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:start}
.plan{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:28px;position:relative}
.plan.hot{border-color:var(--accent);box-shadow:0 20px 50px var(--accent-soft-2)}
.tag{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;font-size:11.5px;padding:4px 12px;border-radius:999px}
.pn{font-size:15px;font-weight:700}
.pp{font-size:40px;font-weight:800;margin:12px 0}
.pp .cur{font-size:18px;vertical-align:top}
.pp span:nth-child(3){font-size:14px;color:var(--muted);font-weight:400}
.plan ul{list-style:none;margin:18px 0;display:flex;flex-direction:column;gap:10px}
.plan li{color:var(--muted);font-size:13.5px}
.plan li:before{content:'✓ ';color:var(--accent-2)}
.plan .btn{width:100%}
.tgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.t{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px}
.t p{font-size:14px;line-height:1.7;color:var(--text)}
.who{display:flex;align-items:center;gap:10px;margin-top:18px}
.who span{font-size:22px}
.who b{font-size:14px}
.who i{color:var(--muted);font-style:normal;font-size:12px;margin-left:auto}
.foot{max-width:1080px;margin:0 auto;padding:40px 24px;border-top:1px solid var(--border);display:flex;justify-content:space-between;color:var(--muted);font-size:13px}
.fl{display:flex;gap:20px}.fl a{color:var(--muted);text-decoration:none}
@media(max-width:800px){.fgrid,.plans,.tgrid{grid-template-columns:1fr}.hero h1{font-size:38px}.hero-stats{gap:30px}}
`,
    js: `
document.getElementById('mon').onclick=function(){set(false)};
document.getElementById('yr').onclick=function(){set(true)};
function set(yearly){
  document.getElementById('mon').classList.toggle('active',!yearly);
  document.getElementById('yr').classList.toggle('active',yearly);
  Array.prototype.forEach.call(document.querySelectorAll('.num'),function(n){
    n.textContent=yearly?n.getAttribute('data-y'):n.getAttribute('data-m');
  });
}
`,
  },
})

const blog: AppTemplate = T('blog', {
  name: '内容社区',
  category: '内容 / 社区',
  emoji: '✍️',
  defaultAccent: '#ec4899',
  keywords: ['博客', '社区', '文章', '论坛', '内容', '专栏', '文章发布', '帖子', '写作平台', 'blog', '资讯', '新闻', '小红书', '分享'],
  description: '一款内容发布平台,支持发布文章、点赞与标签浏览。',
  audience: '希望搭建自己内容平台的创作者与社区运营者',
  features: ['发布内容', '标签分类浏览', '点赞互动', '作者列表', '精选推荐'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['PostList 内容流', 'TagFilter 标签筛选', 'Composer 发布器', 'AuthorCard 作者卡片'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">✍️</span><div><h1>{{name}}</h1><p class="sub">分享你的想法与见闻</p></div></div>
    <button class="write" id="write">＋ 发布内容</button>
  </header>
  <div class="tags" id="tags"></div>
  <div class="composer" id="composer" hidden>
    <input id="pt" placeholder="标题" />
    <textarea id="pb" placeholder="写点什么…"></textarea>
    <div class="crow"><select id="pc"><option>科技</option><option>生活</option><option>旅行</option><option>美食</option><option>读书</option><option>其他</option></select><button id="pub">发布</button></div>
  </div>
  <div class="feed" id="feed"></div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#ec4899;--accent-2:#f472b6;--accent-soft:rgba(236,72,153,.14);--accent-soft-2:rgba(236,72,153,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1100px 500px at 20% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:700px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.write{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:11px;padding:10px 18px;font-size:13.5px;font-weight:600;cursor:pointer}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.tag{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:6px 14px;border-radius:999px;font-size:13px;cursor:pointer}
.tag.active{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2)}
.composer{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:18px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px}
.composer[hidden]{display:none}
.composer input,.composer textarea{background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text);font-size:14px;outline:none}
.composer textarea{min-height:90px;resize:vertical}
.composer input:focus,.composer textarea:focus{border-color:var(--accent)}
.crow{display:flex;gap:10px}
.crow select{flex:1;background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:10px;color:var(--text);outline:none}
.crow button{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:10px;padding:0 22px;font-weight:600;cursor:pointer}
.feed{display:flex;flex-direction:column;gap:12px}
.post{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px}
.post .ptitle{font-size:17px;font-weight:700;margin-bottom:8px}
.post .pbody{color:var(--muted);font-size:14px;line-height:1.7}
.post .pmeta{display:flex;align-items:center;gap:12px;margin-top:16px;font-size:12.5px;color:var(--muted)}
.post .ptag{background:var(--accent-soft);color:var(--accent-2);padding:2px 10px;border-radius:999px;font-size:11.5px}
.like{border:1px solid var(--border);background:transparent;color:var(--muted);border-radius:999px;padding:5px 13px;font-size:12.5px;cursor:pointer;margin-left:auto;transition:.15s}
.like:hover{color:var(--accent-2);border-color:var(--accent)}
.empty{color:var(--muted);text-align:center;padding:40px 0;font-size:14px}
`,
    js: `
var KEY='atoms.blog.v1';
var posts=JSON.parse(store.get(KEY,'[]'));
var tag='全部';
var TAGS=['全部','科技','生活','旅行','美食','读书'];
if(!posts.length){
  posts=[
    {id:1,t:'用 AI 三个月,我把副业做成了正业',b:'从第一个想法到产品上线,只花了一个周末。分享我的完整历程与踩坑经验。',tag:'科技',likes:128,t:Date.now()-86400000*2},
    {id:2,t:'周末到了,该去哪里走走?',b:'整理了 5 个小众旅行地,适合一个人说走就走的周末短途。',tag:'旅行',likes:64,t:Date.now()-86400000*5},
    {id:3,t:'三本改变我思维方式的书',b:'关于认知、决策与长期主义,每一本都值得反复阅读。',tag:'读书',likes:203,t:Date.now()-86400000*9},
  ];
  store.set(KEY,JSON.stringify(posts));
}
function render(){
  var tags=document.getElementById('tags');tags.innerHTML='';
  TAGS.forEach(function(t){
    var b=document.createElement('button');b.className='tag'+(t===tag?' active':'');b.textContent=t;
    b.onclick=function(){tag=t;render()};tags.appendChild(b);
  });
  var feed=document.getElementById('feed');feed.innerHTML='';
  var list=posts.slice().sort(function(a,b){return b.t-a.t});
  if(tag!=='全部')list=list.filter(function(p){return p.tag===tag});
  if(!list.length){feed.innerHTML='<div class="empty">该分类下暂无内容</div>'}
  list.forEach(function(p){
    var d=document.createElement('div');d.className='post';
    d.innerHTML='<div class="ptitle">'+p.t+'</div><div class="pbody">'+p.b+'</div><div class="pmeta"><span class="ptag">'+p.tag+'</span><span>'+new Date(p.t).toLocaleDateString('zh-CN')+'</span><button class="like">❤ '+p.likes+'</button></div>';
    d.querySelector('.like').onclick=function(){p.likes++;store.set(KEY,JSON.stringify(posts));render()};
    feed.appendChild(d);
  });
}
document.getElementById('write').onclick=function(){
  var c=document.getElementById('composer');
  c.hidden=!c.hidden;
  if(!c.hidden)document.getElementById('pt').focus();
};
document.getElementById('pub').onclick=function(){
  var pt=document.getElementById('pt').value.trim();
  var pb=document.getElementById('pb').value.trim();
  var pc=document.getElementById('pc').value;
  if(!pt||!pb)return;
  posts.push({id:Date.now(),t:pt,b:pb,tag:pc,likes:0,t:Date.now()});
  store.set(KEY,JSON.stringify(posts));
  document.getElementById('pt').value='';document.getElementById('pb').value='';
  document.getElementById('composer').hidden=true;
  tag='全部';render();
};
render();
`,
  },
})

const habit: AppTemplate = T('habit', {
  name: '习惯养成',
  category: '健康 / 自律',
  emoji: '🌱',
  defaultAccent: '#f59e0b',
  keywords: ['习惯', '打卡', '自律', '坚持', '早起', '阅读', '冥想', '戒烟', '早睡', '习惯养成', 'habit', '目标'],
  description: '一款习惯打卡应用,助你长期坚持并追踪连续记录。',
  audience: '希望养成好习惯、告别拖延的自律人士',
  features: ['自定义习惯', '每日打卡', '连续天数统计', '本周完成度网格'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['HabitCard 习惯卡片', 'WeekGrid 周网格', 'StreakBadge 连续徽章'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">🌱</span><div><h1>{{name}}</h1><p class="sub">小习惯,大改变</p></div></div>
    <div class="today">今日 <b id="pct">0%</b></div>
  </header>
  <div class="add">
    <input id="inp" placeholder="添加一个新习惯,如:每天阅读 30 分钟" />
    <button id="add">添加</button>
  </div>
  <ul class="list" id="list"></ul>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#f59e0b;--accent-2:#fbbf24;--accent-soft:rgba(245,158,11,.14);--accent-soft-2:rgba(245,158,11,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1100px 500px at 80% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:640px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.today{color:var(--muted);font-size:13px}.today b{color:var(--accent-2);font-size:18px}
.add{display:flex;gap:10px;margin-bottom:16px}
.add input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:13px 15px;color:var(--text);font-size:14px;outline:none}
.add input:focus{border-color:var(--accent)}
.add button{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border:none;border-radius:12px;padding:0 20px;font-weight:600;cursor:pointer}
.list{list-style:none;display:flex;flex-direction:column;gap:10px}
.hc{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:16px 18px}
.hc .top{display:flex;align-items:center;gap:12px}
.hc .nm{font-size:15px;font-weight:700;flex:1}
.hc .streak{font-size:12px;color:var(--accent-2);background:var(--accent-soft);padding:3px 10px;border-radius:999px;white-space:nowrap}
.week{display:flex;gap:6px;margin-top:14px}
.wd{flex:1;aspect-ratio:1;border-radius:8px;background:var(--card2);display:grid;place-items:center;font-size:11px;color:var(--muted);transition:.2s}
.wd.on{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff}
.wd.tick{outline:2px solid var(--accent);outline-offset:1px}
.del{background:transparent;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:2px 6px;border-radius:6px}
.del:hover{color:#f87171}
.empty{color:var(--muted);text-align:center;padding:40px 0;font-size:14px;border:1px dashed var(--border);border-radius:16px}
`,
    js: `
var KEY='atoms.habit.v1';
var data=JSON.parse(store.get(KEY,'[]'));
var DAYS=['日','一','二','三','四','五','六'];
function dkey(t){var d=new Date(t);return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()}
function render(){
  var list=document.getElementById('list');list.innerHTML='';
  if(!data.length){list.innerHTML='<li class="empty">还没有习惯,添加一个开始吧</li>'}
  var todayKey=dkey(Date.now());
  var doneCount=0;
  data.forEach(function(h){
    var li=document.createElement('li');li.className='hc';
    var done=h.days.indexOf(todayKey)>-1;
    if(done)doneCount++;
    var top=document.createElement('div');top.className='top';
    var nm=document.createElement('div');nm.className='nm';nm.textContent=h.name;
    var st=document.createElement('div');st.className='streak';st.textContent='🔥 '+h.streak+' 天连续';
    var del=document.createElement('button');del.className='del';del.textContent='\\u00d7';
    del.onclick=function(){data=data.filter(function(x){return x!==h});store.set(KEY,JSON.stringify(data));render()};
    top.appendChild(nm);top.appendChild(st);top.appendChild(del);
    li.appendChild(top);
    var week=document.createElement('div');week.className='week';
    var now=new Date();
    for(var i=6;i>=0;i--){
      var d=new Date(now);d.setDate(now.getDate()-i);
      var key=dkey(d.getTime());
      var cell=document.createElement('div');cell.className='wd'+(h.days.indexOf(key)>-1?' on':'')+(key===todayKey?' tick':'');
      cell.textContent=DAYS[d.getDay()];
      cell.onclick=(function(k){return function(){toggle(h,k)}})(key);
      week.appendChild(cell);
    }
    li.appendChild(week);list.appendChild(li);
  });
  document.getElementById('pct').textContent=data.length?Math.round(doneCount/data.length*100)+'%':'0%';
}
function toggle(h,key){
  var i=h.days.indexOf(key);
  if(i>-1)h.days.splice(i,1);else h.days.push(key);
  h.days.sort();
  h.streak=calcStreak(h.days);
  store.set(KEY,JSON.stringify(data));render();
}
function calcStreak(days){
  var set={};days.forEach(function(d){set[d]=1});
  var streak=0,t=new Date();
  while(set[dkey(t.getTime())]){streak++;t=new Date(t.getTime()-86400000)}
  return streak;
}
document.getElementById('add').onclick=function(){
  var v=document.getElementById('inp').value.trim();if(!v)return;
  data.push({id:Date.now(),name:v,days:[],streak:0});
  store.set(KEY,JSON.stringify(data));
  document.getElementById('inp').value='';render();
};
document.getElementById('inp').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('add').onclick()});
render();
`,
  },
})

const pomodoro: AppTemplate = T('pomodoro', {
  name: '番茄钟',
  category: '效率工具',
  emoji: '🍅',
  defaultAccent: '#ef4444',
  keywords: ['番茄', '番茄钟', '番茄工作法', '专注', '倒计时', '计时', '计时器', 'pomodoro', '专注时钟', '时间管理', 'timer'],
  description: '一款遵循番茄工作法的专注计时应用,支持工作/休息循环与番茄统计。',
  audience: '需要提升专注力、告别拖延的学生与知识工作者',
  features: ['25/5/15 分钟经典番茄循环', '开始 / 暂停 / 重置 / 跳过', '今日番茄数统计', '专注 / 短休 / 长休三模式', '自定义时长,本地持久化'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', 'LocalStorage'],
  components: ['TimerRing 计时圆环', 'ModeSwitch 模式切换', 'PomodoroCounter 番茄统计', 'SettingsPanel 时长设置'],
  part: {
    html: `
<div class="app">
  <header class="hdr">
    <div class="brand"><span class="logo">🍅</span><div><h1>{{name}}</h1><p class="sub">一次只做一件事 · 保持专注</p></div></div>
    <div class="count"><span>🍅</span> × <b id="count">0</b></div>
  </header>
  <div class="modes">
    <button class="mode active" data-m="work">专注</button>
    <button class="mode" data-m="short">短休息</button>
    <button class="mode" data-m="long">长休息</button>
  </div>
  <div class="stage">
    <svg class="ring" viewBox="0 0 220 220">
      <circle class="track" cx="110" cy="110" r="98" />
      <circle class="bar" id="bar" cx="110" cy="110" r="98" />
    </svg>
    <div class="time">
      <div class="mm" id="time">25:00</div>
      <div class="label" id="label">专注中,保持节奏</div>
    </div>
  </div>
  <div class="ctrl">
    <button class="btn reset" id="reset" title="重置">↺</button>
    <button class="btn start" id="start">开始</button>
    <button class="btn skip" id="skip" title="跳过">⏭</button>
  </div>
  <div class="settings">
    <div class="set"><span>专注</span><input id="set-work" type="number" min="1" max="120"><span class="u">分钟</span></div>
    <div class="set"><span>短休</span><input id="set-short" type="number" min="1" max="60"><span class="u">分钟</span></div>
    <div class="set"><span>长休</span><input id="set-long" type="number" min="1" max="60"><span class="u">分钟</span></div>
  </div>
</div>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d;--accent:#ef4444;--accent-2:#f87171;--accent-soft:rgba(239,68,68,.14);--accent-soft-2:rgba(239,68,68,.08)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1000px 520px at 50% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text);min-height:100vh;padding:28px 16px}
.app{max-width:520px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.brand{display:flex;gap:12px;align-items:center}
.logo{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;background:linear-gradient(135deg,var(--accent),var(--accent-2))}
h1{font-size:21px}
.sub{color:var(--muted);font-size:12.5px;margin-top:2px}
.count{background:var(--card);border:1px solid var(--border);padding:8px 16px;border-radius:999px;font-size:14px;color:var(--muted)}
.count b{color:var(--accent-2);font-size:18px;margin-left:2px;font-variant-numeric:tabular-nums}
.modes{display:flex;gap:8px;justify-content:center;margin-bottom:6px}
.mode{background:var(--card);border:1px solid var(--border);color:var(--muted);padding:8px 20px;border-radius:999px;font-size:13px;cursor:pointer;transition:.15s}
.mode.active{background:var(--accent-soft);border-color:var(--accent);color:var(--accent-2);font-weight:600}
.stage{position:relative;width:264px;height:264px;margin:26px auto 22px}
.ring{width:100%;height:100%;transform:rotate(-90deg)}
.track{fill:none;stroke:var(--card2);stroke-width:12}
.bar{fill:none;stroke:var(--accent);stroke-width:12;stroke-linecap:round;transition:stroke-dashoffset 1s linear}
.time{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
.mm{font-size:52px;font-weight:800;letter-spacing:.5px;font-variant-numeric:tabular-nums}
.label{color:var(--muted);font-size:13px}
.ctrl{display:flex;align-items:center;justify-content:center;gap:16px}
.btn{border:none;cursor:pointer;font-weight:600;transition:.15s;font-family:inherit}
.btn.reset,.btn.skip{width:48px;height:48px;border-radius:50%;background:var(--card);border:1px solid var(--border);color:var(--muted);font-size:17px}
.btn.reset:hover,.btn.skip:hover{color:var(--accent-2);border-color:var(--accent)}
.btn.start{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;border-radius:999px;padding:14px 48px;font-size:16px;box-shadow:0 12px 32px var(--accent-soft)}
.btn.start:hover{filter:brightness(1.08)}
.btn.start.running{background:var(--card2);color:var(--text);border:1px solid var(--border);box-shadow:none}
.settings{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px}
.set{display:flex;align-items:center;gap:8px;background:var(--card);border:1px solid var(--border);border-radius:12px;padding:10px 14px}
.set>span{color:var(--muted);font-size:12.5px}
.set input{width:46px;background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:6px;color:var(--text);text-align:center;font-size:14px;outline:none;font-variant-numeric:tabular-nums}
.set input:focus{border-color:var(--accent)}
.set .u{color:var(--muted);font-size:11px}
`,
    js: `
var KEY='atoms.pomo.v1';
var cfg={work:25,short:5,long:15,count:0};
try{var saved=JSON.parse(store.get(KEY,'{}'));for(var k in saved)cfg[k]=saved[k]}catch(e){}
var M={work:{label:'专注中,保持节奏'},short:{label:'休息一下,喝口水'},long:{label:'好好放松,准备下一轮'}};
var mode='work',total=cfg.work*60,remaining=total,running=false,tickId=null;
var R=98,CIRC=2*Math.PI*R;
var bar=document.getElementById('bar');
bar.style.strokeDasharray=CIRC.toFixed(2);
function save(){store.set(KEY,JSON.stringify(cfg))}
function fmt(s){var mm=Math.floor(s/60),ss=s%60;return (mm<10?'0':'')+mm+':'+(ss<10?'0':'')+ss}
function paint(){
  document.getElementById('time').textContent=fmt(remaining);
  bar.style.strokeDashoffset=(CIRC*(1-remaining/total)).toFixed(2);
  document.getElementById('label').textContent=M[mode].label;
}
function renderCount(){document.getElementById('count').textContent=cfg.count}
function setModes(){Array.prototype.forEach.call(document.querySelectorAll('.mode'),function(b){b.classList.toggle('active',b.getAttribute('data-m')===mode)})}
function switchMode(m){mode=m;total=cfg[m]*60;remaining=total;setModes();paint()}
function beep(){try{var A=window.AudioContext||window.webkitAudioContext;if(!A)return;var ac=new A();var o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.frequency.value=880;g.gain.value=0.12;o.start();setTimeout(function(){try{o.stop();ac.close()}catch(e){}},200)}catch(e){}}
function start(){
  if(running)return;running=true;
  document.getElementById('start').textContent='暂停';
  document.getElementById('start').classList.add('running');
  tickId=setInterval(function(){
    remaining--;
    if(remaining<=0){remaining=0;paint();beep();complete();}
    else paint();
  },1000);
}
function pause(){
  running=false;if(tickId)clearInterval(tickId);tickId=null;
  document.getElementById('start').textContent='继续';
  document.getElementById('start').classList.remove('running');
}
function complete(){
  var was=mode;
  if(was==='work'){cfg.count++;save();renderCount()}
  var next=(was==='work')?((cfg.count%4===0)?'long':'short'):'work';
  switchMode(next);
}
document.getElementById('start').onclick=function(){if(running)pause();else start()};
document.getElementById('reset').onclick=function(){pause();remaining=total;paint();document.getElementById('start').textContent='开始'};
document.getElementById('skip').onclick=function(){pause();var next=mode==='work'?'short':'work';switchMode(next);document.getElementById('start').textContent='开始'};
Array.prototype.forEach.call(document.querySelectorAll('.mode'),function(b){b.onclick=function(){pause();switchMode(b.getAttribute('data-m'));document.getElementById('start').textContent='开始'}});
['work','short','long'].forEach(function(m){
  var el=document.getElementById('set-'+m);el.value=cfg[m];
  el.onchange=function(){
    var v=parseInt(el.value,10);
    if(!v||v<1||v>180){el.value=cfg[m];return}
    cfg[m]=v;save();
    if(mode===m){total=v*60;remaining=v*60;paint()}
  };
});
renderCount();setModes();paint();
`,
  },
})

const generic: AppTemplate = T('generic', {
  name: '全新应用',
  category: '通用',
  emoji: '✨',
  defaultAccent: '#7c5cff',
  keywords: [],
  description: '一款为你量身打造的应用首页,包含核心功能入口与介绍。',
  audience: '通用用户',
  features: ['现代应用首页', '核心功能入口', '响应式布局', '行动号召按钮'],
  stack: ['HTML5', 'CSS3', 'Vanilla JS', '响应式布局'],
  components: ['Hero 首屏', 'FeatureGrid 功能网格', 'Navbar 导航栏'],
  part: {
    html: `
<nav class="nav"><div class="nb"><span class="logo">✨</span><b>{{name}}</b></div><button class="btn">开始使用</button></nav>
<header class="hero">
  <span class="badge">🎉 欢迎来到 {{name}}</span>
  <h1>你的应用,<em>已经就绪</em></h1>
  <p class="lead">这是一个由 AI 团队为你生成的完整应用。接下来,你可以继续提出需求,让 AI 迭代优化它。</p>
  <div class="cta"><button class="btn solid">立即体验</button><button class="btn ghost">了解更多</button></div>
</header>
<section class="feat">
  <div class="f"><div class="fi">⚡</div><h3>快速</h3><p>秒级响应,流畅体验。</p></div>
  <div class="f"><div class="fi">🧩</div><h3>可扩展</h3><p>清晰架构,易于迭代。</p></div>
  <div class="f"><div class="fi">🎨</div><h3>精致</h3><p>现代设计,视觉统一。</p></div>
</section>
<footer class="foot">© 2026 {{name}} · 由 Atoms AI 团队构建</footer>`,
    css: `
:root{--bg:#0b0d14;--card:#141824;--card2:#181d2c;--text:#e7eaf3;--muted:#8a92a6;--border:#232a3d}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;background:radial-gradient(1100px 500px at 50% -10%,var(--accent-soft-2),transparent),var(--bg);color:var(--text)}
.nav{max-width:1000px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;padding:22px 24px}
.nb{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:700}
.logo{color:var(--accent)}
.btn{border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;background:var(--accent-soft);color:var(--accent-2)}
.btn.solid{background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff}
.btn.ghost{background:transparent;border:1px solid var(--border)}
.hero{max-width:1000px;margin:80px auto;padding:0 24px;text-align:center}
.badge{display:inline-block;background:var(--accent-soft);color:var(--accent-2);padding:6px 16px;border-radius:999px;font-size:13px;margin-bottom:22px}
h1{font-size:50px;font-weight:800;letter-spacing:-1px;line-height:1.15}
h1 em{font-style:normal;background:linear-gradient(135deg,var(--accent),var(--accent-2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:var(--muted);font-size:17px;max-width:540px;margin:20px auto 28px;line-height:1.7}
.cta{display:flex;gap:12px;justify-content:center}
.feat{max-width:1000px;margin:60px auto;padding:0 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.f{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:26px;text-align:center}
.fi{font-size:34px;margin-bottom:14px}
.f h3{font-size:16px;margin-bottom:8px}
.f p{color:var(--muted);font-size:13.5px;line-height:1.6}
.foot{max-width:1000px;margin:0 auto;padding:40px 24px;border-top:1px solid var(--border);color:var(--muted);font-size:13px;text-align:center}
@media(max-width:760px){.feat{grid-template-columns:1fr}h1{font-size:36px}}
`,
    js: `
// 已就绪。你可以通过对话继续让 AI 迭代这个应用。
console.log('应用已启动');
`,
  },
})

export const TEMPLATES: AppTemplate[] = [todo, notes, weather, fitness, expense, dashboard, landing, blog, habit, pomodoro, generic]