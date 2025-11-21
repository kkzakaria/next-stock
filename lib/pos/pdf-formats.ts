/**
 * PDF Page Format Configurations
 * Defines page dimensions in points (1 inch = 72 points)
 * Conversion: millimeters × 2.8346 = points
 */

export const PAGE_FORMATS = {
  /**
   * Thermal 80mm receipt format
   * Common for POS thermal printers
   * Width: 80mm (~3.14 inches)
   * Height: Auto (continuous paper)
   * ~46 characters per line
   */
  THERMAL_80MM: {
    width: 226.77, // 80mm in points
    height: 'auto' as const,
    label: 'Thermique 80mm',
    description: 'Format caisse enregistreuse (imprimante thermique)',
  },

  /**
   * A6 format (105 × 148mm)
   * Compact format, good balance
   */
  A6: {
    width: 297.64, // 105mm in points
    height: 419.53, // 148mm in points
    label: 'A6 (105×148mm)',
    description: 'Format compact pour impression standard',
  },

  /**
   * A5 format (148 × 210mm)
   * Medium professional format
   */
  A5: {
    width: 419.53, // 148mm in points
    height: 595.28, // 210mm in points
    label: 'A5 (148×210mm)',
    description: 'Format moyen professionnel',
  },

  /**
   * A4 format (210 × 297mm)
   * Standard paper format
   */
  A4: {
    width: 595.28, // 210mm in points
    height: 841.89, // 297mm in points
    label: 'A4 (210×297mm)',
    description: 'Format standard pour archivage',
  },
} as const

export type PageFormat = keyof typeof PAGE_FORMATS

/**
 * Get page size configuration for react-pdf
 */
export function getPageSize(format: PageFormat) {
  const config = PAGE_FORMATS[format]
  return config.height === 'auto'
    ? { width: config.width }
    : { width: config.width, height: config.height }
}

/**
 * Get format-specific font sizes
 * Thermal printers need smaller fonts
 */
export function getFormatFontSizes(format: PageFormat) {
  const isThermal = format === 'THERMAL_80MM'

  return {
    body: isThermal ? 8 : 10,
    header: isThermal ? 12 : 16,
    subheader: isThermal ? 10 : 12,
    small: isThermal ? 7 : 8,
    total: isThermal ? 14 : 18,
  }
}

/**
 * Get format-specific spacing
 */
export function getFormatSpacing(format: PageFormat) {
  const isThermal = format === 'THERMAL_80MM'

  return {
    padding: isThermal ? 10 : 20,
    marginSmall: isThermal ? 5 : 10,
    marginMedium: isThermal ? 10 : 15,
    marginLarge: isThermal ? 15 : 20,
  }
}
