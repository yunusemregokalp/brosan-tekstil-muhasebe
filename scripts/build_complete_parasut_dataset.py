import json
import os

print("Building complete Parasut dataset...")

with open('data/parasut_contacts_extracted.json', encoding='utf-8') as f:
    raw_contacts = json.load(f)

with open('data/parasut_sales_invoices_extracted.json', encoding='utf-8') as f:
    raw_sales_invoices = json.load(f)

with open('data/parasut_expenditures_full.json', encoding='utf-8') as f:
    raw_exp = json.load(f)
    raw_purchase_bills = raw_exp.get('purchase_bills', [])

with open('data/parasut_products_extracted.json', encoding='utf-8') as f:
    raw_products = json.load(f)

with open('data/parasut_accounts_and_checks.json', encoding='utf-8') as f:
    raw_acc_checks = json.load(f)
    raw_accounts = raw_acc_checks.get('accounts', [])
    raw_checks = raw_acc_checks.get('checks', [])
    raw_txs_by_account = raw_acc_checks.get('transactionsByAccount', {})

with open('data/parasut_invoice_lines_extracted.json', encoding='utf-8') as f:
    raw_lines = json.load(f)
    sales_details_map = raw_lines.get('salesDetailsMap', {})
    purchase_details_map = raw_lines.get('purchaseDetailsMap', {})

with open('data/faruk_aytin_excel_data.json', encoding='utf-8') as f:
    faruk_aytin = json.load(f)

# Format contacts
contacts = []
for idx, c in enumerate(raw_contacts, start=1):
    c_type = 'CUSTOMER' if c.get('account_type') == 'customer' else ('SUPPLIER' if c.get('account_type') == 'supplier' else 'CUSTOMER')
    curr = 'TRY'
    if float(c.get('gbp_balance') or 0) != 0:
        curr = 'GBP'
    elif float(c.get('usd_balance') or 0) != 0:
        curr = 'USD'
    elif float(c.get('eur_balance') or 0) != 0:
        curr = 'EUR'
    elif float(c.get('trl_balance') or 0) != 0:
        curr = 'TRY'

    # country
    country = 'Türkiye'
    if c.get('is_abroad'):
        if 'United Kingdom' in (c.get('address') or '') or 'Cardiff' in (c.get('address') or '') or 'Bristol' in (c.get('address') or '') or 'UK' in (c.get('address') or ''):
            country = 'Birleşik Krallık'
        elif 'Germany' in (c.get('address') or '') or 'Deutschland' in (c.get('address') or ''):
            country = 'Almanya'
        elif 'USA' in (c.get('address') or '') or 'United States' in (c.get('address') or ''):
            country = 'Amerika Birleşik Devletleri'
        elif 'Kuwait' in (c.get('address') or ''):
            country = 'Kuveyt'
        else:
            country = 'Yurtdışı'

    contact_obj = {
        'id': c.get('id'),
        'code': f"CR-{idx:04d}",
        'name': c.get('name'),
        'type': c_type,
        'tax_number': c.get('tax_number') or '',
        'tax_office': c.get('tax_office') or '',
        'address': c.get('address') or '',
        'city': c.get('city') or '',
        'district': c.get('district') or '',
        'country': country,
        'is_abroad': bool(c.get('is_abroad')),
        'phone': c.get('phone') or '',
        'email': c.get('email') or '',
        'currency': curr,
        'balance': float(c.get('balance') or 0.0),
        'balance_trl': float(c.get('trl_balance') or 0.0),
        'balance_usd': float(c.get('usd_balance') or 0.0),
        'balance_eur': float(c.get('eur_balance') or 0.0),
        'balance_gbp': float(c.get('gbp_balance') or 0.0),
        'untrackable': bool(c.get('untrackable')),
        'archived': bool(c.get('archived'))
    }
    contacts.append(contact_obj)

# Format bank accounts
bank_accounts = []
for a in raw_accounts:
    b_curr = a.get('currency')
    if b_curr == 'TRL':
        b_curr = 'TRY'
    bank_accounts.append({
        'id': a.get('id'),
        'name': a.get('name'),
        'type': a.get('account_type'), # bank, cash
        'currency': b_curr,
        'balance': float(a.get('balance') or 0.0),
        'iban': a.get('iban'),
        'account_no': a.get('bank_account_no'),
        'bank_name': 'Garanti BBVA' if 'Garanti' in (a.get('name') or '') else (a.get('bank_name') or 'Banka'),
        'branch_name': a.get('bank_branch') or ('Bahçeşehir' if 'Garanti' in (a.get('name') or '') else ''),
        'bank_identifier': a.get('bank_identifier')
    })

# Format sales invoices
sales_invoices = []
for inv in raw_sales_invoices:
    inv_id = inv.get('id')
    lines = sales_details_map.get(str(inv_id)) or sales_details_map.get(inv_id) or []
    formatted_lines = []
    for l in lines:
        formatted_lines.append({
            'id': l.get('id'),
            'product_id': l.get('product_id'),
            'description': l.get('description') or (l.get('product') or {}).get('name') or 'Ürün/Hizmet Satışı',
            'quantity': float(l.get('quantity') or 1.0),
            'unit_price': float(l.get('unit_price') or 0.0),
            'vat_rate': float(l.get('vat_rate') or 0.0),
            'discount_value': float(l.get('discount_value') or 0.0),
            'net_total': float(l.get('net_total') or 0.0)
        })

    inv_curr = inv.get('currency')
    if inv_curr == 'TRL':
        inv_curr = 'TRY'

    sales_invoices.append({
        'id': inv_id,
        'invoice_no': inv.get('invoice_no') or f"INV-{inv_id}",
        'description': inv.get('description') or '',
        'issue_date': inv.get('issue_date'),
        'due_date': inv.get('due_date'),
        'contact_id': inv.get('contact_id'),
        'currency': inv_curr,
        'exchange_rate': float(inv.get('exchange_rate') or 1.0),
        'gross_total': float(inv.get('gross_total') or 0.0),
        'net_total': float(inv.get('net_total') or 0.0),
        'total_vat': float(inv.get('total_vat') or 0.0),
        'total_paid': float(inv.get('total_paid') or 0.0),
        'remaining': float(inv.get('remaining') or 0.0),
        'remaining_in_trl': float(inv.get('remaining_in_trl') or 0.0),
        'is_abroad': bool(inv.get('is_abroad')),
        'city': inv.get('city'),
        'country': inv.get('country') or 'Türkiye',
        'item_type': inv.get('item_type'),
        'e_invoice_id': inv.get('e_invoice_id'),
        'e_archive_id': inv.get('e_archive_id'),
        'lines': formatted_lines
    })

# Format purchase bills
purchase_bills = []
for pb in raw_purchase_bills:
    pb_id = pb.get('id')
    lines = purchase_details_map.get(str(pb_id)) or purchase_details_map.get(pb_id) or []
    formatted_lines = []
    for l in lines:
        formatted_lines.append({
            'id': l.get('id'),
            'product_id': l.get('product_id'),
            'description': l.get('description') or 'Alış / Gider Kalemi',
            'quantity': float(l.get('quantity') or 1.0),
            'unit_price': float(l.get('unit_price') or 0.0),
            'vat_rate': float(l.get('vat_rate') or 0.0),
            'net_total': float(l.get('net_total') or 0.0)
        })

    pb_curr = pb.get('currency')
    if pb_curr == 'TRL':
        pb_curr = 'TRY'

    purchase_bills.append({
        'id': pb_id,
        'bill_no': pb.get('invoice_no') or f"PB-{pb_id}",
        'description': pb.get('description') or '',
        'issue_date': pb.get('issue_date'),
        'due_date': pb.get('due_date'),
        'supplier_id': pb.get('supplier_id'),
        'currency': pb_curr,
        'exchange_rate': float(pb.get('exchange_rate') or 1.0),
        'gross_total': float(pb.get('gross_total') or 0.0),
        'net_total': float(pb.get('net_total') or 0.0),
        'total_vat': float(pb.get('total_vat') or 0.0),
        'total_paid': float(pb.get('total_paid') or 0.0),
        'remaining': float(pb.get('remaining') or 0.0),
        'remaining_in_trl': float(pb.get('remaining_in_trl') or 0.0),
        'item_type': pb.get('item_type'),
        'lines': formatted_lines
    })

# Format products
products = []
for p in raw_products:
    products.append({
        'id': p.get('id'),
        'code': p.get('code') or f"PRD-{p.get('id')}",
        'name': p.get('name'),
        'unit': p.get('unit') or 'Adet',
        'stock': float(p.get('stock') or 0.0),
        'sale_price': float(p.get('sale_price') or 0.0),
        'currency': p.get('currency') or 'TRY',
        'category': 'KUMAŞ' if 'KUMAŞ' in (p.get('name') or '').upper() or 'PENYE' in (p.get('name') or '').upper() else 'DİĞER'
    })

# Format checks
checks = []
for c in raw_checks:
    checks.append({
        'id': c.get('id'),
        'serial_number': c.get('serial_number') or f"CHK-{c.get('id')}",
        'bank_identifier': c.get('bank_identifier'),
        'bank_name': 'Garanti BBVA' if 'GARANTI' in (c.get('bank_identifier') or '').upper() else ('Ziraat Bankası' if 'ZIRAAT' in (c.get('bank_identifier') or '').upper() else 'Banka'),
        'currency': 'TRY' if c.get('currency') == 'TRL' else c.get('currency'),
        'net_total': float(c.get('net_total') or 0.0),
        'issue_date': c.get('issue_date'),
        'due_date': c.get('due_date'),
        'to_contact_id': c.get('to_id'),
        'description': c.get('description') or 'Cari Çek Ödemesi'
    })

# Format transactions
transactions = []
for acc_id, tx_list in raw_txs_by_account.items():
    for tx in tx_list:
        transactions.append({
            'id': tx.get('id'),
            'account_id': int(acc_id),
            'date': tx.get('date'),
            'amount': float(tx.get('amount') or 0.0),
            'currency': 'TRY' if tx.get('currency') == 'TRL' else tx.get('currency'),
            'description': tx.get('description') or '',
            'contact_id': tx.get('contact_id'),
            'transaction_type': tx.get('transaction_type')
        })

complete_dataset = {
    'company': {
        'name': 'BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ.',
        'tax_number': '1871741946',
        'parasut_id': 794187,
        'address': 'İkitelli OSB Mah. Dokumacılar San. Sit. 4. Blok No:28 Başakşehir / İSTANBUL',
        'city': 'İSTANBUL',
        'tax_office': 'İkitelli'
    },
    'contacts': contacts,
    'bank_accounts': bank_accounts,
    'sales_invoices': sales_invoices,
    'purchase_bills': purchase_bills,
    'products': products,
    'checks': checks,
    'transactions': transactions,
    'faruk_aytin_reconciliation': faruk_aytin
}

with open('data/parasut_complete_live_data.json', 'w', encoding='utf-8') as f:
    json.dump(complete_dataset, f, ensure_ascii=False, indent=2)

# Also update data/parasut_live_data.json with this complete dataset
with open('data/parasut_live_data.json', 'w', encoding='utf-8') as f:
    json.dump(complete_dataset, f, ensure_ascii=False, indent=2)

print(f"COMPLETE DATASET BUILT & SAVED:")
print(f"  - Contacts: {len(contacts)}")
print(f"  - Bank Accounts: {len(bank_accounts)}")
print(f"  - Sales Invoices: {len(sales_invoices)}")
print(f"  - Purchase Bills: {len(purchase_bills)}")
print(f"  - Products: {len(products)}")
print(f"  - Checks: {len(checks)}")
print(f"  - Account Transactions: {len(transactions)}")
