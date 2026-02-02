import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentType: string;
  baseAmount: number;
  onConfirm: (daysUntilDue: number) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  paymentType,
  baseAmount,
  onConfirm,
}: CreateInvoiceDialogProps) {
  const [daysUntilDue, setDaysUntilDue] = useState(15);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleConfirm = () => {
    onConfirm(daysUntilDue);
    onOpenChange(false);
  };

  // Calculate example interest for demonstration
  const dailyRate = 0.00058; // 0.058% per day
  const exampleDaysOverdue = 30;
  const exampleInterest = baseAmount * dailyRate * exampleDaysOverdue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invoice - {paymentType}</DialogTitle>
          <DialogDescription>
            Configure the invoice due date and review interest terms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Invoice Amount */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Invoice Amount</Label>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(baseAmount)}
            </div>
          </div>

          {/* Days Until Due */}
          <div className="space-y-2">
            <Label htmlFor="days-until-due" className="text-sm font-medium">
              Days Until Due Date
            </Label>
            <Input
              id="days-until-due"
              type="number"
              min="1"
              value={daysUntilDue}
              onChange={(e) => setDaysUntilDue(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Due date will be {daysUntilDue} days from today
            </p>
          </div>

          {/* Interest Information */}
          <div className="space-y-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-2">
              <div className="rounded-full bg-warning/20 p-1 mt-0.5">
                <svg
                  className="h-4 w-4 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Interest charges apply after {daysUntilDue} days
                </p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Daily Interest Rate: <span className="font-semibold text-warning">0.058%</span> per day</p>
                  <p>• Annual Interest Rate: <span className="font-semibold text-warning">21%</span> per annum</p>
                </div>
                <div className="mt-3 pt-3 border-t border-warning/20">
                  <p className="text-xs text-muted-foreground">
                    Example: If paid {exampleDaysOverdue} days late, interest would be approximately{" "}
                    <span className="font-semibold text-warning">
                      {formatCurrency(exampleInterest)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
