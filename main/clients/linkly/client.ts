import {
  HEADER_ACCEPT_KEY,
  HEADER_CONTENT_TYPE_KEY,
  HEADER_JSON_VAL,
} from "../../utils/constants";
import { safe } from "../../utils/exceptions";
import { HttpClient } from "../../utils/httpClient";
import { CreateLinkRequestDto, CreateLinkResponseDtoSchema } from "./dtos";

////////////////////////////////////////////////////////////////////////////////

/**
 * Client for interacting with the Linkly API
 * Documentation: https://linklyhq.com/support/api/
 */
export class LinklyClient {
  private readonly httpClient: HttpClient;

  // API endpoints
  private readonly createLinkPath = "/v1/link";

  /**
   * Creates a new LinklyClient instance
   * @param apiKey Your Linkly API key
   * @param baseUrl The base URL for the Linkly API (defaults to https://linkly.com)
   */
  constructor(
    private readonly apiKey: string,
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
    requestData.api_key = this.apiKey;
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

    return parseRes.data;
  }
}
