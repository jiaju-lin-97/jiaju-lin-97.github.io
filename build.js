const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir);
}

// Configure marked with custom renderer for images
const renderer = new marked.Renderer();

// Override image rendering to handle paths
renderer.image = function (href, title, text) {
    // If the image path is relative (doesn't start with http/https)
    if (href && !/^https?:\/\//i.test(href)) {
        // Clean up the href path
        href = href.replace(/^\.\//, '').replace(/^\//, '');
        // Prepend the blogs directory
        href = `blogs/${href}`;
    }

    return `<img src="${href}" alt="${text || ''}" ${title ? `title="${title}"` : ''} class="blog-image">`;
};

// Configure marked
marked.use({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    headerPrefix: 'heading-',
    smartLists: true,
    smartypants: true,
    xhtml: true,
    renderer: renderer
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
    <style>
        /* Markdown Typography */
        .blog-content h1 { font-size: 2.5em; font-weight: 700; margin: 1.5em 0 0.5em; color: #2d3748; }
        .blog-content h2 { font-size: 2em; font-weight: 600; margin: 1.4em 0 0.4em; color: #2d3748; }
        .blog-content h3 { font-size: 1.75em; font-weight: 600; margin: 1.3em 0 0.4em; color: #2d3748; }
        .blog-content h4 { font-size: 1.5em; font-weight: 500; margin: 1.2em 0 0.4em; color: #2d3748; }
        .blog-content h5 { font-size: 1.25em; font-weight: 500; margin: 1.1em 0 0.4em; color: #2d3748; }
        .blog-content h6 { font-size: 1.1em; font-weight: 500; margin: 1em 0 0.4em; color: #2d3748; }
        
        /* Paragraph and text formatting */
        .blog-content p { 
            margin: 1em 0; 
            line-height: 1.7;
            color: #4a5568;
        }
        .blog-content strong { 
            font-weight: 600; 
            color: #2d3748;
        }
        .blog-content em { 
            font-style: italic; 
        }
        
        /* Lists */
        .blog-content ul, .blog-content ol { 
            margin: 1em 0; 
            padding-left: 2em;
            color: #4a5568;
        }
        .blog-content li { 
            margin: 0.5em 0;
            line-height: 1.6;
        }
        .blog-content ul li { list-style-type: disc; }
        .blog-content ol li { list-style-type: decimal; }
        
        /* Blockquotes */
        .blog-content blockquote {
            border-left: 4px solid #cbd5e0;
            padding: 0.5em 1em;
            margin: 1em 0;
            background: #f7fafc;
            color: #4a5568;
            font-style: italic;
        }
        
        /* Code blocks */
        .blog-content code {
            background: #f7fafc;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            color: #d53f8c;
        }
        
        .blog-content pre {
            background: #2d3748;
            color: #e2e8f0;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1em 0;
        }
        
        .blog-content pre code {
            background: transparent;
            padding: 0;
            color: inherit;
            font-size: 0.9em;
            line-height: 1.5;
        }
        
        /* Links */
        .blog-content a {
            color: #4299e1;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s ease;
        }
        
        .blog-content a:hover {
            border-bottom-color: currentColor;
        }
        
        /* Tables */
        .blog-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        
        .blog-content th, .blog-content td {
            border: 1px solid #e2e8f0;
            padding: 0.5em 1em;
            text-align: left;
        }
        
        .blog-content th {
            background: #f7fafc;
            font-weight: 600;
        }
        
        /* Horizontal Rule */
        .blog-content hr {
            border: none;
            border-top: 2px solid #e2e8f0;
            margin: 2em 0;
        }
        
        /* Images */
        .blog-content img.blog-image {
            max-width: 100%;
            height: auto;
            margin: 1.5em auto;
            display: block;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease-in-out;
        }
        
        .blog-content img.blog-image:hover {
            transform: scale(1.02);
        }
        
        /* Task Lists */
        .blog-content input[type="checkbox"] {
            margin-right: 0.5em;
        }
        
        /* Footnotes */
        .blog-content .footnotes {
            margin-top: 2em;
            padding-top: 1em;
            border-top: 1px solid #e2e8f0;
            font-size: 0.9em;
            color: #718096;
        }
    </style>
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