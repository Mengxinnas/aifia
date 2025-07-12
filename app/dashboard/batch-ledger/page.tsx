"use client"

import type React from "react"

import { useState, useRef } from "react"
import { DashboardLayout } from "../../../components/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  FileText,
  Upload,
  Download,
  Filter,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileIcon as FilePdf,
  FileJson,
  Database,
  FileArchive,
  FileBarChart,
} from "lucide-react"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { useToast } from "../../../components/ui/use-toast"
import { AuthGuard } from "../../../components/auth-guard"
import { checkAndConsumeUsage } from "../../../lib/usage-check-service"

// 合同要素类型定义
interface ContractElement {
  id: string
  contractNumber: string
  contractName: string
  contractType: string
  signDate: string
  effectiveDate: string
  expiryDate: string
  partyA: string
  partyB: string
  deliverables: string
  contractAmount: string
  qualityStandard: string
  paymentTerms: string
  performanceLocation: string
  performancePeriod: string
  executionStatus: string
  liability: string
  remarks: string
  status: string
  type: string
}

function BatchLedgerPage() {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [documentType, setDocumentType] = useState("invoice")
  const [processingMode, setProcessingMode] = useState("专用电子发票")
  const [selectedDocumentType, setSelectedDocumentType] = useState("发票") // 用于台账表格显示
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [documents, setDocuments] = useState<any[]>([])

  // 添加使用权限检查函数
  const checkUsagePermission = async (featureType: string): Promise<boolean> => {
    try {
      console.log('=== 批量台账页面 - 检查使用权限 ===')
      console.log('功能类型:', featureType)
      console.log('当前时间:', new Date().toLocaleString())
      
      const result = await checkAndConsumeUsage(featureType)
      console.log('检查结果:', result)
      
      if (!result.canUse) {
        toast({
          title: result.needsUpgrade ? "需要升级" : "使用次数不足",
          description: result.message,
          variant: "destructive",
          duration: 8000,
          action: result.message.includes('15001314535') ? 
            <Button 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText('15001314535')
                toast({
                  title: "联系方式已复制",
                  description: "15001314535",
                  duration: 3000
                })
              }}
            >
              联系购买
            </Button> : undefined
        })
      }
      
      return result.canUse
    } catch (error) {
      console.error('使用权限检查失败:', error)
      toast({
        title: "检查权限时发生错误",
        description: "请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== 批量台账 - 开始文件上传流程 ===')
    
    // 添加使用权限检查 
    const featureType = documentType === 'contract' ? 'batch-contract' : 'batch-ledger'
    const canProceed = await checkUsagePermission(featureType)
    if (!canProceed) {
      // 清空文件选择
      if (e.target) {
        e.target.value = ''
      }
      return // 阻止继续执行
    }

    if (!e.target.files?.length) return

    setIsUploading(true)
    
    try {
      const files = Array.from(e.target.files)
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('documentType', documentType)
      formData.append('processingMode', processingMode)
      
      if (documentType === 'invoice') {
        console.log(`前端传递发票种类: ${processingMode}`);
        formData.append('invoiceKind', processingMode)
      } else if (documentType === 'contract') {
        formData.append('category', processingMode)
      }
      
      // 根据文档类型选择不同的API端点
      const apiEndpoint = documentType === 'contract' 
        ? '/api/batch-contract/upload'
        : '/api/batch-ledger/upload'
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '上传文件处理失败')
      }
      
      const result = await response.json()
      console.log('上传结果:', result)
      
      // 处理合同数据
      if (documentType === 'contract' && result.contracts) {
        const processedDocs = result.contracts.map((contract: any, index: number) => ({
          id: contract.id || `CONTRACT-${Date.now()}-${index}`,
          type: "合同",
          contractNumber: contract.contractNumber || contract.合同编号 || `HT${Date.now()}${index}`,
          contractName: contract.contractName || contract.合同名称 || '未知合同',
          contractType: contract.contractType || contract.合同类型 || '未分类',
          signDate: contract.signDate || contract.签订日期 || new Date().toISOString().split('T')[0],
          effectiveDate: contract.effectiveDate || contract.生效日期 || '',
          expiryDate: contract.expiryDate || contract.失效期限 || '',
          partyA: contract.partyA || contract.甲方 || '',
          partyB: contract.partyB || contract.乙方 || '',
          deliverables: contract.deliverables || contract.交付标的 || contract.货物内容 || '',
          contractAmount: contract.contractAmount || contract.合同金额 || '',
          qualityStandard: contract.qualityStandard || contract.质量标准 || '',
          paymentTerms: contract.paymentTerms || contract.支付时间 || contract.支付期限 || '',
          performanceLocation: contract.performanceLocation || contract.履行地点 || '',
          performancePeriod: contract.performancePeriod || contract.履约期限 || '',
          executionStatus: contract.executionStatus || contract.生效日期 || '',
          liability: contract.liability || contract.违约责任 || '',
          remarks: contract.remarks || contract.备注 || '',
          status: '已处理',
          // 兼容原有发票字段，避免显示错误
          amount: contract.contractAmount || ''
        }));
        
        setDocuments(prev => [...processedDocs, ...prev])
        
        toast({
          title: "合同处理成功",
          description: `${files.length} 个合同文档已处理并添加到台账。`,
        })
      }
      // 处理发票等其他类型数据
      else if (result.documents && result.documents.length > 0) {
        const processedDocs = result.documents.map((doc: any, index: number) => ({
          id: doc.id || `DOC-${Date.now()}-${index}`,
          type: "发票",
          invoiceName: doc.invoiceName || '增值税发票',
          invoiceNumber: doc.invoiceNumber || `${Date.now()}${index}`,
          issueDate: doc.issueDate || new Date().toISOString().split('T')[0],
          buyerName: doc.buyerName || '',
          buyerTaxId: doc.buyerTaxId || '',
          sellerName: doc.sellerName || '',
          sellerTaxId: doc.sellerTaxId || '',
          goodsServices: doc.goodsService || doc.goodsServices || '',
          taxRate: doc.taxRate || '',
          amount: doc.amount || '',
          taxAmount: doc.taxAmount || '',
          totalAmount: doc.totalAmount || '',
          status: doc.status || '已处理',
        }));
        
        setDocuments(prev => [...processedDocs, ...prev])
        
        toast({
          title: "文档处理成功",
          description: `${files.length} 个文档已处理并添加到台账。`,
        })
      }
      
      setActiveTab("processed")
      
      if (formRef.current) {
        formRef.current.reset()
      }
    } catch (error) {
      console.error('上传处理出错:', error)
      toast({
        title: "处理失败",
        description: error instanceof Error ? error.message : "文档处理失败，请重试。",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleExport = async (format: string) => {
    if (documents.length === 0) {
      toast({
        title: "无可导出数据",
        description: "台账中没有可导出的文档。",
        variant: "destructive",
      })
      return
    }
    
    // 过滤对应类型的文档
    const filteredDocs = selectedDocumentType === "合同" 
      ? documents.filter(doc => doc.type === "合同")
      : documents.filter(doc => doc.type === "发票" || !doc.type)
    
    if (filteredDocs.length === 0) {
      toast({
        title: "无可导出数据",
        description: `当前没有${selectedDocumentType}类型的文档。`,
        variant: "destructive",
      })
      return
    }
    
    try {
      const response = await fetch('/api/batch-contract/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents: filteredDocs,
          format: format.toLowerCase(),
          documentType: selectedDocumentType
        })
      });
      
      if (!response.ok) {
        throw new Error(`导出失败: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const extension = format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase();
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.download = `${selectedDocumentType}台账_${timestamp}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "导出完成",
        description: `您的${selectedDocumentType}台账已导出为 ${format}。`,
      })
    } catch (error) {
      console.error('导出错误:', error);
      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出失败，请重试",
        variant: "destructive",
      });
    }
  }

  const getKindOptions = () => {
    if (documentType === "invoice") {
      return [
        { value: "专用电子发票", label: "专用电子发票" },
        { value: "普通电子发票", label: "普通电子发票" },
      ]
    } else if (documentType === "contract") {
      return [
        { value: "暂不分类", label: "暂不分类" },
      ]
    }
    return [
      { value: "auto", label: "自动" },
      { value: "manual", label: "人工审核" },
      { value: "batch", label: "批量处理" },
    ]
  }

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value)
    if (value === "invoice") {
      setProcessingMode("专用电子发票")
    } else if (value === "contract") {
      setProcessingMode("暂不分类")
    } else {
      setProcessingMode("auto")
    }
  }

  // 添加一个函数来获取支持的格式文本
  const getSupportedFormats = () => {
    if (documentType === "contract") {
      return "支持的格式：DOCX"
    } else if (documentType === "invoice") {
      return "支持的格式：PDF（不支持图片版PDF）"
    } else {
      return "支持的格式：PDF（不支持图片版PDF）"
    }
  }

  // 添加一个函数来获取文件accept属性
  const getFileAccept = () => {
    if (documentType === "contract") {
      return ".docx"
    } else if (documentType === "invoice") {
      return ".pdf"
    } else {
      return ".pdf"
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
            批量台账
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 rounded-lg bg-indigo-100/50">
            <TabsTrigger
              value="upload"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <Upload className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">上传</span>
            </TabsTrigger>
            <TabsTrigger
              value="processed"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <CheckCircle className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">已处理</span>
            </TabsTrigger>
            <TabsTrigger
              value="ledger"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <FileText className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">台账</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>上传文档</CardTitle>
                <CardDescription>上传各类文档以自动处理并添加到您的台账</CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={formRef}>
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-200 p-10 bg-gradient-to-br from-white to-indigo-50/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <Upload className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium">拖放您的文件</h3>
                      <p className="text-sm text-gray-500">{getSupportedFormats()}</p>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="document-upload" className="cursor-pointer">
                        <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 px-4 py-2 text-sm font-medium text-white">
                          <Upload className="mr-2 h-4 w-4" />
                          浏览文件
                        </div>
                        <Input
                          id="document-upload"
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept={getFileAccept()}
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </Label>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="mb-4 text-lg font-medium">文档类型</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="document-type">文档类型</Label>
                        <Select 
                          value={documentType}
                          onValueChange={handleDocumentTypeChange}
                        >
                          <SelectTrigger id="document-type" className="rounded-lg border-indigo-200">
                            <SelectValue placeholder="选择类型" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="all">所有类型</SelectItem>
                            <SelectItem value="invoice">发票</SelectItem>
                            <SelectItem value="bank">银行对账单</SelectItem>
                            <SelectItem value="inventory">库存记录</SelectItem>
                            <SelectItem value="contract">合同</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="processing-mode">种类</Label>
                        <Select 
                          value={processingMode}
                          onValueChange={setProcessingMode}
                        >
                          <SelectTrigger id="processing-mode" className="rounded-lg border-indigo-200">
                            <SelectValue placeholder="选择种类" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {getKindOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => formRef.current?.reset()}
                >
                  取消
                </Button>
                <Button
                  disabled={isUploading}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? "处理中..." : "处理文档"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="processed" className="mt-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>已处理文档</CardTitle>
                <CardDescription>查看和管理您最近处理的文档</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input type="search" placeholder="搜索文档..." className="pl-8 rounded-full border-indigo-200" />
                  </div>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">筛选</span>
                  </Button>
                </div>

                <div className="rounded-lg border border-indigo-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-indigo-50/50">
                        <TableRow>
                          <TableHead className="whitespace-nowrap">文档名称</TableHead>
                          <TableHead className="whitespace-nowrap">文档编号</TableHead>
                          <TableHead className="whitespace-nowrap">处理日期</TableHead>
                          <TableHead className="whitespace-nowrap">类型</TableHead>
                          <TableHead className="whitespace-nowrap">状态</TableHead>
                          <TableHead className="text-right whitespace-nowrap">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.length > 0 ? (
                          documents.map((doc, index) => (
                            <TableRow key={`${doc.id}-${index}`} className="hover:bg-indigo-50/30">
                              <TableCell className="font-medium whitespace-nowrap">
                                {doc.type === "合同" ? doc.contractName : doc.invoiceName}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {doc.type === "合同" ? doc.contractNumber : doc.invoiceNumber}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {doc.type === "合同" ? doc.signDate : doc.issueDate}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{doc.type || "发票"}</TableCell>
                              <TableCell className="whitespace-nowrap">{doc.status}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 md:h-8 p-0 rounded-full hover:bg-indigo-100"
                                >
                                  <span className="sr-only">查看</span>
                                  <Search className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                              暂无数据，请先上传文档
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-gray-500">显示 {documents.length} 个文档</div>
                <Button 
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  onClick={() => setActiveTab("ledger")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  添加到台账
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="ledger" className="mt-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>文档台账</CardTitle>
                <CardDescription>查看和导出您的完整文档台账</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                </div>

                <div className="grid gap-6 md:grid-cols-4 mb-6">
                  <Card 
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedDocumentType("发票")}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">发票</CardTitle>
                        <FilePdf className="h-4 w-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {documents.filter(doc => doc.type === "发票" || !doc.type).length}
                      </div>
                      <p className="text-xs text-gray-500">
                        共计 {documents
                          .filter(doc => doc.type === "发票" || !doc.type)
                          .reduce((sum, doc) => {
                            const amount = parseFloat(
                              (doc.totalAmount || doc.amount || '0')
                                .toString()
                                .replace(/[¥,，]/g, '')
                            ) || 0;
                            return sum + amount;
                          }, 0)
                          .toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">银行对账单</CardTitle>
                        <Database className="h-4 w-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {documents.filter(doc => doc.type === "银行对账单").length}
                      </div>
                      <p className="text-xs text-gray-500">
                        共计 {documents
                          .filter(doc => doc.type === "银行对账单")
                          .reduce((sum, doc) => {
                            const amount = parseFloat(
                              (doc.amount || '0')
                                .toString()
                                .replace(/[¥,，]/g, '')
                            ) || 0;
                            return sum + amount;
                          }, 0)
                          .toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">库存记录</CardTitle>
                        <FileArchive className="h-4 w-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {documents.filter(doc => doc.type === "库存记录").length}
                      </div>
                      <p className="text-xs text-gray-500">
                        共计 {documents
                          .filter(doc => doc.type === "库存记录")
                          .reduce((sum, doc) => {
                            const amount = parseFloat(
                              (doc.amount || '0')
                                .toString()
                                .replace(/[¥,，]/g, '')
                            ) || 0;
                            return sum + amount;
                          }, 0)
                          .toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 cursor-pointer hover:shadow-md transition-all"
                    onClick={() => setSelectedDocumentType("合同")}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">合同</CardTitle>
                        <FileBarChart className="h-4 w-4 text-indigo-600" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="text-2xl font-bold">
                        {documents.filter(doc => doc.type === "合同").length}
                      </div>
                      <p className="text-xs text-gray-500">
                        共计 {documents
                          .filter(doc => doc.type === "合同")
                          .reduce((sum, doc) => {
                            const amount = parseFloat(
                              (doc.contractAmount || doc.amount || '0')
                                .toString()
                                .replace(/[¥,，]/g, '')
                            ) || 0;
                            return sum + amount;
                          }, 0)
                          .toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' })}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-lg border border-indigo-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-indigo-50/50">
                        {selectedDocumentType === "合同" ? (
                          <TableRow>
                            <TableHead className="whitespace-nowrap">合同编号</TableHead>
                            <TableHead className="whitespace-nowrap">合同名称</TableHead>
                            <TableHead className="whitespace-nowrap">合同类型</TableHead>
                            <TableHead className="whitespace-nowrap">甲方</TableHead>
                            <TableHead className="whitespace-nowrap">乙方</TableHead>
                            <TableHead className="whitespace-nowrap">交付标的/货物/内容</TableHead>
                            <TableHead className="whitespace-nowrap">合同金额</TableHead>
                            <TableHead className="whitespace-nowrap">质量标准</TableHead>
                            <TableHead className="whitespace-nowrap">支付时间/期限</TableHead>
                            <TableHead className="whitespace-nowrap">履行地点</TableHead>
                            <TableHead className="whitespace-nowrap">签订日期</TableHead>
                            <TableHead className="whitespace-nowrap">生效日期/有效期</TableHead>
                            <TableHead className="whitespace-nowrap">履约期限</TableHead>
                            <TableHead className="whitespace-nowrap">违约责任</TableHead>
                            <TableHead className="whitespace-nowrap">备注</TableHead>
                          </TableRow>
                        ) : (
                          <TableRow>
                            <TableHead>发票名称</TableHead>
                            <TableHead>发票号码</TableHead>
                            <TableHead>开票日期</TableHead>
                            <TableHead>购买方名称</TableHead>
                            <TableHead>购买方纳税人识别号</TableHead>
                            <TableHead>销售方名称</TableHead>
                            <TableHead>销售方纳税人识别号</TableHead>
                            <TableHead>货物或应税劳务、服务名称</TableHead>
                            <TableHead>税率</TableHead>
                            <TableHead>金额</TableHead>
                            <TableHead>税额</TableHead>
                            <TableHead>价税合计</TableHead>
                          </TableRow>
                        )}
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const filteredDocs = selectedDocumentType === "发票" 
                            ? documents.filter(doc => doc.type === "发票" || !doc.type)
                            : documents.filter(doc => doc.type === selectedDocumentType)
                          
                          if (filteredDocs.length === 0) {
                            const colSpan = selectedDocumentType === "合同" ? 15 : 13
                            return (
                              <TableRow>
                                <TableCell colSpan={colSpan} className="text-center py-4 text-gray-500">
                                  暂无数据，请先上传文档
                                </TableCell>
                              </TableRow>
                            )
                          }

                          if (selectedDocumentType === "合同") {
                            return filteredDocs.map((doc, index) => (
                              <TableRow key={`${doc.id}-${index}`} className="hover:bg-indigo-50/30">
                                <TableCell className="font-medium">{doc.contractNumber}</TableCell>
                                <TableCell>{doc.contractName}</TableCell>
                                <TableCell>{doc.contractType}</TableCell>
                                <TableCell>{doc.partyA}</TableCell>
                                <TableCell>{doc.partyB}</TableCell>
                                <TableCell>{doc.deliverables}</TableCell>
                                <TableCell>{doc.contractAmount ? `¥${doc.contractAmount}` : ''}</TableCell>
                                <TableCell>{doc.qualityStandard}</TableCell>
                                <TableCell>{doc.paymentTerms}</TableCell>
                                <TableCell>{doc.performanceLocation}</TableCell>
                                <TableCell>{doc.signDate}</TableCell>
                                <TableCell>{doc.effectiveDate}</TableCell>
                                <TableCell>{doc.performancePeriod}</TableCell>
                                <TableCell>{doc.liability}</TableCell>
                                <TableCell>{doc.remarks}</TableCell>
                              </TableRow>
                            ))
                          }
                          
                          // 默认发票行
                          return filteredDocs.map((doc, index) => (
                            <TableRow key={`ledger-${doc.id}-${index}`} className="hover:bg-indigo-50/30">
                              <TableCell className="font-medium">{doc.invoiceName}</TableCell>
                              <TableCell>{doc.invoiceNumber}</TableCell>
                              <TableCell>{doc.issueDate}</TableCell>
                              <TableCell>{doc.buyerName}</TableCell>
                              <TableCell>{doc.buyerTaxId}</TableCell>
                              <TableCell>{doc.sellerName}</TableCell>
                              <TableCell>{doc.sellerTaxId}</TableCell>
                              <TableCell>{doc.goodsServices}</TableCell>
                              <TableCell>{doc.taxRate}</TableCell>
                              <TableCell>{doc.amount ? `¥${doc.amount}` : ''}</TableCell>
                              <TableCell>{doc.taxAmount ? `¥${doc.taxAmount}` : ''}</TableCell>
                              <TableCell>{doc.totalAmount ? `¥${doc.totalAmount}` : ''}</TableCell>
                            </TableRow>
                          ))
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-gray-500">显示 {documents.length} 个文档</div>
                <Button 
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                  onClick={() => handleExport("CSV")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出全部
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

export default function ProtectedBatchLedgerPage() {
  return (
    <AuthGuard requireAuth={true}>
      <BatchLedgerPage />
    </AuthGuard>
  )
}
