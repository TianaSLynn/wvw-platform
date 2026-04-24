import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ─── Typed API response helpers ───────────────────────────────────────────────

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json({ error: message, errors }, { status: 400 });
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function serverError(error: unknown) {
  console.error("[API Error]", error);
  const message =
    error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function handleZodError(error: ZodError) {
  return badRequest("Validation failed", error.flatten().fieldErrors);
}

// Wrap a route handler with standard error handling
export function withErrorHandler(
  handler: (req: Request, ctx: unknown) => Promise<NextResponse>
) {
  return async (req: Request, ctx: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ZodError) return handleZodError(error);
      return serverError(error);
    }
  };
}
