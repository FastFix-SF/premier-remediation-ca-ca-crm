
import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { companyConfig } from '@/config/company';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Privacy Policy - ${companyConfig.name}`}
        description={`Privacy Policy for ${companyConfig.name}. Learn how we collect, use, and protect your personal information.`}
      />
      <RoofingFriendHeader />
      
      <main className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Information We Collect</h2>
              <p className="text-muted-foreground mb-4">
                We collect information you provide directly to us, such as when you create an account, 
                make a purchase, request a quote, or contact us for support.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Contact information (name, email, phone number, address)</li>
                <li>Project details and service requests</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Communications with our team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">How We Use Your Information</h2>
              <p className="text-muted-foreground mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Communicate with you about products, services, and events</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Information Sharing</h2>
              <p className="text-muted-foreground mb-4">
                We do not sell, trade, or otherwise transfer your personal information to third parties 
                without your consent, except as described in this policy or as required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-4">
                We implement appropriate security measures to protect your personal information against 
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 text-muted-foreground">
                <p>Email: {companyConfig.email}</p>
                <p>Phone: {companyConfig.phone}</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
