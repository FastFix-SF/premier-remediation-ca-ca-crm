import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { User, Mail, Phone, MapPin, Calendar, FileText, Edit, Save, X, Building, ChevronDown, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GooglePlacesAutocomplete } from '../ui/google-places-autocomplete';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

// Import shingles images
import cedarShingles from '@/assets/shingles/cedar-shingles.jpg';
import cedarShake from '@/assets/shingles/cedar-shake.jpg';
import syntheticShake from '@/assets/shingles/synthetic-shake.jpg';
import slate from '@/assets/shingles/slate.jpg';
import davinciSlate from '@/assets/shingles/davinci-slate.jpg';
import concreteTile from '@/assets/shingles/concrete-tile.jpg';
import standingSeam from '@/assets/shingles/standing-seam.jpg';
import stoneCoated from '@/assets/shingles/stone-coated.jpg';
import presidentialShake from '@/assets/shingles/presidential-shake.jpg';
import landmark from '@/assets/shingles/landmark.jpg';
import timberline from '@/assets/shingles/timberline.jpg';
import oakridge from '@/assets/shingles/oakridge.jpg';
import bravaTile from '@/assets/shingles/brava-tile.jpg';

// Roof type to image mapping
const ROOF_IMAGES: Record<string, string> = {
  'GAF Timberline HDZ': timberline,
  'GAF Timberline Ultra HD': timberline,
  'GAF Grand Canyon': timberline,
  'CertainTeed Landmark': landmark,
  'CertainTeed Landmark TL': landmark,
  'CertainTeed Landmark PRO': landmark,
  'CertainTeed Landmark Premium': landmark,
  'Owens Corning Oakridge': oakridge,
  'Owens Corning TruDefinition Duration': oakridge,
  'Malarkey Ecoasis 282': timberline,
  'Malarkey Highlander 241': timberline,
  'GAF Grand Sequoia': timberline,
  'CertainTeed Presidential Shake': presidentialShake,
  'CertainTeed Presidential TL': presidentialShake,
  'CertainTeed Presidential Solaris': presidentialShake,
  'Owens Corning TruDefinition Duration Premium': oakridge,
  'Boral Barrel Vault': stoneCoated,
  'Boral Pine Crest Shake': stoneCoated,
  'Boral Cottage Shingle': stoneCoated,
  'Boral Pacific Tile Stone': stoneCoated,
  'Steel Sheffield 24 Gage 15" S50 Snap lock': standingSeam,
  'Steel Sheffield 24 Gage 14" Mechanical seam SS200': standingSeam,
  'Steel Sheffield 24 Gage 18" S50 Snap lock': standingSeam,
  'Steel McElroy 24 Gage 15" S50 Snap lock': standingSeam,
  'Aluminum Sheffield 0.040 18" S50 Snap lock': standingSeam,
  'Eagle Capistrano': concreteTile,
  'Eagle Malibu': concreteTile,
  'Eagle Bel Air': concreteTile,
  'Boral Saxony 900 Shake': concreteTile,
  'Cedar Shingles': cedarShingles,
  'Cedar Shake Medium Premium': cedarShake,
  'Cedur Synthetic Shake': syntheticShake,
  'Tru Slate': slate,
  'DaVinci Slate': davinciSlate,
  '3-Tab Shingles': timberline,
  'Brava Tile': bravaTile
};

const ARCHITECTURAL_SHINGLES = ['GAF Timberline HDZ', 'GAF Timberline Ultra HD', 'GAF Grand Canyon', 'CertainTeed Landmark', 'CertainTeed Landmark TL', 'CertainTeed Landmark PRO', 'CertainTeed Landmark Premium', 'Owens Corning Oakridge', 'Owens Corning TruDefinition Duration', 'Malarkey Ecoasis 282', 'Malarkey Highlander 241'];
const PREMIUM_ARCHITECTURAL_SHINGLES = ['GAF Grand Sequoia', 'CertainTeed Presidential Shake', 'CertainTeed Presidential TL', 'CertainTeed Presidential Solaris', 'Owens Corning TruDefinition Duration Premium'];
const STONE_COATED = ['Boral Barrel Vault', 'Boral Pine Crest Shake', 'Boral Cottage Shingle', 'Boral Pacific Tile Stone'];
const STANDING_SEAM = ['Steel Sheffield 24 Gage 15" S50 Snap lock', 'Steel Sheffield 24 Gage 14" Mechanical seam SS200', 'Steel Sheffield 24 Gage 18" S50 Snap lock', 'Steel McElroy 24 Gage 15" S50 Snap lock', 'Aluminum Sheffield 0.040 18" S50 Snap lock'];
const CONCRETE_TILE = ['Eagle Capistrano', 'Eagle Malibu', 'Eagle Bel Air', 'Boral Saxony 900 Shake'];
const WOOD_SHAKES = ['Cedar Shingles', 'Cedar Shake Medium Premium', 'Cedur Synthetic Shake'];
const SLATE = ['Tru Slate', 'DaVinci Slate'];

interface Quote {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  property_address: string | null;
  project_type: string | null;
  property_type: string | null;
  timeline: string | null;
  notes: string | null;
  created_at: string;
  status: string;
  company_name?: string | null;
  source?: string | null;
  existing_roof?: string | null;
  wanted_roof?: string | null;
  existing_roof_deck?: string | null;
  wanted_roof_deck?: string | null;
  insulation?: string | null;
}

interface OverviewTabProps {
  quote: Quote;
  onUpdate?: () => void;
}

const formatStatus = (status: string) => {
  const statusLabels: Record<string, string> = {
    'new': 'New',
    'contacted': 'Contacted',
    'ready_to_quote': 'Ready to Quote',
    'quoted': 'Quoted',
    'proposal_sent': 'Proposal Sent',
    'contract_sent': 'Contract Sent',
    'in_production': 'In Production',
    'inspected': 'Inspected',
    'paid': 'Paid'
  };
  return statusLabels[status] || status;
};

interface QuoteAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ quote, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [attachments, setAttachments] = useState<QuoteAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { data: teamMembers = [] } = useTeamMembers();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [formData, setFormData] = useState({
    name: quote.name,
    email: quote.email,
    phone: quote.phone || '',
    company_name: quote.company_name || '',
    property_address: quote.property_address || '',
    project_type: quote.project_type || '',
    property_type: quote.property_type || '',
    timeline: quote.timeline || '',
    notes: quote.notes || '',
    status: quote.status,
    source: quote.source || '',
    existing_roof: quote.existing_roof || '',
    wanted_roof: quote.wanted_roof || '',
    existing_roof_deck: quote.existing_roof_deck || '',
    wanted_roof_deck: quote.wanted_roof_deck || '',
    insulation: quote.insulation || '',
    project_manager_id: (quote as any).project_manager_id || '',
    site_manager_id: (quote as any).site_manager_id || '',
    sales_representative_id: (quote as any).sales_representative_id || ''
  });

  // Fetch attachments on mount
  useEffect(() => {
    fetchAttachments();
  }, [quote.id]);

  const fetchAttachments = async () => {
    const { data, error } = await supabase
      .from('quote_attachments')
      .select('*')
      .eq('quote_id', quote.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
    } else {
      setAttachments(data || []);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    
    try {
      for (const file of Array.from(files)) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${quote.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('quote-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('quote-attachments')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('quote_attachments')
          .insert({
            quote_id: quote.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size
          });

        if (dbError) throw dbError;
      }

      toast.success('Files uploaded successfully');
      fetchAttachments();
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileUpload(files);
      event.target.value = ''; // Reset input
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDeleteAttachment = async (attachment: QuoteAttachment) => {
    try {
      // Extract file path from URL
      const urlParts = attachment.file_url.split('/quote-attachments/');
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('quote-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('quote_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      toast.success('Attachment deleted');
      fetchAttachments();
    } catch (error: any) {
      console.error('Error deleting attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('quote_requests')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company_name: formData.company_name || null,
          property_address: formData.property_address || null,
          project_type: formData.project_type || null,
          property_type: formData.property_type || null,
          timeline: formData.timeline || null,
          notes: formData.notes || null,
          status: formData.status,
          source: formData.source || null,
          existing_roof: formData.existing_roof || null,
          wanted_roof: formData.wanted_roof || null,
          existing_roof_deck: formData.existing_roof_deck || null,
          wanted_roof_deck: formData.wanted_roof_deck || null,
          insulation: formData.insulation || null,
          project_manager_id: formData.project_manager_id || null,
          site_manager_id: formData.site_manager_id || null,
          sales_representative_id: formData.sales_representative_id || null
        })
        .eq('id', quote.id);

      if (error) throw error;

      toast.success('Quote updated successfully');
      setIsEditing(false);
      onUpdate?.();
    } catch (error: any) {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: quote.name,
      email: quote.email,
      phone: quote.phone || '',
      company_name: quote.company_name || '',
      property_address: quote.property_address || '',
      project_type: quote.project_type || '',
      property_type: quote.property_type || '',
      timeline: quote.timeline || '',
      notes: quote.notes || '',
      status: quote.status,
      source: quote.source || '',
      existing_roof: quote.existing_roof || '',
      wanted_roof: quote.wanted_roof || '',
      existing_roof_deck: quote.existing_roof_deck || '',
      wanted_roof_deck: quote.wanted_roof_deck || '',
      insulation: quote.insulation || '',
      project_manager_id: (quote as any).project_manager_id || '',
      site_manager_id: (quote as any).site_manager_id || '',
      sales_representative_id: (quote as any).sales_representative_id || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="secondary" size="lg">
            <Edit className="w-4 h-4 mr-2" />
            Edit Details
          </Button>
        ) : (
          <>
            <Button onClick={handleCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </>
        )}
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-4 h-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Name</div>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                  className="h-9"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{quote.name}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Email</div>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email"
                  className="h-9"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm truncate">{quote.email}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Phone</div>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone"
                  className="h-9"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{quote.phone || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Company Name</div>
              {isEditing ? (
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Enter company name"
                  className="h-9"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{quote.company_name || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Source</div>
              {isEditing ? (
                <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">🌐 Website</SelectItem>
                    <SelectItem value="referral">👥 Referral</SelectItem>
                    <SelectItem value="phone">📞 Phone Call</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                    <SelectItem value="social-media">📱 Social Media</SelectItem>
                    <SelectItem value="advertisement">📢 Advertisement</SelectItem>
                    <SelectItem value="other">🔹 Other</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">
                  {quote.source === 'website' && '🌐 Website'}
                  {quote.source === 'referral' && '👥 Referral'}
                  {quote.source === 'phone' && '📞 Phone Call'}
                  {quote.source === 'email' && '📧 Email'}
                  {quote.source === 'social-media' && '📱 Social Media'}
                  {quote.source === 'advertisement' && '📢 Advertisement'}
                  {quote.source === 'other' && '🔹 Other'}
                  {!quote.source && 'Not specified'}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Status</div>
              {isEditing ? (
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">✨ New</SelectItem>
                    <SelectItem value="contacted">📞 Contacted</SelectItem>
                    <SelectItem value="ready_to_quote">✅ Ready to Quote</SelectItem>
                    <SelectItem value="quoted">💰 Quoted</SelectItem>
                    <SelectItem value="proposal_sent">📋 Proposal Sent</SelectItem>
                    <SelectItem value="contract_sent">📝 Contract Sent</SelectItem>
                    <SelectItem value="in_production">🔨 In Production</SelectItem>
                    <SelectItem value="inspected">🔍 Inspected</SelectItem>
                    <SelectItem value="paid">💵 Paid</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">
                  {quote.status === 'new' && '🆕 New'}
                  {quote.status === 'contacted' && '📞 Contacted'}
                  {quote.status === 'ready_to_quote' && '✅ Ready to Quote'}
                  {quote.status === 'quoted' && '💰 Quoted'}
                  {quote.status === 'proposal_sent' && '📤 Proposal Sent'}
                  {quote.status === 'contract_sent' && '📝 Contract Sent'}
                  {quote.status === 'in_production' && '🔨 In Production'}
                  {quote.status === 'inspected' && '🔍 Inspected'}
                  {quote.status === 'paid' && '💵 Paid'}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Project Manager</div>
              {isEditing ? (
                <Select 
                  value={formData.project_manager_id || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, project_manager_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent side="top" align="start">
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                        <span>Not assigned</span>
                      </div>
                    </SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.full_name || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name || member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">
                  {(() => {
                    const manager = teamMembers.find(m => m.user_id === (quote as any).project_manager_id);
                    return manager ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={manager.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(manager.full_name || manager.email)}</AvatarFallback>
                        </Avatar>
                        <span>{manager.full_name || manager.email}</span>
                      </div>
                    ) : 'Not assigned';
                  })()}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Site Manager</div>
              {isEditing ? (
                <Select 
                  value={formData.site_manager_id || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, site_manager_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select site manager" />
                  </SelectTrigger>
                  <SelectContent side="top" align="start">
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                        <span>Not assigned</span>
                      </div>
                    </SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.full_name || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name || member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">
                  {(() => {
                    const manager = teamMembers.find(m => m.user_id === (quote as any).site_manager_id);
                    return manager ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={manager.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(manager.full_name || manager.email)}</AvatarFallback>
                        </Avatar>
                        <span>{manager.full_name || manager.email}</span>
                      </div>
                    ) : 'Not assigned';
                  })()}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Sales Representative</div>
              {isEditing ? (
                <Select 
                  value={formData.sales_representative_id || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, sales_representative_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales representative" />
                  </SelectTrigger>
                  <SelectContent side="top" align="start">
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">—</div>
                        <span>Not assigned</span>
                      </div>
                    </SelectItem>
                    {teamMembers.filter(m => m.role === 'sales').map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.full_name || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.full_name || member.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm">
                  {(() => {
                    const rep = teamMembers.find(m => m.user_id === (quote as any).sales_representative_id);
                    return rep ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={rep.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials(rep.full_name || rep.email)}</AvatarFallback>
                        </Avatar>
                        <span>{rep.full_name || rep.email}</span>
                      </div>
                    ) : 'Not assigned';
                  })()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-4 h-4" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="md:col-span-2 lg:col-span-3">
              <div className="text-xs font-medium text-muted-foreground mb-1">Address</div>
              {isEditing ? (
                <GooglePlacesAutocomplete
                  value={formData.property_address}
                  onChange={(value) => setFormData({ ...formData, property_address: value })}
                  placeholder="Enter address"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm">{quote.property_address || 'Not provided'}</span>
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Project Type</div>
              {isEditing ? (
                <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential-installation">Residential Installation</SelectItem>
                    <SelectItem value="residential-repair">Residential Repair</SelectItem>
                    <SelectItem value="commercial-installation">Commercial Installation</SelectItem>
                    <SelectItem value="commercial-repair">Commercial Repair</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">
                  {quote.project_type === 'residential-installation' && '🏠 Residential Installation'}
                  {quote.project_type === 'residential-repair' && '🔧 Residential Repair'}
                  {quote.project_type === 'commercial-installation' && '🏢 Commercial Installation'}
                  {quote.project_type === 'commercial-repair' && '🔨 Commercial Repair'}
                  {quote.project_type === 'inspection' && '🔍 Inspection'}
                  {!quote.project_type && 'Not specified'}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Property Type</div>
              {isEditing ? (
                <Select value={formData.property_type} onValueChange={(value) => setFormData({ ...formData, property_type: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single Family</SelectItem>
                    <SelectItem value="multi-family">Multi Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">
                  {quote.property_type === 'single-family' && '🏡 Single Family'}
                  {quote.property_type === 'multi-family' && '🏘️ Multi Family'}
                  {quote.property_type === 'commercial' && '🏢 Commercial'}
                  {quote.property_type === 'industrial' && '🏭 Industrial'}
                  {!quote.property_type && 'Not specified'}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Timeline</div>
              {isEditing ? (
                <Select value={formData.timeline} onValueChange={(value) => setFormData({ ...formData, timeline: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASAP">ASAP</SelectItem>
                    <SelectItem value="Within 1 month">Within 1 month</SelectItem>
                    <SelectItem value="Within 3 months">Within 3 months</SelectItem>
                    <SelectItem value="Within 6 months">Within 6 months</SelectItem>
                    <SelectItem value="Just planning">Just planning</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">
                  {quote.timeline === 'ASAP' && '🚨 ASAP'}
                  {quote.timeline === 'Within 1 month' && '📅 Within 1 month'}
                  {quote.timeline === 'Within 3 months' && '📆 Within 3 months'}
                  {quote.timeline === 'Within 6 months' && '🗓️ Within 6 months'}
                  {quote.timeline === 'Just planning' && '💭 Just planning'}
                  {!quote.timeline && 'Not specified'}
                </span>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Created</div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm">{new Date(quote.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Roof Details */}
          <div className="border-t pt-3 mt-3">
            <h3 className="text-sm font-semibold mb-3">Roof Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Existing Roof</div>
              {isEditing ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-start text-xs font-normal py-2 px-3">
                      {formData.existing_roof ? (() => {
                        const match = formData.existing_roof.match(/(Low Heavy|Medium Heavy|Very Heavy)[^(]*\(([^:)]+)/);
                        let displayText = formData.existing_roof;
                        let roofType = '';
                        let imageUrl = null;
                        if (match) {
                          const weightCategory = match[1];
                          roofType = match[2].trim();
                          
                          if (roofType === 'Arch') roofType = 'Architectural Shingles';
                          else if (roofType === 'Premium') roofType = 'Premium Architectural';
                          else if (roofType === '3-Tab Standard') roofType = '3-Tab Shingles';
                          else if (roofType.includes('Boral') && formData.existing_roof.includes('1.5 lbs')) roofType = 'Stone-Coated Steel';
                          else if (roofType.includes('Aluminum')) roofType = 'Standing Seam Metal';
                          else if (roofType.includes('Steel')) roofType = 'Standing Seam Metal';
                          else if (roofType.includes('Eagle')) roofType = 'Concrete Tile';
                          else if (roofType.includes('DaVinci')) roofType = 'Slate';
                          else if (roofType.includes('Natural')) roofType = 'Slate';
                          else if (roofType.includes('Cedur')) roofType = 'Wood Shakes';
                          else if (roofType.includes('Cedar')) roofType = 'Wood Shakes';
                          displayText = `${roofType} - ${weightCategory}`;
                          
                          if (roofType === 'Architectural Shingles') imageUrl = timberline;
                          else if (roofType === 'Premium Architectural') imageUrl = presidentialShake;
                          else if (roofType === '3-Tab Shingles') imageUrl = timberline;
                          else if (roofType === 'Stone-Coated Steel') imageUrl = stoneCoated;
                          else if (roofType === 'Standing Seam Metal') imageUrl = standingSeam;
                          else if (roofType === 'Concrete Tile') imageUrl = concreteTile;
                          else if (roofType === 'Slate') imageUrl = slate;
                          else if (roofType === 'Wood Shakes') imageUrl = cedarShake;
                        }
                        return (
                          <>
                            {imageUrl && <img src={imageUrl} alt={roofType} className="w-6 h-6 object-cover rounded flex-shrink-0" />}
                            <span className={`flex-1 text-left pr-2 whitespace-normal break-words text-xs ${imageUrl ? 'ml-2' : ''}`}>
                              {displayText}
                            </span>
                          </>
                        );
                      })() : (
                        <span className="flex-1 text-left pr-2 whitespace-normal break-words text-muted-foreground text-xs">
                          Select roof type
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 2.9 lbs/sqft (Arch: Timberline HDZ, Landmark, Oakridge)' })}>
                          Low Heavy - 2.9 lbs/sqft (Timberline HDZ, Landmark, Oakridge)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Medium Heavy - 3.2 lbs/sqft (Arch: Landmark TL, Landmark PRO)' })}>
                          Medium Heavy - 3.2 lbs/sqft (Landmark TL, Landmark PRO)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Very Heavy - 3.8 lbs/sqft (Arch: Grand Canyon, Malarkey)' })}>
                          Very Heavy - 3.8 lbs/sqft (Grand Canyon, Malarkey)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Premium Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Medium Heavy - 4.1 lbs/sqft (Premium: Presidential Shake, Presidential TL)' })}>
                          Medium Heavy - 4.1 lbs/sqft (Presidential Shake, Presidential TL)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Very Heavy - 4.6 lbs/sqft (Premium: Grand Sequoia, Presidential Solaris, Duration Premium)' })}>
                          Very Heavy - 4.6 lbs/sqft (Grand Sequoia, Presidential Solaris, Duration Premium)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>3-Tab Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 2.4 lbs/sqft (3-Tab Standard)' })}>
                          Low Heavy - 2.4 lbs/sqft (3-Tab Standard)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Stone-Coated Steel</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 1.5 lbs/sqft (Boral Barrel Vault, Pine Crest, Cottage, Pacific Tile)' })}>
                          Low Heavy - 1.5 lbs/sqft (Boral Barrel Vault, Pine Crest, Cottage, Pacific Tile)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Standing Seam Metal</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 0.6 lbs/sqft (Aluminum Sheffield)' })}>
                          Low Heavy - 0.6 lbs/sqft (Aluminum Sheffield)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 1.0 lbs/sqft (Steel Sheffield, Steel McElroy)' })}>
                          Low Heavy - 1.0 lbs/sqft (Steel Sheffield, Steel McElroy)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Concrete Tile</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Very Heavy - 7.2 lbs/sqft (Eagle Lightweight)' })}>
                          Very Heavy - 7.2 lbs/sqft (Eagle Lightweight)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Very Heavy - 9.7 lbs/sqft (Eagle Standard, Boral Saxony)' })}>
                          Very Heavy - 9.7 lbs/sqft (Eagle Standard, Boral Saxony)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Slate</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Medium Heavy - 3.8 lbs/sqft (DaVinci Synthetic Slate)' })}>
                          Medium Heavy - 3.8 lbs/sqft (DaVinci Synthetic Slate)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Very Heavy - 8.5 lbs/sqft (Natural Tru Slate)' })}>
                          Very Heavy - 8.5 lbs/sqft (Natural Tru Slate)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Wood Shakes & Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 1.8 lbs/sqft (Cedur Synthetic Shake)' })}>
                          Low Heavy - 1.8 lbs/sqft (Cedur Synthetic Shake)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Low Heavy - 2.5 lbs/sqft (Cedar Shingles)' })}>
                          Low Heavy - 2.5 lbs/sqft (Cedar Shingles)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setFormData({ ...formData, existing_roof: 'Medium Heavy - 3.5 lbs/sqft (Cedar Shake Medium Premium)' })}>
                          Medium Heavy - 3.5 lbs/sqft (Cedar Shake Medium Premium)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="text-sm">
                  {quote.existing_roof ? (() => {
                    const match = quote.existing_roof.match(/(Low Heavy|Medium Heavy|Very Heavy)[^(]*\(([^:)]+)/);
                    let displayText = quote.existing_roof;
                    let roofType = '';
                    let imageUrl = null;
                    if (match) {
                      const weightCategory = match[1];
                      roofType = match[2].trim();
                      
                      if (roofType === 'Arch') roofType = 'Architectural Shingles';
                      else if (roofType === 'Premium') roofType = 'Premium Architectural';
                      else if (roofType === '3-Tab Standard') roofType = '3-Tab Shingles';
                      else if (roofType.includes('Boral') && quote.existing_roof.includes('1.5 lbs')) roofType = 'Stone-Coated Steel';
                      else if (roofType.includes('Aluminum')) roofType = 'Standing Seam Metal';
                      else if (roofType.includes('Steel')) roofType = 'Standing Seam Metal';
                      else if (roofType.includes('Eagle')) roofType = 'Concrete Tile';
                      else if (roofType.includes('DaVinci')) roofType = 'Slate';
                      else if (roofType.includes('Natural')) roofType = 'Slate';
                      else if (roofType.includes('Cedur')) roofType = 'Wood Shakes';
                      else if (roofType.includes('Cedar')) roofType = 'Wood Shakes';
                      displayText = `${roofType} - ${weightCategory}`;
                      
                      if (roofType === 'Architectural Shingles') imageUrl = timberline;
                      else if (roofType === 'Premium Architectural') imageUrl = presidentialShake;
                      else if (roofType === '3-Tab Shingles') imageUrl = timberline;
                      else if (roofType === 'Stone-Coated Steel') imageUrl = stoneCoated;
                      else if (roofType === 'Standing Seam Metal') imageUrl = standingSeam;
                      else if (roofType === 'Concrete Tile') imageUrl = concreteTile;
                      else if (roofType === 'Slate') imageUrl = slate;
                      else if (roofType === 'Wood Shakes') imageUrl = cedarShake;
                    }
                    return (
                      <div className="flex items-center gap-2">
                        {imageUrl && <img src={imageUrl} alt={roofType} className="w-6 h-6 object-cover rounded flex-shrink-0" />}
                        <span className="text-xs">{displayText}</span>
                      </div>
                    );
                  })() : 'Not specified'}
                </div>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Wanted Roof</div>
              {isEditing ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 w-full justify-start text-xs font-normal py-2 px-3">
                      {formData.wanted_roof ? (() => {
                        const parts = formData.wanted_roof.split(' - ');
                        let imageUrl = null;
                        if (parts.length > 1) {
                          const specificType = parts[1];
                          imageUrl = ROOF_IMAGES[specificType] || null;
                        } else {
                          imageUrl = ROOF_IMAGES[formData.wanted_roof] || null;
                        }
                        return (
                          <>
                            {imageUrl && <img src={imageUrl} alt={formData.wanted_roof} className="w-6 h-6 object-cover rounded flex-shrink-0" />}
                            <span className={`flex-1 text-left pr-2 whitespace-normal break-words text-xs ${imageUrl ? 'ml-2' : ''}`}>
                              {formData.wanted_roof}
                            </span>
                          </>
                        );
                      })() : (
                        <span className="flex-1 text-left pr-2 whitespace-normal break-words text-muted-foreground text-xs">
                          Select roof type
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72">
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {ARCHITECTURAL_SHINGLES.map(shingle => (
                          <DropdownMenuItem key={shingle} onClick={() => setFormData({ ...formData, wanted_roof: `Architectural Shingles - ${shingle}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[shingle] && <img src={ROOF_IMAGES[shingle]} alt={shingle} className="w-8 h-8 object-cover rounded" />}
                            <span>{shingle}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Premium Architectural Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {PREMIUM_ARCHITECTURAL_SHINGLES.map(shingle => (
                          <DropdownMenuItem key={shingle} onClick={() => setFormData({ ...formData, wanted_roof: `Premium Architectural - ${shingle}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[shingle] && <img src={ROOF_IMAGES[shingle]} alt={shingle} className="w-8 h-8 object-cover rounded" />}
                            <span>{shingle}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={() => setFormData({ ...formData, wanted_roof: '3-Tab Shingles' })} className="flex items-center gap-2">
                      {ROOF_IMAGES['3-Tab Shingles'] && <img src={ROOF_IMAGES['3-Tab Shingles']} alt="3-Tab Shingles" className="w-8 h-8 object-cover rounded" />}
                      <span>3-Tab Shingles</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFormData({ ...formData, wanted_roof: 'Brava Tile' })} className="flex items-center gap-2">
                      {ROOF_IMAGES['Brava Tile'] && <img src={ROOF_IMAGES['Brava Tile']} alt="Brava Tile" className="w-8 h-8 object-cover rounded" />}
                      <span>Brava Tile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Stone-Coated</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {STONE_COATED.map(item => (
                          <DropdownMenuItem key={item} onClick={() => setFormData({ ...formData, wanted_roof: `Stone-Coated - ${item}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Standing Seam</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-80">
                        {STANDING_SEAM.map(item => (
                          <DropdownMenuItem key={item} onClick={() => setFormData({ ...formData, wanted_roof: `Standing Seam - ${item}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Concrete Tile</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {CONCRETE_TILE.map(item => (
                          <DropdownMenuItem key={item} onClick={() => setFormData({ ...formData, wanted_roof: `Concrete Tile - ${item}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Wood Shakes & Shingles</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {WOOD_SHAKES.map(item => (
                          <DropdownMenuItem key={item} onClick={() => setFormData({ ...formData, wanted_roof: `Wood Shakes - ${item}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Slate</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-72">
                        {SLATE.map(item => (
                          <DropdownMenuItem key={item} onClick={() => setFormData({ ...formData, wanted_roof: `Slate - ${item}` })} className="flex items-center gap-2">
                            {ROOF_IMAGES[item] && <img src={ROOF_IMAGES[item]} alt={item} className="w-8 h-8 object-cover rounded" />}
                            <span>{item}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="text-sm">
                  {quote.wanted_roof ? (() => {
                    const parts = quote.wanted_roof.split(' - ');
                    let imageUrl = null;
                    if (parts.length > 1) {
                      const specificType = parts[1];
                      imageUrl = ROOF_IMAGES[specificType] || null;
                    } else {
                      imageUrl = ROOF_IMAGES[quote.wanted_roof] || null;
                    }
                    return (
                      <div className="flex items-center gap-2">
                        {imageUrl && <img src={imageUrl} alt={quote.wanted_roof} className="w-6 h-6 object-cover rounded flex-shrink-0" />}
                        <span className="text-xs">{quote.wanted_roof}</span>
                      </div>
                    );
                  })() : 'Not specified'}
                </div>
              )}
            </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Existing Roof Deck</div>
                {isEditing ? (
                  <Select value={formData.existing_roof_deck} onValueChange={(value) => setFormData({ ...formData, existing_roof_deck: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select deck type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OSB (Oriented Strand Board)">OSB (Oriented Strand Board)</SelectItem>
                      <SelectItem value="Plywood">Plywood</SelectItem>
                    </SelectContent>
                  </Select>
                  ) : (
                  <span className="text-sm">{quote.existing_roof_deck || 'Not specified'}</span>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Wanted Roof Deck</div>
                {isEditing ? (
                  <Select value={formData.wanted_roof_deck} onValueChange={(value) => setFormData({ ...formData, wanted_roof_deck: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select deck type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OSB (Oriented Strand Board)">OSB (Oriented Strand Board)</SelectItem>
                      <SelectItem value="Plywood">Plywood</SelectItem>
                    </SelectContent>
                  </Select>
                  ) : (
                  <span className="text-sm">{quote.wanted_roof_deck || 'Not specified'}</span>
                )}
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Insulation</div>
                {isEditing ? (
                  <Select value={formData.insulation} onValueChange={(value) => setFormData({ ...formData, insulation: value })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select insulation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='1/2"'>1/2"</SelectItem>
                      <SelectItem value='1"'>1"</SelectItem>
                      <SelectItem value='1 1/2"'>1 1/2"</SelectItem>
                      <SelectItem value='2"'>2"</SelectItem>
                      <SelectItem value='3"'>3"</SelectItem>
                      <SelectItem value='4"'>4"</SelectItem>
                    </SelectContent>
                  </Select>
                  ) : (
                  <span className="text-sm">{quote.insulation || 'Not specified'}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-4 h-4" />
            Customer Notes & Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any specific requirements, preferences, or additional details about the project..."
                rows={4}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 The more detailed the notes, the more accurate the AI-generated quote will be
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {quote.notes || 'No notes added'}
            </p>
          )}

          {/* Attachments Section */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                Screenshots & Attachments
              </h4>
              {isEditing && (
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingFiles}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="h-8"
                  >
                    <Upload className="w-3.5 h-3.5 mr-2" />
                    {uploadingFiles ? 'Uploading...' : 'Upload'}
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                    disabled={uploadingFiles}
                  />
                </label>
              )}
            </div>

            {attachments.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                      <img
                        src={attachment.file_url}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isEditing && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                        onClick={() => handleDeleteAttachment(attachment)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {attachment.file_name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => isEditing && document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  {isEditing ? 'Drag and drop images here, or click to browse' : 'No attachments yet'}
                </p>
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Supports: JPG, PNG, GIF (Max 5MB per file)
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
