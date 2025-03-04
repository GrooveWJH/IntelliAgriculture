# 智慧农业控制系统 (Intelligent Agriculture Control System)

一个基于React和TypeScript的智慧农业控制系统前端应用，提供实时环境监控、设备控制、报警设置和数据分析功能。

## 功能特点

- 📊 实时监控：显示温度、湿度、CO2浓度等环境参数
- 🎛️ 环境控制：控制通风、灌溉、补光和施肥系统
- ⚠️ 报警设置：可配置各项参数的报警阈值
- 📈 数据分析：历史数据查询和趋势分析

## 技术栈

- React 18
- TypeScript
- Ant Design 5.0
- Chart.js
- Styled Components
- React Router DOM

## 系统要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本

## 安装

1. 克隆项目：
```bash
git clone [repository-url]
cd intelligent-agriculture
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

应用将在 http://localhost:3000 启动

## 项目结构

```
src/
  ├── components/     # 可复用组件
  ├── pages/         # 页面组件
  ├── assets/        # 静态资源
  ├── utils/         # 工具函数
  ├── hooks/         # 自定义Hooks
  ├── context/       # React Context
  ├── App.tsx        # 应用入口
  └── index.tsx      # 渲染入口
```

## 主要功能模块

### 实时监控 (Dashboard)
- 显示各种环境参数的实时数据
- 包括空气温度、湿度、CO2浓度等
- 实时数据更新和趋势图表

### 环境控制 (Environment Control)
- 通风系统控制
- 灌溉系统控制
- 补光系统控制
- 施肥系统控制

### 报警设置 (Alarm Settings)
- 参数阈值设置
- 报警启用/禁用
- 多参数独立配置

### 数据分析 (Data Analysis)
- 历史数据查询
- 数据趋势分析
- 统计信息展示

## 开发

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm test
```

## 部署

1. 构建生产版本：
```bash
npm run build
```

2. 生产版本文件将生成在 `build` 目录中

3. 将 `build` 目录中的文件部署到您的Web服务器

## 注意事项

- 当前版本使用模拟数据，可以通过修改相应的数据生成函数来接入实际的传感器数据
- 所有的控制功能目前都是模拟的，需要根据实际的硬件设备来实现具体的控制逻辑
- 建议在正式部署前添加用户认证和权限控制

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交问题和改进建议！ 