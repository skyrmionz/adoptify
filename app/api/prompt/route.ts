import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOrMintRawToken } from "@/lib/api-tokens";
import {
  buildConnectPrompt,
  buildKnowledgeCheckPrompt,
  buildScanPrompt,
  buildVerifyPrompt,
} from "@/lib/prompts";
import type { VerifyRule } from "@/lib/salesforce";

export const runtime = "nodejs";

type Body =
  | { kind: "connect" }
  | { kind: "scan" }
  | { kind: "knowledge-check"; sourceKind: "salesforce-knowledge" | "data-cloud" }
  | { kind: "verify"; ruleId: string; missionId: string; stepId?: string; ruleLabel: string; rule: VerifyRule };

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { raw: apiToken, lastFour } = await getOrMintRawToken(user.id);
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const ctx = { apiToken, appUrl };

  let prompt: string;
  switch (body.kind) {
    case "connect":
      prompt = buildConnectPrompt(ctx);
      break;
    case "scan":
      prompt = buildScanPrompt(ctx);
      break;
    case "verify":
      prompt = buildVerifyPrompt(ctx, {
        ruleId: body.ruleId,
        missionId: body.missionId,
        stepId: body.stepId,
        ruleLabel: body.ruleLabel,
        rule: body.rule,
      });
      break;
    case "knowledge-check":
      prompt = buildKnowledgeCheckPrompt(ctx, { kind: body.sourceKind });
      break;
    default:
      return NextResponse.json({ error: "unknown_kind" }, { status: 400 });
  }

  return NextResponse.json({ prompt, lastFour });
}
