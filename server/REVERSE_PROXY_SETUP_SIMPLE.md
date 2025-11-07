# Hướng dẫn Setup Reverse Proxy (HTTP only, không SSL)

## Tổng quan

Cấu hình reverse proxy đơn giản với Nginx, không dùng SSL:
- **Domain**: `phapluat.hcmutertic.com`
- **Frontend**: `http://phapluat.hcmutertic.com/` → `http://localhost:3000`
- **Backend API**: `http://phapluat.hcmutertic.com/api` → `http://localhost:3001`

## Yêu cầu

- Nginx đã được cài đặt
- Domain `phapluat.hcmutertic.com` đã trỏ về server IP
- Frontend và Backend đã được build và sẵn sàng chạy

## Bước 1: Cài đặt Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx

# Kiểm tra Nginx đã chạy
sudo systemctl status nginx
```

## Bước 2: Cấu hình Nginx

1. **Copy file cấu hình**:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/phapluat.hcmutertic.com
   ```

2. **Tạo symbolic link**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/phapluat.hcmutertic.com /etc/nginx/sites-enabled/
   ```

3. **Test cấu hình**:
   ```bash
   sudo nginx -t
   ```

4. **Reload Nginx**:
   ```bash
   sudo systemctl reload nginx
   ```

## Bước 3: Cấu hình Environment Variables

### Server `.env` (Production)

Copy file mẫu và cập nhật:
```bash
cd server
cp .env.example .env
```

Sau đó chỉnh sửa các giá trị cần thiết trong file `.env`:
- `NODE_ENV=production`
- `ADMIN_PASSWORD_HASH`: Generate với bcrypt
  ```bash
  node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"
  ```
- `JWT_SECRET`: Đổi thành secret key mạnh
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`: Từ Google Cloud Console
- `MONGODB_URI`: URI MongoDB production (hoặc dùng Docker service name `mongodb`)
- `GOOGLE_CALLBACK_URL`: `http://phapluat.hcmutertic.com/api/auth/google/callback`
- `CORS_ORIGIN`: `http://phapluat.hcmutertic.com`
- `FRONTEND_URL`: `http://phapluat.hcmutertic.com`

### Client `.env` (Production)

Copy file mẫu và cập nhật:
```bash
cd client
cp .env.example .env
```

Sau đó chỉnh sửa các giá trị trong file `.env`:
```env
# API Configuration (relative path khi cùng domain)
NEXT_PUBLIC_API_URL=/api

# Frontend URL
NEXT_PUBLIC_FRONTEND_URL=http://phapluat.hcmutertic.com
```

## Bước 4: Cấu hình Google OAuth

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Vào **APIs & Services** > **Credentials**
3. Chọn OAuth Client ID của bạn
4. Thêm **Authorized JavaScript origins**:
   ```
   http://phapluat.hcmutertic.com
   ```
5. Thêm **Authorized redirect URIs**:
   ```
   http://phapluat.hcmutertic.com/api/auth/google/callback
   ```

**Lưu ý**: URL callback phải có prefix `/api` vì backend được proxy qua `/api`

## Bước 5: Build và chạy ứng dụng

### Backend

```bash
cd server
npm install
npm run build
npm run start:prod
```

### Frontend

```bash
cd client
npm install
npm run build
npm run start
```

## Bước 6: Kiểm tra

1. **Kiểm tra Frontend**:
   ```bash
   curl http://phapluat.hcmutertic.com
   ```

2. **Kiểm tra Backend API**:
   ```bash
   curl http://phapluat.hcmutertic.com/api/auth/admin/login
   ```

3. **Kiểm tra Swagger**:
   Mở trình duyệt: `http://phapluat.hcmutertic.com/api`

## Cấu hình Firewall

Chỉ mở port 80 (HTTP):

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

**Lưu ý**: Không mở port 3000 và 3001 ra ngoài, chỉ Nginx cần truy cập.

## Troubleshooting

### Lỗi: "502 Bad Gateway"
- Kiểm tra backend có đang chạy không: `curl http://localhost:3001`
- Kiểm tra frontend có đang chạy không: `curl http://localhost:3000`
- Kiểm tra logs: `sudo tail -f /var/log/nginx/error.log`

### Lỗi: "OAuth redirect_uri_mismatch"
- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` khớp với Google Cloud Console
- Đảm bảo URL có prefix `/api`: `http://phapluat.hcmutertic.com/api/auth/google/callback`

### Lỗi: "CORS error"
- Vì frontend và backend cùng domain, không cần CORS
- Nếu vẫn lỗi, kiểm tra `CORS_ORIGIN` trong `.env`

## Security Notes

⚠️ **Lưu ý**: Cấu hình này không dùng SSL, không an toàn cho production thực tế. Chỉ dùng cho:
- Testing/staging environment
- Internal network
- Development purposes

Để production thực tế, nên dùng HTTPS với Let's Encrypt hoặc Cloudflare.

