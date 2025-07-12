// 使用量统计和付费功能服务
import { supabase } from './supabase'
import { getCurrentUser } from './supabase'

// 常量定义
const FREE_USAGE_LIMIT = 6

// 套餐配置
export const PACKAGES = {
  '5_times': { 
    name: '5次使用包', 
    price: 16.6, 
    uses: 5,
    description: '适合轻度使用'
  },
  '10_times': { 
    name: '10次使用包', 
    price: 29.9, 
    uses: 10,
    description: '适合常规使用，更优惠'
  }
} as const

export type PackageType = keyof typeof PACKAGES

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

// 使用记录接口
interface UsageRecord {
  id?: string
  user_id: string
  feature_type: FeatureType
  used_at: string
  api_endpoint?: string
  request_size?: number
}

// 购买记录接口
interface PurchaseRecord {
  id?: string
  user_id: string
  package_type: '5_times' | '10_times'
  price: number
  purchase_time: string
  remaining_uses: number
  expires_at?: string
}

// 用户使用统计接口
interface UserUsageStats {
  total_uses: number
  free_uses_remaining: number
  purchased_uses_remaining: number
  can_use_feature: boolean
  needs_payment: boolean
}

// 用户使用状态
export interface UserUsageStatus {
  freeUsesRemaining: number  // 剩余免费次数
  paidUsesRemaining: number  // 剩余付费次数
  totalUsed: number         // 总使用次数
  canUse: boolean          // 是否可以使用
  needsPurchase: boolean   // 是否需要购买
}

// 获取用户使用状态
export async function getUserUsageStatus(): Promise<UserUsageStatus> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        freeUsesRemaining: 6,
        paidUsesRemaining: 0,
        totalUsed: 0,
        canUse: true,
        needsPurchase: false
      }
    }

    console.log('=== 获取用户使用状态 ===')
    console.log('用户ID:', user.id)

    // 获取用户积分状态（从 user_credits 表）
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    console.log('=== 用户积分查询结果 ===')
    console.log('积分数据:', credits)
    console.log('查询错误:', creditsError)

    let freeUsesConsumed = 0
    let paidUsesRemaining = 0

    if (creditsError) {
      console.error('获取用户积分失败:', creditsError)
    } else if (credits) {
      freeUsesConsumed = credits.free_uses_consumed || 0
      paidUsesRemaining = credits.remaining_uses || 0
      console.log('免费已用:', freeUsesConsumed, '付费剩余:', paidUsesRemaining)
    } else {
      // 记录不存在，创建一个新记录
      console.log('用户积分记录不存在，创建新记录')
      try {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            free_uses_consumed: 0,
            remaining_uses: 0,
            total_purchased: 0
          })
          .select()
          .single()

        if (!insertError && newCredits) {
          freeUsesConsumed = newCredits.free_uses_consumed || 0
          paidUsesRemaining = newCredits.remaining_uses || 0
          console.log('新记录创建成功:', newCredits)
        }
      } catch (insertErr) {
        console.error('创建用户积分记录失败:', insertErr)
      }
    }

    const freeUsesRemaining = Math.max(0, 6 - freeUsesConsumed)
    
    // 获取总使用次数（从 usage_records 表）
    const { data: usageData, error: usageError } = await supabase
      .from('usage_records')
      .select('id')
      .eq('user_id', user.id)

    if (usageError) {
      console.error('获取使用记录失败:', usageError)
    }

    const totalUsed = usageData?.length || 0
    const canUse = freeUsesRemaining > 0 || paidUsesRemaining > 0
    const needsPurchase = freeUsesRemaining === 0 && paidUsesRemaining === 0

    const result = {
      freeUsesRemaining,
      paidUsesRemaining,
      totalUsed,
      canUse,
      needsPurchase
    }

    console.log('=== 最终使用状态 ===')
    console.log('免费剩余:', freeUsesRemaining)
    console.log('付费剩余:', paidUsesRemaining)
    console.log('累计使用:', totalUsed)
    console.log('可以使用:', canUse)
    console.log('需要购买:', needsPurchase)

    return result
  } catch (error) {
    console.error('获取用户状态失败:', error)
    return {
      freeUsesRemaining: 6,
      paidUsesRemaining: 0,
      totalUsed: 0,
      canUse: true,
      needsPurchase: false
    }
  }
}

// 兑换码兑换
export async function redeemCode(code: string): Promise<{
  success: boolean
  message: string
  usesAdded?: number
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, message: '请先登录' }
    }

    // 调用数据库函数进行兑换
    const { data, error } = await supabase.rpc('redeem_code_transaction', {
      code_text: code.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      user_uuid: user.id
    })

    if (error) {
      console.error('兑换失败:', error)
      return { success: false, message: '兑换失败，请检查兑换码是否正确' }
    }

    const result = data[0]
    return {
      success: result.success,
      message: result.message,
      usesAdded: result.uses_added || undefined
    }
  } catch (error: any) {
    console.error('兑换失败:', error)
    return { 
      success: false, 
      message: '兑换失败，请检查兑换码是否正确' 
    }
  }
}

// 获取兑换历史 - 完全禁用
export async function getRedemptionHistory() {
  return []
}

// 检查并消费使用次数
export async function checkAndConsumeUsage(featureType: string): Promise<{
  canUse: boolean
  message: string
  needsUpgrade?: boolean
}> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return { canUse: false, message: '请先登录' }
    }

    // 调用数据库函数消费使用次数，确保参数类型正确
    const { data, error } = await supabase.rpc('consume_usage', {
      user_uuid: user.id,  // 确保是UUID类型
      feature_name: featureType  // 确保是TEXT类型
    })

    if (error) {
      console.error('消费使用次数失败:', error)
      return { canUse: false, message: '系统错误，请稍后重试' }
    }

    const result = data[0]
    if (result.success) {
      return {
        canUse: true,
        message: result.message
      }
    } else {
      return {
        canUse: false,
        message: result.message,
        needsUpgrade: true
      }
    }
  } catch (error) {
    console.error('消费使用次数失败:', error)
    return {
      canUse: false,
      message: '系统错误，请稍后重试'
    }
  }
}

// 生成兑换码（管理员功能）
export async function generateRedemptionCode(): Promise<string> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let code = ''
  // 4个字母
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  // 4个数字  
  for (let i = 0; i < 4; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)]
  }
  // 4个字母
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  
  return code
}

// 管理员生成兑换码
export async function generateRedemptionCodes(
  packageType: PackageType,
  quantity: number = 1,
  expiryDays?: number
): Promise<{ success: boolean; codes?: string[]; error?: string }> {
  try {
    const codes: string[] = []
    const packageInfo = PACKAGES[packageType]
    const expiresAt = expiryDays ? 
      new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : null

    // 生成唯一兑换码
    for (let i = 0; i < quantity; i++) {
      let code: string
      let isUnique = false
      
      while (!isUnique) {
        code = await generateRedemptionCode()
        
        const { data: existingCode } = await supabase
          .from('redemption_codes')
          .select('id')
          .eq('code', code)
          .single()
        
        if (!existingCode) {
          isUnique = true
          codes.push(code)
        }
      }
    }

    // 批量插入兑换码
    const insertData = codes.map(code => ({
      code,
      package_type: packageType,
      uses: packageInfo.uses,
      price: packageInfo.price,
      expires_at: expiresAt?.toISOString(),
      notes: `批量生成 - ${new Date().toLocaleString()}`
    }))

    const { error } = await supabase
      .from('redemption_codes')
      .insert(insertData)

    if (error) throw error

    return { success: true, codes }
  } catch (error: any) {
    console.error('生成兑换码失败:', error)
    return { success: false, error: error.message }
  }
}

// 测试数据库连接
export const testDatabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    // 改用简单的表查询，不使用count
    const { data, error } = await supabase
      .from('user_credits')
      .select('id')
      .limit(1)

    if (error) {
      console.error('数据库连接测试失败:', error)
      return { success: false, error: `数据库连接失败: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    console.error('数据库连接测试异常:', error)
    return { success: false, error: error.message }
  }
}

// 记录功能使用
export const recordUsage = async (
  userId: string, 
  featureType: FeatureType, 
  apiEndpoint?: string,
  requestSize?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const usageRecord: UsageRecord = {
      user_id: userId,
      feature_type: featureType,
      used_at: new Date().toISOString(),
      api_endpoint: apiEndpoint,
      request_size: requestSize
    }

    const { error } = await supabase
      .from('usage_records')
      .insert(usageRecord)

    if (error) {
      console.error('记录使用次数失败:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('记录使用次数异常:', error)
    return { success: false, error: error.message }
  }
}

// 检查用户是否可以使用功能
export const canUseFeature = async (userId: string): Promise<UserUsageStats> => {
  try {
    console.log('开始检查用户使用权限:', userId)

    // 获取用户积分记录
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    let freeUsesConsumed = 0
    let paidUsesRemaining = 0

    if (creditsError) {
      console.error('查询用户积分失败:', creditsError)
    } else if (credits) {
      freeUsesConsumed = credits.free_uses_consumed || 0
      paidUsesRemaining = credits.remaining_uses || 0
    }

    const freeUsesRemaining = Math.max(0, FREE_USAGE_LIMIT - freeUsesConsumed)

    // 获取总使用次数
    const { data: usageData, error: usageError } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)

    if (usageError) {
      console.error('查询使用记录失败:', usageError)
    }

    const totalUses = usageData?.length || 0
    const canUse = freeUsesRemaining > 0 || paidUsesRemaining > 0
    const needsPayment = freeUsesRemaining === 0 && paidUsesRemaining === 0

    console.log('使用权限检查结果:', {
      total_uses: totalUses,
      free_uses_remaining: freeUsesRemaining,
      purchased_uses_remaining: paidUsesRemaining,
      can_use_feature: canUse,
      needs_payment: needsPayment
    })

    return {
      total_uses: totalUses,
      free_uses_remaining: freeUsesRemaining,
      purchased_uses_remaining: paidUsesRemaining,
      can_use_feature: canUse,
      needs_payment: needsPayment
    }
  } catch (error: any) {
    console.error('检查使用权限失败:', error)
    // 发生错误时返回安全的默认值
    return {
      total_uses: 0,
      free_uses_remaining: FREE_USAGE_LIMIT,
      purchased_uses_remaining: 0,
      can_use_feature: true,
      needs_payment: false
    }
  }
}

// 使用一次付费次数
export const consumePurchasedUse = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 获取最早的有剩余次数的购买记录
    const { data: purchaseData, error: fetchError } = await supabase
      .from('purchase_records')
      .select('*')
      .eq('user_id', userId)
      .gt('remaining_uses', 0)
      .order('purchase_time', { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error('获取购买记录失败:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!purchaseData || purchaseData.length === 0) {
      return { success: false, error: '没有可用的付费次数' }
    }

    const record = purchaseData[0]
    const { error: updateError } = await supabase
      .from('purchase_records')
      .update({ remaining_uses: record.remaining_uses - 1 })
      .eq('id', record.id)

    if (updateError) {
      console.error('更新购买记录失败:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log('成功消费一次付费使用:', record.id)
    return { success: true }
  } catch (error: any) {
    console.error('消费付费次数异常:', error)
    return { success: false, error: error.message }
  }
}

// 购买使用次数包
export const purchaseUsagePackage = async (
  userId: string,
  packageType: '5_times' | '10_times'
): Promise<{ success: boolean; error?: string; purchaseId?: string }> => {
  try {
    const packageConfig = {
      '5_times': { uses: 5, price: 9.9 },
      '10_times': { uses: 10, price: 19.9 }
    }

    const config = packageConfig[packageType]
    const purchaseRecord: PurchaseRecord = {
      user_id: userId,
      package_type: packageType,
      price: config.price,
      purchase_time: new Date().toISOString(),
      remaining_uses: config.uses
    }

    console.log('创建购买记录:', purchaseRecord)

    const { data, error } = await supabase
      .from('purchase_records')
      .insert(purchaseRecord)
      .select()

    if (error) {
      console.error('创建购买记录失败:', error)
      return { success: false, error: error.message }
    }

    console.log('购买记录创建成功:', data[0])
    return { 
      success: true, 
      purchaseId: data[0]?.id 
    }
  } catch (error: any) {
    console.error('购买使用包异常:', error)
    return { success: false, error: error.message }
  }
}

// 获取用户购买历史
export const getUserPurchaseHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('purchase_records')
      .select('*')
      .eq('user_id', userId)
      .order('purchase_time', { ascending: false })

    if (error) {
      console.error('获取购买历史失败:', error)
      throw error
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    console.error('获取购买历史异常:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// 获取用户详细使用统计
export const getUserUsageDetails = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false })

    if (error) {
      console.error('获取使用详情失败:', error)
      throw error
    }

    // 按功能类型分组统计
    const usageByFeature = data?.reduce((acc, record) => {
      acc[record.feature_type] = (acc[record.feature_type] || 0) + 1
      return acc
    }, {} as Record<FeatureType, number>) || {}

    return { 
      success: true, 
      data: data || [],
      usageByFeature,
      totalUses: data?.length || 0
    }
  } catch (error: any) {
    console.error('获取使用详情异常:', error)
    return { 
      success: false, 
      error: error.message, 
      data: [],
      usageByFeature: {},
      totalUses: 0
    }
  }
} 