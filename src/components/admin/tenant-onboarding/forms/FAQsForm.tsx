import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

// Single FAQ schema
export const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, 'Question is required'),
  answer: z.string().min(10, 'Answer is required'),
  category: z.string().optional(),
  display_order: z.number().default(0),
});

export type FAQFormData = z.infer<typeof faqSchema>;

// Form for managing multiple FAQs
export const faqsListSchema = z.object({
  faqs: z.array(faqSchema),
});

export type FAQsListFormData = z.infer<typeof faqsListSchema>;

interface FAQsFormProps {
  defaultValues?: Partial<FAQsListFormData>;
  onSubmit: (data: FAQsListFormData) => void;
  isLoading?: boolean;
  submitLabel?: string;
  showCard?: boolean;
}

// Pre-defined FAQ categories
const FAQ_CATEGORIES = [
  'General',
  'Pricing',
  'Services',
  'Materials',
  'Warranty',
  'Insurance',
  'Process',
  'Maintenance',
];

// Pre-defined FAQs for quick add
const PRESET_FAQS: Partial<FAQFormData>[] = [
  {
    question: 'How long does a typical roof replacement take?',
    answer: 'Most residential roof replacements take 1-3 days, depending on the size of the roof, weather conditions, and complexity of the project. Commercial roofs may take longer.',
    category: 'Process',
  },
  {
    question: 'Do you offer free estimates?',
    answer: 'Yes, we offer free, no-obligation estimates. Our experienced team will assess your roof and provide a detailed quote within 24-48 hours.',
    category: 'Pricing',
  },
  {
    question: 'What type of warranty do you offer?',
    answer: 'We offer comprehensive warranties that include both manufacturer warranties on materials and our own workmanship warranty. Specific terms vary by project.',
    category: 'Warranty',
  },
  {
    question: 'Are you licensed and insured?',
    answer: 'Yes, we are fully licensed, bonded, and insured. We carry comprehensive liability and workers compensation insurance for your protection.',
    category: 'General',
  },
  {
    question: 'What roofing materials do you work with?',
    answer: 'We work with a wide variety of materials including asphalt shingles, metal roofing, tile, slate, and flat roofing systems. We can help you choose the best option for your needs and budget.',
    category: 'Materials',
  },
  {
    question: 'Do you handle insurance claims?',
    answer: 'Yes, we have extensive experience working with insurance companies and can help guide you through the claims process for storm damage and other covered repairs.',
    category: 'Insurance',
  },
];

interface FAQItemProps {
  faq: FAQFormData;
  index: number;
  onUpdate: (index: number, faq: FAQFormData) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const FAQItem: React.FC<FAQItemProps> = ({
  faq,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-2">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1 hover:bg-muted rounded disabled:opacity-30"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1 hover:bg-muted rounded disabled:opacity-30"
          >
            ▼
          </button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={faq.question}
                onChange={(e) => onUpdate(index, { ...faq, question: e.target.value })}
                placeholder="Question"
                className="font-medium"
              />
            </div>
            <Select
              value={faq.category || ''}
              onValueChange={(value) => onUpdate(index, { ...faq, category: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {FAQ_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            value={faq.answer}
            onChange={(e) => onUpdate(index, { ...faq, answer: e.target.value })}
            placeholder="Answer"
            className="min-h-[80px]"
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          className="mt-2"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export const FAQsForm: React.FC<FAQsFormProps> = ({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
  showCard = true,
}) => {
  const [faqs, setFaqs] = useState<FAQFormData[]>(defaultValues?.faqs || []);
  const [showPresets, setShowPresets] = useState(false);

  const form = useForm<FAQsListFormData>({
    resolver: zodResolver(faqsListSchema),
    defaultValues: { faqs },
  });

  const addFaq = (preset?: Partial<FAQFormData>) => {
    const newFaq: FAQFormData = {
      question: preset?.question || '',
      answer: preset?.answer || '',
      category: preset?.category || '',
      display_order: faqs.length,
    };
    const updatedFaqs = [...faqs, newFaq];
    setFaqs(updatedFaqs);
    form.setValue('faqs', updatedFaqs);
  };

  const updateFaq = (index: number, faq: FAQFormData) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = faq;
    setFaqs(updatedFaqs);
    form.setValue('faqs', updatedFaqs);
  };

  const removeFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    updatedFaqs.forEach((f, i) => {
      f.display_order = i;
    });
    setFaqs(updatedFaqs);
    form.setValue('faqs', updatedFaqs);
  };

  const moveFaq = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;

    const updatedFaqs = [...faqs];
    [updatedFaqs[index], updatedFaqs[newIndex]] = [updatedFaqs[newIndex], updatedFaqs[index]];
    updatedFaqs.forEach((f, i) => {
      f.display_order = i;
    });
    setFaqs(updatedFaqs);
    form.setValue('faqs', updatedFaqs);
  };

  const addAllPresets = () => {
    const newFaqs = PRESET_FAQS.map((preset, i) => ({
      question: preset.question || '',
      answer: preset.answer || '',
      category: preset.category || '',
      display_order: faqs.length + i,
    }));
    const updatedFaqs = [...faqs, ...newFaqs];
    setFaqs(updatedFaqs);
    form.setValue('faqs', updatedFaqs);
    setShowPresets(false);
  };

  const handleSubmit = () => {
    onSubmit({ faqs });
  };

  const content = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <HelpCircle className="h-5 w-5" />
              <span>FAQs ({faqs.length})</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPresets(!showPresets)}
              >
                Quick Add
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addFaq()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add FAQ
              </Button>
            </div>
          </div>

          {showPresets && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">Click to add common roofing FAQs:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_FAQS.map((preset, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addFaq(preset);
                    }}
                    className="text-left"
                  >
                    {preset.question?.slice(0, 30)}...
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addAllPresets}
              >
                Add All Preset FAQs
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                onUpdate={updateFaq}
                onRemove={removeFaq}
                onMoveUp={() => moveFaq(index, 'up')}
                onMoveDown={() => moveFaq(index, 'down')}
                isFirst={index === 0}
                isLast={index === faqs.length - 1}
              />
            ))}
          </div>

          {faqs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No FAQs added yet. Click "Add FAQ" or use "Quick Add" to get started.
              <br />
              <span className="text-sm">FAQs are optional but recommended for SEO.</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
        <CardDescription>
          Add FAQs to help customers and improve your website's SEO. This step is optional.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
};
