import zod from "zod";

////////////////////////////////////////////////////////////////////////////////

const LinkResponseDtoSchemaRule = zod.object({
  matches: zod.string().nullable(),
  percentage: zod.number().nullable(),
  url: zod.string().nullable(),
  what: zod.string().nullable(),
});

// Create Link Response
export const CreateLinkResponseDtoSchema = zod.object({
  fb_pixel_id: zod.string().nullable(),
  expiry_datetime: zod.string().nullable(),
  expiry_destination: zod.string().url().nullable(),
  rules: zod.array(LinkResponseDtoSchemaRule).nullable(),
  cloaking: zod.boolean().nullable(),
  linkify_words: zod.string().nullable(),
  full_url: zod.string().url(),
  og_description: zod.string().nullable(),
  body_tags: zod.string().nullable(),
  og_title: zod.string().nullable(),
  note: zod.string().nullable(),
  custom_referer: zod.string().nullable(),
  name: zod.string().nullable(),
  id: zod.number().nullable(),
  gtm_id: zod.string().nullable(),
  og_image: zod.string().url().nullable(),
  block_bots: zod.boolean().nullable(),
  utm_content: zod.string().nullable(),
  enabled: zod.boolean().nullable(),
  url: zod.string().url(),
  replacements: zod.string().nullable(),
  deleted: zod.boolean().nullable(),
  workspace_id: zod.number().nullable(),
  public_analytics: zod.boolean().nullable(),
  utm_source: zod.string().nullable(),
  referer_mode: zod.number().nullable(),
  slug: zod.string().nullable(),
  domain: zod.string().url().nullable(),
  forward_params: zod.boolean().nullable(),
  utm_medium: zod.string().nullable(),
  head_tags: zod.string().nullable(),
  ga4_tag_id: zod.string().nullable(),
  utm_term: zod.string().nullable(),
  utm_campaign: zod.string().nullable(),
});

export type CreateLinkResponseDto = zod.infer<typeof CreateLinkResponseDtoSchema>;

// Create Link Request
export const CreateLinkRequestSchema = zod.object({
  email: zod.string(),
  api_key: zod.string(),
  workspace_id: zod.number(),
  url: zod.string().url(),
  name: zod.string().optional(),
  note: zod.string().optional(),
  head_tags: zod.string().optional(),
  body_tags: zod.string().optional(),
  forward_params: zod.boolean().optional(),
  enabled: zod.boolean().optional(),
  utm_source: zod.string().optional(),
  utm_medium: zod.string().optional(),
  utm_campaign: zod.string().optional(),
  utm_term: zod.string().optional(),
  utm_content: zod.string().optional(),
  domain: zod.string().url().optional(),
  slug: zod.string().optional(),
  og_title: zod.string().optional(),
  og_description: zod.string().optional(),
  og_image: zod.string().url().optional(),
  fb_pixel_id: zod.string().optional(),
  ga4_tag_id: zod.string().optional(),
  gtm_id: zod.string().optional(),
  expiry_datetime: zod.string().transform((v) => new Date(v)).optional(),
  expiry_destination: zod.string().url().optional(),
});

export type CreateLinkRequestDto = zod.infer<typeof CreateLinkRequestSchema>;

////////////////////////////////////////////////////////////////////////////////

export const ListLinksResponseDtoSchemaLink = zod.object({
  fb_pixel_id: zod.string().nullable(),
  sparkline: zod.array(zod.number()).optional(),
  clicks_thirty_days: zod.number(),
  rules: zod.array(LinkResponseDtoSchemaRule).nullable(),
  cloaking: zod.boolean().nullable(),
  linkify_words: zod.string().nullable(),
  full_url: zod.string().url(),
  clicks_today: zod.number(),
  og_description: zod.string().nullable(),
  body_tags: zod.string().nullable(),
  og_title: zod.string().nullable(),
  note: zod.string().nullable(),
  custom_referer: zod.string().nullable(),
  name: zod.string().nullable(),
  id: zod.number().nullable(),
  gtm_id: zod.string().nullable(),
  og_image: zod.string().url().nullable(),
  block_bots: zod.boolean().nullable(),
  clicks_total: zod.number(),
  utm_content: zod.string().nullable(),
  enabled: zod.boolean().nullable(),
  url: zod.string().url(),
  replacements: zod.string().nullable(),
  deleted: zod.boolean().nullable(),
  workspace_id: zod.number().nullable(),
  public_analytics: zod.boolean().nullable(),
  utm_source: zod.string().nullable(),
  referer_mode: zod.number().nullable(),
  slug: zod.string().nullable(),
  domain: zod.string().url().nullable(),
  forward_params: zod.boolean().nullable(),
  utm_medium: zod.string().nullable(),
  head_tags: zod.string().nullable(),
  ga4_tag_id: zod.string().nullable(),
  utm_term: zod.string().nullable(),
  utm_campaign: zod.string().nullable(),
});

// List Links Response
export const ListLinksResponseDtoSchema = zod.object({
  links: zod.array(ListLinksResponseDtoSchemaLink),
  page_number: zod.number(),
  page_size: zod.number(),
  total_entries: zod.number(),
  total_pages: zod.number(),
  total_rows: zod.number(),
  workspace_link_count: zod.number(),
});

export type ListLinksResponseDto = zod.infer<typeof ListLinksResponseDtoSchema>;
