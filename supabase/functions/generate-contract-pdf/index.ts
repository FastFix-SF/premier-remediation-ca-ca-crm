import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MilestonePayment {
  id: string;
  label: string;
  percent: number;
  amount: number;
  timing: string;
  isDeposit?: boolean;
  isFinal?: boolean;
}

interface ContractData {
  proposalId: string;
  agreementNumber: string;
  projectName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  jobsiteAddress: string;
  preparedBy: string;
  preparedOn: string;
  contractDate?: string;
  contractPrice: number;
  paymentSchedule: {
    milestones: MilestonePayment[];
  };
  scopeOfWork: string;
  projectPhotoUrl?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const contractData: ContractData = await req.json();
    console.log('Generating contract for proposal:', contractData.proposalId);

    // If no projectPhotoUrl or empty string, try to get the first comparison block or current/proposed photos
    let beforePhotoUrl = contractData.beforePhotoUrl;
    let afterPhotoUrl = contractData.afterPhotoUrl;
    
    if (!contractData.projectPhotoUrl || contractData.projectPhotoUrl.trim() === '') {
      console.log('[Contract HTML] No project photo provided, fetching comparison photos for proposal:', contractData.proposalId);
      
      // First, try to get photos from comparison blocks
      const { data: blockPhotos, error: blockError } = await supabase
        .from('proposal_photos')
        .select('*')
        .eq('proposal_id', contractData.proposalId)
        .not('comparison_block_id', 'is', null)
        .in('photo_type', ['current', 'proposed', 'before', 'after'])
        .order('display_order')
        .limit(10);

      if (blockError) {
        console.error('[Contract HTML] Error fetching comparison block photos:', blockError);
      } else if (blockPhotos && blockPhotos.length > 0) {
        console.log('[Contract HTML] Found', blockPhotos.length, 'comparison block photos');
        // Group by comparison_block_id and get the first block
        const blockId = blockPhotos[0].comparison_block_id;
        const blockSpecificPhotos = blockPhotos.filter((p: any) => p.comparison_block_id === blockId);
        
        const currentImg = blockSpecificPhotos.find((p: any) => p.photo_type === 'current' || p.photo_type === 'before');
        const proposedImg = blockSpecificPhotos.find((p: any) => p.photo_type === 'proposed' || p.photo_type === 'after');
        
        beforePhotoUrl = currentImg?.photo_url;
        afterPhotoUrl = proposedImg?.photo_url;
        console.log('[Contract HTML] From comparison block:', { beforePhotoUrl, afterPhotoUrl });
      }
      
      // If no comparison block photos, fall back to any current/proposed photos
      if (!beforePhotoUrl || !afterPhotoUrl) {
        console.log('[Contract HTML] Falling back to standalone photos');
        const { data: standalonePhotos, error: standaloneError } = await supabase
          .from('proposal_photos')
          .select('*')
          .eq('proposal_id', contractData.proposalId)
          .in('photo_type', ['current', 'proposed', 'before', 'after'])
          .order('created_at', { ascending: false })
          .limit(10);

        if (standaloneError) {
          console.error('[Contract HTML] Error fetching standalone photos:', standaloneError);
        } else if (standalonePhotos && standalonePhotos.length > 0) {
          console.log('[Contract HTML] Found', standalonePhotos.length, 'standalone photos');
          if (!beforePhotoUrl) {
            const currentImg = standalonePhotos.find((p: any) => p.photo_type === 'current' || p.photo_type === 'before');
            beforePhotoUrl = currentImg?.photo_url;
          }
          if (!afterPhotoUrl) {
            const proposedImg = standalonePhotos.find((p: any) => p.photo_type === 'proposed' || p.photo_type === 'after');
            afterPhotoUrl = proposedImg?.photo_url;
          }
          console.log('[Contract HTML] Final photos:', { beforePhotoUrl, afterPhotoUrl });
        }
      }
    }

    const htmlContent = generateContractHTML({
      ...contractData,
      beforePhotoUrl,
      afterPhotoUrl,
    });
    
    console.log('Returning HTML for client-side PDF generation');

    return new Response(
      JSON.stringify({
        htmlContent,
        agreementNumber: contractData.agreementNumber,
        proposalId: contractData.proposalId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

function generateContractHTML(data: ContractData): string {
  const COMPANY_INFO = {
    name: 'The Roofing Friend, Inc.',
    legalName: 'The Roofing Friend DBA Western Roofing Systems',
    licenseNumber: 'CSLB#1067709',
    address: '211 Jackson St. Hayward, CA 94544',
    phone: '(510) 200-3693',
    email: 'rooffriend@gmail.com',
  };

  // Boilerplate sections inlined directly (pages 4-8)
  const STANDARD_PROVISIONS = `
<div class="standard-provisions-page" style="page-break-before: always; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4;">
  <h3 style="font-weight: bold; text-align: center; margin-bottom: 20px;">STANDARD PROVISIONS</h3>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">1. CHANGES IN THE WORK - CONCEALED CONDITIONS</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Should the Owner, construction lender, or any public body or inspector direct any modification or addition to the work covered by this contract, 
    the contract price shall be adjusted accordingly. Modification or addition to the work shall be executed only when a Change Order has been signed 
    by both the Owner and THE ROOFING FRIEND, INC. The change in the Contract Price caused by such Change Order shall be agreed to in writing, or if 
    the parties are not in agreement as to the change in Contract Price, or whether the term(s) or work constitute a change. THE ROOFING FRIEND, INC's 
    actual cost of all labor, equipment, subcontracts and materials, plus 18% for its overhead and 20% for its profit shall be the change in Contract 
    Price. The Change Order may also increase the time within which the contract is to be completed.
  </p>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC shall promptly notify the Owner of: (a) latent physical conditions at the site differing materially from those indicated 
    in this contract, or (b) unknown physical conditions differing materially from those ordinarily encountered and generally recognized as inherent 
    in work of the character provided for in this contract. Any expense incurred due to such conditions shall be paid for by Owner as added work. 
    No extra or change order work shall be required to be performed without prior written authorization or the person contracting for the construction 
    of the home improvement. Any Change Order forms for changes or extra work shall be incorporated in, and become a part of the contract. However, 
    in the event that the building department or the governing body requires a change or modification then THE ROOFING FRIEND, INC may make that 
    change prior to receiving written authorization and thereafter negotiate the effect of that change with the Owner. Payments for extra work will 
    be made as extra work progress, concurrently with progress payments. Any modification or addition after starting the roof (i.e. wood replacement, 
    additional layers or roof removal etc.) will be addressed with the owner before continuing.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">2. OWNER'S RESPONSIBILITIES</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    The Owner is responsible to supply staging area and electrical utilities unless otherwise agreed to in writing. Electricity and staging area to 
    the site is necessary. The Owner agrees to allow and provide the contractor and his equipment access to the property. The Owner is responsible 
    for having sufficient funds to comply with this agreement. This is a cash transaction unless otherwise specified. The Owner is responsible to 
    remove or protect any personal property and the contractor is not responsible for the same nor for any carpets, drapes, furniture, driveway, 
    lawns, shrubs, etc. The Owner will point out and warrant the property lines to THE ROOFING FRIEND, INC. Spark arrestors, gutters, chimneys, 
    roof drains, etc., are continual maintenance items and should be cleaned, tightened, etc. yearly. THE ROOFING FRIEND, INC is not responsible 
    for any interior work on skylights, exhaust ducts, vent tubes, etc. Owner warrants to contractor that structures and access ways (i.e. driveways, 
    walkways, patios, etc.) covered by this contract are in good condition and that said structures and access ways will withstand weight or vibration 
    caused by the workmen, materials, suppliers or equipment used therein by Contractor.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">A.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor is not responsible for repitching, re-sloping or correcting existing roof surfaces to eliminate ponding or collection of water on 
    roofing products. Contractor is not responsible for pre-existing conditions or damages i.e., cracked driveway, sagging roof members, deflections 
    in the roof line or settling of the house, or damages incurred from prior roof leaks, or the repair of any such conditions. It is agreed Contractor 
    will not be held liable for oil canning or use of less than full length panels on roofs. Ponding of water in gutters caused by settling of home 
    or bows in the roof line of the home is not the responsibility of Contractor, when installing gutters, Contractor follows the roof line unless 
    homeowner specifies gutters should be slanted toward the outlets.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">B.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor is not responsible for power or phone lines, TV antennas, guide wires, cable service, satellite dishes, or adjustments of rooftop 
    equipment. These items may need service after job completion. All heat exhaust vent connections through the attic should be checked by the gas 
    provider after job completion.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">C.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor is not responsible for damage to property inside the building caused by vibration or the falling of objects from the roof. Homeowner 
    should take due care to ensure chandelier, crystal, painting, etc. are hung securely or wrapped to ensure no chipping or cracking occurs. 
    Contractor is not responsible for the loosening of screws, nails or cracking of tape between sheetrock, or dust and dirt falling between wood 
    slat, t-bar or drywall ceilings caused by vibrations associated with the reroofing process.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">D.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor will make every attempt to ensure flowers, trees, etc., are not damaged. However, the owner accepts that minor damage to plants, etc., 
    is unavoidable considering the nature of the job. Contractor does not warrant or guarantee to identify any/all damages due to dry rot, termite, 
    molds, fungus, etc. If damage is suspected or questioned, owner should have a specialist inspect.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">E.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor agrees to use reasonable care when moving, raising or lifting objects such as solar panels, gutters, conduits, signs, skylights, 
    air conditioners etc., but shall assume no responsibility for the operation of, or damage to, such objects. Solar panels and water lines must 
    be cut and drained before roofing.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">F.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Replacement of existing flashings into, stucco, siding, skylight, chimney, walls, etc. is not included in agreement and will be based on time 
    and materials if required once roof is removed and inspected. Painting of stucco, siding, eave, gable, or wood replacement is not included in agreement.
  </p>
</div>
`;

  const STANDARD_PROVISIONS_PAGE_2 = `
<div class="standard-provisions-page2" style="page-break-before: always; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4;">
  <h4 style="font-weight: bold; margin-top: 0; margin-bottom: 8px;">G.</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor is not responsible for any damage or injury due to entering or exiting the construction zone. Owner is responsible to keep self, 
    relatives, neighbors, visitors or any non-construction personnel away from the construction zone.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">3. DELAYS AND INCREASES IN MATERIAL COSTS:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC shall be excused for any delay in completion of the contract caused by acts of God; stormy or inclement weather; 
    strikes, lockouts, boycotts, or other labor union activities; acts of Owner, of Owner's agent, or of Owner's employees or independent contractor, 
    disbursement of funds into funding control or escrow; acts of public utilities or public bodies; acts of public enemy, riots or civil commotion, 
    inability to secure material through regular recognized channels; imposition of Government priority or allocation of materials; delays caused by 
    inspection or changes ordered by the inspectors of authorized governmental bodies; changes requested by Owner; Owner's failure to make progress 
    payments promptly; failure of the issuance of all necessary building permits within a reasonable length of time; or other contingencies unforeseen 
    by THE ROOFING FRIEND, INC and beyond its reasonable control.
  </p>
  <p style="text-align: justify; margin-bottom: 12px;">
    Additionally, while THE ROOFING FRIEND, INC believes that it can complete the Project without any increases in costs, to the extent that material 
    costs increase by more than 1% from the costs of said materials on the date this Agreement was signed, THE ROOFING FRIEND, INC shall be entitled 
    to an increase in the contract price equal to the increased cost above the 1% increase in material cost. To the extent material costs increase due 
    to delay caused by Owner, Owner's agents or separate contractors, THE ROOFING FRIEND, INC shall be entitled to all cost increases incurred as a 
    result, in addition to any extended field and home office expenses. There shall be no additional markup for overhead or profit on the increased 
    cost, except as otherwise indicated. Contractor has no liability for failures or availability in material caused by improper manufacturing or 
    ordering or defects in the product which are beyond the control of the contractor.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">4. VALIDITY:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    In case one or more of the provisions of this Agreement or any application thereof shall be invalid, unenforceable or illegal, the validity, 
    enforceability and legality of the remaining provisions and any other application shall not in any way be impaired thereby.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">5. CLEAN-UP:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC will remove from Owner's property debris and surplus materials created by its operation and leave driveway/walkway in a 
    neat and broom clean condition. Contractor does not guarantee to remove every little piece of construction material from the yard, planters, 
    planter boxes, etc.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">6. LIMITATIONS:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    No Action of any character arising from or related to this contract, or the performance thereof, shall be commenced by either party against the 
    other more than two years after completion or cessation of work under this contract.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">7. DESTRUCTION OF WORK:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    If the project is destroyed or damaged by accident, disaster or calamity, such as fire, storm, earthquake, flood, landslide, or by theft, 
    vandalism, or another contractor's error, any work done by THE ROOFING FRIEND, INC in rebuilding or restoring the Project shall be paid by 
    the Owner as extra work.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">8. SUBCONTRACTS:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC may subcontract portions of this work to properly licensed and qualified subcontractors.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">9. FEES, TAXES AND ASSESSMENTS:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Taxes, Permits, Fees, and assessments of all descriptions will be paid for by Owner. THE ROOFING FRIEND, INC will obtain all required building 
    permits, at the sole expense of Owner. Upon demand by THE ROOFING FRIEND, INC, Owner shall provide ample funds to acquire any and all necessary 
    permits on a timely basis. Owner will pay assessments, and charges required by public bodies and utilities for the financing or repaying the cost 
    of sewers, storm drains, water services, school and school facilities, other utilities, hook-up charges and the like.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">10. LABOR AND MATERIAL:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC shall pay all valid charges for labor and material incurred by THE ROOFING FRIEND, INC and used in the construction or 
    repair of the Project. THE ROOFING FRIEND, INC is excused from this obligation for bills received in any period during which the Owner is in 
    arrears in making progress payments to THE ROOFING FRIEND, INC. No Waiver or release of mechanic's lien given by THE ROOFING FRIEND, INC shall 
    be binding until all payments due to THE ROOFING FRIEND, INC when the release was executed have been made.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">11. PAYMENT AND RIGHT TO STOP WORK:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Past due payments shall bear interest at the rate of .004 per week (21% per annum), until paid in full. THE ROOFING FRIEND, INC shall have the 
    right to stop work if any payment shall not be made, when due, to THE ROOFING FRIEND, INC under this Agreement. THE ROOFING FRIEND, INC may keep 
    the job idle until all payments due are received. This remedy is in addition to any other right or remedy that THE ROOFING FRIEND, INC may have. 
    Such failure by Owner to make payment, when due, is a material breach of this agreement and homeowner is responsible for any damage to structure 
    caused by idleness for non or late payment as agreed. Completion of project is achieved when materials are installed as per manufacturers 
    instructions, or permit agency deems project finaled. If owner requests gutters, downspouts, section of roof, etc. left off, balance of final 
    payment minus requested items are due forthwith.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">12. RIGHT TO CANCEL:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    If cancellation is beyond the 3 or 7 day right, a fee may be kept for costs up to 100% of Deposit.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">13. WEATHER AND OTHER DAMAGE:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC shall attempt to keep the project reasonably covered during the construction. However, Owner understands that unexpected 
    weather conditions can arise that might cause damage to the project or its contents. THE ROOFING FRIEND, INC shall not be responsible for any such 
    damage beyond its reasonable control.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">14. WARRANTY:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    THE ROOFING FRIEND, INC hereby warrants, subject to the Terms and Conditions set forth herein, that it will make all necessary repairs to leaks 
    which result from defects in workmanship and materials furnished by THE ROOFING FRIEND, INC at no cost to the Owner when those leaks occur within 
    the 5 year term of this warranty. Such repairs are expressly agreed to be the Owner's exclusive remedy. THE LIMITED LABOR WARRANTY PROVIDED BY 
    THE ROOFING FRIEND, INC IS ONLY AS CONTAINED WITHIN THIS WRITTEN AGREEMENT. NO OTHER WARRANTY, EXPRESS OR IMPLIED, ORAL OR WRITTEN, IS INCLUDED 
    IN THIS CONTRACT. WARRANTIES AND LIABILITIES ARE LIMITED TO THE ROOFING SYSTEM ONLY AND INVALID IF CONTRACT PAYMENT IS NOT RECEIVED IN FULL. IN 
    THE EVENT THAT THE MANUFACTURER OF ANYTHING INSTALLED HEREIN OFFERS A DIFFERENT WARRANTY. THEN OWNER
  </p>
</div>
`;

  const STANDARD_PROVISIONS_PAGE_3 = `
<div class="standard-provisions-page3" style="page-break-before: always; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4;">
  <h4 style="font-weight: bold; margin-top: 0; margin-bottom: 8px;">15. MOLD, ASBESTOS AND HAZARDOUS SUBSTANCES:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Owner hereby represents that Owner has no knowledge of the existence on or in any portion of the premises affected by the Project of any asbestos, 
    lead paint, mold (including all types of microbial matter or microbiological contamination, mildew of fungus, or other hazardous materials). Testing 
    for the existence of mold and other hazardous materials shall only be performed as expressly stated in writing. Contractor shall not be testing or 
    performing any work whatsoever in an area that is not identified in the Scope of Work.
  </p>
  <p style="text-align: justify; margin-bottom: 12px;">
    Unless the contract specifically calls for the removal, disturbance, or transportation of asbestos, polychlorinated biphenyl (PCB), mold, lead paint, 
    or other hazardous substances or materials, the parties acknowledge that such work requires special procedures, precautions, and/or licenses. Therefore, 
    unless the contract specifically calls for same, if Contractor encounters such substance, Contractor shall immediately stop work and allow the Owner 
    to obtain a duly qualified asbestos and/or hazardous material contractor to perform the work or Contractor may perform the work itself at Contractor's 
    option. Said work will be treated as an extra under this contract, and the Contract Term setting forth the time for completion of the project may be delayed.
  </p>
  <p style="text-align: justify; margin-bottom: 12px;">
    In the event that mold or microbial contamination is removed by Contractor, Owner understands and agrees that due to the unpredictable characteristics 
    of mold and microbial contamination, Contractor shall not be responsible for any recurring incidents of mold or microbial contamination appearing in the 
    same or any adjacent location, subsequent to the completion of the work performed by Contractor. Owner agrees to hold Contractor harmless, and shall 
    indemnify Contractor harmless for any occurrence or recurrence of mold or microbial contamination. Owner also agrees that Contractor shall not be 
    responsible, and agrees to hold Contractor harmless and indemnify Contractor, for the existence of mold or microbial contamination in any area that 
    Contractor was not contracted to test and/or remediate. Further, Owner is hereby informed, and hereby acknowledges, that most insurers expressly disclaim 
    coverage for any actual or alleged damages arising from mold or microbial contamination. Contractor makes no representations whatsoever as to coverage for 
    mold contamination, though at Owner's additional expense, if requested in writing, Contractor will inquire as to the availability of additional coverage 
    for such contamination or remediation, and if available, will obtain such coverage if the additional premium is paid for by Owner as an extra.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 15px; margin-bottom: 8px;">16. COMMENCED WORK:</h4>
  <p style="text-align: justify; margin-bottom: 12px;">
    Contractor shall be deemed to have substantially commenced work at the earlier of (1) the time materials or equipment are delivered to the jobsite, or 
    (2) the time removal or modification for any existing roof covering begins. Contractor's failure to substantially commence work within 20 days from the 
    approximate date specified on the Agreement is a violation of the Contractor's License Law and buyer shall have the right to cancel this contract unless 
    the Contractor has a legal excuse for such delay. The Contractor shall be excused for any delay in starting or completion of the contract caused by acts 
    of God, acts of the owner or the owner's agent, employee or independent contractor, stormy weather, labor trouble, acts of public utilities, public bodies 
    or inspectors extra work, failure of the owner to make progress payments promptly, or other contingencies unforeseeable by or beyond the reasonable control 
    of the contractor. Should work not commence on the roof within 180 days of acceptance of this Agreement, then either party shall have the right to cancel 
    the Agreement.
  </p>
</div>
`;

  const MECHANICS_LIEN_WARNING = `
<div class="mechanics-lien-page" style="page-break-before: always; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4;">
  <h3 style="font-weight: bold; margin-bottom: 15px;">MECHANICS LIEN WARNING:</h3>
  <p>
    Anyone who helps improve your property, but who is not paid, may record what is called a mechanics lien on your property. 
    A mechanics lien is a claim, like a mortgage or home equity loan, made against your property and recorded with the county recorder.
  </p>
  <p>
    Even if you pay your contractor in full, unpaid subcontractors, suppliers, and laborers who helped to improve your property 
    may record mechanics liens and sue you in court to foreclose the lien. If a court finds the lien is valid, you could be forced 
    to pay twice or have a court officer sell your home to pay the lien. Liens can also affect your credit.
  </p>
  <p>
    To preserve their right to record a lien, each subcontractor and material supplier must provide you with a document called a 
    'Preliminary Notice.' This notice is not a lien. The purpose of the notice is to let you know that the person who sends you 
    the notice has the right to record a lien on your property if he or she is not paid.
  </p>
  <p>
    <strong>BE CAREFUL.</strong> The Preliminary Notice can be sent up to 20 days after the subcontractor starts work or the supplier 
    provides material. This can be a big problem if you pay your contractor before you have received the Preliminary Notices.
  </p>
  <p>
    You will not get Preliminary Notices from your prime contractor or other persons you contract with directly or from laborers who 
    work on your project. The law assumes that you already know they are improving your property.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">PROTECT YOURSELF FROM LIENS.</h4>
  <p>
    You can protect yourself from liens by getting a list from your contractor of all the subcontractors and material suppliers that 
    work on your project. Find out from your contractor when these subcontractors started work and when these suppliers delivered goods 
    or materials. Then wait 20 days, paying attention to the Preliminary Notices you receive.
  </p>
  
  <h4 style="font-weight: bold; margin-top: 20px; margin-bottom: 10px;">PAY WITH JOINT CHECKS.</h4>
  <p>
    One way to protect yourself is to pay with a joint check. When your contractor tells you it is time to pay for the work of a 
    subcontractor or supplier who has provided you with a Preliminary Notice, write a joint check payable to both the contractor and 
    the subcontractor or material supplier.
  </p>
  <p>
    For other ways to prevent liens, visit CSLB's Web site at www.cslb.ca.gov or call CSLB at 800-321-CSLB (2752).
  </p>
  <p style="font-weight: bold; margin-top: 15px;">
    REMEMBER, IF YOU DO NOTHING, YOU RISK HAVING A LIEN PLACED ON YOUR HOME. This can mean that you may have to pay twice, or face 
    the forced sale of your home to pay what you owe.
  </p>
</div>
`;

  const NOTICE_OF_CANCELLATION = `
<div class="cancellation-form-page" style="page-break-before: always; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4;">
  <h3 style="font-weight: bold; margin-bottom: 20px; text-align: center;">Notice of Cancellation Form</h3>
  
  <p style="margin-bottom: 25px;"><strong>Date of Transaction:</strong> _______________________________</p>
  
  <p style="margin-bottom: 25px;"><strong>Project address:</strong> _______________________________</p>
  
  <p style="margin-bottom: 25px;"><strong>Buyers Name:</strong> _______________________________</p>
  
  <p style="text-align: justify; margin: 25px 0;">
    You may cancel this transaction without any penalty or obligation within three (3) business days from the above date. 
    If you cancel, any property traded in, any payments made by you under the contract or sale, and any negotiable instrument 
    executed by you will be returned within 10 business days following receipt by the seller of your cancellation notice, and 
    any security interest arising out of the transaction will be cancelled.
  </p>
  
  <p style="text-align: justify; margin: 25px 0;">
    If you cancel, you must make available to the seller at your residence, in substantially as good a condition as when received, 
    any goods delivered to you under this contract or sale; or you may, if you wish, comply with the return shipment of the goods 
    at the seller's expense and risk. If you do make the goods available to the seller and the seller does not pick them up within 
    20 days of the date of your cancellation, you may retain or dispose of the goods without any further obligation. If you fail to 
    make the goods available to the seller, or if you agree to return the goods to the seller and fail to do so, then you remain 
    liable for performance of all obligations under the contract.
  </p>
  
  <p style="text-align: justify; margin: 25px 0;">
    To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice or any other written notice to
  </p>
  
  <p style="text-align: center; font-weight: bold; margin: 25px 0;">
    THE ROOFING FRIEND, INC at 211 Jackson St. Hayward, CA 94544<br/>
    not later than Midnight of the third day after signing.
  </p>
  
  <div style="margin-top: 60px;">
    <p style="font-weight: bold; margin-bottom: 5px;">I HEREBY CANCEL THIS TRANSACTION</p>
    
    <div style="margin-top: 40px;">
      <p style="border-bottom: 2px solid #000; width: 300px; padding-bottom: 2px; margin-bottom: 5px;"></p>
      <p style="font-size: 10pt;">DATE</p>
    </div>
    
    <div style="margin-top: 40px;">
      <p style="border-bottom: 2px solid #000; width: 300px; padding-bottom: 2px; margin-bottom: 5px;"></p>
      <p style="font-size: 10pt;">Buyers Signature</p>
    </div>
  </div>
</div>
`;

  const projectPhotoHTML = data.projectPhotoUrl ? `
    <div style="text-align: center; margin: 20px 0;">
      <img src="${data.projectPhotoUrl}" alt="Project" style="max-width: 500px; max-height: 300px; border: 1px solid #ccc;" />
    </div>
  ` : (!data.projectPhotoUrl && data.beforePhotoUrl && data.afterPhotoUrl) ? `
    <div style="margin: 20px 0;">
      <div style="display: flex; gap: 10px; justify-content: center;">
        <div style="flex: 1; max-width: 250px; text-align: center;">
          <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">Current</div>
          <img src="${data.beforePhotoUrl}" alt="Current" style="width: 100%; height: 200px; object-fit: cover; border: 1px solid #ccc;" />
        </div>
        <div style="flex: 1; max-width: 250px; text-align: center;">
          <div style="font-weight: bold; font-size: 10pt; margin-bottom: 5px;">Proposed</div>
          <img src="${data.afterPhotoUrl}" alt="Proposed" style="width: 100%; height: 200px; object-fit: cover; border: 1px solid #ccc;" />
        </div>
      </div>
    </div>
  ` : '';

  const paymentRows = data.paymentSchedule.milestones.map(milestone => `
    <tr>
      <td style="padding: 10px; border: 1px solid #333;">${milestone.label}</td>
      <td style="padding: 10px; border: 1px solid #333; text-align: right;">$${milestone.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
      font-size: 11pt; 
      line-height: 1.5; 
      color: #000;
      margin: 0;
      padding: 54px 54px;
      max-width: 8.5in;
      box-sizing: border-box;
    }
    .content-wrapper {
      width: 100%;
      max-width: 7in;
      margin: 0 auto;
    }
    .page-break {
      page-break-before: always;
      padding-top: 0;
    }
    table { 
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      box-sizing: border-box;
    }
    td { 
      padding: 10px 12px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    th {
      padding: 12px;
      border: 1px solid #ddd;
      background-color: #f8f8f8;
      font-weight: bold;
      text-align: left;
    }
    h1 { 
      font-size: 18pt; 
      font-weight: bold; 
      margin: 24px 0; 
      text-align: center;
      letter-spacing: 0.5px;
    }
    h2 { 
      font-size: 14pt; 
      font-weight: bold; 
      margin: 22px 0 14px 0;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
    }
    h3 { 
      font-size: 12pt; 
      font-weight: bold; 
      margin: 20px 0 12px 0;
      color: #222;
    }
    p { 
      margin: 8px 0;
      text-align: justify;
      word-wrap: break-word;
    }
    ul {
      margin: 12px 0;
      padding-left: 24px;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="/images/logo.png" alt="The Roofing Friend" style="width: 120px; height: auto;" />
  </div>
  ${projectPhotoHTML}
  
  <h1>AGREEMENT</h1>
  <p style="text-align: center; margin-bottom: 30px; font-size: 10.5pt; color: #444;">Project from ${new Date(data.preparedOn).toLocaleDateString('en-US')}</p>
  
  <table style="border: none; margin-bottom: 30px;">
    <tr>
      <td style="border: none; vertical-align: top; width: 50%; padding-right: 20px;">
        <h3>CUSTOMER</h3>
        <p>${data.customerName}<br/>${data.jobsiteAddress}<br/>${data.customerPhone}</p>
      </td>
      <td style="border: none; vertical-align: top; width: 50%;">
        <h3>PREPARED BY</h3>
        <p>${data.preparedBy}<br/>Rooffriend<br/>${COMPANY_INFO.legalName}<br/>${COMPANY_INFO.licenseNumber}<br/>${COMPANY_INFO.phone}<br/>${COMPANY_INFO.email}</p>
      </td>
    </tr>
  </table>

  <div class="page-break"></div>
  <h2>Contract Items</h2>
  
  <h3>Scope of Work</h3>
  <div style="white-space: pre-wrap; margin: 12px 0 28px 0; text-align: justify; line-height: 1.6;">${data.scopeOfWork}</div>
  
  <h3>Roofing System Options</h3>
  <table style="margin: 15px 0; border: 2px solid #333;">
    <tr>
      <th style="text-align: left;">System</th>
      <th style="text-align: right;">Total</th>
    </tr>
    <tr>
      <td>Recommended System</td>
      <td style="text-align: right; font-weight: bold;">$${data.contractPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
    </tr>
  </table>
  
  <p style="font-size: 14pt; font-weight: bold; margin: 24px 0 18px 0;">Contract Total: $${data.contractPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>

  <h3>ACCEPTANCE</h3>
  <p style="text-align: justify; margin-bottom: 8px;">
    ☐ Customer acknowledges they have been provided copies of the terms and conditions of this Agreement, 
    including the arbitration provision, and have reviewed such terms and conditions and agree to be bound by them.
  </p>

  <h3>RELEASE</h3>
  <p style="text-align: justify; margin-bottom: 8px;">
    Owner, for itself and its heirs, successors and assigns, releases and discharges THE ROOFING FRIEND, INC and its 
    officers, directors, agents, employees, representatives, successors and assigns from any and all claims, actions or 
    causes of actions for injury, loss or damage to persons or property which Owner now has or in the future may have 
    arising out of or in any way connected with the Project, except for such injury, loss or damage caused by THE ROOFING 
    FRIEND, INC's gross negligence or willful misconduct. Owner further agrees to defend, indemnify and hold harmless 
    THE ROOFING FRIEND, INC from any and all claims, suits, damages, costs and attorney fees arising out of or in any 
    way connected with the Project.
  </p>

  <h3>ACKNOWLEDGMENT</h3>
  <p style="text-align: justify; margin-bottom: 8px;">
    ☐ Customer acknowledges that they have received and read, and understand that they are bound by, the following documents 
    which are incorporated by reference: (1) NOTICE OF CANCELLATION FORM, (2) MECHANICS LIEN WARNING, and (3) all Standard Provisions.
  </p>

  <h3>List of Documents to be Incorporated</h3>
  <p style="text-align: justify; margin-bottom: 15px;">
    The following documents are incorporated into and made part of this Agreement: Plans, specifications, change orders, 
    addenda, and all documents referenced in this Agreement.
  </p>

  <h3>Information about the Contractors' State License Board (CSLB)</h3>
  <p style="text-align: justify; margin-bottom: 8px;">
    CSLB is the state consumer protection agency that licenses and regulates construction contractors.
  </p>

  <p style="text-align: justify; margin-bottom: 15px; margin-top: 12px;">
    Contact CSLB for information about the licensed contractor you are considering, including information about discloseable 
    complaints, disciplinary action and civil judgement that are reported to CSLB.
  </p>
  
  <p style="margin: 20px 0 10px 0;"><strong>Initial the appropriate line:</strong></p>
  <p style="margin-bottom: 25px;">
    ________________ The law requires that the contractor give you notice explaining your right to cancel. 
    Initial the line if the contractor has given you a "Notice of the Three-Day Right to Cancel."
  </p>

  <div class="page-break"></div>
  
  <h3>Schedule of Payments</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 2px solid #333;">
    <thead>
      <tr style="background: #f8f8f8;">
        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Payment</th>
        <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Amount</th>
        <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Timing</th>
      </tr>
    </thead>
    <tbody>
      ${paymentRows}
      <tr style="font-weight: bold; background: #f8f8f8;">
        <td colspan="2" style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">Total Contract Amount:</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">$${data.contractPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div style="margin-top: 100px;">
    <table style="border: none; width: 100%;">
      <tr>
        <td style="border: none; width: 50%; vertical-align: bottom; padding-right: 30px;">
          <p style="margin-bottom: 40px;">X _________________________________</p>
          <p style="font-size: 10pt; margin: 0;">Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</p>
        </td>
        <td style="border: none; width: 50%; vertical-align: bottom; padding-left: 30px;">
          <p style="margin-bottom: 40px;">X ${data.preparedBy} - Owner &nbsp;&nbsp;&nbsp; ${new Date().toLocaleDateString('en-US')}</p>
          <p style="font-size: 10pt; margin: 0;">Signature &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Date</p>
        </td>
      </tr>
      </table>
    </div>
  </div>

  <div class="page-break"></div>
  <h2 style="text-align: center; font-size: 16pt; margin: 0 0 20px 0; font-weight: bold;">STANDARD PROVISIONS</h2>
  ${STANDARD_PROVISIONS}
  ${STANDARD_PROVISIONS_PAGE_2}
  ${STANDARD_PROVISIONS_PAGE_3}
  ${MECHANICS_LIEN_WARNING}
  ${NOTICE_OF_CANCELLATION}
  </div>
</body>
</html>
  `;
}
