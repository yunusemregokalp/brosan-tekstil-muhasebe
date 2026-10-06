import json

with open('data/parasut_complete_live_data.json', encoding='utf-8') as f:
    complete_data = json.load(f)

# Ensure both snake and alias keys exist on contacts
for c in complete_data['contacts']:
    c['usd_balance'] = c.get('balance_usd', 0.0)
    c['gbp_balance'] = c.get('balance_gbp', 0.0)
    c['eur_balance'] = c.get('balance_eur', 0.0)
    c['trl_balance'] = c.get('balance_trl', 0.0)

# Preserve legacy purchase_bills_faruk_aytin
faruk_bills = [
    {
        'id': 1044145920,
        'bill_no': 'NSA2026000000087',
        'issue_date': '2026-10-05',
        'gross_total': 13300.0,
        'net_total': 14630.0,
        'total_vat': 1330.0,
        'paid_amount': 0.0,
        'remaining_amount': 10335.35,
        'currency': 'USD',
        'description': 'Ben Ellis (375 T-shirt + 394 Hoodie) Fason Dikim Faturası'
    },
    {
        'id': 1044145905,
        'bill_no': 'NSA2026000000084',
        'issue_date': '2026-10-01',
        'gross_total': 5788.0,
        'net_total': 6366.80,
        'total_vat': 578.80,
        'paid_amount': 6366.80,
        'remaining_amount': 0.0,
        'currency': 'USD',
        'description': 'Ben Ellis (140 T-shirt + 180 Hoodie) Fason Dikim Faturası'
    },
    {
        'id': 1044145890,
        'bill_no': 'NSA2026000000070',
        'issue_date': '2026-07-30',
        'gross_total': 2760.0,
        'net_total': 3036.0,
        'total_vat': 276.0,
        'paid_amount': 3036.0,
        'remaining_amount': 0.0,
        'currency': 'USD',
        'description': 'EMK Oversized Tişört (276 Adet) Fason Dikim Faturası'
    }
]
complete_data['purchase_bills_faruk_aytin'] = faruk_bills

with open('data/parasut_live_data.json', 'w', encoding='utf-8') as f:
    json.dump(complete_data, f, ensure_ascii=False, indent=2)

with open('data/parasut_complete_live_data.json', 'w', encoding='utf-8') as f:
    json.dump(complete_data, f, ensure_ascii=False, indent=2)

print("Updated data/parasut_live_data.json and data/parasut_complete_live_data.json with currency aliases.")
