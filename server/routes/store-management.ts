import { RequestHandler } from 'express';
import { storeService } from '../services/store-service';
import { query } from '../db/connection';

// Helper to ensure param is a string
const getStringParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};


// ===== GOLD COIN PACKAGES =====

export const getStorePackages: RequestHandler = async (req, res) => {
  try {
    const packages = await storeService.getPackages();
    console.log('[Store Management] getStorePackages (admin) returned:', {
      count: packages.length,
      packages: packages.map(p => ({
        id: p.id,
        title: p.title,
        enabled: p.enabled,
        display_order: p.display_order,
        price_usd: p.price_usd,
        gold_coins: p.gold_coins,
        sweeps_coins: p.sweeps_coins
      }))
    });
    res.json({ success: true, data: packages });
  } catch (error) {
    console.error('Failed to get packages:', error);
    res.status(500).json({ error: 'Failed to get packages' });
  }
};

export const createStorePackage: RequestHandler = async (req, res) => {
  try {
    console.log('[Store Management] Creating package with request body:', req.body);
    const { title, description, price_usd, gold_coins, sweeps_coins, bonus_sc, bonus_percentage, is_popular, is_best_value, display_order } = req.body;

    // Validation
    if (!title || price_usd === undefined || gold_coins === undefined || sweeps_coins === undefined) {
      return res.status(400).json({ error: 'Missing required fields: title, price_usd, gold_coins, sweeps_coins' });
    }

    // Get the next display_order by finding the max existing one
    let nextOrder = 1;
    if (display_order === undefined || display_order === null) {
      const maxOrderResult = await query('SELECT MAX(display_order) as max_order FROM store_packs');
      const maxOrder = maxOrderResult.rows[0]?.max_order;
      nextOrder = (maxOrder ?? 0) + 1;
      console.log('[Store Management] No display_order provided, calculated nextOrder:', nextOrder);
    } else {
      nextOrder = parseInt(display_order);
    }

    const packageData = {
      title,
      description: description || '',
      price_usd: parseFloat(price_usd),
      gold_coins: parseInt(gold_coins),
      sweeps_coins: sweeps_coins ? parseFloat(sweeps_coins) : 0,
      bonus_percentage: bonus_percentage ? parseInt(bonus_percentage) : 0,
      is_popular: is_popular || false,
      is_best_value: is_best_value || false,
      display_order: nextOrder,
      enabled: true,
    };

    console.log('[Store Management] Package data to insert:', packageData);
    const newPackage = await storeService.createPackage(packageData);

    console.log('[Store Management] Created package:', {
      id: newPackage.id,
      title: newPackage.title,
      display_order: newPackage.display_order,
      enabled: newPackage.enabled,
      all_fields: newPackage
    });
    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    console.error('[Store Management] Failed to create package:', error);
    res.status(500).json({ error: 'Failed to create package', details: String(error) });
  }
};

export const updateStorePackage: RequestHandler = async (req, res) => {
  try {
    const id = getStringParam(req.params.id);
    const { title, description, price_usd, gold_coins, sweeps_coins, bonus_sc, bonus_percentage, is_popular, is_best_value, display_order } = req.body;

    const packageId = parseInt(id);
    const existingPackage = await storeService.getPackageById(packageId);

    if (!existingPackage) {
      return res.status(404).json({ error: 'Package not found' });
    }

    const updateData = {
      title: title !== undefined ? title : existingPackage.title,
      description: description !== undefined ? description : existingPackage.description,
      price_usd: price_usd !== undefined ? parseFloat(price_usd) : existingPackage.price_usd,
      gold_coins: gold_coins !== undefined ? parseInt(gold_coins) : existingPackage.gold_coins,
      sweeps_coins: sweeps_coins !== undefined ? parseFloat(sweeps_coins) : existingPackage.sweeps_coins,
      bonus_percentage: bonus_percentage !== undefined ? parseInt(bonus_percentage) : existingPackage.bonus_percentage,
      is_popular: is_popular !== undefined ? is_popular : existingPackage.is_popular,
      is_best_value: is_best_value !== undefined ? is_best_value : existingPackage.is_best_value,
      display_order: display_order !== undefined ? parseInt(display_order) : existingPackage.display_order,
    };

    const updatedPackage = await storeService.updatePackage(packageId, updateData);

    console.log('[Store] Updated package:', updatedPackage);
    res.json({ success: true, data: updatedPackage });
  } catch (error) {
    console.error('Failed to update package:', error);
    res.status(500).json({ error: 'Failed to update package', details: (error as Error).message });
  }
};

export const deleteStorePackage: RequestHandler = async (req, res) => {
  try {
    const id = getStringParam(req.params.id);
    const packageId = parseInt(id);

    const success = await storeService.deletePackage(packageId);
    if (!success) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ success: true, message: `Package ${packageId} deleted` });
  } catch (error) {
    console.error('Failed to delete package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};

// ===== PAYMENT METHODS =====

export const getPaymentMethods: RequestHandler = async (req, res) => {
  try {
    const methods = await storeService.getPaymentMethods();
    res.json({ success: true, data: methods });
  } catch (error) {
    console.error('Failed to get payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
};

export const createPaymentMethod: RequestHandler = async (req, res) => {
  try {
    const { name, provider, config, is_active } = req.body;

    if (!name || !provider) {
      return res.status(400).json({ error: 'Missing required fields: name, provider' });
    }

    const newMethod = await storeService.createPaymentMethod({
      name,
      provider,
      is_active: is_active !== false,
      config: config || {},
    });

    res.status(201).json({ success: true, data: newMethod });
  } catch (error) {
    console.error('Failed to create payment method:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
};

export const updatePaymentMethod: RequestHandler = async (req, res) => {
  try {
    const id = getStringParam(req.params.id);
    const { name, provider, config, is_active } = req.body;

    const methodId = parseInt(id);
    const existingMethod = await storeService.getPaymentMethodById(methodId);

    if (!existingMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const updatedMethod = await storeService.updatePaymentMethod(methodId, {
      name: name !== undefined ? name : existingMethod.name,
      provider: provider !== undefined ? provider : existingMethod.provider,
      is_active: is_active !== undefined ? is_active : existingMethod.is_active,
      config: config !== undefined ? config : existingMethod.config,
    });

    res.json({ success: true, data: updatedMethod });
  } catch (error) {
    console.error('Failed to update payment method:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
};

export const deletePaymentMethod: RequestHandler = async (req, res) => {
  try {
    const id = getStringParam(req.params.id);
    const methodId = parseInt(id);

    const success = await storeService.deletePaymentMethod(methodId);
    if (!success) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    res.json({ success: true, message: `Payment method ${methodId} deleted` });
  } catch (error) {
    console.error('Failed to delete payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
};

// ===== STORE SETTINGS =====

export const getStoreSettings: RequestHandler = async (req, res) => {
  try {
    const settings = {
      store_name: 'CoinKrazy Store',
      store_description: 'Get more Gold Coins and Sweeps Coins to play your favorite games',
      bonus_percentage: 20,
      currency: 'USD',
      enabled: true,
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Failed to get store settings:', error);
    res.status(500).json({ error: 'Failed to get store settings' });
  }
};

export const updateStoreSettings: RequestHandler = async (req, res) => {
  try {
    const { store_name, store_description, bonus_percentage, currency, enabled } = req.body;

    const settings = {
      store_name: store_name || 'CoinKrazy Store',
      store_description: store_description || 'Get more Gold Coins and Sweeps Coins to play your favorite games',
      bonus_percentage: parseInt(bonus_percentage) || 20,
      currency: currency || 'USD',
      enabled: enabled !== false,
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Failed to update store settings:', error);
    res.status(500).json({ error: 'Failed to update store settings' });
  }
};
