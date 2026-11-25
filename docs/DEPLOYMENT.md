# AlgoViz 部署说明

本文件描述 AlgoViz 的构建要求、静态托管约束，以及当前真实的 GitHub Pages 公开测试部署状态。

AlgoViz 已部署到 GitHub Pages，可通过以下地址访问：

**https://vvvi734.github.io/AlgoViz/**

这是公开测试部署，不等同于 v1.0.0 正式发布。正式 Git Tag、GitHub Release 与发布公告尚未执行。

## 1. 构建环境

- Node.js **20 或更高版本**（`package.json` 的 `engines.node >= 20`）；GitHub Actions 使用 Node.js 22。
- 使用仓库中的 `package-lock.json` 安装依赖。
- 浏览器需要支持 ES2020、WebAssembly 和 Web Worker。

```sh
npm ci
npm run typecheck
npm test
npm run build
```

生产产物输出到 `dist/`：

```text
dist/
  index.html
  favicon.svg
  assets/            # 带内容哈希的 JS、CSS、字体与 worker
```

`dist/` 已被 `.gitignore` 忽略，不作为源码提交；发布时由 CI 重新生成。

## 2. 本地开发与生产预览

```sh
npm run dev        # 默认 http://localhost:5173
npm run preview    # 默认 http://localhost:4173
```

`npm run dev` 使用相对 base，继续用于日常开发。生产预览必须通过 HTTP 访问，不能直接用 `file://` 打开 `dist/index.html`，否则模块、Worker 和 Pyodide 资源会被浏览器安全策略拦截。

## 3. 静态托管要求

1. 将整个 `dist/` 目录原样上传，保持 `assets/` 的相对层级。
2. 使用 HTTPS。Pyodide 通过 HTTPS 从 jsDelivr 加载，混合内容会被浏览器阻断。
3. 为 `.js` 返回 `text/javascript`，为 `.css` 返回 `text/css`，为 `.svg` 返回 `image/svg+xml`。
4. 开启 gzip 或 Brotli 压缩。主包和 Monaco 懒加载包体积较大，压缩后传输更稳定。
5. 不要启用目录列表；不需要后端、数据库或环境变量。

### 3.1 Vite base 与子路径

`vite.config.ts` 的 base 由环境变量控制：

```ts
const base = process.env.VITE_BASE_PATH ?? './';
```

- 本地开发、普通静态托管：默认相对 base `./`。
- GitHub Pages：工作流注入 `VITE_BASE_PATH="/${{ github.event.repository.name }}/"`。当前仓库名为 `AlgoViz`，实际构建 base 为 `/AlgoViz/`。
- 不要在源码中写死 `/AlgoViz/` 或 `/algolens/`；仓库名变化时应由工作流自动确定前缀。
- 用户主页仓库（`OWNER.github.io`）应改为 `/`；当前项目不是用户主页仓库。
- 当前没有自定义域名或 `CNAME` 文件，不要擅自覆盖已有 Pages 域名设置。

### 3.2 刷新与路由回退

AlgoViz 当前没有客户端 URL 级课程路由，也不把课程选择写入 URL；刷新页面会重新加载应用默认入口，而不是恢复某个课程 URL。因此当前版本不依赖服务端 SPA 回退。

`/?view=lab` 是实验/动画入口；直接访问站点根路径会进入教材默认页。两者都能在 GitHub Pages 上正常打开。

## 4. GitHub Pages 实际部署

### 4.1 仓库与地址

| 项目 | 实际值 |
| --- | --- |
| 项目正式名称 | AlgoViz |
| GitHub 仓库 | https://github.com/vvvi734/AlgoViz |
| GitHub Pages | https://vvvi734.github.io/AlgoViz/ |
| Gitee 仓库 | https://gitee.com/vvvi734/algolens.git |
| GitHub 远端名 | `github` |
| Gitee 远端名 | `origin` |
| GitHub 仓库可见性 | Public |
| Pages 发布来源 | GitHub Actions（`build_type: workflow`） |
| 自定义域名 | 无 |

GitHub 仓库名和 Gitee 仓库名都没有因为展示名称统一为 AlgoViz 而改名；`package.json` 的 `name`、localStorage key、Monaco theme 等内部标识也保持原值。

### 4.2 工作流

工作流文件：`.github/workflows/pages.yml`

工作流名称：`Deploy AlgoViz to GitHub Pages`

触发条件：

- push 到 `main`；
- 手动 `workflow_dispatch`。

关键配置：

- `actions/checkout@v7`
- `actions/setup-node@v7`，Node.js 22，启用 npm 缓存
- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run build`，并注入 `VITE_BASE_PATH=/AlgoViz/`
- `actions/configure-pages@v6`
- `actions/upload-pages-artifact@v5`，上传 `./dist`
- `actions/deploy-pages@v5`
- 权限：`contents: read`、`pages: write`、`id-token: write`
- 环境：`github-pages`
- 并发组：`pages`，`cancel-in-progress: true`

构建失败时 `deploy` job 不会执行。部署成功后，Pages 地址由 `deploy` job 的 `page_url` 输出。

首次公开测试部署的历史运行记录（不是最新部署状态）：

- Workflow：https://github.com/vvvi734/AlgoViz/actions/runs/45326384936
- 结果：`success`
- 提交：`7828f273bb1af84ca9fab680d39b995b2adc4758`

最新部署状态应查看 Pages 工作流运行列表：https://github.com/vvvi734/AlgoViz/actions/workflows/pages.yml 。每次推送到 GitHub `main` 都会触发新的构建与部署；上述历史 run 不代表后续提交已经部署。

### 4.3 实际构建产物路径

GitHub Pages 构建的 `dist/index.html` 使用：

- JS：`/AlgoViz/assets/index-*.js`
- CSS：`/AlgoViz/assets/index-*.css`
- favicon：`./favicon.svg`

没有发现 `fetch('/...')`、`new Worker('/...')` 这类需要机械替换的根路径资源。Pyodide Worker 由 Blob URL 创建，Monaco 使用 Vite 懒加载 chunk，二者均不依赖站点根路径。

## 5. 部署更新步骤

当前开发仍以 Gitee 为主远端。确认本地在 `main`、工作区改动只包含本次要发布的代码后：

```sh
git push origin main
git push github main
```

只有同时推送到 GitHub `main` 才会触发 Pages 自动部署；仅推送 Gitee 不会触发 GitHub Actions。本轮没有建立额外的镜像同步服务，也不要为此保存长期访问 Token。

部署后可检查：

```sh
gh run list --repo vvvi734/AlgoViz --limit 5
gh run watch <run-id> --repo vvvi734/AlgoViz
gh api repos/vvvi734/AlgoViz/pages
```

不要强制推送，不要用 `git clean -fd`、`git reset --hard` 覆盖未提交内容。仓库根目录的 `图论/` 是受保护的未跟踪教学资料目录，不参与 GitHub Pages 构建，也不得被暂存或上传。

## 6. 缓存建议

| 资源 | 建议 |
| --- | --- |
| `assets/*`（文件名含内容哈希） | `Cache-Control: public, max-age=31536000, immutable` |
| `index.html` | `Cache-Control: no-cache` 或短缓存，确保发布后立即拿到新入口 |
| `favicon.svg` | 短缓存或与 `index.html` 一致 |
| jsDelivr 上的 Pyodide | 由 CDN 管理；当前固定 `0.27.7` 版本 URL |

GitHub Pages 不提供本项目自定义的缓存头配置；上述建议适用于其他静态托管平台或未来增加的自定义域名/CDN。

## 7. Pyodide 与网络

- Pyodide 脚本固定为 `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`。
- Pyodide 在 Worker 中运行，并从同一 CDN 目录加载 `.wasm`、标准库和其他数据文件。
- 部署环境必须允许访问 `cdn.jsdelivr.net`，并允许创建 `blob:` Worker。
- 某些网络会对 jsDelivr 的 HTTP/3 连接中断大文件下载。若线上出现 Pyodide 启动超时，可先验证 HTTP/2 回退；测试配置中的 `--disable-quic` 只是诊断手段，不应作为生产网络方案。
- 如果目标网络无法访问 jsDelivr，需要自托管同一版本的 Pyodide 发行包并修改运行时 URL；本轮未实现，也未宣称支持。

公开站点验收时实际观察到以下资源返回 HTTP 200：

- `pyodide.js`
- `pyodide.asm.js`
- `pyodide.asm.wasm`
- `python_stdlib.zip`
- `pyodide-lock.json`

## 8. CSP 与安全头

GitHub Pages 默认不提供项目级自定义 CSP。若未来迁移到支持 CSP 的托管平台，至少需要允许：

- 同源脚本和样式；
- `blob:` Worker；
- WebAssembly 编译（不同浏览器对 `wasm-unsafe-eval` / `unsafe-eval` 的要求不同）；
- `https://cdn.jsdelivr.net` 的脚本与连接；
- 如使用 `data:` 字体或图片，允许对应来源。

其他建议：

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- 不需要为 Pyodide 开启 CORS 代理；当前直接从 CDN 加载。
- 当前没有后端接口，不需要配置 API 代理或数据库凭据。

## 9. 发布后 smoke

上线后至少检查：

1. 首页标题显示 AlgoViz，favicon 正常加载。
2. 12 章目录完整，理论专题可打开。
3. 顺序表容量、散列基础、索引文件、外部排序等静态 SVG 可见且完整。
4. 排序算法、树或图算法能执行真实 Python Trace。
5. 官方、自定义和随机输入均可用。
6. 播放、暂停、单步、回退和重置可用。
7. 参考代码面板可打开，C/C++/Python 切换和复制正常；中英文内部注释随语言切换。
8. 390px 视口下无整页横向滚动，动画按钮和代码面板可操作。
9. 刷新页面、直接访问站点根路径和 Console 无阻断性错误。
10. Network 中 Pyodide 资源返回 200，MIME 正确。

2026-11-24 的公开站点浏览器验收覆盖了上述 1–9 项，并捕获到真实 Pyodide CDN/WASM 请求与真实 Python Trace。浏览器 Console、页面脚本异常、资源 4xx/5xx 均为 0。

## 10. 已知限制

- 当前没有 URL 级章节路由；刷新会回到默认入口，不能通过 URL 直接恢复某个课程页面。
- 首次真实 Python 执行依赖 `cdn.jsdelivr.net`，冷启动时间受网络和缓存影响；界面会显示加载状态。
- GitHub Pages 不提供项目自定义 CSP；本轮只验证了默认 Pages 响应下的运行情况。
- Pyodide 只执行课程内置程序，不开放任意 Python / JavaScript 代码执行；C / C++ 为只读参考代码，不提供在线编译。
- 本轮没有创建正式 GitHub Release、v1.0.0 Tag 或 npm 包，也没有宣布正式发布。
- 部署初期 CI 工作流 `.github/workflows/ci.yml` 的 `sync:legacy` 门禁曾因生成数据中 Huffman 英文名大小写漂移而失败；已在提交 `f01c059` 将生成结果同步为权威源数据 `legacy/algorithm-definitions.js` 的 `Huffman tree & prefix codes`。该变化只影响展示文案，未改变算法注册、课程映射、Trace 或动画语义，CI 与 Pages 工作流均已通过。
