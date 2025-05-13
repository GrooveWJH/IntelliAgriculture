# 智慧农业大棚控制系统

基于React+TypeScript的智慧农业大棚环境监控与控制系统，提供实时数据可视化、精确环境控制和历史数据分析功能。

## 主要功能

- 实时监控大棚环境参数（温度、湿度、光照、CO2等）
- 多种控制算法（PID、模糊控制、Smith预测控制）
- 基于天气数据驱动的环境模拟
- 历史数据查询与分析
- 控制参数优化与系统配置

## 技术亮点

- **先进控制算法**：根据不同控制对象特性选择最适合的控制算法
- **基于天气数据的模拟**：使用真实天气数据驱动的环境模拟模型
- **离线运行能力**：基于浏览器本地数据库实现数据存储
- **响应式设计**：适配不同设备的用户界面

## 快速开始

1. 克隆项目
   ```bash
   git clone https://github.com/yourusername/intelligent-agriculture.git
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm run dev
   ```

4. 访问应用
   ```
   http://localhost:3000
   ```

## 文档结构

详细文档位于`docs`目录，包括：

- **[系统概述](docs/overview/system-overview.md)**：系统功能、架构和技术栈
  - [系统功能](docs/overview/system-overview.md#11-系统功能)
  - [系统架构](docs/overview/system-overview.md#12-系统架构)
  - [技术栈](docs/overview/system-overview.md#13-技术栈)

- **系统设计**：控制系统设计、数据存储设计等
  - [控制系统设计](docs/design/control-system-design.md)：PID控制、模糊控制和Smith预测控制算法详解
  - [数据存储机制](docs/design/data-storage-mechanism.md)：分层存储策略与数据管理

- **[数据生成与仿真](docs/simulation/data-generation-simulation.md)**：环境模拟方案详解
  - [传统数据生成模型](docs/simulation/data-generation-simulation.md#41-传统数据生成模型)
  - [基于天气数据驱动的环境模拟](docs/simulation/data-generation-simulation.md#42-基于天气数据驱动的环境模拟)
  - [物理模型与计算方法](docs/simulation/data-generation-simulation.md#43-物理模型与计算方法)

- **使用指南**：用户手册和开发者指南
  - [用户手册](docs/user-guide/user-manual.md)
  - [开发者指南](docs/user-guide/developer-guide.md)

## 技术栈

- React + TypeScript
- Ant Design 组件库
- ECharts 数据可视化
- IndexedDB 本地存储

## 文档优化记录

### 2024-05-25 文档重构与优化

为提高文档的系统性和专业性，重点突出基于天气数据驱动的环境模拟方案，进行了以下优化：

1. **文档结构重组**：建立清晰的五大部分（系统概述、系统设计、系统实现、数据生成与仿真、使用指南）

2. **合并重复内容**：
   - 合并了system-overview.md和system-architecture-overview.md，删除重复内容
   - 精简了README.md的内容，保留核心信息和结构图

3. **增强专业性**：
   - 优化了控制系统设计文档，突出PID控制、模糊控制和Smith预测控制三种算法的原理和适用场景
   - 强化数据生成与仿真文档，详细阐述基于天气数据驱动的环境模拟优势

4. **内容层次优化**：
   - 调整章节标题层级，提高文档可读性
   - 使用表格和图表替代冗长的文字描述
   - 添加更多结构化内容，便于读者理解

5. **重点突出创新点**：
   - 突出天气数据驱动模型相对于传统模型的优势
   - 详细介绍了物理模型与计算方法
   - 增加了实际应用场景分析 