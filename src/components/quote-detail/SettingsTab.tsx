import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SettingsTabProps {
  quoteId: string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ quoteId }) => {
  const navigate = useNavigate();
  const [wastePct, setWastePct] = useState(10);
  const [markupPct, setMarkupPct] = useState(15);
  const [laborRate, setLaborRate] = useState(350);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('quote_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setWastePct(Number(data.default_waste_pct));
        setMarkupPct(Number(data.default_markup_pct));
        setLaborRate(Number(data.labor_rate_per_sq));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      // Get existing settings
      const { data: existing } = await supabase
        .from('quote_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('quote_settings')
          .update({
            default_waste_pct: wastePct,
            default_markup_pct: markupPct,
            labor_rate_per_sq: laborRate,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('quote_settings')
          .insert({
            default_waste_pct: wastePct,
            default_markup_pct: markupPct,
            labor_rate_per_sq: laborRate
          });

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quote? This action cannot be undone and all associated data will be permanently deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('quote_requests')
        .delete()
        .eq('id', quoteId);

      if (error) throw error;

      toast.success('Quote deleted successfully');
      navigate('/admin?tab=quotes');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Default Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Waste Percentage (%)</label>
            <Input
              type="number"
              value={wastePct}
              onChange={(e) => setWastePct(Number(e.target.value))}
              min="0"
              max="50"
            />
            <p className="text-xs text-muted-foreground">
              Applied to area-based materials (shingles, underlayment, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Default Markup Percentage (%)</label>
            <Input
              type="number"
              value={markupPct}
              onChange={(e) => setMarkupPct(Number(e.target.value))}
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground">
              Applied to all materials by default
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Labor Rate (per square)</label>
            <div className="flex items-center gap-2">
              <span className="text-lg">$</span>
              <Input
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(Number(e.target.value))}
                min="0"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Default labor rate per roofing square (100 sq ft)
            </p>
          </div>

          <Button onClick={saveSettings} className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete this quote, there is no going back. This will permanently delete the quote and all associated data including measurements, drawings, and estimates.
            </p>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Quote Permanently
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
