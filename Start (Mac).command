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
  if [ "$tracker_arch" = arm64 ]; then
    printf 'Apple silicon runtime missing. This Mac needs Application-tracker-mac-apple-silicon.zip.\n'
  else
    printf 'Mac Intel runtime missing. This Mac needs Application-tracker-mac-intel.zip.\n'
  fi
  read -r tracker_reply
  exit 1
fi
"$tracker_node" "$PWD/app/launch.mjs" --interactive
if [ "$?" -ne 0 ]; then
  printf 'Startup failed. Press Return to close.\n'
  read -r tracker_reply
  exit 1
fi
