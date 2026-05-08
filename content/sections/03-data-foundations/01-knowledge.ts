import type { Mission } from "@/content/types";

export const knowledgeDeep: Mission = {
  id: "data-foundations.knowledge",
  slug: "salesforce-knowledge",
  number: 1,
  title: "Salesforce Knowledge",
  summary: "Set up Lightning Knowledge so your agent has authoritative articles to retrieve from.",
  estMinutes: 25,
  steps: [
    {
      kind: "richContent",
      title: "How Knowledge plugs into an agent",
      subtitle: "Knowledge is the simplest, most controllable grounding source you can give an agent.",
      blocks: [
        { kind: "p", text: "When an agent answers a 'how do I…' or 'why is my…' question, the highest-quality answers come from articles a human has explicitly written and approved. The standard 'Answer Questions with Knowledge' action lets your agent retrieve from your published Knowledge corpus, cite the article, and stay within your policy." },
        { kind: "h", level: 3, text: "Pieces of Knowledge to set up" },
        { kind: "kv", rows: [
          { k: "Lightning Knowledge", v: "The modern article object (record types of Knowledge__kav). Required — Classic Knowledge isn't supported." },
          { k: "Article record types", v: "Different shapes of articles (FAQ, How-To, Policy). Each can have its own fields." },
          { k: "Data Categories", v: "Hierarchical taxonomy. Drives sharing, language, and which audience sees which articles." },
          { k: "Channels", v: "Internal, Customer, Partner, Public. Determines which agents can retrieve which articles." },
          { k: "Publishing workflow", v: "Draft → Review → Publish. Only published articles are exposed to agents." },
        ] },
        { kind: "callout", tone: "warn", text: "Drafts are invisible to agents. If a brand-new agent isn't returning answers in testing, the most common cause is articles still sitting in Draft." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Verify Knowledge readiness",
      items: [
        {
          id: "knowledge.enabled",
          label: "Lightning Knowledge enabled",
          help: "Setup → Knowledge Settings → Lightning Knowledge.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM Knowledge__kav",
            expect: { minCount: 1 },
          },
          doc: "https://help.salesforce.com/s/articleView?id=sf.knowledge_setup.htm",
        },
        {
          id: "knowledge.published",
          label: "At least one published article exists",
          help: "We count articles where PublishStatus = 'Online'.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM Knowledge__kav WHERE PublishStatus = 'Online'",
            expect: { minCount: 1 },
          },
        },
        {
          id: "knowledge.depth",
          label: "Substantive corpus (≥ 10 published articles)",
          help: "Below 10 articles, retrieval-quality typically isn't strong enough for production.",
          verify: {
            kind: "rest.soql",
            soql: "SELECT COUNT(Id) FROM Knowledge__kav WHERE PublishStatus = 'Online'",
            expect: { minCount: 10 },
          },
        },
        {
          id: "knowledge.data-categories",
          label: "Data Categories defined for routing",
          help: "Drives multilingual + audience scoping. Verify in Setup → Data Category Setup.",
          verify: { kind: "manual" },
        },
        {
          id: "knowledge.channels",
          label: "Article channels reviewed",
          help: "Confirm public-facing agents only retrieve from articles flagged for the right channel.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Lightning Knowledge enabled, articles published, and channel/category strategy reviewed.",
  },
};
