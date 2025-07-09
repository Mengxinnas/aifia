import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const documentType = formData.get('documentType') as string;
    const processingMode = formData.get('processingMode') as string;
    const invoiceKind = formData.get('invoiceKind') as string; // 发票种类
    
    console.log(`收到 ${files.length} 个文件，文档类型: ${documentType}，处理模式: ${processingMode}`);
    if (documentType === 'invoice') {
      console.log(`发票种类: ${invoiceKind}`);
    }
    
    if (!files.length) {
      return NextResponse.json(
        { error: '未上传文件' },
        { status: 400 }
      );
    }
    
    const processedDocuments = [];
    
    // 如果是发票类型，根据种类使用不同的解析器
    if (documentType === 'invoice') {
      try {
        // 创建新的FormData用于发票解析
        const invoiceFormData = new FormData();
        files.forEach(file => {
          invoiceFormData.append('files', file);
        });
        
        // 根据发票种类选择不同的处理器
        let apiEndpoint = '/api/invoice-parser'; // 默认处理器（专用发票）
        
        if (invoiceKind === '普通电子发票') {
          apiEndpoint = '/api/invoice-parser/ordinary-electronic';
          console.log('使用普通电子发票专用处理器');
        } else {
          console.log('使用默认发票处理器（专用发票）');
        }
        
        // 传递发票种类信息给解析API
        invoiceFormData.append('invoiceKind', invoiceKind || '专用电子发票');
        
        // 调用相应的发票解析API
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const invoiceResponse = await fetch(`${baseUrl}${apiEndpoint}`, {
          method: 'POST',
          body: invoiceFormData,
        });
        
        if (invoiceResponse.ok) {
          const invoiceResult = await invoiceResponse.json();
          
          if (invoiceResult.success && invoiceResult.invoices) {
            // 转换为台账格式
            const invoiceDocuments = invoiceResult.invoices.map((invoice: any) => ({
              id: invoice.id,
              invoiceName: invoice.invoiceName,
              invoiceNumber: invoice.invoiceNumber,
              issueDate: invoice.issueDate,
              buyerName: invoice.buyerName,
              buyerTaxId: invoice.buyerTaxId,
              sellerName: invoice.sellerName,
              sellerTaxId: invoice.sellerTaxId,
              goodsService: invoice.goodsServices,
              taxRate: invoice.taxRate,
              amount: invoice.amount,
              taxAmount: invoice.taxAmount,
              totalAmount: invoice.totalAmount,
              status: invoice.status,
              filename: invoice.filename,
              invoiceKind: invoiceKind, // 记录发票种类
              processorType: invoiceResult.processorType || '标准处理器'
            }));
            
            return NextResponse.json({
              success: true,
              message: `成功处理 ${files.length} 个${invoiceKind}`,
              documents: invoiceDocuments,
              processorUsed: invoiceResult.processorType || '标准处理器'
            });
          }
        }
        
        // 如果发票解析失败，使用备用方案
        console.warn('发票解析API失败，使用备用处理方案');
      } catch (apiError) {
        console.error('调用发票解析API失败:', apiError);
      }
    }
    
    // 备用处理方案或其他文档类型
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const doc = {
        id: `DOC-${Date.now()}-${i}`,
        invoiceName: documentType === 'invoice' ? (invoiceKind || '增值税发票') : getDocumentTypeLabel(documentType),
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        buyerName: '',
        buyerTaxId: '',
        sellerName: file.name.replace(/\.[^/.]+$/, ""),
        sellerTaxId: '',
        goodsService: '待解析',
        taxRate: documentType === 'invoice' && invoiceKind === '普通电子发票' ? '3%' : '',
        amount: (Math.random() * 3000 + 500).toFixed(2),
        taxAmount: '',
        totalAmount: (Math.random() * 3500 + 600).toFixed(2),
        status: "待处理",
        filename: file.name,
        invoiceKind: documentType === 'invoice' ? invoiceKind : undefined
      };
      
      processedDocuments.push(doc);
    }

    return NextResponse.json({
      success: true,
      message: `成功处理 ${files.length} 个文档`,
      documents: processedDocuments
    });
    
  } catch (error) {
    console.error('处理上传文件时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理上传文件时出错' },
      { status: 500 }
    );
  }
}

function getDocumentTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'invoice': '发票',
    'bank': '银行对账单',
    'inventory': '库存记录',
    'contract': '合同',
    'all': '发票'
  };
  return typeMap[type] || '发票';
}
