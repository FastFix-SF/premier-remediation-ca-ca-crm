
import React from 'react';
import RoofingFriendHeader from '../components/RoofingFriendHeader';
import Footer from '../components/Footer';
import SEOHead from '../components/SEOHead';
import { companyConfig } from '@/config/company';

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={`Terms of Service - ${companyConfig.name}`}
        description={`Terms of Service for ${companyConfig.name}. Read our terms and conditions for using our services.`}
      />
      <RoofingFriendHeader />
      
      <main className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-8">
            Terms of Service
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-muted-foreground mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-4">
                By accessing and using {companyConfig.name}'s services, you accept and agree to be bound 
                by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Services</h2>
              <p className="text-muted-foreground mb-4">
                {companyConfig.name} provides metal roofing installation, repair, and material supply 
                services throughout the {companyConfig.address.region}.
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>All services are subject to availability and scheduling</li>
                <li>Estimates are valid for 30 days unless otherwise specified</li>
                <li>Work begins only after signed contract and required deposits</li>
                <li>Changes to scope of work may affect pricing and timeline</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Warranties</h2>
              <p className="text-muted-foreground mb-4">
                We provide comprehensive warranties on our work and materials:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>{companyConfig.warranty.description}</li>
                <li>5-year warranty on workmanship</li>
                <li>1-year warranty on repairs</li>
                <li>Warranty terms and conditions apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Payment Terms</h2>
              <p className="text-muted-foreground mb-4">
                Payment terms are outlined in individual contracts and may include:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                <li>Deposit required to begin work</li>
                <li>Progress payments as work is completed</li>
                <li>Final payment due upon completion and approval</li>
                <li>Late payment fees may apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Liability</h2>
              <p className="text-muted-foreground mb-4">
                {companyConfig.name} carries comprehensive insurance and limits liability as permitted by law. 
                Our liability is limited to the cost of repairs or replacement of defective work or materials.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">Contact Information</h2>
              <p className="text-muted-foreground">
                For questions about these terms, please contact us:
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

export default Terms;
