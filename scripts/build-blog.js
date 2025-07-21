const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const blogDir = path.join(__dirname, '..', 'content', 'blog');
const blogPage = path.join(__dirname, '..', 'blog.html');

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const files = fs.existsSync(blogDir) ? fs.readdirSync(blogDir) : [];
let posts = files.filter(f => f.endsWith('.md')).map(file => {
  const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
  const { data } = matter(content);
  return { ...data, file };
}).filter(p => p.published);

posts.sort((a, b) => new Date(b.date) - new Date(a.date));

const listItems = posts.map(post => {
  const fileName = post.file.replace(/\.md$/, '.html');
  const featuredBadge = post.featured ? '<span class="badge">Featured</span>' : '';
  return `      <li${post.featured ? ' class="featured"' : ''}>\n        <a href="${fileName}">${post.title}</a>\n        <span class="post-date">${formatDate(post.date)}</span> ${featuredBadge}\n      </li>`;
}).join('\n');

let html = fs.readFileSync(blogPage, 'utf8');
html = html.replace(/<ul class="post-list">[\s\S]*?<\/ul>/, `<ul class="post-list">\n${listItems}\n    </ul>`);
fs.writeFileSync(blogPage, html);

