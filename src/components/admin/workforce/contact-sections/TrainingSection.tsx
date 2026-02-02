import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Award, Calendar, FileText } from 'lucide-react';
import AddCertificateDialog, { CertificateFormData } from './AddCertificateDialog';
import { toast } from 'sonner';

interface TrainingSectionProps {
  contactId: string;
}

const TrainingSection: React.FC<TrainingSectionProps> = ({ contactId }) => {
  const [isAddCertificateOpen, setIsAddCertificateOpen] = useState(false);
  const [certificates, setCertificates] = useState<CertificateFormData[]>([]);

  const handleAddCertificate = (data: CertificateFormData) => {
    setCertificates([...certificates, data]);
    toast.success('Certificate added successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Training & Certifications</h3>
        </div>
        <Button 
          onClick={() => setIsAddCertificateOpen(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </Button>
      </div>

      {/* Certificates List */}
      {certificates.length === 0 ? (
        <div className="bg-background rounded-lg border p-8 text-center">
          <div className="text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">No Certificates</h3>
            <p className="text-sm mb-4">Add training certificates and qualifications for this employee.</p>
            <Button 
              onClick={() => setIsAddCertificateOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Certificate
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {certificates.map((cert, index) => (
            <div key={index} className="bg-background rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{cert.subject}</h4>
                    <p className="text-sm text-muted-foreground">
                      Certificate #{cert.certificateNumber}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Issued: {cert.issuedDate || 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {cert.doesNotExpire ? 'Never Expires' : `Expires: ${cert.expiresDate || 'N/A'}`}
                      </span>
                    </div>
                    {cert.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{cert.notes}</p>
                    )}
                  </div>
                </div>
                {cert.files.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {cert.files.length} file{cert.files.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Certificate Dialog */}
      <AddCertificateDialog
        open={isAddCertificateOpen}
        onOpenChange={setIsAddCertificateOpen}
        onSubmit={handleAddCertificate}
      />
    </div>
  );
};

export default TrainingSection;
