import {
  LinklyCredentials,
  PdfLinkDetail,
  ShortLinkResult,
} from "../../renderer/types";
import { LinklyClient } from "../clients/linkly";

////////////////////////////////////////////////////////////////////////////////

export async function safeCreateShortLinks(
  _: Electron.IpcMainInvokeEvent,
  data: {
    links: PdfLinkDetail[];
    credentials: LinklyCredentials;
    prefix: string;
  }
): Promise<ShortLinkResult[]> {
  try {
    return await createShortLinks(data.links, data.credentials, data.prefix);
  } catch (error) {
    console.error("Error creating short links:", error);
    return [];
  }
}

async function createShortLinks(
  links: PdfLinkDetail[],
  credentials: LinklyCredentials,
  prefix: string
): Promise<ShortLinkResult[]> {
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
        name: `${prefix || "PDF Link:"} ${urlDetail.url.substring(0, 30)}${
          urlDetail.url.length > 30 ? "..." : ""
        }`,
      };

      // Create short link
      const response = await linklyClient.createLink(linkData);

      if (response && response.full_url) {
        results.push({
          urlDetail: { ...urlDetail, shortUrl: response.full_url },
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
}
