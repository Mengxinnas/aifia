import { supabase } from './supabase'
import { getCurrentUser } from './supabase'

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

// 用户使用状态
export interface UserUsageStatus {
  freeUsesRemaining: number  // 剩余免费次数
  paidUsesRemaining: number  // 剩余付费次数
  totalUsed: number         // 总使用次数
  canUse: boolean          // 是否可以使用
  needsPurchase: boolean   // 是否需要购买
}

// 测试数据库连接
export async function testDatabaseConnection(): Promise<{ success: boolean; error?: string }> {
  try {
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

    // 测试数据库连接
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('id')
        .limit(1)

      if (error) {
        console.error('数据库连接失败:', error)
        return {
          freeUsesRemaining: 6,
          paidUsesRemaining: 0,
          totalUsed: 0,
          canUse: true,
          needsPurchase: false
        }
      }
    } catch (err) {
      console.error('数据库测试异常:', err)
      return {
        freeUsesRemaining: 6,
        paidUsesRemaining: 0,
        totalUsed: 0,
        canUse: true,
        needsPurchase: false
      }
    }

    // 获取用户积分状态
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (creditsError && !creditsError.message.includes('multiple (or no) rows returned')) {
      console.error('获取用户积分失败:', creditsError)
      return {
        freeUsesRemaining: 6,
        paidUsesRemaining: 0,
        totalUsed: 0,
        canUse: true,
        needsPurchase: false
      }
    }

    const freeUsesConsumed = credits?.free_uses_consumed || 0
    const paidUsesRemaining = credits?.remaining_uses || 0
    const freeUsesRemaining = Math.max(0, 6 - freeUsesConsumed)
    
    // 获取总使用次数
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

    return {
      freeUsesRemaining,
      paidUsesRemaining,
      totalUsed,
      canUse,
      needsPurchase
    }
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

    console.log('=== 开始消费使用次数 ===')
    console.log('用户ID:', user.id)
    console.log('功能类型:', featureType)

    // 调用数据库函数消费使用次数
    const { data, error } = await supabase.rpc('consume_usage', {
      user_uuid: user.id,
      feature_name: featureType
    })

    console.log('=== 数据库函数响应 ===')
    console.log('数据:', data)
    console.log('错误:', error)

    if (error) {
      console.error('消费使用次数失败:', error)
      return { canUse: false, message: '系统错误，请稍后重试' }
    }

    if (!data || data.length === 0) {
      console.error('数据库函数返回空结果')
      return { canUse: false, message: '系统错误，请稍后重试' }
    }

    const result = data[0]
    console.log('=== 处理结果 ===')
    console.log('成功:', result.success)
    console.log('消息:', result.message)

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
    console.error('消费使用次数异常:', error)
    return {
      canUse: false,
      message: '系统错误，请稍后重试'
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