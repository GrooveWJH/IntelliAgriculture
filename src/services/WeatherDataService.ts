import axios from 'axios';
import dayjs from 'dayjs';

// 天气数据接口
export interface WeatherData {
  location: string;
  timestamp: number;
  temperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
  weatherType: string;
  description: string;
}

// 干扰类型
export interface WeatherInterference {
  type: 'temperature' | 'humidity' | 'co2' | 'light';
  value: number; // 干扰值，可正可负
  startTime: number; // 开始时间戳
  endTime: number; // 结束时间戳
}

// 天气API配置
interface WeatherApiConfig {
  apiKey: string;
  baseUrl: string;
  location: string;
  useMockData: boolean;
}

// 默认配置
const defaultConfig: WeatherApiConfig = {
  apiKey: process.env.WEATHER_API_KEY || '',
  baseUrl: 'https://api.example-weather.com/v1', // 替换为实际API的URL
  location: '116.3883,39.9289', // 默认位置（北京）
  useMockData: true // 默认使用模拟数据
};

// 模拟天气数据
const mockWeatherTypes = [
  { type: '晴天', temp: 25, humidity: 50, cloudCover: 0.1, precip: 0, windSpeed: 2, description: '晴朗无云' },
  { type: '多云', temp: 23, humidity: 60, cloudCover: 0.4, precip: 0, windSpeed: 3, description: '局部多云' },
  { type: '阴天', temp: 20, humidity: 70, cloudCover: 0.8, precip: 0, windSpeed: 4, description: '全天阴云' },
  { type: '小雨', temp: 18, humidity: 80, cloudCover: 0.9, precip: 2, windSpeed: 5, description: '小雨' },
  { type: '中雨', temp: 17, humidity: 85, cloudCover: 0.95, precip: 8, windSpeed: 6, description: '中雨' },
  { type: '大雨', temp: 16, humidity: 90, cloudCover: 1, precip: 20, windSpeed: 8, description: '大雨' },
];

class WeatherDataService {
  private config: WeatherApiConfig;
  private cachedData: WeatherData | null = null;
  private lastFetchTime: number = 0;
  private cacheTTL: number = 30 * 60 * 1000; // 30分钟缓存
  private activeInterferences: WeatherInterference[] = []; // 当前活跃的干扰
  
  constructor(config: Partial<WeatherApiConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * 获取当前天气数据
   * @returns 天气数据
   */
  async getCurrentWeather(): Promise<WeatherData> {
    const now = Date.now();
    
    // 如果缓存有效，直接返回缓存数据
    if (this.cachedData && now - this.lastFetchTime < this.cacheTTL) {
      const weatherData = { ...this.cachedData };
      
      // 应用干扰效果
      this.applyInterferences(weatherData);
      
      return weatherData;
    }
    
    // 使用模拟数据或从API获取
    const weatherData = this.config.useMockData 
      ? this.getMockWeatherData() 
      : await this.fetchWeatherFromAPI();
    
    // 更新缓存
    this.cachedData = weatherData;
    this.lastFetchTime = now;
    
    // 应用干扰效果
    this.applyInterferences(weatherData);
    
    return weatherData;
  }
  
  /**
   * 应用干扰效果到天气数据
   * @param weatherData 原始天气数据
   */
  private applyInterferences(weatherData: WeatherData): void {
    const now = Date.now();
    
    // 过滤掉已过期的干扰
    this.activeInterferences = this.activeInterferences.filter(
      interference => interference.endTime > now
    );
    
    // 应用活跃干扰的效果
    for (const interference of this.activeInterferences) {
      switch (interference.type) {
        case 'temperature':
          weatherData.temperature += interference.value;
          // 更新描述
          weatherData.description = `${weatherData.description} (温度干扰: ${interference.value > 0 ? '+' : ''}${interference.value}°C)`;
          break;
        case 'humidity':
          weatherData.humidity += interference.value;
          weatherData.humidity = Math.max(0, Math.min(100, weatherData.humidity)); // 限制在0-100范围
          // 更新描述
          weatherData.description = `${weatherData.description} (湿度干扰: ${interference.value > 0 ? '+' : ''}${interference.value}%)`;
          break;
        case 'light':
          // 光照干扰通过改变云量来实现
          weatherData.cloudCover -= interference.value / 1000; // 值越大，云量越少，光照越强
          weatherData.cloudCover = Math.max(0, Math.min(1, weatherData.cloudCover)); // 限制在0-1范围
          // 更新描述
          weatherData.description = `${weatherData.description} (光照干扰: ${interference.value > 0 ? '+' : ''}${interference.value}lux)`;
          break;
        case 'co2':
          // CO2干扰不直接影响天气数据，只在描述中显示
          weatherData.description = `${weatherData.description} (CO2干扰: ${interference.value > 0 ? '+' : ''}${interference.value}ppm)`;
          break;
      }
    }
  }
  
  /**
   * 添加天气干扰
   * @param type 干扰类型
   * @param value 干扰值
   * @param duration 持续时间（分钟）
   * @returns 添加的干扰对象
   */
  addInterference(type: WeatherInterference['type'], value: number, duration: number): WeatherInterference {
    const now = Date.now();
    const interference: WeatherInterference = {
      type,
      value,
      startTime: now,
      endTime: now + duration * 60 * 1000 // 转换为毫秒
    };
    
    this.activeInterferences.push(interference);
    
    // 清除缓存，确保下次获取天气时重新计算
    this.cachedData = null;
    
    return interference;
  }
  
  /**
   * 获取当前所有活跃干扰
   * @returns 活跃干扰列表
   */
  getActiveInterferences(): WeatherInterference[] {
    const now = Date.now();
    return this.activeInterferences.filter(
      interference => interference.endTime > now
    );
  }
  
  /**
   * 清除所有干扰
   */
  clearAllInterferences(): void {
    this.activeInterferences = [];
    this.cachedData = null; // 清除缓存
  }
  
  /**
   * 从API获取天气数据
   * @returns 获取的天气数据
   */
  private async fetchWeatherFromAPI(): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/weather`, {
        params: {
          location: this.config.location,
          key: this.config.apiKey,
          lang: 'zh_CN',
          unit: 'metric'
        }
      });
      
      // 根据实际API响应解析数据
      // 这里只是一个示例，需要根据实际使用的API调整
      const data = response.data;
      return {
        location: this.config.location,
        timestamp: Date.now(),
        temperature: data.main.temp,
        humidity: data.main.humidity,
        cloudCover: data.clouds.all / 100,
        precipitation: data.rain ? data.rain['1h'] || 0 : 0,
        windSpeed: data.wind.speed,
        weatherType: data.weather[0].main,
        description: data.weather[0].description
      };
    } catch (error) {
      console.error('获取天气数据失败:', error);
      // 失败时返回模拟数据
      return this.getMockWeatherData();
    }
  }
  
  /**
   * 生成模拟天气数据
   * @returns 模拟的天气数据
   */
  private getMockWeatherData(): WeatherData {
    const now = dayjs();
    const hour = now.hour();
    const isDay = hour >= 6 && hour <= 18;
    
    // 天气类型概率 - 根据时间调整
    let weights = isDay 
      ? [3, 2, 1, 0.5, 0.3, 0.1] // 白天更可能晴朗
      : [1, 2, 2, 1, 0.5, 0.2];  // 夜间更可能阴天
    
    // 根据季节调整（这里简化为月份）
    const month = now.month() + 1;
    if (month >= 6 && month <= 8) { // 夏季
      weights = [3, 2, 1, 0.8, 0.6, 0.4]; // 夏季更可能下雨
    } else if (month >= 12 || month <= 2) { // 冬季
      weights = [2, 3, 2, 0.3, 0.1, 0]; // 冬季更可能多云和阴天
    }
    
    // 选择天气类型
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const random = Math.random() * totalWeight;
    let sum = 0;
    let selectedTypeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        selectedTypeIndex = i;
        break;
      }
    }
    
    const weatherType = mockWeatherTypes[selectedTypeIndex];
    
    // 添加时间变化因素
    // 温度在一天内有波动，高点在下午2点左右
    const hourFactor = Math.sin((hour - 6) * Math.PI / 12);
    const tempVariation = isDay ? 5 * hourFactor : -2; // 白天温差大，夜间稍低
    
    return {
      location: this.config.location,
      timestamp: Date.now(),
      temperature: weatherType.temp + tempVariation,
      humidity: weatherType.humidity,
      cloudCover: weatherType.cloudCover,
      precipitation: weatherType.precip,
      windSpeed: weatherType.windSpeed,
      weatherType: weatherType.type,
      description: weatherType.description
    };
  }
  
  /**
   * 设置位置
   * @param location 新的位置
   */
  setLocation(location: string): void {
    this.config.location = location;
    this.cachedData = null; // 清除缓存
  }
  
  /**
   * 设置是否使用模拟数据
   * @param useMock 是否使用模拟数据
   */
  setUseMockData(useMock: boolean): void {
    this.config.useMockData = useMock;
    this.cachedData = null; // 清除缓存
  }
}

// 导出单例实例
export const weatherService = new WeatherDataService(); 