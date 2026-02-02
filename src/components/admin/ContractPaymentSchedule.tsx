import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2, Lock, LockOpen } from 'lucide-react';
import { validateMilestones, recalculateMilestones, formatCurrency, type MilestonePayment } from '@/utils/contractHelpers';

interface ContractPaymentScheduleProps {
  contractPrice: number;
  milestones: MilestonePayment[];
  onMilestonesChange: (milestones: MilestonePayment[]) => void;
}

export const ContractPaymentSchedule: React.FC<ContractPaymentScheduleProps> = ({
  contractPrice,
  milestones,
  onMilestonesChange,
}) => {
  const [isFinalLocked, setIsFinalLocked] = useState(true);

  const handlePercentChange = (id: string, newPercent: number) => {
    const newAmount = (contractPrice * newPercent) / 100;
    const updated = milestones.map(m =>
      m.id === id ? { ...m, percent: newPercent, amount: Number(newAmount.toFixed(2)) } : m
    );
    onMilestonesChange(recalculateMilestones(updated, contractPrice, isFinalLocked));
  };

  const handleAmountChange = (id: string, newAmount: number) => {
    const newPercent = contractPrice > 0 ? (newAmount / contractPrice) * 100 : 0;
    const updated = milestones.map(m =>
      m.id === id ? { ...m, amount: newAmount, percent: Number(newPercent.toFixed(2)) } : m
    );
    onMilestonesChange(recalculateMilestones(updated, contractPrice, isFinalLocked));
  };

  const handleLabelChange = (id: string, newLabel: string) => {
    const updated = milestones.map(m =>
      m.id === id ? { ...m, label: newLabel } : m
    );
    onMilestonesChange(updated);
  };

  const handleTimingChange = (id: string, newTiming: string) => {
    const updated = milestones.map(m =>
      m.id === id ? { ...m, timing: newTiming } : m
    );
    onMilestonesChange(updated);
  };

  const addMilestone = () => {
    const newMilestone: MilestonePayment = {
      id: `milestone-${Date.now()}`,
      label: 'Custom Milestone',
      percent: 0,
      amount: 0,
      timing: 'Upon milestone completion',
      isEditable: true,
    };
    
    // Insert before final payment
    const finalIndex = milestones.findIndex(m => m.isFinal);
    const updated = [...milestones];
    if (finalIndex >= 0) {
      updated.splice(finalIndex, 0, newMilestone);
    } else {
      updated.push(newMilestone);
    }
    
    onMilestonesChange(recalculateMilestones(updated, contractPrice, isFinalLocked));
  };

  const removeMilestone = (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    onMilestonesChange(recalculateMilestones(updated, contractPrice, isFinalLocked));
  };

  const toggleFinalLock = () => {
    setIsFinalLocked(!isFinalLocked);
  };

  const validation = validateMilestones(milestones, contractPrice);
  const totalAllocated = milestones.reduce((sum, m) => sum + m.amount, 0);
  const remaining = contractPrice - totalAllocated;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Schedule</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Edit amounts or percentages for each milestone. Per CSLB: Deposit cannot exceed $1,000 or 10%, whichever is less.
        </p>
      </div>

      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validation.errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-[1fr,100px,120px,120px,auto] gap-4 p-4 bg-muted/50 rounded-lg text-sm font-medium">
        <div>Milestone</div>
        <div className="text-right">Percent</div>
        <div className="text-right">Amount</div>
        <div>Timing</div>
        <div className="w-10"></div>
      </div>

      {milestones.map((milestone) => {
        const isEditable = milestone.isEditable !== false && !milestone.isDeposit;
        const isFinal = milestone.isFinal;
        const canEdit = isFinal ? !isFinalLocked : isEditable;

        return (
          <div 
            key={milestone.id} 
            className={`grid grid-cols-[1fr,100px,120px,120px,auto] gap-4 p-4 border rounded-lg ${
              isFinal ? 'bg-primary/5' : ''
            }`}
          >
            <div className="space-y-1">
              {isEditable ? (
                <Input
                  value={milestone.label}
                  onChange={(e) => handleLabelChange(milestone.id, e.target.value)}
                  className="font-medium"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{milestone.label}</span>
                  {isFinal && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleFinalLock}
                      className="h-6 w-6 p-0"
                    >
                      {isFinalLocked ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <LockOpen className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              )}
              {isEditable ? (
                <Input
                  value={milestone.timing}
                  onChange={(e) => handleTimingChange(milestone.id, e.target.value)}
                  className="text-xs"
                  placeholder="When is this due?"
                />
              ) : (
                <div className="text-xs text-muted-foreground">{milestone.timing}</div>
              )}
            </div>

            <div className="flex items-center">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={milestone.percent}
                onChange={(e) => handlePercentChange(milestone.id, Number(e.target.value))}
                disabled={!canEdit}
                className="text-right"
              />
            </div>

            <div className="flex items-center">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={milestone.amount}
                onChange={(e) => handleAmountChange(milestone.id, Number(e.target.value))}
                disabled={!canEdit}
                className={`text-right ${milestone.amount < 0 ? 'text-destructive' : ''}`}
              />
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              {milestone.timing && !isEditable ? milestone.timing : ''}
            </div>

            <div className="flex items-center justify-center">
              {isEditable && !milestone.isDeposit && !milestone.isFinal && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMilestone(milestone.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMilestone}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Milestone
      </Button>

      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
        <div className="flex gap-8">
          <div>
            <div className="text-sm text-muted-foreground">Contract Price</div>
            <div className="font-bold text-lg">{formatCurrency(contractPrice)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Allocated</div>
            <div className="font-bold text-lg">{formatCurrency(totalAllocated)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Remaining</div>
            <div className={`font-bold text-lg ${Math.abs(remaining) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
              {formatCurrency(remaining)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};