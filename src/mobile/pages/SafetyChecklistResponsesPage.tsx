import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const SafetyChecklistResponsesPage: React.FC = () => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('safety_checklist_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading safety checklist responses:', error);
        toast({
          title: "Error",
          description: "Failed to load safety checklist responses",
          variant: "destructive",
        });
        setResponses([]);
        return;
      }

      // Fetch user names for each response
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r: any) => r.user_id))];
        const { data: teamData } = await supabase
          .from('team_directory')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const userMap = new Map(teamData?.map((u: any) => [u.user_id, u.full_name]) || []);

        const responsesWithNames = data.map((response: any) => ({
          ...response,
          employee_name: userMap.get(response.user_id) || 'Unknown Employee'
        }));

        setResponses(responsesWithNames);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setResponses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Button 
          variant="ghost" 
          size="sm"
          className="p-2 h-8 w-8 text-white hover:bg-white/20"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center">Safety Checklist Responses</h1>
        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : responses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
            <p className="text-sm text-muted-foreground">
              Safety checklist responses will appear here once employees complete their checklists.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => {
              const isExpanded = expandedId === response.id;
              const allChecksPassed = response.hard_hat && response.steel_cap_boots && 
                                      response.safety_vest && response.protective_glasses;
              return (
                <div 
                  key={response.id} 
                  className="bg-card border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div 
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:bg-accent"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          allChecksPassed ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {allChecksPassed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">
                            {response.employee_name || 'Unknown Employee'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(response.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })} at {new Date(response.created_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-3">
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className={response.hard_hat ? 'text-green-600' : 'text-red-600'}>
                            {response.hard_hat ? '✓' : '✗'}
                          </span>
                          <span>Hard Hat</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={response.steel_cap_boots ? 'text-green-600' : 'text-red-600'}>
                            {response.steel_cap_boots ? '✓' : '✗'}
                          </span>
                          <span>Steel Cap Boots</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={response.safety_vest ? 'text-green-600' : 'text-red-600'}>
                            {response.safety_vest ? '✓' : '✗'}
                          </span>
                          <span>Safety Vest</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={response.protective_glasses ? 'text-green-600' : 'text-red-600'}>
                            {response.protective_glasses ? '✓' : '✗'}
                          </span>
                          <span>Protective Glasses</span>
                        </div>
                      </div>

                      {response.additional_items && (
                        <div className="text-sm mb-3">
                          <p className="font-medium text-muted-foreground">Additional Items:</p>
                          <p className="mt-1">{response.additional_items}</p>
                        </div>
                      )}

                      {response.selfie_url && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Safety Gear Photo:</p>
                          <img 
                            src={response.selfie_url} 
                            alt="Safety gear selfie" 
                            className="w-full max-w-xs rounded-lg"
                          />
                        </div>
                      )}

                      {response.signature_data && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Signature:</p>
                          <img 
                            src={response.signature_data} 
                            alt="Signature" 
                            className="w-full max-w-xs h-24 bg-muted rounded border"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
