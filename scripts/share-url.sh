#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-4173}"

get_local_ip() {
  local iface ip
  iface="$(route -n get default 2>/dev/null | awk '/interface:/{print $2; exit}')"

  if [[ -n "${iface:-}" ]]; then
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "${ip:-}" ]]; then
      echo "$ip"
      return
    fi
  fi

  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [[ -n "${ip:-}" ]]; then
    echo "$ip"
    return
  fi

  ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -n "${ip:-}" ]]; then
    echo "$ip"
    return
  fi

  for iface in en0 en1 en2 en3 en4 en5 en6; do
    ip="$(ifconfig "$iface" 2>/dev/null | awk '/inet /{print $2; exit}')"
    if [[ -n "${ip:-}" && "${ip}" != 127.* ]]; then
      echo "$ip"
      return
    fi
  done

  ifconfig | awk '
    /^[a-z0-9]+: / { iface=$1; sub(":", "", iface) }
    /inet / && iface != "lo0" {
      ip=$2
      if (ip !~ /^127\./) {
        print ip
        exit
      }
    }
  '
}

IP="$(get_local_ip)"

if [[ -z "${IP:-}" ]]; then
  echo "Could not determine local IP address."
  echo "Try one of these manually:"
  echo "  ipconfig getifaddr en0"
  echo "  ipconfig getifaddr en1"
  exit 1
fi

echo "Share this URL on your local network:"
echo "http://${IP}:${PORT}"
