import type { Section } from "@/content/types";
import { licenses } from "./01-licenses";
import { permissionSets } from "./02-permission-sets";
import { turnOnAgentforce } from "./03-turn-on-agentforce";
import { defaultAgent } from "./04-default-agent";

export const salesforceSetup: Section = {
  id: "salesforce-setup",
  slug: "salesforce-setup",
  title: "Salesforce Setup & Licensing",
  description: "Get your org licensed, permissioned, and toggled on so Agentforce can run.",
  required: true,
  missions: [licenses, permissionSets, turnOnAgentforce, defaultAgent],
};
