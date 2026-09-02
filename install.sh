#!/usr/bin/env bash
# Install Backlog.md from this checkout: fetch dependencies, build the binary,
# and confirm the ~/.local/bin launcher is usable.
set -euo pipefail

SELF="${BASH_SOURCE[0]}"
SELF="$(readlink -f "$SELF" 2>/dev/null || printf '%s' "$SELF")"
HERE="$(cd "$(dirname "$SELF")" && pwd)"
cd "$HERE"

# Bun is not always on a non-interactive PATH (it may come from nvm or ~/.bun).
find_bun() {
	if command -v bun >/dev/null 2>&1; then
		command -v bun
		return 0
	fi
	local candidate
	for candidate in "$HOME/.bun/bin/bun" "$HOME"/.nvm/versions/node/*/bin/bun; do
		if [ -x "$candidate" ]; then
			printf '%s' "$candidate"
			return 0
		fi
	done
	return 1
}

if ! BUN="$(find_bun)"; then
	echo "error: bun not found. Install it from https://bun.sh, then re-run." >&2
	exit 1
fi
echo "bun: $BUN ($("$BUN" --version))"

echo "==> Installing dependencies"
"$BUN" install

echo "==> Building"
"$BUN" run build

BINARY="$HERE/dist/backlog"
if [ ! -x "$BINARY" ]; then
	echo "error: build did not produce $BINARY" >&2
	exit 1
fi
echo "built: $BINARY ($("$BINARY" --version))"

# scripts/build.ts links ~/.local/bin/backlog at the binary; report what resolved.
LAUNCHER="$HOME/.local/bin/backlog"
if [ -e "$LAUNCHER" ]; then
	echo "launcher: $LAUNCHER -> $(readlink -f "$LAUNCHER")"
else
	echo "warning: $LAUNCHER was not created; run '$BINARY' directly." >&2
fi

case ":${PATH}:" in
*":$HOME/.local/bin:"*) ;;
*) echo "warning: $HOME/.local/bin is not on PATH; add it to use 'backlog' by name." >&2 ;;
esac

RESOLVED="$(command -v backlog 2>/dev/null || true)"
if [ -n "$RESOLVED" ] && [ "$(readlink -f "$RESOLVED")" != "$(readlink -f "$BINARY")" ]; then
	echo "warning: 'backlog' on PATH resolves to $RESOLVED, not this build." >&2
fi

echo "Done."
