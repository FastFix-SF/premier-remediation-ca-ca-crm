import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateLineQuantity, calculateExtendedPrice, calculateEstimateTotals } from '@/lib/roof-quoter/calculations';
import type { PriceSheet, PriceSheetLine, Quantities } from '@/types/roof-quoter';

interface EstimateTabProps {
  projectId: string;
}

export function EstimateTab({ projectId }: EstimateTabProps) {
  const [selectedPriceSheetId, setSelectedPriceSheetId] = useState<string>('');
  const [settings, setSettings] = useState({
    overheadPct: 10,
    profitPct: 15,
    wastePct: 5
  });
  const [manualQuantities, setManualQuantities] = useState<Record<string, number>>({});

  // Fetch price sheets
  const { data: priceSheets } = useQuery({
    queryKey: ['price-sheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_sheets')
        .select('*')
        .eq('is_active', true)
        .order('system');

      if (error) throw error;
      return data?.map(sheet => ({
        ...sheet,
        lines: Array.isArray(sheet.lines) ? (sheet.lines as unknown as PriceSheetLine[]) : []
      })) as PriceSheet[];
    }
  });

  // Fetch quantities
  const { data: quantities } = useQuery({
    queryKey: ['quantities', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quantities')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data as Quantities | null;
    }
  });

  // Fetch pins for pin-based quantities
  const { data: pins } = useQuery({
    queryKey: ['pins', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    }
  });

  const selectedPriceSheet = priceSheets?.find(sheet => sheet.id === selectedPriceSheetId);

  const calculateLineItem = (line: PriceSheetLine) => {
    if (!quantities) return { baseQty: 0, extendedPrice: 0 };

    const baseQty = calculateLineQuantity(
      line, 
      quantities, 
      pins || [], 
      manualQuantities[line.code] || 0
    );

    const extendedPrice = calculateExtendedPrice(
      baseQty,
      line.wastePct,
      line.unitCost,
      line.markupPct
    );

    return { baseQty, extendedPrice };
  };

  const calculateTotals = () => {
    if (!selectedPriceSheet) return { subtotal: 0, overhead: 0, profit: 0, total: 0 };

    const subtotal = selectedPriceSheet.lines.reduce((sum, line) => {
      const { extendedPrice } = calculateLineItem(line);
      return sum + extendedPrice;
    }, 0);

    return calculateEstimateTotals(subtotal, settings.overheadPct, settings.profitPct);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Price Sheet Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing System</CardTitle>
          <CardDescription>
            Select a roofing system to generate pricing estimates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Roofing System</Label>
              <Select value={selectedPriceSheetId} onValueChange={setSelectedPriceSheetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing system" />
                </SelectTrigger>
                <SelectContent>
                  {priceSheets?.map((sheet) => (
                    <SelectItem key={sheet.id} value={sheet.id}>
                      {sheet.name} ({sheet.system})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Global Waste %</Label>
              <Input
                type="number"
                value={settings.wastePct}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  wastePct: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimate Table */}
      {selectedPriceSheet && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedPriceSheet.name}</CardTitle>
                <CardDescription>
                  Detailed pricing breakdown for {selectedPriceSheet.system} system
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {selectedPriceSheet.system}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Base Qty</TableHead>
                    <TableHead className="text-right">Waste %</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Markup %</TableHead>
                    <TableHead className="text-right">Extended</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedPriceSheet.lines.map((line) => {
                    const { baseQty, extendedPrice } = calculateLineItem(line);
                    
                    return (
                      <TableRow key={line.code}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{line.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {line.code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{line.unit}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {line.qtyFrom === 'manual' ? (
                            <Input
                              type="number"
                              value={manualQuantities[line.code] || 0}
                              onChange={(e) => setManualQuantities(prev => ({
                                ...prev,
                                [line.code]: parseFloat(e.target.value) || 0
                              }))}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            baseQty.toFixed(2)
                          )}
                        </TableCell>
                        <TableCell className="text-right">{line.wastePct}%</TableCell>
                        <TableCell className="text-right">${line.unitCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{line.markupPct}%</TableCell>
                        <TableCell className="text-right font-medium">
                          ${extendedPrice.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals and Settings */}
      {selectedPriceSheet && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Estimate Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Overhead %</Label>
                <Input
                  type="number"
                  value={settings.overheadPct}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    overheadPct: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Profit %</Label>
                <Input
                  type="number"
                  value={settings.profitPct}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    profitPct: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Estimate Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Material Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Overhead ({settings.overheadPct}%):</span>
                  <span className="font-medium">${totals.overhead.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Profit ({settings.profitPct}%):</span>
                  <span className="font-medium">${totals.profit.toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mt-4">
                Save Estimate
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}