# HCMUTE Exam System

Hệ thống web trắc nghiệm dành cho học sinh HCMUTE với quản trị viên và module sách di sản.

## Tính năng

- **Xác thực Admin**: Đăng nhập bằng username/password từ environment variables
- **Xác thực Học sinh**: Đăng nhập qua Google OAuth (chỉ domain HCMUTE)
- **Quản lý đề thi**: CRUD bộ đề thi, câu hỏi
- **Làm bài thi**: Học sinh làm bài, tính điểm tự động
- **Kết quả & Thống kê**: Xem kết quả, xuất CSV/JSON
- **Sách di sản**: Module quản lý và hiển thị sách

## Yêu cầu

- Node.js >= 18
- pnpm
- Docker & Docker Compose (cho MongoDB)

## Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
pnpm install
```

### 2. Cấu hình MongoDB với Docker Compose

```bash
docker-compose up -d
```

MongoDB sẽ chạy trên port 27017 với:
- Username: `admin`
- Password: `admin123`
- Database: `hcmute_exam`

### 3. Tạo file `.env`

Sao chép `.env.example` và điền các giá trị:

```bash
cp .env.example .env
```

Các biến môi trường cần thiết:

```env
# Server
PORT=3001
NODE_ENV=development

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
# Hoặc dùng hash: ADMIN_PASSWORD_HASH=$2b$10$...

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# Google OAuth
# Xem hướng dẫn chi tiết trong GOOGLE_OAUTH_SETUP.md
# 1. Tạo project trên Google Cloud Console
# 2. Enable Google+ API
# 3. Tạo OAuth 2.0 Client ID
# 4. Copy Client ID và Client Secret vào đây
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

# MongoDB
MONGODB_URI=mongodb://admin:admin123@localhost:27017/hcmute_exam?authSource=admin

# CORS
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 4. Chạy ứng dụng

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

Backend sẽ chạy tại `http://localhost:3001`
Swagger documentation: `http://localhost:3001/api`
Frontend nên chạy tại `http://localhost:3000`

### 5. Setup Google OAuth (cho Student Login)

Xem hướng dẫn chi tiết trong file [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

Tóm tắt:
1. Tạo project trên [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Tạo OAuth 2.0 Client ID
4. Copy `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` vào file `.env`

Xem hướng dẫn chi tiết trong [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

### 6. Cấu hình Production với Reverse Proxy

Khi deploy với reverse proxy (ví dụ: `phapluat.hcmutertic.com`):

#### Với Cloudflare Tunnel (Cloudflared)

1. **Cài đặt và cấu hình Cloudflare Tunnel**:
   ```bash
   cloudflared tunnel login
   cloudflared tunnel create phapluat
   ```
   
2. **Cấu hình ingress** (file `~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <tunnel-id>
   ingress:
     - hostname: phapluat.hcmutertic.com
       service: http://localhost:3000
     - hostname: phapluat.hcmutertic.com
       path: /api/*
       service: http://localhost:3001
     - service: http_status:404
   ```

3. **Chạy tunnel**:
   ```bash
   cloudflared tunnel run phapluat
   ```

4. **Cập nhật `.env`**:
   ```env
   GOOGLE_CALLBACK_URL=https://phapluat.hcmutertic.com/api/auth/google/callback
   FRONTEND_URL=https://phapluat.hcmutertic.com
   CORS_ORIGIN=https://phapluat.hcmutertic.com
   ```

5. **Cập nhật Google OAuth** trong Google Cloud Console:
   - Authorized redirect URIs: `https://phapluat.hcmutertic.com/api/auth/google/callback`
   - Authorized JavaScript origins: `https://phapluat.hcmutertic.com`

#### Với Nginx/Apache (Traditional)

Xem hướng dẫn chi tiết trong [REVERSE_PROXY_SETUP.md](./REVERSE_PROXY_SETUP.md)

**Lưu ý**: 
- Backend đã được cấu hình `trust proxy` để hoạt động với reverse proxy
- Với Cloudflare Tunnel, không cần mở port ra ngoài và không cần cấu hình Nginx/Apache

## API Documentation

Xem tài liệu API chi tiết trong [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

Swagger UI (Interactive): 
- Development: `http://localhost:3001/api`
- Production: `https://phapluat.hcmutertic.com/api`

## API Endpoints

### Authentication

- `POST /auth/admin/login` - Đăng nhập admin
- `GET /auth/admin/me` - Thông tin admin (cần JWT)
- `GET /auth/google` - Bắt đầu Google OAuth
- `GET /auth/google/callback` - Callback Google OAuth
- `GET /auth/student/me` - Thông tin học sinh (cần JWT)

### Admin - Exam Sets

- `GET /admin/exam-sets` - Danh sách bộ đề
- `POST /admin/exam-sets` - Tạo bộ đề mới
- `GET /admin/exam-sets/:id` - Chi tiết bộ đề
- `PATCH /admin/exam-sets/:id` - Cập nhật bộ đề
- `DELETE /admin/exam-sets/:id` - Xóa bộ đề
- `POST /admin/exam-sets/:id/duplicate` - Sao chép bộ đề

### Admin - Questions

- `GET /admin/exam-sets/:examSetId/questions` - Danh sách câu hỏi
- `POST /admin/exam-sets/:examSetId/questions` - Tạo câu hỏi
- `POST /admin/exam-sets/:examSetId/questions/bulk` - Tạo nhiều câu hỏi
- `GET /admin/questions/:id` - Chi tiết câu hỏi
- `PATCH /admin/questions/:id` - Cập nhật câu hỏi
- `DELETE /admin/questions/:id` - Xóa câu hỏi

### Admin - Exam Activation

- `POST /admin/exam/activate` - Kích hoạt bài thi
- `POST /admin/exam/deactivate` - Tắt bài thi
- `GET /admin/exam/status` - Trạng thái bài thi

### Admin - Results

- `GET /admin/results` - Danh sách kết quả
- `GET /admin/results/:sessionId` - Chi tiết kết quả
- `POST /admin/results/:sessionId/reset` - Reset để làm lại
- `GET /admin/results/export/json` - Xuất JSON
- `GET /admin/results/export/csv` - Xuất CSV

### Admin - Books

- `GET /admin/books` - Danh sách sách
- `POST /admin/books` - Tạo sách mới
- `GET /admin/books/:id` - Chi tiết sách
- `PATCH /admin/books/:id` - Cập nhật sách
- `DELETE /admin/books/:id` - Xóa sách

### Student - Exam

- `GET /student/exam/status` - Trạng thái bài thi đang mở
- `POST /student/exam/start` - Bắt đầu làm bài
- `POST /student/exam/submit` - Nộp bài
- `GET /student/exam/result/:sessionId` - Xem kết quả

### Public - Books

- `GET /books` - Danh sách sách công khai
- `GET /books/:id` - Chi tiết sách công khai

## Bảo mật

- Rate limiting cho `/auth/admin/login` (5 lần/phút)
- Helmet middleware cho security headers
- CORS được cấu hình
- JWT authentication
- Validation pipes
- Không log password/credentials

## Testing

```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

## Deployment

### Environment Variables cho Production

Đảm bảo các biến sau được cấu hình:

- `NODE_ENV=production`
- `JWT_SECRET` - Secret key mạnh
- `ADMIN_PASSWORD_HASH` - Dùng bcrypt hash thay vì plaintext
- `MONGODB_URI` - Connection string MongoDB production
- `CORS_ORIGIN` - Whitelist frontend domains
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` - Production OAuth credentials

### Docker

Có thể build Docker image:

```bash
docker build -t hcmute-exam-system .
docker run -p 3001:3001 --env-file .env hcmute-exam-system
```

## Cấu trúc Project

```
src/
├── auth/              # Authentication (Admin, Student, Google OAuth)
├── users/             # User management
├── exam-sets/         # Exam set CRUD
├── questions/         # Question management
├── exam/              # Exam activation
├── exam-sessions/     # Student exam taking
├── results/           # Results & export
├── books/             # Book module
├── schemas/           # Mongoose schemas
├── config/            # Configuration
├── common/            # Common utilities (filters, pipes, decorators)
└── main.ts            # Application entry point
```

## License

MIT
