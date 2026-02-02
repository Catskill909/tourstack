import express from 'express';
import path from 'path';
import { OfficeParser } from 'officeparser';

const router = express.Router();

/**
 * POST /api/documents/extract-text-base64
 * 
 * Extract text from a base64-encoded document
 * Supports: PDF, DOCX, DOC, RTF, ODT, PPTX, TXT
 */
router.post('/extract-text-base64', async (req, res) => {
    try {
        const { data, fileName, mimeType } = req.body;

        if (!data) {
            return res.status(400).json({ error: 'No file data provided' });
        }

        const ext = path.extname(fileName || '').toLowerCase();
        let extractedText = '';

        // Handle plain text files directly
        if (mimeType === 'text/plain' || ext === '.txt') {
            extractedText = Buffer.from(data, 'base64').toString('utf-8');
        } else {
            // Use officeparser for all other document types
            // Supported: PDF, DOCX, DOC, RTF, ODT, PPTX, XLSX
            const supportedExtensions = ['.pdf', '.docx', '.doc', '.rtf', '.odt', '.pptx', '.xlsx'];

            if (!supportedExtensions.includes(ext)) {
                return res.status(400).json({
                    error: 'Unsupported file type',
                    message: `Supported formats: PDF, DOCX, DOC, RTF, ODT, PPTX, XLSX, TXT. Got: ${ext}`,
                    supportedFormats: supportedExtensions
                });
            }

            const buffer = Buffer.from(data, 'base64');

            try {
                // Parse the document using officeparser
                const ast = await OfficeParser.parseOffice(buffer, {
                    extractAttachments: false,
                    ocr: false,
                    includeRawContent: false
                });

                // Extract text from the AST
                extractedText = ast.toText();
            } catch (extractError: any) {
                console.error('Document extraction error:', extractError);
                return res.status(500).json({
                    error: 'Failed to extract text from document',
                    details: extractError.message,
                    hint: 'The document may be corrupt, password-protected, or in an unsupported format'
                });
            }
        }

        // Clean up extracted text
        const cleanedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        res.json({
            success: true,
            text: cleanedText,
            characterCount: cleanedText.length,
            fileName
        });

    } catch (error: any) {
        console.error('Text extraction error:', error);
        res.status(500).json({
            error: 'Failed to extract text',
            details: error.message
        });
    }
});

export default router;
