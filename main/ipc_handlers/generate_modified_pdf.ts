import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRef,
  PDFString,
} from "pdf-lib";
import { PdfLink } from "../../renderer/types";

////////////////////////////////////////////////////////////////////////////////

export async function safeGenerateModifiedPdf(
  _: Electron.IpcMainInvokeEvent,
  data: { originalPdf: ArrayBuffer; links: PdfLink[] }
): Promise<Uint8Array | null> {
  try {
    return await generateModifiedPdf(data);
  } catch (error) {
    console.error("Error generating modified PDF:", error);
    return null;
  }
}

async function generateModifiedPdf({
  originalPdf,
  links,
}: {
  originalPdf: ArrayBuffer;
  links: PdfLink[];
}): Promise<Uint8Array> {
  // Load the PDF
  const pdfDoc = await PDFDocument.load(originalPdf);

  // Track if we've updated any links
  let updatedLinksCount = 0;

  // Process each page
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const page = pdfDoc.getPage(i);
    const pageLeaf = page.node;

    // Get annotations
    const pageAnnots = pageLeaf.get(PDFName.of("Annots"));
    if (!pageAnnots || !(pageAnnots instanceof PDFArray)) {
      continue;
    }

    const annotsArray = pageAnnots as PDFArray;

    // Loop through annotations
    for (let idx = 0; idx < annotsArray.size(); idx++) {
      const annotRef = annotsArray.get(idx);
      if (!(annotRef instanceof PDFRef)) {
        continue;
      }

      // Find matching link in our processed links
      const matchingLink = links.find(
        (link) =>
          link.urlDetail.objectNumber === annotRef.objectNumber &&
          link.urlDetail.generationNumber === annotRef.generationNumber &&
          link.urlDetail.shortUrl // Only update links that have been shortened
      );

      if (matchingLink) {
        // Get the annotation object
        const annot = pdfDoc.context.lookup(annotRef);
        if (!(annot instanceof PDFDict)) {
          continue;
        }

        // Get the action dictionary
        const action = annot.get(PDFName.of("A"));
        if (!action || !(action instanceof PDFDict)) {
          continue;
        }

        // Replace the URI with the shortened URL
        action.set(
          PDFName.of("URI"),
          PDFString.of(matchingLink.urlDetail.shortUrl!)
        );

        updatedLinksCount++;
      }
    }
  }

  console.log(`Updated ${updatedLinksCount} links in the PDF`);

  // If no links were updated, throw an error
  if (updatedLinksCount === 0) {
    throw new Error("No links were updated in the PDF");
  }

  // Save the PDF
  const modifiedPdfBytes = await pdfDoc.save();

  return modifiedPdfBytes;
}
