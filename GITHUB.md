# GitHub 云端打包 APK（不用装 Android Studio）

你的电脑**不需要安装任何打包软件**，把代码上传到 GitHub，云端自动编译出 APK，下载到小米手机安装即可。

题库 2697 道题已全部包含在代码里，安装后**完全离线**可用。

---

## 第一步：注册 GitHub

1. 打开 https://github.com 注册账号（免费）
2. 登录后点击右上角 **+** → **New repository**
3. 仓库名填：`practice-app`（或任意名称）
4. 选 **Public**（免费账号 Actions 公开仓库够用）
5. **不要**勾选 README，直接点 **Create repository**

---

## 第二步：上传项目代码

### 方法 A：网页上传（不用装软件）

1. 在新建的仓库页面点 **uploading an existing file**
2. 把下面文件夹里的**所有文件和文件夹**拖进去：  
   `c:\Users\Administrator\Documents\practice-app`
3. **不要上传** `node_modules` 文件夹（太大，云端会自动安装）
4. **不要上传** `dist` 文件夹（云端会自动生成）
5. 底部 Commit 填 `初始上传`，点 **Commit changes**

> 必须上传的内容包括：`src`、`android`、`.github`、`package.json`、`package-lock.json` 等

### 方法 B：GitHub Desktop（比 Android Studio 小很多，可选）

1. 下载 https://desktop.github.com/
2. File → Add Local Repository → 选 `practice-app` 文件夹
3. Publish repository 推送到 GitHub

---

## 第三步：等待云端编译

1. 上传完成后，打开仓库页面 → 顶部 **Actions** 标签
2. 左侧点 **Build Android APK**
3. 看到绿色 ✅ 表示成功（首次约 5～10 分钟）
4. 点进这次运行 → 页面底部 **Artifacts** → 下载 **练题助手-apk**
5. 解压得到 `app-debug.apk`

也可以手动触发：Actions → Build Android APK → **Run workflow**

---

## 第四步：安装到小米 14 / 12S

1. 把 `app-debug.apk` 发到手机（微信、QQ、小米互传均可）
2. 在手机上点击 APK 文件
3. 若提示「禁止安装未知应用」：
   - **设置 → 隐私与安全 → 特殊权限 → 安装未知应用**
   - 找到你用来打开 APK 的应用（如文件管理器、微信），允许安装
4. 小米系统可能提示「风险应用」→ 选择 **仍要安装**（这是自己打包的，不是病毒）

安装后桌面出现 **练题助手**，打开即可离线刷题。

---

## 更新题库后重新打包

1. 在电脑上更新题目后，重新上传改动的文件到 GitHub
2. Actions 会自动重新编译
3. 下载新的 APK 安装即可（会覆盖旧版）

---

## 常见问题

**Q：Actions 是免费的吗？**  
A：公开仓库每月有免费额度，个人练题 App 完全够用。

**Q：编译失败怎么办？**  
A：点进失败的 Actions 记录，把红色报错截图发给我。

**Q：iPhone 能用吗？**  
A：这个流程只出 Android APK。iPhone 需要用 Safari 打开网页版「添加到主屏幕」。

**Q：每次都要重新下载安装吗？**  
A：只有更新题库或功能时才需要装新 APK，平时不用。
