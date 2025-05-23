import {
  HEADER_ACCEPT_KEY,
  HEADER_CONTENT_TYPE_KEY,
  HEADER_JSON_VAL,
} from "../../utils/constants";
import { safe } from "../../utils/exceptions";
import { HttpClient } from "../../utils/httpClient";
import { CreateLinkRequestDto, CreateLinkResponseDtoSchema, ListLinksResponseDtoSchema } from "./dtos";

////////////////////////////////////////////////////////////////////////////////

/**
 * Client for interacting with the Linkly API
 * Documentation: https://linklyhq.com/support/api/
 */
export class LinklyClient {
  private readonly httpClient: HttpClient;

  // API endpoints
  private readonly createLinkPath = "/v1/link";
  private readonly listLinksPath = "/v1/workspace/{workspaceId}/list_links";

  /**
   * Creates a new LinklyClient instance
   * @param apiKey Your Linkly API key
   * @param baseUrl The base URL for the Linkly API (defaults to https://linkly.com)
   */
  constructor(
    private readonly accountEmail: string,
    private readonly apiKey: string,
    private readonly workspaceId: number,
    baseUrl: string = "https://app.linklyhq.com/api"
  ) {
    this.httpClient = new HttpClient({
      baseURL: baseUrl,
      headers: {
        [HEADER_CONTENT_TYPE_KEY]: HEADER_JSON_VAL,
        [HEADER_ACCEPT_KEY]: HEADER_JSON_VAL,
      },
    });
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Create a short link
   * @param requestData Link creation parameters
   * @returns The created link data or null if an error occurred
   */
  async createLink(requestData: CreateLinkRequestDto) {
    requestData.email = this.accountEmail;
    requestData.api_key = this.apiKey;
    requestData.workspace_id = this.workspaceId;
    const resultRes = await safe(
      this.httpClient.post(this.createLinkPath, requestData, undefined, true)
    );

    if (resultRes.success === false) {
      console.error(`[createLink] Failed to get response: ${resultRes.error}`);
      return null;
    }

    const parseRes = CreateLinkResponseDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      console.error(
        `[createLink] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }
    if (!parseRes.data.full_url) {
      console.error(
        `[createLink] Failed to parse response: full_url is missing`
      );
      return null;
    }
    // Replace the domain in the full_url
    parseRes.data.full_url = parseRes.data.full_url.replace(
      "https://2ly.link/",
      "https://l.linklyhq.com/l/",
    );

    return parseRes.data;
  }

  /**
   * List all links in the workspace
   * @returns An array of links or null if an error occurred
   */
  async listLinks() {
    const tarUrl = this.listLinksPath.replace(
      "{workspaceId}",
      this.workspaceId.toString()
    );
    const resultRes = await safe(
      this.httpClient.get(tarUrl, {
        api_key: this.apiKey,
      }, true)
    );

    if (resultRes.success === false) {
      console.error(`[listLinks] Failed to get response: ${resultRes.error}`);
      return null;
    }

    const parseRes = ListLinksResponseDtoSchema.safeParse(resultRes.data);
    if (!parseRes.success) {
      console.error(
        `[listLinks] Failed to parse response: ${parseRes.error.toString()}`
      );
      return null;
    }

    return parseRes.data;
  }
}
