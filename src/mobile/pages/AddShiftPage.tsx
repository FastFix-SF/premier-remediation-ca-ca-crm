import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Calendar as CalendarIcon, MapPin, Users as UsersIcon, Paperclip, Save, Send, Coffee, Image as ImageIcon, Trash2, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AddressAutocomplete } from '@/mobile/components/AddressAutocomplete';
import { UserSelectionSheet } from '@/mobile/components/UserSelectionSheet';
import { ProjectSelectionModal } from '@/mobile/components/ProjectSelectionModal';
import { TimePicker } from '@/mobile/components/TimePicker';
import { toast } from 'sonner';
import { notifyJobAssignment } from '@/utils/sendSmsNotification';
import { formatTime12Hour } from '@/utils/timezone';

export const AddShiftPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editShiftId = searchParams.get('edit');
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [isAllDay, setIsAllDay] = useState(false);
  const [shiftColor, setShiftColor] = useState('#dc2626'); // red
  const [fromDate, setFromDate] = useState(initialDate);
  const [fromTime, setFromTime] = useState('08:00');
  const [toDate, setToDate] = useState(initialDate);
  const [toTime, setToTime] = useState('16:00');
  const [shiftTitle, setShiftTitle] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [autoTitleFromAddress, setAutoTitleFromAddress] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<{name: string; url: string}[]>([]);
  const [address, setAddress] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isUserSelectionOpen, setIsUserSelectionOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [isProjectSelectionOpen, setIsProjectSelectionOpen] = useState(false);
  const [isFromTimePickerOpen, setIsFromTimePickerOpen] = useState(false);
  const [isToTimePickerOpen, setIsToTimePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['team-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_directory')
        .select('*')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      
      // Fetch avatar URLs from profiles table
      const userIds = data?.map(u => u.user_id).filter(Boolean) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', userIds);
      
      const avatarMap = new Map(profilesData?.map(p => [p.id, p.avatar_url]) || []);
      
      // Merge avatar URLs into user data
      return data?.map(user => ({
        ...user,
        avatar_url: user.user_id ? avatarMap.get(user.user_id) : null
      })) || [];
    }
  });

  // Load existing shift data if editing
  const { data: existingShift } = useQuery({
    queryKey: ['job-schedule-edit', editShiftId],
    queryFn: async () => {
      if (!editShiftId) return null;
      const { data, error } = await supabase
        .from('job_schedules')
        .select('*')
        .eq('id', editShiftId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!editShiftId
  });

  // Populate form when editing
  useEffect(() => {
    if (existingShift) {
      setShiftTitle(existingShift.job_name || '');
      setShiftNotes(existingShift.description || '');
      
      const startTime = new Date(existingShift.start_time);
      const endTime = new Date(existingShift.end_time);
      
      setFromDate(startTime.toISOString().split('T')[0]);
      setFromTime(startTime.toTimeString().slice(0, 5));
      setToDate(endTime.toISOString().split('T')[0]);
      setToTime(endTime.toTimeString().slice(0, 5));
      
      setAddress(existingShift.location || '');
      setSelectedProjectId(existingShift.project_id);
      setShiftColor(existingShift.color || '#dc2626');
      
      // Extract user IDs from assigned_users
      if (Array.isArray(existingShift.assigned_users)) {
        const userIds = existingShift.assigned_users.map((user: any) => user.id || user.email);
        setSelectedUserIds(userIds);
      }
      
      // Load existing attachments
      if (Array.isArray(existingShift.attachments)) {
        setExistingAttachments(existingShift.attachments as {name: string; url: string}[]);
      }
    }
  }, [existingShift]);

  // Handle address selection with auto-fill for shift title
  const handlePlaceSelected = (details: { 
    fullAddress: string; 
    streetAddress: string;
    city?: string;
    state?: string;
    zip?: string;
  }) => {
    setAddress(details.fullAddress);
    // Auto-fill shift title with street address if empty or matches previous auto-title
    if (!shiftTitle.trim() || shiftTitle === autoTitleFromAddress) {
      setShiftTitle(details.streetAddress);
      setAutoTitleFromAddress(details.streetAddress);
    }
  };

  // Upload files to storage and return URLs
  const uploadAttachments = async (files: File[], shiftId: string): Promise<{name: string; url: string}[]> => {
    const uploadedFiles: {name: string; url: string}[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shiftId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('quote-attachments')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('quote-attachments')
        .getPublicUrl(fileName);
      
      uploadedFiles.push({ name: file.name, url: publicUrl });
    }
    
    return uploadedFiles;
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const selectedUsers = users.filter(user => 
    selectedUserIds.includes(user.user_id || user.email)
  );

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const calculateTotalHours = () => {
    if (isAllDay) return '24:00';
    const from = new Date(`${fromDate}T${fromTime}`);
    const to = new Date(`${toDate}T${toTime}`);
    const diff = (to.getTime() - from.getTime()) / (1000 * 60 * 60);
    const hours = Math.floor(diff);
    const minutes = Math.round((diff - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveShiftDraft = async () => {
    if (!shiftTitle.trim()) {
      toast.error('Please enter a shift title');
      return;
    }

    try {
      const startTime = isAllDay
        ? new Date(`${fromDate}T00:00:00`).toISOString()
        : new Date(`${fromDate}T${fromTime}`).toISOString();
      
      const endTime = isAllDay
        ? new Date(`${toDate}T23:59:59`).toISOString()
        : new Date(`${toDate}T${toTime}`).toISOString();

      const start = new Date(startTime);
      const end = new Date(endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Generate a temporary ID for uploading attachments
      const tempId = crypto.randomUUID();
      
      // Upload new attachments
      let uploadedAttachments: {name: string; url: string}[] = [...existingAttachments];
      if (attachments.length > 0) {
        const newUploads = await uploadAttachments(attachments, tempId);
        uploadedAttachments = [...uploadedAttachments, ...newUploads];
      }

      const shiftData = {
        job_name: shiftTitle,
        description: shiftNotes || null,
        assigned_users: selectedUsers.map(user => ({
          id: user.user_id || user.email,
          user_id: user.user_id || user.email,
          name: user.full_name || user.email.split('@')[0],
          email: user.email,
          avatar: null,
          assignment_status: 'pending'
        })),
        start_time: startTime,
        end_time: endTime,
        estimated_hours: hours,
        project_id: selectedProjectId,
        location: address || null,
        status: 'draft',
        priority: 'normal',
        color: shiftColor,
        attachments: uploadedAttachments
      };

      // Check if we're editing an existing shift - update instead of insert
      if (editShiftId) {
        const { error } = await supabase
          .from('job_schedules')
          .update(shiftData)
          .eq('id', editShiftId);

        if (error) throw error;
        toast.success('Shift updated to draft', { duration: 2000 });
      } else {
        const { error } = await supabase
          .from('job_schedules')
          .insert(shiftData);

        if (error) throw error;
        toast.success('Shift saved as draft', { duration: 2000 });
      }
      
      navigate('/mobile/job-scheduling');
    } catch (error) {
      console.error('Error saving shift draft:', error);
      toast.error('Failed to save shift draft');
    }
  };

  const handlePublishShift = async () => {
    // Validate required fields
    if (!shiftTitle.trim()) {
      toast.error('Please enter a shift title');
      return;
    }

    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    try {
      // Prepare start and end times
      const startTime = isAllDay 
        ? new Date(`${fromDate}T00:00:00`).toISOString()
        : new Date(`${fromDate}T${fromTime}`).toISOString();
      
      const endTime = isAllDay
        ? new Date(`${toDate}T23:59:59`).toISOString()
        : new Date(`${toDate}T${toTime}`).toISOString();

      // Calculate total hours
      const start = new Date(startTime);
      const end = new Date(endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      // Upload new attachments
      const shiftId = editShiftId || crypto.randomUUID();
      let uploadedAttachments: {name: string; url: string}[] = [...existingAttachments];
      if (attachments.length > 0) {
        const newUploads = await uploadAttachments(attachments, shiftId);
        uploadedAttachments = [...uploadedAttachments, ...newUploads];
      }

      const shiftData = {
        job_name: shiftTitle,
        description: shiftNotes || null,
        assigned_users: selectedUsers.map(user => ({
          id: user.user_id || user.email,
          user_id: user.user_id || user.email,
          name: user.full_name || user.email.split('@')[0],
          email: user.email,
          avatar: null,
          assignment_status: 'pending'
        })),
        start_time: startTime,
        end_time: endTime,
        estimated_hours: hours,
        project_id: selectedProjectId,
        location: address || null,
        status: 'scheduled',
        priority: 'normal',
        color: shiftColor,
        attachments: uploadedAttachments
      };

      let savedShiftId = editShiftId;

      if (editShiftId) {
        // Update existing shift
        const { error } = await supabase
          .from('job_schedules')
          .update(shiftData)
          .eq('id', editShiftId);

        if (error) throw error;
        toast.success('Shift updated successfully!');
      } else {
        // Insert new shift
        const { data: insertedShift, error } = await supabase
          .from('job_schedules')
          .insert(shiftData)
          .select('id')
          .maybeSingle();

        if (error) throw error;
        savedShiftId = insertedShift.id;
        toast.success('Shift published successfully!');
      }

      // Send SMS notifications to shift assigned users
      try {
        console.log('📱 Sending shift assignment notifications to users:', selectedUserIds);
        for (const user of selectedUsers) {
          await notifyJobAssignment(
            user.user_id || user.email,
            shiftTitle
          );
        }
      } catch (notifError) {
        console.error('Failed to send SMS notifications:', notifError);
        // Don't throw - notifications are secondary
      }

      navigate('/mobile/job-scheduling');
    } catch (error) {
      console.error('Error saving shift:', error);
      toast.error(`Failed to ${editShiftId ? 'update' : 'publish'} shift. Please try again.`);
    }
  };

  const colorOptions = [
    { color: '#dc2626', label: 'Red' },
    { color: '#7c3aed', label: 'Purple' },
    { color: '#2563eb', label: 'Blue' },
    { color: '#059669', label: 'Green' },
    { color: '#ea580c', label: 'Orange' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile/job-scheduling')}
            className="h-10 w-10"
          >
            <X className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">{editShiftId ? 'Edit shift' : 'Add shift'}</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Shift Details */}
      <div className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto">
          {/* All Day Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <Label htmlFor="all-day" className="text-base">All day</Label>
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* From Date/Time */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Label className="text-sm">From</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-[130px] h-8 text-xs text-foreground border-none shadow-none text-right p-1"
              />
              {!isAllDay && (
                <button
                  onClick={() => setIsFromTimePickerOpen(true)}
                  className="text-sm text-primary font-medium cursor-pointer hover:underline"
                >
                  {formatTime12Hour(fromTime)}
                </button>
              )}
            </div>
          </div>

          {/* To Date/Time */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Label className="text-sm">To</Label>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-[130px] h-8 text-xs text-foreground border-none shadow-none text-right p-1"
              />
              {!isAllDay && (
                <button
                  onClick={() => setIsToTimePickerOpen(true)}
                  className="text-sm text-primary font-medium cursor-pointer hover:underline"
                >
                  {formatTime12Hour(toTime)}
                </button>
              )}
            </div>
          </div>

          {/* Breaks */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <Label className="text-base">Breaks</Label>
            <Button variant="ghost" className="text-primary">
              <Coffee className="w-4 h-4 mr-2" />
              Add breaks
            </Button>
          </div>

          {/* Total Shift Hours */}
          <div className="flex items-center justify-between py-2 px-3 border-b border-border bg-muted rounded-lg">
            <Label className="text-base font-semibold">Total shift hours</Label>
            <span className="text-lg font-semibold">{calculateTotalHours()}</span>
          </div>

          {/* Address - Now at top */}
          <AddressAutocomplete 
            value={address} 
            onChange={setAddress}
            onPlaceSelected={handlePlaceSelected}
            placeholder="Enter job site address"
          />

          {/* Shift Title */}
          <div className="py-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Shift title</Label>
              <div className="flex gap-2">
                {colorOptions.map((option) => (
                  <button
                    key={option.color}
                    onClick={() => setShiftColor(option.color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      shiftColor === option.color ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: option.color }}
                    aria-label={option.label}
                  />
                ))}
              </div>
            </div>
            <Input
              placeholder="Auto-filled from address or type here"
              value={shiftTitle}
              onChange={(e) => {
                setShiftTitle(e.target.value);
                // Clear auto-title tracking if user manually edits
                if (e.target.value !== autoTitleFromAddress) {
                  setAutoTitleFromAddress('');
                }
              }}
              className="text-base"
            />
          </div>

          {/* Job */}
          <div 
            className="flex items-center justify-between py-3 border-b border-border cursor-pointer"
            onClick={() => setIsProjectSelectionOpen(true)}
          >
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-muted-foreground" />
              <Label className="text-base">Job</Label>
            </div>
            {selectedProjectName && (
              <span className="text-sm text-foreground font-medium">
                {selectedProjectName}
              </span>
            )}
          </div>

          <ProjectSelectionModal
            open={isProjectSelectionOpen}
            onClose={() => setIsProjectSelectionOpen(false)}
            onSelectProject={(projectId, projectName, projectAddress) => {
              setSelectedProjectId(projectId);
              setSelectedProjectName(projectName);
              // Auto-fill address if project has an address
              if (projectAddress) {
                setAddress(projectAddress);
              }
              setIsProjectSelectionOpen(false);
            }}
          />

          {/* Users */}
          <div className="py-3 border-b border-border space-y-2">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsUserSelectionOpen(true)}
            >
              <div className="flex items-center gap-3">
                <UsersIcon className="w-5 h-5 text-muted-foreground" />
                <Label className="text-base">Users</Label>
              </div>
              {selectedUsers.length > 0 && (
                <span className="text-sm text-primary font-medium">
                  {selectedUsers.length} selected
                </span>
              )}
            </div>
            
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 pl-8">
                {selectedUsers.map((user) => (
                  <div 
                    key={user.user_id || user.email}
                    className="flex items-center gap-2 bg-muted rounded-full pr-3 py-1"
                  >
                    <Avatar className="h-6 w-6">
                      {user.avatar_url && (
                        <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {user.full_name || user.email.split('@')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <UserSelectionSheet
            isOpen={isUserSelectionOpen}
            onClose={() => setIsUserSelectionOpen(false)}
            selectedUserIds={selectedUserIds}
            onSelectUsers={setSelectedUserIds}
          />

          {/* Time Pickers */}
          <TimePicker
            isOpen={isFromTimePickerOpen}
            onClose={() => setIsFromTimePickerOpen(false)}
            value={fromTime}
            onSelect={setFromTime}
            title="From Time"
          />
          <TimePicker
            isOpen={isToTimePickerOpen}
            onClose={() => setIsToTimePickerOpen(false)}
            value={toTime}
            onSelect={setToTime}
            title="To Time"
          />

          {/* Notes Section */}
          <div className="py-3 border-b border-border space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                <FileText className="w-3 h-3 text-amber-900" />
              </div>
              <Label className="text-base font-medium">Notes</Label>
            </div>
            <Textarea
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              placeholder="Add instructions, special requirements, or details for this shift..."
              className="min-h-[80px] max-h-[150px] resize-none rounded-xl border-2 border-border/50 focus:border-amber-400/50 bg-muted/30 text-sm"
            />
          </div>

          {/* Attachments */}
          <div className="py-3 border-b border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                    <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                  </div>
                </div>
                <Label className="text-base">Attachments</Label>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {(existingAttachments.length > 0 || attachments.length > 0) && (
              <div className="space-y-2">
                {/* Existing attachments (already uploaded) */}
                {existingAttachments.map((attachment, index) => (
                  <div key={`existing-${index}`} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveExistingAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {/* New attachments (pending upload) */}
                {attachments.map((file, index) => (
                  <div key={`new-${index}`} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveAttachment(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 bg-background border-t border-border p-3 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-12 w-12 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={async () => {
            if (confirm('Are you sure you want to delete this shift?')) {
              if (editShiftId) {
                try {
                  const { error } = await supabase
                    .from('job_schedules')
                    .delete()
                    .eq('id', editShiftId);
                  
                  if (error) throw error;
                  toast.success('Shift deleted successfully');
                } catch (error) {
                  console.error('Error deleting shift:', error);
                  toast.error('Failed to delete shift');
                  return;
                }
              }
              navigate('/mobile/job-scheduling');
            }
          }}
        >
          <Trash2 className="w-5 h-5" />
        </Button>
        <Button 
          variant="outline"
          className="flex-1 h-12 font-semibold text-sm"
          onClick={handleSaveShiftDraft}
          disabled={!shiftTitle.trim()}
        >
          <Save className="w-4 h-4 mr-2" />
          Save draft
        </Button>
        <Button 
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm"
          onClick={handlePublishShift}
          disabled={!shiftTitle.trim() || selectedUserIds.length === 0}
        >
          <Send className="w-4 h-4 mr-2" />
          {editShiftId ? 'Update shift' : 'Publish shift'}
        </Button>
      </div>
    </div>
  );
};
