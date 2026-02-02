import { Bill, useBillFiles } from '@/hooks/useBills';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, FileText, File } from 'lucide-react';

interface BillFilesTabProps {
  bill: Bill;
}

export function BillFilesTab({ bill }: BillFilesTabProps) {
  const { data: files = [], isLoading } = useBillFiles(bill.id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getFileIcon = (fileType: string | null) => {
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('image')) return '🖼️';
    return '📎';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Files
        </h4>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Add File Button */}
        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors min-h-[120px]">
          <Plus className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Add File</span>
        </div>

        {/* Existing Files */}
        {files.map((file) => (
          <div 
            key={file.id} 
            className="border rounded-lg p-4 flex flex-col items-center gap-2 hover:bg-muted/50 cursor-pointer transition-colors min-h-[120px]"
          >
            <div className="text-4xl">{getFileIcon(file.file_type)}</div>
            <span className="text-xs text-center truncate w-full">{file.file_name}</span>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}
