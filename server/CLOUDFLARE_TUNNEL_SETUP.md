# Hướng dẫn Setup Cloudflare Tunnel cho HCMUTE Exam System

## Tổng quan

Cloudflare Tunnel (cloudflared) cho phép expose local services ra internet mà không cần mở port ra ngoài, tất cả traffic đi qua Cloudflare edge network.

## Lợi ích

- ✅ Không cần mở port 80/443 ra ngoài
- ✅ SSL/TLS tự động từ Cloudflare
- ✅ DDoS protection
- ✅ WAF (Web Application Firewall)
- ✅ Không cần public IP
- ✅ Dễ dàng quản lý qua Cloudflare dashboard

## Cài đặt

### Linux

```bash
# Download và cài đặt
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Kiểm tra
cloudflared --version
```

### Windows

1. Download từ: https://github.com/cloudflare/cloudflared/releases
2. Giải nén và thêm vào PATH
3. Hoặc sử dụng Chocolatey: `choco install cloudflared`

### macOS

```bash
brew install cloudflared
```

## Cấu hình

### Bước 1: Đăng nhập Cloudflare

```bash
cloudflared tunnel login
```

Lệnh này sẽ mở trình duyệt để bạn đăng nhập và authorize Cloudflare Tunnel.

### Bước 2: Tạo Tunnel

```bash
cloudflared tunnel create phapluat
```

Lệnh này sẽ tạo tunnel với tên `phapluat` và lưu credentials vào `~/.cloudflared/<tunnel-id>.json`

### Bước 3: Cấu hình Ingress

Tạo file `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>  # Lấy từ output của lệnh tunnel create
credentials-file: /home/user/.cloudflared/<tunnel-id>.json

ingress:
  # Frontend - root path
  - hostname: phapluat.hcmutertic.com
    service: http://localhost:3000
  
  # Backend API - /api path
  - hostname: phapluat.hcmutertic.com
    path: /api/*
    service: http://localhost:3001
  
  # Catch-all rule (phải ở cuối)
  - service: http_status:404
```

**Lưu ý quan trọng về thứ tự ingress rules**:
- Cloudflare Tunnel sẽ match rules theo thứ tự từ trên xuống
- Rule đầu tiên match sẽ được sử dụng
- Catch-all rule (`http_status:404`) phải luôn ở cuối cùng

### Bước 4: Cấu hình DNS

1. Vào Cloudflare Dashboard → DNS settings
2. Tạo CNAME record:
   - **Name**: `phapluat`
   - **Target**: `<tunnel-id>.cfargotunnel.com` (lấy từ output của `tunnel create`)
   - **Proxy status**: Proxied (orange cloud) ✅
   - **TTL**: Auto

### Bước 5: Chạy Tunnel

#### Chạy thủ công (testing)

```bash
cloudflared tunnel run phapluat
```

#### Chạy như service (production)

**Linux (systemd)**:

```bash
# Install service
sudo cloudflared service install

# Start service
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared

# View logs
sudo journalctl -u cloudflared -f
```

**Windows (Service)**:

```powershell
# Install service
cloudflared service install

# Start service
Start-Service cloudflared

# Check status
Get-Service cloudflared
```

## Cấu hình Backend

### Environment Variables

Cập nhật file `.env`:

```env
# Server
PORT=3001
NODE_ENV=production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://phapluat.hcmutertic.com/api/auth/google/callback

# CORS
CORS_ORIGIN=https://phapluat.hcmutertic.com

# Frontend URL
FRONTEND_URL=https://phapluat.hcmutertic.com
```

### Google OAuth Configuration

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

## Kiểm tra

1. **Kiểm tra tunnel đang chạy**:
   ```bash
   cloudflared tunnel list
   ```

2. **Kiểm tra frontend**:
   ```bash
   curl https://phapluat.hcmutertic.com
   ```

3. **Kiểm tra backend API**:
   ```bash
   curl https://phapluat.hcmutertic.com/api/auth/admin/login
   ```

4. **Kiểm tra Swagger**:
   Mở trình duyệt: `https://phapluat.hcmutertic.com/api`

## Troubleshooting

### Lỗi: "Unable to reach the origin"

- Kiểm tra frontend/backend có đang chạy không:
  ```bash
   curl http://localhost:3000
   curl http://localhost:3001/api
   ```
- Kiểm tra ingress rules trong `config.yml` có đúng không
- Kiểm tra tunnel có đang chạy không: `cloudflared tunnel list`

### Lỗi: "DNS resolution failed"

- Kiểm tra DNS record trong Cloudflare Dashboard
- Đảm bảo Proxy status là "Proxied" (orange cloud)
- Đợi vài phút để DNS propagate

### Lỗi: "OAuth redirect_uri_mismatch"

- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` khớp với Google Cloud Console
- Đảm bảo URL có prefix `/api`: `https://phapluat.hcmutertic.com/api/auth/google/callback`

### Xem logs

```bash
# Linux
sudo journalctl -u cloudflared -f

# Windows
Get-Content C:\ProgramData\cloudflared\cloudflared.log -Wait
```

## Security Best Practices

1. **Access Policies** (Optional):
   - Vào Cloudflare Zero Trust Dashboard
   - Tạo Access Application để kiểm soát truy cập
   - Có thể yêu cầu email domain cụ thể (ví dụ: @hcmute.edu.vn)

2. **WAF Rules**:
   - Cấu hình WAF rules trong Cloudflare Dashboard
   - Block các request đáng ngờ

3. **Rate Limiting**:
   - Cấu hình rate limiting trong Cloudflare Dashboard
   - Bảo vệ API khỏi abuse

4. **Secrets**:
   - Không commit credentials file vào Git
   - Bảo vệ file `~/.cloudflared/<tunnel-id>.json`

## Advanced Configuration

### Multiple Services

Nếu có nhiều services:

```yaml
tunnel: <tunnel-id>
credentials-file: /path/to/credentials.json

ingress:
  # API v1
  - hostname: phapluat.hcmutertic.com
    path: /api/v1/*
    service: http://localhost:3001
  
  # API v2
  - hostname: phapluat.hcmutertic.com
    path: /api/v2/*
    service: http://localhost:3002
  
  # Frontend
  - hostname: phapluat.hcmutertic.com
    service: http://localhost:3000
  
  # Catch-all
  - service: http_status:404
```

### Custom Headers

Có thể thêm custom headers trong Cloudflare Dashboard → Transform Rules.

## Tài liệu tham khảo

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflared GitHub](https://github.com/cloudflare/cloudflared)

