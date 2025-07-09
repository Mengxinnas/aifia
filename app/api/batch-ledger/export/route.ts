import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const { documents, format = 'xlsx' } = await request.json();
    
    if (!documents || !Array.isArray(documents)) {
      throw new Error('无效的文档数据');
    }

    // 发票详细信息的表头
    const headers = [
      "发票名称", "发票号码", "开票日期", "购买方名称", "购买方纳税人识别号",
      "销售方名称", "销售方纳税人识别号", "货物或应税劳务、服务名称", 
      "税率", "金额", "税额", "价税合计"
    ];

    if (format === 'csv') {
      const rows = documents.map(doc => {
        const details = doc.invoiceDetails || {};
        return [
          details.invoiceName || '',
          details.invoiceNumber || '',
          details.issueDate || doc.date || '',
          details.buyerName || '',
          details.buyerTaxId || '',
          details.sellerName || doc.source || '',
          details.sellerTaxId || '',
          details.goodsService || '',
          details.taxRate || '',
          details.amount || '',
          details.taxAmount || '',
          details.totalAmount || doc.amount?.replace('¥', '') || ''
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => 
            cell.toString().includes(',') ? `"${cell.replace(/"/g, '""')}"` : cell
          ).join(',')
        )
      ].join('\n');
      
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `invoice_details_${timestamp}.csv`;
      
      // 使用 Buffer 来正确处理 UTF-8 编码的中文字符
      const csvBuffer = Buffer.from(csvContent, 'utf8');
      
      return new Response(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }
    
    // Excel格式导出
    const wb = XLSX.utils.book_new();
    const wsData = [headers];
    
    documents.forEach(doc => {
      const details = doc.invoiceDetails || {};
      wsData.push([
        details.invoiceName || '',
        details.invoiceNumber || '',
        details.issueDate || doc.date || '',
        details.buyerName || '',
        details.buyerTaxId || '',
        details.sellerName || doc.source || '',
        details.sellerTaxId || '',
        details.goodsService || '',
        details.taxRate || '',
        details.amount || '',
        details.taxAmount || '',
        details.totalAmount || doc.amount?.replace('¥', '') || ''
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    ws['!cols'] = [
      { width: 15 }, // 发票名称
      { width: 15 }, // 发票号码
      { width: 12 }, // 开票日期
      { width: 25 }, // 购买方名称
      { width: 20 }, // 购买方纳税人识别号
      { width: 25 }, // 销售方名称
      { width: 20 }, // 销售方纳税人识别号
      { width: 30 }, // 货物或应税劳务、服务名称
      { width: 10 }, // 税率
      { width: 15 }, // 金额
      { width: 15 }, // 税额
      { width: 15 }  // 价税合计
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice_Details');
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `invoice_details_${timestamp}.xlsx`;
    
    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error('导出处理错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导出处理时出错' },
      { status: 500 }
    );
  }
} 