
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from './ui/accordion';
import { useFAQs, useBusiness, useAreas } from '@/hooks/useBusinessConfig';

const FAQSection = () => {
  const configFaqs = useFAQs();
  const business = useBusiness();
  const areas = useAreas();

  // Use FAQs from config if available, otherwise use empty array
  const faqs = configFaqs.length > 0
    ? configFaqs.map(faq => ({ question: faq.question, answer: faq.answer }))
    : [];

  // Build area text for dynamic content
  const areaNames = areas.slice(0, 5).map(a => a.name).join(', ');
  const areaCount = areas.length;
  return (
    <section className="py-16 lg:py-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about our services at {business.name}.
          </p>
        </div>

        {faqs.length > 0 ? (
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-lg px-6 py-2 hover:shadow-sm transition-shadow"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pt-2">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Contact us directly with any questions you may have.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`tel:${business.phoneRaw}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Call {business.phone}
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
