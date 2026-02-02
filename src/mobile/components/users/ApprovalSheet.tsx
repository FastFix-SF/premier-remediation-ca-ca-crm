import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface ApprovalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (role: string, isAdmin: boolean) => Promise<void>;
  userName: string;
}

export const ApprovalSheet: React.FC<ApprovalSheetProps> = ({
  isOpen,
  onClose,
  onApprove,
  userName,
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('contributor');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(selectedRole, isAdmin);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="text-left mb-6">
          <SheetTitle className="text-xl">Approve User</SheetTitle>
          <SheetDescription>
            Set permissions for {userName}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="role" className="h-12">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="leader">Leader</SelectItem>
                <SelectItem value="contributor">Contributor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Access Checkbox */}
          <div className="flex items-center space-x-2 border rounded-lg p-4">
            <Checkbox
              id="admin-access"
              checked={isAdmin}
              onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
            />
            <div className="flex flex-col">
              <Label htmlFor="admin-access" className="text-base font-medium cursor-pointer">
                Admin Access
              </Label>
              <p className="text-sm text-muted-foreground">
                Can access admin panel and manage users
              </p>
            </div>
          </div>

          {/* Approve Button */}
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? 'Approving...' : 'Approve User'}
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
