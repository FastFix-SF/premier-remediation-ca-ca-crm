import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Phone, Map, Zap, CheckCircle2, XCircle, AlertCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Integration {
  name: string;
  description: string;
  icon: any;
  status: "active" | "inactive" | "partial";
  apiKey?: string;
  features: string[];
  docsLink?: string;
}

const integrations: Integration[] = [
  {
    name: "Lovable AI",
    description: "Custom AI system powering intelligent features across the platform",
    icon: Bot,
    status: "active",
    apiKey: "LOVABLE_API_KEY",
    features: [
      "AI Materials Expert - Intelligent material recommendations",
      "AI Roof Measurement - Automated roof measurements from imagery", 
      "AI Quote Builder - Intelligent quote generation",
      "AI Roof Analysis - Advanced roof condition analysis",
      "AI Roof Prediction - Predictive maintenance insights",
      "Call Categorization - AI-powered call classification",
      "Project Analysis - Automated project insights"
    ],
    docsLink: "https://docs.lovable.dev/features/ai"
  },
  {
    name: "OpenAI API",
    description: "Advanced AI models for chat, content generation, and analysis",
    icon: Bot,
    status: "active",
    apiKey: "OPENAI_API_KEY",
    features: [
      "AI chat conversations",
      "Content generation",
      "Advanced roof analysis",
      "GPT-4 and GPT-5 model access"
    ],
    docsLink: "https://platform.openai.com/docs"
  },
  {
    name: "Google Maps API",
    description: "Location services, geocoding, and street view imagery",
    icon: Map,
    status: "active",
    apiKey: "GOOGLE_MAPS_API_KEY",
    features: [
      "Address geocoding and validation",
      "Street view imagery",
      "Static satellite maps",
      "Places autocomplete",
      "Location-based services"
    ],
    docsLink: "https://developers.google.com/maps/documentation"
  },
  {
    name: "Google Solar API",
    description: "Automated roof measurement and solar potential analysis from satellite imagery",
    icon: Zap,
    status: "active",
    apiKey: "GOOGLE_MAPS_API_KEY",
    features: [
      "Automated roof segmentation",
      "Precise roof measurements",
      "Edge detection (eaves, rakes, ridges)",
      "Solar potential analysis",
      "3D roof modeling"
    ],
    docsLink: "https://developers.google.com/maps/documentation/solar"
  },
  {
    name: "Bland AI",
    description: "AI-powered phone call management and transcription",
    icon: Phone,
    status: "active",
    apiKey: "BLAND_AI_API_KEY",
    features: [
      "Call recording and storage",
      "AI call transcription",
      "Call categorization (customer/prospect/spam)",
      "Automated call syncing"
    ]
  },
  {
    name: "Stripe",
    description: "Payment processing and invoice management",
    icon: Receipt,
    status: "active",
    apiKey: "STRIPE_SECRET_KEY",
    features: [
      "Secure payment processing",
      "Invoice payments",
      "Credit card transactions",
      "Payment tracking"
    ],
    docsLink: "https://stripe.com/docs"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active": return "bg-green-500";
    case "partial": return "bg-yellow-500";
    case "inactive": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case "partial": return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    case "inactive": return <XCircle className="w-4 h-4 text-red-600" />;
    default: return null;
  }
};

export const IntegrationsDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Manage and monitor all API integrations and AI services
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.name} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 ${getStatusColor(integration.status)} opacity-10 rounded-full -mr-12 -mt-12`} />
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                  </div>
                  {getStatusIcon(integration.status)}
                </div>
                <CardDescription className="mt-2">
                  {integration.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={integration.status === "active" ? "default" : "secondary"}>
                      {integration.status}
                    </Badge>
                  </div>
                  
                  {integration.apiKey && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">API Key</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {integration.apiKey}
                      </code>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Features
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {integration.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {integration.docsLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(integration.docsLink, '_blank')}
                  >
                    View Documentation
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lovable AI Edge Functions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Lovable AI Edge Functions
          </CardTitle>
          <CardDescription>
            Custom AI-powered edge functions deployed for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ai-materials-expert</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Provides intelligent material recommendations based on project requirements
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ai-measure-roof</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Automated roof measurements from aerial imagery
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ai-quote-builder</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Generates intelligent quotes with detailed breakdowns
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ai-roof-analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Advanced roof condition analysis and damage detection
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">ai-roof-prediction</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Predictive maintenance insights and lifespan estimates
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">categorize-call</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                AI-powered call classification (customer/prospect/spam)
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">analyze-project</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Automated project analysis and insights generation
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
