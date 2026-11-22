# AlgoViz 部署说明

本文件描述 AlgoViz 的平台无关静态部署要求。RELEASE-01 只验证本地生产预览，没有选择或配置正式托管平台，也没有执行线上部署。

## 1. 构建环境

- Node.js **20 或更高版本**（`package.json` 的 `engines.node >= 20`）。
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

`dist/` 已被 `.gitignore` 忽略，不作为源码提交；发布时应由 CI 或本地构建重新生成。

## 2. 本地生产预览

```sh
npm run preview
```

默认地址为 `http://localhost:4173`。必须通过 HTTP 访问，不能直接用 `file://` 打开 `dist/index.html`，否则模块、Worker 和 Pyodide 资源会被浏览器安全策略拦截。

## 3. 静态托管要求

1. 将整个 `dist/` 目录原样上传，保持 `assets/` 的相对层级。
2. 站点根或子路径均可部署。`vite.config.ts` 使用 `base: './'`，`index.html` 中的脚本、样式和 favicon 均使用相对地址。
3. 使用 HTTPS。Pyodide 通过 HTTPS 从 jsDelivr 加载，混合内容会被浏览器阻断。
4. 为 `.js` 返回 `text/javascript`，为 `.css` 返回 `text/css`，为 `.svg` 返回 `image/svg+xml`。当前构建不包含本地 `.wasm`；如未来改为自托管 Pyodide，必须为 `.wasm` 配置 `application/wasm`。
5. 开启 gzip 或 Brotli 压缩。主包和 Monaco 懒加载包体积较大，压缩后传输更稳定。
6. 不要启用目录列表；不需要后端、数据库或环境变量。

### 子路径部署

例如部署到 `https://example.com/algoviz/`：

- 将 `dist/` 的内容放到 `/algoviz/`；
- 访问 `/algoviz/`，不要遗漏末尾斜杠；
- 不需要把 `base` 改成绝对路径，现有相对构建可直接工作。

### 刷新与路由回退

AlgoViz 当前没有客户端路由，也不把课程选择写入 URL；刷新页面会重新加载应用默认入口，而不是恢复某个课程 URL。因此当前版本不依赖服务端 SPA 回退。

仍建议托管平台配置“未找到文件时返回 `index.html`”或等价的 404 回退规则，以便未来增加路由时不需要重新调整部署。不要对所有静态资源都返回 HTML，否则缺失的 JS/CSS 会得到错误的内容类型。

## 4. 缓存建议

| 资源 | 建议 |
| --- | --- |
| `assets/*`（文件名含内容哈希） | `Cache-Control: public, max-age=31536000, immutable` |
| `index.html` | `Cache-Control: no-cache` 或短缓存，确保发布后立即拿到新入口 |
| `favicon.svg` | 短缓存或与 `index.html` 一致 |
| jsDelivr 上的 Pyodide | 由 CDN 管理；当前固定 `0.27.7` 版本 URL |

不要给 `index.html` 设置长周期 immutable 缓存，否则新版本发布后用户仍会加载旧入口。

## 5. Pyodide 与网络

- Pyodide 脚本固定为 `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js`。
- Pyodide 在 Worker 中运行，并从同一 CDN 目录加载 `.wasm`、标准库和其他数据文件。
- 部署环境必须允许访问 `cdn.jsdelivr.net`，并允许创建 `blob:` Worker。
- 某些网络会对 jsDelivr 的 HTTP/3 连接中断大文件下载。若线上出现 Pyodide 启动超时，可先验证 HTTP/2 回退；测试配置中的 `--disable-quic` 只是诊断手段，不应作为生产网络方案。
- 如果目标网络无法访问 jsDelivr，需要自托管同一版本的 Pyodide 发行包并修改运行时 URL；这属于部署定制，RELEASE-01 未实现，也没有验证。

## 6. CSP 与安全头

如果托管平台默认注入 CSP，至少需要允许：

- 同源脚本和样式；
- `blob:` Worker；
- WebAssembly 编译（不同浏览器对 `wasm-unsafe-eval` / `unsafe-eval` 的要求不同）；
- `https://cdn.jsdelivr.net` 的脚本与连接；
- 如使用 `data:` 字体或图片，允许对应来源。

推荐先在预发布环境用浏览器 Console 和 Network 验证，再收紧指令。不要直接复制未经本项目验证的第三方 CSP 模板。

其他建议：

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- 不需要为 Pyodide 开启 CORS 代理；当前直接从 CDN 加载。
- 当前没有后端接口，不需要配置 API 代理或数据库凭据。

## 7. 发布后 smoke

上线后至少检查：

1. 首页标题显示 AlgoViz，favicon 正常加载。
2. 12 章目录完整，理论专题可打开。
3. 排序算法、树或图算法能执行真实 Python Trace。
4. 官方、自定义和随机输入均可用。
5. 播放、暂停、单步、回退和跳帧可用。
6. 参考代码面板可打开，C/C++/Python 切换和复制正常。
7. 中英文切换正常，内部注释随语言切换。
8. 360px、390px 和桌面宽度下无整页横向滚动。
9. 刷新页面、直接访问子路径和 Console 无阻断性错误。
10. Network 中 Pyodide 资源返回 200，MIME 正确。

浏览器 Console 中若只有开发工具或第三方扩展告警，应单独记录；任何 Pyodide、模块加载、Worker 或资源 404 都属于发布阻断项。

## 8. 明确未执行的事项

- 未创建任何托管平台账号。
- 未购买域名或云服务。
- 未上传到第三方平台。
- 未创建 GitHub Release 或正式 v1.0.0 Tag。
- 未执行正式线上部署。

正式部署需要在用户确认发布后，按目标平台补充具体命令、回滚和证书配置。
