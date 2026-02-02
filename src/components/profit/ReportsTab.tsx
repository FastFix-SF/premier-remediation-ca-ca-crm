import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReportsTabProps {
  projectId: string;
  dateRange: { from: Date; to: Date };
  laborData: any;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  projectId,
  dateRange,
  laborData
}) => {
  const [photoNotes, setPhotoNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotoNotes();
  }, [projectId]);

  const fetchPhotoNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('project_photos')
        .select('id, photo_url, caption, photo_tag, uploaded_at, uploaded_by')
        .eq('project_id', projectId)
        .not('caption', 'is', null)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotoNotes(data || []);
    } catch (error) {
      console.error('Error fetching photo notes:', error);
      toast({
        title: "Error",
        description: "Failed to load photo notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupNotesByTag = () => {
    const grouped: Record<string, any[]> = {};
    
    photoNotes.forEach(note => {
      const tag = note.photo_tag || 'General';
      if (!grouped[tag]) {
        grouped[tag] = [];
      }
      grouped[tag].push(note);
    });
    
    return grouped;
  };

  const generateReport = () => {
    const groupedNotes = groupNotesByTag();
    let report = `# Project Progress Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleDateString()}\n\n`;
    report += `**Total Photos with Notes:** ${photoNotes.length}\n\n`;
    
    Object.entries(groupedNotes).forEach(([tag, notes]) => {
      report += `## ${tag.charAt(0).toUpperCase() + tag.slice(1)}\n\n`;
      notes.forEach((note, idx) => {
        report += `${idx + 1}. ${note.caption} _(${new Date(note.uploaded_at).toLocaleDateString()})_\n`;
      });
      report += `\n`;
    });
    
    return report;
  };

  const exportReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Report downloaded as markdown file",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading photo notes...</p>
        </div>
      </div>
    );
  }

  const groupedNotes = groupNotesByTag();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{photoNotes.length}</div>
              <p className="text-sm text-muted-foreground">Total Photo Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{Object.keys(groupedNotes).length}</div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {photoNotes.length > 0 
                  ? Math.ceil((Date.now() - new Date(photoNotes[photoNotes.length - 1].uploaded_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </div>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Photo Progress Report</h2>
        <Button onClick={exportReport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Progress from Photo Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {photoNotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Photo Notes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add notes to photos in the mobile app to generate progress reports
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedNotes).map(([tag, notes]) => (
                <div key={tag} className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {notes.length} {notes.length === 1 ? 'note' : 'notes'}
                    </span>
                  </div>
                  <div className="space-y-3 pl-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-muted">
                          <img 
                            src={note.photo_url} 
                            alt="Project photo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm leading-relaxed">{note.caption}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.uploaded_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};