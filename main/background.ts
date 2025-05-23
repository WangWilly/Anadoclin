import path from "path";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import {
  PDFDocument,
  PDFName,
  PDFPageLeaf,
  PDFArray,
  PDFDict,
  PDFString,
  PDFRef,
  PDFNumber,
} from "pdf-lib";
import { LinklyCredentials, PdfInfo, PdfLink, PdfLinkDetail, ShortLinkResult } from "../renderer/types";
import { LinklyClient } from "./clients/linkly";

////////////////////////////////////////////////////////////////////////////////

const isProd = process.env.NODE_ENV === "production";

////////////////////////////////////////////////////////////////////////////////

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

////////////////////////////////////////////////////////////////////////////////

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
    return;
  }

  const port = process.argv[2];
  await mainWindow.loadURL(`http://localhost:${port}/home`);
  mainWindow.webContents.openDevTools();
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});

////////////////////////////////////////////////////////////////////////////////

// Add handler for PDF processing
ipcMain.handle("process-pdf", async (event, pdfBuffer): Promise<PdfInfo> => {
  try {
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
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
});

// Updated handler to validate Linkly credentials
ipcMain.handle(
  "validate-linkly-credentials",
  async (
    event,
    credentials: LinklyCredentials
  ) => {
    try {
      const { apiKey, accountEmail, workspaceId } = credentials;

      if (
        !apiKey ||
        typeof apiKey !== "string" ||
        !accountEmail ||
        typeof accountEmail !== "string" ||
        !workspaceId ||
        typeof workspaceId !== "number"
      ) {
        return false;
      }

      // Create a client instance with the provided credentials
      const linklyClient = new LinklyClient(accountEmail, apiKey, workspaceId);

      const result = await linklyClient.listLinks();
      return result !== null;
    } catch (error) {
      console.error("Error validating credentials:", error);
      return false;
    }
  }
);

// Add handler for creating short links
ipcMain.handle(
  "create-short-links",
  async (
    event,
    { links, credentials, prefix }: { 
      links: PdfLinkDetail[]; 
      credentials: LinklyCredentials;
      prefix: string;
    }
  ): Promise<ShortLinkResult[]> => {
    try {
      const { apiKey, accountEmail, workspaceId } = credentials;

      // Create Linkly client
      const linklyClient = new LinklyClient(accountEmail, apiKey, workspaceId);

      // Process links in parallel with a small delay to avoid rate limiting
      const results: ShortLinkResult[] = [];

      for (const urlDetail of links) {
        try {
          // Create link data with the custom prefix
          const linkData = {
            url: urlDetail.url,
            name: `${prefix || 'PDF Link:'} ${urlDetail.url.substring(0, 30)}${
              urlDetail.url.length > 30 ? "..." : ""
            }`,
          };

          // Create short link
          const response = await linklyClient.createLink(linkData);

          if (response && response.full_url) {
            results.push({
              urlDetail: {...urlDetail, shortUrl: response.full_url},
              success: true,
            });
          } else {
            results.push({
              urlDetail: urlDetail,
              success: false,
              error: "Failed to create short link",
            });
          }

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error creating short link for ${urlDetail.url}:`, error);
          results.push({
            urlDetail: urlDetail,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error processing links:", error);
      throw error;
    }
  }
);

// Add handler for generating modified PDF
ipcMain.handle(
  "generate-modified-pdf",
  async (
    event,
    { originalPdf, links }: { originalPdf: ArrayBuffer; links: PdfLink[] }
  ): Promise<Uint8Array> => {
    try {
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
            link => 
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
    } catch (error) {
      console.error("Error generating modified PDF:", error);
      throw error;
    }
  }
);

////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////

function sortAnnotsByPosition(annotsArray: PDFDict[]) {
  return annotsArray.sort((a, b) => {
    const rectA = a.get(PDFName.of('Rect')) as PDFArray;
    const rectB = b.get(PDFName.of('Rect')) as PDFArray;

    if (!rectA || !rectB) return 0;

    // rect = [x1, y1, x2, y2]
    const [x1A, y1A, x2A, y2A] = rectA.asArray().map(n => (n as PDFNumber).asNumber());
    const [x1B, y1B, x2B, y2B] = rectB.asArray().map(n => (n as PDFNumber).asNumber());

    // Calculate top (max y) and left (min x) for each annotation
    const topA = Math.max(y1A, y2A);
    const topB = Math.max(y1B, y2B);
    const leftA = Math.min(x1A, x2A);
    const leftB = Math.min(x1B, x2B);

    // Sort by top descending (higher Y first)
    if (topA !== topB) return topB - topA;

    // If top is same, sort by left ascending (lower X first)
    return leftA - leftB;
  });
}
