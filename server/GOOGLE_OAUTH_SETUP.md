# Hướng dẫn Setup Google OAuth cho HCMUTE Exam System

## Bước 1: Tạo Project trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập bằng tài khoản Google của bạn
3. Tạo một project mới hoặc chọn project có sẵn:
   - Click vào dropdown project ở top bar
   - Click "New Project"
   - Đặt tên project (ví dụ: "HCMUTE Exam System")
   - Click "Create"

## Bước 2: Enable Google+ API

1. Trong Google Cloud Console, vào **APIs & Services** > **Library**
2. Tìm "Google+ API" hoặc "Google Identity Services"
3. Click vào và chọn **Enable**

## Bước 3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Nếu chưa có OAuth consent screen, bạn sẽ được yêu cầu cấu hình:
   - **User Type**: Chọn "External" (hoặc "Internal" nếu dùng Google Workspace)
   - **App name**: Nhập tên ứng dụng (ví dụ: "HCMUTE Exam System")
   - **User support email**: Chọn email của bạn
   - **Developer contact information**: Nhập email của bạn
   - Click **Save and Continue**
   - **Scopes**: Click **Add or Remove Scopes**, chọn:
     - `userinfo.email`
     - `userinfo.profile`
   - Click **Save and Continue**
   - **Test users**: Thêm email test (nếu cần)
   - Click **Save and Continue**

4. Tạo OAuth Client ID:
   - **Application type**: Chọn "Web application"
   - **Name**: Đặt tên (ví dụ: "HCMUTE Exam System Web Client")
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3001
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3001/auth/google/callback
     ```
   - Click **Create**

5. Sau khi tạo, bạn sẽ thấy:
   - **Your Client ID**: Copy giá trị này
   - **Your Client Secret**: Copy giá trị này

## Bước 4: Cấu hình trong file `.env`

Mở file `.env` và cập nhật:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

## Bước 5: Cấu hình cho Production (với Reverse Proxy)

Khi deploy lên production với reverse proxy (ví dụ: `phapluat.hcmutertic.com`), cần cập nhật:

### Với Cloudflare Tunnel (Cloudflared)

Nếu bạn sử dụng Cloudflare Tunnel:
1. Cài đặt `cloudflared` và tạo tunnel
2. Cấu hình ingress trong `~/.cloudflared/config.yml`:
   - Frontend: `phapluat.hcmutertic.com` → `http://localhost:3000`
   - Backend: `phapluat.hcmutertic.com/api/*` → `http://localhost:3001`
3. Chạy tunnel: `cloudflared tunnel run phapluat`
4. Backend đã được cấu hình `trust proxy` nên sẽ tự động hoạt động
5. Không cần mở port ra ngoài, tất cả traffic đi qua Cloudflare edge network

### Cấu hình Reverse Proxy (Nginx/Apache) - Traditional Setup

Ví dụ cấu hình Nginx:

```nginx
server {
    listen 80;
    server_name phapluat.hcmutertic.com;

    # Frontend (React/Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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
    }
}
```

### Cấu hình Google OAuth

1. **Trong Google Cloud Console**:
   - Vào **Credentials** > Chọn OAuth Client ID của bạn
   - Thêm **Authorized JavaScript origins**:
     ```
     https://phapluat.hcmutertic.com
     ```
   - Thêm **Authorized redirect URIs**:
     ```
     https://phapluat.hcmutertic.com/api/auth/google/callback
     ```
   - Lưu ý: URL callback phải có prefix `/api` vì backend được proxy qua `/api`

2. **Trong file `.env`** (production):
   ```env
   GOOGLE_CALLBACK_URL=https://phapluat.hcmutertic.com/api/auth/google/callback
   FRONTEND_URL=https://phapluat.hcmutertic.com
   CORS_ORIGIN=https://phapluat.hcmutertic.com
   ```

### Lưu ý về Reverse Proxy

- Backend đã được cấu hình `trust proxy` để nhận đúng IP và protocol từ reverse proxy
- Frontend và Backend nằm cùng domain nên không cần CORS phức tạp
- OAuth callback URL phải khớp với route được proxy (ví dụ: `/api/auth/google/callback`)

## Bước 6: Kiểm tra Domain Restriction

Hệ thống đã được cấu hình để chỉ cho phép email từ domain HCMUTE:
- `@student.hcmute.edu.vn`
- `@hcmute.edu.vn`

Nếu bạn muốn test với email khác, có thể tạm thời comment phần validation trong `src/auth/strategies/google.strategy.ts`.

## Lưu ý

1. **OAuth Consent Screen**: 
   - Ở chế độ "Testing", chỉ có thể đăng nhập với email đã thêm vào test users
   - Để public, cần submit app để Google review (có thể mất vài ngày)

2. **Client Secret**: 
   - Giữ bí mật, không commit vào Git
   - Nếu bị lộ, có thể revoke và tạo mới trong Google Cloud Console

3. **Rate Limits**:
   - Google OAuth có giới hạn số request
   - Nếu vượt quá, có thể cần upgrade billing account

## Troubleshooting

### Lỗi: "redirect_uri_mismatch"
- Kiểm tra `GOOGLE_CALLBACK_URL` trong `.env` khớp với **Authorized redirect URIs** trong Google Cloud Console
- Đảm bảo không có trailing slash

### Lỗi: "invalid_client"
- Kiểm tra `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` đã đúng chưa
- Đảm bảo không có khoảng trắng thừa

### Lỗi: "access_denied" khi đăng nhập
- Kiểm tra email có trong test users (nếu app ở chế độ Testing)
- Kiểm tra domain email có được phép không

### Email không thuộc domain HCMUTE
- Kiểm tra logic validation trong `src/auth/strategies/google.strategy.ts`
- Đảm bảo email có format `@student.hcmute.edu.vn` hoặc `@hcmute.edu.vn`

