import React, { useState } from 'react';
import { Plus, Camera, MessageSquare, ImagePlus, FileUp, CheckSquare, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ProjectActionBarProps {
  onPlusClick: () => void;
  onCameraClick: () => void;
  onChatClick: () => void;
  onUploadPhotos?: () => void;
  onUploadVideo?: () => void;
  onUploadFile?: () => void;
  onCreateTask?: () => void;
  onCreateReport?: () => void;
}

export const ProjectActionBar: React.FC<ProjectActionBarProps> = ({
  onPlusClick,
  onCameraClick,
  onChatClick,
  onUploadPhotos,
  onUploadVideo,
  onUploadFile,
  onCreateTask,
  onCreateReport,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handlePlusClick = () => {
    setShowActions(true);
  };

  const actionItems = [
    { icon: ImagePlus, label: 'Upload Photos', onClick: onUploadPhotos },
    { icon: Video, label: 'Add Video', onClick: onUploadVideo },
    { icon: FileUp, label: 'Upload File', onClick: onUploadFile },
    { icon: CheckSquare, label: 'Create Task', onClick: onCreateTask },
    { icon: FileText, label: 'Create Report', onClick: onCreateReport },
  ];

  return (
    <>
      <div className="flex justify-center py-3">
        <div className="flex items-center gap-2 bg-primary rounded-full px-4 py-2 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePlusClick}
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Plus className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCameraClick}
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Camera className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onChatClick}
            className="h-12 w-12 rounded-full text-primary-foreground hover:bg-primary-foreground/20"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-2">
            {actionItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setShowActions(false);
                  item.onClick?.();
                }}
                className="flex items-center gap-4 w-full p-3 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-lg border border-border flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-base font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
