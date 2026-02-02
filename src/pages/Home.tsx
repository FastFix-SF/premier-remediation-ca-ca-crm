
import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import RoofingFriendHero from '../components/RoofingFriendHero';
import Certifications from '../components/Certifications';
import CaliforniaServiceMap from '../components/CaliforniaServiceMap';
import StatisticsSection from '../components/StatisticsSection';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { LocalBusinessStructuredData } from '../components/StructuredData';

const Home = () => {

  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      <LocalBusinessStructuredData />
      <RoofingFriendHeader />
      <RoofingFriendHero />
      <Certifications />
      <CaliforniaServiceMap />
      <StatisticsSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Home;
