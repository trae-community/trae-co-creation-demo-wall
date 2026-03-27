# Docker 部署指南

本指南说明如何使用 Docker 将项目部署到国内服务器。

## 架构说明

Docker 部署方案包含三个容器：
- **app**: Next.js 应用
- **db**: PostgreSQL 数据库
- **redis**: Redis 缓存

所有服务在同一网络中，延迟最低。

## 前置要求

1. 安装 Docker 和 Docker Compose
2. 准备国内服务器（阿里云、腾讯云等）
3. 准备对象存储（七牛云、阿里云 OSS 等）

## 部署步骤

### 1. 克隆代码

```bash
git clone <repository-url>
cd trae-co-creation-demo-wall
git checkout feat/docker-deployment
```

### 2. 配置环境变量

```bash
cp .env.docker.example .env
```

编辑 `.env` 文件，配置：
- `NEXTAUTH_SECRET`: 生成随机密钥（`openssl rand -base64 32`）
- `NEXTAUTH_URL`: 你的域名或 IP
- 对象存储配置（七牛云或阿里云 OSS）

### 3. 构建并启动

```bash
docker-compose up -d
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
docker-compose exec app npx prisma migrate deploy

# 创建初始角色
docker-compose exec app npx prisma db seed
```

### 5. 访问应用

打开浏览器访问 `http://your-server-ip:3000`

## 数据迁移

如果从 Vercel + Supabase 迁移：

```bash
# 1. 导出 Supabase 数据
pg_dump $SUPABASE_URL > backup.sql

# 2. 导入到 Docker PostgreSQL
docker-compose exec -T db psql -U postgres -d trae_demo_wall < backup.sql
```

## 常用命令

```bash
# 查看日志
docker-compose logs -f app

# 重启服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 停止并删除数据
docker-compose down -v
```

## 生产环境优化

1. 使用 Nginx 反向代理
2. 配置 HTTPS 证书
3. 设置防火墙规则
4. 配置自动备份

## 故障排查

### 应用无法启动

```bash
docker-compose logs app
```

### 数据库连接失败

检查 `DATABASE_URL` 配置是否正确。

### Redis 连接失败

检查 `REDIS_URL` 配置是否正确。
