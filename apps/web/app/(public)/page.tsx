import CategoriesGrid from "@/components/home/CategoriesGrid";
import FinalCta from "@/components/home/FinalCta";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import NewsletterCta from "@/components/home/NewsletterCta";
import PopularBrands from "@/components/home/PopularBrands";
import QuizCta from "@/components/home/QuizCta";
import RecentReviews from "@/components/home/RecentReviews";
import TrustSignals from "@/components/home/TrustSignals";
import ValueProps from "@/components/home/ValueProps";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <CategoriesGrid />
      <PopularBrands />
      <RecentReviews />
      <TrustSignals />
      <QuizCta />
      <NewsletterCta />
      <FinalCta />
    </>
  );
}
