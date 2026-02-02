import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Camera } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import safetyWorkersImage from "@/assets/safety-workers.png";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SafetyChecklistModalProps {
  open: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const translations = {
  en: {
    title: "Safety Checklist",
    instruction: "Please confirm you have the following safety equipment:",
    hardHat: "🪖 Hard Hat",
    steelCapBoots: "🥾 Steel Cap Boots",
    safetyVest: "🦺 Safety Vest",
    protectiveGlasses: "🥽 Protective Glasses",
    additionalItems: "Additional Items (Optional)",
    additionalPlaceholder: "List any additional safety equipment...",
    next: "Next",
    selfieTitle: "Take a Selfie",
    selfieInstruction: "Please take a photo of yourself with your safety gear",
    noPhoto: "No photo taken yet",
    takePhoto: "Take Photo",
    retakePhoto: "Retake Photo",
    signatureTitle: "Sign Here",
    signatureInstruction: "Please sign to confirm you have read and understood the safety requirements",
    clearSignature: "Clear Signature",
    complete: "Complete & Clock In",
    equipmentRequired: "Safety Equipment Required",
    equipmentRequiredMessage: "You cannot start your job without all required safety equipment. Please check all items.",
  },
  es: {
    title: "Lista de Seguridad",
    instruction: "Por favor confirme que tiene el siguiente equipo de seguridad:",
    hardHat: "🪖 Casco",
    steelCapBoots: "🥾 Botas con Punta de Acero",
    safetyVest: "🦺 Chaleco de Seguridad",
    protectiveGlasses: "🥽 Gafas de Protección",
    additionalItems: "Artículos Adicionales (Opcional)",
    additionalPlaceholder: "Liste cualquier equipo de seguridad adicional...",
    next: "Siguiente",
    selfieTitle: "Tomar una Selfie",
    selfieInstruction: "Por favor tome una foto de usted con su equipo de seguridad",
    noPhoto: "Aún no se ha tomado ninguna foto",
    takePhoto: "Tomar Foto",
    retakePhoto: "Volver a Tomar Foto",
    signatureTitle: "Firme Aquí",
    signatureInstruction: "Por favor firme para confirmar que ha leído y comprendido los requisitos de seguridad",
    clearSignature: "Limpiar Firma",
    complete: "Completar y Fichar Entrada",
    equipmentRequired: "Equipo de Seguridad Requerido",
    equipmentRequiredMessage: "No puede comenzar su trabajo sin todo el equipo de seguridad requerido. Por favor marque todos los artículos.",
  }
};

export function SafetyChecklistModal({ open, onComplete, onCancel }: SafetyChecklistModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [language, setLanguage] = useState<'en' | 'es'>('en');
  const [checklist, setChecklist] = useState({
    hardHat: false,
    steelCapBoots: false,
    safetyVest: false,
    protectiveGlasses: false,
    additionalItems: "",
  });
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = translations[language];

  // Check if safety checklist was already completed (signed) in this session
  useEffect(() => {
    if (open) {
      const completed = localStorage.getItem('safety-checklist-completed');
      if (completed === 'true') {
        // Skip directly to project selection if already completed
        onComplete();
        return;
      }
    }
  }, [open, onComplete]);

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('safety-checklist-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        const savedStep = parsed.step || 1;
        const savedSelfiePreview = parsed.selfiePreview || null;
        
        // Validate: if at step 2 or 3 but no valid selfie, reset to step 1
        if (savedStep >= 2 && !savedSelfiePreview) {
          console.log('Invalid saved progress: missing selfie at step', savedStep, '- resetting to step 1');
          setStep(1);
          localStorage.removeItem('safety-checklist-progress');
          return;
        }
        
        setStep(savedStep);
        setLanguage(parsed.language || 'en');
        setChecklist(parsed.checklist || {
          hardHat: false,
          steelCapBoots: false,
          safetyVest: false,
          protectiveGlasses: false,
          additionalItems: "",
        });
        if (savedSelfiePreview) {
          setSelfiePreview(savedSelfiePreview);
        }
      } catch (e) {
        console.error('Failed to load safety checklist progress:', e);
        localStorage.removeItem('safety-checklist-progress');
      }
    }
  }, []);

  // Save progress whenever state changes
  useEffect(() => {
    if (open && !saving) {
      const progress = {
        step,
        language,
        checklist,
        selfiePreview,
      };
      localStorage.setItem('safety-checklist-progress', JSON.stringify(progress));
    }
  }, [step, language, checklist, selfiePreview, open, saving]);


  const handleChecklistNext = () => {
    const allChecked = checklist.hardHat && checklist.steelCapBoots && 
                       checklist.safetyVest && checklist.protectiveGlasses;
    if (allChecked) {
      setStep(2);
    } else {
      toast({
        title: t.equipmentRequired,
        description: t.equipmentRequiredMessage,
        variant: "destructive",
      });
    }
  };

  const handleSelfieCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfieNext = () => {
    if (selfiePreview) {
      setStep(3);
    }
  };

  const handleSignatureComplete = async () => {
    if (signatureRef.current && !signatureRef.current.isEmpty() && user) {
      setSaving(true);
      try {
        // Get signature as base64 (compressed)
        const signatureData = signatureRef.current.toDataURL('image/png', 0.5);
        
        // Compress selfie if needed
        let optimizedSelfie = selfiePreview;
        if (selfiePreview && selfiePreview.length > 100000) {
          // If selfie is large, create a compressed version
          const img = new Image();
          img.src = selfiePreview;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 800;
          const scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          optimizedSelfie = canvas.toDataURL('image/jpeg', 0.7);
        }
        
        // Save to database with timeout
        const savePromise = supabase
          .from('safety_checklist_responses')
          .insert({
            user_id: user.id,
            hard_hat: checklist.hardHat,
            steel_cap_boots: checklist.steelCapBoots,
            safety_vest: checklist.safetyVest,
            protective_glasses: checklist.protectiveGlasses,
            additional_items: checklist.additionalItems || null,
            selfie_url: optimizedSelfie,
            signature_data: signatureData,
          });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save timeout')), 10000)
        );

        const { error } = await Promise.race([savePromise, timeoutPromise]) as any;

        if (error) {
          console.error('Error saving safety checklist:', error);
          toast({
            title: "Error",
            description: "Failed to save safety checklist",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        // Clear saved progress and mark as completed
        localStorage.removeItem('safety-checklist-progress');
        localStorage.setItem('safety-checklist-completed', 'true');

        setSaving(false);
        onComplete();
      } catch (error) {
        console.error('Error saving safety checklist:', error);
        toast({
          title: "Error",
          description: error instanceof Error && error.message === 'Save timeout' 
            ? "Save operation timed out. Please try again."
            : "Failed to save safety checklist",
          variant: "destructive",
        });
        setSaving(false);
      }
    }
  };

  const isStep1Complete = checklist.hardHat && checklist.steelCapBoots && 
                          checklist.safetyVest && checklist.protectiveGlasses;
  const isStep2Complete = selfiePreview !== null;
  const isStep3Complete = signatureRef.current && !signatureRef.current.isEmpty();

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent className="w-[95vw] max-w-md p-0 gap-0">
        {step === 1 && (
          <div className="flex flex-col h-[80vh]">
            <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background">
              <img 
                src={safetyWorkersImage} 
                alt="Safety Workers" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <h2 className="text-2xl font-bold text-white">{t.title}</h2>
              </div>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground flex-1">
                  {t.instruction}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                  className="ml-2 shrink-0"
                >
                  {language === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
                </Button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox 
                    checked={checklist.hardHat}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, hardHat: checked as boolean }))
                    }
                  />
                  <span className="text-base">{t.hardHat}</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox 
                    checked={checklist.steelCapBoots}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, steelCapBoots: checked as boolean }))
                    }
                  />
                  <span className="text-base">{t.steelCapBoots}</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox 
                    checked={checklist.safetyVest}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, safetyVest: checked as boolean }))
                    }
                  />
                  <span className="text-base">{t.safetyVest}</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox 
                    checked={checklist.protectiveGlasses}
                    onCheckedChange={(checked) => 
                      setChecklist(prev => ({ ...prev, protectiveGlasses: checked as boolean }))
                    }
                  />
                  <span className="text-base">{t.protectiveGlasses}</span>
                </label>
              </div>

              <div className="pt-4">
                <label className="text-sm font-medium mb-2 block">
                  {t.additionalItems}
                </label>
                <Textarea 
                  value={checklist.additionalItems}
                  onChange={(e) => 
                    setChecklist(prev => ({ ...prev, additionalItems: e.target.value }))
                  }
                  placeholder={t.additionalPlaceholder}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="p-6 border-t">
              <Button 
                onClick={handleChecklistNext}
                className="w-full"
                size="lg"
              >
                {t.next}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-[80vh]">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">{t.selfieTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t.selfieInstruction}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden min-h-0">
              {selfiePreview ? (
                <img 
                  src={selfiePreview} 
                  alt="Selfie preview" 
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Camera className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{t.noPhoto}</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="p-6 border-t space-y-3">
              <Button 
                onClick={handleSelfieCapture}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {selfiePreview ? t.retakePhoto : t.takePhoto}
              </Button>
              <Button 
                onClick={handleSelfieNext}
                disabled={!isStep2Complete}
                className="w-full"
                size="lg"
              >
                {t.next}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col h-[80vh]">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">{t.signatureTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t.signatureInstruction}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg bg-muted/20">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: "w-full h-full cursor-crosshair",
                  }}
                  backgroundColor="transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t space-y-3">
              <Button 
                onClick={() => signatureRef.current?.clear()}
                variant="outline"
                className="w-full"
                size="lg"
              >
                {t.clearSignature}
              </Button>
              <Button 
                onClick={handleSignatureComplete}
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? 'Saving...' : t.complete}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
