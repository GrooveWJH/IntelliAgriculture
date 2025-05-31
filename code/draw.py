import matplotlib.pyplot as plt
import numpy as np

# 使用默认中文字体
plt.rcParams['font.family'] = ['sans-serif']
plt.rcParams['font.sans-serif'] = ['SimHei', 'Microsoft YaHei', 'SimSun', 'Arial Unicode MS']
plt.rcParams['axes.unicode_minus'] = False  # 用来正常显示负号

# 模拟时间序列
time = np.linspace(0, 20, 200)

# 构造响应曲线：快速上升、超调、稳定
response = np.piecewise(
    time,
    [time < 6, (time >= 6) & (time < 10), time >= 10],
    [
        lambda t: 5 * t,
        lambda t: 30 + 2 * np.exp(-0.8 * (t - 6)) * np.cos(2 * np.pi * (t - 6) / 4),
        lambda t: 30 + 0.2 * np.exp(-0.3 * (t - 10))
    ]
)

# 基准温度线
baseline = np.full_like(time, 30)
# 绘制图像
plt.figure(figsize=(8, 5))
plt.plot(time, baseline, 'r-', label="基准温度")
plt.plot(time, response, 'k--', label="响应")
plt.xlabel("时间 (S)")
plt.ylabel("温度 (℃)")
plt.title("PID控制器在补光系统中的响应曲线")
plt.legend()
plt.grid(True)
plt.tight_layout()
# 保存为高分辨率图片而不显示
plt.savefig('pid_response_curve.png', dpi=300)
plt.close()