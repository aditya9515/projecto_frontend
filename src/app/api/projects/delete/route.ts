import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { deleteUserProjectDirectory } from "@/lib/project-directories";
import { projectDirectoryDeleteSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const body = projectDirectoryDeleteSchema.parse(await request.json());
    const result = await deleteUserProjectDirectory(decoded.uid, body.projectId);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
