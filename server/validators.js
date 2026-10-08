/**
 * BROSAN TEKSTİL ERP — STRICT BOUNDARY VALIDATORS & INPUT SANITIZATION
 * Powered by Zod
 * Defense against:
 * - Prototype pollution
 * - Type-juggling attacks
 * - Malformed JSON payloads
 * - Unexpected extra fields
 * - SQL / NoSQL parameter injection
 */

const { z } = require('zod');

// 1. KULLANICI GİRİŞ ŞEMASI
const LoginSchema = z.object({
  username: z.string().min(3).max(50).trim(),
  password: z.string().min(1).max(128)
}).strict();

// 2. ŞİFRE DEĞİŞTİRME ŞEMASI (Askeri Düzey: Min 12 Karakter, Büyük, Küçük, Rakam, Sembol)
const PasswordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{12,}$/;

const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1).max(128),
  newPassword: z.string().min(12, 'Yeni şifre en az 12 karakter uzunluğunda olmalıdır.')
    .max(128)
    .regex(PasswordComplexityRegex, 'Yeni şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir.')
}).strict();

// 3. HESAP PLANI (ACCOUNT) OLUŞTURMA ŞEMASI
const AccountSchema = z.object({
  code: z.string().min(1).max(30).trim(),
  name: z.string().min(2).max(150).trim(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).default('ASSET'),
  category: z.string().min(1).max(50).trim(),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).default('TRY'),
  iban: z.string().max(50).optional().nullable(),
  accountNo: z.string().max(50).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  branchName: z.string().max(100).optional().nullable(),
  balance: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  }).default(0.0)
}).strict();

// 4. CARİ KART (CONTACT) ŞEMASI
const ContactSchema = z.object({
  code: z.string().min(1).max(50).trim(),
  title: z.string().min(2).max(200).trim(),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']).default('CUSTOMER'),
  taxOffice: z.string().max(100).optional().nullable(),
  taxNumber: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email('Geçerli bir e-posta adresi giriniz').optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('Türkiye'),
  balanceTrl: z.union([z.number(), z.string()]).optional().nullable(),
  balanceUsd: z.union([z.number(), z.string()]).optional().nullable(),
  balanceEur: z.union([z.number(), z.string()]).optional().nullable(),
  balanceGbp: z.union([z.number(), z.string()]).optional().nullable(),
  isAbroad: z.boolean().optional(),
  balance: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? 0 : num;
  }).default(0.0)
}).strict();

// 5. YEVMİYE MADDESİ & FİŞİ (JOURNAL ENTRY) ŞEMASI
const JournalItemSchema = z.object({
  accountId: z.string().min(1),
  description: z.string().max(255).optional(),
  debit: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val),
  credit: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val)
}).strict();

const JournalEntrySchema = z.object({
  description: z.string().min(2).max(255).trim(),
  documentType: z.enum(['MAHSUP', 'TAHSIL', 'TEDIYE', 'ACILIS', 'KAPANIS']).default('MAHSUP'),
  documentNo: z.string().max(50).optional().nullable(),
  items: z.array(JournalItemSchema).min(2, 'Bir yevmiye kaydında en az 2 kalem (Borç ve Alacak) bulunmalıdır.')
}).strict();

// 6. FATURA (INVOICE) ŞEMASI
const InvoiceItemSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().max(255).optional(),
  description: z.string().max(255).optional(),
  gtip: z.string().max(30).optional().nullable(),
  gtipCode: z.string().max(30).optional().nullable(),
  quantity: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 1 : val).default(1),
  unit: z.string().max(20).default('ADET'),
  unitPrice: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  vatRate: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 20 : val).default(20),
  taxRate: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 20 : val).optional(),
  discountRate: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  discountPercent: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).optional(),
  totalAmount: z.union([z.number(), z.string()]).optional()
}).strict();

const InvoiceSchema = z.object({
  invoiceNo: z.string().min(1).max(50).trim().optional(),
  invoiceNumber: z.string().min(1).max(50).trim().optional(),
  type: z.enum(['SALES', 'PURCHASE', 'EXPORT', 'IMPORT']).default('SALES'),
  scenario: z.string().max(50).optional().default('TICARIFATURA'),
  date: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  contactId: z.string().min(1),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).default('TRY'),
  exchangeRate: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 1.0 : val).default(1.0),
  subtotal: z.union([z.number(), z.string()]).optional(),
  vatTotal: z.union([z.number(), z.string()]).optional(),
  grandTotal: z.union([z.number(), z.string()]).optional(),
  notes: z.string().max(1000).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1, 'Faturada en az bir kalem bulunmalıdır.')
}).strict();

// 7. ÜRÜN & STOK (PRODUCT) ŞEMASI
const ProductSchema = z.object({
  code: z.string().min(1).max(50).trim(),
  name: z.string().min(1).max(255).trim(),
  category: z.string().min(1).max(100).trim().optional().default('GENEL'),
  gtipCode: z.string().max(30).optional().nullable(),
  unit: z.string().max(20).default('MT'),
  currentStock: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  minStock: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  unitCost: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  salePrice: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0)
}).strict();

// 8. KASA & BANKA FİNANSAL İŞLEM (TRANSACTION) ŞEMASI
const TransactionSchema = z.object({
  type: z.enum(['CASH_IN', 'CASH_OUT', 'BANK_IN', 'BANK_OUT']),
  accountId: z.string().min(1),
  contactId: z.string().optional().nullable(),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).refine(n => n > 0, 'İşlem tutarı sıfırdan büyük olmalıdır.'),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).default('TRY'),
  description: z.string().max(255).optional().nullable(),
  referenceNo: z.string().max(50).optional().nullable()
}).strict();

// 9. ÇEK & SENET (CHECK) ŞEMASI
const CheckSchema = z.object({
  docType: z.enum(['CHECK', 'PROMISSORY']).default('CHECK'),
  direction: z.enum(['RECEIVED', 'ISSUED']).default('RECEIVED'),
  serialNo: z.string().min(1).max(50).trim(),
  bankName: z.string().max(100).optional().nullable(),
  branchName: z.string().max(100).optional().nullable(),
  drawer: z.string().max(150).optional().nullable(),
  dueDate: z.string().min(1),
  amount: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).refine(n => n > 0, 'Tutar sıfırdan büyük olmalıdır.'),
  currency: z.enum(['TRY', 'USD', 'EUR', 'GBP']).default('TRY'),
  contactId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable()
}).strict();

const CheckStatusSchema = z.object({
  status: z.enum(['PORTFOLIO', 'COLLECTED', 'BOUNCED', 'ENDORSED', 'CANCELLED'])
}).strict();

// 10. PERSONEL & BORDRO (EMPLOYEE) ŞEMASI
const EmployeeSchema = z.object({
  tcNo: z.string().min(10).max(11).trim().optional().nullable(),
  fullName: z.string().min(2).max(150).trim(),
  department: z.string().max(100).optional().nullable(),
  position: z.string().max(100).optional().nullable(),
  startDate: z.string().optional().nullable(),
  grossSalary: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  netSalary: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) || 0 : val).default(0),
  iban: z.string().max(40).optional().nullable()
}).strict();

// ==========================================
// EXPRESS VALIDATION MIDDLEWARE GENERATOR
// ==========================================
function validateBody(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // Sanitized, typed and stripped of forbidden keys
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(422).json({
          success: false,
          error: 'Girdi doğrulama hatası (Validation Failed)',
          code: 'INVALID_INPUT',
          details: err.issues.map(i => ({
            field: i.path.join('.'),
            message: i.message
          }))
        });
      }
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veri biçimi'
      });
    }
  };
}

module.exports = {
  LoginSchema,
  ChangePasswordSchema,
  AccountSchema,
  ContactSchema,
  JournalEntrySchema,
  InvoiceSchema,
  ProductSchema,
  TransactionSchema,
  CheckSchema,
  CheckStatusSchema,
  EmployeeSchema,
  validateBody,
  PasswordComplexityRegex
};
