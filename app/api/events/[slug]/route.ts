import { deleteEventBySlug, getEventBySlug } from "@/repository/events";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ slug: string }>;
};

/** GET /api/events/[slug]
 * Fetches a single event by its slug
 *
 */

export async function GET(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    // Await and extract slug from params
    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { message: "Invalid or missing slug parameter" },
        { status: 400 },
      );
    }

    // Sanitize slug (remove any potential maclicious input)
    const sanitizedSlug = slug.trim().toLocaleLowerCase();

    // Get Event by slug
    const getEvent = await getEventBySlug(sanitizedSlug);

    if (!getEvent) {
      return NextResponse.json(
        {
          message: `Event with slug: ${sanitizedSlug} not found`,
          getEvent,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "An Event fetched successfully by slug", getEvent },
      { status: 200 },
    );
  } catch (e) {
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching event by slug: ", e);
    }

    // Handle specific error types
    if (e instanceof Error) {
      // Handle database connection errors
      if (e.stack?.includes("MONGODB_URI")) {
        return NextResponse.json(
          { message: "Database configuration error" },
          { status: 500 },
        );
      }
    }

    // Handle unknown errors
    return NextResponse.json(
      {
        message: "An unexpected error occured at GET /api/events",
        error:
          e instanceof Error ? e.message : "Unknown Error at GET /api/events",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { message: "Invalid or missing slug parameter" },
        { status: 400 },
      );
    }

    // Sanitize slug (remove any potential maclicious input)
    const sanitizedSlug = slug.trim().toLocaleLowerCase();

    const deletedEvent = await deleteEventBySlug(sanitizedSlug);

    if (deletedEvent.deletedCount === 0) {
      return NextResponse.json(
        {
          message: `Event with slug: ${sanitizedSlug} not found`,
          deletedEvent,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event successfully deleted by Slug", deletedEvent },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        message: "An unexpected error occured at DELETE /api/events",
        error:
          e instanceof Error
            ? e.message
            : "Unknown Error at DELETE /api/events",
      },
      { status: 500 },
    );
  }
}
