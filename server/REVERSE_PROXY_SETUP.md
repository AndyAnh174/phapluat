# Hướng dẫn Setup Reverse Proxy cho HCMUTE Exam System

## Tổng quan

Khi deploy với reverse proxy (bao gồm Zero Trust Proxy như Cloudflare Zero Trust), frontend và backend sẽ nằm cùng một domain:
- **Domain**: `phapluat.hcmutertic.com`
- **Frontend**: `https://phapluat.hcmutertic.com/` → `http://localhost:3000`
- **Backend API**: `https://phapluat.hcmutertic.com/api` → `http://localhost:3001`

## Cloudflare Tunnel (Cloudflared)

Nếu bạn sử dụng Cloudflare Tunnel (cloudflared), các cấu hình sau đây có thể được đơn giản hóa:

### Lợi ích của Cloudflare Tunnel:
- ✅ SSL/TLS termination tự động
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Không cần mở port ra ngoài (no public IP needed)
- ✅ Không cần cấu hình Nginx/Apache phức tạp
- ✅ Tự động routing qua Cloudflare edge network

### Cấu hình Cloudflare Tunnel:

1. **Cài đặt Cloudflared**:
   ```bash
   # Linux
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
   chmod +x /usr/local/bin/cloudflared

   # Windows
   # Download từ https://github.com/cloudflare/cloudflared/releases
   ```

2. **Đăng nhập Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```

3. **Tạo Tunnel**:
   ```bash
   cloudflared tunnel create phapluat
   ```

4. **Cấu hình Tunnel** (file `~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /path/to/credentials.json

   ingress:
     # Frontend
     - hostname: phapluat.hcmutertic.com
       service: http://localhost:3000
     
     # Backend API
     - hostname: phapluat.hcmutertic.com
       path: /api/*
       service: http://localhost:3001
     
     # Catch-all
     - service: http_status:404
   ```

5. **Chạy Tunnel**:
   ```bash
   # Run once
   cloudflared tunnel run phapluat

   # Hoặc chạy như service (Linux)
   cloudflared service install
   systemctl start cloudflared
   systemctl enable cloudflared
   ```

6. **Cấu hình DNS trong Cloudflare Dashboard**:
   - Vào DNS settings của domain `hcmutertic.com`
   - Tạo CNAME record:
     - Name: `phapluat`
     - Target: `<tunnel-id>.cfargotunnel.com`
     - Proxy: Enabled (orange cloud)

### Cấu hình Backend:

1. **Backend đã được cấu hình**:
   - `trust proxy` đã được bật trong `main.ts`
   - Backend sẽ tự động nhận headers từ Cloudflare Tunnel

2. **Environment Variables**:
   ```env
   GOOGLE_CALLBACK_URL=https://phapluat.hcmutertic.com/api/auth/google/callback
   FRONTEND_URL=https://phapluat.hcmutertic.com
   CORS_ORIGIN=https://phapluat.hcmutertic.com
   ```

3. **Google OAuth**:
   - Authorized redirect URIs: `https://phapluat.hcmutertic.com/api/auth/google/callback`
   - Authorized JavaScript origins: `https://phapluat.hcmutertic.com`

**Lưu ý**: 
- Với Cloudflare Tunnel, bạn không cần cấu hình Nginx/Apache phức tạp như bên dưới
- Không cần mở port 80/443 ra ngoài
- Tất cả traffic đi qua Cloudflare edge network
- Có thể cấu hình Access policies trong Cloudflare Zero Trust dashboard để kiểm soát truy cập

## Cấu hình Nginx

### 1. Tạo file cấu hình Nginx

Tạo file `/etc/nginx/sites-available/phapluat.hcmutertic.com`:

```nginx
server {
    listen 80;
    server_name phapluat.hcmutertic.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name phapluat.hcmutertic.com;

    # SSL Certificate (Let's Encrypt hoặc custom)
    ssl_certificate /etc/letsencrypt/live/phapluat.hcmutertic.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/phapluat.hcmutertic.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend (React/Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Body size (for file uploads)
        client_max_body_size 10M;
    }

    # Swagger Documentation (optional)
    location /api/docs {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Enable site và reload Nginx

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/phapluat.hcmutertic.com /etc/nginx/sites-enabled/

# Test cấu hình
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Cấu hình Apache (Alternative)

Nếu dùng Apache, cấu hình trong VirtualHost:

```apache
<VirtualHost *:443>
    ServerName phapluat.hcmutertic.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/phapluat.hcmutertic.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/phapluat.hcmutertic.com/privkey.pem

    # Frontend
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/

    # Backend API
    ProxyPass /api http://localhost:3001/api
    ProxyPassReverse /api http://localhost:3001/api

    # Headers
    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"
</VirtualHost>
```

## Cấu hình Environment Variables

### File `.env` (Production)

```env
# Server
PORT=3001
NODE_ENV=production

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$... # Use hashed password in production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://phapluat.hcmutertic.com/api/auth/google/callback

# MongoDB (production URI)
MONGODB_URI=mongodb://user:password@mongodb-host:27017/hcmute_exam?authSource=admin

# CORS (same domain, no CORS needed but keep for consistency)
CORS_ORIGIN=https://phapluat.hcmutertic.com

# Frontend URL
FRONTEND_URL=https://phapluat.hcmutertic.com
```

## Cấu hình Google OAuth

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Vào **APIs & Services** > **Credentials**
3. Chọn OAuth Client ID của bạn
4. Thêm **Authorized JavaScript origins**:
   ```
   https://phapluat.hcmutertic.com
   ```
5. Thêm **Authorized redirect URIs**:
   ```
   https://phapluat.hcmutertic.com/api/auth/google/callback
   ```
   **Lưu ý**: URL callback phải có prefix `/api` vì backend được proxy qua `/api`

## Cấu hình Frontend

Trong frontend, cấu hình API base URL:

```typescript
// config.ts
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Relative path khi cùng domain
  : 'http://localhost:3001';  // Development
```

## Kiểm tra

1. **Kiểm tra Frontend**:
   ```bash
   curl https://phapluat.hcmutertic.com
   ```

2. **Kiểm tra Backend API**:
   ```bash
   curl https://phapluat.hcmutertic.com/api/auth/admin/login
   ```

3. **Kiểm tra Swagger**:
   Mở trình duyệt: `https://phapluat.hcmutertic.com/api`

4. **Kiểm tra OAuth**:
   - Truy cập: `https://phapluat.hcmutertic.com/api/auth/google`
   - Kiểm tra redirect về Google OAuth
   - Sau khi đăng nhập, kiểm tra callback URL

## Troubleshooting

### Lỗi: "502 Bad Gateway"
- Kiểm tra backend có đang chạy không: `curl http://localhost:3001/api`
- Kiểm tra firewall có chặn port 3001 không
- Kiểm tra logs: `sudo tail -f /var/log/nginx/error.log`

### Lỗi: "OAuth redirect_uri_mismatch"
- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` khớp với Google Cloud Console
- Đảm bảo URL có prefix `/api`: `https://phapluat.hcmutertic.com/api/auth/google/callback`

### Lỗi: "CORS error"
- Vì frontend và backend cùng domain, không cần CORS
- Nếu vẫn lỗi, kiểm tra `CORS_ORIGIN` trong `.env`

### Lỗi: "X-Forwarded-For header missing"
- Backend đã được cấu hình `trust proxy` trong `main.ts`
- Kiểm tra Nginx có set `X-Forwarded-For` header không

## Security Best Practices

1. **SSL/TLS**: Luôn dùng HTTPS trong production
2. **Rate Limiting**: Cấu hình rate limiting trong Nginx
3. **Firewall**: Chỉ mở port 80, 443, đóng port 3000, 3001
4. **Secrets**: Không commit `.env` vào Git
5. **Password**: Dùng `ADMIN_PASSWORD_HASH` thay vì plaintext password

