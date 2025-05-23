import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFPageLeaf,
  PDFRef,
  PDFString,
} from "pdf-lib";
import { PdfInfo, PdfLink, PdfLinkDetail } from "../../renderer/types";

////////////////////////////////////////////////////////////////////////////////

export async function safeProcessPdf(
  _: Electron.IpcMainInvokeEvent,
  pdfBuffer: ArrayBuffer
): Promise<PdfInfo|null> {
  try {
    return await procesPdf(pdfBuffer);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return null;
  }
}

async function procesPdf(
  pdfBuffer: ArrayBuffer
): Promise<PdfInfo> {
  // Load the PDF using pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  // Get PDF info
  const pageCount = pdfDoc.getPageCount();

  // Get PDF metadata if available
  const title = pdfDoc.getTitle() || "";
  const author = pdfDoc.getAuthor() || "";
  const subject = pdfDoc.getSubject() || "";
  const keywords = pdfDoc.getKeywords()?.split(",") || [];
  const creator = pdfDoc.getCreator() || "";
  const producer = pdfDoc.getProducer() || "";
  const creationDate = pdfDoc.getCreationDate()?.toISOString() || "";
  const modificationDate = pdfDoc.getModificationDate()?.toISOString() || "";

  // Extract links from the PDF
  const links = extractLinksFromPdf(pdfDoc);

  return {
    pageCount,
    title,
    author,
    subject,
    keywords,
    creator,
    producer,
    creationDate,
    modificationDate,
    links,
  };
}

// Function to extract links from PDF
function extractLinksFromPdf(pdfDoc: PDFDocument): PdfLink[] {
  const links: PdfLink[] = [];

  try {
    // Process each page to find annotations
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      try {
        const page = pdfDoc.getPage(i);
        const pageLeaf = page.node;
        const pageLinks = getLinksFromPageLeaf(pdfDoc, pageLeaf);
        pageLinks.forEach((link) => {
          links.push({
            page: i + 1,
            urlDetail: link,
          });
        });
      } catch (pageError) {
        console.warn(`Error processing page ${i + 1}:`, pageError);
      }
    }
  } catch (extractError) {
    console.error("Error extracting links:", extractError);
  }

  return links;
}

function getLinksFromPageLeaf(
  pdfDoc: PDFDocument,
  pageLeaf: PDFPageLeaf
): PdfLinkDetail[] {
  if (!(pageLeaf instanceof PDFPageLeaf)) {
    throw new Error("Invalid page leaf.");
  }
  const pageAnnots = pageLeaf.get(PDFName.of("Annots"));

  if (!pageAnnots) {
    throw new Error("No annotations found on this page.");
  }

  if (!(pageAnnots instanceof PDFArray)) {
    throw new Error("Annotations are not in the expected format.");
  }

  const annotsArray = pageAnnots as PDFArray;
  const pageLinks: PdfLinkDetail[] = [];

  for (let idx = 0; idx < annotsArray.size(); idx++) {
    const annotRef = annotsArray.get(idx);
    if (!(annotRef instanceof PDFRef)) {
      continue;
    }

    const annot = pdfDoc.context.lookup(annotRef);
    if (!(annot instanceof PDFDict)) {
      continue;
    }

    // const ref = PDFRef.of(annotRef.objectNumber, annotRef.generationNumber);
    // const pdfObject = pdfDoc.context.lookup(ref);
    // // check if they are the same
    // if (pdfObject !== annot) {
    //   console.warn("Annotation object mismatch:", pdfObject, annot);
    //   continue;
    // }

    // Check if annotation is a link
    const subtype = annot.get(PDFName.of("Subtype"));
    if (!subtype || subtype.toString() !== "/Link") {
      continue;
    }

    // Get the action dictionary or URI
    const action = annot.get(PDFName.of("A"));
    if (!action) {
      continue;
    }
    if (!(action instanceof PDFDict)) {
      continue;
    }

    const uri = action.get(PDFName.of("URI")) as PDFString;
    if (!uri) {
      continue;
    }

    const uriValue = uri.decodeText();
    // not mailto
    if (uriValue.match(/mailto:/)) {
      continue;
    }
    // not javascript
    if (uriValue.match(/javascript:/)) {
      continue;
    }
    pageLinks.push({
      objectNumber: annotRef.objectNumber,
      generationNumber: annotRef.generationNumber,
      url: uriValue,
    });
  }

  return pageLinks;
}
