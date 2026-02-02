import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadPanel } from '../components/UploadPanel';
import { useVisualizerProject } from '../hooks/useVisualizerProject';
// Fixed import issues - using default exports
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Palette, Wand2, Download, Share2 } from 'lucide-react';

export const VisualizerLanding = () => {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const navigate = useNavigate();
  const { createProject, uploadImage } = useVisualizerProject();

  const handleImageUpload = async (file: File) => {
    try {
      setIsCreatingProject(true);
      
      // Create project
      const projectId = await createProject('Untitled Roof Project');
      
      // Upload image
      await uploadImage(projectId, file);
      
      // Navigate to editor
      navigate(`/visualizer/editor/${projectId}`);
    } catch (error) {
      console.error('Error creating project:', error);
      // Don't rethrow here to prevent unhandled promise rejection
    } finally {
      setIsCreatingProject(false);
    }
  };

  const features = [
    {
      icon: Wand2,
      title: 'Smart Detection',
      description: 'AI-powered roof detection with manual refinement tools'
    },
    {
      icon: Palette,
      title: 'McElroy Colors',
      description: '30+ authentic metal roofing colors with realistic rendering'
    },
    {
      icon: Download,
      title: 'High-Quality Export',
      description: 'Download professional-grade images for presentations'
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Share visualizations with clients via shareable links'
    }
  ];

  return (
    <>
      <SEOHead 
        title="Roof Color Visualizer - See Your Home with Different Metal Roof Colors"
        description="Upload a photo of your home and instantly preview it with 30+ McElroy metal roof colors. Free roof color visualization tool."
        keywords="roof color visualizer, metal roof colors, roof visualization, McElroy colors, home improvement"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Roof Color Visualizer
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Upload a photo of your home and instantly preview it with authentic McElroy metal roof colors. 
              See how different colors will look before you buy.
            </p>
            
            {/* Quick Demo Stats */}
            <div className="flex justify-center gap-8 mb-12 text-sm text-muted-foreground">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">30+</div>
                <div>Metal Colors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">&lt;2min</div>
                <div>Setup Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">100%</div>
                <div>Free to Use</div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <UploadPanel 
              onImageUpload={handleImageUpload}
              loading={isCreatingProject}
            />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How It Works */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">How It Works</CardTitle>
              <p className="text-muted-foreground">Get started in three simple steps</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Upload Your Photo</h3>
                  <p className="text-sm text-muted-foreground">
                    Take a clear photo of your home and upload it to our visualizer
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Outline Your Roof</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI detects your roof automatically, then refine the outline as needed
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Try Colors</h3>
                  <p className="text-sm text-muted-foreground">
                    Click any color to instantly see how it looks on your home
                  </p>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button 
                  size="lg" 
                  onClick={() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    input?.click();
                  }}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  Get Started Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};