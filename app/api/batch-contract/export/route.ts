import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
  try {
    const { documents, format = 'xlsx', documentType = '合同' } = await request.json();
    
    if (!documents || !Array.isArray(documents)) {
      throw new Error('无效的文档数据');
    }

    // 合同详细信息的表头
    const contractHeaders = [
      "合同编号", "合同名称", "合同类型", "甲方", "乙方", "交付标的/货物/内容", 
      "合同金额", "质量标准", "支付时间/期限", "履行地点", "签订日期", 
      "生效日期/有效期", "履约期限", "违约责任", "备注"
    ];

    // 发票详细信息的表头
    const invoiceHeaders = [
      "发票名称", "发票号码", "开票日期", "购买方名称", "购买方纳税人识别号",
      "销售方名称", "销售方纳税人识别号", "货物或应税劳务、服务名称", 
      "税率", "金额", "税额", "价税合计"
    ];

    const headers = documentType === '合同' ? contractHeaders : invoiceHeaders;

    if (format === 'csv') {
      const rows = documents.map(doc => {
        if (documentType === '合同') {
          return [
            doc.contractNumber || '',
            doc.contractName || '',
            doc.contractType || '',
            doc.partyA || '',
            doc.partyB || '',
            doc.deliverables || '',
            doc.contractAmount || '',
            doc.qualityStandard || '',
            doc.paymentTerms || '',
            doc.performanceLocation || '',
            doc.signDate || '',
            doc.effectiveDate || '',
            doc.performancePeriod || '',
            doc.liability || '',
            doc.remarks || ''
          ];
        } else {
          // 发票数据处理 - 修复数据映射
          return [
            doc.invoiceName || doc.name || '', // 发票名称
            doc.invoiceNumber || '', // 发票号码
            doc.date || '', // 开票日期
            doc.buyerName || '', // 购买方名称
            doc.buyerTaxId || '', // 购买方纳税人识别号
            doc.sellerName || doc.source || '', // 销售方名称
            doc.sellerTaxId || '', // 销售方纳税人识别号
            doc.goodsService || '', // 货物或应税劳务、服务名称
            doc.taxRate || '', // 税率
            doc.amount?.replace('¥', '') || '', // 金额
            doc.taxAmount || '', // 税额
            doc.totalAmount || doc.amount?.replace('¥', '') || '' // 价税合计
          ];
        }
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
      const filename = `${documentType}_details_${timestamp}.csv`;
      
      // 修复 UTF-8 编码问题：使用 TextEncoder 正确处理中文字符
      const encoder = new TextEncoder();
      const csvBuffer = encoder.encode('\uFEFF' + csvContent); // 添加 BOM 标记
      
      return new Response(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
        }
      });
    }
    
    // Excel格式导出
    const wb = XLSX.utils.book_new();
    const wsData = [headers];
    
    documents.forEach(doc => {
      if (documentType === '合同') {
        wsData.push([
          doc.contractNumber || '',
          doc.contractName || '',
          doc.contractType || '',
          doc.partyA || '',
          doc.partyB || '',
          doc.deliverables || '',
          doc.contractAmount || '',
          doc.qualityStandard || '',
          doc.paymentTerms || '',
          doc.performanceLocation || '',
          doc.signDate || '',
          doc.effectiveDate || '',
          doc.performancePeriod || '',
          doc.liability || '',
          doc.remarks || ''
        ]);
      } else {
        // 发票数据处理 - 修复数据映射
        wsData.push([
          doc.invoiceName || doc.name || '', // 发票名称
          doc.invoiceNumber || '', // 发票号码
          doc.date || '', // 开票日期
          doc.buyerName || '', // 购买方名称
          doc.buyerTaxId || '', // 购买方纳税人识别号
          doc.sellerName || doc.source || '', // 销售方名称
          doc.sellerTaxId || '', // 销售方纳税人识别号
          doc.goodsService || '', // 货物或应税劳务、服务名称
          doc.taxRate || '', // 税率
          doc.amount?.replace('¥', '') || '', // 金额
          doc.taxAmount || '', // 税额
          doc.totalAmount || doc.amount?.replace('¥', '') || '' // 价税合计
        ]);
      }
    });
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 设置列宽
    if (documentType === '合同') {
      ws['!cols'] = [
        { width: 15 }, // 合同编号
        { width: 20 }, // 合同名称
        { width: 12 }, // 合同类型
        { width: 20 }, // 甲方
        { width: 20 }, // 乙方
        { width: 25 }, // 交付标的
        { width: 15 }, // 合同金额
        { width: 15 }, // 质量标准
        { width: 15 }, // 支付时间
        { width: 15 }, // 履行地点
        { width: 12 }, // 签订日期
        { width: 12 }, // 生效日期
        { width: 12 }, // 履约期限
        { width: 20 }, // 违约责任
        { width: 20 }  // 备注
      ];
    } else {
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
    }
    
    XLSX.utils.book_append_sheet(wb, ws, documentType === '合同' ? 'Contract_Details' : 'Invoice_Details');
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${documentType}_details_${timestamp}.xlsx`;
    
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