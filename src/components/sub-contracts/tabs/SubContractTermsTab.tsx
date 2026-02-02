import { SubContract, useSubContractTerms, useUpdateSubContractTerms } from "@/hooks/useSubContracts";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

interface SubContractTermsTabProps {
  subContract: SubContract;
}

export function SubContractTermsTab({ subContract }: SubContractTermsTabProps) {
  const { data: terms } = useSubContractTerms(subContract.id);
  const updateTerms = useUpdateSubContractTerms();

  const [localTerms, setLocalTerms] = useState({
    default_terms: '',
    scope_of_work: '',
    inclusions: '',
    exclusions: '',
    clarifications: '',
  });

  useEffect(() => {
    if (terms) {
      setLocalTerms({
        default_terms: terms.default_terms || '',
        scope_of_work: terms.scope_of_work || '',
        inclusions: terms.inclusions || '',
        exclusions: terms.exclusions || '',
        clarifications: terms.clarifications || '',
      });
    }
  }, [terms]);

  const debouncedSave = useDebouncedCallback((field: string, value: string) => {
    updateTerms.mutate({
      subContractId: subContract.id,
      [field]: value,
    });
  }, 500);

  const handleChange = (field: string, value: string) => {
    setLocalTerms(prev => ({ ...prev, [field]: value }));
    debouncedSave(field, value);
  };

  const fields = [
    { key: 'default_terms', label: 'Default' },
    { key: 'scope_of_work', label: 'Scope of Work' },
    { key: 'inclusions', label: 'Inclusions' },
    { key: 'exclusions', label: 'Exclusions' },
    { key: 'clarifications', label: 'Clarifications' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Terms and Conditions
        </h3>
      </div>

      <div className="space-y-6">
        {fields.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <Label className="font-medium">{label}</Label>
            <div className="border rounded-lg overflow-hidden">
              <Textarea
                value={localTerms[key as keyof typeof localTerms]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="Start typing..."
                className="min-h-[120px] border-0 resize-none"
              />
              <div className="flex justify-end gap-4 px-3 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
                <span>Words: {localTerms[key as keyof typeof localTerms].split(/\s+/).filter(Boolean).length}</span>
                <span>Characters: {localTerms[key as keyof typeof localTerms].length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
