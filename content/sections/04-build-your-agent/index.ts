import type { Section } from "@/content/types";
import { pickAgentType } from "./01-pick-agent-type";
import { topics } from "./02-topics";
import { actionsInventory } from "./03-actions-inventory";
import { promptTemplates } from "./04-prompt-templates";
import { apexAndFlow } from "./05-apex-and-flow";
import { apiActions } from "./06-api-actions";
import { testingAgent } from "./07-testing";

export const buildYourAgent: Section = {
  id: "build-your-agent",
  slug: "build-your-agent",
  title: "Build Your Agent",
  description: "Pick a template, design topics, wire up actions, design prompts, and test before you ship.",
  required: true,
  missions: [pickAgentType, topics, actionsInventory, promptTemplates, apexAndFlow, apiActions, testingAgent],
};
