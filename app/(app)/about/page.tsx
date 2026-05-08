import { AboutDeck } from "@/components/about/AboutDeck";

export const runtime = "nodejs";

export default function AboutPage() {
  return (
    <div className="-mx-8 -my-10 h-[calc(100vh-3.5rem)] flex flex-col">
      <AboutDeck />
    </div>
  );
}
