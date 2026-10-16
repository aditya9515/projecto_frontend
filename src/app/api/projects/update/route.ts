import { apiErrorResponse } from "@/lib/api-errors";
import { NextRequest, NextResponse } from "next/server";

import { requireVerifiedUser } from "@/lib/auth-server";
import { updateUserProjectDirectory } from "@/lib/project-directories";
import { projectDirectoryUpdateSchema } from "@/lib/project-directory-schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireVerifiedUser(request);
    const body = projectDirectoryUpdateSchema.parse(await request.json());
    const result = await updateUserProjectDirectory(decoded.uid, body.projectId, body);

    return NextResponse.json(result);
  } catch (error) {
    return apiErrorResponse(error, "Unable to complete this request. Please try again.", undefined);
  }
}
