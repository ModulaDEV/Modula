import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { Agents } from "@/components/sections/Agents";
import { Economics } from "@/components/sections/Economics";
import { Registry } from "@/components/sections/Registry";
import { Faq } from "@/components/sections/Faq";
import { CallToAction } from "@/components/sections/CallToAction";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Agents />
      <Economics />
      <Registry />
      <Faq />
      <CallToAction />
    </>
  );
}
