import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useSkillLevels, useCurrentEvaluation, useSubmitEvaluation, EmployeeWithEvaluation, Competency } from '@/hooks/useSkillEvaluations';
import { cn } from '@/lib/utils';

interface SkillEvaluationSheetProps {
  employee: EmployeeWithEvaluation | null;
  onClose: () => void;
}

export function SkillEvaluationSheet({ employee, onClose }: SkillEvaluationSheetProps) {
  const { data: skillLevels } = useSkillLevels();
  const { data: currentEvaluation } = useCurrentEvaluation(employee?.user_id || '');
  const submitEvaluation = useSubmitEvaluation();
  
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [competencyScores, setCompetencyScores] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  // Reset form when employee changes
  useEffect(() => {
    if (employee && currentEvaluation) {
      setSelectedLevel(currentEvaluation.assigned_level);
      setCompetencyScores(currentEvaluation.competency_scores as Record<string, boolean> || {});
      setNotes(currentEvaluation.evaluation_notes || '');
    } else if (employee) {
      setSelectedLevel(employee.current_level || 1);
      setCompetencyScores({});
      setNotes('');
    }
  }, [employee, currentEvaluation]);

  const handleSubmit = async () => {
    if (!employee) return;
    
    await submitEvaluation.mutateAsync({
      employeeId: employee.user_id,
      level: selectedLevel,
      competencyScores,
      notes: notes || undefined
    });
    
    onClose();
  };

  const selectedLevelData = skillLevels?.find(l => l.level === selectedLevel);
  const competencies = selectedLevelData?.competencies || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getLevelStyles = (level: number, isSelected: boolean) => {
    const baseStyles = 'flex-1 p-3 rounded-lg border-2 transition-all text-center';
    
    if (isSelected) {
      switch (level) {
        case 1: return `${baseStyles} border-gray-500 bg-gray-100`;
        case 2: return `${baseStyles} border-green-500 bg-green-100`;
        case 3: return `${baseStyles} border-blue-500 bg-blue-100`;
        case 4: return `${baseStyles} border-amber-500 bg-amber-100`;
        default: return baseStyles;
      }
    }
    
    return `${baseStyles} border-border hover:border-muted-foreground/50`;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'must_do': return 'Debe Poder Hacer';
      case 'must_know': return 'Debe Saber Cómo';
      case 'may_assist': return 'Puede Ayudar Con';
      case 'metal_basic': return 'Techos de Metal (Básico)';
      case 'metal_advanced': return 'Techos de Metal (Avanzado)';
      case 'can_do': return 'Puede Hacer';
      case 'responsible_for': return 'Responsable De';
      default: return category;
    }
  };

  const groupedCompetencies = competencies.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, Competency[]>);

  const checkedCount = Object.values(competencyScores).filter(Boolean).length;
  const totalCount = competencies.length;

  return (
    <Sheet open={!!employee} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            {employee && (
              <Avatar className="h-10 w-10">
                {employee.avatar_url && (
                  <AvatarImage src={employee.avatar_url} alt={employee.full_name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(employee.full_name)}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              <SheetTitle className="text-left">{employee?.full_name}</SheetTitle>
              <p className="text-sm text-muted-foreground">Evaluación de Habilidades</p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Level Selection */}
            <div>
              <h3 className="font-medium mb-3">Seleccionar Nivel</h3>
              <div className="grid grid-cols-2 gap-2">
                {skillLevels?.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => setSelectedLevel(level.level)}
                    className={getLevelStyles(level.level, selectedLevel === level.level)}
                  >
                    <div className="font-semibold">Nv.{level.level}</div>
                    <div className="text-xs text-muted-foreground">{level.short_name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Level Description */}
            {selectedLevelData && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline"
                    style={{ 
                      backgroundColor: `${selectedLevelData.color}20`,
                      borderColor: selectedLevelData.color,
                      color: selectedLevelData.color
                    }}
                  >
                    Nivel {selectedLevelData.level}
                  </Badge>
                  <span className="font-medium">{selectedLevelData.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedLevelData.description}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className={cn(
                    'flex items-center gap-1',
                    selectedLevelData.can_work_alone ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    {selectedLevelData.can_work_alone ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    Trabajo Solo
                  </span>
                  <span className={cn(
                    'flex items-center gap-1',
                    selectedLevelData.can_lead_crew ? 'text-green-600' : 'text-muted-foreground'
                  )}>
                    {selectedLevelData.can_lead_crew ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    Liderar Cuadrilla
                  </span>
                </div>
              </div>
            )}

            {/* Competencies Checklist */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Competencias</h3>
                <span className="text-sm text-muted-foreground">
                  {checkedCount} / {totalCount} marcados
                </span>
              </div>
              
              <div className="space-y-4">
                {Object.entries(groupedCompetencies).map(([category, comps]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {getCategoryLabel(category)}
                    </h4>
                    <div className="space-y-2">
                      {comps.map((comp) => (
                        <label
                          key={comp.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                        >
                          <Checkbox
                            checked={competencyScores[comp.id] || false}
                            onCheckedChange={(checked) => 
                              setCompetencyScores(prev => ({
                                ...prev,
                                [comp.id]: checked === true
                              }))
                            }
                          />
                          <span className="text-sm">{comp.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="font-medium mb-2">Notas (Opcional)</h3>
              <Textarea
                placeholder="Agregar notas de evaluación..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={submitEvaluation.isPending}
          >
            {submitEvaluation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Evaluación'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
