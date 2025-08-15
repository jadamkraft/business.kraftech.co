const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const MarkdownIt = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const root = path.join(__dirname, '..');
const blogDir = path.join(root, 'content', 'blog');
const blogListPage = path.join(root, 'blog.html');
const templatePath = path.join(root, 'templates', 'post-template.html');

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
});

// Conservative sanitizer config
const sanitize = (html) =>
  sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1','h2','h3','iframe','figure','figcaption']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'loading', 'decoding'],
      iframe: ['src', 'title', 'allow', 'allowfullscreen', 'frameborder'],
      '*': ['id', 'class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
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
if (!fs.existsSync(blogListPage)) throw new Error('Missing blog.html list page');

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
  const tagsText = Array.isArray(data.tags) ? data.tags.join(', ') : '';
  const summaryText = (data.summary || '').toString();
  const videoEmbed = data.video
    ? `<div class="video-wrapper" style="margin:2rem 0;">
         <iframe src="${data.video}" title="Video" allow="autoplay; encrypted-media" allowfullscreen frameborder="0"></iframe>
       </div>`
    : '';

  let html = template
    .replace(/<title>.*?<\/title>/, `<title>${data.title} | Kraftech Consulting<\/title>`)
    .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${summaryText.replace(/"/g,'&quot;')}">`)
    .replace(/<h1>.*?<\/h1>/, `<h1>${data.title}<\/h1>`)
    .replace(/<p class="post-date">.*?<\/p>/, `<p class="post-date">${formatDate(data.date)}${tagsText ? ` • Tags: ${tagsText}` : ''}<\/p>`)
    .replace(/<p>Post summary.*?<\/p>/, summaryText ? `<p>${summaryText}<\/p>` : '')
    .replace(/<div class="video-wrapper"[\s\S]*?<\/div>/, videoEmbed || '')
    .replace(/<p>Full article content[\s\S]*?<\/p>/, `<div class="post-body">${safeBody}<\/div>`);

  fs.writeFileSync(postPath, html, 'utf8');

  posts.push({
    title: data.title,
    date: data.date,
    featured: !!data.featured,
    file: outFile
  });
}

// Sort newest first
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Build list items
const listItems = posts.map(p => {
  const badge = p.featured ? '<span class="badge">Featured</span>' : '';
  return `      <li${p.featured ? ' class="featured"' : ''}>
        <a href="${p.file}">${p.title}</a>
        <span class="post-date">${formatDate(p.date)}</span> ${badge}
      </li>`;
}).join('\n');

// Replace the UL in blog.html
let listHtml = fs.readFileSync(blogListPage, 'utf8');
listHtml = listHtml.replace(/<ul class="post-list">[\s\S]*?<\/ul>/, `<ul class="post-list">\n${listItems}\n    </ul>`);
fs.writeFileSync(blogListPage, listHtml, 'utf8');

console.log(`Built ${posts.length} post(s) and updated blog.html`);
