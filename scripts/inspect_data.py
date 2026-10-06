import json

with open('data/parasut_live_data.json', 'r', encoding='utf-8') as f:
    parasut = json.load(f)

print("PARASUT LIVE DATA:")
print(f"Bank Accounts ({len(parasut.get('bank_accounts', []))}):")
for b in parasut.get('bank_accounts', []):
    print(f"  - {b.get('name')} | Currency: {b.get('currency')} | Balance: {b.get('balance')} | IBAN: {b.get('iban')}")

print(f"\nProducts ({len(parasut.get('products', []))}):")
for p in parasut.get('products', []):
    print(f"  - {p.get('code')} | {p.get('name')} | Stock: {p.get('stock')} | Unit: {p.get('unit')} | Price: {p.get('sale_price')}")

print(f"\nFaruk Aytin Bills in Parasut ({len(parasut.get('purchase_bills_faruk_aytin', []))}):")
for b in parasut.get('purchase_bills_faruk_aytin', []):
    print(f"  - No: {b.get('bill_no')} | Date: {b.get('issue_date')} | Total: {b.get('gross_total')} | Paid: {b.get('paid_amount')} | Rem: {b.get('remaining_amount')} | Desc: {b.get('description')}")

with open('data/faruk_aytin_excel_data.json', 'r', encoding='utf-8') as f:
    faruk = json.load(f)

print("\nFARUK AYTIN EXCEL:")
print("Summary:", json.dumps(faruk.get('summary'), indent=2, ensure_ascii=False))
print(f"\nFason Faturalar ({len(faruk.get('fason_faturalar', []))}):")
for ff in faruk.get('fason_faturalar', []):
    print(f"  - {ff.get('fatura_no')} | {ff.get('tarih')} | {ff.get('tutar_usd')} USD ({ff.get('tutar_tl')} TL) | KDV: {ff.get('kdv_usd')} USD | Status: {ff.get('durum')}")

print(f"\nKumas Satis Faturasi:")
print("  -", faruk.get('kumas_satis_faturasi'))

print(f"\nBanka Odemeleri ({len(faruk.get('banka_odemeleri', []))}):")
for bo in faruk.get('banka_odemeleri', []):
    print(f"  - {bo.get('tarih')} | {bo.get('tutar_tl')} TL | {bo.get('tutar_usd')} USD | Kur: {bo.get('kur')} | {bo.get('aciklama')}")
