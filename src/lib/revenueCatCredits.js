import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';
import { supabase } from './supabase';

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra || {};

const REVENUECAT_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || extra.revenueCatIosApiKey,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || extra.revenueCatAndroidApiKey,
};

let configuredUserId = null;

function getRevenueCatApiKey() {
  if (Platform.OS === 'ios') return REVENUECAT_KEYS.ios;
  if (Platform.OS === 'android') return REVENUECAT_KEYS.android;
  return null;
}

function getPackageProductId(pkg) {
  return Platform.OS === 'ios'
    ? pkg?.apple_product_id
    : pkg?.google_product_id;
}

export function isIapSupported() {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function configureRevenueCat(userId) {
  if (!isIapSupported()) {
    return { success: false, error: 'unsupported_platform' };
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey || apiKey.includes('replace_')) {
    return { success: false, error: 'missing_revenuecat_key' };
  }

  if (configuredUserId === userId) return { success: true };

  Purchases.configure({ apiKey, appUserID: userId });
  configuredUserId = userId;
  return { success: true };
}

export async function getCreditStoreProducts(packages = [], userId) {
  const configured = await configureRevenueCat(userId);
  if (!configured.success) return { ...configured, productsById: {} };

  const productIds = packages
    .map(getPackageProductId)
    .filter(Boolean);

  if (productIds.length === 0) {
    return { success: true, productsById: {} };
  }

  try {
    const products = await Purchases.getProducts(productIds, Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    const productsById = products.reduce((acc, product) => {
      acc[product.identifier] = product;
      return acc;
    }, {});
    return { success: true, productsById };
  } catch (error) {
    return { success: false, error: error.message || 'load_products_failed', productsById: {} };
  }
}

export async function purchaseCreditPackage(pkg, userId) {
  const configured = await configureRevenueCat(userId);
  if (!configured.success) return configured;

  const productId = getPackageProductId(pkg);
  if (!productId) return { success: false, error: 'missing_product_id' };

  try {
    const products = await Purchases.getProducts([productId], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
    const product = products?.[0];
    if (!product) return { success: false, error: 'product_not_found' };

    await Purchases.purchaseStoreProduct(product);

    return {
      success: true,
      productId,
      packageId: pkg.id,
      pendingCredit: true,
    };
  } catch (error) {
    if (error?.userCancelled) {
      return { success: false, cancelled: true, error: 'cancelled' };
    }
    return { success: false, error: error.message || 'purchase_failed' };
  }
}

export async function refreshAfterCreditPurchase(delayMs = 1800) {
  await new Promise(resolve => setTimeout(resolve, delayMs));

  const [{ data: userData }, { data: txData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('alimtalk_transactions')
      .select('id, type, credits_change, balance_after, created_at')
      .eq('type', 'charge')
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  return {
    success: true,
    userId: userData?.user?.id || null,
    latestCharge: txData?.[0] || null,
  };
}
