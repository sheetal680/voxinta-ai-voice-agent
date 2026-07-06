import { AiDemo } from "./_components/ai-demo";
import { Cta } from "./_components/cta";
import { Faq } from "./_components/faq";
import { Features } from "./_components/features";
import { Hero } from "./_components/hero";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <AiDemo />
      <Faq />
      <Cta />
    </>
  );
}
