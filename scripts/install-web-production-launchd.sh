#!/bin/bash
set -euo pipefail

repo_root=$(cd "$(dirname "$0")/.." && pwd)
label=pj.dooit.web.production
agent_dir="$HOME/Library/LaunchAgents"
log_dir="$repo_root/logs/launchd"
plist="$agent_dir/$label.plist"

mkdir -p "$agent_dir" "$log_dir"

escaped_repo_root=${repo_root//&/&amp;}
escaped_repo_root=${escaped_repo_root//</&lt;}
escaped_repo_root=${escaped_repo_root//>/&gt;}

temp_plist=$(mktemp)
trap 'rm -f "$temp_plist"' EXIT

cat > "$temp_plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$label</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd &quot;$escaped_repo_root&quot; &amp;&amp; exec /opt/homebrew/bin/npx expo serve dist --port 4173</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$escaped_repo_root/logs/launchd/web-production.out.log</string>
  <key>StandardErrorPath</key>
  <string>$escaped_repo_root/logs/launchd/web-production.err.log</string>
</dict>
</plist>
EOF

plutil -lint "$temp_plist" >/dev/null
install -m 0644 "$temp_plist" "$plist"

domain="gui/$(id -u)"
launchctl bootout "$domain/$label" 2>/dev/null || true
launchctl bootstrap "$domain" "$plist"
launchctl kickstart -k "$domain/$label"

echo "Dooit Web LaunchAgent installed: $plist"
