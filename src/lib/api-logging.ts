import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse>;

/** Logs every request (method/url/params) and its outcome (status/duration), including thrown errors. */
export function withLogging<Ctx = unknown>(routeLabel: string, handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    const start = Date.now();
    const params =
      ctx && typeof ctx === "object" && "params" in ctx
        ? await (ctx as { params: Promise<unknown> }).params
        : undefined;
    const log = logger.child({
      route: routeLabel,
      method: req.method,
      url: req.nextUrl.pathname + req.nextUrl.search,
      params,
    });

    log.debug("request received");
    try {
      const res = await handler(req, ctx);
      log.info({ status: res.status, durationMs: Date.now() - start }, "request completed");
      return res;
    } catch (err) {
      log.error({ err, durationMs: Date.now() - start }, "request threw");
      throw err;
    }
  };
}
