import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { SimulatorSection } from "@/components/landing/SimulatorSection";
import { KanbanSection } from "@/components/landing/KanbanSection";
import { AttendantSection } from "@/components/landing/AttendantSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SalesBoostSection } from "@/components/landing/SalesBoostSection";
import { MobileSection } from "@/components/landing/MobileSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SimulatorSection />
      <KanbanSection />
      <AttendantSection />
      <FeaturesSection />
      <SalesBoostSection />
      <MobileSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
