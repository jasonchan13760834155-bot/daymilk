# DayMilk 部署指引

## 环境变量

部署前确保以下环境变量已配置：

| 变量名 | 说明 | 格式 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | `https://xxxxxxxxxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名公钥（anon/public，非 service_role） | `eyJhbGciOi...` 开头的 JWT |
| `VITE_DEV_MODE` | 是否启用开发模式 | 生产部署设为 `false` 或直接删除 |

本地开发时在 `.env` 中配置，CI/CD 在平台环境变量中配置。

---

## 部署平台：Netlify

### 首次部署

1. 安装并登录 Netlify CLI：

```bash
npx netlify-cli login
```

2. 创建站点：

```bash
npx netlify-cli sites:create --name daymilk-app
```

3. 设置环境变量：

```bash
npx netlify-cli env:set VITE_SUPABASE_URL "https://xxxxxxxxxxxx.supabase.co"
npx netlify-cli env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOi..."
```

4. 构建并部署：

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

### 后续更新部署

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

Netlify 会自动运行 `npm run build`（`tsc -b && vite build`），构建产物在 `dist/` 目录。

### 当前部署信息

- **站点名：** `daymilk-app`
- **URL：** `https://daymilk-app.netlify.app`
- **Admin：** `https://app.netlify.com/projects/daymilk-app`

---

## 备选平台：Vercel

```bash
npx vercel login
npx vercel --yes --prod
npx vercel env add VITE_SUPABASE_URL production
npx vercel env add VITE_SUPABASE_ANON_KEY production
```

> 注意：`.vercel.app` 域名在中国大陆可能无法访问。

---

## 备选平台：GitHub Pages

```bash
# 构建时需加 base 路径
npx vite build --base=/repo-name/

# 上传 dist 到 gh-pages 分支
npx gh-pages -d dist
```

> 注意：需要 App.tsx 中 BrowserRouter 配置 `basename`，且 GitHub Pages 在中国大陆访问不稳定。

---

## 数据库部署（Supabase）

### 初次建表

在 Supabase Dashboard → SQL Editor 中执行 `supabase/migrations/001_schema.sql`。

### 认证配置

Supabase Dashboard → Authentication → URL Configuration：

| 字段 | 值 |
|---|---|
| Site URL | `https://daymilk-app.netlify.app` |
| Redirect URLs | `https://daymilk-app.netlify.app/**` |

> 更换部署域名时，Site URL 和 Redirect URLs 必须同步更新，否则认证会失败。

### 关闭邮箱验证（可选）

Authentication → Settings → 关闭 **Confirm email**。

---

## 部署检查清单

- [ ] `.env.production` 中 `VITE_DEV_MODE=false`
- [ ] `npm run build` 无 TypeScript 错误
- [ ] `npx vitest run` 全部通过
- [ ] Supabase Site URL 与部署域名一致
- [ ] Supabase Redirect URLs 包含部署域名
- [ ] 访问线上地址可正常打开
- [ ] 注册/登录功能可用
- [ ] 今日计划自动生成
- [ ] 记录按钮功能正常
