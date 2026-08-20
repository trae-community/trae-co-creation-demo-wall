# Docker 部署指南

本指南说明如何使用 Docker 将项目部署到国内服务器。

## 架构说明

`docker-compose.yml` 定义了 6 个服务，所有服务在同一网络中，容器间通过服务名通信（延迟最低）：

| 服务 | 说明 | 端口 |
|------|------|------|
| `app` | Next.js 生产应用 | 3000（内部） |
| `app-init` | 一次性初始化容器（自动迁移 + 种子数据，完成后退出） | - |
| `db` | PostgreSQL 生产数据库 | 5432 |
| `db-dev` | PostgreSQL 开发数据库（仅供本地开发） | 5433 |
| `redis` | Redis 缓存 | 6379 |
| `nginx` | 反向代理（对外入口） | 80 |

> 生产部署实际使用 `app / app-init / db / redis / nginx` 五个服务；`db-dev` 与 `db` 并存是正常的——一个开发用、一个生产用。

## 前置要求

1. 安装 Docker 和 Docker Compose（使用 `docker compose` 子命令，非旧的 `docker-compose`）
2. 准备国内服务器（阿里云、腾讯云等）
3. 准备腾讯云 COS 对象存储（用于作品封面、头像等文件上传）

## 部署步骤

### 1. 克隆代码

```bash
git clone <repository-url>
cd trae-co-creation-demo-wall
```

### 2. 配置环境变量

```bash
cp .env.docker.example .env
```

编辑 `.env` 文件，配置：
- `NEXTAUTH_SECRET`: 生成随机密钥（`openssl rand -base64 32`）
- `NEXTAUTH_URL`: 你的域名或服务器 IP（默认走 nginx 入口，端口 80）
- 腾讯云 COS 配置（`COS_SECRET_ID` / `COS_SECRET_KEY` / `COS_BUCKET` / `COS_REGION`）

### 3. 构建并启动

```bash
docker compose up -d --build
```

`app-init` 容器会自动完成数据库初始化（Prisma 迁移 + 种子数据，执行 `prisma db push` + `npm run seed`），完成后自动退出；`app` 会等待其成功后才启动，无需手动执行迁移命令。

### 4. 访问应用

打开浏览器访问 `http://your-server-ip`（nginx 对外暴露端口 80）。

## 更新部署

代码更新后重新部署时，**必须加 `--force-recreate`**，否则数据库初始化不会重跑：

```bash
# 服务器（当前生产环境使用 docker-compose V1）
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# 本地或已安装 compose V2 插件的环境
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

> ⚠️ 命令选择：`docker compose`（空格，V2 插件）与 `docker-compose`（连字符，V1）不兼容。若执行时报 `unknown shorthand flag: 'f'`，说明环境只有 V1，改用连字符写法即可。

> ⚠️ 原理说明：`app-init` 是一次性初始化容器（`restart: "no"`），`app` 通过 `service_completed_successfully` 等待它。Docker Compose 判断条件时依据的是容器**上一次的退出状态**——如果 `app-init` 旧容器已存在且退出码为 0，Compose 认为条件已满足，直接启动 `app`，不会重跑初始化。`--force-recreate` 强制重建所有容器，确保每次更新都会重新执行 `prisma db push` + `seed`。

### 更新流程做了什么

| 步骤 | 行为 |
|------|------|
| 构建镜像 | 打包本次所有代码改动到镜像 |
| `prisma db push` | 按 schema 差异**增量同步**表结构（只加表、加字段），不删数据 |
| `seed` | 幂等执行：角色、字典等基础数据存在即跳过；root 用户**已存在则完全跳过**（不覆盖用户名和密码） |
| 数据卷 | PostgreSQL / Redis 数据在命名卷（`postgres-data` / `redis-data`）中，容器重建不影响 |

### 更新后验证

命令跑完后无需额外操作，但建议花 30 秒验证：

```bash
# 1. 容器状态：app-init 应为 Exited (0)，app 应为 Up 且持续运行
docker-compose -f docker-compose.prod.yml ps
```

2. 浏览器访问网站，验证本次更新的功能点是否生效
3. 用 root 账号登录，确认密码未被重置

### 数据安全说明

- ✅ `--force-recreate` 只销毁重建**容器**（进程），不碰数据卷，业务数据全部保留
- ✅ 唯一删数据的方式是 `docker-compose down -v`（`-v` 删除数据卷），禁止在生产使用
- ✅ 数据库迁移已**禁止破坏性变更**：`entrypoint.sh` 中的 `prisma db push` 不使用 `--accept-data-loss`，schema 中的删列 / 改字段类型操作会导致迁移失败并阻断部署，需人工备份确认后处理

### 更新失败排查

```bash
docker-compose -f docker-compose.prod.yml logs app-init   # 查看迁移 / seed 是否报错
docker-compose -f docker-compose.prod.yml logs app        # 应用启动日志
```

## 数据迁移（从 Supabase / 旧环境）

如果从 Vercel + Supabase 迁移：

```bash
# 1. 导出 Supabase 数据
pg_dump $SUPABASE_URL > backup.sql

# 2. 导入到 Docker PostgreSQL
docker compose exec -T db psql -U postgres -d trae_demo_wall < backup.sql
```

## 常用命令

```bash
# 查看日志
docker compose logs -f app

# 重启服务
docker compose restart app

# 停止所有服务
docker compose down

# 停止并删除数据（含数据库卷，谨慎使用）
docker compose down -v
```

## 生产环境优化

1. Nginx 反向代理已内置（如需 HTTPS，挂载证书并修改 `nginx.conf`）
2. 配置 HTTPS 证书
3. 设置防火墙规则（开放 80/443）
4. 配置自动备份（定期 `pg_dump` 导出）

## 故障排查

### 应用无法启动

```bash
docker compose logs app
docker compose logs app-init   # 初始化失败时查看此日志
```

### 数据库连接失败

检查 `.env` 中 `DATABASE_URL` 是否指向 `db:5432`（容器间通信用服务名），宿主机调试请使用 `localhost:5432`。

### Redis 连接失败

检查 `REDIS_URL` 配置是否正确（容器内为 `redis://redis:6379`）。
