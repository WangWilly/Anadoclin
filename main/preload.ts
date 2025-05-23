import { contextBridge, ipcRenderer } from "electron";
import { LinklyCredentials } from "../renderer/types";

////////////////////////////////////////////////////////////////////////////////

const CHANNEL_VALIDATE_LINKLY_CREDENTIALS =
  "validate-linkly-credentials";
const CHANNEL_CREATE_SHORT_LINKS = "create-short-links";
const CHANNEL_GENERATE_MODIFIED_PDF = "generate-modified-pdf";
const CHANNEL_PROCESS_PDF = "process-pdf";

////////////////////////////////////////////////////////////////////////////////

// Define consistent API for both specific methods and generic invoke
const handler = {
  // Specific API methods using the proper channel constants
  validateLinklyCredentials: (credentials: LinklyCredentials): Promise<boolean> => {
    return ipcRenderer.invoke(CHANNEL_VALIDATE_LINKLY_CREDENTIALS, credentials);
  },
  // Method to process PDFs - making sure it uses the proper constant
  processPdf: (pdfBuffer: ArrayBuffer): Promise<any> => {
    return ipcRenderer.invoke(CHANNEL_PROCESS_PDF, pdfBuffer);
  },
  // You might want to add these other methods too for consistency
  createShortLinks: (data: any): Promise<any> => {
    return ipcRenderer.invoke(CHANNEL_CREATE_SHORT_LINKS, data);
  },
  generateModifiedPdf: (data: any): Promise<any> => {
    return ipcRenderer.invoke(CHANNEL_GENERATE_MODIFIED_PDF, data);
  }
};

////////////////////////////////////////////////////////////////////////////////

contextBridge.exposeInMainWorld("api", handler);

// Update the type export to include all the new methods
export type ApiHandler = typeof handler;
