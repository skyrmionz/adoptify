import type { Mission } from "@/content/types";

export const dataCloud: Mission = {
  id: "data-foundations.data-cloud",
  slug: "data-cloud-foundation",
  number: 2,
  title: "Data Cloud Foundation",
  summary: "Stand up the Data Cloud pieces an agent uses for retrieval and grounding.",
  estMinutes: 30,
  steps: [
    {
      kind: "richContent",
      title: "Why Data Cloud matters for agents",
      subtitle: "Data Cloud is the substrate Agentforce uses for retrieval, semantic search, and grounding.",
      blocks: [
        { kind: "p", text: "Out of the box, an agent can already use Knowledge and direct record queries. But the moment you want to ground an answer in unstructured content (PDFs, transcripts, web pages, knowledge articles in another tool), or you want hybrid lexical + semantic search, the path runs through Data Cloud." },
        { kind: "h", level: 3, text: "The pieces" },
        { kind: "kv", rows: [
          { k: "Data Streams", v: "Connectors that pull source data on a schedule (Salesforce CRM, S3, Web/Mobile SDK, ingest API)." },
          { k: "Data Lake Objects (DLOs)", v: "Raw landing tables for ingested data." },
          { k: "Data Model Objects (DMOs)", v: "Harmonized, agent-friendly tables. Map DLOs into DMOs." },
          { k: "Identity Resolution", v: "Rulesets that produce a Unified Individual record by matching across sources." },
          { k: "Search Index + Vector DB", v: "Backs semantic search. Indexes chunks of content with embeddings." },
          { k: "Retrievers", v: "Named queries the agent's standard actions consume to fetch grounded data." },
        ] },
        { kind: "callout", tone: "info", text: "If you only need Knowledge grounding, you can skip a lot of this. But anything beyond Knowledge — FAQs, policies, transcripts, partner content — typically lives in Data Cloud." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify your Data Cloud foundation",
      items: [
        {
          id: "dc.provisioned",
          label: "Data Cloud provisioned",
          help: "Detected via the presence of any Data Lake Object.",
          verify: { kind: "scanner.path", path: "dataDepth.data_lake_objects", expect: { gte: 1 } },
        },
        {
          id: "dc.data-stream",
          label: "At least one Data Stream defined",
          help: "Pulls data from a source system into Data Cloud.",
          verify: { kind: "scanner.path", path: "dataDepth.data_streams", expect: { gte: 1 } },
        },
        {
          id: "dc.dmo-mapped",
          label: "At least one Data Model Object mapped",
          help: "DMOs are how the agent reasons about your data.",
          verify: {
            kind: "tooling.soql",
            soql: "SELECT Id FROM MktDataModelObject",
            expect: { minCount: 1 },
          },
        },
        {
          id: "dc.identity",
          label: "Identity Resolution ruleset defined",
          help: "Required for unified profiles and personalization.",
          verify: { kind: "scanner.path", path: "dataDepth.identity_resolution_rulesets", expect: { gte: 1 } },
        },
        {
          id: "dc.search-index",
          label: "Search Index / Semantic Search reviewed",
          help: "Setup → Data Cloud → Search Index. Often opt-in per DMO.",
          verify: { kind: "manual" },
        },
        {
          id: "dc.retriever",
          label: "Retriever created and tested",
          help: "Required for the 'Answer Questions with Knowledge' action when using Data Cloud sources.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Data Cloud provisioned and at least one stream + DMO mapped.",
  },
};
