import { LinklyCredentials } from "../../renderer/types";
import { LinklyClient } from "../clients/linkly";

////////////////////////////////////////////////////////////////////////////////

export async function safeValidateLinklyCredentials(
  _: Electron.IpcMainInvokeEvent,
  credentials: LinklyCredentials
): Promise<boolean> {
  try {
    return await validateLinklyCredentials(credentials);
  } catch (error) {
    console.error("Error validating Linkly credentials:", error);
    return false;
  }
}

async function validateLinklyCredentials(
  credentials: LinklyCredentials
): Promise<boolean> {
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
}
