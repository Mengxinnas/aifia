// 使用量检查中间件
import { getCurrentUser } from './supabase'
import { checkAndConsumeUsage } from './usage-check-service'

export interface UsageCheckResult {
  canProceed: boolean
  message?: string
  usageStats?: any
}

export const checkUsageLimit = async (
  featureType: FeatureType,
  apiEndpoint?: string,
  requestSize?: number
): Promise<UsageCheckResult> => {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return {
        canProceed: false,
        message: '请先登录后使用该功能'
      }
    }

    console.log('=== 使用量中间件检查 ===')
    console.log('功能类型:', featureType)
    console.log('用户ID:', user.id)

    // 调用 checkAndConsumeUsage 来实际消费使用次数
    const result = await checkAndConsumeUsage(featureType)
    
    console.log('=== 消费结果 ===')
    console.log('可以使用:', result.canUse)
    console.log('消息:', result.message)
    
    if (result.canUse) {
      return {
        canProceed: true,
        message: result.message
      }
    } else {
      return {
        canProceed: false,
        message: result.message
      }
    }
    
  } catch (error: any) {
    console.error('检查使用限制失败:', error)
    return {
      canProceed: false,
      message: '检查使用权限时出现错误，请稍后重试'
    }
  }
}

// 前端使用的 Hook
export const useUsageCheck = () => {
  const checkAndProceed = async (
    featureType: FeatureType,
    onSuccess: () => Promise<void> | void,
    onFailure?: (message: string) => void
  ) => {
    console.log('=== useUsageCheck 开始 ===')
    console.log('功能类型:', featureType)
    
    const result = await checkUsageLimit(featureType)
    
    console.log('=== useUsageCheck 结果 ===')
    console.log('可以继续:', result.canProceed)
    console.log('消息:', result.message)
    
    if (result.canProceed) {
      console.log('✅ 使用权限验证成功，执行功能')
      await onSuccess()
    } else {
      console.log('❌ 使用权限验证失败')
      if (onFailure) {
        onFailure(result.message || '无法使用该功能')
      }
    }
    
    return result
  }

  return { checkAndProceed }
}

// 功能类型定义
export type FeatureType = 
  | 'accounting-qa'           // 会计问答
  | 'financial-analysis'      // 财务分析
  | 'batch-ledger'           // 批量台账
  | 'audit-validation'       // 审计验证
  | 'batch-accounting'       // 批量记账
  | 'batch-contract'         // 批量合同
  | 'invoice-parser'         // 发票解析
  | 'financial-report'       // 财务报告

// 使用限制检查Hook
export function useUsageLimit() {
  const checkUsage = async (featureType: FeatureType): Promise<{
    canProceed: boolean
    message: string
    showUpgrade?: boolean
  }> => {
    try {
      const result = await checkUsageLimit(featureType)
      
      if (result.canProceed) {
        return {
          canProceed: true,
          message: result.message || '使用成功'
        }
      } else {
        return {
          canProceed: false,
          message: result.message || '使用次数不足',
          showUpgrade: true
        }
      }
    } catch (error) {
      return {
        canProceed: false,
        message: '系统错误，请稍后重试'
      }
    }
  }

  return { checkUsage }
} 