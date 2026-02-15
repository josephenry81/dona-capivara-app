/**
 * PIX Payment Generator - BR Code (EMVCo) Standard
 * Generates PIX "Copia e Cola" code with locked value
 *
 * @see https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 */

interface PixPayloadParams {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    amount: number;
    txid?: string; // Transaction ID (order number)
    description?: string;
}

/**
 * Calculate CRC16-CCITT checksum (required by PIX spec)
 */
function calculateCRC16(payload: string): string {
    const polynomial = 0x1021;
    let crc = 0xffff;

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc <<= 1;
            }
        }
        crc &= 0xffff;
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Format EMVCo TLV field
 * Format: ID (2 chars) + Length (2 chars) + Value
 */
function formatField(id: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return `${id}${length}${value}`;
}

/**
 * Generate PIX "Copia e Cola" payload
 * The amount is embedded in the code, so the customer CANNOT change it
 */
export function generatePixPayload({
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txid,
    description
}: PixPayloadParams): string {
    // Normalize inputs
    const normalizedName = merchantName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 25);

    const normalizedCity = merchantCity
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .substring(0, 15);

    // Format amount (2 decimal places, no thousands separator)
    const formattedAmount = amount.toFixed(2);

    // Build Merchant Account Information (ID 26)
    // GUI for PIX: br.gov.bcb.pix
    const gui = formatField('00', 'br.gov.bcb.pix');
    const key = formatField('01', pixKey);

    let merchantAccountInfo = gui + key;

    // Add description if provided (optional field 02)
    if (description) {
        const normalizedDesc = description
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .substring(0, 72);
        merchantAccountInfo += formatField('02', normalizedDesc);
    }

    // Build Additional Data Field (ID 62) - contains txid
    let additionalData = '';
    if (txid) {
        const normalizedTxid = txid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 25);
        additionalData = formatField('05', normalizedTxid);
    }

    // Build payload (order matters!)
    let payload = '';

    // 00 - Payload Format Indicator (mandatory, always "01")
    payload += formatField('00', '01');

    // 01 - Point of Initiation Method
    // "12" = Static QR with value (customer cannot change)
    payload += formatField('01', '12');

    // 26 - Merchant Account Information (PIX specific)
    payload += formatField('26', merchantAccountInfo);

    // 52 - Merchant Category Code (0000 = not informed)
    payload += formatField('52', '0000');

    // 53 - Transaction Currency (986 = BRL)
    payload += formatField('53', '986');

    // 54 - Transaction Amount (THE LOCKED VALUE!)
    payload += formatField('54', formattedAmount);

    // 58 - Country Code
    payload += formatField('58', 'BR');

    // 59 - Merchant Name
    payload += formatField('59', normalizedName);

    // 60 - Merchant City
    payload += formatField('60', normalizedCity);

    // 62 - Additional Data Field (txid for tracking)
    if (additionalData) {
        payload += formatField('62', additionalData);
    }

    // 63 - CRC16 (checksum - must be last!)
    // Add placeholder for CRC calculation
    payload += '6304';

    // Calculate and append CRC
    const crc = calculateCRC16(payload);
    payload = payload.slice(0, -4) + formatField('63', crc);

    return payload;
}

/**
 * Validate if a string is a valid PIX key
 */
export function isValidPixKey(key: string): boolean {
    // CPF: 11 digits
    if (/^\d{11}$/.test(key)) return true;

    // CNPJ: 14 digits
    if (/^\d{14}$/.test(key)) return true;

    // Phone: +55 followed by DDD and number
    if (/^\+55\d{10,11}$/.test(key)) return true;

    // Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return true;

    // Random key (EVP): UUID format
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return true;

    return false;
}

/**
 * Format PIX key for display
 */
export function formatPixKey(key: string): string {
    // CPF
    if (/^\d{11}$/.test(key)) {
        return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // CNPJ
    if (/^\d{14}$/.test(key)) {
        return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    // Phone
    if (/^\+55\d{10,11}$/.test(key)) {
        const numbers = key.slice(3);
        if (numbers.length === 11) {
            return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        }
        return `+55 (${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    }

    return key;
}
