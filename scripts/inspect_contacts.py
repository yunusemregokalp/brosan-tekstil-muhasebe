import json

with open('data/parasut_complete_live_data.json', encoding='utf-8') as f:
    data = json.load(f)

for idx, c in enumerate(data['contacts'], 1):
    name = c['name'][:35]
    ctype = c['type']
    curr = c['currency']
    bal = c['balance']
    print(f"{idx:2d}. {name:35s} - {ctype:8s} - {curr:3s} - Bal: {bal:12.2f}")
