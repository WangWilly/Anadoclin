import path from "path";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { safeProcessPdf } from "./ipc_handlers/process_pdf";
import { safeValidateLinklyCredentials } from "./ipc_handlers/validate_linkly_credentials";
import { safeCreateShortLinks } from "./ipc_handlers/create_short_links";
import { safeGenerateModifiedPdf } from "./ipc_handlers/generate_modified_pdf";
import {
  CHANNEL_CREATE_SHORT_LINKS,
  CHANNEL_GENERATE_MODIFIED_PDF,
  CHANNEL_PROCESS_PDF,
  CHANNEL_VALIDATE_LINKLY_CREDENTIALS,
} from "./preload_constants";

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

////////////////////////////////////////////////////////////////////////////////

// Add handler for PDF processing
ipcMain.handle(CHANNEL_PROCESS_PDF, safeProcessPdf);

// Updated handler to validate Linkly credentials
ipcMain.handle(
  CHANNEL_VALIDATE_LINKLY_CREDENTIALS,
  safeValidateLinklyCredentials
);

// Add handler for creating short links
ipcMain.handle(CHANNEL_CREATE_SHORT_LINKS, safeCreateShortLinks);

// Add handler for generating modified PDF
ipcMain.handle(CHANNEL_GENERATE_MODIFIED_PDF, safeGenerateModifiedPdf);

////////////////////////////////////////////////////////////////////////////////

/**
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
*/
