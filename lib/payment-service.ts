// 模拟支付服务
import { purchaseUsagePackage } from './usage-service'

interface PaymentConfig {
  packageType: '5_times' | '10_times'
  amount: number
  wechatQR?: string
  alipayQR?: string
}

const PAYMENT_CONFIG: Record<string, PaymentConfig> = {
  '5_times': {
    packageType: '5_times',
    amount: 9.9,
    wechatQR: '/wechat-pay-qr.jpg', // 您的微信收款码
    alipayQR: '/alipay-qr.jpg'      // 您的支付宝收款码
  },
  '10_times': {
    packageType: '10_times', 
    amount: 19.9,
    wechatQR: '/wechat-pay-qr.jpg',
    alipayQR: '/alipay-qr.jpg'
  }
}

// 模拟支付流程
export const simulatePayment = async (
  userId: string,
  packageType: '5_times' | '10_times',
  paymentMethod: 'wechat' | 'alipay' | 'simulation'
): Promise<{ success: boolean; error?: string; paymentId?: string }> => {
  
  if (paymentMethod === 'simulation') {
    // 直接模拟支付成功，用于测试
    try {
      console.log('模拟支付成功，直接创建购买记录')
      const result = await purchaseUsagePackage(userId, packageType)
      
      if (result.success) {
        return {
          success: true,
          paymentId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // 对于真实支付，返回支付配置信息
  const config = PAYMENT_CONFIG[packageType]
  return {
    success: false,
    error: `请完成${paymentMethod === 'wechat' ? '微信' : '支付宝'}支付后联系客服激活`
  }
}

// 手动验证支付（客服后台使用）
export const manualVerifyPayment = async (
  userId: string,
  packageType: '5_times' | '10_times',
  paymentProof: string // 付款凭证
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 这里可以添加付款凭证验证逻辑
    console.log('手动验证支付:', { userId, packageType, paymentProof })
    
    const result = await purchaseUsagePackage(userId, packageType)
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export { PAYMENT_CONFIG } 