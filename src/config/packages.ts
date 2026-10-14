import packagesConfigJson from './packages.config.json';
import { GroundedCatalog, PackageDefinition, AddonDefinition } from '../lib/types';

export const groundedCatalog: GroundedCatalog = packagesConfigJson as GroundedCatalog;

export function getPackagesConfig(): GroundedCatalog {
  return groundedCatalog;
}

export function getPackageById(id: string): PackageDefinition | undefined {
  return groundedCatalog.packages.find(
    (p) => p.id.toLowerCase() === id.toLowerCase()
  );
}

export function getAllowedAddonById(id: string): AddonDefinition | undefined {
  return groundedCatalog.addons.find(
    (a) => a.id.toLowerCase() === id.toLowerCase()
  );
}

/**
 * Validates whether a proposed price is 100% grounded against the official config.
 * Zero tolerance for hallucinated discounts!
 */
export function isPriceGrounded(
  packageId: string,
  price: number,
  billingCycle: 'monthly' | 'annual' = 'monthly'
): { valid: boolean; officialPrice: number; diff: number } {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return { valid: false, officialPrice: 0, diff: price };
  }

  const officialPrice =
    billingCycle === 'annual' ? pkg.pricing.annual : pkg.pricing.monthly;
  const valid = price === officialPrice;
  return {
    valid,
    officialPrice,
    diff: price - officialPrice,
  };
}

/**
 * Intelligent deterministic package matcher based on qualified criteria
 */
export function matchGroundedPackage(
  budget?: number | string,
  teamSize?: number | string,
  needsEnterpriseFeatures?: boolean
): PackageDefinition {
  if (needsEnterpriseFeatures) {
    return getPackageById('enterprise')!;
  }

  // Parse numeric team size
  let parsedSeats = 1;
  if (typeof teamSize === 'number') {
    parsedSeats = teamSize;
  } else if (typeof teamSize === 'string') {
    const match = teamSize.match(/\d+/);
    if (match) parsedSeats = parseInt(match[0], 10);
  }

  // Parse numeric budget
  let parsedBudget = 0;
  if (typeof budget === 'number') {
    parsedBudget = budget;
  } else if (typeof budget === 'string') {
    const clean = budget.replace(/[^0-9.]/g, '');
    if (clean) parsedBudget = parseFloat(clean);
  }

  if (parsedSeats > 25 || parsedBudget >= 3500) {
    return getPackageById('enterprise')!;
  } else if (parsedSeats > 5 || parsedBudget >= 1200) {
    return getPackageById('growth')!;
  } else {
    return getPackageById('starter')!;
  }
}

