import * as pdfjs from 'pdfjs-dist';

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Extract all text content from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise resolving to the full text content
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Extract text items and join with spaces
      // Preserve some structure by adding newlines between different Y positions
      let lastY: number | null = null;
      const pageLines: string[] = [];
      let currentLine = '';
      
      for (const item of content.items) {
        if ('str' in item) {
          const textItem = item as { str: string; transform: number[] };
          const y = textItem.transform[5];
          
          // If Y position changed significantly, start a new line
          if (lastY !== null && Math.abs(y - lastY) > 5) {
            if (currentLine.trim()) {
              pageLines.push(currentLine.trim());
            }
            currentLine = textItem.str;
          } else {
            currentLine += ' ' + textItem.str;
          }
          
          lastY = y;
        }
      }
      
      // Don't forget the last line
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }
      
      fullText += pageLines.join('\n') + '\n\n';
    }
    
    return fullText.trim();
  } catch (error) {
    console.error('[extractPdfText] Error extracting text:', error);
    throw new Error('Failed to extract text from PDF');
  }
}
