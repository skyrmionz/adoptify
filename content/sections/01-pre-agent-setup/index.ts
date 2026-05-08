import type { Section } from "@/content/types";
import { definingUseCases } from "./01-defining-use-cases";
import { knowledge } from "./02-knowledge";
import { orgDetails } from "./03-org-details";
import { stakeholders } from "./04-stakeholders";

export const preAgentSetup: Section = {
  id: "pre-agent-setup",
  slug: "pre-agent-setup",
  title: "Pre-Agent Setup",
  description: "The foundation. Find your use cases, line up knowledge, scan your org, and lock in stakeholders before building.",
  required: true,
  missions: [definingUseCases, knowledge, orgDetails, stakeholders],
};
