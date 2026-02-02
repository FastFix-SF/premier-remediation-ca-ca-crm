import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

export const StandardProvisionsPages: React.FC = () => {
  return (
    <>
      {/* Page 2 - Standard Provisions Part 1 */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.provisionsTitle}>STANDARD PROVISIONS</Text>
        
        <Text style={styles.provisionsHeading}>1. CHANGES IN THE WORK - CONCEALED CONDITIONS</Text>
        <Text style={styles.provisionsText}>
          Should the Owner, construction lender, or any public body or inspector direct any modification or addition to the work covered by this contract, 
          the contract price shall be adjusted accordingly. Modification or addition to the work shall be executed only when a Change Order has been signed 
          by both the Owner and THE ROOFING FRIEND, INC. The change in the Contract Price caused by such Change Order shall be agreed to in writing, or if 
          the parties are not in agreement as to the change in Contract Price, or whether the term(s) or work constitute a change. THE ROOFING FRIEND, INC's 
          actual cost of all labor, equipment, subcontracts and materials, plus 18% for its overhead and 20% for its profit shall be the change in Contract 
          Price. The Change Order may also increase the time within which the contract is to be completed.
        </Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC shall promptly notify the Owner of: (a) latent physical conditions at the site differing materially from those indicated 
          in this contract, or (b) unknown physical conditions differing materially from those ordinarily encountered and generally recognized as inherent 
          in work of the character provided for in this contract. Any expense incurred due to such conditions shall be paid for by Owner as added work. 
          No extra or change order work shall be required to be performed without prior written authorization or the person contracting for the construction 
          of the home improvement. Any Change Order forms for changes or extra work shall be incorporated in, and become a part of the contract. However, 
          in the event that the building department or the governing body requires a change or modification then THE ROOFING FRIEND, INC may make that 
          change prior to receiving written authorization and thereafter negotiate the effect of that change with the Owner. Payments for extra work will 
          be made as extra work progress, concurrently with progress payments. Any modification or addition after starting the roof (i.e. wood replacement, 
          additional layers or roof removal etc.) will be addressed with the owner before continuing.
        </Text>
        
        <Text style={styles.provisionsHeading}>2. OWNER'S RESPONSIBILITIES</Text>
        <Text style={styles.provisionsText}>
          The Owner is responsible to supply staging area and electrical utilities unless otherwise agreed to in writing. Electricity and staging area to 
          the site is necessary. The Owner agrees to allow and provide the contractor and his equipment access to the property. The Owner is responsible 
          for having sufficient funds to comply with this agreement. This is a cash transaction unless otherwise specified. The Owner is responsible to 
          remove or protect any personal property and the contractor is not responsible for the same nor for any carpets, drapes, furniture, driveway, 
          lawns, shrubs, etc. The Owner will point out and warrant the property lines to THE ROOFING FRIEND, INC. Spark arrestors, gutters, chimneys, 
          roof drains, etc., are continual maintenance items and should be cleaned, tightened, etc. yearly. THE ROOFING FRIEND, INC is not responsible 
          for any interior work on skylights, exhaust ducts, vent tubes, etc. Owner warrants to contractor that structures and access ways (i.e. driveways, 
          walkways, patios, etc.) covered by this contract are in good condition and that said structures and access ways will withstand weight or vibration 
          caused by the workmen, materials, suppliers or equipment used therein by Contractor.
        </Text>
        
        <Text style={styles.provisionsHeading}>A.</Text>
        <Text style={styles.provisionsText}>
          Contractor is not responsible for repitching, re-sloping or correcting existing roof surfaces to eliminate ponding or collection of water on 
          roofing products. Contractor is not responsible for pre-existing conditions or damages i.e., cracked driveway, sagging roof members, deflections 
          in the roof line or settling of the house, or damages incurred from prior roof leaks, or the repair of any such conditions. It is agreed Contractor 
          will not be held liable for oil canning or use of less than full length panels on roofs. Ponding of water in gutters caused by settling of home 
          or bows in the roof line of the home is not the responsibility of Contractor, when installing gutters, Contractor follows the roof line unless 
          homeowner specifies gutters should be slanted toward the outlets.
        </Text>
        
        <Text style={styles.provisionsHeading}>B.</Text>
        <Text style={styles.provisionsText}>
          Contractor is not responsible for power or phone lines, TV antennas, guide wires, cable service, satellite dishes, or adjustments of rooftop 
          equipment. These items may need service after job completion. All heat exhaust vent connections through the attic should be checked by the gas 
          provider after job completion.
        </Text>
        
        <Text style={styles.provisionsHeading}>C.</Text>
        <Text style={styles.provisionsText}>
          Contractor is not responsible for damage to property inside the building caused by vibration or the falling of objects from the roof. Homeowner 
          should take due care to ensure chandelier, crystal, painting, etc. are hung securely or wrapped to ensure no chipping or cracking occurs. 
          Contractor is not responsible for the loosening of screws, nails or cracking of tape between sheetrock, or dust and dirt falling between wood 
          slat, t-bar or drywall ceilings caused by vibrations associated with the reroofing process.
        </Text>
        
        <Text style={styles.provisionsHeading}>D.</Text>
        <Text style={styles.provisionsText}>
          Contractor will make every attempt to ensure flowers, trees, etc., are not damaged. However, the owner accepts that minor damage to plants, etc., 
          is unavoidable considering the nature of the job. Contractor does not warrant or guarantee to identify any/all damages due to dry rot, termite, 
          molds, fungus, etc. If damage is suspected or questioned, owner should have a specialist inspect.
        </Text>
        
        <Text style={styles.provisionsHeading}>E.</Text>
        <Text style={styles.provisionsText}>
          Contractor agrees to use reasonable care when moving, raising or lifting objects such as solar panels, gutters, conduits, signs, skylights, 
          air conditioners etc., but shall assume no responsibility for the operation of, or damage to, such objects. Solar panels and water lines must 
          be cut and drained before roofing.
        </Text>
        
        <Text style={styles.provisionsHeading}>F.</Text>
        <Text style={styles.provisionsText}>
          Replacement of existing flashings into, stucco, siding, skylight, chimney, walls, etc. is not included in agreement and will be based on time 
          and materials if required once roof is removed and inspected. Painting of stucco, siding, eave, gable, or wood replacement is not included in agreement.
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber} of 4`} fixed />
      </Page>
      
      {/* Page 3 - Standard Provisions Part 2 */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.provisionsHeading}>G.</Text>
        <Text style={styles.provisionsText}>
          Contractor is not responsible for any damage or injury due to entering or exiting the construction zone. Owner is responsible to keep self, 
          relatives, neighbors, visitors or any non-construction personnel away from the construction zone.
        </Text>
        
        <Text style={styles.provisionsHeading}>3. DELAYS AND INCREASES IN MATERIAL COSTS:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC shall be excused for any delay in completion of the contract caused by acts of God; stormy or inclement weather; 
          strikes, lockouts, boycotts, or other labor union activities; acts of Owner, of Owner's agent, or of Owner's employees or independent contractor, 
          disbursement of funds into funding control or escrow; acts of public utilities or public bodies; acts of public enemy, riots or civil commotion, 
          inability to secure material through regular recognized channels; imposition of Government priority or allocation of materials; delays caused by 
          inspection or changes ordered by the inspectors of authorized governmental bodies; changes requested by Owner; Owner's failure to make progress 
          payments promptly; failure of the issuance of all necessary building permits within a reasonable length of time; or other contingencies unforeseen 
          by THE ROOFING FRIEND, INC and beyond its reasonable control.
        </Text>
        <Text style={styles.provisionsText}>
          Additionally, while THE ROOFING FRIEND, INC believes that it can complete the Project without any increases in costs, to the extent that material 
          costs increase by more than 1% from the costs of said materials on the date this Agreement was signed, THE ROOFING FRIEND, INC shall be entitled 
          to an increase in the contract price equal to the increased cost above the 1% increase in material cost. To the extent material costs increase due 
          to delay caused by Owner, Owner's agents or separate contractors, THE ROOFING FRIEND, INC shall be entitled to all cost increases incurred as a 
          result, in addition to any extended field and home office expenses. There shall be no additional markup for overhead or profit on the increased 
          cost, except as otherwise indicated. Contractor has no liability for failures or availability in material caused by improper manufacturing or 
          ordering or defects in the product which are beyond the control of the contractor.
        </Text>
        
        <Text style={styles.provisionsHeading}>4. VALIDITY:</Text>
        <Text style={styles.provisionsText}>
          In case one or more of the provisions of this Agreement or any application thereof shall be invalid, unenforceable or illegal, the validity, 
          enforceability and legality of the remaining provisions and any other application shall not in any way be impaired thereby.
        </Text>
        
        <Text style={styles.provisionsHeading}>5. CLEAN-UP:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC will remove from Owner's property debris and surplus materials created by its operation and leave driveway/walkway in a 
          neat and broom clean condition. Contractor does not guarantee to remove every little piece of construction material from the yard, planters, 
          planter boxes, etc.
        </Text>
        
        <Text style={styles.provisionsHeading}>6. LIMITATIONS:</Text>
        <Text style={styles.provisionsText}>
          No Action of any character arising from or related to this contract, or the performance thereof, shall be commenced by either party against the 
          other more than two years after completion or cessation of work under this contract.
        </Text>
        
        <Text style={styles.provisionsHeading}>7. DESTRUCTION OF WORK:</Text>
        <Text style={styles.provisionsText}>
          If the project is destroyed or damaged by accident, disaster or calamity, such as fire, storm, earthquake, flood, landslide, or by theft, 
          vandalism, or another contractor's error, any work done by THE ROOFING FRIEND, INC in rebuilding or restoring the Project shall be paid by 
          the Owner as extra work.
        </Text>
        
        <Text style={styles.provisionsHeading}>8. SUBCONTRACTS:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC may subcontract portions of this work to properly licensed and qualified subcontractors.
        </Text>
        
        <Text style={styles.provisionsHeading}>9. FEES, TAXES AND ASSESSMENTS:</Text>
        <Text style={styles.provisionsText}>
          Taxes, Permits, Fees, and assessments of all descriptions will be paid for by Owner. THE ROOFING FRIEND, INC will obtain all required building 
          permits, at the sole expense of Owner. Upon demand by THE ROOFING FRIEND, INC, Owner shall provide ample funds to acquire any and all necessary 
          permits on a timely basis. Owner will pay assessments, and charges required by public bodies and utilities for the financing or repaying the cost 
          of sewers, storm drains, water services, school and school facilities, other utilities, hook-up charges and the like.
        </Text>
        
        <Text style={styles.provisionsHeading}>10. LABOR AND MATERIAL:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC shall pay all valid charges for labor and material incurred by THE ROOFING FRIEND, INC and used in the construction or 
          repair of the Project. THE ROOFING FRIEND, INC is excused from this obligation for bills received in any period during which the Owner is in 
          arrears in making progress payments to THE ROOFING FRIEND, INC. No Waiver or release of mechanic's lien given by THE ROOFING FRIEND, INC shall 
          be binding until all payments due to THE ROOFING FRIEND, INC when the release was executed have been made.
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber} of 4`} fixed />
      </Page>
      
      {/* Page 4 - Standard Provisions Part 3 */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.provisionsHeading}>11. PAYMENT AND RIGHT TO STOP WORK:</Text>
        <Text style={styles.provisionsText}>
          Past due payments shall bear interest at the rate of .004 per week (21% per annum), until paid in full. THE ROOFING FRIEND, INC shall have the 
          right to stop work if any payment shall not be made, when due, to THE ROOFING FRIEND, INC under this Agreement. THE ROOFING FRIEND, INC may keep 
          the job idle until all payments due are received. This remedy is in addition to any other right or remedy that THE ROOFING FRIEND, INC may have. 
          Such failure by Owner to make payment, when due, is a material breach of this agreement and homeowner is responsible for any damage to structure 
          caused by idleness for non or late payment as agreed. Completion of project is achieved when materials are installed as per manufacturers 
          instructions, or permit agency deems project finaled. If owner requests gutters, downspouts, section of roof, etc. left off, balance of final 
          payment minus requested items are due forthwith.
        </Text>
        
        <Text style={styles.provisionsHeading}>12. RIGHT TO CANCEL:</Text>
        <Text style={styles.provisionsText}>
          If cancellation is beyond the 3 or 7 day right, a fee may be kept for costs up to 100% of Deposit.
        </Text>
        
        <Text style={styles.provisionsHeading}>13. WEATHER AND OTHER DAMAGE:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC shall attempt to keep the project reasonably covered during the construction. However, Owner understands that unexpected 
          weather conditions can arise that might cause damage to the project or its contents. THE ROOFING FRIEND, INC shall not be responsible for any such 
          damage beyond its reasonable control.
        </Text>
        
        <Text style={styles.provisionsHeading}>14. WARRANTY:</Text>
        <Text style={styles.provisionsText}>
          THE ROOFING FRIEND, INC hereby warrants, subject to the Terms and Conditions set forth herein, that it will make all necessary repairs to leaks 
          which result from defects in workmanship and materials furnished by THE ROOFING FRIEND, INC at no cost to the Owner when those leaks occur within 
          the 5 year term of this warranty. Such repairs are expressly agreed to be the Owner's exclusive remedy. THE LIMITED LABOR WARRANTY PROVIDED BY 
          THE ROOFING FRIEND, INC IS ONLY AS CONTAINED WITHIN THIS WRITTEN AGREEMENT. NO OTHER WARRANTY, EXPRESS OR IMPLIED, ORAL OR WRITTEN, IS INCLUDED 
          IN THIS CONTRACT. WARRANTIES AND LIABILITIES ARE LIMITED TO THE ROOFING SYSTEM ONLY AND INVALID IF CONTRACT PAYMENT IS NOT RECEIVED IN FULL.
        </Text>
        
        <Text style={styles.provisionsHeading}>15. MOLD, ASBESTOS AND HAZARDOUS SUBSTANCES:</Text>
        <Text style={styles.provisionsText}>
          Owner hereby represents that Owner has no knowledge of the existence on or in any portion of the premises affected by the Project of any asbestos, 
          lead paint, mold (including all types of microbial matter or microbiological contamination, mildew of fungus, or other hazardous materials). Testing 
          for the existence of mold and other hazardous materials shall only be performed as expressly stated in writing. Contractor shall not be testing or 
          performing any work whatsoever in an area that is not identified in the Scope of Work.
        </Text>
        <Text style={styles.provisionsText}>
          Unless the contract specifically calls for the removal, disturbance, or transportation of asbestos, polychlorinated biphenyl (PCB), mold, lead paint, 
          or other hazardous substances or materials, the parties acknowledge that such work requires special procedures, precautions, and/or licenses. Therefore, 
          unless the contract specifically calls for same, if Contractor encounters such substance, Contractor shall immediately stop work and allow the Owner 
          to obtain a duly qualified asbestos and/or hazardous material contractor to perform the work.
        </Text>
        
        <Text style={styles.provisionsHeading}>16. COMMENCEMENT AND PROSECUTION OF WORK:</Text>
        <Text style={styles.provisionsText}>
          Work shall be deemed to have commenced when THE ROOFING FRIEND, INC begins work at the job site or orders materials, equipment, or supplies relating 
          to the job, whichever occurs first.
        </Text>
        
        <Text style={styles.pageNumber} render={({ pageNumber }) => `Page ${pageNumber} of 4`} fixed />
      </Page>
    </>
  );
};
