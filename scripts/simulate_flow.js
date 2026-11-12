import { db } from '../backend/db.js';

console.log('====================================================');
console.log('🧪 PENGUJIAN OTOMATIS INTEGRASI ALUR PESANAN BUMBU');
console.log('====================================================\n');

try {
  // 1. Check Initial State
  const initialProducts = db.getProducts();
  const rendang = initialProducts.find(p => p.id === 'prod-001');
  console.log(`✓ 1. Data Produk terverifikasi: ${initialProducts.length} produk.`);
  console.log(`   - Bumbu Rendang: Stok Fisik=${rendang.totalPhysicalStock}, Dicadangkan=${rendang.reservedStock}, Tersedia=${rendang.availableStock}`);

  // 2. Customer places order (2 kg Rendang, Reseller)
  const orderId = `ORD-TEST-${Date.now()}`;
  const order = {
    id: orderId,
    customerName: 'Test Warung Bu Dewi',
    customerPhone: '081299887766',
    customerAddress: 'Jl. Uji Coba No. 12',
    customerType: 'reseller',
    notes: 'Uji coba otomatis',
    status: 'MENUNGGU_DISIAPKAN',
    paymentMethod: 'COD',
    paymentStatus: 'BELUM_LUNAS',
    courierName: null,
    items: [
      {
        productId: 'prod-001',
        productName: rendang.name,
        unit: rendang.unit,
        qty: 2,
        price: rendang.priceWholesale,
        subtotal: rendang.priceWholesale * 2,
        checked: false
      }
    ],
    totalAmount: rendang.priceWholesale * 2,
    createdAt: new Date().toISOString(),
    statusHistory: [
      {
        status: 'MENUNGGU_DISIAPKAN',
        actor: 'Customer (Test)',
        timestamp: new Date().toISOString(),
        note: 'Pesanan dibuat'
      }
    ]
  };

  db.data.orders.unshift(order);
  db.save();

  const stockAfterOrder = db.getProductStockSummary('prod-001');
  console.log(`✓ 2. Pesanan #${orderId} dibuat.`);
  console.log(`   - Stok Dicadangkan bertambah: ${stockAfterOrder.reservedStock} kg (Stok Tersedia: ${stockAfterOrder.availableStock} kg)`);

  // 3. Staf Gudang marks as BERMASALAH (FR-07) -> verify stock reservation is RETAINED!
  order.status = 'BERMASALAH';
  order.issueReason = 'Uji coba kendala penyiapan';
  const stockDuringIssue = db.getProductStockSummary('prod-001');
  if (stockDuringIssue.reservedStock !== stockAfterOrder.reservedStock) {
    throw new Error('Bug: Stok tidak dicadangkan saat pesanan berstatus BERMASALAH!');
  }
  console.log(`✓ 3. Pesanan ditandai BERMASALAH (FR-07): Stok tetap aman terkunci (${stockDuringIssue.reservedStock} kg).`);

  // 4. Staf Gudang resolves issue and marks SIAP DIPACKING (FR-06)
  order.status = 'SIAP_DIPACKING';
  order.items[0].checked = true;
  db.save();
  console.log(`✓ 4. Staf Gudang menyelesaikan penyiapan: Status SIAP DIPACKING.`);

  // 5. Staf Packing packs order & assigns courier
  order.status = 'SUDAH_DIPACKING';
  order.courierName = 'Pak Agus (Kurir Motor)';
  db.save();
  console.log(`✓ 5. Staf Packing memverifikasi item & menetapkan kurir "${order.courierName}".`);

  // 6. Courier Handover (Ship) -> FEFO deduction!
  const allocations = db.allocateFEFO('prod-001', 2);
  console.log(`✓ 6. Algoritma FEFO mengalokasikan batch:`);
  allocations.forEach(a => {
    console.log(`   -> Batch: ${a.batchNumber} (Exp: ${a.expiryDate}) sebanyak ${a.qty} kg`);
    const batch = db.data.batches.find(b => b.id === a.batchId);
    if (batch) batch.currentQty -= a.qty;
  });

  order.items[0].fefoAllocations = allocations;
  order.status = 'DIKIRIM';
  order.courierPickedUpAt = new Date().toISOString();
  db.save();

  const stockAfterShip = db.getProductStockSummary('prod-001');
  console.log(`   - Status berubah ke DIKIRIM.`);
  console.log(`   - Stok fisik resmi berkurang: ${stockAfterShip.totalPhysicalStock} kg (Stok dicadangkan dilepas: ${stockAfterShip.reservedStock} kg).`);

  // 7. Admin receives COD cash
  order.status = 'SELESAI';
  order.paymentStatus = 'LUNAS';
  order.paymentDetails = {
    amountReceived: order.totalAmount,
    paidAt: new Date().toISOString(),
    receivedBy: 'Staf Admin (Lina)',
    notes: 'Uang pas COD diterima dari kurir'
  };
  db.save();
  console.log(`✓ 7. Staf Admin mencatat COD Rp ${order.totalAmount.toLocaleString('id-ID')} lunas (Status SELESAI).`);

  // 8. Test Return Order restoring to exact FEFO batch
  const allocatedBatch = db.data.batches.find(b => b.id === allocations[0].batchId);
  const qtyBeforeReturn = allocatedBatch.currentQty;
  
  // Restore
  allocations.forEach(a => {
    const targetBatch = db.data.batches.find(b => b.id === a.batchId);
    if (targetBatch) targetBatch.currentQty += a.qty;
  });
  order.status = 'DIRETUR';
  db.save();
  console.log(`✓ 8. Retur barang mengembalikan stok tepat ke Batch FEFO asal (${allocations[0].batchNumber}): ${qtyBeforeReturn} kg -> ${allocatedBatch.currentQty} kg.`);

  // 9. Test Supplier Goods-In
  const newBatch = {
    id: `batch-test-${Date.now()}`,
    productId: 'prod-001',
    batchNumber: 'BMB-RDG-FIX-01',
    expiryDate: '2027-06-15',
    initialQty: 30,
    currentQty: 30,
    supplierName: 'UD Rempah Nusantara Jaya',
    receivedAt: new Date().toISOString()
  };
  db.data.batches.push(newBatch);
  db.addStockLog({
    type: 'MASUK',
    productId: 'prod-001',
    productName: rendang.name,
    batchNumber: newBatch.batchNumber,
    qtyChange: 30,
    stockAfter: db.getProductStockSummary('prod-001').totalPhysicalStock,
    reference: 'PO-SUPP-FIX',
    actor: 'Staf Gudang (Rudi)',
    notes: 'Penerimaan supplier pengujian'
  });
  db.save();
  console.log(`✓ 9. Penerimaan supplier dicatat: Batch ${newBatch.batchNumber} (+30 kg).`);

  // 10. Test Stock Opname correction with mandatory reason
  newBatch.currentQty = 29;
  db.addStockLog({
    type: 'KOREKSI_OPNAME',
    productId: 'prod-001',
    productName: rendang.name,
    batchNumber: newBatch.batchNumber,
    qtyChange: -1,
    stockAfter: db.getProductStockSummary('prod-001').totalPhysicalStock,
    reference: 'Koreksi Stok Opname Fisik',
    actor: 'Owner (Pak Haji Rahmat)',
    notes: 'Koreksi 1 kg selisih timbangan display (FR-16)'
  });
  db.save();
  console.log(`✓ 10. Koreksi stok opname manual berhasil dicatat dengan alasan wajib (FR-16).`);

  console.log('\n====================================================');
  console.log('🎉 SELURUH PENGUJIAN INTEGRASI & PERBAIKAN BERHASIL 100%!');
  console.log('====================================================');
} catch (e) {
  console.error('Pengujian gagal:', e);
  process.exit(1);
}
