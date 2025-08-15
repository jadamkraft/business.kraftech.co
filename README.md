# Kraftech Consulting Site

## Local Blog Build

1. Install dependencies:
   ```bash
   npm install
   ```
2. Generate static blog pages and update the index:
   ```bash
   npm run build
   ```

Markdown posts live under `content/blog/`. Published posts render to static HTML files in the repository root.

## Homepage featured video (build-time)

Set `featured: true` on exactly one post to surface it on the homepage. If multiple posts are marked featured, the newest one is used. During `npm run build`, the script updates `index.html`'s `#video-series` section with the post's title, video, and summary. When `blog.html` exists, a "See more case studies →" link points to `/blog`.

