import type { Section } from "@/content/types";
import { definingUseCases } from "./01-defining-use-cases";
import { knowledge } from "./02-knowledge";
import { orgDetails } from "./03-org-details";

export const preAgentSetup: Section = {
  id: "pre-agent-setup",
  slug: "pre-agent-setup",
  title: "Pre-Agent Setup",
  description: "The foundation. Complete these three before building any agents.",
  required: true,
  missions: [definingUseCases, knowledge, orgDetails],
};
