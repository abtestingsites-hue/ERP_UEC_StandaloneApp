import type { InventoryStockMovement } from '../types';

export interface MovementTypeMeta {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  isAddition: boolean;
  isDeduction: boolean;
}

const KNOWN_MOVEMENT_TYPES: Record<string, MovementTypeMeta> = {
  PURCHASE: {
    label: 'Purchase Receipt',
    variant: 'success',
    isAddition: true,
    isDeduction: false,
  },
  STOCK_IN: {
    label: 'Stock In',
    variant: 'success',
    isAddition: true,
    isDeduction: false,
  },
  ISSUE: {
    label: 'Stock Issue',
    variant: 'danger',
    isAddition: false,
    isDeduction: true,
  },
  STOCK_OUT: {
    label: 'Stock Out',
    variant: 'danger',
    isAddition: false,
    isDeduction: true,
  },
  ADJUSTMENT: {
    label: 'Stock Adjustment',
    variant: 'warning',
    isAddition: false,
    isDeduction: false,
  },
  CURRENT_STOCK: {
    label: 'Opening / Snapshot',
    variant: 'outline',
    isAddition: false,
    isDeduction: false,
  },
  GRN: {
    label: 'Goods Receipt Note',
    variant: 'success',
    isAddition: true,
    isDeduction: false,
  },
  SUPPLIER_RETURN: {
    label: 'Supplier Return',
    variant: 'danger',
    isAddition: false,
    isDeduction: true,
  },
};

/**
 * Resolves metadata for any movement type string.
 * Gracefully provides safe fallback for unknown or future movement types.
 */
export const getMovementTypeMeta = (typeString?: string | null): MovementTypeMeta => {
  const normalized = String(typeString || '').trim().toUpperCase();

  if (KNOWN_MOVEMENT_TYPES[normalized]) {
    return KNOWN_MOVEMENT_TYPES[normalized];
  }

  // Safe fallback for unclassified or legacy custom types
  const formattedLabel = normalized
    ? normalized.charAt(0) + normalized.slice(1).toLowerCase().replace(/_/g, ' ')
    : 'Unknown Movement';

  return {
    label: formattedLabel,
    variant: 'outline',
    isAddition: false,
    isDeduction: false,
  };
};

/**
 * Returns a human-readable reference summary for a movement.
 */
export const formatMovementReference = (movement: Partial<InventoryStockMovement>): string => {
  if (movement.vendor) {
    return `Vendor: ${movement.vendor}`;
  }

  const parts = [movement.usageType, movement.issuedTo, movement.notes].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(' • ');
  }

  if (movement.referenceType) {
    const refIdSnippet = movement.referenceId ? ` (${movement.referenceId.slice(0, 8)})` : '';
    return `${movement.referenceType}${refIdSnippet}`;
  }

  return 'Direct Movement';
};

/**
 * Formats signed quantity display (+X or -X).
 */
export const formatSignedQuantity = (
  quantity: number,
  signedQuantity: number,
  movementType?: string
): { text: string; isNegative: boolean } => {
  const meta = getMovementTypeMeta(movementType);
  const qty = Math.abs(quantity);

  if (signedQuantity < 0 || meta.isDeduction) {
    return { text: `-${qty}`, isNegative: true };
  }

  if (signedQuantity > 0 || meta.isAddition) {
    return { text: `+${qty}`, isNegative: false };
  }

  return { text: String(signedQuantity || qty), isNegative: false };
};
