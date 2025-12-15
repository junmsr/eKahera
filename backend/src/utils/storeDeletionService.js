const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const cron = require('node-cron');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { logAction } = require('./logger');

const EXPORT_DIR = path.join(__dirname, '..', '..', 'uploads', 'exports');
const DEFAULT_GRACE_DAYS = 30;

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function ensureStoreDeletionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_deletion_requests (
      id SERIAL PRIMARY KEY,
      business_id INT NOT NULL,
      requested_by INT,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      scheduled_for TIMESTAMPTZ NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      export_path TEXT,
      export_type VARCHAR(20),
      export_ready_at TIMESTAMPTZ,
      export_size_bytes BIGINT,
      recovered_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ,
      metadata JSONB DEFAULT '{}'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_store_deletion_business ON store_deletion_requests(business_id);
    CREATE INDEX IF NOT EXISTS idx_store_deletion_status ON store_deletion_requests(status, scheduled_for);
  `);
}

async function getLatestDeletionRequest(businessId) {
  await ensureStoreDeletionTable();
  const res = await pool.query(
    `
      SELECT *
      FROM store_deletion_requests
      WHERE business_id = $1
      ORDER BY requested_at DESC
      LIMIT 1
    `,
    [businessId]
  );
  return res.rows[0] || null;
}

async function exportTransactions(businessId) {
  // Fetch all transactions with items and payments for the business
  const txRes = await pool.query(
    `
      SELECT
        t.transaction_id,
        t.transaction_number,
        t.total_amount::numeric,
        t.status,
        t.created_at,
        t.updated_at,
        t.cashier_user_id,
        t.customer_user_id,
        COALESCE((
          SELECT json_agg(row_to_json(ti))
          FROM (
            SELECT 
              ti.transaction_item_id,
              ti.product_id,
              p.product_name,
              p.sku,
              ti.product_quantity,
              ti.price_at_sale,
              ti.subtotal
            FROM transaction_items ti
            LEFT JOIN products p ON ti.product_id = p.product_id
            WHERE ti.transaction_id = t.transaction_id
            ORDER BY ti.transaction_item_id
          ) ti
        ), '[]') AS items,
        COALESCE((
          SELECT json_agg(row_to_json(tp))
          FROM (
            SELECT 
              tp.transaction_payment_id,
              tp.payment_type,
              tp.money_received,
              tp.money_change,
              tp.discount_id
            FROM transaction_payment tp
            WHERE tp.transaction_id = t.transaction_id
            ORDER BY tp.transaction_payment_id
          ) tp
        ), '[]') AS payments
      FROM transactions t
      WHERE t.business_id = $1
      ORDER BY t.created_at ASC
    `,
    [businessId]
  );

  // Create Excel workbook
  const workbook = XLSX.utils.book_new();

  // Prepare transactions data for main sheet
  const transactionsData = txRes.rows.map((t) => {
    const itemsSummary = (t.items || [])
      .map(
        (it) =>
          `${it.product_name || `Product ID: ${it.product_id || 'N/A'}`} (SKU: ${it.sku || 'N/A'}) - Qty: ${it.product_quantity || 0} @ ${it.price_at_sale ?? '0.00'} = ${it.subtotal ?? '0.00'}`
      )
      .join('; ');

    const paymentsSummary = (t.payments || [])
      .map(
        (p) =>
          `${p.payment_type || 'N/A'}: Received ${p.money_received ?? '0.00'}, Change ${p.money_change ?? '0.00'}${
            p.discount_id ? `, Discount ID: ${p.discount_id}` : ''
          }`
      )
      .join('; ');

    return {
      'Transaction ID': t.transaction_id,
      'Transaction Number': t.transaction_number,
      'Total Amount': parseFloat(t.total_amount) || 0,
      'Status': t.status,
      'Created At': t.created_at ? new Date(t.created_at).toLocaleString() : '',
      'Updated At': t.updated_at ? new Date(t.updated_at).toLocaleString() : '',
      'Cashier User ID': t.cashier_user_id || '',
      'Customer User ID': t.customer_user_id || '',
      'Items': itemsSummary || '',
      'Payments': paymentsSummary || '',
    };
  });

  // Create transactions sheet
  const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
  
  // Set column widths for better readability
  const transactionsColWidths = [
    { wch: 15 }, // Transaction ID
    { wch: 20 }, // Transaction Number
    { wch: 12 }, // Total Amount
    { wch: 12 }, // Status
    { wch: 20 }, // Created At
    { wch: 20 }, // Updated At
    { wch: 15 }, // Cashier User ID
    { wch: 15 }, // Customer User ID
    { wch: 60 }, // Items
    { wch: 40 }, // Payments
  ];
  transactionsSheet['!cols'] = transactionsColWidths;

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transactions');

  // Prepare detailed items data for separate sheet
  const itemsData = [];
  txRes.rows.forEach((t) => {
    (t.items || []).forEach((item) => {
      itemsData.push({
        'Transaction ID': t.transaction_id,
        'Transaction Number': t.transaction_number,
        'Transaction Date': t.created_at ? new Date(t.created_at).toLocaleString() : '',
        'Item ID': item.transaction_item_id,
        'Product ID': item.product_id || '',
        'Product Name': item.product_name || 'N/A',
        'SKU': item.sku || 'N/A',
        'Quantity': item.product_quantity || 0,
        'Price at Sale': parseFloat(item.price_at_sale) || 0,
        'Subtotal': parseFloat(item.subtotal) || 0,
      });
    });
  });

  if (itemsData.length > 0) {
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
    const itemsColWidths = [
      { wch: 15 }, // Transaction ID
      { wch: 20 }, // Transaction Number
      { wch: 20 }, // Transaction Date
      { wch: 12 }, // Item ID
      { wch: 12 }, // Product ID
      { wch: 30 }, // Product Name
      { wch: 15 }, // SKU
      { wch: 10 }, // Quantity
      { wch: 12 }, // Price at Sale
      { wch: 12 }, // Subtotal
    ];
    itemsSheet['!cols'] = itemsColWidths;
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Transaction Items');
  }

  // Prepare payments data for separate sheet
  const paymentsData = [];
  txRes.rows.forEach((t) => {
    (t.payments || []).forEach((payment) => {
      paymentsData.push({
        'Transaction ID': t.transaction_id,
        'Transaction Number': t.transaction_number,
        'Transaction Date': t.created_at ? new Date(t.created_at).toLocaleString() : '',
        'Payment ID': payment.transaction_payment_id,
        'Payment Type': payment.payment_type || 'N/A',
        'Money Received': parseFloat(payment.money_received) || 0,
        'Money Change': parseFloat(payment.money_change) || 0,
        'Discount ID': payment.discount_id || '',
      });
    });
  });

  if (paymentsData.length > 0) {
    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
    const paymentsColWidths = [
      { wch: 15 }, // Transaction ID
      { wch: 20 }, // Transaction Number
      { wch: 20 }, // Transaction Date
      { wch: 12 }, // Payment ID
      { wch: 15 }, // Payment Type
      { wch: 15 }, // Money Received
      { wch: 15 }, // Money Change
      { wch: 12 }, // Discount ID
    ];
    paymentsSheet['!cols'] = paymentsColWidths;
    XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');
  }

  // Write Excel file
  const baseName = `biz-${businessId}-transactions-${Date.now()}`;
  const excelPath = path.join(EXPORT_DIR, `${baseName}.xlsx`);
  XLSX.writeFile(workbook, excelPath);

  const stats = await fs.promises.stat(excelPath);
  const sizeBytes = stats.size;

  return {
    exportPath: excelPath,
    exportType: 'xlsx',
    exportSizeBytes: sizeBytes,
    exportReadyAt: new Date(),
  };
}

async function createDeletionRequest({ businessId, userId }) {
  await ensureStoreDeletionTable();

  const existing = await getLatestDeletionRequest(businessId);
  if (existing && ['pending'].includes(existing.status)) {
    return { request: existing, alreadyExists: true };
  }

  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + DEFAULT_GRACE_DAYS);

  const exportInfo = await exportTransactions(businessId);

  const res = await pool.query(
    `
      INSERT INTO store_deletion_requests (
        business_id, requested_by, requested_at, scheduled_for, status,
        export_path, export_type, export_ready_at, export_size_bytes
      )
      VALUES ($1, $2, NOW(), $3, 'pending', $4, $5, $6, $7)
      RETURNING *
    `,
    [
      businessId,
      userId || null,
      scheduledFor,
      exportInfo.exportPath,
      exportInfo.exportType,
      exportInfo.exportReadyAt,
      exportInfo.exportSizeBytes,
    ]
  );

  logAction({
    userId,
    businessId,
    action: `Requested store deletion (grace ${DEFAULT_GRACE_DAYS} days)`,
  });

  return { request: res.rows[0], alreadyExists: false };
}

async function cancelDeletionRequest({ businessId, userId }) {
  await ensureStoreDeletionTable();

  const res = await pool.query(
    `
      UPDATE store_deletion_requests
      SET status = 'cancelled', recovered_at = NOW()
      WHERE business_id = $1 AND status = 'pending'
      RETURNING *
    `,
    [businessId]
  );

  if (res.rowCount > 0) {
    logAction({
      userId,
      businessId,
      action: 'Cancelled store deletion request',
    });
  }

  return res.rows[0] || null;
}

async function hardDeleteBusiness({ businessId, performedBy }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DELETE FROM logs WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM transactions WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM inventory WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM products WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM business_documents WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM email_notifications WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM users WHERE business_id = $1', [businessId]);
    await client.query('DELETE FROM business WHERE business_id = $1', [businessId]);

    await client.query('COMMIT');

    await ensureStoreDeletionTable();
    await client.query(
      `
        UPDATE store_deletion_requests
        SET status = 'processed', deleted_at = NOW()
        WHERE business_id = $1 AND status = 'pending'
      `,
      [businessId]
    );

    logAction({
      userId: performedBy || null,
      businessId: null,
      action: `Hard deleted business ${businessId}`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function processDueStoreDeletions() {
  await ensureStoreDeletionTable();
  const due = await pool.query(
    `
      SELECT business_id
      FROM store_deletion_requests
      WHERE status = 'pending' AND scheduled_for <= NOW()
    `
  );

  for (const row of due.rows) {
    try {
      await hardDeleteBusiness({ businessId: row.business_id, performedBy: null });
      console.log(`Auto-deleted business ${row.business_id} after grace period`);
    } catch (err) {
      console.error(`Failed to auto-delete business ${row.business_id}:`, err);
    }
  }
}

function startStoreDeletionScheduler() {
  // Allow turning off via env flag
  if (String(process.env.DISABLE_STORE_DELETION_CRON || '').toLowerCase() === 'true') {
    return;
  }
  cron.schedule(
    '10 2 * * *',
    () => {
      processDueStoreDeletions().catch((err) =>
        console.error('Store deletion scheduler failed:', err)
      );
    },
    { scheduled: true, timezone: 'Asia/Manila' }
  );
}

module.exports = {
  ensureStoreDeletionTable,
  getLatestDeletionRequest,
  createDeletionRequest,
  cancelDeletionRequest,
  exportTransactions,
  hardDeleteBusiness,
  processDueStoreDeletions,
  startStoreDeletionScheduler,
  DEFAULT_GRACE_DAYS,
};

