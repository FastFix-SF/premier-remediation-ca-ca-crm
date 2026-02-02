import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

export const MechanicsLienWarningPage: React.FC = () => {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={[styles.sectionHeading, { marginBottom: 10 }]}>MECHANICS LIEN WARNING:</Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        Anyone who helps improve your property, but who is not paid, may record what is called a mechanics lien on your property. 
        A mechanics lien is a claim, like a mortgage or home equity loan, made against your property and recorded with the county recorder.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        Even if you pay your contractor in full, unpaid subcontractors, suppliers, and laborers who helped to improve your property 
        may record mechanics liens and sue you in court to foreclose the lien. If a court finds the lien is valid, you could be forced 
        to pay twice or have a court officer sell your home to pay the lien. Liens can also affect your credit.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        To preserve their right to record a lien, each subcontractor and material supplier must provide you with a document called a 
        'Preliminary Notice.' This notice is not a lien. The purpose of the notice is to let you know that the person who sends you 
        the notice has the right to record a lien on your property if he or she is not paid.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        <Text style={{ fontWeight: 'bold' }}>BE CAREFUL.</Text> The Preliminary Notice can be sent up to 20 days after the subcontractor starts work or the supplier 
        provides material. This can be a big problem if you pay your contractor before you have received the Preliminary Notices.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        You will not get Preliminary Notices from your prime contractor or other persons you contract with directly or from laborers who 
        work on your project. The law assumes that you already know they are improving your property.
      </Text>
      
      <Text style={[styles.subHeading, { marginTop: 12, marginBottom: 6 }]}>PROTECT YOURSELF FROM LIENS.</Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        You can protect yourself from liens by getting a list from your contractor of all the subcontractors and material suppliers that 
        work on your project. Find out from your contractor when these subcontractors started work and when these suppliers delivered goods 
        or materials. Then wait 20 days, paying attention to the Preliminary Notices you receive.
      </Text>
      
      <Text style={[styles.subHeading, { marginTop: 12, marginBottom: 6 }]}>PAY WITH JOINT CHECKS.</Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        One way to protect yourself is to pay with a joint check. When your contractor tells you it is time to pay for the work of a 
        subcontractor or supplier who has provided you with a Preliminary Notice, write a joint check payable to both the contractor and 
        the subcontractor or material supplier.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        For other ways to prevent liens, visit CSLB's Web site at www.cslb.ca.gov or call CSLB at 800-321-CSLB (2752).
      </Text>
      
      <Text style={[styles.bodyText, { fontWeight: 'bold', marginBottom: 8 }]}>
        REMEMBER, IF YOU DO NOTHING, YOU RISK HAVING A LIEN PLACED ON YOUR HOME. This can mean that you may have to pay twice, 
        or face the forced sale of your home to pay what you owe.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (5)(A) A statement prepared by the board through regulation that emphasizes the value of commercial general liability insurance and 
        encourages the owner to verify the contractor's insurance coverage and status.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (B) A check box indicating whether or not the contractor carries commercial general liability insurance, and if that is the case, the name 
        and the telephone number of the insurer.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (c) The writing may also contain other matters agreed to by the parties to the contract. The writing shall be legible and shall clearly 
        describe any other document which is to be incorporated into the contract. Prior to commencement of any work, the owner shall be 
        furnished a copy of the written agreement, signed by the contractor. The provisions of this section are not exclusive and do not relieve 
        the contractor from compliance with all other applicable provisions of law.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (d) Every contract subject to the provisions of this section shall contain, in close proximity to the signatures of the owner and contractor, 
        a notice in at least 10-point boldface type or in all capital letters, stating that the owner has the right to require the contractor to have a 
        performance and payment bond and that the expense of the bond may be borne by the owner.
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (e) The requirements in paragraph (5) of subdivision (b) shall become operative three months after the board adopts the regulations 
        referenced in subparagraph (A) of paragraph (5) of subdivision (b).
      </Text>
      
      <Text style={[styles.bodyText, { marginBottom: 8 }]}>
        (f) This section shall become operative on January 1, 2006.
      </Text>
    </Page>
  );
};
