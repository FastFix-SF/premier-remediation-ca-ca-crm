import React from 'react';
import { Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from './styles';
import { format } from 'date-fns';

interface ContractPage1Props {
  data: {
    agreementNumber: string;
    contractDate?: string;
    projectPhoto?: string;
    beforePhoto?: string;
    afterPhoto?: string;
    customer: {
      name: string;
      address: string;
      phone: string;
      email: string;
    };
    jobsiteAddress: string;
    preparedBy: string;
    companyInfo: {
      name: string;
      legalName: string;
      licenseNumber: string;
      phone: string;
      email: string;
    };
    contractPrice: number;
    payments: {
      deposit: number;
      materialPayment: number;
      progressPayment?: number;
      finalPayment: number;
    };
    scopeOfWork: string;
  };
}

export const ContractPage1: React.FC<ContractPage1Props> = ({ data }) => {
  const contractDate = data.contractDate || format(new Date(), 'MM/dd/yyyy');
  
  return (
    <Page size="LETTER" style={styles.page}>
      {/* Title */}
      <Text style={styles.title}>AGREEMENT</Text>
      <Text style={styles.subtitle}>Project from {contractDate}</Text>
      
      {/* Two-column info block */}
      <View style={styles.infoBlock}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoHeading}>CUSTOMER</Text>
          <Text style={styles.infoText}>{data.customer.name}</Text>
          <Text style={styles.infoText}>{data.jobsiteAddress || data.customer.address}</Text>
          <Text style={styles.infoText}>{data.customer.phone}</Text>
          <Text style={styles.infoText}>{data.customer.email}</Text>
        </View>
        
        <View style={styles.infoColumn}>
          <Text style={styles.infoHeading}>PREPARED BY</Text>
          <Text style={styles.infoText}>{data.preparedBy}</Text>
          <Text style={styles.infoText}>RoofFriend</Text>
          <Text style={styles.infoText}>{data.companyInfo.legalName}</Text>
          <Text style={styles.infoText}>{data.companyInfo.licenseNumber}</Text>
          <Text style={styles.infoText}>{data.companyInfo.phone}</Text>
          <Text style={styles.infoText}>{data.companyInfo.email}</Text>
        </View>
      </View>
      
      {/* Divider */}
      <View style={styles.divider} />
      
      {/* Project Photo below divider - Single image or Before/After comparison */}
      {data.projectPhoto && (
        <Image src={data.projectPhoto} style={styles.projectPhoto} />
      )}
      
      {!data.projectPhoto && data.beforePhoto && data.afterPhoto && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 10, textAlign: 'center', color: '#1a1a1a' }}>
            Design Transformation
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 5, textAlign: 'center', color: '#666' }}>Current</Text>
              <Image src={data.beforePhoto} style={{ width: '100%', height: 200, objectFit: 'cover', border: '1px solid #ccc' }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 5, textAlign: 'center', color: '#666' }}>Proposed</Text>
              <Image src={data.afterPhoto} style={{ width: '100%', height: 200, objectFit: 'cover', border: '1px solid #ccc' }} />
            </View>
          </View>
        </View>
      )}
    </Page>
  );
};
