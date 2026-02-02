import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { supabase } from '@/integrations/supabase/client';
import { ContractDocument } from '@/components/pdf/ContractDocument';
import { COMPANY_INFO } from '@/content/contractBoilerplate';
import { calculateDeposit } from '@/utils/contractHelpers';

interface ContractData {
  agreementNumber: string;
  contractDate?: string;
  projectPhoto?: string;
  customer: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
  jobsiteAddress: string;
  preparedBy: string;
  contractPrice: number;
  payments: {
    deposit: number;
    materialPayment: number;
    progressPayment?: number;
    finalPayment: number;
  };
  scopeOfWork: string;
}

interface GenerateContractPdfParams {
  contractData: ContractData;
  proposalId: string;
}

// Helper function to convert image URL to base64 with auth
const fetchImageAsBase64 = async (url: string): Promise<string | undefined> => {
  try {
    console.log(`[Contract PDF] Fetching image: ${url.substring(0, 80)}...`);
    
    // Get Supabase session for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      'Accept': 'image/*'
    };
    
    // Add auth header if we have a session
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    const response = await fetch(url, { 
      headers,
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      console.error(`[Contract PDF] ✗ Failed to fetch image`);
      console.error(`[Contract PDF]   Status: ${response.status} ${response.statusText}`);
      console.error(`[Contract PDF]   URL: ${url}`);
      return undefined;
    }
    
    const blob = await response.blob();
    console.log(`[Contract PDF] ✓ Image fetched, size: ${blob.size} bytes`);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        console.log(`[Contract PDF] ✓ Converted to base64, length: ${base64String.length}`);
        resolve(base64String);
      };
      reader.onerror = (error) => {
        console.error('[Contract PDF] ✗ FileReader error:', error);
        resolve(undefined);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[Contract PDF] ✗ Error fetching/converting image:', error);
    console.error('[Contract PDF]   URL:', url);
    return undefined;
  }
};

export const useContractPdf = () => {
  const generateContractPdf = async ({
    contractData,
    proposalId,
  }: GenerateContractPdfParams): Promise<string> => {
    try {
      // Fetch photos from proposal - these will be used for "Design Transformation" section
      let beforePhoto: string | undefined;
      let afterPhoto: string | undefined;
      
      console.log('=== CONTRACT PDF GENERATION START ===');
      console.log('[Contract PDF] Fetching photos for proposal:', proposalId);
      console.log('[Contract PDF] ProjectPhoto from form:', contractData.projectPhoto || 'NONE');
      
      // Fetch current and proposed photos - simplified to just pick first of each type
      const { data: allPhotos, error: photoError } = await supabase
        .from('proposal_photos')
        .select('photo_url, photo_type')
        .eq('proposal_id', proposalId)
        .in('photo_type', ['current', 'proposed'])
        .not('photo_url', 'is', null)
        .not('photo_url', 'eq', '')
        .order('created_at', { ascending: false });

      if (photoError) {
        console.error('[Contract PDF] Error fetching photos:', photoError);
      } else if (allPhotos && allPhotos.length > 0) {
        console.log('[Contract PDF] Found', allPhotos.length, 'photos');
        
        // Simple logic: just take the first photo of each type
        const currentPhoto = allPhotos.find(p => p.photo_type === 'current');
        const proposedPhoto = allPhotos.find(p => p.photo_type === 'proposed');
        
        beforePhoto = currentPhoto?.photo_url;
        afterPhoto = proposedPhoto?.photo_url;
        
        console.log('[Contract PDF] Selected photos:', { 
          beforePhoto: beforePhoto?.substring(0, 80) || 'NONE',
          afterPhoto: afterPhoto?.substring(0, 80) || 'NONE'
        });
        
        // Convert images to base64 for reliable PDF rendering with error handling
        if (beforePhoto) {
          try {
            console.log('[Contract PDF] Converting beforePhoto to base64...');
            const converted = await fetchImageAsBase64(beforePhoto);
            if (converted) {
              beforePhoto = converted;
              console.log('[Contract PDF] ✓ BeforePhoto converted successfully');
            } else {
              console.warn('[Contract PDF] ✗ BeforePhoto conversion returned undefined');
              beforePhoto = undefined;
            }
          } catch (error) {
            console.error('[Contract PDF] ✗ Error converting beforePhoto:', error);
            beforePhoto = undefined;
          }
        }
        
        if (afterPhoto) {
          try {
            console.log('[Contract PDF] Converting afterPhoto to base64...');
            const converted = await fetchImageAsBase64(afterPhoto);
            if (converted) {
              afterPhoto = converted;
              console.log('[Contract PDF] ✓ AfterPhoto converted successfully');
            } else {
              console.warn('[Contract PDF] ✗ AfterPhoto conversion returned undefined');
              afterPhoto = undefined;
            }
          } catch (error) {
            console.error('[Contract PDF] ✗ Error converting afterPhoto:', error);
            afterPhoto = undefined;
          }
        }
      } else {
        console.log('[Contract PDF] No photos found for proposal');
      }

      // Prepare data for PDF with company info
      // PRIORITY: Use before/after comparison first, then fall back to projectPhoto
      const pdfData = {
        ...contractData,
        // Only use projectPhoto if we don't have before/after comparison
        projectPhoto: (!beforePhoto && !afterPhoto && contractData.projectPhoto && contractData.projectPhoto.trim() !== '') 
          ? (contractData.projectPhoto.startsWith('data:') 
              ? contractData.projectPhoto 
              : await fetchImageAsBase64(contractData.projectPhoto))
          : undefined,
        beforePhoto: beforePhoto || undefined,
        afterPhoto: afterPhoto || undefined,
        companyInfo: {
          name: COMPANY_INFO.name,
          legalName: COMPANY_INFO.legalName,
          licenseNumber: COMPANY_INFO.licenseNumber,
          phone: COMPANY_INFO.phone,
          email: COMPANY_INFO.email,
        },
      };

      console.log('=== FINAL PDF DATA ===');
      console.log('✓ ProjectPhoto:', pdfData.projectPhoto ? 'YES - ' + pdfData.projectPhoto.substring(0, 80) : '❌ NONE');
      console.log('✓ BeforePhoto:', pdfData.beforePhoto ? 'YES - ' + pdfData.beforePhoto.substring(0, 80) : '❌ NONE');
      console.log('✓ AfterPhoto:', pdfData.afterPhoto ? 'YES - ' + pdfData.afterPhoto.substring(0, 80) : '❌ NONE');
      console.log('=== PDF WILL SHOW:', pdfData.projectPhoto ? 'SINGLE PROJECT PHOTO' : (pdfData.beforePhoto && pdfData.afterPhoto ? 'BEFORE/AFTER COMPARISON' : 'NO IMAGES'));
      console.log('=========================');

      // Generate PDF using @react-pdf/renderer
      const blob = await pdf(<ContractDocument data={pdfData} />).toBlob();

      // Trigger download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Agreement-${contractData.agreementNumber}-${timestamp}.pdf`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      // Upload to Supabase Storage
      const fileName = `${contractData.agreementNumber}.pdf`;
      const filePath = `${proposalId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      console.log('Contract PDF uploaded successfully:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      throw error;
    }
  };

  return { generateContractPdf };
};
