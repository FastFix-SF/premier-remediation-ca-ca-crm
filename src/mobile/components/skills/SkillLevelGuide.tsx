import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useSkillLevels, Competency } from '@/hooks/useSkillEvaluations';
import { cn } from '@/lib/utils';

interface SkillLevelGuideProps {
  open: boolean;
  onClose: () => void;
}

export function SkillLevelGuide({ open, onClose }: SkillLevelGuideProps) {
  const { data: skillLevels } = useSkillLevels();

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

  const getCannotDo = (level: number) => {
    switch (level) {
      case 1:
        return ['Trabajar solo', 'Instalar sistemas de techo', 'Diagnosticar fugas', 'Tomar decisiones'];
      case 2:
        return ['Liderar cuadrilla', 'Diagnosticar fugas complejas', 'Cambiar diseño del sistema', 'Aprobar materiales'];
      case 3:
        return ['Cambiar horarios', 'Negociar con clientes', 'Aprobar trabajo extra'];
      default:
        return [];
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return '#9CA3AF';
      case 2: return '#22C55E';
      case 3: return '#3B82F6';
      case 4: return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle>Guía de Niveles de Habilidad</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Cada trabajador debe tener UN solo nivel, basado en habilidades — no en años o relaciones.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4">
            <Accordion type="single" collapsible className="space-y-2">
              {skillLevels?.map((level) => {
                const competencies = level.competencies || [];
                const groupedCompetencies = competencies.reduce((acc, comp) => {
                  if (!acc[comp.category]) acc[comp.category] = [];
                  acc[comp.category].push(comp);
                  return acc;
                }, {} as Record<string, Competency[]>);
                
                const cannotDo = getCannotDo(level.level);

                return (
                  <AccordionItem 
                    key={level.level} 
                    value={`level-${level.level}`}
                    className="border rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent">
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: getLevelColor(level.level) }}
                        >
                          {level.level}
                        </div>
                        <div>
                          <div className="font-medium">{level.name}</div>
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4 pt-2">
                        {/* Capabilities */}
                        <div className="flex gap-4 text-sm">
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded',
                            level.can_work_alone 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          )}>
                            {level.can_work_alone ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Trabajo Solo
                          </span>
                          <span className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded',
                            level.can_lead_crew 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          )}>
                            {level.can_lead_crew ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Liderar Cuadrilla
                          </span>
                        </div>

                        {/* Competencies by category */}
                        {Object.entries(groupedCompetencies).map(([category, comps]) => (
                          <div key={category}>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-600" />
                              {getCategoryLabel(category)}
                            </h4>
                            <ul className="space-y-1 pl-4">
                              {comps.map((comp) => (
                                <li key={comp.id} className="text-sm flex items-start gap-2">
                                  <span className="text-green-600 mt-1">•</span>
                                  {comp.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}

                        {/* Cannot do */}
                        {cannotDo.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <X className="h-3 w-3 text-red-600" />
                              No Puede
                            </h4>
                            <ul className="space-y-1 pl-4">
                              {cannotDo.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2 text-red-600">
                                  <span className="mt-1">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Special note for Level 4 */}
                        {level.level === 4 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-700 font-medium text-sm mb-1">
                              <AlertTriangle className="h-4 w-4" />
                              Regla de Responsabilidad
                            </div>
                            <p className="text-sm text-amber-600">
                              Si el trabajo falla → El Capataz es responsable
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            {/* Final Rules */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Reglas Finales</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  <span>Años ≠ habilidad</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">🏷️</span>
                  <span>Título ≠ nivel</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">💪</span>
                  <span>Solo importa la capacidad</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Esta clasificación determina: Pago, Responsabilidad, Promoción, Rendición de cuentas
              </p>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
