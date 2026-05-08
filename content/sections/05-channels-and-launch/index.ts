import type { Section } from "@/content/types";
import { channelsPicker } from "./01-channels-picker";
import { trustAndGovernance } from "./02-trust-and-governance";
import { goLive } from "./03-go-live";
import { operateAndImprove } from "./04-operate-and-improve";

export const channelsAndLaunch: Section = {
  id: "channels-and-launch",
  slug: "channels-and-launch",
  title: "Channels & Launch",
  description: "Pick channels, lock down trust, go live, and stand up the operate-and-improve loop.",
  required: false,
  missions: [channelsPicker, trustAndGovernance, goLive, operateAndImprove],
};
