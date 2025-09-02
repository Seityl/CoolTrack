#!/bin/bash

echo "🚀 Cool Track PWA Installation Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the frontend directory."
    exit 1
fi

info "Starting PWA installation for Cool Track..."

# Step 1: Install dependencies
echo ""
info "Step 1: Installing PWA dependencies..."
yarn add vite-plugin-pwa@^0.17.4 workbox-window@^7.0.0
if [ $? -eq 0 ]; then
    success "PWA dependencies installed"
else
    error "Failed to install dependencies"
    exit 1
fi

# Step 2: Create directory structure
echo ""
info "Step 2: Creating directory structure..."
mkdir -p public/icons
mkdir -p src/hooks
mkdir -p src/components/pwa
mkdir -p scripts
success "Directory structure created"

# Step 3: Create manifest.json
echo ""
info "Step 3: Creating manifest.json..."
cat > public/manifest.json << 'EOF'
{
  "name": "Cool Track - Sensor Management System",
  "short_name": "Cool Track",
  "description": "Professional sensor and gateway management system for monitoring temperature, humidity, and environmental data",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "categories": ["productivity", "utilities", "business"],
  "lang": "en",
  "dir": "ltr",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "View system dashboard",
      "url": "/",
      "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]
    },
    {
      "name": "Sensors",
      "short_name": "Sensors",
      "description": "Manage sensors",
      "url": "/sensors",
      "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]
    },
    {
      "name": "Alerts",
      "short_name": "Alerts",
      "description": "View alerts",
      "url": "/alerts",
      "icons": [{"src": "/icons/icon-96x96.png", "sizes": "96x96"}]
    }
  ]
}
EOF
success "manifest.json created"

# Step 4: Create service worker
echo ""
info "Step 4: Creating service worker..."
cat > public/sw.js << 'EOF'
const CACHE_NAME = 'cool-track-v1.0.0';
const STATIC_CACHE_NAME = 'cool-track-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'cool-track-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Error caching static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const { request } = event;
  
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const cache = caches.open(DYNAMIC_CACHE_NAME);
          cache.then(c => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then(response => {
            return response || caches.match('/offline.html') || 
                   new Response('Offline - Please check your connection', {
                     status: 503,
                     statusText: 'Service Unavailable'
                   });
          });
      })
  );
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Cool Track',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: true,
    tag: data.tag || 'general'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Cool Track', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
EOF
success "Service worker created"

# Step 5: Create offline page
echo ""
info "Step 5: Creating offline page..."
cat > public/offline.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cool Track - Offline</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            padding: 3rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        
        .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            opacity: 0.8;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #2d3748;
        }
        
        .subtitle {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .retry-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.875rem 2rem;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
        }
        
        .retry-btn:hover {
            background: #2563eb;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📡</div>
        <h1>Cool Track</h1>
        <p class="subtitle">
            You're currently offline, but don't worry! Cool Track works even without an internet connection.
        </p>
        <button class="retry-btn" onclick="window.location.reload()">
            Try Again
        </button>
    </div>
</body>
</html>
EOF
success "Offline page created"

# Step 6: Create placeholder icons (you'll need to replace these with actual icons)
echo ""
info "Step 6: Creating placeholder icons..."
warning "Note: You'll need to replace these with actual icons later"

# Create simple placeholder icons using ImageMagick if available
if command -v convert &> /dev/null; then
    # Create placeholder icons
    sizes=(72 96 128 144 152 192 384 512)
    for size in "${sizes[@]}"; do
        convert -size ${size}x${size} canvas:blue -fill white -gravity center -pointsize $((size/4)) -annotate +0+0 "CT" public/icons/icon-${size}x${size}.png
    done
    success "Placeholder icons created with ImageMagick"
else
    # Create simple HTML-based icons (fallback)
    warning "ImageMagick not found. Creating simple placeholder files."
    warning "Please replace with actual PNG icons later."
    for size in 72 96 128 144 152 192 384 512; do
        touch public/icons/icon-${size}x${size}.png
    done
fi

# Step 7: Update vite.config.ts
echo ""
info "Step 7: Updating vite.config.ts..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/resource\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
EOF
success "vite.config.ts updated"

# Step 8: Create PWA validation script
echo ""
info "Step 8: Creating PWA validation script..."
cat > scripts/validate-pwa.js << 'EOF'
const fs = require('fs');

console.log('🔍 Cool Track PWA Validation\n');

// Check required files
const requiredFiles = [
  'public/manifest.json',
  'public/sw.js',
  'public/offline.html'
];

let filesValid = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    filesValid = false;
  }
});

// Validate manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  console.log('✅ Manifest.json is valid JSON');
  console.log(`   Name: ${manifest.name}`);
  console.log(`   Icons: ${manifest.icons ? manifest.icons.length : 0} defined`);
} catch (err) {
  console.log(`❌ Invalid manifest.json: ${err.message}`);
  filesValid = false;
}

console.log(filesValid ? '\n🎉 PWA setup looks good!' : '\n⚠️  Please fix the issues above');
EOF
success "PWA validation script created"

# Step 9: Update package.json scripts
echo ""
info "Step 9: Adding PWA scripts to package.json..."
if [ -f "package.json" ]; then
    # Create backup
    cp package.json package.json.backup
    
    # Add PWA scripts (basic implementation)
    warning "Please manually add these scripts to your package.json:"
    echo '  "pwa:validate": "node scripts/validate-pwa.js",'
    echo '  "pwa:test": "npx lighthouse http://localhost:4173 --output=html",'
    echo '  "pwa:build-and-test": "yarn build && yarn preview & sleep 3 && yarn pwa:validate"'
fi

# Step 10: Final validation
echo ""
info "Step 10: Running initial validation..."
if [ -f "scripts/validate-pwa.js" ]; then
    node scripts/validate-pwa.js
fi

# Final instructions
echo ""
echo "🎉 PWA Installation Complete!"
echo "================================"
echo ""
info "Next steps:"
echo "1. Replace placeholder icons in public/icons/ with actual PNG files"
echo "2. Copy the PWA hooks and components from the provided artifacts"
echo "3. Update your App.tsx to include PWA integration"
echo "4. Test with: yarn dev"
echo "5. Build with: yarn build && yarn preview"
echo "6. Test PWA features in browser DevTools"
echo ""
warning "Important: You still need to:"
echo "- Create actual PNG icons (8 different sizes)"
echo "- Add PWA hooks (src/hooks/usePWA.ts)"
echo "- Add PWA components (src/components/pwa/PWAComponents.tsx)"
echo "- Update App.tsx with PWA integration"
echo ""
success "PWA foundation is now installed! 🚀"
EOF
success "Automated PWA installation script created"