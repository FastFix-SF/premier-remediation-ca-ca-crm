import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

interface ReportSection {
  title: string;
  content: string;
  items?: string[];
}

interface ReportPhoto {
  url: string;
  base64?: string;
  caption: string;
}

interface FieldInspectionReportPDFProps {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLicense: string;
  logoBase64?: string;
  projectName: string;
  reportDate: string;
  reportCreatedDate?: string;
  reportNumber: string;
  sections: ReportSection[];
  photos: ReportPhoto[];
}

// Define static colors for PDF (no CSS variables)
const colors = {
  primary: '#1e4a6e',
  primaryLight: '#2563eb',
  text: '#1a1a1a',
  textMuted: '#666666',
  border: '#e5e5e5',
  background: '#f8f9fa',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
    paddingBottom: 16,
  },
  logo: {
    width: 65,
    height: 65,
    marginRight: 16,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  companyName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  companyDetail: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 2,
  },
  companyLicense: {
    fontSize: 9,
    color: colors.primaryLight,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  
  // Title section
  titleSection: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
    letterSpacing: 2,
    marginBottom: 16,
  },
  metaBox: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 6,
    alignSelf: 'center',
  },
  metaLine: {
    fontSize: 10,
    marginBottom: 4,
  },
  metaLabel: {
    fontFamily: 'Helvetica-Bold',
    color: colors.text,
  },
  metaValue: {
    color: colors.textMuted,
  },
  
  // Divider
  divider: {
    height: 2,
    backgroundColor: colors.primary,
    marginVertical: 20,
    opacity: 0.3,
  },
  
  // Section styles
  section: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionText: {
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  
  // List styles
  listItem: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    paddingLeft: 12,
    lineHeight: 1.5,
  },
  bullet: {
    fontSize: 10,
    color: colors.primary,
    marginRight: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  
  // Photo styles
  photoContainer: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    maxHeight: 280,
    objectFit: 'contain',
    borderRadius: 4,
    marginBottom: 8,
  },
  photoCaption: {
    fontSize: 9,
    color: colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  
  // Footer styles
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    paddingTop: 12,
  },
  footerTagline: {
    fontSize: 10,
    color: colors.primary,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  
  // Page number
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 20,
    right: 40,
    color: colors.textMuted,
  },
});

export const FieldInspectionReportPDF: React.FC<FieldInspectionReportPDFProps> = ({
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyLicense,
  logoBase64,
  projectName,
  reportDate,
  reportCreatedDate,
  reportNumber,
  sections,
  photos,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        {logoBase64 && <Image src={logoBase64} style={styles.logo} />}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.companyDetail}>{companyAddress}</Text>
          <Text style={styles.companyDetail}>{companyPhone} | {companyEmail}</Text>
          <Text style={styles.companyLicense}>{companyLicense}</Text>
        </View>
      </View>
      
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>FIELD INSPECTION REPORT</Text>
        <View style={styles.metaBox}>
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>Project: </Text>
            <Text style={styles.metaValue}>{projectName}</Text>
          </Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>Date: </Text>
            <Text style={styles.metaValue}>{reportCreatedDate || reportDate}</Text>
          </Text>
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>Report #: </Text>
            <Text style={styles.metaValue}>{reportNumber}</Text>
          </Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      {/* Report Sections */}
      {sections && sections.length > 0 && sections.map((section, i) => (
        <View key={i} style={styles.section}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          {section.content && <Text style={styles.sectionText}>{section.content}</Text>}
          {section.items?.map((item, j) => (
            <View key={j} style={styles.listItemRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listItem}>{item}</Text>
            </View>
          ))}
        </View>
      ))}
      
      {/* Photos */}
      {photos && photos.length > 0 && photos.some(p => p.base64) && (
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Photo Documentation</Text>
          {photos.filter(p => p.base64).map((photo, i) => (
            <View key={i} style={styles.photoContainer} wrap={false}>
              <Image src={photo.base64!} style={styles.photo} />
              {photo.caption && <Text style={styles.photoCaption}>{photo.caption}</Text>}
            </View>
          ))}
        </View>
      )}
      
      {/* Footer */}
      <View style={styles.footer} fixed>
        <Text style={styles.footerTagline}>"Quality Roofing, Trusted Results"</Text>
        <Text style={styles.footerText}>{companyPhone} | {companyEmail}</Text>
        <Text style={styles.footerText}>{companyAddress}</Text>
      </View>
      
      {/* Page Number */}
      <Text 
        style={styles.pageNumber} 
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
        fixed 
      />
    </Page>
  </Document>
);

export default FieldInspectionReportPDF;
