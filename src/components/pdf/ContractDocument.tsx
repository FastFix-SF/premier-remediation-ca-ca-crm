import React from 'react';
import { Document } from '@react-pdf/renderer';
import { ContractPage1 } from './ContractPage1';
import { ContractScopeOfWorkPage } from './ContractScopeOfWorkPage';
import { StandardProvisionsPages } from './StandardProvisionsPages';
import { MechanicsLienWarningPage } from './MechanicsLienWarningPage';
import { NoticeCancellationPage } from './NoticeCancellationPage';

interface ContractDocumentProps {
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

export const ContractDocument: React.FC<ContractDocumentProps> = ({ data }) => {
  return (
    <Document>
      <ContractPage1 data={data} />
      <ContractScopeOfWorkPage 
        scopeOfWork={data.scopeOfWork}
        contractPrice={data.contractPrice}
        payments={data.payments}
        customerName={data.customer.name}
        companyName={data.companyInfo.name}
        contractDate={data.contractDate}
      />
      <StandardProvisionsPages />
      <MechanicsLienWarningPage />
      <NoticeCancellationPage 
        contractDate={data.contractDate}
        jobsiteAddress={data.jobsiteAddress}
        customerName={data.customer.name}
      />
    </Document>
  );
};
