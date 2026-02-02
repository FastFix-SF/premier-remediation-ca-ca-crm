import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText } from "lucide-react";

interface BulkTrainingImporterProps {
  quoteId?: string;
}

export function BulkTrainingImporter({ quoteId }: BulkTrainingImporterProps) {
  const [jsonData, setJsonData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast.error("Please paste training data");
      return;
    }

    setIsImporting(true);
    try {
      const data = JSON.parse(jsonData);
      const trainingRecords = Array.isArray(data) ? data : [data];

      // Transform and insert training data
      const records = trainingRecords.map((record: any) => ({
        quote_id: quoteId || record.quote_id,
        edge_type: record.edgeType || record.edge_type || 'EAVE',
        start_lat: record.start?.[1] || record.start_lat,
        start_lon: record.start?.[0] || record.start_lon,
        end_lat: record.end?.[1] || record.end_lat,
        end_lon: record.end?.[0] || record.end_lon,
        length_ft: record.length || record.length_ft,
        angle_degrees: record.angle || record.angle_degrees || 0,
        line_geometry: {
          type: 'LineString',
          coordinates: [
            [record.start?.[0] || record.start_lon, record.start?.[1] || record.start_lat],
            [record.end?.[0] || record.end_lon, record.end?.[1] || record.end_lat]
          ]
        },
        notes: record.notes || `Bulk imported from RoofSnap`,
      }));

      const { error } = await supabase
        .from('edge_training_data')
        .insert(records);

      if (error) throw error;

      toast.success(`✅ Imported ${records.length} training examples`);
      setJsonData("");
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Training Data Import
        </CardTitle>
        <CardDescription>
          Import training data from RoofSnap or other sources. Paste JSON array of roof lines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">JSON Format Example:</label>
          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`[
  {
    "start": [-122.123, 37.456],
    "end": [-122.124, 37.456],
    "edgeType": "EAVE",
    "length": 45.2,
    "angle": 0
  }
]`}
          </pre>
        </div>

        <Textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Paste training data JSON here..."
          className="font-mono text-xs min-h-[200px]"
        />

        <Button
          onClick={handleImport}
          disabled={isImporting || !jsonData.trim()}
          className="w-full"
        >
          <FileText className="mr-2 h-4 w-4" />
          {isImporting ? "Importing..." : "Import Training Data"}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Each record needs: start [lon, lat], end [lon, lat], edgeType, length</p>
          <p>• edgeType: EAVE, RAKE, RIDGE, VALLEY, HIP</p>
          <p>• More training data = better AI predictions</p>
        </div>
      </CardContent>
    </Card>
  );
}
