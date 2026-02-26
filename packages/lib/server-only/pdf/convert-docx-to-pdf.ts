import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';

/**
 * Converts a DOCX buffer to a PDF buffer.
 *
 * NOTE: This is a basic implementation using mammoth and jsPDF.
 * For production high-fidelity conversion, consider using LibreOffice or a dedicated service.
 * High-fidelity conversion preserves layout, images, and fonts which this implementation
 * currently simplifies by extracting raw text.
 */
export const convertDocxToPdf = async (docxBuffer: Buffer): Promise<Buffer> => {
  try {
    const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });

    // In a real server environment, converting HTML to PDF robustly often requires a headless browser.
    // Here we use a simplified approach for demonstration/fallback.
    // A better production implementation would use Gotenberg or Puppeteer.

    const doc = new jsPDF();

    // jsPDF's html method requires a DOM. In Node.js, this usually means jsdom.
    // For now, we'll just extract text as a fallback if we can't do full HTML rendering.
    const { value: text } = await mammoth.extractRawText({ buffer: docxBuffer });

    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);

    return Buffer.from(doc.output('arraybuffer'));
  } catch (error) {
    console.error('DOCX to PDF conversion failed:', error);
    throw new Error('Failed to convert DOCX to PDF');
  }
};
