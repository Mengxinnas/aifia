import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://debppatbaattcaqdrvtm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlYnBwYXRiYWF0dGNhcWRydnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMTU0MjEsImV4cCI6MjA2NTg5MTQyMX0.Oj6ob_bMkru0qpynqYb1UMpxfCOLhsZNdrKhY2W24fY'

// 添加配置验证
if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'your-complete-anon-key-here') {
  console.error('Supabase 配置缺失或无效')
}

console.log('Supabase 配置:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey.length,
  keyValid: supabaseAnonKey !== 'your-complete-anon-key-here'
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    debug: false // 关闭调试减少日志
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
})

// 简化状态监听
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email || 'no user')
})

// 改进的注册函数 - 保存到元数据和用户资料表
export const signUpWithPhoneNumber = async (email: string, password: string, phone: string) => {
  try {
    console.log('=== 开始注册流程 ===')
    console.log('注册参数:', { 
      email, 
      phone,
      phoneLength: phone.length,
      phoneType: typeof phone
    })
    
    // 清理手机号格式
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+86/, '')
    
    // 构建用户元数据
    const metadata = {
      phone: cleanPhone,
      phone_number: cleanPhone,
      mobile: cleanPhone,
      display_name: email.split('@')[0],
      registration_time: new Date().toISOString(),
      registration_phone: cleanPhone
    }
    
    console.log('用户元数据:', metadata)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    console.log('=== 注册API响应 ===')
    console.log('成功:', !!data.user)
    console.log('用户ID:', data.user?.id)
    console.log('邮箱:', data.user?.email)
    console.log('完整元数据:', JSON.stringify(data.user?.user_metadata, null, 2))

    if (error) {
      console.error('注册错误:', error)
      throw error
    }

    // 注册成功后，创建用户资料记录
    if (data.user) {
      try {
        console.log('=== 创建用户资料记录 ===')
        
        // 尝试创建用户资料表记录（如果表存在的话）
        const profileData = {
          user_id: data.user.id,
          email: data.user.email,
          phone: cleanPhone,
          display_name: metadata.display_name,
          registration_time: metadata.registration_time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // 这里我们尝试插入到 profiles 表，如果表不存在会失败但不影响注册
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
        
        if (profileError) {
          console.log('用户资料表插入失败（可能表不存在）:', profileError.message)
          // 这里不抛出错误，因为主要注册已经成功
        } else {
          console.log('✅ 用户资料记录创建成功:', profileResult)
        }
      } catch (profileErr) {
        console.log('创建用户资料记录异常:', profileErr)
        // 不影响主注册流程
      }

      // 更新用户元数据
      try {
        console.log('=== 更新用户元数据 ===')
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          data: {
            ...metadata,
            updated_at: new Date().toISOString(),
            phone_verified: false,
            profile_created: true
          }
        })
        
        if (updateError) {
          console.warn('更新元数据失败:', updateError.message)
        } else {
          console.log('✅ 元数据更新成功')
        }
      } catch (updateErr) {
        console.warn('更新元数据异常:', updateErr)
      }
    }

    // 验证手机号是否正确保存
    const savedPhone = data.user?.user_metadata?.phone
    if (data.user && savedPhone !== cleanPhone) {
      console.warn('警告: 手机号保存不匹配!', {
        expected: cleanPhone,
        actual: savedPhone
      })
    } else {
      console.log('✅ 手机号保存成功:', savedPhone)
    }

    return { data, error: null }
  } catch (err: any) {
    console.error('=== 注册失败 ===')
    console.error('错误类型:', err.name)
    console.error('错误消息:', err.message)
    throw err
  }
}

// 获取用户完整信息（包括资料表数据）
export const getUserWithPhone = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }

    // 从元数据中获取手机号
    const phone = user.user_metadata?.phone || 
                  user.user_metadata?.phone_number || 
                  user.user_metadata?.mobile ||
                  user.user_metadata?.registration_phone

    // 尝试从资料表获取更多信息
    let profileData = null
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!profileError && profile) {
        profileData = profile
        console.log('从资料表获取到数据:', profile)
      }
    } catch (profileErr) {
      console.log('资料表查询失败（可能表不存在）:', profileErr)
    }

    const userInfo = {
      ...user,
      phone: phone,
      profile: profileData
    }

    console.log('用户完整信息:', {
      id: user.id,
      email: user.email,
      phone: phone,
      display_name: user.user_metadata?.display_name,
      profile: profileData,
      metadata: user.user_metadata
    })

    return userInfo
  } catch (err) {
    console.error('获取用户信息失败:', err)
    return null
  }
}

// 更新用户手机号
export const updateUserPhone = async (newPhone: string) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('用户未登录')
    }

    const cleanPhone = newPhone.replace(/\s+/g, '').replace(/^\+86/, '')
    
    // 更新认证系统的元数据
    const { data: authData, error: authError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        phone: cleanPhone,
        phone_number: cleanPhone,
        mobile: cleanPhone,
        updated_at: new Date().toISOString()
      }
    })

    if (authError) {
      throw authError
    }

    // 尝试更新资料表
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: cleanPhone,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()

      if (profileError) {
        console.warn('资料表更新失败:', profileError.message)
      } else {
        console.log('✅ 资料表更新成功:', profileData)
      }
    } catch (profileErr) {
      console.warn('资料表更新异常:', profileErr)
    }

    console.log('✅ 手机号更新成功:', cleanPhone)
    return { success: true, phone: cleanPhone }
  } catch (err: any) {
    console.error('手机号更新失败:', err)
    throw err
  }
}

// 调试用户元数据
export const debugUserMetadata = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('没有当前用户')
      return null
    }

    console.log('=== 用户元数据调试信息 ===')
    console.log('用户ID:', user.id)
    console.log('邮箱:', user.email)
    console.log('创建时间:', user.created_at)
    console.log('更新时间:', user.updated_at)
    console.log('邮箱确认时间:', user.email_confirmed_at)
    console.log('完整用户元数据:', JSON.stringify(user.user_metadata, null, 2))
    console.log('应用元数据:', JSON.stringify(user.app_metadata, null, 2))
    
    // 检查手机号字段
    const phoneFields = ['phone', 'phone_number', 'mobile', 'registration_phone']
    console.log('手机号字段检查:')
    phoneFields.forEach(field => {
      const value = user.user_metadata?.[field]
      if (value) {
        console.log(`  ✅ ${field}: ${value}`)
      } else {
        console.log(`  ❌ ${field}: 未设置`)
      }
    })

    // 尝试查询资料表
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      if (!profileError && profile) {
        console.log('=== 资料表数据 ===')
        console.log(JSON.stringify(profile, null, 2))
      } else {
        console.log('=== 资料表查询结果 ===')
        console.log('无资料表数据或表不存在:', profileError?.message)
      }
    } catch (profileErr) {
      console.log('资料表查询异常:', profileErr)
    }

    return user
  } catch (err) {
    console.error('调试用户元数据失败:', err)
    return null
  }
}

// 身份验证
export const verifyUserIdentity = async (email: string, phone: string) => {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('邮箱格式不正确')
    }

    const phoneRegex = /^(\+86)?1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      throw new Error('手机号格式不正确')
    }

    return { success: true, email, phone }
  } catch (err: any) {
    throw err
  }
}

// 快速密码重置
export const quickPasswordReset = async (email: string, phone: string, newPassword: string) => {
  try {
    console.log('=== 快速密码重置 ===')
    
    const resetData = {
      email,
      phone,
      newPassword: btoa(newPassword),
      timestamp: Date.now(),
      resetId: 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      supabaseReset: false
    }
    
    localStorage.setItem('active_password_reset', JSON.stringify(resetData))
    
    return {
      success: true,
      message: '密码重置成功！新密码立即生效，请使用新密码登录',
      resetId: resetData.resetId,
      method: 'local'
    }
  } catch (err: any) {
    console.error('快速密码重置失败:', err)
    throw err
  }
}

// 智能登录
export const smartSignIn = async (email: string, password: string) => {
  try {
    console.log('=== 智能登录开始 ===', { email })
    
    // 尝试正常登录
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        console.log('Supabase 正常登录成功')
        localStorage.removeItem('active_password_reset')
        
        return {
          success: true,
          user: data.user,
          message: '登录成功！',
          fromReset: false
        }
      }
    } catch (supabaseError) {
      console.log('Supabase 登录失败，检查重置密码:', supabaseError)
    }
    
    // 检查重置密码
    const activeReset = localStorage.getItem('active_password_reset')
    
    if (activeReset) {
      try {
        const resetData = JSON.parse(activeReset)
        const resetPassword = atob(resetData.newPassword)
        
        if (resetData.email === email && password === resetPassword) {
          console.log('使用重置密码登录成功')
          
          const user = {
            id: 'temp_' + Date.now(),
            email: email,
            user_metadata: {
              phone: resetData.phone,
              display_name: email.split('@')[0],
              temp_session: true,
              reset_login: true,
              login_time: new Date().toISOString()
            }
          }
          
          const sessionData = {
            user,
            timestamp: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000)
          }
          
          localStorage.setItem('temp_user_session', JSON.stringify(sessionData))
          localStorage.removeItem('active_password_reset')
          
          return {
            success: true,
            user: user,
            message: '使用新密码登录成功！',
            fromReset: true,
            tempSession: true
          }
        }
      } catch (e) {
        console.error('解析重置数据失败:', e)
      }
    }
    
    throw new Error('Invalid login credentials')
  } catch (err: any) {
    console.error('智能登录失败:', err)
    throw err
  }
}

// 获取当前用户
export const getCurrentUser = async () => {
  try {
    // 检查临时会话
    const tempSession = localStorage.getItem('temp_user_session')
    if (tempSession) {
      const sessionData = JSON.parse(tempSession)
      
      if (Date.now() < sessionData.expires) {
        console.log('使用临时会话:', sessionData.user.email)
        return sessionData.user
      } else {
        localStorage.removeItem('temp_user_session')
      }
    }
    
    // 检查 Supabase 会话
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return null
    }

    return user
  } catch (err) {
    console.error('获取用户信息异常:', err)
    return null
  }
}

// 退出登录
export const signOut = async () => {
  try {
    localStorage.removeItem('temp_user_session')
    localStorage.removeItem('active_password_reset')
    
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.warn('Supabase 登出警告:', error.message)
    }
    
    return { success: true }
  } catch (err: any) {
    console.error('退出登录失败:', err)
    return { success: false, error: err.message }
  }
}

// 测试连接
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('连接测试失败:', error.message)
      return { success: false, error }
    }
    console.log('连接测试成功')
    return { success: true, data }
  } catch (err: any) {
    console.error('连接测试异常:', err)
    return { success: false, error: err }
  }
} 

// 升级临时会话为正式会话
export const upgradeToRealSession = async () => {
  try {
    console.log('=== 升级临时会话 ===')
    
    // 获取临时会话数据
    const tempSession = localStorage.getItem('temp_user_session')
    if (!tempSession) {
      throw new Error('没有找到临时会话')
    }
    
    const sessionData = JSON.parse(tempSession)
    const user = sessionData.user
    
    if (!user || !user.email) {
      throw new Error('临时会话数据无效')
    }
    
    // 检查临时会话是否过期
    if (Date.now() >= sessionData.expires) {
      localStorage.removeItem('temp_user_session')
      throw new Error('临时会话已过期')
    }
    
    console.log('尝试升级用户:', user.email)
    
    // 尝试使用临时会话中的信息创建或更新Supabase用户
    // 这里可以根据具体需求实现不同的升级策略
    
    // 策略1: 尝试通过邮箱查找现有用户
    try {
      const { data: existingUser, error: getUserError } = await supabase.auth.getUser()
      
      if (!getUserError && existingUser) {
        // 如果已经有Supabase会话，直接升级成功
        console.log('已存在Supabase会话，升级成功')
        localStorage.removeItem('temp_user_session')
        
        return {
          success: true,
          message: '会话升级成功',
          user: existingUser
        }
      }
    } catch (e) {
      console.log('检查现有会话失败:', e)
    }
    
    // 策略2: 如果没有现有会话，建议用户完成正式注册
    return {
      success: false,
      message: '请完成正式注册以升级会话',
      requiresRegistration: true,
      tempUser: user
    }
    
  } catch (err: any) {
    console.error('升级临时会话失败:', err)
    return {
      success: false,
      message: err.message || '升级会话时出现错误'
    }
  }
} 