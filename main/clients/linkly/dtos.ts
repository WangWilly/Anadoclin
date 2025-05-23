import zod from "zod";

////////////////////////////////////////////////////////////////////////////////

// Create Link Response
export const CreateLinkResponseDtoSchema = zod.object({
  success: zod.boolean(),
  data: zod.object({
    id: zod.string(),
    url: zod.string().url(),
    short_url: zod.string(),
    title: zod.string().nullable(),
    domain: zod.string(),
    created_at: zod.string().transform((v) => new Date(v)),
    expires_at: zod.string().nullable().transform((v) => (v ? new Date(v) : null)),
    password: zod.string().nullable(),
    track_visits: zod.boolean(),
  }).nullable(),
  error: zod.string().nullable(),
});

export type CreateLinkResponseDto = zod.infer<typeof CreateLinkResponseDtoSchema>;

// Create Link Request
export const CreateLinkRequestSchema = zod.object({
  account_email: zod.string(),
  api_key: zod.string(),
  workspace_id: zod.number(),
  id: zod.number().optional(),
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
