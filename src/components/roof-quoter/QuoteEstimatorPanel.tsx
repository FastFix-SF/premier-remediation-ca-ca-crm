import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calculator, DollarSign, Download, Loader2 } from 'lucide-react';
import { useRoofQuoteEstimator } from '@/hooks/useRoofQuoteEstimator';
import { PITCH_PRESETS } from '@/lib/roof/pitch';
import { toast } from 'sonner';

interface QuoteEstimatorPanelProps {
  maskPolygon?: Array<{ x: number; y: number }>;
  imageUrl?: string;
  quoteId?: string;
  onQuoteGenerated?: (data: any) => void;
}

export function QuoteEstimatorPanel({
  maskPolygon,
  imageUrl,
  quoteId,
  onQuoteGenerated
}: QuoteEstimatorPanelProps) {
  const { generateQuote, isGenerating, data } = useRoofQuoteEstimator();
  const [pitch, setPitch] = useState('4/12');
  const [pricingConfig, setPricingConfig] = useState({
    costPerSquare: 350,
    laborPerSquare: 150,
    edgeCostPerFoot: 8,
    ventCost: 150,
    chimneyCost: 800,
    skylightCost: 1200,
    hvacCost: 500
  });

  const canGenerate = maskPolygon && maskPolygon.length >= 3 && imageUrl;

  const handleGenerateQuote = async () => {
    if (!canGenerate) {
      toast.error('Cannot generate quote', {
        description: 'Please draw a roof mask first using Smart Complete Analysis'
      });
      return;
    }

    try {
      const result = await generateQuote({
        maskPolygon: maskPolygon!,
        imageUrl: imageUrl!,
        pitch,
        quoteId,
        pricingConfig
      });
      
      if (onQuoteGenerated) {
        onQuoteGenerated(result);
      }
    } catch (error) {
      console.error('Failed to generate quote:', error);
    }
  };

  const handleDownloadQuote = () => {
    if (!data?.estimate) return;

    const quote = {
      generatedAt: new Date().toISOString(),
      roofArea: data.estimate.roofArea,
      edges: data.estimate.edges,
      features: data.estimate.features,
      pricing: data.estimate.pricing,
      roofType: data.roofType,
      confidence: data.estimate.confidence
    };

    const blob = new Blob([JSON.stringify(quote, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roof-quote-${quoteId || 'estimate'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Quote downloaded');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AI Roof Quote Estimator
          </CardTitle>
          <CardDescription>
            Generate accurate roof quotes using AI analysis and geometric validation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pitch Selection */}
          <div className="space-y-2">
            <Label htmlFor="pitch">Roof Pitch</Label>
            <Select value={pitch} onValueChange={setPitch}>
              <SelectTrigger id="pitch">
                <SelectValue placeholder="Select pitch" />
              </SelectTrigger>
              <SelectContent>
                {PITCH_PRESETS.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Pricing Configuration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="costPerSquare" className="text-xs">
                  Cost per Square
                </Label>
                <Input
                  id="costPerSquare"
                  type="number"
                  value={pricingConfig.costPerSquare}
                  onChange={(e) => setPricingConfig(prev => ({
                    ...prev,
                    costPerSquare: Number(e.target.value)
                  }))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="laborPerSquare" className="text-xs">
                  Labor per Square
                </Label>
                <Input
                  id="laborPerSquare"
                  type="number"
                  value={pricingConfig.laborPerSquare}
                  onChange={(e) => setPricingConfig(prev => ({
                    ...prev,
                    laborPerSquare: Number(e.target.value)
                  }))}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateQuote}
            disabled={!canGenerate || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Quote...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-4 w-4" />
                Generate Quote
              </>
            )}
          </Button>

          {!canGenerate && (
            <p className="text-xs text-muted-foreground text-center">
              Draw a roof mask using Smart Complete Analysis first
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quote Results */}
      {data?.estimate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Quote Estimate
              </span>
              <Button onClick={handleDownloadQuote} variant="outline" size="sm">
                <Download className="mr-2 h-3 w-3" />
                Download
              </Button>
            </CardTitle>
            <CardDescription>
              {data.roofType} roof - {(data.estimate.confidence * 100).toFixed(0)}% confidence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Roof Area */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Roof Area</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan Area:</span>
                  <span className="ml-2 font-medium">
                    {data.estimate.roofArea.planArea.toFixed(0)} sq ft
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Surface Area:</span>
                  <span className="ml-2 font-medium">
                    {data.estimate.roofArea.surfaceArea.toFixed(0)} sq ft
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pitch:</span>
                  <span className="ml-2 font-medium">
                    {data.estimate.roofArea.pitch}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Squares:</span>
                  <span className="ml-2 font-medium">
                    {data.estimate.roofArea.squares.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Edges */}
            {data.estimate.edges.length > 0 && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Edges</h4>
                  <div className="space-y-1 text-sm">
                    {data.estimate.edges.map((edge, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{edge.type}:</span>
                        <span className="font-medium">{edge.linearFeet.toFixed(1)} ft</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Features */}
            {data.estimate.features.length > 0 && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Roof Features</h4>
                  <div className="space-y-1 text-sm">
                    {data.estimate.features.map((feature, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">
                          {feature.type} ({feature.count}x):
                        </span>
                        <span className="font-medium">
                          ${feature.totalCost.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Pricing Breakdown */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Cost Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roofing Material:</span>
                  <span className="font-medium">
                    ${data.estimate.pricing.roofingMaterial.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labor:</span>
                  <span className="font-medium">
                    ${data.estimate.pricing.labor.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edge Materials:</span>
                  <span className="font-medium">
                    ${data.estimate.pricing.edgeMaterials.toLocaleString()}
                  </span>
                </div>
                {data.estimate.pricing.features > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Features:</span>
                    <span className="font-medium">
                      ${data.estimate.pricing.features.toLocaleString()}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    ${data.estimate.pricing.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contingency (10%):</span>
                  <span className="font-medium">
                    ${data.estimate.pricing.contingency.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Estimate:</span>
                  <span className="text-primary">
                    ${data.estimate.pricing.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
