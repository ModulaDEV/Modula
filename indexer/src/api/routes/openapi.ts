/**
 * GET /openapi.json — serves the static OpenAPI 3.1 spec.
 * GET /docs         — Swagger UI rendered against /openapi.json.
 *
 * The spec lives at api/openapi.ts (hand-maintained for v1; see
 * the comment there). Both endpoints are open CORS so external
 * tooling (Stoplight, Postman, etc.) can pull it.
 */
import { Hono } from "hono";

import { buildOpenApiDoc } from "../openapi.js";
import type { Config } from "../../config.js";

interface Deps { config: Config }

export function openapi(deps: Deps): Hono {
  const app = new Hono();

  app.get("/openapi.json", (c) => {
    const baseUrl = `http://${deps.config.HOST}:${deps.config.PORT}`;
    return c.json(buildOpenApiDoc({ baseUrl, version: "1.0.0" }));
  });

  app.get("/docs", (c) =>
    c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Modula Read API · Docs</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = () => {
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#ui',
          deepLinking: true,
          tryItOutEnabled: true,
        });
      };
    </script>
  </body>
</html>`),
  );

  return app;
}
