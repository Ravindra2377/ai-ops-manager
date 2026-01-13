/**
 * Sanitize HTML email content for safe WebView rendering
 * Removes scripts, dangerous attributes, and tracking pixels
 */
export function sanitizeEmailHtml(html) {
    if (!html) return '';

    let sanitized = html;

    // Remove script tags and their content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove dangerous event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

    // Optional: Remove tracking pixels (1x1 images)
    sanitized = sanitized.replace(/<img[^>]*width\s*=\s*["']?1["']?[^>]*height\s*=\s*["']?1["']?[^>]*>/gi, '');
    sanitized = sanitized.replace(/<img[^>]*height\s*=\s*["']?1["']?[^>]*width\s*=\s*["']?1["']?[^>]*>/gi, '');

    // Wrap in a styled container for better mobile rendering
    const wrappedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #1C1C1E;
                    padding: 16px;
                    margin: 0;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                }
                img {
                    max-width: 100%;
                    height: auto;
                }
                a {
                    color: #007AFF;
                    text-decoration: none;
                }
                table {
                    max-width: 100%;
                    border-collapse: collapse;
                }
                * {
                    max-width: 100%;
                }
            </style>
        </head>
        <body>
            ${sanitized}
        </body>
        </html>
    `;

    return wrappedHtml;
}

/**
 * Extract plain text from HTML (fallback if bodyHtml is empty)
 */
export function htmlToPlainText(html) {
    if (!html) return '';
    
    return html
        .replace(/<style[^>]*>.*?<\/style>/gi, '')
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
