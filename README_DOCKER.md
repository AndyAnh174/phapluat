# Docker Setup Guide

Hướng dẫn chạy ứng dụng HCMUTE Exam System với Docker.

## Yêu cầu

- Docker Engine 20.10+
- Docker Compose 2.0+

## Cấu trúc

```
.
├── docker-compose.yml      # Main compose file
├── server/
│   ├── Dockerfile          # Backend (NestJS) image
│   └── .env.production     # Production environment variables
├── client/
│   ├── Dockerfile          # Frontend (Next.js) image
│   └── .env.production     # Production environment variables
└── nginx/
    ├── Dockerfile          # Nginx reverse proxy
    └── nginx.conf          # Nginx configuration
```

## Services

1. **mongodb**: MongoDB database (port 27017 internal)
2. **server**: NestJS backend API (port 3001 internal)
3. **client**: Next.js frontend (port 3000 internal)
4. **nginx**: Reverse proxy (port 80 external)

## Quick Start

### 1. Build và chạy tất cả services

```bash
docker-compose up -d --build
```

### 2. Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Chỉ một service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f nginx
docker-compose logs -f mongodb
```

### 3. Kiểm tra status

```bash
docker-compose ps
```

### 4. Dừng services

```bash
docker-compose down
```

### 5. Dừng và xóa volumes (xóa data)

```bash
docker-compose down -v
```

## Environment Variables

### Server Environment

Tất cả biến môi trường được đọc từ file `server/.env`:

```bash
cd server
cp .env.example .env
# Sau đó chỉnh sửa các giá trị trong .env
```

Các biến quan trọng:
- `NODE_ENV=production`
- `MONGODB_URI`: Sẽ được override trong docker-compose để dùng service name `mongodb`
- `ADMIN_PASSWORD_HASH`: Hashed password (không dùng plaintext)
- `JWT_SECRET`: Strong random secret key
- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`: Từ Google Cloud Console
- `GOOGLE_CALLBACK_URL`: `http://phapluat.hcmutertic.com/api/auth/google/callback`
- `CORS_ORIGIN`: `http://phapluat.hcmutertic.com`
- `FRONTEND_URL`: `http://phapluat.hcmutertic.com`

### Client Environment

Tất cả biến môi trường được đọc từ file `client/.env`:

```bash
cd client
cp .env.example .env
# Sau đó chỉnh sửa các giá trị trong .env
```

Các biến quan trọng:
- `NEXT_PUBLIC_API_URL=/api` (relative path cho production)
- `NEXT_PUBLIC_FRONTEND_URL=http://phapluat.hcmutertic.com`

**Lưu ý**: Docker Compose sẽ tự động đọc từ file `.env` trong mỗi service thông qua `env_file`.

## Customization

### Thay đổi domain

1. Sửa `GOOGLE_CALLBACK_URL` trong `server/.env`
2. Sửa `CORS_ORIGIN` và `FRONTEND_URL` trong `server/.env`
3. Sửa `NEXT_PUBLIC_FRONTEND_URL` trong `client/.env`
4. Sửa `server_name` trong `nginx/nginx.conf`
5. Rebuild và restart:
   ```bash
   docker-compose up -d --build
   ```

### Thay đổi MongoDB credentials

1. Sửa `MONGO_INITDB_ROOT_USERNAME` và `MONGO_INITDB_ROOT_PASSWORD` trong `docker-compose.yml`
2. Sửa `MONGODB_URI` trong `server/.env` (hoặc override trong docker-compose.yml)
3. Rebuild và restart:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   ```

### Thay đổi admin password

1. Generate hash:
   ```bash
   node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('your-password', 10))"
   ```
2. Sửa `ADMIN_PASSWORD_HASH` trong `server/.env`
3. Restart server:
   ```bash
   docker-compose restart server
   ```

## Health Checks

Tất cả services đều có health checks:

- **mongodb**: Ping database
- **server**: HTTP GET `/api`
- **client**: HTTP GET `/`
- **nginx**: HTTP GET `/`

Xem health status:
```bash
docker-compose ps
```

## Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

- Kiểm tra mongodb service đang chạy: `docker-compose ps`
- Kiểm tra logs: `docker-compose logs mongodb`
- Đảm bảo `MONGODB_URI` trong server environment đúng với service name `mongodb`

### Lỗi: "502 Bad Gateway"

- Kiểm tra backend và frontend đang chạy: `docker-compose ps`
- Kiểm tra logs: `docker-compose logs nginx server client`
- Đảm bảo nginx config đúng với service names

### Lỗi: "OAuth redirect_uri_mismatch"

- Kiểm tra `GOOGLE_CALLBACK_URL` trong `docker-compose.yml` khớp với Google Cloud Console
- Đảm bảo URL có prefix `/api`: `http://phapluat.hcmutertic.com/api/auth/google/callback`

### Rebuild một service cụ thể

```bash
# Rebuild và restart server
docker-compose up -d --build server

# Rebuild và restart client
docker-compose up -d --build client

# Rebuild và restart nginx
docker-compose up -d --build nginx
```

### Xem resource usage

```bash
docker stats
```

## Production Notes

⚠️ **Security Recommendations**:

1. **Change default passwords**: Đổi MongoDB root password và admin password
2. **Use secrets**: Dùng Docker secrets hoặc environment files cho sensitive data
3. **Enable HTTPS**: Thêm SSL/TLS với Let's Encrypt hoặc Cloudflare
4. **Firewall**: Chỉ mở port 80 (và 443 nếu dùng HTTPS)
5. **Regular updates**: Update Docker images thường xuyên
6. **Backup**: Backup MongoDB data thường xuyên

## Backup & Restore

### Backup MongoDB

```bash
docker-compose exec mongodb mongodump --out /data/backup --username admin --password admin123 --authenticationDatabase admin
docker cp hcmute-exam-mongodb:/data/backup ./backup
```

### Restore MongoDB

```bash
docker cp ./backup hcmute-exam-mongodb:/data/backup
docker-compose exec mongodb mongorestore /data/backup --username admin --password admin123 --authenticationDatabase admin
```

