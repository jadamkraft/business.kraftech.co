const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const root = path.join(__dirname, '..');
const blogDir = path.join(root, 'content', 'blog');
const blogListPage = path.join(root, 'blog.html');
const indexPage = path.join(root, 'index.html');
const templatePath = path.join(root, 'templates', 'post-template.html');

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

// Conservative sanitizer config
const sanitize = (html) =>
  sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img','h1','h2','h3','iframe','figure','figcaption','time']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'loading', 'decoding'],
      iframe: ['src', 'title', 'allow', 'allowfullscreen', 'frameborder'],
      time: ['datetime'],
      '*': ['id', 'class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedIframeHostnames: ['iframe.videodelivery.net'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: { ...attribs, rel: 'noopener noreferrer' }
      })
    }
  });

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
if (!fs.existsSync(templatePath)) throw new Error('Missing templates/post-template.html');
const hadBlogList = fs.existsSync(blogListPage);
if (!hadBlogList) {
  console.warn('blog.html not found, creating a minimal placeholder.');
  const minimal = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog | Kraftech Consulting</title>
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <h1>Blog</h1>
  <main class="container">
    <ul class="post-list"></ul>
  </main>
</body>
</html>`;
  fs.writeFileSync(blogListPage, minimal, 'utf8');
}

const template = fs.readFileSync(templatePath, 'utf8');

const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
let posts = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const { data, content } = matter(raw);

  // Require at least title & date & published
  if (!data.title || !data.date || !data.published) continue;

  const bodyHtml = md.render(content);
  const safeBody = sanitize(bodyHtml);

  const postSlug = data.slug || slugify(data.title);
  const outFile = `${postSlug}.html`;
  const postPath = path.join(root, outFile);

  // Fill template placeholders
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const tagsHtml = tags.map(t => `<span class="tag-pill">${t}</span>`).join('');
  const summaryText = (data.summary || '').toString();
  const videoEmbed = data.video
    ? `<div class="video-wrapper">
         <iframe src="${data.video}" title="Video" allow="autoplay; encrypted-media" allowfullscreen frameborder="0"></iframe>
       </div>`
    : '';

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${data.title} | Kraftech Consulting<\/title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${summaryText.replace(/"/g,'&quot;')}">`)
    .replace(/<h1>.*?<\/h1>/, `<h1>${data.title}<\/h1>`)
    .replace(/<time datetime=".*?">.*?<\/time>/, `<time datetime="${(data.date instanceof Date) ? data.date.toISOString() : data.date}">${formatDate(data.date)}<\/time>`)
    .replace(/<span class="tags"><\/span>/, `<span class="tags">${tagsHtml}<\/span>`)
    .replace(/<p>Post summary paragraph.*?<\/p>/, summaryText ? `<p>${summaryText}<\/p>` : '')
    .replace(/<div class="video-wrapper">[\s\S]*?<\/div>/, videoEmbed || '')
    .replace(/<div class="post-body">[\s\S]*?<\/div>/, `<div class="post-body">${safeBody}<\/div>`);

  fs.writeFileSync(postPath, html, 'utf8');

  posts.push({
    title: data.title,
    date: (data.date instanceof Date) ? data.date.toISOString() : data.date,
    featured: !!data.featured,
    file: outFile,
    summary: summaryText,
    video: data.video
  });
}

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Build card grid
const cards = posts.map(p => `    <article class="post-card reveal">
      <div class="thumbnail">
        <!-- PLACEHOLDER: user will replace locally -->
        <img src="assets/logo.svg" alt="Kraftech logo" />
      </div>
      <div class="card-content">
        <h2><a href="${p.file}" rel="noopener noreferrer">${p.title}</a></h2>
        <p class="summary">${p.summary}</p>
        <time datetime="${new Date(p.date).toISOString()}">${formatDate(p.date)}</time>
      </div>
    </article>`).join('\n');

let blogHtml = fs.readFileSync(blogListPage, 'utf8');
const cardsMarkup = posts.length ? `\n${cards}\n    ` : '\n    <p>No posts yet</p>\n    ';
blogHtml = blogHtml.replace(/<div id="blog-cards" class="card-grid">[\s\S]*?<\/div>/, `<div id="blog-cards" class="card-grid">${cardsMarkup}<\/div>`);
fs.writeFileSync(blogListPage, blogHtml, 'utf8');

if (fs.existsSync(indexPage)) {
  const featuredPost = posts.find(p => p.featured);
  if (featuredPost) {
    let indexHtml = fs.readFileSync(indexPage, 'utf8');
    const summaryHtml = featuredPost.summary ? `        <p>${featuredPost.summary}</p>\n` : '';
    const videoSrc = (featuredPost.video && /^https:\/\/iframe\.videodelivery\.net\//.test(featuredPost.video))
      ? featuredPost.video
      : 'https://iframe.videodelivery.net/0d98c6ca61963ec7ebef82d7bf2636d0';
    const videoEmbed = `      <div class="video-wrapper">\n        <iframe src="${videoSrc}" allow="autoplay; encrypted-media" allowfullscreen frameborder="0"></iframe>\n      </div>\n`;
    const card = `      <article class="featured-card reveal">\n        <h2><a href="/${featuredPost.file}" rel="noopener noreferrer">${featuredPost.title}</a></h2>\n${summaryHtml}        <p><a href="/${featuredPost.file}" rel="noopener noreferrer">Read more &rarr;</a></p>\n      </article>\n`;
    const replacement = `    <div class="container">\n${videoEmbed}${card}    </div>`;
    indexHtml = indexHtml.replace(/<section id="video-series" class="video-series">[\s\S]*?<\/section>/, `<section id="video-series" class="video-series">\n${replacement}\n  </section>`);
    fs.writeFileSync(indexPage, indexHtml, 'utf8');
  }
}

console.log(`Built ${posts.length} post(s) and updated blog.html`);
