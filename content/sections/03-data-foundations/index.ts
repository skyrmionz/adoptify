import type { Section } from "@/content/types";
import { knowledgeDeep } from "./01-knowledge";
import { dataCloud } from "./02-data-cloud";
import { objectsReadiness } from "./03-objects-readiness";
import { unstructuredData } from "./04-unstructured-data";

export const dataFoundations: Section = {
  id: "data-foundations",
  slug: "data-foundations",
  title: "Data & Knowledge Foundations",
  description: "Set up the Knowledge, Data Cloud, and unstructured-data foundations the agent retrieves from.",
  required: true,
  missions: [knowledgeDeep, dataCloud, objectsReadiness, unstructuredData],
};
