import React from 'react';
import { Helmet } from 'react-helmet-async';
import { companyConfig } from '@/config/company';

interface LocalBusinessProps {
  location?: {
    name: string;
    address?: string;
    phone?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export const LocalBusinessStructuredData: React.FC<LocalBusinessProps> = ({ location }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RoofingContractor",
    "name": companyConfig.seo.siteName,
    "description": "Professional metal roofing installation, repair, and replacement services",
    "url": window.location.origin,
    "telephone": companyConfig.phone,
    "email": companyConfig.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": location?.address || companyConfig.address.street,
      "addressLocality": location?.name || companyConfig.address.city,
      "addressRegion": companyConfig.address.state,
      "postalCode": companyConfig.address.zip,
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": location?.coordinates?.lat || companyConfig.coordinates.lat,
      "longitude": location?.coordinates?.lng || companyConfig.coordinates.lng
    },
    "areaServed": companyConfig.serviceAreas.map(area => `${area}, CA`),
    "serviceType": [
      "Metal Roof Installation",
      "Roof Repair",
      "Roof Replacement",
      "Standing Seam Roofing",
      "R-Panel Installation",
      "Commercial Roofing",
      "Residential Roofing"
    ],
    "hasCredential": [
      "Licensed Contractor",
      "Insured Business",
      `${companyConfig.warranty.years}-Year Warranty`
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": companyConfig.ratings.average,
      "reviewCount": companyConfig.ratings.count,
      "bestRating": companyConfig.ratings.best,
      "worstRating": companyConfig.ratings.worst
    },
    "priceRange": companyConfig.priceRange,
    "paymentAccepted": ["Cash", "Check", "Credit Card", "Financing Available"],
    "currenciesAccepted": "USD",
    "openingHours": companyConfig.hours.schema,
    "sameAs": [
      companyConfig.social.facebook,
      companyConfig.social.instagram,
      companyConfig.social.linkedin
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
};

export const ServiceStructuredData: React.FC<{ serviceName: string; location?: string }> = ({ serviceName, location }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "provider": {
      "@type": "RoofingContractor",
      "name": companyConfig.seo.siteName,
      "telephone": companyConfig.phone,
      "email": companyConfig.email
    },
    "areaServed": location || companyConfig.address.region,
    "serviceType": "Roofing",
    "description": `Professional ${serviceName.toLowerCase()} services in ${location || 'the Bay Area'}`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "description": "Free estimates available"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
};

export const FAQStructuredData: React.FC<{ faqs: Array<{ question: string; answer: string }> }> = ({ faqs }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
};

export const BreadcrumbStructuredData: React.FC<{ items: Array<{ name: string; url: string }> }> = ({ items }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData, null, 2)}
      </script>
    </Helmet>
  );
};
