# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Add package files
COPY package*.json ./

# Install dependencies with exact versions and only production dependencies
RUN npm ci --only=production --no-audit

# Add source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Add non-root user
RUN adduser -D static

# Create nginx directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run \
    && chown -R static:static /var/cache/nginx /var/log/nginx /var/run

# Copy the built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R static:static /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown -R static:static /etc/nginx

# Use non-root user
USER static

# Expose port 8080 (Cloud Run requirement)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget -q --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
