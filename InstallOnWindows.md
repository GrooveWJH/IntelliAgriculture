# 智慧农业大棚控制系统 - Windows 安装指南

本指南将帮助您在 Windows 系统上安装和运行智慧农业大棚控制系统。

## 前置要求

在开始前，您需要在 Windows 系统上安装以下软件：

1. **Node.js**：需要 14.0.0 或更高版本
2. **npm**：通常随 Node.js 一起安装
3. **Visual Studio Code**：推荐的代码编辑器（您已安装）

## 安装步骤

### 1. 安装 Node.js 和 npm

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载并安装最新的 LTS (长期支持) 版本
3. 完成安装后，打开命令提示符或 PowerShell，验证安装：
   ```
   node -v
   npm -v
   ```

### 2. 克隆或下载项目

如果您使用 Git：
1. 安装 [Git for Windows](https://git-scm.com/download/win)（如尚未安装）
2. 打开命令提示符或 PowerShell
3. 导航到您想要保存项目的目录
4. 克隆项目：
   ```
   git clone <项目仓库URL>
   ```

如果您已有项目文件：
1. 确保所有项目文件解压到一个文件夹中

### 3. 安装项目依赖

1. 在命令提示符或 PowerShell 中，导航到项目根目录
2. 运行以下命令安装所有依赖：
   ```
   npm install
   ```
   这可能需要几分钟时间，取决于您的网络速度

### 4. 运行开发服务器

1. 依赖安装完成后，在项目根目录运行：
   ```
   npm start
   ```
2. 系统会自动打开默认浏览器并访问 http://localhost:3000
3. 如果浏览器没有自动打开，请手动打开并访问该地址

## 常见问题解决

### 端口冲突

如果 3000 端口已被占用，React 会提示您使用另一个端口。按键盘上的 'Y' 确认使用另一个端口。

### 依赖安装失败

如果依赖安装过程中出现错误：
1. 尝试使用管理员权限运行命令提示符或 PowerShell
2. 清除 npm 缓存并重试：
   ```
   npm cache clean --force
   npm install
   ```

### 运行时出现 "Error: ENOSPC: System limit for number of file watchers reached"

这是因为 Windows 系统对文件监视器的数量有限制：
1. 作为临时解决方案，可以使用：
   ```
   npm start -- --no-watch
   ```
2. 或者增加系统的文件监视限制（需要管理员权限）

## 使用 Visual Studio Code 打开项目

1. 打开 Visual Studio Code
2. 选择 "File" > "Open Folder"
3. 导航到并选择项目文件夹
4. 安装推荐的 VS Code 扩展（如有提示）

## 生产环境构建

如果您需要创建生产环境构建：
1. 在项目根目录运行：
   ```
   npm run build
   ```
2. 构建完成后，生成的文件将位于 `build` 目录中

## 系统运行要求

- **推荐浏览器**：Chrome、Edge 或 Firefox 的最新版本
- **推荐分辨率**：1920×1080 或更高
- **存储空间**：至少需要 500MB 可用空间（用于 IndexedDB 数据存储）
