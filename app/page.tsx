import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { ProtocolMetrics } from "@/components/sections/ProtocolMetrics";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { Agents } from "@/components/sections/Agents";
import { Economics } from "@/components/sections/Economics";
import { Registry } from "@/components/sections/Registry";
import { Faq } from "@/components/sections/Faq";
import { CallToAction } from "@/components/sections/CallToAction";
import { listModels, getStats, type StatsDto } from "@/lib/api";
import { toRegistryModel } from "@/lib/adapters";
import type { RegistryModel } from "@/data/models";

export default async function HomePage() {
  // Best-effort fetch — Registry + ProtocolMetrics both render mock
  // / placeholder values when the indexer is unreachable, so the
  // marketing site stays renderable even if the data plane is
  // degraded.
  let preview: RegistryModel[] | undefined;
  let stats:   StatsDto | null = null;
  try {
    const [models, s] = await Promise.all([
      listModels({ limit: 4 }),
      getStats(),
    ]);
    if (models.items.length > 0) preview = models.items.map(toRegistryModel);
    stats = s;
  } catch (err) {
    console.warn("[home] indexer fetch failed, using mock + placeholders", err);
  }

  return (
    <>
      <Hero />
      <Stats />
      <ProtocolMetrics stats={stats} />
      <HowItWorks />
      <Features />
      <Agents />
      <Economics />
      <Registry models={preview} />
      <Faq />
      <CallToAction />
    </>
  );
}
