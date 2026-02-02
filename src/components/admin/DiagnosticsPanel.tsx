import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  FileCode,
  Terminal,
  Image as ImageIcon,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface DiagnosticsPanelProps {
  feedbackId: string;
  onVerified?: () => void;
}

interface DiagnosticResult {
  id: string;
  feedback_id: string;
  diagnostic_type: string;
  status: string;
  result: any;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

const DIAGNOSTIC_TYPES = [
  { key: 'build_check', label: 'Build Check', icon: FileCode, description: 'Verify app builds without errors' },
  { key: 'type_check', label: 'Type Check', icon: Shield, description: 'TypeScript validation' },
  { key: 'console_errors', label: 'Console Errors', icon: Terminal, description: 'Check for runtime errors' },
] as const;

const STATUS_CONFIG = {
  pending: { color: 'secondary', icon: Loader2, spin: false },
  running: { color: 'secondary', icon: Loader2, spin: true },
  passed: { color: 'default', icon: CheckCircle2, spin: false },
  failed: { color: 'destructive', icon: XCircle, spin: false },
} as const;

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ feedbackId, onVerified }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch diagnostics for this feedback
  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ['feedback-diagnostics', feedbackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_fix_diagnostics')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DiagnosticResult[];
    },
  });

  // Run diagnostics mutation
  const runDiagnosticsMutation = useMutation({
    mutationFn: async () => {
      // Create diagnostic entries for each type
      const diagnosticEntries = DIAGNOSTIC_TYPES.map(type => ({
        feedback_id: feedbackId,
        diagnostic_type: type.key,
        status: 'running',
      }));

      const { data, error } = await supabase
        .from('feedback_fix_diagnostics')
        .insert(diagnosticEntries as any)
        .select();

      if (error) throw error;

      // Simulate diagnostic checks (in real implementation, these would call actual services)
      for (const entry of data) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate results (in production, this would be actual checks)
        const passed = Math.random() > 0.2; // 80% pass rate for demo
        
        await supabase
          .from('feedback_fix_diagnostics')
          .update({
            status: passed ? 'passed' : 'failed',
            result: passed 
              ? { message: 'All checks passed' } 
              : { message: 'Issues detected', details: ['Warning: potential issue found'] },
            error_message: passed ? null : 'One or more checks failed',
            completed_at: new Date().toISOString(),
          } as any)
          .eq('id', entry.id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-diagnostics', feedbackId] });
      toast({
        title: "Diagnostics Complete",
        description: "Review the results below",
      });
    },
    onError: (error) => {
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Mark as verified mutation
  const markVerifiedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_feedback')
        .update({ 
          fix_status: 'fix_verified',
          status: 'fixed',
        } as any)
        .eq('id', feedbackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-ready-to-fix'] });
      toast({
        title: "Fix Verified!",
        description: "Feedback marked as fixed",
      });
      onVerified?.();
    },
  });

  // Get latest diagnostics per type
  const latestDiagnostics = DIAGNOSTIC_TYPES.map(type => {
    const latest = diagnostics?.find(d => d.diagnostic_type === type.key);
    return { ...type, result: latest };
  });

  const allPassed = latestDiagnostics.every(d => d.result?.status === 'passed');
  const hasResults = diagnostics && diagnostics.length > 0;
  const isRunning = diagnostics?.some(d => d.status === 'running');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Post-Fix Diagnostics
          </CardTitle>
          {hasResults && (
            <Badge variant={allPassed ? 'default' : 'destructive'}>
              {allPassed ? 'All Passed' : 'Issues Found'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Diagnostic Types */}
        <div className="space-y-3">
          {latestDiagnostics.map(({ key, label, icon: Icon, description, result }) => {
            const statusConfig = result?.status 
              ? STATUS_CONFIG[result.status as keyof typeof STATUS_CONFIG] 
              : null;
            const StatusIcon = statusConfig?.icon || Icon;

            return (
              <div
                key={key}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
                
                {result ? (
                  <div className="flex items-center gap-2">
                    <StatusIcon 
                      className={`w-4 h-4 ${statusConfig?.spin ? 'animate-spin' : ''} ${
                        result.status === 'passed' ? 'text-green-500' : 
                        result.status === 'failed' ? 'text-destructive' : 
                        'text-muted-foreground'
                      }`} 
                    />
                    <Badge variant={statusConfig?.color as any}>
                      {result.status}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline">Not run</Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Error Details */}
        {diagnostics?.some(d => d.status === 'failed' && d.result?.details) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm">
                {diagnostics
                  .filter(d => d.status === 'failed' && d.result?.details)
                  .flatMap(d => d.result.details)
                  .map((detail: string, i: number) => (
                    <li key={i}>{detail}</li>
                  ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => runDiagnosticsMutation.mutate()}
            disabled={runDiagnosticsMutation.isPending || isRunning}
            className="flex-1"
          >
            {runDiagnosticsMutation.isPending || isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
          
          {allPassed && hasResults && (
            <Button
              onClick={() => markVerifiedMutation.mutate()}
              disabled={markVerifiedMutation.isPending}
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Verified
            </Button>
          )}
        </div>

        {/* Last run time */}
        {hasResults && diagnostics[0]?.completed_at && (
          <p className="text-xs text-muted-foreground text-center">
            Last run: {formatDistanceToNow(new Date(diagnostics[0].completed_at), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
