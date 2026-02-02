import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Loader2, CheckCircle, Shield, AlertTriangle, Lightbulb, Scale } from 'lucide-react';
import { downloadPatent, downloadPatentWithFeatures } from '@/lib/patentGenerator';
import { patentableFeatures, patentSummary, filingStrategy, type PatentableFeature } from '@/data/patentableFeatures';
import { toast } from 'sonner';

const tierLabels: Record<number, { label: string; color: string }> = {
  1: { label: 'Highly Patentable', color: 'bg-green-500' },
  2: { label: 'Strong', color: 'bg-blue-500' },
  3: { label: 'Good', color: 'bg-yellow-500' },
  4: { label: 'Moderate', color: 'bg-orange-500' }
};

const categoryLabels: Record<string, string> = {
  'voice-ai': 'Voice AI',
  'computer-vision': 'Computer Vision',
  'workflow': 'Workflow',
  'mobile': 'Mobile',
  'learning': 'Machine Learning',
  'integration': 'Integration'
};

function FeatureCard({ feature }: { feature: PatentableFeature }) {
  const [expanded, setExpanded] = useState(false);
  const tier = tierLabels[feature.tier];
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">#{feature.id}</span>
              {feature.name}
            </CardTitle>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge className={tier.color}>{tier.label}</Badge>
              <Badge variant="outline">{categoryLabels[feature.category]}</Badge>
              <Badge variant="secondary">Score: {feature.patentabilityScore}/10</Badge>
              <Badge variant={feature.riskAssessment.level === 'low' ? 'default' : feature.riskAssessment.level === 'medium' ? 'secondary' : 'destructive'}>
                {feature.riskAssessment.level} risk
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{feature.noveltyAnalysis}</p>
        
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show Less' : 'Show Details'}
        </Button>
        
        {expanded && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Lightbulb className="h-4 w-4" /> Technical Differentiators
              </h4>
              <ul className="text-sm space-y-1">
                {feature.technicalDifferentiators.map((diff, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    {diff}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                <Scale className="h-4 w-4" /> Prior Art Analysis
              </h4>
              <div className="space-y-2">
                {feature.priorArt.map((art, i) => (
                  <div key={i} className="text-sm bg-muted p-2 rounded">
                    <span className="font-medium">{art.title}:</span>{' '}
                    <span className="text-muted-foreground">{art.limitation}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Patentability Factors</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Novelty: <span className="font-medium">{feature.patentabilityFactors.novelty}/10</span></div>
                <div>Non-Obviousness: <span className="font-medium">{feature.patentabilityFactors.nonObviousness}/10</span></div>
                <div>Utility: <span className="font-medium">{feature.patentabilityFactors.utility}/10</span></div>
                <div>Enablement: <span className="font-medium">{feature.patentabilityFactors.enablement}/10</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">USPTO Classifications (CPC)</h4>
              <div className="flex gap-1 flex-wrap">
                {feature.usptoCpc.map(code => (
                  <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                ))}
              </div>
            </div>
            
            {feature.riskAssessment.concerns.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" /> Risk Concerns
                </h4>
                <ul className="text-sm text-muted-foreground">
                  {feature.riskAssessment.concerns.map((concern, i) => (
                    <li key={i}>• {concern}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Draft Independent Claim</h4>
              <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap font-mono">
                {feature.independentClaim}
              </pre>
            </div>
            
            {feature.dependentClaims.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Dependent Claims ({feature.dependentClaims.length})</h4>
                <div className="space-y-2">
                  {feature.dependentClaims.map((claim, i) => (
                    <pre key={i} className="text-xs bg-muted p-2 rounded whitespace-pre-wrap font-mono">
                      {claim}
                    </pre>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PatentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<number[]>([1, 2, 3]); // Default: Tier 1
  const [includeAnalysis, setIncludeAnalysis] = useState(true);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (includeAnalysis) {
        downloadPatentWithFeatures(selectedFeatures);
      } else {
        downloadPatent();
      }
      setGenerated(true);
      toast.success('Patent PDF generated and downloaded!');
    } catch (error) {
      console.error('Error generating patent:', error);
      toast.error('Failed to generate patent PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFeature = (id: number) => {
    setSelectedFeatures(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const selectTier = (tier: number) => {
    const tierFeatures = patentableFeatures.filter(f => f.tier === tier).map(f => f.id);
    const allSelected = tierFeatures.every(id => selectedFeatures.includes(id));
    if (allSelected) {
      setSelectedFeatures(prev => prev.filter(id => !tierFeatures.includes(id)));
    } else {
      setSelectedFeatures(prev => [...new Set([...prev, ...tierFeatures])]);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Tabs defaultValue="analysis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Patentability Analysis</TabsTrigger>
          <TabsTrigger value="features">Feature Details</TabsTrigger>
          <TabsTrigger value="generate">Generate PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Patent Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-3xl font-bold">{patentSummary.totalFeatures}</div>
                    <div className="text-sm text-muted-foreground">Total Features</div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <div className="text-3xl font-bold">{patentSummary.averageScore.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Avg Score</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">By Tier</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500" />
                        Tier 1: Highly Patentable
                      </span>
                      <Badge>{patentSummary.byTier.tier1}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        Tier 2: Strong
                      </span>
                      <Badge>{patentSummary.byTier.tier2}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-yellow-500" />
                        Tier 3: Good
                      </span>
                      <Badge>{patentSummary.byTier.tier3}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        Tier 4: Moderate
                      </span>
                      <Badge>{patentSummary.byTier.tier4}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filing Strategy Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h4 className="font-semibold text-sm">{filingStrategy.priority1.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{filingStrategy.priority1.rationale}</p>
                  <p className="text-xs mt-1">Est. Cost: {filingStrategy.priority1.estimatedCost}</p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-semibold text-sm">{filingStrategy.priority2.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{filingStrategy.priority2.rationale}</p>
                  <p className="text-xs mt-1">Est. Cost: {filingStrategy.priority2.estimatedCost}</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <h4 className="font-semibold text-sm">{filingStrategy.priority3.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{filingStrategy.priority3.rationale}</p>
                  <p className="text-xs mt-1">Est. Cost: {filingStrategy.priority3.estimatedCost}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Key Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {patentSummary.topRecommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features">
          <ScrollArea className="h-[600px] pr-4">
            {patentableFeatures.map(feature => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                FASTO Patent Generator
              </CardTitle>
              <CardDescription>
                Generate a complete US Provisional Patent Application with patentability analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="include-analysis" 
                  checked={includeAnalysis}
                  onCheckedChange={(checked) => setIncludeAnalysis(checked === true)}
                />
                <label htmlFor="include-analysis" className="text-sm">
                  Include Patentability Analysis Section
                </label>
              </div>

              {includeAnalysis && (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h3 className="font-semibold">Select Features to Include:</h3>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <Button variant="outline" size="sm" onClick={() => selectTier(1)}>
                      Toggle Tier 1
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectTier(2)}>
                      Toggle Tier 2
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectTier(3)}>
                      Toggle Tier 3
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => selectTier(4)}>
                      Toggle Tier 4
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {patentableFeatures.map(feature => (
                      <div key={feature.id} className="flex items-center gap-2">
                        <Checkbox 
                          id={`feature-${feature.id}`}
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <label htmlFor={`feature-${feature.id}`} className="text-sm flex-1">
                          <span className="font-medium">#{feature.id}</span> {feature.name}
                          <Badge className={`ml-2 ${tierLabels[feature.tier].color} text-xs`}>
                            T{feature.tier}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedFeatures.length} features
                  </p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Document Contents:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Cover Page with Title and Abstract
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    6 USPTO-Compliant Patent Figures (FIG. 1-6)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Complete Specification (Field, Background, Summary, Detailed Description)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    20 Claims (Method, System, Computer-Readable Medium)
                  </li>
                  {includeAnalysis && (
                    <>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Patentable Features Inventory
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Prior Art Analysis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Enhanced Claims for Selected Features
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                size="lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Patent PDF...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Generate & Download Patent PDF
                  </>
                )}
              </Button>

              {generated && (
                <p className="text-sm text-center text-muted-foreground">
                  ✓ Patent PDF has been downloaded to your device
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
