import { PDFDocument } from 'pdf-lib';

interface ImageField {
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  image_url?: string;
}

export async function downloadPDFWithImages(
  pdfUrl: string,
  imageFields: ImageField[],
  filename: string = 'contract-with-images.pdf'
): Promise<void> {
  try {
    // Fetch the original PDF
    const pdfResponse = await fetch(pdfUrl);
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pages = pdfDoc.getPages();

    // Filter only image fields that have an image_url
    const validImageFields = imageFields.filter(
      field => field.image_url && field.page_number > 0 && field.page_number <= pages.length
    );

    // Add images to the PDF
    for (const field of validImageFields) {
      const page = pages[field.page_number - 1]; // Convert to 0-indexed
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Fetch the image
      const imageResponse = await fetch(field.image_url!);
      const imageBytes = await imageResponse.arrayBuffer();

      // Determine image type and embed
      let image;
      const contentType = imageResponse.headers.get('content-type');
      
      if (contentType?.includes('png')) {
        image = await pdfDoc.embedPng(imageBytes);
      } else if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Try to detect from URL
        if (field.image_url!.toLowerCase().includes('.png')) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          image = await pdfDoc.embedJpg(imageBytes);
        }
      }

      // Calculate position and size
      // Convert percentage positions to actual coordinates
      const targetWidth = (field.width / 100) * pageWidth;
      const targetHeight = (field.height / 100) * pageHeight;
      
      // Get image dimensions and calculate scale to fit while preserving aspect ratio
      const imageAspectRatio = image.width / image.height;
      const targetAspectRatio = targetWidth / targetHeight;
      
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      
      if (imageAspectRatio > targetAspectRatio) {
        // Image is wider than target area, fit to width
        finalHeight = targetWidth / imageAspectRatio;
      } else {
        // Image is taller than target area, fit to height
        finalWidth = targetHeight * imageAspectRatio;
      }
      
      const x = (field.x_position / 100) * pageWidth + (targetWidth - finalWidth) / 2;
      const y = pageHeight - ((field.y_position / 100) * pageHeight) - ((field.height / 100) * pageHeight) + (targetHeight - finalHeight) / 2;

      // Draw the image on the page
      page.drawImage(image, {
        x,
        y,
        width: finalWidth,
        height: finalHeight,
      });
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Create a blob and download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF with images:', error);
    throw error;
  }
}
