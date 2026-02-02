import React from 'react';
import { Page, Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

interface ContractScopeOfWorkPageProps {
  scopeOfWork: string;
  contractPrice: number;
  payments: {
    deposit: number;
    materialPayment: number;
    progressPayment?: number;
    finalPayment: number;
  };
  customerName: string;
  companyName: string;
  contractDate?: string;
}

export const ContractScopeOfWorkPage: React.FC<ContractScopeOfWorkPageProps> = ({ 
  scopeOfWork, 
  contractPrice, 
  payments,
  customerName,
  companyName,
  contractDate
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculatePercentage = (amount: number) => {
    return ((amount / contractPrice) * 100).toFixed(1);
  };

  return (
    <Page size="LETTER" style={styles.page}>
      {/* Contract Items Section */}
      <Text style={styles.sectionHeading}>Contract Items</Text>
      <Text style={styles.subHeading}>Scope of Work</Text>
      <Text style={styles.bodyText}>{scopeOfWork}</Text>

      {/* Schedule of Payments */}
      <Text style={styles.sectionHeading}>Schedule of Payments</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.tableCellHeader}>Description</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCellHeader}>Amount</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCellHeader}>Percent</Text>
          </View>
        </View>

        {/* Deposit Row */}
        <View style={styles.tableRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.tableCell}>Deposit</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{formatCurrency(payments.deposit)}</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{calculatePercentage(payments.deposit)}%</Text>
          </View>
        </View>

        {/* Material Payment Row */}
        <View style={styles.tableRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.tableCell}>Material Payment</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{formatCurrency(payments.materialPayment)}</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{calculatePercentage(payments.materialPayment)}%</Text>
          </View>
        </View>

        {/* Progress Payment Row (if exists) */}
        {payments.progressPayment && payments.progressPayment > 0 && (
          <View style={styles.tableRow}>
            <View style={{ width: '60%' }}>
              <Text style={styles.tableCell}>Progress Payment</Text>
            </View>
            <View style={{ width: '20%' }}>
              <Text style={styles.tableCell}>{formatCurrency(payments.progressPayment)}</Text>
            </View>
            <View style={{ width: '20%' }}>
              <Text style={styles.tableCell}>{calculatePercentage(payments.progressPayment)}%</Text>
            </View>
          </View>
        )}

        {/* Final Payment Row */}
        <View style={styles.tableRow}>
          <View style={{ width: '60%' }}>
            <Text style={styles.tableCell}>Final Payment</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{formatCurrency(payments.finalPayment)}</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCell}>{calculatePercentage(payments.finalPayment)}%</Text>
          </View>
        </View>

        {/* Total Row */}
        <View style={[styles.tableRow, { backgroundColor: '#f3f4f6' }]}>
          <View style={{ width: '60%' }}>
            <Text style={styles.tableCellHeader}>Total</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCellHeader}>{formatCurrency(contractPrice)}</Text>
          </View>
          <View style={{ width: '20%' }}>
            <Text style={styles.tableCellHeader}>100.0%</Text>
          </View>
        </View>
      </View>

      {/* Signature Section */}
      <View style={{ marginTop: 40 }}>
        {/* First Signature Block */}
        <View style={styles.signatureBlock}>
          <View style={{ width: '70%' }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
          <View style={{ width: '25%', marginLeft: 10 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
        <Text style={[styles.bodyText, { marginTop: 5, marginBottom: 20 }]}>
          {customerName}
        </Text>

        {/* Second Signature Block */}
        <View style={styles.signatureBlock}>
          <View style={{ width: '70%' }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
          <View style={{ width: '25%', marginLeft: 10 }}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
        </View>
        <Text style={[styles.bodyText, { marginTop: 5 }]}>
          {companyName}
        </Text>
      </View>
    </Page>
  );
};
