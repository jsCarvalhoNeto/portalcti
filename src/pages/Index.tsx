import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import ProjectsSection from "@/components/ProjectsSection";
import NewsEventsSection from "@/components/NewsEventsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProjectsSection />
        <NewsEventsSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
