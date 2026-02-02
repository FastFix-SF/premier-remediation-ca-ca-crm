import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DocuSign field type mapping
const FIELD_TYPE_MAP: Record<string, string> = {
  signature: 'signHere',
  initial: 'initialHere',
  date: 'dateSigned',
  text: 'text',
  email: 'email',
  name: 'fullName',
  company: 'company',
  title: 'title',
  checkbox: 'checkbox',
  radio: 'radio',
  dropdown: 'list',
  number: 'number'
};

interface Field {
  id: string;
  field_type: string;
  page_number: number;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  is_required: boolean;
  recipient_id?: string;
}

interface Recipient {
  name: string;
  email: string;
  role: string;
  signing_order: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      documentUrl, 
      documentName = "Contract Agreement",
      recipients, 
      fields, 
      emailSubject, 
      emailMessage,
      proposalId 
    } = await req.json();

    console.log('[DocuSign] Request received:', { documentUrl, recipients: recipients?.length, fields: fields?.length });

    // Get DocuSign credentials
    const DOCUSIGN_ACCOUNT_ID = Deno.env.get('DOCUSIGN_ACCOUNT_ID');
    const DOCUSIGN_USER_ID = Deno.env.get('DOCUSIGN_USER_ID');
    const DOCUSIGN_INTEGRATION_KEY = Deno.env.get('DOCUSIGN_INTEGRATION_KEY');
    const DOCUSIGN_BASE_URL = Deno.env.get('DOCUSIGN_BASE_URL') || 'https://demo.docusign.net';
    const DOCUSIGN_PRIVATE_KEY = Deno.env.get('DOCUSIGN_PRIVATE_KEY');

    if (!DOCUSIGN_ACCOUNT_ID || !DOCUSIGN_USER_ID || !DOCUSIGN_INTEGRATION_KEY || !DOCUSIGN_PRIVATE_KEY) {
      throw new Error('Missing DocuSign credentials');
    }

    console.log('[DocuSign] Credentials verified, authenticating...');

    // Generate JWT token for authentication
    const jwtToken = await generateJWT(DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_PRIVATE_KEY, DOCUSIGN_BASE_URL);
    
    console.log('[DocuSign] JWT generated, getting access token...');

    // Get access token
    const accessToken = await getAccessToken(jwtToken, DOCUSIGN_BASE_URL);

    console.log('[DocuSign] Access token obtained, downloading document...');

    // Download the document from the URL
    const docResponse = await fetch(documentUrl);
    if (!docResponse.ok) {
      throw new Error(`Failed to download document: ${docResponse.statusText}`);
    }
    const docBuffer = await docResponse.arrayBuffer();
    const docBase64 = btoa(String.fromCharCode(...new Uint8Array(docBuffer)));

    console.log('[DocuSign] Document downloaded, preparing envelope...');

    // Convert recipients to DocuSign format
    const signers = recipients.map((r: Recipient, idx: number) => ({
      email: r.email,
      name: r.name,
      recipientId: String(idx + 1),
      routingOrder: String(r.signing_order || idx + 1),
    }));

    // Convert fields to DocuSign tabs
    const tabsByRecipient = convertFieldsToTabs(fields, recipients);

    // Create envelope definition
    const envelopeDefinition = {
      emailSubject: emailSubject || 'Please sign this document',
      emailBlurb: emailMessage || 'Please review and sign the attached document.',
      documents: [{
        documentBase64: docBase64,
        name: documentName,
        fileExtension: 'pdf',
        documentId: '1',
      }],
      recipients: {
        signers: signers.map((signer, idx) => ({
          ...signer,
          tabs: tabsByRecipient[idx] || {}
        }))
      },
      status: 'sent',
    };

    console.log('[DocuSign] Creating envelope...');

    // Create the envelope
    const envelopeResponse = await fetch(
      `${DOCUSIGN_BASE_URL}/restapi/v2.1/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error('[DocuSign] Envelope creation failed:', errorText);
      throw new Error(`DocuSign API error: ${errorText}`);
    }

    const envelope = await envelopeResponse.json();
    console.log('[DocuSign] Envelope created:', envelope.envelopeId);

    // Store envelope ID in database if proposalId is provided
    if (proposalId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('signature_envelopes')
        .insert({
          proposal_id: proposalId,
          docusign_envelope_id: envelope.envelopeId,
          status: 'sent',
          subject: emailSubject,
          message: emailMessage,
        });

      console.log('[DocuSign] Envelope ID stored in database');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        envelopeId: envelope.envelopeId,
        uri: envelope.uri 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DocuSign] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Convert PKCS#1 (RSA PRIVATE KEY) to PKCS#8 (PRIVATE KEY) format
function convertPKCS1toPKCS8(pkcs1Key: Uint8Array): Uint8Array {
  // PKCS#8 wraps PKCS#1 with additional ASN.1 structure
  // PKCS#8 structure: SEQUENCE { version, algorithm, privateKey }
  
  // RSA algorithm identifier (OID 1.2.840.113549.1.1.1)
  const rsaOID = new Uint8Array([
    0x30, 0x0D, // SEQUENCE length 13
    0x06, 0x09, // OID length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x01, 0x01, // RSA OID
    0x05, 0x00  // NULL parameter
  ]);
  
  // Build PKCS#8 structure
  // Version (INTEGER 0)
  const version = new Uint8Array([0x02, 0x01, 0x00]);
  
  // OCTET STRING wrapper for PKCS#1 key
  const pkcs1Length = pkcs1Key.length;
  const octetStringHeader = encodeLengthBytes(pkcs1Length);
  const octetString = new Uint8Array([0x04, ...octetStringHeader, ...pkcs1Key]);
  
  // Calculate total length for outer SEQUENCE
  const innerLength = version.length + rsaOID.length + octetString.length;
  const sequenceHeader = encodeLengthBytes(innerLength);
  
  // Combine all parts
  const pkcs8Key = new Uint8Array([
    0x30, // SEQUENCE tag
    ...sequenceHeader,
    ...version,
    ...rsaOID,
    ...octetString
  ]);
  
  return pkcs8Key;
}

// Encode ASN.1 length bytes
function encodeLengthBytes(length: number): number[] {
  if (length < 128) {
    return [length];
  } else if (length < 256) {
    return [0x81, length];
  } else if (length < 65536) {
    return [0x82, (length >> 8) & 0xFF, length & 0xFF];
  } else {
    return [0x83, (length >> 16) & 0xFF, (length >> 8) & 0xFF, length & 0xFF];
  }
}

// Generate JWT token for DocuSign
async function generateJWT(
  integrationKey: string, 
  userId: string, 
  privateKey: string,
  baseUrl: string
): Promise<string> {
  try {
    console.log('[DocuSign] Starting JWT generation');
    
    // Validate that we have a private key
    if (!privateKey || privateKey.trim().length === 0) {
      throw new Error('Private key is empty or undefined');
    }
    
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: integrationKey,
      sub: userId,
      aud: baseUrl.includes('demo') ? 'account-d.docusign.com' : 'account.docusign.com',
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation'
    };

    console.log('[DocuSign] Parsing private key');
    
    // Detect key format
    const originalKey = privateKey.trim();
    const isRSAFormat = originalKey.includes('BEGIN RSA PRIVATE KEY');
    const isPKCS8Format = originalKey.includes('BEGIN PRIVATE KEY');
    
    if (!isRSAFormat && !isPKCS8Format) {
      throw new Error('Private key must contain either "BEGIN RSA PRIVATE KEY" or "BEGIN PRIVATE KEY" header');
    }
    
    console.log(`[DocuSign] Detected key format: ${isRSAFormat ? 'PKCS#1 (RSA)' : 'PKCS#8'}`);
    
    // Extract PEM contents
    let pemContents = originalKey
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, '')
      .replace(/-----END RSA PRIVATE KEY-----/g, '')
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\\n/g, '')  // Handle escaped newlines
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\s+/g, '');  // Remove all whitespace

    if (!pemContents || pemContents.length === 0) {
      throw new Error('Private key is empty after removing headers');
    }

    console.log('[DocuSign] Key length after cleanup:', pemContents.length);
    
    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    if (!base64Regex.test(pemContents)) {
      throw new Error('Private key contains invalid base64 characters');
    }
    
    // Decode base64 to binary using Deno's built-in decoder
    let binaryKey: Uint8Array;
    try {
      // Use TextEncoder/TextDecoder for better compatibility in Deno
      const decoder = new TextDecoder();
      const binaryString = atob(pemContents);
      binaryKey = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        binaryKey[i] = binaryString.charCodeAt(i);
      }
      console.log('[DocuSign] Binary key length:', binaryKey.length);
    } catch (decodeError) {
      console.error('[DocuSign] Base64 decode error:', decodeError);
      throw new Error(`Failed to decode base64: ${decodeError.message}. Please ensure your DOCUSIGN_PRIVATE_KEY is properly formatted.`);
    }

    console.log('[DocuSign] Importing crypto key');

    // Convert PKCS#1 to PKCS#8 if needed
    let keyToImport = binaryKey;
    if (isRSAFormat) {
      console.log('[DocuSign] Converting PKCS#1 to PKCS#8 format');
      keyToImport = convertPKCS1toPKCS8(binaryKey);
      console.log('[DocuSign] Conversion complete, new key length:', keyToImport.length);
    }

    // Import the key
    let cryptoKey: CryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyToImport,
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );
      console.log('[DocuSign] Successfully imported crypto key');
    } catch (importError) {
      console.error('[DocuSign] Key import failed:', importError.message);
      throw new Error(`Failed to import private key: ${importError.message}. Ensure it's a valid RSA private key in either PKCS#1 or PKCS#8 format.`);
    }

    console.log('[DocuSign] Creating JWT signature');

    // Create the JWT with base64url encoding
    const headerB64 = btoa(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    const signatureInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    console.log('[DocuSign] JWT generated successfully');
    return `${headerB64}.${payloadB64}.${signatureB64}`;
  } catch (error) {
    console.error('[DocuSign] JWT generation failed:', error);
    throw new Error(`JWT generation failed: ${error.message}`);
  }
}

// Get access token using JWT
async function getAccessToken(jwtToken: string, baseUrl: string): Promise<string> {
  const authUrl = baseUrl.includes('demo') 
    ? 'https://account-d.docusign.com/oauth/token'
    : 'https://account.docusign.com/oauth/token';

  const response = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwtToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Convert our field format to DocuSign tabs
function convertFieldsToTabs(fields: Field[], recipients: Recipient[]) {
  const tabsByRecipient: Record<number, any> = {};

  fields.forEach((field) => {
    // Find recipient index (default to 0 if not specified)
    const recipientIndex = field.recipient_id 
      ? recipients.findIndex(r => r.email === field.recipient_id)
      : 0;

    if (!tabsByRecipient[recipientIndex]) {
      tabsByRecipient[recipientIndex] = {};
    }

    const docusignType = FIELD_TYPE_MAP[field.field_type] || 'text';
    const tabCategory = `${docusignType}Tabs`;

    if (!tabsByRecipient[recipientIndex][tabCategory]) {
      tabsByRecipient[recipientIndex][tabCategory] = [];
    }

    // Convert percentage positions to DocuSign units (pixels at 96 DPI)
    // Assuming standard letter size: 8.5" x 11" = 816px x 1056px at 96 DPI
    const pageWidth = 816;
    const pageHeight = 1056;

    const tab: any = {
      documentId: '1',
      pageNumber: String(field.page_number),
      xPosition: String(Math.round((field.x_position / 100) * pageWidth)),
      yPosition: String(Math.round((field.y_position / 100) * pageHeight)),
      width: String(Math.round((field.width / 100) * pageWidth)),
      height: String(Math.round((field.height / 100) * pageHeight)),
    };

    if (field.is_required) {
      tab.required = 'true';
    }

    tabsByRecipient[recipientIndex][tabCategory].push(tab);
  });

  return tabsByRecipient;
}
