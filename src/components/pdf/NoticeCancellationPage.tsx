import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';
import { companyConfig } from '@/config/company';

interface NoticeCancellationPageProps {
  contractDate?: string;
  jobsiteAddress: string;
  customerName: string;
}

export const NoticeCancellationPage: React.FC<NoticeCancellationPageProps> = ({
  contractDate,
  jobsiteAddress,
  customerName,
}) => {
  const formatDate = (date?: string) => {
    if (!date) return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={[styles.sectionHeading, { textAlign: 'center', marginBottom: 20 }]}>
        Notice of Cancellation Form
      </Text>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.bodyText}>
          <Text style={{ fontWeight: 'bold' }}>Date of Transaction:</Text> {formatDate(contractDate)}
        </Text>
      </View>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.bodyText}>
          <Text style={{ fontWeight: 'bold' }}>Project address:</Text> {jobsiteAddress}
        </Text>
      </View>
      
      <View style={{ marginBottom: 15 }}>
        <Text style={styles.bodyText}>
          <Text style={{ fontWeight: 'bold' }}>Buyers Name:</Text> {customerName}
        </Text>
      </View>
      
      <Text style={[styles.bodyText, { textAlign: 'justify', marginTop: 15, marginBottom: 15 }]}>
        You may cancel this transaction without any penalty or obligation within three (3) business days from the above date. 
        If you cancel, any property traded in, any payments made by you under the contract or sale, and any negotiable instrument 
        executed by you will be returned within 10 business days following receipt by the seller of your cancellation notice, and 
        any security interest arising out of the transaction will be cancelled.
      </Text>
      
      <Text style={[styles.bodyText, { textAlign: 'justify', marginTop: 15, marginBottom: 15 }]}>
        If you cancel, you must make available to the seller at your residence, in substantially as good a condition as when received, 
        any goods delivered to you under this contract or sale; or you may, if you wish, comply with the return shipment of the goods 
        at the seller's expense and risk. If you do make the goods available to the seller and the seller does not pick them up within 
        20 days of the date of your cancellation, you may retain or dispose of the goods without any further obligation. If you fail to 
        make the goods available to the seller, or if you agree to return the goods to the seller and fail to do so, then you remain 
        liable for performance of all obligations under the contract.
      </Text>
      
      <Text style={[styles.bodyText, { textAlign: 'justify', marginTop: 15, marginBottom: 15 }]}>
        To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice or any other written notice to
      </Text>
      
      <Text style={[styles.bodyText, { textAlign: 'center', fontWeight: 'bold', marginTop: 15, marginBottom: 15 }]}>
        {companyConfig.legalName} at {companyConfig.address.full}{'\n'}
        not later than Midnight of the third day after signing.
      </Text>
      
      <View style={{ marginTop: 40 }}>
        <Text style={[styles.bodyText, { fontWeight: 'bold', marginBottom: 5 }]}>
          I HEREBY CANCEL THIS TRANSACTION
        </Text>
        
        <View style={{ marginTop: 25 }}>
          <View style={{ borderBottom: 2, borderBottomColor: '#000', width: 300, paddingBottom: 2, marginBottom: 5 }} />
          <Text style={[styles.bodyText, { fontSize: 10 }]}>DATE</Text>
        </View>
        
        <View style={{ marginTop: 25 }}>
          <View style={{ borderBottom: 2, borderBottomColor: '#000', width: 300, paddingBottom: 2, marginBottom: 5 }} />
          <Text style={[styles.bodyText, { fontSize: 10 }]}>Buyers Signature</Text>
        </View>
      </View>
    </Page>
  );
};
