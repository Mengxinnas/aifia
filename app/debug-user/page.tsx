"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { ArrowLeft, User, Phone, Mail, Calendar, Database, Edit2 } from "lucide-react"
import { useToast } from "../../../components/ui/use-toast"
import { debugUserMetadata, getUserWithPhone, updateUserPhone } from '../../../lib/supabase'

export default function DebugUserPage() {
  const { toast } = useToast()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    loadUserInfo()
  }, [])

  const loadUserInfo = async () => {
    setIsLoading(true)
    try {
      const user = await getUserWithPhone()
      setUserInfo(user)
      
      if (user?.phone) {
        setNewPhone(user.phone)
      }
      
      // 在控制台打印调试信息
      await debugUserMetadata()
    } catch (error) {
      console.error('加载用户信息失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载用户信息",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadUserInfo()
    toast({
      title: "刷新完成",
      description: "用户信息已刷新，请查看控制台获取详细信息",
    })
  }

  const handleUpdatePhone = async () => {
    if (!newPhone || newPhone.length < 11) {
      toast({
        title: "手机号无效",
        description: "请输入有效的手机号",
        variant: "destructive"
      })
      return
    }

    setIsUpdating(true)
    try {
      await updateUserPhone(newPhone)
      
      toast({
        title: "更新成功",
        description: "手机号已更新",
      })
      
      setShowEdit(false)
      await loadUserInfo() // 重新加载信息
    } catch (error: any) {
      toast({
        title: "更新失败",
        description: error.message || "更新手机号失败",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Link
          href="/dashboard/accounting-qa"
          className="absolute left-8 top-8 flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回功能页面
        </Link>

        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl">
                🐷
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">用户信息调试</h1>
            <p className="text-sm text-gray-500">查看和管理用户的完整信息</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">用户信息</h2>
              <div className="space-x-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                >
                  {isLoading ? "刷新中..." : "刷新"}
                </Button>
                <Button
                  onClick={() => setShowEdit(!showEdit)}
                  size="sm"
                  variant="outline"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  编辑
                </Button>
              </div>
            </div>

            {userInfo ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">用户ID</p>
                      <p className="text-xs text-gray-600 font-mono">{userInfo.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">邮箱</p>
                      <p className="text-xs text-gray-600">{userInfo.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">手机号</p>
                      {showEdit ? (
                        <div className="mt-2 space-y-2">
                          <Input
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="请输入手机号"
                            className="text-xs"
                          />
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleUpdatePhone}
                              size="sm"
                              disabled={isUpdating}
                            >
                              {isUpdating ? "更新中..." : "保存"}
                            </Button>
                            <Button
                              onClick={() => setShowEdit(false)}
                              size="sm"
                              variant="outline"
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">
                          {userInfo.phone || '未设置'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">注册时间</p>
                      <p className="text-xs text-gray-600">
                        {userInfo.created_at ? new Date(userInfo.created_at).toLocaleString('zh-CN') : '未知'}
                      </p>
                    </div>
                  </div>

                  {userInfo.profile && (
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Database className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">资料表数据</p>
                        <p className="text-xs text-green-600">
                          手机号: {userInfo.profile.phone || '未设置'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">用户元数据 (Raw JSON)</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40">
                      {JSON.stringify(userInfo.user_metadata, null, 2)}
                    </pre>
                  </div>
                </div>

                {userInfo.profile && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-2">资料表数据</h3>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <pre className="text-xs text-green-600 whitespace-pre-wrap overflow-auto max-h-40">
                        {JSON.stringify(userInfo.profile, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-2">手机号字段检查</h3>
                  <div className="space-y-2">
                    {[
                      { field: 'phone', value: userInfo.user_metadata?.phone, source: '元数据' },
                      { field: 'phone_number', value: userInfo.user_metadata?.phone_number, source: '元数据' },
                      { field: 'mobile', value: userInfo.user_metadata?.mobile, source: '元数据' },
                      { field: 'registration_phone', value: userInfo.user_metadata?.registration_phone, source: '元数据' },
                      { field: 'profile.phone', value: userInfo.profile?.phone, source: '资料表' }
                    ].map(({ field, value, source }) => (
                      <div key={field} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <span className="font-mono">{field} ({source}):</span>
                        <span className={value ? 'text-green-600 font-medium' : 'text-gray-400'}>
                          {value || '无'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {isLoading ? "加载中..." : "未找到用户信息"}
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">手机号存储说明</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>元数据存储</strong>：手机号保存在 user_metadata 中，在 Supabase 管理界面的 Raw JSON 中可见</p>
              <p>• <strong>资料表存储</strong>：如果启用了 profiles 表，手机号也会保存在专门的资料表中</p>
              <p>• <strong>管理界面限制</strong>：Supabase 的 Phone 列只显示用户表的 phone 字段，不显示元数据</p>
              <p>• <strong>多重保存</strong>：为确保数据安全，手机号会保存到多个字段中</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>调试提示：</strong> 打开浏览器开发者工具的控制台(F12)查看详细的调试信息和所有字段的检查结果。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 