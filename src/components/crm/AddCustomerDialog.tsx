import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AddCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface NewLead {
  name: string
  email: string
  phone: string
  company_name: string
  status: string
  source: string
  project_type: string
  timeline: string
  budget_range: string
  notes: string
}

export const AddCustomerDialog = ({ open, onOpenChange, onSuccess }: AddCustomerDialogProps) => {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [newLead, setNewLead] = useState<NewLead>({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    status: 'new',
    source: '',
    project_type: '',
    timeline: '',
    budget_range: '',
    notes: ''
  })

  const handleCreateLead = async () => {
    if (!newLead.name?.trim() || !newLead.email?.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Name and email are required.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsCreating(true)
      const payload = {
        name: newLead.name.trim(),
        email: newLead.email.trim(),
        phone: newLead.phone || null,
        company_name: newLead.company_name || null,
        status: newLead.status || 'new',
        source: newLead.source || null,
        project_type: newLead.project_type || null,
        timeline: newLead.timeline || null,
        budget_range: newLead.budget_range || null,
        notes: newLead.notes || null,
      }

      const { error } = await supabase.from('leads').insert([payload])
      if (error) throw error

      toast({ 
        title: 'Customer added', 
        description: `${payload.name} was added to the workflow.`
      })

      // Reset form
      setNewLead({
        name: '',
        email: '',
        phone: '',
        company_name: '',
        status: 'new',
        source: '',
        project_type: '',
        timeline: '',
        budget_range: '',
        notes: '',
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating lead:', error)
      toast({ 
        title: 'Error', 
        description: 'Failed to create customer', 
        variant: 'destructive' 
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to the workflow. This will automatically create their progress tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input
              id="company"
              value={newLead.company_name}
              onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
              placeholder="Enter company name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
              <SelectTrigger>
                <SelectValue placeholder="How did they find us?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google_search">Google Search</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="referrals">Referrals</SelectItem>
                <SelectItem value="federal_invitations">Federal Invitations</SelectItem>
                <SelectItem value="personal_contacts">Personal Contacts</SelectItem>
                <SelectItem value="ai_agent">AI Agent</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_type">Service Needed</Label>
            <Select value={newLead.project_type} onValueChange={(value) => setNewLead({ ...newLead, project_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential-installation">Residential Installation</SelectItem>
                <SelectItem value="commercial-roofing">Commercial Roofing</SelectItem>
                <SelectItem value="roof-repair">Roof Repair</SelectItem>
                <SelectItem value="roof-inspection">Roof Inspection</SelectItem>
                <SelectItem value="storm-damage">Storm Damage Repair</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="consultation">Consultation Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Project Timeline</Label>
            <Select value={newLead.timeline} onValueChange={(value) => setNewLead({ ...newLead, timeline: value })}>
              <SelectTrigger>
                <SelectValue placeholder="When do they need service?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asap">ASAP</SelectItem>
                <SelectItem value="within-month">Within a month</SelectItem>
                <SelectItem value="1-3-months">1-3 months</SelectItem>
                <SelectItem value="3-6-months">3-6 months</SelectItem>
                <SelectItem value="6-months-plus">6+ months</SelectItem>
                <SelectItem value="just-exploring">Just exploring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range</Label>
            <Select value={newLead.budget_range} onValueChange={(value) => setNewLead({ ...newLead, budget_range: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Estimated budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-5k">Under $5,000</SelectItem>
                <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                <SelectItem value="10k-20k">$10,000 - $20,000</SelectItem>
                <SelectItem value="20k-50k">$20,000 - $50,000</SelectItem>
                <SelectItem value="50k-plus">$50,000+</SelectItem>
                <SelectItem value="not-sure">Not sure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Project Details / Notes</Label>
          <Textarea
            id="notes"
            value={newLead.notes}
            onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
            placeholder="Any additional details about the project or customer..."
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateLead} 
            disabled={isCreating}
          >
            {isCreating ? 'Adding...' : 'Add Customer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}