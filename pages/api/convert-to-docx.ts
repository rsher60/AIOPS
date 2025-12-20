import { NextApiRequest, NextApiResponse } from 'next';
import { remark } from 'remark';
import html from 'remark-html';
import HTMLtoDOCX from 'html-to-docx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { markdown, filename } = req.body;

        if (!markdown) {
            return res.status(400).json({ error: 'Markdown content is required' });
        }

        // Convert markdown to HTML
        const processedHtml = await remark()
            .use(html)
            .process(markdown);

        const htmlContent = processedHtml.toString();

        // Wrap HTML in a complete document with styling
        const styledHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: Arial, Calibri, sans-serif;
                        line-height: 1.6;
                        margin: 40px;
                        font-size: 11pt;
                    }
                    h1 {
                        color: #023047;
                        margin-top: 20px;
                        font-size: 16pt;
                        font-weight: bold;
                    }
                    h2 {
                        color: #023047;
                        margin-top: 16px;
                        font-size: 14pt;
                        font-weight: bold;
                    }
                    h3 {
                        color: #023047;
                        margin-top: 12px;
                        font-size: 12pt;
                        font-weight: bold;
                    }
                    p { margin: 10px 0; }
                    ul, ol {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    li { margin: 5px 0; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                    code {
                        background-color: #f4f4f4;
                        padding: 2px 6px;
                        font-family: 'Courier New', monospace;
                        font-size: 10pt;
                    }
                    pre {
                        background-color: #f4f4f4;
                        padding: 10px;
                        font-family: 'Courier New', monospace;
                        font-size: 10pt;
                        white-space: pre-wrap;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
            </html>
        `;

        // Convert HTML to DOCX buffer
        const docxBuffer = await HTMLtoDOCX(styledHtml, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: false,
        });

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'resume.docx'}"`);

        // Send the buffer
        res.send(docxBuffer);
    } catch (error) {
        console.error('Error converting to DOCX:', error);
        res.status(500).json({ error: 'Failed to convert to DOCX' });
    }
}
