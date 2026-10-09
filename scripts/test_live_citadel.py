import urllib.request
import ssl
import json
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("=== PROBING LIVE PRODUCTION AT https://brosangroup.com ===")

# 1. Health Probe
health_url = "https://brosangroup.com/muhasebe/api/health"
print(f"\n1. Probing {health_url}...")
try:
    req = urllib.request.Request(health_url, headers={"User-Agent": "Citadel-Probe/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        status_code = res.status
        headers = dict(res.getheaders())
        body = res.read().decode('utf-8')
        print(f"   HTTP Status: {status_code} OK")
        print(f"   Payload: {body}")
        print(f"   COOP: {res.headers.get('Cross-Origin-Opener-Policy')}")
        print(f"   COEP: {res.headers.get('Cross-Origin-Embedder-Policy')}")
        print(f"   CORP: {res.headers.get('Cross-Origin-Resource-Policy')}")
        print(f"   Permissions-Policy: {res.headers.get('Permissions-Policy')}")
        print(f"   Cache-Control: {res.headers.get('Cache-Control')}")
        print(f"   X-Powered-By absent: {'x-powered-by' not in [k.lower() for k in res.headers.keys()]}")
except Exception as e:
    print(f"   FAILED: {e}")

# 2. Sibling Landing Probe
landing_url = "https://brosangroup.com/callcenter/landing"
print(f"\n2. Probing Sibling Service: {landing_url}...")
try:
    req = urllib.request.Request(landing_url, headers={"User-Agent": "Citadel-Probe/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        print(f"   HTTP Status: {res.status} OK (Sibling Service Zero Regression)")
except Exception as e:
    print(f"   FAILED: {e}")

# 3. Main App UI Probe
app_url = "https://brosangroup.com/muhasebe/"
print(f"\n3. Probing Main App UI: {app_url}...")
try:
    req = urllib.request.Request(app_url, headers={"User-Agent": "Citadel-Probe/1.0"})
    with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
        print(f"   HTTP Status: {res.status} OK")
except Exception as e:
    print(f"   FAILED: {e}")
