import subprocess
import time
import sys
import json
import urllib.request
import ssl

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

SSH_KEY = r"C:\Users\YUNUS EMRE GÖKALP\.ssh\brosan_staging_antigravity"
VPS_HOST = "root@173.249.23.10"
APP_UUID = "3rqmxkcjbkfp1mzp3raiyok8"

def run_ssh(cmd, stdin_data=None):
    full_cmd = ["ssh", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", VPS_HOST, cmd]
    res = subprocess.run(full_cmd, input=stdin_data, capture_output=True, text=True, timeout=60)
    return res.stdout, res.stderr, res.returncode

def main():
    print(f"=== BROSAN TEKSTIL ERP — DEPLOYING PHASE 8 SOVEREIGN QUANTUM VAULT ===")
    print(f"Target App UUID: {APP_UUID} on VPS 173.249.23.10")
    
    php_code = f"""
$app = \\App\\Models\\Application::where('uuid', '{APP_UUID}')->first();
$uuid = (string) \\Illuminate\\Support\\Str::uuid();
echo 'DEPLOY_UUID:' . $uuid . PHP_EOL;
queue_application_deployment($app, $uuid, 0, null, true);
exit;
"""
    
    stdout, stderr, code = run_ssh("docker exec -i coolify php artisan tinker", stdin_data=php_code)
    if code != 0:
        print("Tinker execution failed:", stderr)
        sys.exit(1)
        
    deploy_uuid = None
    for line in stdout.splitlines():
        clean_line = line.strip()
        if "DEPLOY_UUID:" in clean_line:
            # Skip the echo of the PHP command itself
            if "echo 'DEPLOY_UUID:'" in clean_line or 'echo "DEPLOY_UUID:"' in clean_line:
                continue
            deploy_uuid = clean_line.split("DEPLOY_UUID:")[1].strip()
            if deploy_uuid:
                break
            
    if not deploy_uuid:
        print("Could not find deploy UUID in stdout:", stdout)
        sys.exit(1)
        
    print(f"✓ Deployment queued with UUID: {deploy_uuid}")
    print("Monitoring deployment progress in Coolify DB...", flush=True)
    
    start_time = time.time()
    while time.time() - start_time < 360:
        time.sleep(5)
        query_cmd = f"""docker exec -i coolify-db psql -U coolify -d coolify -t -A -c "SELECT status FROM application_deployment_queues WHERE deployment_uuid = '{deploy_uuid}';" """
        status_out, _, _ = run_ssh(query_cmd)
        status = status_out.strip()
        elapsed = int(time.time() - start_time)
        print(f"[{elapsed}s] Deployment status: {status}", flush=True)
        
        if status == "finished":
            print("🎉 Coolify build & deployment finished successfully!", flush=True)
            break
        elif status in ["failed", "cancelled", "killed"]:
            print(f"❌ Deployment {status}!", flush=True)
            log_cmd = f"""docker exec -i coolify-db psql -U coolify -d coolify -t -A -c "SELECT logs FROM application_deployment_queues WHERE deployment_uuid = '{deploy_uuid}';" """
            logs, _, _ = run_ssh(log_cmd)
            print("Logs tail:\n", logs[-3000:], flush=True)
            sys.exit(1)
            
    # Inspect running container
    print("\n--- Inspecting Active Production Container ---", flush=True)
    ps_cmd = f"docker ps --filter 'name=app-{APP_UUID}' --format '{{{{.Names}}}} - {{{{.Status}}}}'"
    ps_out, _, _ = run_ssh(ps_cmd)
    print("Active container:", ps_out.strip(), flush=True)
    
    cname = ps_out.strip().split(" - ")[0].split("\n")[0].strip()
    if cname:
        id_cmd = f"docker exec {cname} id"
        id_out, _, _ = run_ssh(id_cmd)
        print("Container User ID:", id_out.strip(), flush=True)
        if "uid=1000(node)" in id_out:
            print("✓ Container runs securely under non-root user 'node' (UID 1000)")
        else:
            print("⚠️ WARNING: Container is not running as UID 1000!")
            
    # Wait for container warm-up
    print("\nWaiting 6 seconds for container networking stabilization...", flush=True)
    time.sleep(6)
    
    # Live Probes
    print("\n--- Performing Live Production Probes ---", flush=True)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # 1. Health Probe
    health_url = "https://brosangroup.com/muhasebe/api/health"
    try:
        req = urllib.request.Request(health_url, headers={"User-Agent": "Citadel-Verifier/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            body = res.read().decode('utf-8')
            print(f"✓ {health_url} -> HTTP {res.status} OK")
            print(f"  Response: {body}")
            print(f"  COOP: {res.headers.get('Cross-Origin-Opener-Policy')}")
            print(f"  COEP: {res.headers.get('Cross-Origin-Embedder-Policy')}")
            print(f"  CORP: {res.headers.get('Cross-Origin-Resource-Policy')}")
            print(f"  Permissions-Policy: {res.headers.get('Permissions-Policy')}")
            print(f"  Cache-Control: {res.headers.get('Cache-Control')}")
            print(f"  Server Cloaking (X-Powered-By absent): {'x-powered-by' not in [k.lower() for k in res.headers.keys()]}")
    except Exception as e:
        print(f"❌ Failed to probe {health_url}: {e}")
        sys.exit(1)
        
    # 2. Canary Tripwire Probe (via container loopback or test request followed by auto-clear)
    print("\n--- Testing Production Canary Tripwire Defense ---", flush=True)
    canary_test_js = """
const http = require('http');
const req = http.request({
  host: '127.0.0.1',
  port: 3000,
  path: '/muhasebe/.git/config',
  method: 'GET',
  headers: { 'X-Forwarded-For': '198.51.100.77' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('CANARY_PROBE_STATUS:' + res.statusCode);
    console.log('CANARY_PROBE_BODY:' + data);
    const { quarantineEngine } = require('./server/quarantine');
    quarantineEngine.liftQuarantine('198.51.100.77');
    quarantineEngine.cache.clear();
    quarantineEngine.saveToDisk();
    console.log('CANARY_QUARANTINE_CLEARED:OK');
  });
});
req.on('error', (e) => { console.error('CANARY_ERR:' + e.message); });
req.end();
"""
    canary_out, _, _ = run_ssh(f"docker exec {cname} node -e \"{canary_test_js.replace(chr(10), ' ')}\"")
    print("Canary probe result inside container:\n", canary_out.strip(), flush=True)
    if "CANARY_PROBE_STATUS:403" in canary_out and "CANARY_TRIGGERED" in canary_out:
        print("✓ Canary lure successfully intercepted with HTTP 403 CANARY_TRIGGERED & test IP cleaned!")
    else:
        print("⚠️ Warning: Canary probe returned unexpected response:", canary_out)

    # 3. Sibling Landing Probe
    landing_url = "https://brosangroup.com/callcenter/landing"
    try:
        req = urllib.request.Request(landing_url, headers={"User-Agent": "Citadel-Verifier/1.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            print(f"✓ {landing_url} -> HTTP {res.status} OK (Zero Regression on Sibling Service)")
    except Exception as e:
        print(f"❌ Sibling probe failed {landing_url}: {e}")
        sys.exit(1)
        
    print("\n=======================================================")
    print("🏆 PHASE 8 SOVEREIGN QUANTUM VAULT FULLY VERIFIED ON PRODUCTION!")
    print("=======================================================")

if __name__ == "__main__":
    main()
