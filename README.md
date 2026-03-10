# 小番茄图片混淆 (Image Obfuscator)

A web-based tool to obfuscate images using Hilbert Space-Filling Curves.
Inspired by [singularpoint.cn](https://singularpoint.cn/hideImg1.html).

## 功能特点 (Features)

-   **纯前端处理 (Client-side processing)**: 所有处理都在浏览器中完成，图片不上传服务器，保护隐私。
-   **Hilbert 曲线混淆 (Hilbert Curve Scrambling)**: 使用空间填充曲线对像素位置进行重排。
-   **无损还原 (Reversibility)**: 支持混淆后的图片无损还原（建议保存为 PNG）。
-   **抗压缩 (Compression Resistant)**: 即使保存为 JPEG（会有轻微画质损失），依然可以还原出可识别的内容。

## 部署 (Deployment)

本项目已配置好 `Dockerfile` 和 `nginx.conf`，可直接部署在 [Zeabur](https://zeabur.com) 等容器平台。

1.  Push code to GitHub.
2.  Create a service on Zeabur and select the repository.
3.  The project will be automatically built and deployed.

## 许可证 (License)

MIT

---
*Last Updated: 2026-03-10*
