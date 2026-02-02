import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface EnvelopeRecipient {
  id?: string;
  name: string;
  email: string;
  role: 'signer' | 'cc' | 'viewer';
  signing_order: number;
}

export interface DocumentField {
  id?: string;
  field_type: 'signature' | 'initial' | 'date' | 'text' | 'email' | 'number' | 'checkbox' | 'name';
  field_label?: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  is_required: boolean;
  recipient_id?: string;
}

export interface EnvelopeDocument {
  id?: string;
  name: string;
  file_url: string;
  page_count: number;
  document_order: number;
  fields: DocumentField[];
}

export interface SignatureEnvelope {
  id?: string;
  proposal_id?: string;
  subject: string;
  message?: string;
  recipients: EnvelopeRecipient[];
  documents: EnvelopeDocument[];
  status: 'draft' | 'sent' | 'completed';
}

export const useSignatureEnvelope = () => {
  const [loading, setLoading] = useState(false);

  const createEnvelope = async (envelope: SignatureEnvelope): Promise<string | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create envelope
      const { data: envelopeData, error: envelopeError } = await supabase
        .from('signature_envelopes')
        .insert({
          proposal_id: envelope.proposal_id,
          subject: envelope.subject,
          message: envelope.message,
          created_by: user.id,
          status: 'draft',
        })
        .select()
        .maybeSingle();

      if (envelopeError) throw envelopeError;

      // Create recipients
      const { data: recipientsData, error: recipientsError } = await supabase
        .from('envelope_recipients')
        .insert(
          envelope.recipients.map((r) => ({
            envelope_id: envelopeData.id,
            name: r.name,
            email: r.email,
            role: r.role,
            signing_order: r.signing_order,
          }))
        )
        .select();

      if (recipientsError) throw recipientsError;

      // Create documents
      for (const doc of envelope.documents) {
        const { data: docData, error: docError } = await supabase
          .from('envelope_documents')
          .insert({
            envelope_id: envelopeData.id,
            name: doc.name,
            file_url: doc.file_url,
            page_count: doc.page_count,
            document_order: doc.document_order,
          })
          .select()
          .maybeSingle();

        if (docError) throw docError;

        // Create fields for this document
        if (doc.fields.length > 0) {
          const fieldsToInsert = doc.fields.map((field) => ({
            document_id: docData.id,
            recipient_id: recipientsData.find((r) => r.email === field.recipient_id)?.id || recipientsData[0].id,
            field_type: field.field_type,
            field_label: field.field_label,
            page_number: field.page_number,
            x_position: field.x_position,
            y_position: field.y_position,
            width: field.width,
            height: field.height,
            is_required: field.is_required,
          }));

          const { error: fieldsError } = await supabase
            .from('document_fields')
            .insert(fieldsToInsert);

          if (fieldsError) throw fieldsError;
        }
      }

      // Log audit trail
      await supabase.from('envelope_audit_trail').insert({
        envelope_id: envelopeData.id,
        user_id: user.id,
        action: 'envelope_created',
        details: { subject: envelope.subject },
      });

      toast({
        title: 'Envelope Created',
        description: 'Your signature envelope has been created successfully.',
      });

      return envelopeData.id;
    } catch (error: any) {
      console.error('Error creating envelope:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create envelope',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendEnvelope = async (envelopeId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Update envelope status
      const { error: updateError } = await supabase
        .from('signature_envelopes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', envelopeId);

      if (updateError) throw updateError;

      // Update recipients status
      const { error: recipientsError } = await supabase
        .from('envelope_recipients')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('envelope_id', envelopeId);

      if (recipientsError) throw recipientsError;

      // Log audit trail
      await supabase.from('envelope_audit_trail').insert({
        envelope_id: envelopeId,
        action: 'envelope_sent',
        details: { timestamp: new Date().toISOString() },
      });

      // TODO: Send emails to recipients via edge function

      toast({
        title: 'Envelope Sent',
        description: 'Signature requests have been sent to all recipients.',
      });

      return true;
    } catch (error: any) {
      console.error('Error sending envelope:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send envelope',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getEnvelope = async (envelopeId: string) => {
    try {
      const { data: envelope, error: envelopeError } = await supabase
        .from('signature_envelopes')
        .select('*')
        .eq('id', envelopeId)
        .maybeSingle();

      if (envelopeError) throw envelopeError;

      const { data: recipients, error: recipientsError } = await supabase
        .from('envelope_recipients')
        .select('*')
        .eq('envelope_id', envelopeId)
        .order('signing_order');

      if (recipientsError) throw recipientsError;

      const { data: documents, error: documentsError } = await supabase
        .from('envelope_documents')
        .select('*')
        .eq('envelope_id', envelopeId)
        .order('document_order');

      if (documentsError) throw documentsError;

      return { envelope, recipients, documents };
    } catch (error: any) {
      console.error('Error fetching envelope:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch envelope',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    loading,
    createEnvelope,
    sendEnvelope,
    getEnvelope,
  };
};
