import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DocumentsSection from './contact-sections/DocumentsSection';
import LicensesSection from './contact-sections/LicensesSection';
import InsuranceSection from './contact-sections/InsuranceSection';
import FilesSection from './contact-sections/FilesSection';
import NotesSection from './contact-sections/NotesSection';
import TrainingSection from './contact-sections/TrainingSection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useContactDetails } from '@/hooks/useContactDetails';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Info, 
  ShoppingCart, 
  FileText, 
  FolderOpen, 
  UserCheck, 
  Receipt, 
  StickyNote,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  GraduationCap,
  Clock,
  Shield,
  Award,
  DollarSign,
  X,
  ChevronRight,
  Menu,
  Globe,
  Building2,
  Hash,
  CreditCard,
  Tag,
  Pencil,
  Check,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DirectoryEntry {
  id: string;
  type: 'vendors' | 'employees' | 'contractors' | 'customers' | 'leads' | 'miscellaneous';
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  cell?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  role?: string;
  avatar_url?: string;
  isFavorite?: boolean;
  rating?: number;
}

interface ContactDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: DirectoryEntry | null;
}

type MenuItemType = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

// Editable form data interface
interface EditableContactData {
  company: string;
  email: string;
  phone: string;
  cell: string;
  role: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const getMenuItemsForType = (type: DirectoryEntry['type']): MenuItemType[] => {
  switch (type) {
    case 'leads':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'sales', label: 'Sales', icon: ShoppingCart },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    case 'vendors':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'licenses', label: 'Licenses', icon: Award },
        { id: 'insurance', label: 'Insurance', icon: Shield },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    case 'customers':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'sales', label: 'Sales', icon: ShoppingCart },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'client-access', label: 'Access', icon: UserCheck },
        { id: 'invoice-terms', label: 'Invoice', icon: Receipt },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    case 'employees':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'training', label: 'Training', icon: GraduationCap },
        { id: 'time-off', label: 'Time Off', icon: Clock },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    case 'contractors':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'licenses', label: 'Licenses', icon: Award },
        { id: 'insurance', label: 'Insurance', icon: Shield },
        { id: 'time-off', label: 'Time Off', icon: Clock },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    case 'miscellaneous':
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
    default:
      return [
        { id: 'details', label: 'Details', icon: Info },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'notes', label: 'Notes', icon: StickyNote },
      ];
  }
};

const ContactDetailDialog: React.FC<ContactDetailDialogProps> = ({
  open,
  onOpenChange,
  contact,
}) => {
  const [activeSection, setActiveSection] = useState('details');
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [hourlyRateInput, setHourlyRateInput] = useState('');
  const [overtimeMultiplierInput, setOvertimeMultiplierInput] = useState('1.5');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableContactData>({
    company: '',
    email: '',
    phone: '',
    cell: '',
    role: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });
  const queryClient = useQueryClient();
  
  const { updateContact } = useContactDetails(contact?.id);

  // Fetch employee mapping and pay rate for employees
  const { data: employeePayData } = useQuery({
    queryKey: ['employee-pay-rate', contact?.email],
    queryFn: async () => {
      if (!contact?.email) return null;
      
      const { data: mapping } = await supabase
        .from('employee_mapping')
        .select('id, email, connecteam_name')
        .eq('email', contact.email)
        .maybeSingle();
      
      if (!mapping) return { mapping: null, payRate: null };
      
      const { data: payRate } = await supabase
        .from('employee_pay_rates')
        .select('*')
        .eq('employee_mapping_id', mapping.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return { mapping, payRate };
    },
    enabled: !!contact?.email && contact?.type === 'employees'
  });

  const savePayRate = useMutation({
    mutationFn: async ({ hourlyRate, overtimeMultiplier }: { hourlyRate: number; overtimeMultiplier: number }) => {
      if (!employeePayData?.mapping?.id) {
        throw new Error('Employee mapping not found');
      }
      
      const { error } = await supabase
        .from('employee_pay_rates')
        .upsert({
          employee_mapping_id: employeePayData.mapping.id,
          hourly_rate: hourlyRate,
          overtime_multiplier: overtimeMultiplier,
          effective_from: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'employee_mapping_id,effective_from'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pay rate saved successfully');
      queryClient.invalidateQueries({ queryKey: ['employee-pay-rate', contact?.email] });
    },
    onError: (error) => {
      toast.error('Failed to save pay rate');
      console.error(error);
    }
  });

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setIsFavorite(contact.isFavorite || false);
      setRating(contact.rating || 0);
      setFormData({
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
        cell: contact.cell || '',
        role: contact.role || '',
        address: contact.address || '',
        city: contact.city || '',
        state: contact.state || '',
        zip: contact.zip || '',
      });
      setIsEditing(false);
    }
  }, [contact]);

  useEffect(() => {
    if (employeePayData?.payRate) {
      setHourlyRateInput(employeePayData.payRate.hourly_rate?.toString() || '');
      setOvertimeMultiplierInput(employeePayData.payRate.overtime_multiplier?.toString() || '1.5');
    }
  }, [employeePayData?.payRate]);

  if (!contact) return null;

  const handleSavePayRate = () => {
    const rate = parseFloat(hourlyRateInput);
    const multiplier = parseFloat(overtimeMultiplierInput);
    if (isNaN(rate) || rate < 0) {
      toast.error('Please enter a valid hourly rate');
      return;
    }
    savePayRate.mutate({ hourlyRate: rate, overtimeMultiplier: multiplier || 1.5 });
  };

  const handleFavoriteChange = (checked: boolean) => {
    setIsFavorite(checked);
    updateContact.mutate({ id: contact.id, is_favorite: checked });
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    updateContact.mutate({ id: contact.id, rating: newRating });
  };

  const handleInputChange = (field: keyof EditableContactData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = () => {
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    updateContact.mutate({
      id: contact.id,
      company: formData.company || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      cell: formData.cell || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zip: formData.zip || undefined,
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleCancelEdit = () => {
    // Reset form data to original contact values
    setFormData({
      company: contact.company || '',
      email: contact.email || '',
      phone: contact.phone || '',
      cell: contact.cell || '',
      role: contact.role || '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      zip: contact.zip || '',
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const menuItems = getMenuItemsForType(contact.type);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'employees': return 'Employee';
      case 'contractors': return 'Contractor';
      case 'customers': return 'Customer';
      case 'vendors': return 'Vendor';
      case 'leads': return 'Lead';
      case 'miscellaneous': return 'Miscellaneous';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'employees': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'contractors': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'customers': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'vendors': return 'bg-primary/10 text-primary border-primary/20';
      case 'leads': return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'miscellaneous': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeBgGradient = (type: string) => {
    switch (type) {
      case 'employees': return 'from-emerald-600 to-emerald-800';
      case 'contractors': return 'from-amber-600 to-amber-800';
      case 'customers': return 'from-sky-600 to-sky-800';
      case 'vendors': return 'from-primary to-primary/80';
      case 'leads': return 'from-violet-600 to-violet-800';
      case 'miscellaneous': return 'from-slate-600 to-slate-800';
      default: return 'from-slate-600 to-slate-800';
    }
  };

  // Sidebar content component
  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className={cn(
      "h-full flex flex-col bg-gradient-to-b",
      getTypeBgGradient(contact.type)
    )}>
      {/* Avatar Section */}
      <div className="flex flex-col items-center py-6 px-4 relative">
        <div className="absolute top-2 right-2 md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="relative">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-white/20 shadow-xl">
            <AvatarImage src={contact.avatar_url} alt={contact.name} />
            <AvatarFallback className="text-xl md:text-2xl font-bold bg-white/20 text-white">
              {getInitials(contact.name || 'UN')}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-white shadow-lg" />
        </div>
        
        <h3 className="mt-3 text-lg font-semibold text-white text-center truncate max-w-full px-2">
          {contact.name}
        </h3>
        
        <Badge className="mt-1 bg-white/20 text-white border-0 hover:bg-white/30">
          {getTypeLabel(contact.type)}
        </Badge>
        
        {/* Star Rating */}
        <div className="flex gap-1 mt-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => handleRatingChange(star)}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            >
              <Star 
                className={cn(
                  "h-5 w-5 transition-colors",
                  star <= rating 
                    ? "text-amber-400 fill-amber-400 drop-shadow-glow" 
                    : "text-white/30 hover:text-amber-400/50"
                )}
              />
            </button>
          ))}
        </div>

        {/* Favorite Toggle */}
        <label className="flex items-center gap-2 mt-4 cursor-pointer group">
          <Checkbox 
            id="favorite"
            checked={isFavorite}
            onCheckedChange={handleFavoriteChange}
            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-slate-700 transition-all"
          />
          <span className="text-sm text-white/80 group-hover:text-white transition-colors">
            Favorite
          </span>
        </label>
      </div>

      {/* Navigation Menu */}
      <ScrollArea className="flex-1 px-2">
        <nav className="py-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  onItemClick?.();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
                  isActive 
                    ? 'bg-white text-slate-800 shadow-lg' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-slate-600" : "")} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );

  // Main content
  const MainContent = () => (
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-background border-b px-4 md:px-6 py-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden shrink-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-border shrink-0">
            <AvatarImage src={contact.avatar_url} alt={contact.name} />
            <AvatarFallback className={cn('text-sm font-bold', getTypeColor(contact.type))}>
              {getInitials(contact.name || 'UN')}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("shrink-0 text-xs", getTypeColor(contact.type))}>
                {getTypeLabel(contact.type)}
              </Badge>
              <h2 className="text-base md:text-lg font-semibold truncate">{contact.company || contact.name}</h2>
            </div>
            {contact.email && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">{contact.email}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {contact.email && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                <Mail className="h-4 w-4" />
              </Button>
            )}
            {contact.phone && (
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
                <Phone className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {activeSection === 'details' && (
            <div className="space-y-4 md:space-y-6">
              {/* Edit Mode Toggle */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSaveDetails}
                      disabled={updateContact.isPending}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {updateContact.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Contact Info Card */}
                <DetailCard 
                  title="Contact Information" 
                  icon={<Info className="h-4 w-4" />}
                  iconBg="bg-primary/10 text-primary"
                >
                  <EditableField 
                    icon={<Building2 />} 
                    label="Company" 
                    value={formData.company}
                    isEditing={isEditing}
                    onChange={(val) => handleInputChange('company', val)}
                    placeholder="Enter company name"
                  />
                  <EditableField 
                    icon={<Mail />} 
                    label="Email" 
                    value={formData.email}
                    isEditing={isEditing}
                    onChange={(val) => handleInputChange('email', val)}
                    placeholder="email@example.com"
                    type="email"
                    copyable
                  />
                  <EditableField 
                    icon={<Phone />} 
                    label="Phone" 
                    value={formData.phone}
                    isEditing={isEditing}
                    onChange={(val) => handleInputChange('phone', val)}
                    placeholder="(555) 123-4567"
                    type="tel"
                    copyable
                  />
                  <EditableField 
                    icon={<Phone />} 
                    label="Cell" 
                    value={formData.cell}
                    isEditing={isEditing}
                    onChange={(val) => handleInputChange('cell', val)}
                    placeholder="(555) 123-4567"
                    type="tel"
                    copyable
                  />
                </DetailCard>

                {/* Pay Rate Section - Only for employees */}
                {contact.type === 'employees' && (
                  <DetailCard 
                    title="Compensation" 
                    icon={<DollarSign className="h-4 w-4" />}
                    iconBg="bg-emerald-500/10 text-emerald-600"
                  >
                    {!employeePayData?.mapping ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No employee mapping found. Create mapping in Pay Rates settings.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Hourly Rate</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={hourlyRateInput}
                                onChange={(e) => setHourlyRateInput(e.target.value)}
                                className="pl-7 h-10"
                                placeholder="25.00"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">OT Multiplier</label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                step="0.1"
                                value={overtimeMultiplierInput}
                                onChange={(e) => setOvertimeMultiplierInput(e.target.value)}
                                className="pr-7 h-10"
                                placeholder="1.5"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">x</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleSavePayRate}
                          disabled={savePayRate.isPending}
                          className="w-full"
                          size="sm"
                        >
                          {savePayRate.isPending ? 'Saving...' : 'Save Pay Rate'}
                        </Button>
                        
                        {employeePayData?.payRate && (
                          <p className="text-xs text-muted-foreground text-center">
                            Current: ${employeePayData.payRate.hourly_rate}/hr • 
                            Since {new Date(employeePayData.payRate.effective_from).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </DetailCard>
                )}

                {/* Address Section */}
                <DetailCard 
                  title="Address" 
                  icon={<MapPin className="h-4 w-4" />}
                  iconBg="bg-rose-500/10 text-rose-600"
                >
                  <EditableField 
                    icon={<MapPin />} 
                    label="Street Address" 
                    value={formData.address}
                    isEditing={isEditing}
                    onChange={(val) => handleInputChange('address', val)}
                    placeholder="123 Main Street"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3 sm:col-span-1">
                      <EditableField 
                        icon={<Building2 />} 
                        label="City" 
                        value={formData.city}
                        isEditing={isEditing}
                        onChange={(val) => handleInputChange('city', val)}
                        placeholder="City"
                        compact
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <EditableField 
                        icon={<MapPin />} 
                        label="State" 
                        value={formData.state}
                        isEditing={isEditing}
                        onChange={(val) => handleInputChange('state', val)}
                        placeholder="State"
                        compact
                      />
                    </div>
                    <div className="col-span-1">
                      <EditableField 
                        icon={<Hash />} 
                        label="ZIP" 
                        value={formData.zip}
                        isEditing={isEditing}
                        onChange={(val) => handleInputChange('zip', val)}
                        placeholder="ZIP"
                        compact
                      />
                    </div>
                  </div>
                  {formData.address && !isEditing && (
                    <div className="bg-muted rounded-xl h-32 flex items-center justify-center mt-3">
                      <div className="text-center text-muted-foreground">
                        <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Map Preview</p>
                      </div>
                    </div>
                  )}
                </DetailCard>

                {/* Additional Details */}
                <DetailCard 
                  title="Additional Details" 
                  icon={<FileText className="h-4 w-4" />}
                  iconBg="bg-sky-500/10 text-sky-600"
                >
                  <EditableField 
                    icon={<Hash />} 
                    label="Access Code" 
                    value=""
                    isEditing={isEditing}
                    onChange={() => {}}
                    placeholder="Not set"
                  />
                  <EditableField 
                    icon={<CreditCard />} 
                    label="Payment Terms" 
                    value=""
                    isEditing={isEditing}
                    onChange={() => {}}
                    placeholder="Not set"
                  />
                  <EditableField 
                    icon={<Globe />} 
                    label="Website" 
                    value=""
                    isEditing={isEditing}
                    onChange={() => {}}
                    placeholder="https://example.com"
                  />
                  <EditableField 
                    icon={<Tag />} 
                    label="Tags" 
                    value=""
                    isEditing={isEditing}
                    onChange={() => {}}
                    placeholder="No tags"
                  />
                </DetailCard>
              </div>
            </div>
          )}

          {activeSection === 'documents' && <DocumentsSection contactId={contact.id} />}
          {activeSection === 'licenses' && <LicensesSection />}
          {activeSection === 'insurance' && <InsuranceSection />}
          {activeSection === 'files' && <FilesSection contactId={contact.id} />}
          {activeSection === 'notes' && <NotesSection contactId={contact.id} />}
          {activeSection === 'training' && <TrainingSection contactId={contact.id} />}

          {!['details', 'documents', 'licenses', 'insurance', 'files', 'notes', 'training'].includes(activeSection) && (
            <div className="bg-muted/50 rounded-2xl p-8 md:p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {menuItems.find(m => m.id === activeSection)?.label}
              </h3>
              <p className="text-muted-foreground text-sm">This section is coming soon.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {/* Desktop Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl">
          <div className="flex h-full">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-56 shrink-0">
              <SidebarContent />
            </div>
            <MainContent />
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-72" hideClose>
          <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

// Detail Card Component
interface DetailCardProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, icon, iconBg, children }) => (
  <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBg)}>
        {icon}
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
    <div className="p-4 space-y-3">
      {children}
    </div>
  </div>
);

// Editable Field Component
interface EditableFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'url';
  copyable?: boolean;
  compact?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ 
  icon, 
  label, 
  value, 
  isEditing, 
  onChange, 
  placeholder = '-',
  type = 'text',
  copyable,
  compact
}) => {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
      toast.success(`${label} copied to clipboard`);
    }
  };

  if (compact) {
    return (
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        {isEditing ? (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-9"
          />
        ) : (
          <p className={cn(
            "text-sm",
            value ? "text-foreground" : "text-muted-foreground/50"
          )}>
            {value || placeholder}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'h-4 w-4 text-muted-foreground' })}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isEditing ? (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 mt-0.5"
          />
        ) : (
          <p className={cn(
            "text-sm truncate",
            value ? "text-foreground" : "text-muted-foreground/50"
          )}>
            {value || placeholder}
          </p>
        )}
      </div>
      {!isEditing && copyable && value && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={handleCopy}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" />
          </svg>
        </Button>
      )}
    </div>
  );
};

export default ContactDetailDialog;
