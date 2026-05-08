import type { Mission } from "@/content/types";

export const unstructuredData: Mission = {
  id: "data-foundations.unstructured-data",
  slug: "files-and-unstructured-data",
  number: 4,
  title: "Files & Unstructured Data",
  summary: "Bring in PDFs, transcripts, and other unstructured content the agent should reason over.",
  estMinutes: 20,
  steps: [
    {
      kind: "richContent",
      title: "What 'unstructured' means here",
      blocks: [
        { kind: "p", text: "Anything that isn't already a row in a Salesforce object — PDFs, HTML pages, call transcripts, attachments — has to be ingested, chunked, and embedded before an agent can retrieve from it. Data Cloud's Unstructured Data Stream is the standard path." },
        { kind: "h", level: 3, text: "The pipeline" },
        { kind: "ol", items: [
          "Ingest: pull files from the source (S3, SharePoint, Google Drive, Salesforce Files).",
          "Chunk: split into retrieval-friendly windows (e.g. 512 tokens with overlap).",
          "Embed: generate vector embeddings via the configured model.",
          "Index: store chunks + embeddings in the Data Cloud Vector DB.",
          "Retrieve: a Retriever query the agent invokes at runtime.",
        ] },
        { kind: "callout", tone: "info", text: "PDFs that are scanned images need OCR before chunking. Most ingestion pipelines include this; verify on a sample before scaling." },
      ],
    },
    {
      kind: "setupChecklist",
      title: "Validate your unstructured pipeline",
      items: [
        {
          id: "unstructured.stream",
          label: "Unstructured Data Stream configured",
          help: "Data Cloud → Data Streams → 'Create Unstructured Data Stream'.",
          verify: { kind: "manual" },
        },
        {
          id: "unstructured.chunking",
          label: "Chunking strategy reviewed",
          help: "Default 512 tokens / 64 overlap is fine for most cases. Tune if your content is unusually long-form.",
          verify: { kind: "manual" },
        },
        {
          id: "unstructured.test-retriever",
          label: "Test retriever returns expected snippets",
          help: "Run the retriever in Setup against 3 representative queries.",
          verify: { kind: "manual" },
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "Unstructured ingestion is set up or explicitly out of scope.",
  },
};
