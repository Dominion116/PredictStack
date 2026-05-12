import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { sendJson } from '../middleware/http.mjs';

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.html': 'text/html',
};

const API_DOCS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PredictStack API Documentation</title>
  <link rel="stylesheet" type="text/css" href="/swagger-ui/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui/swagger-ui-bundle.js"></script>
  <script src="/swagger-ui/swagger-ui-standalone-preset.js"></script>
  <script>
    const ui = SwaggerUIBundle({
      url: "/api/swagger.json",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: "StandaloneLayout"
    });
  </script>
</body>
</html>`;

export function createDocsRoutes({ specs }) {
  return {
    swaggerJson(req, res) {
      return sendJson(res, 200, specs);
    },

    async swaggerUiAsset(req, res, pathname) {
      const file = pathname.replace('/swagger-ui/', '');
      const filePath = path.join(process.cwd(), 'node_modules', 'swagger-ui-dist', file);
      try {
        const content = await readFile(filePath);
        const ext = path.extname(file);
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        return sendJson(res, 404, { error: 'Not found' });
      }
    },

    apiDocs(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(API_DOCS_HTML);
    },
  };
}
