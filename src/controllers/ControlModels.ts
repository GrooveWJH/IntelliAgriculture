import { controlModelConfig } from '../config/systemConfig';

// PID控制器实现
export class PIDController {
  private kp: number;
  private ki: number;
  private kd: number;
  private maxIntegral: number;
  private integral: number = 0;
  private lastError: number = 0;
  private lastTime: number = Date.now();

  constructor(
    kp = controlModelConfig.pid.defaultKp,
    ki = controlModelConfig.pid.defaultKi,
    kd = controlModelConfig.pid.defaultKd,
    maxIntegral = controlModelConfig.pid.maxIntegral
  ) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.maxIntegral = maxIntegral;
  }

  calculate(setpoint: number, processValue: number): number {
    const now = Date.now();
    const dt = (now - this.lastTime) / 1000; // 转换为秒
    
    // 计算误差
    const error = setpoint - processValue;
    
    // 计算积分项
    this.integral += error * dt;
    this.integral = Math.max(-this.maxIntegral, Math.min(this.maxIntegral, this.integral));
    
    // 计算微分项
    const derivative = (error - this.lastError) / dt;
    
    // 计算输出
    const output = this.kp * error + this.ki * this.integral + this.kd * derivative;
    
    // 更新状态
    this.lastError = error;
    this.lastTime = now;
    
    return Math.max(0, Math.min(100, output));
  }

  reset(): void {
    this.integral = 0;
    this.lastError = 0;
    this.lastTime = Date.now();
  }
}

// 模糊控制器实现
export class FuzzyController {
  private rules: number[][];
  private errorRanges: number[];
  private errorChangeRanges: number[];

  constructor() {
    this.rules = controlModelConfig.fuzzy.rules;
    this.errorRanges = controlModelConfig.fuzzy.membershipRanges.error;
    this.errorChangeRanges = controlModelConfig.fuzzy.membershipRanges.errorChange;
  }

  private getMembership(value: number, ranges: number[]): number[] {
    const memberships = new Array(ranges.length).fill(0);
    
    for (let i = 0; i < ranges.length - 1; i++) {
      if (value >= ranges[i] && value <= ranges[i + 1]) {
        memberships[i] = (ranges[i + 1] - value) / (ranges[i + 1] - ranges[i]);
        memberships[i + 1] = (value - ranges[i]) / (ranges[i + 1] - ranges[i]);
      }
    }
    
    return memberships;
  }

  calculate(error: number, errorChange: number): number {
    // 计算误差和误差变化率的隶属度
    const errorMemberships = this.getMembership(error, this.errorRanges);
    const errorChangeMemberships = this.getMembership(errorChange, this.errorChangeRanges);
    
    let outputSum = 0;
    let membershipSum = 0;
    
    // 模糊推理
    for (let i = 0; i < errorMemberships.length; i++) {
      for (let j = 0; j < errorChangeMemberships.length; j++) {
        const ruleMembership = Math.min(errorMemberships[i], errorChangeMemberships[j]);
        outputSum += ruleMembership * this.rules[i][j];
        membershipSum += ruleMembership;
      }
    }
    
    // 重心法解模糊化
    return membershipSum > 0 ? (outputSum / membershipSum) * 100 : 0;
  }
}

// Smith预测控制器实现
export class SmithPredictor {
  private deadTime: number;
  private timeConstant: number;
  private modelGain: number;
  private processModel: number[] = [];
  private pidController: PIDController;

  constructor() {
    this.deadTime = controlModelConfig.smith.deadTime;
    this.timeConstant = controlModelConfig.smith.timeConstant;
    this.modelGain = controlModelConfig.smith.modelGain;
    this.pidController = new PIDController();
    
    // 初始化过程模型
    this.processModel = new Array(Math.ceil(this.deadTime)).fill(0);
  }

  private updateModel(input: number): number {
    // 一阶系统模型
    const modelOutput = this.processModel[this.processModel.length - 1];
    const newOutput = modelOutput + 
      (this.modelGain * input - modelOutput) * (1 / this.timeConstant);
    
    // 更新延迟队列
    this.processModel.shift();
    this.processModel.push(newOutput);
    
    return this.processModel[0];
  }

  calculate(setpoint: number, processValue: number): number {
    // 计算PID输出
    const pidOutput = this.pidController.calculate(setpoint, processValue);
    
    // 更新模型预测值
    const modelPrediction = this.updateModel(pidOutput);
    
    // 计算模型误差补偿
    const modelError = processValue - modelPrediction;
    
    // 补偿后的控制输出
    return Math.max(0, Math.min(100, pidOutput + modelError));
  }

  reset(): void {
    this.pidController.reset();
    this.processModel = new Array(Math.ceil(this.deadTime)).fill(0);
  }
}

// 控制器工厂
export class ControllerFactory {
  static createController(type: 'pid' | 'fuzzy' | 'smith'): PIDController | FuzzyController | SmithPredictor {
    switch (type) {
      case 'pid':
        return new PIDController();
      case 'fuzzy':
        return new FuzzyController();
      case 'smith':
        return new SmithPredictor();
      default:
        throw new Error('Unknown controller type');
    }
  }
} 