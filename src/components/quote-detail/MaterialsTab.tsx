import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RFItemsTab } from './RFItemsTab';
import { PinsTab } from './PinsTab';

interface MaterialsTabProps {
  quoteId: string;
}

export function MaterialsTab({ quoteId }: MaterialsTabProps) {
  return (
    <Tabs defaultValue="shingles" className="space-y-6">
      <div className="bg-muted/50 rounded-xl border shadow-sm p-1.5 inline-flex">
        <TabsList variant="segmented">
          <TabsTrigger variant="segmented" value="shingles">Shingles</TabsTrigger>
          <TabsTrigger variant="segmented" value="services">Services</TabsTrigger>
          <TabsTrigger variant="segmented" value="other-materials">Other Materials</TabsTrigger>
          <TabsTrigger variant="segmented" value="pins">Pins</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="shingles" className="space-y-6">
        <RFItemsTab quoteId={quoteId} itemType="shingles" />
      </TabsContent>

      <TabsContent value="services" className="space-y-6">
        <RFItemsTab quoteId={quoteId} itemType="services" />
      </TabsContent>

      <TabsContent value="other-materials" className="space-y-6">
        <RFItemsTab quoteId={quoteId} />
      </TabsContent>

      <TabsContent value="pins" className="space-y-6">
        <PinsTab quoteId={quoteId} />
      </TabsContent>
    </Tabs>
  );
}
