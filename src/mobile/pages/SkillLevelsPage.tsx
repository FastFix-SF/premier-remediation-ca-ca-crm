import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Search, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEmployeesWithEvaluations } from '@/hooks/useSkillEvaluations';
import { SkillLevelCard } from '@/mobile/components/skills/SkillLevelCard';
import { SkillEvaluationSheet } from '@/mobile/components/skills/SkillEvaluationSheet';
import { SkillLevelGuide } from '@/mobile/components/skills/SkillLevelGuide';
import { EmployeeWithEvaluation } from '@/hooks/useSkillEvaluations';

export function SkillLevelsPage() {
  const navigate = useNavigate();
  const { data: employees, isLoading } = useEmployeesWithEvaluations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithEvaluation | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const filteredEmployees = (employees || []).filter(emp =>
    emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const evaluatedCount = (employees || []).filter(e => e.current_level).length;
  const totalCount = (employees || []).length;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Niveles de Habilidad</h1>
            <p className="text-xs text-muted-foreground">
              {evaluatedCount} de {totalCount} evaluados
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowGuide(true)}>
            <BookOpen className="h-4 w-4 mr-1" />
            Guía
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar trabajadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No se encontraron trabajadores' : 'No hay trabajadores para evaluar'}
            </p>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <SkillLevelCard
              key={employee.user_id}
              employee={employee}
              onEvaluate={() => setSelectedEmployee(employee)}
            />
          ))
        )}
      </div>

      {/* Evaluation Sheet */}
      <SkillEvaluationSheet
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />

      {/* Skill Guide Sheet */}
      <SkillLevelGuide
        open={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}

export default SkillLevelsPage;
