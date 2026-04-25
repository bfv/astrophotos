#!/bin/sh
cat <<EOF > /usr/share/nginx/html/config.js
window.__APP_CONFIG__ = {
  authAuthority: "${PUBLIC_AUTH_AUTHORITY}",
  authClientId: "${PUBLIC_AUTH_CLIENT_ID}"
};
EOF
exec nginx -g "daemon off;"
