export interface PdfLinkDetail {
  objectNumber: number;
  generationNumber: number;
  url: string;
  shortUrl?: string;
}

export interface PdfLink {
  page: number;
  urlDetail: PdfLinkDetail;
  status?: 'pending' | 'success' | 'failed';
  error?: string;
}

export interface PdfInfo {
  pageCount: number;
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  links: PdfLink[];
}

export interface LinklyCredentials {
  apiKey: string;
  accountEmail: string;
  workspaceId: number;
}

export interface ShortLinkResult {
  urlDetail: PdfLinkDetail;
  success: boolean;
  error?: string;
}
