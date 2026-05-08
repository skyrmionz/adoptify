import type { Mission } from "@/content/types";

export const channelsPicker: Mission = {
  id: "channels-and-launch.channels-picker",
  slug: "choose-your-channels",
  number: 1,
  title: "Choose Your Channels",
  summary: "Pick the surfaces where end users will actually talk to your agent.",
  estMinutes: 25,
  steps: [
    {
      kind: "richContent",
      title: "Channel = where your agent shows up",
      subtitle: "Most agents launch on one or two channels first. You can always add more later.",
      blocks: [
        { kind: "p", text: "Each channel has its own prerequisites — a Connected App, a deployment record, a Messaging Channel, a phone vendor, etc. Pick the channels you actually plan to launch on so we can run prerequisite checks against your org." },
      ],
    },
    {
      kind: "channelPlanner",
      title: "Pick your launch channels",
      description: "Multi-select — most builds start with one or two. Each channel will show its specific prerequisites.",
      options: [
        {
          id: "default-agent",
          name: "Default Agent (in-app utility bar)",
          blurb: "Pinned to the bottom of a Lightning app for internal users.",
          prerequisites: [
            "Default Agent set in Setup",
            "Agentforce panel added to the Lightning App utility bar",
            "Test users have the Agentforce User PSL",
          ],
        },
        {
          id: "embedded-service",
          name: "Embedded Service (web + mobile)",
          blurb: "Drop-in chat snippet for your website, iOS, and Android apps.",
          prerequisites: [
            "Messaging Channel for Web / In-App provisioned",
            "Embedded Service Deployment created",
            "Snippet hosted on the target site",
            "Guest user profile permissions reviewed",
          ],
        },
        {
          id: "experience-cloud",
          name: "Experience Cloud",
          blurb: "Add the agent to a partner or customer community.",
          prerequisites: [
            "Experience Cloud site published",
            "Agentforce Messaging component added to a page",
            "Guest profile permissions for the agent reviewed",
          ],
        },
        {
          id: "slack",
          name: "Slack",
          blurb: "Talk to the agent inside Slack channels and DMs.",
          prerequisites: [
            "Agentforce in Slack app installed in the Slack workspace",
            "Salesforce org connected to Slack workspace",
            "Agentforce in Slack PSL assigned to users",
          ],
        },
        {
          id: "voice",
          name: "Service Cloud Voice",
          blurb: "Inbound voice with the agent on the line (or as a copilot for human reps).",
          prerequisites: [
            "Service Cloud Voice with Amazon Connect provisioned",
            "Agentforce Voice add-on enabled",
            "Voice channel + Conversation Intelligence configured",
            "Routing flow points to the agent",
          ],
        },
        {
          id: "whatsapp",
          name: "WhatsApp",
          blurb: "Two-way conversational messaging via WhatsApp Business.",
          prerequisites: [
            "WhatsApp Business account provisioned",
            "Messaging Channel of type WhatsApp set up",
            "Routing flow hands off to the agent",
          ],
        },
        {
          id: "sms",
          name: "SMS",
          blurb: "Two-way SMS via short or long codes through Salesforce.",
          prerequisites: [
            "SMS short/long code provisioned via Salesforce",
            "Messaging Channel of type SMS set up",
            "Routing flow hands off to the agent",
          ],
        },
        {
          id: "facebook",
          name: "Facebook Messenger",
          blurb: "Two-way Messenger via your Facebook page.",
          prerequisites: [
            "Facebook Page connected via Messaging settings",
            "Messaging Channel of type Facebook Messenger set up",
            "Routing flow hands off to the agent",
          ],
        },
        {
          id: "msteams",
          name: "Microsoft Teams (Beta)",
          blurb: "Talk to the agent inside Teams channels and chats.",
          prerequisites: [
            "Agentforce for Teams app installed in the Teams tenant",
            "Salesforce org OAuth-authorized to Teams",
            "Beta enrollment confirmed",
          ],
        },
        {
          id: "email",
          name: "Email Channel",
          blurb: "Agent drafts replies for human review (Email-to-Case + Service Replies).",
          prerequisites: [
            "Email-to-Case configured",
            "Einstein Service Replies for Email enabled",
            "Reviewer queue for human-in-the-loop send",
          ],
        },
        {
          id: "agentforce-api",
          name: "Agentforce API (headless)",
          blurb: "Embed the agent in your own custom UI via the Agentforce API.",
          prerequisites: [
            "Connected App with sfap_api / chatbot_api scopes",
            "Client credentials flow tested",
            "Streaming SSE handler implemented in your client",
          ],
        },
        {
          id: "mulesoft",
          name: "MuleSoft Topic Center",
          blurb: "Expose existing Anypoint APIs as agent topics.",
          prerequisites: [
            "Anypoint Platform connected",
            "MuleSoft for Agentforce connector installed",
            "API catalog entries marked as agent-discoverable",
          ],
        },
      ],
    },
  ],
  verify: {
    type: "evidence.review",
    explain: "At least one channel selected with prerequisites acknowledged.",
  },
};
