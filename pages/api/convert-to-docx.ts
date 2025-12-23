import { NextApiRequest, NextApiResponse } from 'next';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { markdown, filename } = req.body;

        if (!markdown) {
            return res.status(400).json({ error: 'Markdown content is required' });
        }

        // Parse markdown and create document sections
        const sections: Paragraph[] = [];
        const lines = markdown.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (!line) {
                // Add empty paragraph for spacing
                sections.push(new Paragraph({ text: '' }));
                continue;
            }

            // H1 headers
            if (line.startsWith('# ')) {
                sections.push(
                    new Paragraph({
                        text: line.replace('# ', ''),
                        heading: HeadingLevel.HEADING_1,
                        spacing: { before: 240, after: 120 },
                    })
                );
            }
            // H2 headers
            else if (line.startsWith('## ')) {
                sections.push(
                    new Paragraph({
                        text: line.replace('## ', ''),
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 200, after: 100 },
                    })
                );
            }
            // H3 headers
            else if (line.startsWith('### ')) {
                sections.push(
                    new Paragraph({
                        text: line.replace('### ', ''),
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 160, after: 80 },
                    })
                );
            }
            // Bullet points
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                const cleanText = line.replace(/^[-*]\s+/, '');
                sections.push(
                    new Paragraph({
                        text: cleanText,
                        bullet: { level: 0 },
                        spacing: { before: 60, after: 60 },
                    })
                );
            }
            // Regular text with bold/italic support
            else {
                const children: TextRun[] = [];
                const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

                for (const part of parts) {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Bold text
                        children.push(new TextRun({ text: part.slice(2, -2), bold: true }));
                    } else if (part.startsWith('*') && part.endsWith('*')) {
                        // Italic text
                        children.push(new TextRun({ text: part.slice(1, -1), italics: true }));
                    } else if (part.startsWith('`') && part.endsWith('`')) {
                        // Code text
                        children.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New' }));
                    } else if (part) {
                        children.push(new TextRun({ text: part }));
                    }
                }

                sections.push(
                    new Paragraph({
                        children: children.length > 0 ? children : [new TextRun({ text: line })],
                        spacing: { before: 60, after: 60 },
                    })
                );
            }
        }

        // Create the document
        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: sections,
                },
            ],
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);

        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename || 'resume.docx'}"`);

        // Send the buffer
        res.send(buffer);
    } catch (error) {
        console.error('Error converting to DOCX:', error);
        res.status(500).json({ error: 'Failed to convert to DOCX', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}
