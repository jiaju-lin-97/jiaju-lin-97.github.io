const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Configure marked
marked.use({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    headerPrefix: 'heading-',
    smartLists: true,
    smartypants: true,
    xhtml: true
});

// Function to convert markdown to HTML
function convertMarkdownToHtml(markdownContent, filePath) {
    // Extract front matter if it exists (YAML-style metadata)
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdownContent.match(frontMatterRegex);

    let metadata = {};
    let content = markdownContent;

    if (match) {
        const [_, frontMatter, remainingContent] = match;
        // Parse simple key-value pairs from front matter
        frontMatter.split('\n').forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value) {
                metadata[key.trim()] = value.join(':').trim();
            }
        });
        content = remainingContent;
    }

    // Convert Markdown to HTML
    const htmlContent = marked.parse(content);

    // Create the full HTML document
    const postId = path.basename(filePath, '.md');
    return `<!DOCTYPE html>
<div class="blog-post" id="blog-${postId}">
    <h2 class="blog-title">${metadata.title || 'Untitled Post'}</h2>
    <p class="blog-date">${metadata.date || new Date().toLocaleDateString()}</p>
    <div class="blog-content">${htmlContent}</div>
    <div class="blog-tags">
        ${(metadata.tags || '').split(',').map(tag =>
        `<span class="blog-tag">${tag.trim()}</span>`
    ).join('')}
    </div>
    <div class="comments-section">
        <h3>Comments</h3>
        <div class="comment-form">
            <h4>Leave a Comment</h4>
            <form id="comment-form-${postId}">
                <input type="text" placeholder="Your Name" required id="name-${postId}">
                <textarea placeholder="Your Comment" required id="comment-text-${postId}"></textarea>
                <button type="submit">Submit Comment</button>
            </form>
        </div>
    </div>
</div>`;
}

// Process all markdown files in the blogs directory
const blogsDir = path.join(__dirname, 'blogs');
fs.readdirSync(blogsDir).forEach(file => {
    if (file.endsWith('.md')) {
        const filePath = path.join(blogsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const html = convertMarkdownToHtml(content, file);
        fs.writeFileSync(path.join(buildDir, file.replace('.md', '.html')), html);
        console.log(`Converted ${file} to HTML`);
    }
}); 