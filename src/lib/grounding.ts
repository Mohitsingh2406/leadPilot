import { getPackageById, getPackagesConfig, getAllowedAddonById } from '../config/packages';
import { SuggestedOffer } from './types';
import { SuggestOfferInput } from './schemas';

export interface GroundingValidationResult {
  valid: boolean;
  isHallucinated: boolean;
  hallucinationReason?: string;
  groundedOffer: SuggestedOffer;
  originalPrice: number;
  correctedPrice: number;
}

/**
 * Validates and strictly enforces grounding for offer suggestions.
 * Auto-corrects any hallucinated pricing to the official packages.config.json.
 */
export function validateAndEnforceGroundedOffer(
  input: SuggestOfferInput
): GroundingValidationResult {
  const config = getPackagesConfig();
  const pkg = getPackageById(input.packageId);

  if (!pkg) {
    // If package ID doesn't exist, fallback to starter
    const fallbackPkg = getPackageById('starter')!;
    const officialPrice =
      input.billingCycle === 'annual'
        ? fallbackPkg.pricing.annual
        : fallbackPkg.pricing.monthly;

    return {
      valid: false,
      isHallucinated: true,
      hallucinationReason: `Package ID '${input.packageId}' does not exist in grounded config. Fallback to Starter applied.`,
      groundedOffer: {
        packageId: 'starter',
        packageName: fallbackPkg.name,
        pricingTier: 'starter',
        billingCycle: input.billingCycle,
        price: officialPrice,
        currency: config.currency,
        features: fallbackPkg.features,
        recommendedAddons: [],
        rationale: input.rationale || 'Grounded to official Starter Launchpad tier.',
        grounded: true,
      },
      originalPrice: input.price,
      correctedPrice: officialPrice,
    };
  }

  const officialPrice =
    input.billingCycle === 'annual'
      ? pkg.pricing.annual
      : pkg.pricing.monthly;

  const isPriceDifferent = input.price !== officialPrice;

  // Validate addons against catalog
  const verifiedAddons: string[] = [];
  if (input.recommendedAddons && Array.isArray(input.recommendedAddons)) {
    for (const addonId of input.recommendedAddons) {
      if (getAllowedAddonById(addonId)) {
        verifiedAddons.push(addonId);
      }
    }
  }

  const isHallucinated = isPriceDifferent || (input.recommendedAddons?.length ?? 0) !== verifiedAddons.length;
  let hallucinationReason: string | undefined = undefined;

  if (isPriceDifferent) {
    hallucinationReason = `Hallucinated price $${input.price} was rejected. Strictly corrected to official grounded price $${officialPrice}/${input.billingCycle === 'annual' ? 'yr' : 'mo'}.`;
  }

  const groundedOffer: SuggestedOffer = {
    packageId: pkg.id,
    packageName: pkg.name,
    pricingTier: pkg.id,
    billingCycle: input.billingCycle,
    price: officialPrice,
    currency: config.currency,
    features: pkg.features,
    recommendedAddons: verifiedAddons,
    rationale: input.rationale,
    grounded: true,
  };

  return {
    valid: !isHallucinated,
    isHallucinated,
    hallucinationReason,
    groundedOffer,
    originalPrice: input.price,
    correctedPrice: officialPrice,
  };
}

/**
 * Scans an agent reply or text for hallucinated discount promises or invented pricing tiers
 */
export function scanTextForHallucinations(text: string): {
  hasHallucination: boolean;
  hallucinations: string[];
} {
  const hallucinations: string[] = [];
  const lower = text.toLowerCase();

  // Forbidden patterns: claims of unauthorized discounts
  const forbiddenPatterns = [
    { pattern: /\b(10%|20%|30%|40%|50%|60%|70%|80%|90%)\s*(off|discount)/i, reason: 'Promised unapproved percentage discount' },
    { pattern: /\b(special|custom|insider|secret|holiday)\s+discount\b/i, reason: 'Promised unapproved promotional discount' },
    { pattern: /\b(free\s+for\s+life|free\s+trial\s+for\s+6\s+months)\b/i, reason: 'Promised unapproved extended free trial' },
    { pattern: /\$\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\b(?!\s*(?:k|thousand))\b/i, check: (match: RegExpMatchArray) => {
      const val = parseInt(match[1].replace(/,/g, ''), 10);
      // Valid prices: 499, 1499, 3999, 4990, 14990, 39990, addons: 199, 399, 499, 799
      const allowed = [199, 399, 499, 799, 1499, 3999, 4990, 14990, 39990];
      if (val > 0 && !allowed.includes(val) && val < 499) {
        return `Invented sub-minimum price $${val}/mo`;
      }
      return null;
    }},
    { pattern: /free setup/i, reason: 'Promised unapproved free setup' },
    { pattern: /unlimited leads for starter/i, reason: 'Misrepresented package limits' },
  ];

  for (const item of forbiddenPatterns) {
    if (item.pattern.test(lower)) {
      if (item.check) {
        const match = lower.match(item.pattern);
        if (match) {
          const res = item.check(match);
          if (res) hallucinations.push(res);
        }
      } else if (item.reason) {
        hallucinations.push(item.reason);
      }
    }
  }

  return {
    hasHallucination: hallucinations.length > 0,
    hallucinations,
  };
}

