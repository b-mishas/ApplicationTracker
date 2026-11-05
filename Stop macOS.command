#!/bin/sh
cd "$(dirname "$0")" || exit 1
case "$(uname -m)" in
  arm64) tracker_arch=arm64 ;;
  x86_64) tracker_arch=x64 ;;
  *) printf 'Unsupported Mac processor.\n'; exit 1 ;;
esac
tracker_node="$PWD/runtime/darwin-$tracker_arch/node"
if [ ! -x "$tracker_node" ]; then
  chmod u+x "$tracker_node" 2>/dev/null
fi
if [ ! -x "$tracker_node" ]; then
  tracker_node="$(command -v node)"
fi
if [ -z "$tracker_node" ]; then
  printf 'Bundled Node is missing. Download and extract the complete Application tracker ZIP.\n'
  read -r tracker_reply
  exit 1
fi
"$tracker_node" "$PWD/app/launch.mjs" --stop
if [ "$?" -ne 0 ]; then
  printf 'Startup failed. Press Return to close.\n'
  read -r tracker_reply
fi
