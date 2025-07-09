"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        
        if (user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
          
          if (requireAuth) {
            toast({
              title: "需要登录",
              description: "请先登录后再使用此功能",
              variant: "destructive"
            })
            router.push(redirectTo)
          }
        }
      } catch (error) {
        console.error("认证检查失败:", error)
        setIsAuthenticated(false)
        
        if (requireAuth) {
          router.push(redirectTo)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requireAuth, redirectTo, router, toast])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4 animate-pulse">
            🐷
          </div>
          <div className="loading-skeleton h-4 w-32 rounded mx-auto mb-2"></div>
          <div className="loading-skeleton h-3 w-24 rounded mx-auto"></div>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return null // 将重定向到登录页面
  }

  return <>{children}</>
} 