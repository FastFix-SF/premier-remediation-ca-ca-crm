import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ClassCodeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentClassCode?: string;
  userId: string;
  onSave?: () => void;
}

const CLASS_CODES = [
  'Clerical',
  '5552 Roofing - Low Wage',
  '5553 Roofing - High Wage',
  '5538 Sheet Metal - Low Wage',
  '5542 Sheet Metal - High Wage',
  '5432 Carpentry - High Wage',
  '5474 Painting - Low Wage',
  '5482 Painting - High Wage',
];

export const ClassCodeSheet = ({ isOpen, onClose, currentClassCode, userId, onSave }: ClassCodeSheetProps) => {
  const { toast } = useToast();
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    currentClassCode ? [currentClassCode] : []
  );
  const [showEditItems, setShowEditItems] = useState(false);

  const handleToggleCode = (code: string) => {
    setSelectedCodes([code]);
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('team_directory')
        .update({ class_code: selectedCodes[0] })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast({
        title: 'Class code updated',
        description: 'User class code has been saved successfully',
      });
      onSave?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update class code',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="relative pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <SheetTitle className="text-center">Select Class Code</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-80px)]">
          <div className="flex-1 overflow-y-auto">
            {showEditItems ? (
              <div className="space-y-4 p-4">
                <h3 className="text-center font-semibold text-lg">Edit items</h3>
                <div className="space-y-3">
                  {CLASS_CODES.map((code) => (
                    <div
                      key={code}
                      className="p-4 text-base rounded-lg bg-muted/50"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  className="w-full text-blue-500 justify-start"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add another item
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4">
                {CLASS_CODES.map((code) => (
                  <div
                    key={code}
                    onClick={() => handleToggleCode(code)}
                    className={`p-4 text-base rounded-lg cursor-pointer transition-colors ${
                      selectedCodes.includes(code)
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {code}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-border">
            {showEditItems ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-full"
                  onClick={() => setShowEditItems(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 h-12 rounded-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleSave}
                >
                  Save items
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-full"
                  onClick={() => setShowEditItems(true)}
                >
                  Edit
                </Button>
                <Button
                  className="flex-1 h-12 rounded-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleSave}
                >
                  Done
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
