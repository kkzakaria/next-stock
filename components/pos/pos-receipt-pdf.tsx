/**
 * POS Receipt PDF Component
 * Generates PDF receipts using @react-pdf/renderer
 */

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import type { SaleData, PDFOptions } from '@/types/pos-pdf'
import {
  getPageSize,
  getFormatFontSizes,
  getFormatSpacing,
} from '@/lib/pos/pdf-formats'
import {
  formatReceiptDate,
  formatPaymentMethod,
  formatCurrency,
} from '@/lib/pos/pdf-utils'

interface POSReceiptPDFProps {
  saleData: SaleData
  options: PDFOptions
}

export function POSReceiptPDF({ saleData, options }: POSReceiptPDFProps) {
  const { format, qrCodeDataURL, logoDataURL } = options
  const pageSize = getPageSize(format)
  const fonts = getFormatFontSizes(format)
  const spacing = getFormatSpacing(format)

  // Create dynamic styles based on format
  const styles = StyleSheet.create({
    page: {
      padding: spacing.padding,
      fontSize: fonts.body,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    // Header section
    header: {
      alignItems: 'center',
      marginBottom: spacing.marginLarge,
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: spacing.marginSmall,
    },
    storeName: {
      fontSize: fonts.header,
      fontWeight: 'bold',
      marginBottom: spacing.marginSmall,
    },
    storeInfo: {
      fontSize: fonts.small,
      color: '#666',
      textAlign: 'center',
      marginBottom: 2,
    },
    // Sale info section
    saleInfo: {
      borderTop: '1px solid #333',
      borderBottom: '1px solid #333',
      paddingVertical: spacing.marginSmall,
      marginBottom: spacing.marginMedium,
    },
    saleInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    saleInfoLabel: {
      fontWeight: 'bold',
      fontSize: fonts.small,
    },
    saleInfoValue: {
      fontSize: fonts.small,
    },
    // QR code section
    qrContainer: {
      alignItems: 'center',
      marginVertical: spacing.marginMedium,
    },
    qrCode: {
      width: format === 'THERMAL_80MM' ? 50 : 60,
      height: format === 'THERMAL_80MM' ? 50 : 60,
    },
    qrLabel: {
      fontSize: fonts.small,
      color: '#666',
      marginTop: spacing.marginSmall,
    },
    // Items table
    tableHeader: {
      flexDirection: 'row',
      borderBottom: '1px solid #333',
      paddingBottom: 5,
      marginBottom: 5,
      fontWeight: 'bold',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottom: '0.5px solid #ddd',
      paddingVertical: 5,
    },
    colItem: {
      flex: 3,
      fontSize: fonts.small,
    },
    colQty: {
      flex: 1,
      textAlign: 'center',
      fontSize: fonts.small,
    },
    colPrice: {
      flex: 1.5,
      textAlign: 'right',
      fontSize: fonts.small,
    },
    colTotal: {
      flex: 1.5,
      textAlign: 'right',
      fontSize: fonts.small,
      fontWeight: 'bold',
    },
    productName: {
      fontWeight: 'bold',
    },
    productSku: {
      fontSize: fonts.small - 1,
      color: '#666',
      marginTop: 2,
    },
    // Totals section
    totals: {
      borderTop: '1px solid #333',
      paddingTop: spacing.marginMedium,
      marginTop: spacing.marginMedium,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
    },
    totalLabel: {
      fontSize: fonts.body,
      color: '#666',
    },
    totalValue: {
      fontSize: fonts.body,
      fontWeight: 'bold',
    },
    discountLabel: {
      fontSize: fonts.body,
      color: '#16a34a',
    },
    discountValue: {
      fontSize: fonts.body,
      fontWeight: 'bold',
      color: '#16a34a',
    },
    grandTotal: {
      borderTop: '2px solid #000',
      paddingTop: spacing.marginSmall,
      marginTop: spacing.marginSmall,
    },
    grandTotalLabel: {
      fontSize: fonts.total,
      fontWeight: 'bold',
    },
    grandTotalValue: {
      fontSize: fonts.total,
      fontWeight: 'bold',
    },
    // Notes section
    notes: {
      marginTop: spacing.marginMedium,
      paddingTop: spacing.marginMedium,
      borderTop: '0.5px solid #ddd',
    },
    notesLabel: {
      fontSize: fonts.small,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    notesText: {
      fontSize: fonts.small,
      color: '#666',
    },
    // Footer
    footer: {
      marginTop: spacing.marginLarge,
      paddingTop: spacing.marginMedium,
      borderTop: '0.5px solid #ddd',
      textAlign: 'center',
    },
    footerText: {
      fontSize: fonts.small,
      color: '#666',
      marginBottom: 3,
    },
    footerNote: {
      fontSize: fonts.small - 1,
      color: '#999',
      marginTop: 5,
    },
  })

  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        {/* Header with logo */}
        <View style={styles.header}>
          {logoDataURL && <Image src={logoDataURL} style={styles.logo} />}
          <Text style={styles.storeName}>{saleData.store.name}</Text>
          {saleData.store.address && (
            <Text style={styles.storeInfo}>{saleData.store.address}</Text>
          )}
          {saleData.store.phone && (
            <Text style={styles.storeInfo}>{saleData.store.phone}</Text>
          )}
        </View>

        {/* Sale info */}
        <View style={styles.saleInfo}>
          <View style={styles.saleInfoRow}>
            <Text style={styles.saleInfoLabel}>Ticket N°:</Text>
            <Text style={styles.saleInfoValue}>{saleData.sale_number}</Text>
          </View>
          <View style={styles.saleInfoRow}>
            <Text style={styles.saleInfoLabel}>Date:</Text>
            <Text style={styles.saleInfoValue}>
              {formatReceiptDate(saleData.created_at)}
            </Text>
          </View>
          <View style={styles.saleInfoRow}>
            <Text style={styles.saleInfoLabel}>Caissier:</Text>
            <Text style={styles.saleInfoValue}>
              {saleData.cashier.full_name}
            </Text>
          </View>
          <View style={styles.saleInfoRow}>
            <Text style={styles.saleInfoLabel}>Paiement:</Text>
            <Text style={styles.saleInfoValue}>
              {formatPaymentMethod(saleData.payment_method)}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Image src={qrCodeDataURL} style={styles.qrCode} />
          <Text style={styles.qrLabel}>Scanner pour vérifier</Text>
        </View>

        {/* Items table */}
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>Article</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {saleData.sale_items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colItem}>
                <Text style={styles.productName}>{item.product.name}</Text>
                <Text style={styles.productSku}>{item.product.sku}</Text>
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(saleData.subtotal)}
            </Text>
          </View>

          {saleData.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.discountLabel}>Remise:</Text>
              <Text style={styles.discountValue}>
                -{formatCurrency(saleData.discount)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (8.75%):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(saleData.tax)}
            </Text>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(saleData.total)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {saleData.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{saleData.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Merci de votre visite !
          </Text>
          <Text style={styles.footerText}>
            À bientôt
          </Text>
          <Text style={styles.footerNote}>
            Conservez ce ticket pour tout échange ou réclamation
          </Text>
        </View>
      </Page>
    </Document>
  )
}
