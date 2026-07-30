import pino from "pino";

/**
 * Structured JSON logger written to stdout, picked up as-is by `docker logs` / Portainer.
 * LOG_LEVEL controls verbosity (trace|debug|info|warn|error|fatal|silent). Defaults to
 * "debug" so a self-hosted single-user instance shows everything by default; turn it down
 * with LOG_LEVEL=info if it gets too noisy.
 *
 * Credential-shaped fields are redacted even at the most verbose level — everything else
 * (OIDC profile claims, SQL text/params, request bodies, response bodies) is logged in full.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "debug",
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "*.access_token",
      "*.id_token",
      "*.refresh_token",
      "*.client_secret",
      "*.password",
      "*.headers.authorization",
      "*.headers.cookie",
      "*.headers[\"set-cookie\"]",
    ],
    censor: "[redacted]",
  },
});
