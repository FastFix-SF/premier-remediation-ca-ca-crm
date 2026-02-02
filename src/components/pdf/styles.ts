import { StyleSheet } from '@react-pdf/renderer';

export const colors = {
  black: '#000000',
  gray: '#666666',
  lightGray: '#F2F2F2',
  border: '#444444',
  borderLight: '#CCCCCC',
};

export const styles = StyleSheet.create({
  page: {
    padding: '0.75in',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header styles
  logo: {
    width: '1.4in',
    alignSelf: 'center',
    marginBottom: 12,
  },
  projectPhoto: {
    maxWidth: '6.5in',
    maxHeight: '5.5in',
    alignSelf: 'center',
    marginBottom: 16,
    objectFit: 'contain',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 24,
    color: colors.gray,
  },
  
  // Info block styles
  infoBlock: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  infoColumn: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  
  divider: {
    borderBottom: `1px solid ${colors.border}`,
    marginVertical: 16,
  },
  
  // Section styles
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 12,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.5,
    textAlign: 'justify',
    marginBottom: 10,
  },
  
  // Table styles
  table: {
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    padding: 8,
  },
  tableFooterRow: {
    flexDirection: 'row',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
  },
  tableCellHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    fontSize: 10,
  },
  tableCellRight: {
    fontSize: 10,
    textAlign: 'right',
  },
  
  // Signature styles
  signatureSection: {
    marginTop: 24,
  },
  signatureNotice: {
    fontSize: 9,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  signatureBlock: {
    flexDirection: 'row',
    marginTop: 16,
  },
  signatureColumn: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.black,
    marginBottom: 4,
    height: 20,
  },
  signatureLabel: {
    fontSize: 8,
    color: colors.gray,
  },
  
  // Standard provisions styles
  provisionsTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  provisionsHeading: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 12,
    marginBottom: 4,
  },
  provisionsText: {
    fontSize: 9.5,
    lineHeight: 1.25,
    textAlign: 'justify',
    marginBottom: 10,
  },
  
  // Footer
  pageNumber: {
    position: 'absolute',
    fontSize: 9,
    bottom: 30,
    right: 50,
    color: colors.gray,
  },
});
