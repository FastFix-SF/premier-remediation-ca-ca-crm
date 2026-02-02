import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, TrendingUp, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ModelTrainingDashboard() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  // Get training statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['training-stats'],
    queryFn: async () => {
      const response = await supabase.functions.invoke('export-training-data', {
        body: { format: 'stats' }
      });

      if (response.error) throw response.error;
      return response.data;
    }
  });

  const handleExport = async (format: 'coco' | 'simple') => {
    setExporting(true);
    try {
      const response = await supabase.functions.invoke('export-training-data', {
        body: { format }
      });

      if (response.error) throw response.error;

      // Create download
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roof_training_${format}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Training data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export training data');
    } finally {
      setExporting(false);
    }
  };

  const isReadyForTraining = stats?.total_roof_images >= 50 && 
                            stats?.total_edge_annotations >= 200;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">🧠 AI Model Training</h1>
            <p className="text-muted-foreground">
              Prepare your roof drawing data for computer vision model training
            </p>
          </div>
        </div>
      </div>

      {/* Training Readiness Status */}
      <Card className={isReadyForTraining ? 'border-green-500' : 'border-yellow-500'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isReadyForTraining ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Ready for Model Training
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Collecting Training Data
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isReadyForTraining 
                  ? 'You have enough data to train a pilot model!'
                  : 'Keep drawing roofs to reach minimum training requirements'}
              </CardDescription>
            </div>
            <Badge variant={isReadyForTraining ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {isReadyForTraining ? 'READY' : 'IN PROGRESS'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">Minimum Roofs for Pilot:</span>
              <span className="text-2xl font-bold">
                {stats?.total_roof_images || 0} / 50
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">Minimum Edge Annotations:</span>
              <span className="text-2xl font-bold">
                {stats?.total_edge_annotations || 0} / 200
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Roof Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              <span className="text-3xl font-bold">{stats?.total_roof_images || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Aerial images with drawings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Edge Drawings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">{stats?.total_edge_annotations || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Manual edge annotations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Edges Per Roof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-purple-500" />
              <span className="text-3xl font-bold">{stats?.average_edges_per_roof || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Drawing complexity</p>
          </CardContent>
        </Card>
      </div>

      {/* Edge Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Edge Types Distribution</CardTitle>
          <CardDescription>
            Different types of roof edges you've labeled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.edges_by_type && Object.entries(stats.edges_by_type).map(([type, count]: [string, any]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {((count / stats.total_edge_annotations) * 100).toFixed(1)}% of dataset
                  </span>
                </div>
                <span className="font-bold">{count} edges</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Training Data</CardTitle>
          <CardDescription>
            Download your training data for model training or review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => handleExport('coco')}
              disabled={exporting || !stats?.total_roof_images}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export COCO Format
              <Badge variant="secondary" className="ml-2">For ML Engineers</Badge>
            </Button>
            <Button
              onClick={() => handleExport('simple')}
              disabled={exporting || !stats?.total_roof_images}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Simple JSON
              <Badge variant="secondary" className="ml-2">For Review</Badge>
            </Button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-2">📦 COCO Format Details:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Standard format for computer vision training</li>
              <li>• Compatible with YOLOv8, Detectron2, MMDetection</li>
              <li>• Includes image URLs, annotations, and metadata</li>
              <li>• Ready to upload to training platforms</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Sample Preview */}
      {stats?.samples && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Training Images</CardTitle>
            <CardDescription>
              Preview of your labeled roof images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.samples.slice(0, 6).map((sample: any) => (
                <div key={sample.roof_id} className="space-y-2">
                  <img 
                    src={sample.image_url} 
                    alt={`Roof ${sample.roof_id}`}
                    className="w-full aspect-square object-cover rounded-lg border-2"
                  />
                  <div className="text-xs text-center">
                    <Badge variant="secondary">{sample.edge_count} edges</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle>🚀 Next Steps for Model Training</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="text-2xl">1️⃣</div>
              <div>
                <p className="font-semibold">Export COCO Format Data</p>
                <p className="text-muted-foreground">Download your training dataset above</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">2️⃣</div>
              <div>
                <p className="font-semibold">Choose Training Platform</p>
                <p className="text-muted-foreground">Options: Roboflow, Ultralytics HUB, or custom training</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">3️⃣</div>
              <div>
                <p className="font-semibold">Train Pilot Model</p>
                <p className="text-muted-foreground">YOLOv8 or Segment Anything for edge detection (~$500-2000)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">4️⃣</div>
              <div>
                <p className="font-semibold">Test & Iterate</p>
                <p className="text-muted-foreground">Test on new roofs, collect more data if needed, retrain</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
