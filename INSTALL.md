# 手机安装指南

题库（2697 道题）已全部打包在应用内，**安装后无需联网**即可练习。做题记录保存在手机本地。

---

## 方式一：Android 安装 APK（推荐）

生成一个 `.apk` 文件，传到手机直接安装。

### 第一步：打包网页资源

在项目目录打开终端，运行：

```bash
cd c:\Users\Administrator\Documents\practice-app
npm run build
npx cap add android
npx cap sync android
```

> 如果已经添加过 android 目录，只需运行 `npm run build:mobile`

### 第二步：生成 APK

**需要安装 [Android Studio](https://developer.android.com/studio)**（免费）

1. 打开 Android Studio
2. 选择 **Open**，打开文件夹：`practice-app\android`
3. 等待 Gradle 同步完成（首次可能需要 10～20 分钟）
4. 菜单 **Build → Build Bundle(s) / APK(s) → Build APK(s)**
5. 完成后点击通知里的 **locate**，找到 `app-debug.apk`

APK 路径一般为：

```
practice-app\android\app\build\outputs\apk\debug\app-debug.apk
```

### 第三步：安装到手机

1. 把 `app-debug.apk` 传到手机（微信、QQ、数据线均可）
2. 手机上点击 APK 文件安装
3. 如提示「未知来源」，在设置里允许安装此来源的应用

---

## 方式二：电脑局域网访问（最快体验）

手机和电脑连**同一个 WiFi**，无需安装：

```bash
cd c:\Users\Administrator\Documents\practice-app
npm run build
npm run preview
```

终端会显示地址，例如 `http://192.168.1.100:4173`，手机浏览器打开即可。

> 第一次打开后，可添加到手机桌面（见方式三）

---

## 方式三：添加到手机桌面（PWA，iPhone / Android 均可用）

适合 iPhone 用户，或暂时不想装 APK 的情况。

### Android（Chrome 浏览器）

1. 用 Chrome 打开应用地址（方式二的 preview 地址，或部署后的网址）
2. 等待页面完全加载
3. 点击浏览器菜单 → **添加到主屏幕** / **安装应用**
4. 桌面会出现「练题助手」图标，点开即全屏使用
5. **之后可离线使用**（题库已缓存到手机）

### iPhone（Safari 浏览器）

1. 用 Safari 打开应用地址
2. 点击底部分享按钮
3. 选择 **添加到主屏幕**
4. 桌面出现图标后可离线使用

---

## 常见问题

**Q：安装后还需要网络吗？**  
A：不需要。2697 道题都在安装包里，完全本地运行。

**Q：换手机数据会丢吗？**  
A：做题记录存在本机，换手机需重新开始（或以后可加导出功能）。

**Q：APK 安装提示风险？**  
A：这是自己打包的调试版 APK，未上架应用商店，系统会提示「未知应用」属正常现象，选择继续安装即可。

**Q：如何更新题库？**  
A：重新运行 `npm run import-questions` 导入新题后，再 `npm run build:mobile` 重新打包 APK。

---

## 一键打包命令汇总

```bash
# 1. 构建 + 同步到 Android 工程
npm run build:mobile

# 2. 用 Android Studio 打开 android 文件夹，Build APK

# 或命令行打包（需已配置 Android SDK）：
cd android
.\gradlew.bat assembleDebug
```
