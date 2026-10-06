/**
 * BROSAN TEKSTİL ERP — PRODUCTION BACKEND SERVER
 * Architecture: Node.js + Express + Prisma ORM + PostgreSQL
 * Ready for Docker & Coolify Deployment
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '..', 'app')));

// Helper: Prisma Connection Checker
let isDbConnected = false;
async function checkDbConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    return true;
  } catch (err) {
    isDbConnected = false;
    return false;
  }
}
checkDbConnection();

// ==============================================================================
// 1. HEALTHCHECK & SYSTEM STATUS (Coolify / Docker Probe)
// ==============================================================================
app.get('/api/health', async (req, res) => {
  const dbOk = await checkDbConnection();
  res.status(200).json({
    status: dbOk ? 'healthy' : 'degraded',
    service: 'brosan-tekstil-erp',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// ==============================================================================
// 2. DASHBOARD KPI SUMMARY
// ==============================================================================
app.get('/api/summary', async (req, res) => {
  try {
    const [
      accountCount,
      contactCount,
      invoiceCount,
      productCount,
      checkCount,
      employeeCount,
      accounts,
      invoices
    ] = await Promise.all([
      prisma.account.count(),
      prisma.contact.count(),
      prisma.invoice.count(),
      prisma.product.count(),
      prisma.checkPromissory.count(),
      prisma.employee.count(),
      prisma.account.findMany(),
      prisma.invoice.findMany()
    ]);

    // Financial calculations
    let totalCashBank = 0;
    let totalReceivables = 0;
    let totalPayables = 0;

    accounts.forEach(acc => {
      const bal = parseFloat(acc.balance);
      if (acc.category === 'KASA' || acc.category === 'BANKA') {
        totalCashBank += bal;
      }
    });

    const contacts = await prisma.contact.findMany();
    contacts.forEach(c => {
      const bal = parseFloat(c.balance);
      if (bal > 0) totalReceivables += bal;
      else if (bal < 0) totalPayables += Math.abs(bal);
    });

    let totalRevenue = 0;
    invoices.forEach(inv => {
      if (inv.type === 'SALES' || inv.type === 'EXPORT') {
        totalRevenue += parseFloat(inv.grandTotal);
      }
    });

    res.json({
      success: true,
      kpis: {
        totalRevenue,
        totalCashBank,
        totalReceivables,
        totalPayables,
        counts: {
          accounts: accountCount,
          contacts: contactCount,
          invoices: invoiceCount,
          products: productCount,
          checks: checkCount,
          employees: employeeCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 3. TEKDÜZEN HESAP PLANI (ACCOUNTS)
// ==============================================================================
app.get('/api/accounts', async (req, res) => {
  try {
    const { category, type } = req.query;
    const where = {};
    if (category) where.category = category;
    if (type) where.type = type;

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { code, name, type, category, currency, balance } = req.body;
    const newAccount = await prisma.account.create({
      data: {
        code,
        name,
        type: type || 'ASSET',
        category,
        currency: currency || 'TRY',
        balance: balance ? parseFloat(balance) : 0.0
      }
    });
    res.status(201).json({ success: true, data: newAccount });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 4. YEVMİYE DEFTERİ (JOURNAL ENTRIES)
// ==============================================================================
app.get('/api/journal', async (req, res) => {
  try {
    const entries = await prisma.journalEntry.findMany({
      include: {
        items: {
          include: { account: true }
        }
      },
      orderBy: { entryNo: 'desc' }
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/journal', async (req, res) => {
  try {
    const { description, documentType, documentNo, items } = req.body;

    if (!items || !Array.isArray(items) || items.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Bir yevmiye fişinde en az 2 hesap kalemi (Borç ve Alacak) bulunmalıdır.'
      });
    }

    // Borç = Alacak çift taraflı kayıt ilkesi doğrulaması
    let totalDebit = 0;
    let totalCredit = 0;

    items.forEach(item => {
      totalDebit += parseFloat(item.debit || 0);
      totalCredit += parseFloat(item.credit || 0);
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        error: `Yevmiye kaydında Borç (${totalDebit.toFixed(2)}) ve Alacak (${totalCredit.toFixed(2)}) eşit olmalıdır!`
      });
    }

    const lastEntry = await prisma.journalEntry.findFirst({
      orderBy: { entryNo: 'desc' }
    });
    const nextEntryNo = lastEntry ? lastEntry.entryNo + 1 : 1;

    const entry = await prisma.journalEntry.create({
      data: {
        entryNo: nextEntryNo,
        description,
        documentType: documentType || 'MAHSUP',
        documentNo,
        totalDebit,
        totalCredit,
        items: {
          create: items.map(item => ({
            accountId: item.accountId,
            description: item.description || description,
            debit: parseFloat(item.debit || 0),
            credit: parseFloat(item.credit || 0)
          }))
        }
      },
      include: { items: true }
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 5. CARİ HESAPLAR (CONTACTS / CUSTOMER & SUPPLIERS)
// ==============================================================================
app.get('/api/contacts', async (req, res) => {
  try {
    const { type } = req.query;
    const where = type ? { type } : {};
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { title: 'asc' }
    });
    res.json({ success: true, data: contacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  try {
    const { code, title, type, taxOffice, taxNumber, phone, email, address, city, country, balance } = req.body;
    const contact = await prisma.contact.create({
      data: {
        code,
        title,
        type: type || 'CUSTOMER',
        taxOffice,
        taxNumber,
        phone,
        email,
        address,
        city,
        country: country || 'Türkiye',
        balance: balance ? parseFloat(balance) : 0.0
      }
    });
    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 6. FATURALAR (INVOICES)
// ==============================================================================
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        contact: true,
        items: true
      },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: invoices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id: id },
          { invoiceNo: id }
        ]
      },
      include: {
        contact: true,
        items: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Fatura bulunamadı.' });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { invoiceNo, type, scenario, date, dueDate, contactId, currency, exchangeRate, items, notes } = req.body;

    let subtotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const formattedItems = (items || []).map(item => {
      const qty = parseFloat(item.quantity || 1);
      const price = parseFloat(item.unitPrice || 0);
      const discountRate = parseFloat(item.discountRate || 0);
      const taxRate = parseFloat(item.taxRate !== undefined ? item.taxRate : 20);

      const baseAmount = qty * price;
      const discountAmount = baseAmount * (discountRate / 100);
      const lineMatrah = baseAmount - discountAmount;
      const itemTax = lineMatrah * (taxRate / 100);
      const itemTotal = lineMatrah + itemTax;

      subtotal += lineMatrah;
      taxTotal += itemTax;
      grandTotal += itemTotal;

      return {
        name: item.name || item.description || 'Mal/Hizmet Kalemi',
        description: item.description || item.name || '',
        gtip: item.gtip || null,
        quantity: qty,
        unit: item.unit || 'ADET',
        unitPrice: price,
        discountRate,
        taxRate,
        taxAmount: Math.round(itemTax * 100) / 100,
        total: Math.round(itemTotal * 100) / 100
      };
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        type: type || 'SALES',
        scenario: scenario || 'TICARIFATURA',
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        contactId,
        currency: currency || 'TRY',
        exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1.0,
        subtotal: Math.round(subtotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        notes,
        items: {
          create: formattedItems
        }
      },
      include: { contact: true, items: true }
    });

    // Cari Bakiye Güncellemesi
    if (contactId) {
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      if (contact) {
        const balanceChange = (type === 'SALES' || type === 'EXPORT') ? grandTotal : -grandTotal;
        await prisma.contact.update({
          where: { id: contactId },
          data: { balance: { increment: balanceChange } }
        });
      }
    }

    res.status(201).json({ success: true, data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await prisma.invoice.findUnique({ where: { id } });
    if (!inv) {
      return res.status(404).json({ success: false, error: 'Silinecek fatura bulunamadı.' });
    }

    // Cari bakiyesini geri al
    if (inv.contactId) {
      const rollbackChange = (inv.type === 'SALES' || inv.type === 'EXPORT') ? -parseFloat(inv.grandTotal) : parseFloat(inv.grandTotal);
      await prisma.contact.update({
        where: { id: inv.contactId },
        data: { balance: { increment: rollbackChange } }
      });
    }

    await prisma.invoice.delete({ where: { id } });
    res.json({ success: true, message: 'Fatura ve kalemleri başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 7. KASA & BANKA FİNANSAL İŞLEMLER (TRANSACTIONS)
// ==============================================================================
app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { account: true, contact: true },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { type, accountId, contactId, amount, currency, description, referenceNo } = req.body;
    const numAmount = parseFloat(amount);

    const transaction = await prisma.transaction.create({
      data: {
        type,
        accountId,
        contactId,
        amount: numAmount,
        currency: currency || 'TRY',
        description,
        referenceNo
      },
      include: { account: true, contact: true }
    });

    // Hesap Bakiyesi Güncelle
    const isIncrease = type.includes('IN');
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: isIncrease ? numAmount : -numAmount } }
    });

    // Cari Bakiyesi Varsa Güncelle
    if (contactId) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { balance: { increment: isIncrease ? -numAmount : numAmount } }
      });
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 8. ÇEK VE SENETLER (CHECKS & PROMISSORIES)
// ==============================================================================
app.get('/api/checks', async (req, res) => {
  try {
    const checks = await prisma.checkPromissory.findMany({
      include: { contact: true },
      orderBy: { dueDate: 'asc' }
    });
    res.json({ success: true, data: checks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/checks', async (req, res) => {
  try {
    const { docType, direction, serialNo, bankName, branchName, drawer, dueDate, amount, currency, contactId, notes } = req.body;
    const check = await prisma.checkPromissory.create({
      data: {
        docType: docType || 'CHECK',
        direction: direction || 'RECEIVED',
        serialNo,
        bankName,
        branchName,
        drawer,
        dueDate: new Date(dueDate),
        amount: parseFloat(amount),
        currency: currency || 'TRY',
        contactId,
        notes
      }
    });
    res.status(201).json({ success: true, data: check });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.patch('/api/checks/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.checkPromissory.update({
      where: { id },
      data: { status }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 9. PERSONEL & BORDRO (EMPLOYEES & PAYROLL)
// ==============================================================================
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { payrolls: true },
      orderBy: { fullName: 'asc' }
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { tcNo, fullName, department, position, startDate, grossSalary, netSalary, iban } = req.body;
    const employee = await prisma.employee.create({
      data: {
        tcNo,
        fullName,
        department,
        position,
        startDate: startDate ? new Date(startDate) : new Date(),
        grossSalary: parseFloat(grossSalary),
        netSalary: parseFloat(netSalary),
        iban
      }
    });
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 10. STOK & ÜRÜN YÖNETİMİ (PRODUCTS & INVENTORY)
// ==============================================================================
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { movements: true },
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { code, name, category, gtipCode, unit, currentStock, minStock, unitCost, salePrice } = req.body;
    const product = await prisma.product.create({
      data: {
        code,
        name,
        category,
        gtipCode,
        unit: unit || 'MT',
        currentStock: currentStock ? parseFloat(currentStock) : 0.0,
        minStock: minStock ? parseFloat(minStock) : 0.0,
        unitCost: unitCost ? parseFloat(unitCost) : 0.0,
        salePrice: salePrice ? parseFloat(salePrice) : 0.0
      }
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 11. MUHASEBE RAPORLARI (MİZAN, BİLANÇO, GELİR TABLOSU)
// ==============================================================================
app.get('/api/reports/mizan', async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      include: { journalItems: true },
      orderBy: { code: 'asc' }
    });

    const mizanData = accounts.map(acc => {
      let debitTotal = 0;
      let creditTotal = 0;

      acc.journalItems.forEach(item => {
        debitTotal += parseFloat(item.debit);
        creditTotal += parseFloat(item.credit);
      });

      const balanceDebit = debitTotal > creditTotal ? debitTotal - creditTotal : 0;
      const balanceCredit = creditTotal > debitTotal ? creditTotal - debitTotal : 0;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debitTotal,
        creditTotal,
        balanceDebit,
        balanceCredit
      };
    });

    res.json({ success: true, data: mizanData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==============================================================================
// 12. FARUK AYTİN & NİSA TEKSTİL FASON ÜRETİM & KUMAŞ MAHSUBU MUTABAKATI
// ==============================================================================
app.get('/api/mutabakat/faruk-aytin', (req, res) => {
  try {
    const fs = require('fs');
    const dataPath = path.join(__dirname, '..', 'data', 'faruk_aytin_excel_data.json');
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf-8');
      return res.json({ success: true, data: JSON.parse(raw) });
    }
    res.status(404).json({ success: false, error: 'Mutabakat verisi bulunamadı' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Catch-all for SPA Navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🏭 BROSAN TEKSTİL ERP SUNUCUSU AKTİF`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Healthcheck: http://0.0.0.0:${PORT}/api/health`);
  console.log(`📊 Ortam: ${process.env.NODE_ENV || 'production'}`);
  console.log(`====================================================`);
});
