export interface PdfLink {
  page: number;
  url: string;
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
