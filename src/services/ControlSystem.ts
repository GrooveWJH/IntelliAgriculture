import { ControllerFactory } from '../controllers/ControlModels';
import { environmentConfig } from '../config/systemConfig';
import { SensorData } from '../contexts/SensorDataContext';

export interface SystemOutput {
  power: number;
  status: string;
  controlMode: 'pid' | 'fuzzy' | 'smith';
}

class ControlSystem {
  private controllers: Map<string, any> = new Map();
  private lastErrors: Map<string, number> = new Map();
  private lastUpdate: number = Date.now();

  constructor() {
    // 为每个子系统初始化控制器
    this.initializeControllers();
  }

  private initializeControllers(): void {
    // 通风系统使用Smith预测控制器（适合大延迟系统）
    this.controllers.set('ventilation', ControllerFactory.createController('smith'));
    
    // 加湿系统使用模糊控制器（适合非线性系统）
    this.controllers.set('humidification', ControllerFactory.createController('fuzzy'));
    
    // 补光系统使用PID控制器（适合线性系统）
    this.controllers.set('lighting', ControllerFactory.createController('pid'));
    
    // 灌溉系统使用模糊控制器（适合非线性系统）
    this.controllers.set('irrigation', ControllerFactory.createController('fuzzy'));
    
    // CO2系统使用PID控制器
    this.controllers.set('co2', ControllerFactory.createController('pid'));
    
    // 遮阳系统使用PID控制器
    this.controllers.set('shading', ControllerFactory.createController('pid'));
  }

  calculateVentilationControl(sensorData: SensorData): SystemOutput {
    const controller = this.controllers.get('ventilation');
    const tempError = sensorData.airTemperature - environmentConfig.airTemperature.target;
    const humidityError = sensorData.airHumidity - environmentConfig.airHumidity.target;
    
    // 使用较大的误差作为控制输入
    const error = Math.max(
      tempError / (environmentConfig.airTemperature.warningThreshold - environmentConfig.airTemperature.target),
      humidityError / (environmentConfig.airHumidity.warningThreshold - environmentConfig.airHumidity.target)
    ) * 100;

    const power = controller.calculate(0, error);
    
    return {
      power,
      status: this.getVentilationStatus(sensorData),
      controlMode: 'smith'
    };
  }

  calculateHumidificationControl(sensorData: SensorData): SystemOutput {
    const controller = this.controllers.get('humidification');
    const error = environmentConfig.airHumidity.target - sensorData.airHumidity;
    const errorChange = this.getErrorChange('humidification', error);
    
    const power = controller.calculate(error, errorChange);
    
    return {
      power,
      status: this.getHumidificationStatus(sensorData),
      controlMode: 'fuzzy'
    };
  }

  calculateLightingControl(sensorData: SensorData): SystemOutput {
    const controller = this.controllers.get('lighting');
    const power = controller.calculate(
      environmentConfig.lightIntensity.target,
      sensorData.lightIntensity
    );
    
    return {
      power,
      status: this.getLightingStatus(sensorData),
      controlMode: 'pid'
    };
  }

  private getErrorChange(system: string, currentError: number): number {
    const dt = (Date.now() - this.lastUpdate) / 1000;
    const lastError = this.lastErrors.get(system) || 0;
    const errorChange = (currentError - lastError) / dt;
    
    this.lastErrors.set(system, currentError);
    this.lastUpdate = Date.now();
    
    return errorChange;
  }

  private getVentilationStatus(sensorData: SensorData): string {
    if (sensorData.airTemperature > environmentConfig.airTemperature.target) {
      return `正在降温 - 目标温度${environmentConfig.airTemperature.target}°C（当前${sensorData.airTemperature.toFixed(1)}°C）`;
    } else if (sensorData.airHumidity > environmentConfig.airHumidity.target) {
      return `正在降低湿度 - 目标湿度${environmentConfig.airHumidity.target}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
    }
    return '系统待机中 - 环境参数正常';
  }

  private getHumidificationStatus(sensorData: SensorData): string {
    if (sensorData.airHumidity < environmentConfig.airHumidity.target) {
      return `正在加湿 - 目标湿度${environmentConfig.airHumidity.target}%（当前${sensorData.airHumidity.toFixed(1)}%）`;
    }
    return '系统待机中 - 湿度正常';
  }

  private getLightingStatus(sensorData: SensorData): string {
    if (sensorData.lightIntensity < environmentConfig.lightIntensity.target) {
      return `正在补光 - 目标光照${environmentConfig.lightIntensity.target}lux（当前${sensorData.lightIntensity.toFixed(1)}lux）`;
    }
    return '系统待机中 - 光照充足';
  }

  // 重置所有控制器
  reset(): void {
    this.controllers.forEach(controller => {
      if (typeof controller.reset === 'function') {
        controller.reset();
      }
    });
    this.lastErrors.clear();
    this.lastUpdate = Date.now();
  }
}

export const controlSystem = new ControlSystem(); 