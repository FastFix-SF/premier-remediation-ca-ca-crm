import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
interface AssignmentConfirmationDialogProps {
  assignment: {
    id: string;
    title: string;
    location: string;
    date: string;
    startTime: string;
    type: 'job' | 'task';
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}
export function AssignmentConfirmationDialog({
  assignment,
  open,
  onOpenChange,
  onConfirm
}: AssignmentConfirmationDialogProps) {
  const {
    t
  } = useLanguage();
  const { user } = useAuth();
  if (!assignment) return null;
  const handleConfirm = async () => {
    try {
      if (assignment.type === 'job') {
        // Get current shift data
        const { data: shiftData, error: fetchError } = await supabase
          .from('job_schedules')
          .select('assigned_users')
          .eq('id', assignment.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // Update the specific user's status within assigned_users array
        const assignedUsers = Array.isArray(shiftData.assigned_users) ? shiftData.assigned_users : [];
        const updatedUsers = assignedUsers.map((u: any) => {
          // Handle simple string array format
          if (typeof u === 'string' && u === user?.id) {
            return { 
              id: user.id, 
              user_id: user.id,
              assignment_status: 'confirmed', 
              responded_at: new Date().toISOString() 
            };
          }
          // Handle object format
          if (typeof u === 'object' && u !== null && (u.user_id === user?.id || u.id === user?.id)) {
            return { ...u, assignment_status: 'confirmed', responded_at: new Date().toISOString() };
          }
          return u;
        });

        const { error } = await supabase
          .from('job_schedules')
          .update({
            assigned_users: updatedUsers
          })
          .eq('id', assignment.id);

        if (error) throw error;
      } else {
        // Handle project assignment
        const { error } = await supabase
          .from('project_team_assignments')
          .update({
            assignment_status: 'confirmed',
            responded_at: new Date().toISOString()
          })
          .eq('id', assignment.id);

        if (error) throw error;
      }

      toast({
        title: t('assignment.confirmed'),
        description: t('assignment.youHaveConfirmed')
      });
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error confirming assignment:', error);
      toast({
        title: t('common.error'),
        description: t('assignment.failedToConfirm'),
        variant: "destructive"
      });
    }
  };
  const handleReject = async () => {
    try {
      if (assignment.type === 'job') {
        // Get current shift data
        const { data: shiftData, error: fetchError } = await supabase
          .from('job_schedules')
          .select('assigned_users')
          .eq('id', assignment.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // Update the specific user's status within assigned_users array
        const assignedUsers = Array.isArray(shiftData.assigned_users) ? shiftData.assigned_users : [];
        const updatedUsers = assignedUsers.map((u: any) => {
          // Handle simple string array format
          if (typeof u === 'string' && u === user?.id) {
            return { 
              id: user.id, 
              user_id: user.id,
              assignment_status: 'rejected', 
              responded_at: new Date().toISOString() 
            };
          }
          // Handle object format
          if (typeof u === 'object' && u !== null && (u.user_id === user?.id || u.id === user?.id)) {
            return { ...u, assignment_status: 'rejected', responded_at: new Date().toISOString() };
          }
          return u;
        });

        const { error } = await supabase
          .from('job_schedules')
          .update({
            assigned_users: updatedUsers
          })
          .eq('id', assignment.id);

        if (error) throw error;
      } else {
        // Handle project assignment
        const { error } = await supabase
          .from('project_team_assignments')
          .update({
            assignment_status: 'rejected',
            responded_at: new Date().toISOString()
          })
          .eq('id', assignment.id);

        if (error) throw error;
      }

      toast({
        title: t('assignment.rejected'),
        description: t('assignment.youHaveRejected')
      });
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rejecting assignment:', error);
      toast({
        title: t('common.error'),
        description: t('assignment.failedToReject'),
        variant: "destructive"
      });
    }
  };
  return <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            {t('assignment.newAssignment')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left space-y-4 pt-2">
            <p className="text-base text-foreground font-medium">
              {assignment.type === 'job' ? t('assignment.youHaveBeenAssignedToJob') : t('assignment.youHaveBeenAssignedToTask')}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('assignment.location')}</p>
                  <p className="text-base text-foreground font-medium">{assignment.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('assignment.date')}</p>
                  <p className="text-base text-foreground font-medium">
                    {format(new Date(assignment.date), 'PPP')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('assignment.time')}</p>
                  <p className="text-base text-foreground font-medium">{assignment.startTime}</p>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleConfirm} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {t('assignment.confirm')}
          </Button>
          <Button onClick={handleReject} variant="outline" className="w-full text-destructive">
            {t('assignment.reject')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>;
}