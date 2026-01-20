import pdf from 'pdf-parse/lib/pdf-parse.js';

class ResumeParser {
    // Extract text from PDF buffer
    async extractFromPDF(buffer) {
        try {
            const data = await pdf(buffer);
            return {
                text: data.text,
                pages: data.numpages,
                info: data.info
            };
        } catch (error) {
            console.error('PDF parsing error:', error);
            throw new Error('Failed to parse PDF file');
        }
    }

    // Extract text from TXT buffer
    extractFromTXT(buffer) {
        try {
            const text = buffer.toString('utf-8');
            return {
                text,
                pages: 1,
                info: {}
            };
        } catch (error) {
            console.error('TXT parsing error:', error);
            throw new Error('Failed to parse TXT file');
        }
    }

    // Main method to parse resume based on file type
    async parse(buffer, filename) {
        const extension = filename.toLowerCase().split('.').pop();

        switch (extension) {
            case 'pdf':
                return this.extractFromPDF(buffer);
            case 'txt':
                return this.extractFromTXT(buffer);
            default:
                throw new Error(`Unsupported file type: ${extension}. Only PDF and TXT are supported.`);
        }
    }

    // Clean up extracted text
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ')  // Collapse whitespace
            .replace(/\n{3,}/g, '\n\n')  // Limit newlines
            .trim();
    }
}

export default new ResumeParser();
