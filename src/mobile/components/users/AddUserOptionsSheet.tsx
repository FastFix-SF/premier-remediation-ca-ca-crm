import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface AddUserOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOption: (option: 'contacts' | 'new' | 'link') => void;
}

export const AddUserOptionsSheet = ({ isOpen, onClose, onSelectOption }: AddUserOptionsSheetProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle className="text-sm text-muted-foreground font-normal">
            Select how you would like to add users
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-8 space-y-2">
          <Button
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-transparent text-base font-normal"
            onClick={() => onSelectOption('new')}
          >
            Add new user
          </Button>
          
          <Button
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-transparent text-base font-normal"
            onClick={() => onSelectOption('link')}
          >
            Send users an invite link
          </Button>
          
          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
