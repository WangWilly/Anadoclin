# Anadoclin

![Anadoclin Logo](docs/anadoclin-logo.png)

## Introduction

Anadoclin is a desktop application that transforms PDF link management by extracting URLs from PDF documents and converting them to shortened links through the Linkly API. This tool is perfect for document publishers, marketers, and anyone who needs to track link engagement in their PDF documents.

## Features

- **PDF Analysis**: Extract and view all links within PDF documents
- **Link Shortening**: Automatically shorten links using the Linkly service
- **Custom Prefixes**: Add custom prefixes to your shortened links for better organization
- **PDF Generation**: Create new PDF documents with all links replaced by shortened URLs
- **Simplified Workflow**: Drag-and-drop interface for easy document processing
- **Link Management**: Copy shortened links directly to your clipboard

## Installation

```bash
# Install dependencies
$ yarn install (or `npm install` or `pnpm install`)
```

## Usage

### Development

```bash
# development mode
$ yarn dev (or `npm run dev` or `pnpm run dev`)
```

### Production

```bash
# production build
$ yarn build (or `npm run build` or `pnpm run build`)
```

### Packaging the Application

```bash
# For MacOS
$ yarn package-mac (or `npm run package-mac`)

# For Windows
$ yarn package-win (or `npm run package-win`)

# For Linux
$ yarn package-linux (or `npm run package-linux`)
```

## How It Works

1. **Authentication**: Log in with your Linkly API credentials
2. **Upload**: Drag and drop or select a PDF file
3. **Analysis**: Anadoclin extracts all links from the document
4. **Shortening**: Apply Linkly to convert links to trackable short URLs
5. **Generation**: Create a new PDF with all original links replaced by shortened URLs

## Requirements

- **Linkly Account**: You need an active Linkly account with API access
- **API Credentials**: Your API key, account email, and workspace ID from Linkly
- **Operating System**: Windows, macOS, or Linux

## Technical Details

Anadoclin is built using:
- **Electron**: For cross-platform desktop application capabilities
- **React/Next.js**: For the user interface
- **pdf-lib**: For PDF manipulation
- **TypeScript**: For type safety and developer experience

## License

MIT
