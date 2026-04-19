#!/bin/sh
# entrypoint.sh

# This script is designed to inject environment variables into the static
# index.html file before the Nginx server starts. This allows us to have
# a single Docker image that can be configured for different environments
# (development, staging, production) without rebuilding.

# The target file where variables will be injected
TARGET_FILE="/usr/share/nginx/html/index.html"

# Create a window.env object in the HTML's head section
# We are replacing a placeholder comment in the original index.html
# with a script block that defines our environment variables.
echo "Injecting environment variables..."

# Create a temporary file to hold the script content
cat <<EOF > /tmp/env.js
window.env = {
  VITE_TENANT_API_URL: "${VITE_TENANT_API_URL}",
  VITE_CHAT_API_URL: "${VITE_CHAT_API_URL}",
  VITE_METRICAS_API_URL: "${VITE_METRICAS_API_URL}",
  VITE_ORCH_API_URL: "${VITE_ORCH_API_URL}",
};
EOF

# Use sed to inject the script from the temp file into index.html
# We are looking for the </head> tag and inserting our script before it.
# This is a robust way to ensure it's placed correctly.
sed -i '/<\/head>/i <script src="/env.js"></script>' ${TARGET_FILE}

# Move the generated JS file to be served by Nginx
mv /tmp/env.js /usr/share/nginx/html/env.js

echo "Environment variables injected."

# Execute the original command (CMD) from the Dockerfile, which is to start Nginx
exec "$@"
