// Shared types for consistent data models across web admin and mobile app

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  stopped_date?: string;
  end_date?: string;
  address?: string;
  project_type?: string;
  is_public?: boolean;
  customer_email?: string;
  invitation_sent_at?: string;
  customer_access_granted?: boolean;
  customer_rating?: number;
  rating_submitted_at?: string;
  project_category?: string;
  roof_type?: string;
  is_featured?: boolean;
  external_ref?: string;
  cf_project_id?: string;
  budget_labor?: number;
  budget_materials?: number;
  target_gp_percentage?: number;
  connectteam_job_code_raw?: string;
  connectteam_job_code_norm?: string;
  connectteam_job_id?: string;
  connecteam_job_name?: string;
  connecteam_last_labor_sync_at?: string;
  // Contractor/Management Company fields
  is_contractor_managed?: boolean;
  contractor_company_name?: string;
  contractor_contact_person?: string;
  contractor_phone?: string;
  contractor_email?: string;
  contractor_address?: string;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  photo_url: string;
  caption?: string;
  recommendation?: string;
  is_visible_to_customer: boolean;
  uploaded_by: string;
  uploaded_at: string;
  display_order?: number;
  photo_tag?: string;
  is_highlighted_before?: boolean;
  is_highlighted_after?: boolean;
  file_size?: number;
}

export interface ProjectTeamAssignment {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  assigned_by: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  customer_email: string;
  customer_id?: string;
  assigned_at: string;
  assigned_by: string;
}

// Mobile-specific interfaces
export interface MobileProject {
  id: string;
  name: string;
  address?: string;
  status: string;
  created_at: string;
  updated_at: string;
  project_type?: string;
  customer_email?: string;
  client_name?: string;
  client_phone?: string;
  additional_contact?: string;
  is_featured?: boolean;
  labels?: string[];
  start_date?: string;
  stopped_date?: string;
  end_date?: string;
  // Computed fields for mobile display
  code?: string;
  lastActivity?: string;
  teamSize?: number;
  bestPhotoUrl?: string;
}

export interface MobileProjectPhoto {
  id: string;
  project_id: string;
  photo_url: string;
  caption?: string;
  recommendation?: string;
  uploaded_by: string;
  uploaded_at: string;
  file_size?: number;
  uploader_initials?: string;
  uploader_name?: string;
}