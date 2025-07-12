"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { supabase } from '../../lib/supabase'

export default function TestDBPage() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testConnection = async () => {
    setIsLoading(true)
    const results = {
      supabaseConfig: {
        url: 'https://debppatbaattcaqdrvtm.supabase.co',
        hasKey: true,
        clientConfig: !!supabase
      },
      tables: {},
      functions: {},
      connection: false,
      auth: {}
    }

    try {
      // 测试认证状态
      const { data: authData, error: authError } = await supabase.auth.getUser()
      results.auth = {
        isAuthenticated: !!authData.user,
        user: authData.user?.email,
        error: authError?.message
      }
      results.connection = !authError

      // 测试各个表 - 使用正确的语法
      const tables = [
        { name: 'user_credits', testField: 'id' },
        { name: 'redemption_codes', testField: 'id' },
        { name: 'usage_records', testField: 'id' },
        { name: 'redemption_history', testField: 'id' }
      ]
      
      for (const table of tables) {
        try {
          // 使用 select 查询而不是 count
          const { data, error } = await supabase
            .from(table.name)
            .select(table.testField)
            .limit(1)
          
          results.tables[table.name] = {
            exists: !error,
            error: error?.message,
            accessible: !!data
          }
        } catch (err: any) {
          results.tables[table.name] = {
            exists: false,
            error: err.message,
            accessible: false
          }
        }
      }

      // 测试用户积分表的具体操作
      if (authData.user) {
        try {
          const { data: userCredits, error: creditsError } = await supabase
            .from('user_credits')
            .select('*')
            .eq('user_id', authData.user.id)
            .single()
          
          results.userCreditsTest = {
            hasRecord: !!userCredits,
            data: userCredits,
            error: creditsError?.message
          }
        } catch (err: any) {
          results.userCreditsTest = {
            hasRecord: false,
            error: err.message
          }
        }
      }

      // 测试函数
      try {
        const { data, error } = await supabase.rpc('redeem_code_transaction', {
          code_text: 'NONEXISTENT_CODE',
          user_uuid: authData.user?.id || '00000000-0000-0000-0000-000000000000'
        })
        results.functions.redeem_code_transaction = {
          exists: !error?.message?.includes('function') && !error?.message?.includes('does not exist'),
          error: error?.message,
          response: data
        }
      } catch (err: any) {
        results.functions.redeem_code_transaction = {
          exists: false,
          error: err.message
        }
      }

      try {
        const { data, error } = await supabase.rpc('consume_usage', {
          user_uuid: authData.user?.id || '00000000-0000-0000-0000-000000000000',
          feature_name: 'test'
        })
        results.functions.consume_usage = {
          exists: !error?.message?.includes('function') && !error?.message?.includes('does not exist'),
          error: error?.message,
          response: data
        }
      } catch (err: any) {
        results.functions.consume_usage = {
          exists: false,
          error: err.message
        }
      }

      // 测试查看兑换码
      try {
        const { data: codes, error: codesError } = await supabase
          .from('redemption_codes')
          .select('*')
          .limit(5)
        
        results.testCodes = {
          count: codes?.length || 0,
          codes: codes?.map(c => ({ code: c.code, type: c.package_type, used: c.is_used })) || [],
          error: codesError?.message
        }
      } catch (err: any) {
        results.testCodes = {
          count: 0,
          error: err.message
        }
      }

      setTestResult(results)
    } catch (error: any) {
      setTestResult({ error: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">数据库连接测试 v2</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Supabase 连接测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? '测试中...' : '开始测试'}
          </Button>
          
          {testResult && (
            <div className="space-y-4">
              {/* 配置检查 */}
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">配置检查</h3>
                <div className="text-sm space-y-1">
                  <div>URL: {testResult.supabaseConfig?.url}</div>
                  <div>Client: {testResult.supabaseConfig?.clientConfig ? '✅ 已初始化' : '❌ 未初始化'}</div>
                  <div>连接状态: {testResult.connection ? '✅ 正常' : '❌ 失败'}</div>
                </div>
              </div>

              {/* 认证状态 */}
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">认证状态</h3>
                <div className="text-sm space-y-1">
                  <div>登录状态: {testResult.auth?.isAuthenticated ? '✅ 已登录' : '❌ 未登录'}</div>
                  <div>用户: {testResult.auth?.user || '无'}</div>
                  {testResult.auth?.error && <div className="text-red-600">错误: {testResult.auth.error}</div>}
                </div>
              </div>

              {/* 表检查 */}
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">数据库表检查</h3>
                <div className="text-sm space-y-1">
                  {Object.entries(testResult.tables || {}).map(([table, status]: [string, any]) => (
                    <div key={table} className="flex justify-between">
                      <span>{table}:</span>
                      <span className={status.exists ? 'text-green-600' : 'text-red-600'}>
                        {status.exists ? '✅ 存在且可访问' : '❌ 无法访问'}
                        {status.error && ` (${status.error})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 用户积分测试 */}
              {testResult.userCreditsTest && (
                <div className="p-3 bg-gray-50 rounded">
                  <h3 className="font-medium mb-2">用户积分表测试</h3>
                  <div className="text-sm space-y-1">
                    <div>用户记录: {testResult.userCreditsTest.hasRecord ? '✅ 存在' : '❌ 不存在'}</div>
                    {testResult.userCreditsTest.data && (
                      <div className="ml-4">
                        <div>剩余使用次数: {testResult.userCreditsTest.data.remaining_uses}</div>
                        <div>免费次数已用: {testResult.userCreditsTest.data.free_uses_consumed}</div>
                        <div>累计购买: {testResult.userCreditsTest.data.total_purchased}</div>
                      </div>
                    )}
                    {testResult.userCreditsTest.error && (
                      <div className="text-orange-600">提示: {testResult.userCreditsTest.error}</div>
                    )}
                  </div>
                </div>
              )}

              {/* 函数检查 */}
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">数据库函数检查</h3>
                <div className="text-sm space-y-1">
                  {Object.entries(testResult.functions || {}).map(([func, status]: [string, any]) => (
                    <div key={func} className="flex justify-between">
                      <span>{func}:</span>
                      <span className={status.exists ? 'text-green-600' : 'text-red-600'}>
                        {status.exists ? '✅ 存在' : '❌ 不存在'}
                        {status.error && ` (${status.error})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 测试数据 */}
              {testResult.testCodes && (
                <div className="p-3 bg-green-50 rounded">
                  <h3 className="font-medium mb-2">测试兑换码 ✅</h3>
                  <div className="text-sm space-y-1">
                    <div>兑换码数量: {testResult.testCodes.count}</div>
                    {testResult.testCodes.codes?.map((code: any, index: number) => (
                      <div key={index} className="ml-4 font-mono">
                        {code.code} - {code.type} - {code.used ? '已使用' : '可用'}
                      </div>
                    ))}
                    {testResult.testCodes.error && (
                      <div className="text-red-600">错误: {testResult.testCodes.error}</div>
                    )}
                  </div>
                </div>
              )}

              {/* 详细错误信息 */}
              {testResult.error && (
                <div className="p-3 bg-red-50 text-red-800 rounded">
                  <h3 className="font-medium mb-2">错误信息</h3>
                  <pre className="text-xs">{testResult.error}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 