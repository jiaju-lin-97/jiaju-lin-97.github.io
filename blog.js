// Add marked.js library at the top
const markedScript = document.createElement('script');
markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(markedScript);

// Configure marked.js when it's loaded
function configureMarked(basePath = '') {
    if (window.marked) {
        // Create a custom renderer
        const renderer = new marked.Renderer();

        // Override image rendering to handle relative paths
        renderer.image = function (href, title, text) {
            try {
                console.log('Raw href:', href);
                console.log('Raw href type:', typeof href);
                console.log('Raw href keys:', href ? Object.keys(href) : 'null');

                // Handle href object
                if (typeof href === 'object' && href !== null) {
                    // Try different properties that might contain the path
                    href = href.href || href.src || href.raw || href.path || href.toString();
                }

                // Ensure href is a string
                href = String(href || '').trim();
                console.log('Processed href:', href);

                // Extract the actual image path from Markdown syntax if needed
                const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
                if (markdownImageRegex.test(href)) {
                    const match = href.match(markdownImageRegex);
                    href = match[1];
                    console.log('Extracted image path from Markdown:', href);
                }

                // If the image path is relative (doesn't start with http/https)
                if (href && !/^https?:\/\//i.test(href)) {
                    // Clean up the href path
                    const cleanHref = href.replace(/^\.\//, '').replace(/^\//, '');
                    console.log('Cleaned href:', cleanHref);

                    // Always use the blogs directory as the base path
                    href = `blogs/${cleanHref}`;
                    console.log('Final image path:', href);
                }

                // Create responsive image with loading and error handling
                const imgElement = `<img src="${href}" alt="${text || ''}" 
                         class="blog-image" 
                         loading="lazy" 
                         onerror="console.error('Failed to load image:', this.src); this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg=='; this.title='Failed to load image';"
                         ${title ? `title="${title}"` : ''}>`;
                console.log('Generated image element:', imgElement);
                return imgElement;
            } catch (error) {
                console.error('Error processing image:', error);
                return ''; // Return empty string if image processing fails
            }
        };

        marked.use({
            gfm: true, // Enable GitHub Flavored Markdown
            breaks: true, // Add <br> on single line breaks
            headerIds: true, // Add ids to headers
            mangle: false, // Don't escape HTML
            headerPrefix: 'heading-', // Prefix for header ids
            smartLists: true, // Use smarter list behavior
            smartypants: true, // Use smart punctuation
            xhtml: true, // Close single tags with a slash
            renderer: renderer // Use our custom renderer
        });
    }
}

// Blog comment system with local storage
document.addEventListener('DOMContentLoaded', function () {
    // Wait for marked.js to load and configure it with empty base path initially
    const checkMarked = setInterval(() => {
        if (window.marked) {
            configureMarked('');
            clearInterval(checkMarked);
        }
    }, 100);

    // Initialize containers if they don't exist
    initializeContainers();

    // Load blog posts from the blogs directory
    loadBlogPostsFromFiles();

    // Load existing comments from local storage
    loadCommentsFromStorage();

    // Add event listener for the back button
    const backButton = document.createElement('button');
    backButton.className = 'back-button';
    backButton.textContent = '← Back to Blog List';
    backButton.onclick = showBlogList;
    document.querySelector('.blog-container').insertBefore(backButton, document.querySelector('.blog-list'));

    // Get all comment forms
    const commentForms = document.querySelectorAll('[id^="comment-form-"]');

    // Add submit event listener to each form
    commentForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get the form ID number (which corresponds to the blog post ID)
            const postId = this.id.split('-')[2];

            // Get input values
            const nameInput = document.getElementById(`name-${postId}`);
            const commentInput = document.getElementById(`comment-text-${postId}`);

            if (nameInput.value.trim() === '' || commentInput.value.trim() === '') {
                alert('Please fill out all fields');
                return;
            }

            // Get current date
            const now = new Date();
            const dateString = `${now.toLocaleString('default', { month: 'long' })} ${now.getDate()}, ${now.getFullYear()}`;

            // Create comment object
            const comment = {
                author: nameInput.value,
                date: dateString,
                text: commentInput.value,
                timestamp: now.getTime() // For sorting
            };

            // Add comment to the page
            addCommentToPage(postId, comment);

            // Save comment to local storage
            saveCommentToStorage(postId, comment);

            // Clear the form
            nameInput.value = '';
            commentInput.value = '';

            // Show confirmation
            alert('Comment posted successfully!');
        });
    });
});

// Function to initialize containers
function initializeContainers() {
    const blogContainer = document.querySelector('.blog-container');
    if (!blogContainer) {
        console.error('Blog container not found!');
        return;
    }

    // Create blog list if it doesn't exist
    let blogList = blogContainer.querySelector('.blog-list');
    if (!blogList) {
        blogList = document.createElement('div');
        blogList.className = 'blog-list';
        blogContainer.appendChild(blogList);
    }

    // Create content container if it doesn't exist
    let contentContainer = blogContainer.querySelector('.blog-content-container');
    if (!contentContainer) {
        contentContainer = document.createElement('div');
        contentContainer.className = 'blog-content-container';
        contentContainer.style.display = 'none';
        blogContainer.appendChild(contentContainer);
    }
}

// Function to load blog posts from files in the blogs directory
async function loadBlogPostsFromFiles() {
    const blogContainer = document.querySelector('.blog-container');
    const blogList = document.querySelector('.blog-list');
    const noBlogsMessage = document.querySelector('.no-blogs');

    try {
        // List of blog post files to load (you can add more as needed)
        const blogFiles = [
            { path: 'build/LLM_behaviors.html', type: 'html', originalPath: 'blogs/LLM_behaviors.md' }
            // You can add more blog posts here
        ];

        // If there are blog files to load, remove the "no blogs" message
        if (blogFiles.length > 0 && noBlogsMessage) {
            noBlogsMessage.style.display = 'none';
        }

        // Load each blog file
        for (const file of blogFiles) {
            try {
                console.log(`Attempting to load blog post from ${file.path}...`);
                console.log(`Current window location: ${window.location.href}`);
                const absolutePath = new URL(file.path, window.location.href).href;
                console.log(`Resolved absolute URL: ${absolutePath}`);

                // Fetch the blog post content
                const response = await fetch(file.path);
                console.log(`Fetch response status: ${response.status}`);
                console.log(`Fetch response headers:`, Object.fromEntries([...response.headers]));

                if (!response.ok) {
                    console.error(`Failed to load blog post from ${file.path}: ${response.status} ${response.statusText}`);
                    continue;
                }

                const content = await response.text();
                let blogPost;

                if (file.type === 'html') {
                    // Parse the HTML content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');
                    blogPost = doc.querySelector('.blog-post');
                } else if (file.type === 'markdown') {
                    blogPost = await convertMarkdownToBlogPost(content, file.originalPath || file.path);
                }

                if (!blogPost) {
                    console.error(`No blog post found in ${file.path}`);
                    continue;
                }

                // Create a preview item for the blog list
                const previewItem = createBlogPreview(blogPost, file.originalPath || file.path);
                blogList.appendChild(previewItem);

                // Store the full blog post content
                const contentContainer = document.querySelector('.blog-content-container');
                blogPost.style.display = 'none';
                contentContainer.appendChild(blogPost);
            } catch (error) {
                console.error(`Error loading blog post from ${file.path}:`, error);
            }
        }

        // Setup event listeners for the loaded blog posts
        setupBlogPosts();
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

// Function to convert Markdown content to a blog post element
async function convertMarkdownToBlogPost(markdownContent, filePath) {
    console.log('Converting markdown to blog post:', filePath);

    // Wait for marked to be loaded and configure it with the current file path
    while (!window.marked) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    configureMarked(filePath);

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

    console.log('Metadata:', metadata);
    console.log('Content length:', content.length);

    // Convert Markdown to HTML with proper configuration
    const htmlContent = marked.parse(content);
    console.log('HTML content length:', htmlContent.length);

    // Create blog post container
    const blogPost = document.createElement('div');
    blogPost.className = 'blog-post';
    blogPost.id = `blog-${filePath.split('/').pop().replace('.md', '')}`;

    // Add title and date from metadata or first heading
    const title = metadata.title || extractTitle(htmlContent) || 'Untitled Post';
    const date = metadata.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Add CSS for Markdown content
    const style = document.createElement('style');
    style.textContent = `
        .blog-content h1 { font-size: 2em; font-weight: bold; margin: 1em 0 0.5em; }
        .blog-content h2 { font-size: 1.75em; font-weight: bold; margin: 1em 0 0.5em; }
        .blog-content h3 { font-size: 1.5em; font-weight: bold; margin: 1em 0 0.5em; }
        .blog-content h4 { font-size: 1.25em; font-weight: bold; margin: 1em 0 0.5em; }
        .blog-content p { margin: 1em 0; }
        .blog-content ul, .blog-content ol { margin: 1em 0; padding-left: 2em; }
        .blog-content li { margin: 0.5em 0; }
        .blog-content blockquote {
            border-left: 4px solid #cbd5e0;
            padding-left: 1em;
            margin: 1em 0;
            color: #4a5568;
            font-style: italic;
        }
        .blog-content code {
            background: #f7fafc;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: monospace;
        }
        .blog-content pre {
            background: #f7fafc;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1em 0;
        }
        .blog-content pre code {
            background: none;
            padding: 0;
        }
        .blog-content a {
            color: #4299e1;
            text-decoration: underline;
        }
        .blog-content img.blog-image {
            max-width: 100%;
            height: auto;
            margin: 1em auto;
            display: block;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease-in-out;
        }
        .blog-content img.blog-image:hover {
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);

    const postContent = `
        <h2 class="blog-title">${title}</h2>
        <p class="blog-date">${date}</p>
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
                <form id="comment-form-${blogPost.id.split('-')[1]}">
                    <input type="text" placeholder="Your Name" required id="name-${blogPost.id.split('-')[1]}">
                    <textarea placeholder="Your Comment" required id="comment-text-${blogPost.id.split('-')[1]}"></textarea>
                    <button type="submit">Submit Comment</button>
                </form>
            </div>
        </div>
    `;

    blogPost.innerHTML = postContent;
    console.log('Blog post created:', blogPost.id);

    return blogPost;
}

// Helper function to extract title from HTML content
function extractTitle(htmlContent) {
    const match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    return match ? match[1] : null;
}

// Function to create a blog preview item
function createBlogPreview(blogPost, file) {
    const previewItem = document.createElement('div');
    previewItem.className = 'blog-list-item';

    const title = blogPost.querySelector('.blog-title').textContent;
    const date = blogPost.querySelector('.blog-date').textContent;
    const content = blogPost.querySelector('.blog-content').textContent;

    previewItem.innerHTML = `
        <h3 class="blog-list-title">${title}</h3>
        <p class="blog-list-date">${date}</p>
        <p class="blog-list-preview">${content}</p>
    `;

    previewItem.onclick = () => showBlogPost(file);

    return previewItem;
}

// Function to show a specific blog post
function showBlogPost(file) {
    const blogList = document.querySelector('.blog-list');
    const contentContainer = document.querySelector('.blog-content-container');
    const backButton = document.querySelector('.back-button');

    // Hide the list and show the content
    blogList.style.display = 'none';
    contentContainer.style.display = 'block';
    backButton.style.display = 'block';

    // Show the specific blog post
    const postId = file.split('/').pop().replace(/\.(html|md)$/, '');
    const blogPost = document.getElementById(`blog-${postId}`);
    if (blogPost) {
        blogPost.style.display = 'block';
    } else {
        console.error(`Blog post with ID blog-${postId} not found`);
    }
}

// Function to show the blog list
function showBlogList() {
    const blogList = document.querySelector('.blog-list');
    const contentContainer = document.querySelector('.blog-content-container');
    const backButton = document.querySelector('.back-button');

    // Show the list and hide the content
    blogList.style.display = 'block';
    contentContainer.style.display = 'none';
    backButton.style.display = 'none';

    // Hide all blog posts
    const blogPosts = document.querySelectorAll('.blog-post');
    blogPosts.forEach(post => post.style.display = 'none');
}

// Function to setup blog posts
function setupBlogPosts() {
    // Add IDs to blog posts if they don't have them
    const blogPosts = document.querySelectorAll('.blog-post');

    blogPosts.forEach((post, index) => {
        // If the post doesn't have an ID, assign one
        if (!post.id) {
            post.id = `blog-${index + 1}`;
        }

        // Find the comment form and make sure it has the correct ID
        const commentForm = post.querySelector('form');
        if (commentForm) {
            const postId = post.id.split('-')[1];
            commentForm.id = `comment-form-${postId}`;

            // Update the input IDs
            const nameInput = commentForm.querySelector('input[type="text"]');
            const commentInput = commentForm.querySelector('textarea');

            if (nameInput) nameInput.id = `name-${postId}`;
            if (commentInput) commentInput.id = `comment-text-${postId}`;
        }
    });
}

// Function to add a comment to the page
function addCommentToPage(postId, comment) {
    // Create new comment element
    const newComment = document.createElement('div');
    newComment.className = 'comment';

    // Set comment HTML
    newComment.innerHTML = `
        <p class="comment-author">${comment.author}</p>
        <p class="comment-date">${comment.date}</p>
        <p>${comment.text}</p>
    `;

    // Find the comments section for this post
    const commentsSection = document.querySelector(`#comment-form-${postId}`).closest('.comments-section');

    // Insert the new comment before the comment form
    commentsSection.insertBefore(newComment, document.querySelector(`#comment-form-${postId}`).parentNode);
}

// Function to save a comment to local storage
function saveCommentToStorage(postId, comment) {
    // Get existing comments from local storage
    let comments = JSON.parse(localStorage.getItem('blogComments')) || {};

    // Initialize array for this post if it doesn't exist
    if (!comments[postId]) {
        comments[postId] = [];
    }

    // Add new comment
    comments[postId].push(comment);

    // Save back to local storage
    localStorage.setItem('blogComments', JSON.stringify(comments));
}

// Function to load comments from local storage
function loadCommentsFromStorage() {
    // Get comments from local storage
    const comments = JSON.parse(localStorage.getItem('blogComments')) || {};

    // Loop through each post's comments
    for (const postId in comments) {
        // Sort comments by timestamp (oldest first)
        comments[postId].sort((a, b) => a.timestamp - b.timestamp);

        // Add each comment to the page
        comments[postId].forEach(comment => {
            // Check if the form exists before adding the comment
            const form = document.querySelector(`#comment-form-${postId}`);
            if (form) {
                addCommentToPage(postId, comment);
            }
        });
    }
}

// Function to clear all comments (for testing)
function clearAllComments() {
    localStorage.removeItem('blogComments');
    location.reload();
}

// Add image load event handler
document.addEventListener('DOMContentLoaded', function () {
    document.body.addEventListener('load', function (e) {
        if (e.target.tagName === 'IMG') {
            e.target.setAttribute('loaded', '');
        }
    }, true);
});

/*
BLOG POST TEMPLATE:

To add a new blog post, create a new file in the blogs directory with the following structure:

<div class="blog-post" id="blog-UNIQUE_ID"> <!-- Use a unique identifier -->
    <h2 class="blog-title">Your Blog Title</h2>
    <p class="blog-date">Month Day, Year</p>
    <div class="blog-content">
        <p>Your blog content paragraph 1.</p>
        <p>Your blog content paragraph 2.</p>
        <!-- Add more paragraphs as needed -->
    </div>
    <div class="blog-tags">
        <span class="blog-tag">Tag 1</span>
        <span class="blog-tag">Tag 2</span>
        <!-- Add more tags as needed -->
    </div>
    <div class="comments-section">
        <h3>Comments</h3>
        <!-- Comments will be loaded here -->
    </div>
</div>

Then add the file path to the blogFiles array in the loadBlogPostsFromFiles function.
*/ 