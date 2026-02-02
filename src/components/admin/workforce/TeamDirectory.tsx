import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Search, Filter, X, Check, ChevronDown, Star, Phone, MapPin, MoreVertical, Building2, Mail, UserCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useDirectoryContacts, DirectoryContact } from '@/hooks/useDirectoryContacts';
import ContactDetailDialog from './ContactDetailDialog';

const categories = [
  { value: 'contractors', label: 'Contractors' },
  { value: 'customers', label: 'Customers' },
  { value: 'employees', label: 'Employees' },
  { value: 'leads', label: 'Leads' },
  { value: 'misc-contacts', label: 'Misc. Contacts' },
  { value: 'vendors', label: 'Vendors' },
];

export interface DirectoryEntry {
  id: string;
  type: 'vendors' | 'employees' | 'contractors' | 'customers' | 'leads' | 'miscellaneous';
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  cell?: string;
  address?: string;
  role?: string;
  avatar_url?: string;
  isFavorite?: boolean;
  rating?: number;
}

const TeamDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<DirectoryEntry | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  
  const { data: teamMembers, isLoading: isLoadingEmployees } = useTeamMembers();
  const { data: directoryContacts = [], isLoading: isLoadingContacts } = useDirectoryContacts();

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const removeCategory = (value: string) => {
    setSelectedCategories(prev => prev.filter(v => v !== value));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const activeFiltersCount = selectedCategories.length;

  // Convert employees to directory entries
  const employeeEntries: DirectoryEntry[] = useMemo(() => {
    return (teamMembers || []).map((member): DirectoryEntry => {
      // Check if email is a placeholder (phone-user-*@placeholder.local)
      const isPlaceholderEmail = member.email?.includes('@placeholder.local');
      const displayEmail = isPlaceholderEmail ? undefined : member.email;
      
      return {
        id: member.user_id,
        type: 'employees',
        name: member.full_name || (displayEmail ? displayEmail.split('@')[0] : 'Team Member'),
        email: displayEmail,
        phone: member.phone_number || undefined,
        role: member.role,
        avatar_url: member.avatar_url || undefined,
      };
    });
  }, [teamMembers]);

  // Convert directory_contacts to directory entries
  const vendorEntries: DirectoryEntry[] = useMemo(() => {
    return directoryContacts
      .filter(c => c.contact_type === 'vendor')
      .map((contact): DirectoryEntry => ({
        id: contact.id,
        type: 'vendors',
        name: contact.contact_name || contact.company || 'Unknown',
        company: contact.company || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        cell: contact.cell || undefined,
        address: contact.address || undefined,
        isFavorite: contact.is_favorite,
      }));
  }, [directoryContacts]);

  const contractorEntries: DirectoryEntry[] = useMemo(() => {
    return directoryContacts
      .filter(c => c.contact_type === 'contractor')
      .map((contact): DirectoryEntry => ({
        id: contact.id,
        type: 'contractors',
        name: contact.contact_name || contact.company || 'Unknown',
        company: contact.company || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        cell: contact.cell || undefined,
        address: contact.address || undefined,
        isFavorite: contact.is_favorite,
      }));
  }, [directoryContacts]);

  const customerEntries: DirectoryEntry[] = useMemo(() => {
    return directoryContacts
      .filter(c => c.contact_type === 'customer')
      .map((contact): DirectoryEntry => ({
        id: contact.id,
        type: 'customers',
        name: contact.contact_name || contact.company || 'Unknown',
        company: contact.company || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        cell: contact.cell || undefined,
        address: contact.address || undefined,
        isFavorite: contact.is_favorite,
      }));
  }, [directoryContacts]);

  // Combined and filtered entries
  const filteredEntries = useMemo(() => {
    const allEntries: DirectoryEntry[] = [];
    
    if (selectedCategories.includes('employees') || selectedCategories.length === 0) {
      allEntries.push(...employeeEntries);
    }
    if (selectedCategories.includes('vendors') || selectedCategories.length === 0) {
      allEntries.push(...vendorEntries);
    }
    if (selectedCategories.includes('contractors') || selectedCategories.length === 0) {
      allEntries.push(...contractorEntries);
    }
    if (selectedCategories.includes('customers') || selectedCategories.length === 0) {
      allEntries.push(...customerEntries);
    }

    if (!searchQuery) return allEntries;

    const searchLower = searchQuery.toLowerCase();
    return allEntries.filter(entry => 
      entry.name?.toLowerCase().includes(searchLower) ||
      entry.company?.toLowerCase().includes(searchLower) ||
      entry.email?.toLowerCase().includes(searchLower) ||
      entry.phone?.includes(searchQuery) ||
      entry.cell?.includes(searchQuery) ||
      entry.address?.toLowerCase().includes(searchLower) ||
      entry.role?.toLowerCase().includes(searchLower)
    );
  }, [searchQuery, selectedCategories, employeeEntries, vendorEntries, contractorEntries, customerEntries]);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const employeeCount = filteredEntries.filter(e => e.type === 'employees').length;
  const vendorCount = filteredEntries.filter(e => e.type === 'vendors').length;
  const contractorCount = filteredEntries.filter(e => e.type === 'contractors').length;
  const customerCount = filteredEntries.filter(e => e.type === 'customers').length;

  const showEmployees = selectedCategories.includes('employees') || selectedCategories.length === 0;
  const showVendors = selectedCategories.includes('vendors') || selectedCategories.length === 0;
  const showContractors = selectedCategories.includes('contractors') || selectedCategories.length === 0;
  const showCustomers = selectedCategories.includes('customers') || selectedCategories.length === 0;
  const showOtherCategories = selectedCategories.some(c => !['employees', 'vendors', 'contractors', 'customers'].includes(c));
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/95">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Roofing Friend Directory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, phone, or address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Category Filter */}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-11 min-w-[140px] justify-between gap-2 border-border/50 bg-background/50 hover:bg-accent/50 transition-all',
                  activeFiltersCount > 0 && 'border-primary/50 bg-primary/5'
                )}
              >
                <div className="flex items-center gap-2 text-primary">
                  <div className="relative">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-scale-in">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  <span>Type</span>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 shadow-xl border-border/50 bg-popover" align="end">
              <Command className="bg-transparent">
                <CommandList>
                  <CommandEmpty>No category found.</CommandEmpty>
                  <CommandGroup>
                    {categories.map(category => {
                      const isSelected = selectedCategories.includes(category.value);
                      return (
                        <CommandItem
                          key={category.value}
                          onSelect={() => toggleCategory(category.value)}
                          className={cn(
                            'cursor-pointer flex items-center justify-between py-2.5 px-3 transition-colors',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <span className={cn('font-medium', isSelected && 'text-primary')}>
                            {category.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Clear All Button */}
          {(activeFiltersCount > 0 || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-11 px-3 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Selected Categories Tags */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {selectedCategories.map(value => {
              const category = categories.find(c => c.value === value);
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="pl-2.5 pr-1.5 py-1 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  {category?.label}
                  <button
                    onClick={() => removeCategory(value)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {(showEmployees || showVendors || showContractors || showCustomers) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {showEmployees && (
              <span className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                {isLoadingEmployees ? <Loader2 className="h-3 w-3 animate-spin" /> : employeeCount} employees
              </span>
            )}
            {showVendors && (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {isLoadingContacts ? <Loader2 className="h-3 w-3 animate-spin" /> : vendorCount} vendors
              </span>
            )}
            {showContractors && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isLoadingContacts ? <Loader2 className="h-3 w-3 animate-spin" /> : contractorCount} contractors
              </span>
            )}
            {showCustomers && (
              <span className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                {isLoadingContacts ? <Loader2 className="h-3 w-3 animate-spin" /> : customerCount} customers
              </span>
            )}
          </div>
        )}

        {/* Loading State */}
        {(isLoadingEmployees || isLoadingContacts) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Directory Table */}
        {!isLoadingEmployees && !isLoadingContacts && (showEmployees || showVendors || showContractors || showCustomers) && (
          <div className="rounded-xl border border-border/50 overflow-hidden bg-background/30 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30 border-border/50">
                    <TableHead className="w-[180px] font-semibold text-foreground py-2 px-3">Name</TableHead>
                    <TableHead className="w-[100px] font-semibold text-foreground py-2 px-2">Role</TableHead>
                    <TableHead className="w-[160px] font-semibold text-foreground py-2 px-2">Contact</TableHead>
                    <TableHead className="w-[110px] font-semibold text-foreground py-2 px-2">Phone</TableHead>
                    <TableHead className="w-[140px] font-semibold text-foreground py-2 px-2">Address</TableHead>
                    <TableHead className="w-[70px] font-semibold text-foreground py-2 px-2">Type</TableHead>
                    <TableHead className="w-[50px] py-2 px-2"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, index) => (
                    <TableRow
                      key={`${entry.type}-${entry.id}`}
                      className={cn(
                        'group transition-colors hover:bg-muted/40 border-border/30 cursor-pointer',
                        index % 2 === 0 && 'bg-muted/10'
                      )}
                      onClick={() => {
                        setSelectedContact(entry);
                        setContactDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7 border border-border/50 shrink-0">
                            <AvatarImage src={entry.avatar_url} alt={entry.name} />
                            <AvatarFallback className={cn(
                              'text-[10px] font-bold transition-all',
                              entry.type === 'employees' 
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                                : entry.type === 'contractors'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : entry.type === 'customers'
                                ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                                : 'bg-primary/10 text-primary border border-primary/20'
                            )}>
                              {getInitials(entry.name || 'UN')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[120px]">{entry.name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2 px-2 text-xs">
                        <span className="truncate block max-w-[90px]">{entry.type === 'employees' ? entry.role || '-' : entry.company || '-'}</span>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        {entry.email ? (
                          <a href={`mailto:${entry.email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[130px]">{entry.email}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        {entry.phone || entry.cell ? (
                          <a href={`tel:${entry.phone || entry.cell}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-xs">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[85px]">{entry.phone || entry.cell}</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        {entry.address ? (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[110px]">{entry.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'font-medium text-[10px] px-1.5 py-0',
                            entry.type === 'employees' 
                              ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' 
                              : entry.type === 'contractors'
                              ? 'bg-amber-500/5 text-amber-600 border-amber-500/20'
                              : entry.type === 'customers'
                              ? 'bg-sky-500/5 text-sky-600 border-sky-500/20'
                              : 'bg-primary/5 text-primary border-primary/20'
                          )}
                        >
                          {entry.type === 'employees' ? 'Emp' : entry.type === 'contractors' ? 'Cont' : entry.type === 'customers' ? 'Cust' : 'Vend'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 px-2">
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost"
                            size="icon" 
                            className={cn(
                              'h-8 w-8',
                              entry.isFavorite && 'opacity-100'
                            )}
                          >
                            <Star className={cn(
                              'h-4 w-4',
                              entry.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'
                            )} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State for other categories */}
        {showOtherCategories && !showEmployees && !showVendors && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No {selectedCategories.map(c => categories.find(cat => cat.value === c)?.label).join(', ')} yet</p>
            <p className="text-sm">This category is coming soon.</p>
          </div>
        )}

        {/* Contact Detail Dialog */}
        <ContactDetailDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          contact={selectedContact}
        />
      </CardContent>
    </Card>
  );
};

export default TeamDirectory;
