"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Copy, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// 套餐配置
const PACKAGES = {
  '5_times': { 
    name: '5次使用包', 
    price: 16.6, 
    uses: 5 
  },
  '10_times': { 
    name: '10次使用包', 
    price: 29.9, 
    uses: 10 
  }
} as const

type PackageType = keyof typeof PACKAGES

interface RedemptionCode {
  id: string
  code: string
  package_type: string
  uses: number
  price: number
  is_used: boolean
  used_by: string
  used_at: string
  expires_at: string
  created_at: string
  notes: string
}

// 生成兑换码函数
function generateRedemptionCode(): string {
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

export default function AdminRedemptionCodesPage() {
  const { toast } = useToast()
  const [codes, setCodes] = useState<RedemptionCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUsedCodes, setShowUsedCodes] = useState(false)
  
  // 生成表单状态
  const [packageType, setPackageType] = useState<PackageType>('10_times')
  const [quantity, setQuantity] = useState(1)
  const [expiryDays, setExpiryDays] = useState<string>('')

  useEffect(() => {
    loadCodes()
  }, [showUsedCodes])

  const loadCodes = async () => {
    try {
      let query = supabase
        .from('redemption_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!showUsedCodes) {
        query = query.eq('is_used', false)
      }

      const { data, error } = await query

      if (error) throw error
      setCodes(data || [])
    } catch (error) {
      console.error('加载兑换码失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载兑换码列表",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (quantity < 1 || quantity > 50) {
      toast({
        title: "数量错误",
        description: "一次生成数量应在1-50之间",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const codes: string[] = []
      const packageInfo = PACKAGES[packageType]
      const expiresAt = expiryDays ? 
        new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000) : null

      // 生成唯一兑换码
      for (let i = 0; i < quantity; i++) {
        let code: string
        let isUnique = false
        
        while (!isUnique) {
          code = generateRedemptionCode()
          
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

      toast({
        title: "生成成功",
        description: `已生成 ${quantity} 个兑换码`,
      })
      
      loadCodes()
      setQuantity(1)
      setExpiryDays('')
      
      // 显示生成的兑换码
      const codesList = codes.join('\n')
      navigator.clipboard.writeText(codesList)
      toast({
        title: "兑换码已复制",
        description: "新生成的兑换码已复制到剪贴板",
      })
      
    } catch (error) {
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已复制",
      description: "兑换码已复制到剪贴板",
    })
  }

  const getStatusBadge = (code: RedemptionCode) => {
    if (code.is_used) {
      return <Badge variant="secondary">已使用</Badge>
    }
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge variant="destructive">已过期</Badge>
    }
    return <Badge variant="default" className="bg-green-600">可用</Badge>
  }

  const formatCode = (code: string) => {
    return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">兑换码管理</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowUsedCodes(!showUsedCodes)} 
            variant="outline" 
            size="sm"
          >
            {showUsedCodes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showUsedCodes ? '隐藏已用' : '显示已用'}
          </Button>
          <Button onClick={loadCodes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 生成兑换码 */}
      <Card>
        <CardHeader>
          <CardTitle>生成新的兑换码</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>套餐类型</Label>
              <Select value={packageType} onValueChange={(value: PackageType) => setPackageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5_times">5次使用包 (¥16.6)</SelectItem>
                  <SelectItem value="10_times">10次使用包 (¥29.9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>生成数量</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>有效期（天）</Label>
              <Input
                type="number"
                placeholder="留空为永久"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isGenerating ? '生成中...' : '生成'}
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-700">
              <div className="font-medium mb-1">使用说明：</div>
              <div>• 兑换码格式：XXXX-XXXX-XXXX（4字母-4数字-4字母）</div>
              <div>• 生成后兑换码会自动复制到剪贴板</div>
              <div>• 建议提前生成一些兑换码备用</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 兑换码统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {codes.filter(c => !c.is_used && (!c.expires_at || new Date(c.expires_at) > new Date())).length}
            </div>
            <div className="text-sm text-gray-600">可用兑换码</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {codes.filter(c => c.is_used).length}
            </div>
            <div className="text-sm text-gray-600">已使用</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {codes.filter(c => c.expires_at && new Date(c.expires_at) < new Date() && !c.is_used).length}
            </div>
            <div className="text-sm text-gray-600">已过期</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              ¥{codes.filter(c => c.is_used).reduce((sum, c) => sum + c.price, 0).toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">总收入</div>
          </CardContent>
        </Card>
      </div>

      {/* 兑换码列表 */}
      <Card>
        <CardHeader>
          <CardTitle>兑换码列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>兑换码</TableHead>
                    <TableHead>套餐</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>使用次数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>使用时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-medium">
                        {formatCode(code.code)}
                      </TableCell>
                      <TableCell>
                        {PACKAGES[code.package_type as PackageType]?.name || code.package_type}
                      </TableCell>
                      <TableCell>¥{code.price}</TableCell>
                      <TableCell>{code.uses}</TableCell>
                      <TableCell>{getStatusBadge(code)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(code.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '永久'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(formatCode(code.code))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 