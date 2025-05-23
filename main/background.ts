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
} from "pdf-lib";
import { LinklyCredentials, PdfInfo, PdfLink } from "../renderer/types";
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
    const links = await extractLinksFromPdf(pdfDoc);

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

      // Try creating a test link to validate credentials
      const testLinkData = {
        url: "https://example.com",
        name: "Credentials Validation Test",
      };

      const result = await linklyClient.listLinks();
      return result !== null;
    } catch (error) {
      console.error("Error validating credentials:", error);
      return false;
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
            url: link,
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
): string[] {
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
  const pageLinks: string[] = [];

  for (let idx = 0; idx < annotsArray.size(); idx++) {
    const annotRef = annotsArray.get(idx);
    const annot = pdfDoc.context.lookup(annotRef);
    if (!(annot instanceof PDFDict)) {
      continue;
    }

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
    pageLinks.push(uriValue);
  }

  return pageLinks;
}
