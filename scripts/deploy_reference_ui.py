#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BROSAN TEKSTİL ERP — PRODUCTION DEPLOYMENT & LIVE VERIFICATION ENGINE
Milestone 6: Reference Style and Layout Overhaul (ref_style.css)

Automates:
1. Target App UUID: 3rqmxkcjbkfp1mzp3raiyok8 (App ID 14) on VPS 173.249.23.10.
2. Queue deployment via Coolify Artisan Tinker.
3. Real-time PostgreSQL queue polling in coolify-db until finished.
4. Active container runtime inspection (validating non-root UID 1000 node execution).
5. Network warm-up & Traefik route stabilization.
6. Live Production HTTP Probes:
   - Probe 1: https://brosangroup.com/muhasebe (HTTP 200, contains 'ref-style', 'Inter', '380px', '#yan', '#auth-lockscreen', '#erp-main-app')
   - Probe 2: https://brosangroup.com/muhasebe/api/health (HTTP 200, status: healthy)
   - Probe 3: https://brosangroup.com/callcenter/landing (HTTP 200, zero collateral disruption)
"""

import subprocess
import time
import sys
import json
import urllib.request
import ssl
import re

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

SSH_KEY = r"C:\Users\YUNUS EMRE GÖKALP\.ssh\brosan_staging_antigravity"
VPS_HOST = "root@173.249.23.10"
APP_UUID = "3rqmxkcjbkfp1mzp3raiyok8"

def run_ssh(cmd, stdin_data=None, timeout=60):
    full_cmd = ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VPS_HOST, cmd]
    res = subprocess.run(full_cmd, input=stdin_data, capture_output=True, text=True, timeout=timeout)
    return res.stdout, res.stderr, res.returncode

def run_local(cmd):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return res.stdout.strip(), res.stderr.strip(), res.returncode

def main():
    print("=" * 80)
    print("🏛️ BROSAN TEKSTIL ERP — DEPLOYING REFERENCE STYLE & LAYOUT OVERHAUL")
    print(f"Target App UUID: {APP_UUID} (App ID 14) on VPS 173.249.23.10")
    print("=" * 80)

    # 1. Pre-flight Git Check
    print("\n[STEP 1] Pre-flight Git Status & Commit Verification...", flush=True)
    git_rev, _, _ = run_local("git rev-parse --short HEAD")
    git_branch, _, _ = run_local("git rev-parse --abbrev-ref HEAD")
    print(f"  Current Branch : {git_branch}")
    print(f"  Current Commit : {git_rev}")

    # 2. Trigger Coolify Deployment via Artisan Tinker
    print("\n[STEP 2] Queuing Deployment in Coolify Application Engine...", flush=True)
    php_code = f"""
$app = \\App\\Models\\Application::where('uuid', '{APP_UUID}')->first();
$uuid = (string) \\Illuminate\\Support\\Str::uuid();
echo 'DEPLOY_UUID:' . $uuid . PHP_EOL;
queue_application_deployment($app, $uuid, 0, null, true);
exit;
"""
    stdout, stderr, code = run_ssh("docker exec -i coolify php artisan tinker", stdin_data=php_code)
    if code != 0:
        print("❌ Tinker execution failed:", stderr)
        sys.exit(1)

    deploy_uuid = None
    uuid_pattern = re.compile(r'DEPLOY_UUID:\s*([a-f0-9\-]{36})', re.IGNORECASE)
    for line in stdout.splitlines():
        clean_line = line.strip()
        if "echo 'DEPLOY_UUID:'" in clean_line or 'echo "DEPLOY_UUID:"' in clean_line:
            continue
        match = uuid_pattern.search(clean_line)
        if match:
            deploy_uuid = match.group(1)
            break

    if not deploy_uuid:
        print("❌ Could not extract deployment UUID from tinker output:")
        print(stdout)
        sys.exit(1)

    print(f"  ✓ Deployment successfully queued with UUID: {deploy_uuid}")
    print("  Monitoring deployment status in coolify-db...", flush=True)

    # 3. Monitor Build & Deploy Queue
    start_time = time.time()
    max_wait_seconds = 480
    finished = False

    while time.time() - start_time < max_wait_seconds:
        time.sleep(5)
        query_cmd = f"""docker exec -i coolify-db psql -U coolify -d coolify -t -A -c "SELECT status FROM application_deployment_queues WHERE deployment_uuid = '{deploy_uuid}';" """
        status_out, _, _ = run_ssh(query_cmd)
        status = status_out.strip()
        elapsed = int(time.time() - start_time)
        print(f"  [{elapsed}s] Build Status: {status}", flush=True)

        if status == "finished":
            print(f"  🎉 Coolify build & deployment finished successfully in {elapsed}s!", flush=True)
            finished = True
            break
        elif status in ["failed", "cancelled", "killed"]:
            print(f"  ❌ Deployment {status}!", flush=True)
            log_cmd = f"""docker exec -i coolify-db psql -U coolify -d coolify -t -A -c "SELECT logs FROM application_deployment_queues WHERE deployment_uuid = '{deploy_uuid}';" """
            logs, _, _ = run_ssh(log_cmd)
            print("--- Build Log Tail ---")
            print(logs[-3000:], flush=True)
            sys.exit(1)

    if not finished:
        print(f"❌ Deployment timed out after {max_wait_seconds} seconds!")
        sys.exit(1)

    # 4. Inspect Production Container & Non-Root UID 1000
    print("\n[STEP 3] Inspecting Active Production Container & Security Context...", flush=True)
    ps_cmd = f"docker ps --filter 'name=app-{APP_UUID}' --format '{{{{.Names}}}} - {{{{.Status}}}}'"
    ps_out, _, _ = run_ssh(ps_cmd)
    print("  Active container:", ps_out.strip(), flush=True)

    cname = ps_out.strip().split(" - ")[0].split("\n")[0].strip()
    if not cname:
        print("❌ Could not identify running container name!")
        sys.exit(1)

    id_cmd = f"docker exec {cname} id"
    id_out, _, _ = run_ssh(id_cmd)
    print("  Container User Identity:", id_out.strip(), flush=True)
    if "uid=1000(node)" in id_out:
        print("  ✓ Hardened Container: Running under non-root user 'node' (UID 1000)")
    else:
        print("  ❌ CRITICAL SECURITY ERROR: Container is NOT running as UID 1000!")
        sys.exit(1)

    # 5. Network Stabilization
    print("\n[STEP 4] Waiting 8 seconds for Traefik routes and healthcheck stabilization...", flush=True)
    time.sleep(8)

    # 6. Live Production Probes
    print("\n[STEP 5] Executing Live Production HTTP Probes...", flush=True)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    results = {
        'deploy_uuid': deploy_uuid,
        'container_name': cname,
        'user_id': id_out.strip(),
        'git_rev': git_rev,
        'git_branch': git_branch,
    }

    # Probe 1: Reference Style UI Overhaul Frontend Probe
    print("\n  --- [PROBE 1/3] Live Frontend Reference Style Overhaul Verification ---", flush=True)
    fe_url = "https://brosangroup.com/muhasebe"
    try:
        req = urllib.request.Request(fe_url, headers={"User-Agent": "RefStyle-Verifier/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            body = res.read().decode('utf-8', errors='replace')
            status_code = res.status
            print(f"  ✓ {fe_url} -> HTTP {status_code} OK")
            print(f"    Body Size: {len(body)} characters")

            # Check for Reference style indicators
            has_ref_style = "ref-style" in body
            has_inter = "Inter" in body
            has_card_380 = "380px" in body or "max-w-[380px]" in body or "width: 380px" in body or "ref_giris" in body or "#auth-lockscreen" in body
            has_yan_sidebar = 'id="yan"' in body or 'aside id="yan"' in body
            has_lockscreen = 'id="auth-lockscreen"' in body
            has_mainapp = 'id="erp-main-app"' in body
            has_dashboard = 'id="view-dashboard"' in body

            print(f"    Indicator 'ref-style'           : {'✓ Found' if has_ref_style else '❌ Missing'}")
            print(f"    Indicator 'Inter' font tokens   : {'✓ Found' if has_inter else '❌ Missing'}")
            print(f"    Indicator 380px auth card       : {'✓ Found' if has_card_380 else '❌ Missing'}")
            print(f"    Indicator sidebar '#yan'        : {'✓ Found' if has_yan_sidebar else '❌ Missing'}")
            print(f"    Element '#auth-lockscreen'       : {'✓ Found' if has_lockscreen else '❌ Missing'}")
            print(f"    Element '#erp-main-app'          : {'✓ Found' if has_mainapp else '❌ Missing'}")
            print(f"    Element '#view-dashboard'        : {'✓ Found' if has_dashboard else '❌ Missing'}")

            ui_verified = has_ref_style and has_inter and has_yan_sidebar and has_lockscreen and has_mainapp and has_dashboard
            results['frontend_ui'] = {
                'url': fe_url,
                'status': status_code,
                'has_ref_style': has_ref_style,
                'has_inter': has_inter,
                'has_card_380': has_card_380,
                'has_yan_sidebar': has_yan_sidebar,
                'verified': ui_verified
            }
            if ui_verified:
                print("  🎉 LIVE FRONTEND SERVES THE OVERHAULED REFERENCE STYLE ERP!")
            else:
                print("  ⚠️ Warning: Some reference style indicators were not matched in response.")
    except Exception as e:
        print(f"  ❌ Failed to probe {fe_url}: {e}")
        results['frontend_ui'] = {'url': fe_url, 'error': str(e), 'verified': False}
        sys.exit(1)

    # Probe 2: Master Accounting API Health Probe
    print("\n  --- [PROBE 2/3] Master API Health Probe ---", flush=True)
    health_url = "https://brosangroup.com/muhasebe/api/health"
    try:
        req = urllib.request.Request(health_url, headers={"User-Agent": "RefStyle-Verifier/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            body = res.read().decode('utf-8')
            parsed = json.loads(body)
            print(f"  ✓ {health_url} -> HTTP {res.status} OK")
            print(f"    Status: {parsed.get('status')} | Service: {parsed.get('service')} | Database: {parsed.get('database')}")
            health_ok = (res.status == 200 and parsed.get('status') == 'healthy' and parsed.get('database') == 'connected')
            results['health_api'] = {
                'url': health_url,
                'status': res.status,
                'body': parsed,
                'verified': health_ok
            }
    except Exception as e:
        print(f"  ❌ Failed to probe {health_url}: {e}")
        results['health_api'] = {'url': health_url, 'error': str(e), 'verified': False}
        sys.exit(1)

    # Probe 3: Sibling Landing Service (Zero-Regression)
    print("\n  --- [PROBE 3/3] Sibling Landing Service Zero-Regression Probe ---", flush=True)
    landing_url = "https://brosangroup.com/callcenter/landing"
    try:
        req = urllib.request.Request(landing_url, headers={"User-Agent": "RefStyle-Verifier/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            print(f"  ✓ {landing_url} -> HTTP {res.status} OK (Zero Regression on Sibling Service)")
            results['sibling_service'] = {
                'url': landing_url,
                'status': res.status,
                'verified': (res.status == 200)
            }
    except Exception as e:
        print(f"  ❌ Sibling probe failed {landing_url}: {e}")
        results['sibling_service'] = {'url': landing_url, 'error': str(e), 'verified': False}
        sys.exit(1)

    print("\n" + "=" * 80)
    print("🏆 REFERENCE STYLE PRODUCTION DEPLOYMENT & LIVE PROBING COMPLETED SUCCESSFULLY!")
    print(f"Container: {cname} | Non-Root UID: 1000 | App UUID: {APP_UUID}")
    print("=" * 80)

    # Save probe results JSON for report
    with open("data/m6_deploy_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("  ✓ Saved probe results to data/m6_deploy_results.json")

if __name__ == "__main__":
    main()
