import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectUpdate {
  id: string;
  type: 'invoice_paid' | 'invoice_created' | 'photo_uploaded' | 'job_scheduled' | 'project_created' | 'proposal_sent' | 'proposal_accepted';
  projectName: string;
  projectId?: string;
  description: string;
  timestamp: string;
  icon: string;
  userName?: string;
}

export const useProjectUpdates = (limit: number = 10, projectId: string | null = null) => {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpdates();
  }, [limit, projectId]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const allUpdates: ProjectUpdate[] = [];

      // Fetch project name if projectId is provided
      let projectName = '';
      if (projectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .maybeSingle();
        projectName = project?.name || 'Project';
      }

      // Fetch recent invoice payments
      let invoiceQuery = supabase
        .from('invoices')
        .select('id, project_name, project_id, status, paid_at, created_at')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        invoiceQuery = invoiceQuery.eq('project_id', projectId);
      } else {
        invoiceQuery = invoiceQuery.limit(5);
      }
      
      const { data: invoices } = await invoiceQuery;

      invoices?.forEach(invoice => {
        if (invoice.status === 'paid' && invoice.paid_at) {
          allUpdates.push({
            id: `invoice-paid-${invoice.id}`,
            type: 'invoice_paid',
            projectName: invoice.project_name,
            projectId: invoice.project_id || undefined,
            description: `Invoice marked as paid`,
            timestamp: invoice.paid_at,
            icon: '💰'
          });
        } else if (invoice.status === 'pending') {
          allUpdates.push({
            id: `invoice-created-${invoice.id}`,
            type: 'invoice_created',
            projectName: invoice.project_name,
            projectId: invoice.project_id || undefined,
            description: `New invoice created`,
            timestamp: invoice.created_at,
            icon: '📄'
          });
        }
      });

      // Fetch recent job schedules with user info
      let jobQuery = supabase
        .from('job_schedules')
        .select('id, job_name, project_id, status, created_at, start_time, end_time, created_by, profiles:created_by(display_name)')
        .order('created_at', { ascending: false });
      
      if (projectId) {
        jobQuery = jobQuery.eq('project_id', projectId);
      } else {
        jobQuery = jobQuery.limit(5);
      }
      
      const { data: jobs } = await jobQuery;

      jobs?.forEach((job: any) => {
        const timelineInfo = job.start_time && job.end_time 
          ? ` (${new Date(job.start_time).toLocaleDateString()} - ${new Date(job.end_time).toLocaleDateString()})`
          : '';
        allUpdates.push({
          id: `job-${job.id}`,
          type: 'job_scheduled',
          projectName: job.job_name,
          projectId: job.project_id || undefined,
          description: `Job ${job.status}${timelineInfo}`,
          timestamp: job.created_at,
          icon: '📅',
          userName: job.profiles?.display_name || undefined
        });
      });

      // Fetch recent project photos with user info
      let photoQuery = supabase
        .from('project_photos')
        .select('id, project_id, caption, uploaded_at, uploaded_by, profiles:uploaded_by(display_name)')
        .order('uploaded_at', { ascending: false });
      
      if (projectId) {
        photoQuery = photoQuery.eq('project_id', projectId);
      } else {
        photoQuery = photoQuery.limit(5);
      }
      
      const { data: photos } = await photoQuery;

      photos?.forEach((photo: any) => {
        allUpdates.push({
          id: `photo-${photo.id}`,
          type: 'photo_uploaded',
          projectName: projectName || 'Project',
          projectId: photo.project_id,
          description: photo.caption || 'New photo uploaded',
          timestamp: photo.uploaded_at,
          icon: '📸',
          userName: photo.profiles?.display_name || undefined
        });
      });

      // Fetch recent proposals - only if not filtering by specific project
      // (proposals don't have project_id, so we can't filter them by project)
      if (!projectId) {
        const { data: proposals } = await supabase
          .from('project_proposals')
          .select('id, property_address, status, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(5);

        proposals?.forEach(proposal => {
          if (proposal.status === 'accepted') {
            allUpdates.push({
              id: `proposal-accepted-${proposal.id}`,
              type: 'proposal_accepted',
              projectName: proposal.property_address,
              description: 'Proposal accepted',
              timestamp: proposal.updated_at,
              icon: '✅'
            });
          } else if (proposal.status === 'sent') {
            allUpdates.push({
              id: `proposal-sent-${proposal.id}`,
              type: 'proposal_sent',
              projectName: proposal.property_address,
              description: 'Proposal sent to client',
              timestamp: proposal.updated_at,
              icon: '📨'
            });
          }
        });
      }

      // Sort all updates by timestamp and limit
      const sortedUpdates = allUpdates
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      setUpdates(sortedUpdates);
    } catch (error) {
      console.error('Error fetching project updates:', error);
    } finally {
      setLoading(false);
    }
  };

  return { updates, loading, refetch: fetchUpdates };
};
