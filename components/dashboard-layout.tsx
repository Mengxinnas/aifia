"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  BarChart3,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Shield,
  Upload,
  X,
  LogOut,
  Bell,
  Search,
  Users,
  User,
  Lock,
  Crown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Input } from "./ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { cn } from "../lib/utils"
import { useIsMobile } from "../hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { getCurrentUser, signOut } from "../lib/supabase"
import { useToast } from "./ui/use-toast"
import { useNoFlash } from "../hooks/use-no-flash"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const isMounted = useNoFlash()

  // 获取用户信息
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  // 防止服务端渲染和客户端渲染不一致
  if (!isMounted) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 md:px-6">
          <div className="loading-skeleton h-8 w-8 rounded-full"></div>
          <div className="loading-skeleton h-6 w-32 rounded"></div>
        </header>
        <div className="flex-1 flex">
          <aside className="hidden md:flex w-64 flex-col border-r bg-white/50">
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="loading-skeleton h-10 w-full rounded-md"></div>
              ))}
            </div>
          </aside>
          <main className="flex-1 p-6">
            <div className="loading-skeleton h-8 w-64 rounded mb-4"></div>
            <div className="loading-skeleton h-32 w-full rounded"></div>
          </main>
        </div>
      </div>
    )
  }

  // 退出登录
  const handleSignOut = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        toast({
          title: "已退出登录",
          description: "感谢使用 AiFi财小猪，期待您的再次光临！",
        })
        router.push('/login')
      } else {
        throw new Error(result.error || '退出登录失败')
      }
    } catch (error: any) {
      toast({
        title: "退出失败",
        description: error.message || "退出登录时出现错误",
        variant: "destructive"
      })
    }
  }

  // 处理需要登录的功能点击
  const handleProtectedRoute = (href: string, label: string) => {
    if (!user) {
      toast({
        title: "需要登录",
        description: `使用"${label}"功能需要先登录`,
        variant: "destructive"
      })
      router.push('/login')
      return
    }
    router.push(href)
  }

  // 获取用户显示名称
  const getUserDisplayName = () => {
    if (!user) return "用户"
    
    if (user.user_metadata?.display_name) {
      return user.user_metadata.display_name
    }
    
    if (user.email) {
      return user.email.split('@')[0]
    }
    
    return "用户"
  }

  // 获取用户头像缩写
  const getUserInitials = () => {
    const displayName = getUserDisplayName()
    if (displayName.length >= 2) {
      return displayName.slice(0, 2).toUpperCase()
    }
    return displayName.charAt(0).toUpperCase()
  }

  const routes = [
    {
      label: "会计问答",
      icon: MessageSquare,
      href: "/dashboard/accounting-qa",
      active: pathname === "/dashboard/accounting-qa",
      requireAuth: true,
    },
    {
      label: "批量台账",
      icon: FileText,
      href: "/dashboard/batch-ledger",
      active: pathname === "/dashboard/batch-ledger",
      requireAuth: true,
    },
    {
      label: "财务分析",
      icon: BarChart3,
      href: "/dashboard/financial-analysis",
      active: pathname === "/dashboard/financial-analysis",
      requireAuth: true,
    },
    {
      label: "审计与验证",
      icon: Shield,
      href: "/dashboard/audit",
      active: pathname === "/dashboard/audit",
      requireAuth: true,
    },
    {
      type: "separator",
      key: "separator-1",
    },
    {
      label: "使用量与付费",
      icon: Crown,
      href: "/dashboard/pricing",
      active: pathname === "/dashboard/pricing",
      requireAuth: true,
    },
    {
      label: "官方社群",
      icon: Users,
      href: "#",
      active: false,
      isDialog: true,
      requireAuth: false,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/80 backdrop-blur-sm px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden rounded-full">
              <Menu className="h-5 w-5" />
              <span className="sr-only">切换菜单</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[300px] bg-white">
            <SheetHeader className="p-4 pb-2">
              <SheetTitle className="text-left">
                <Link href="/" className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-lg">
                    🐷
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">
                    AiFi财小猪
                  </span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-2 py-4">
              {routes.map((route, index) => {
                if (route.type === "separator") {
                  return (
                    <div key={route.key} className="my-2">
                      <div className="border-t border-gray-200"></div>
                    </div>
                  )
                }

                if (route.isDialog) {
                  return (
                    <Dialog key={route.label}>
                      <DialogTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-colors",
                            route.active
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                              : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50",
                          )}
                        >
                          <route.icon className="h-5 w-5" />
                          {route.label}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>扫码加入官方社群</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6">
                          <div className="relative">
                            <img
                              src="/qr-code-wechat-group.jpg"
                              alt="官方社群二维码"
                              className="w-64 h-64 rounded-lg shadow-sm object-contain border"
                              onError={(e) => {
                                console.error('二维码图片加载失败');
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center shadow-sm">
                                      <div class="text-center">
                                        <p class="text-sm text-gray-500 mb-2">二维码加载失败</p>
                                        <p class="text-xs text-gray-400">请检查文件路径：public/qr-code-wechat-group.jpg</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                          <p className="mt-4 text-sm text-gray-500 text-center">
                            扫描上方二维码加入 AiFi财小猪 官方微信群<br/>
                            获取最新资讯和专业支持
                          </p>
                          <div className="mt-2 text-center">
                            <p className="text-xs text-gray-400">联系人：小星星</p>
                            <p className="text-xs text-gray-400">地区：北京 海淀</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )
                }

                return (
                  <button
                    key={route.href}
                    onClick={() => {
                      if (route.requireAuth && !user) {
                        handleProtectedRoute(route.href, route.label)
                      } else {
                        router.push(route.href)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-3 text-base font-medium transition-colors text-left",
                      route.active
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                        : route.requireAuth && !user
                        ? "text-gray-400 hover:text-gray-500"
                        : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50",
                    )}
                  >
                    <route.icon className="h-5 w-5" />
                    {route.label}
                    {route.requireAuth && !user && (
                      <Lock className="h-3 w-3 ml-auto text-gray-400" />
                    )}
                  </button>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>
        
        {/* 左上角 Logo - 点击跳转到首页 */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="h-6 w-6 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-lg">
            🐷
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent truncate">
            AiFi财小猪
          </span>
        </Link>

        <div className="flex-1">
          {isSearchOpen || !isMobile ? (
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="搜索..."
                className="w-full bg-gray-50 pl-8 rounded-full md:w-[300px] lg:w-[400px]"
              />
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 rounded-full"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">关闭搜索</span>
                </Button>
              )}
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
              <span className="sr-only">搜索</span>
            </Button>
          )}
        </div>

        <div className="flex items-center">
          {!user ? (
            // 未登录状态显示登录按钮
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-full">
                  登录
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                  注册
                </Button>
              </Link>
            </div>
          ) : (
            // 已登录状态显示用户菜单
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full ml-2">
                  <Avatar className="h-8 w-8 border-2 border-indigo-100">
                    <AvatarImage src="/placeholder.svg" alt="用户" />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white">
                      {isLoading ? "..." : getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[90vw] max-w-[280px] rounded-xl p-2">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {isLoading ? "加载中..." : getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ""}
                    </p>
                    {user?.user_metadata?.phone && (
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.user_metadata.phone}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="rounded-lg cursor-pointer"
                  onClick={() => setIsProfileOpen(true)}
                >
                  <User className="mr-2 h-4 w-4" />
                  个人资料
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="rounded-lg cursor-pointer"
                  onClick={() => router.push('/debug-user')}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  调试信息
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="rounded-lg cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-white/80 backdrop-blur-sm md:flex">
          <div className="flex-1 py-6">
            <nav className="grid items-start px-4 gap-2">
              {routes.map((route) => {
                if (route.type === "separator") {
                  return (
                    <div key={route.key} className="my-3">
                      <div className="border-t border-gray-200"></div>
                    </div>
                  )
                }

                if (route.isDialog) {
                  return (
                    <Dialog key={route.label}>
                      <DialogTrigger asChild>
                        <button
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            route.active
                              ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                              : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50",
                          )}
                        >
                          <route.icon className="h-4 w-4" />
                          {route.label}
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>扫码加入官方社群</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center p-6">
                          <div className="relative">
                            <img
                              src="/qr-code-wechat-group.jpg"
                              alt="官方社群二维码"
                              className="w-64 h-64 rounded-lg shadow-sm object-contain border"
                              onError={(e) => {
                                console.error('二维码图片加载失败');
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center shadow-sm">
                                      <div class="text-center">
                                        <p class="text-sm text-gray-500 mb-2">二维码加载失败</p>
                                        <p class="text-xs text-gray-400">请检查文件路径：public/qr-code-wechat-group.jpg</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          </div>
                          <p className="mt-4 text-sm text-gray-500 text-center">
                            扫描上方二维码加入 AiFi财小猪 官方微信群<br/>
                            获取最新资讯和专业支持
                          </p>
                          <div className="mt-2 text-center">
                            <p className="text-xs text-gray-400">联系人：小星星</p>
                            <p className="text-xs text-gray-400">地区：北京 海淀</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )
                }

                return (
                  <button
                    key={route.href}
                    onClick={() => {
                      if (route.requireAuth && !user) {
                        handleProtectedRoute(route.href, route.label)
                      } else {
                        router.push(route.href)
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                      route.active
                        ? "bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700"
                        : route.requireAuth && !user
                        ? "text-gray-400 hover:text-gray-500"
                        : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50",
                    )}
                  >
                    <route.icon className="h-4 w-4" />
                    {route.label}
                    {route.requireAuth && !user && (
                      <Lock className="h-3 w-3 ml-auto text-gray-400" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* 个人资料对话框 */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>个人资料</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Avatar className="h-20 w-20 border-4 border-indigo-100">
                <AvatarImage src="/placeholder.svg" alt="用户" />
                <AvatarFallback className="bg-gradient-to-r from-indigo-400 to-purple-400 text-white text-xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-medium">{getUserDisplayName()}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              {user?.user_metadata?.phone && (
                <p className="text-sm text-gray-500">{user.user_metadata.phone}</p>
              )}
              {user?.user_metadata?.registration_time && (
                <p className="text-xs text-gray-400">
                  注册时间：{new Date(user.user_metadata.registration_time).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsProfileOpen(false)
                  router.push('/debug-user')
                }}
              >
                查看详细信息
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
