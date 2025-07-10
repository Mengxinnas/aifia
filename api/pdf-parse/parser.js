const pdfParse = require('pdf-parse');
const pdf2json = require('pdf2json');
const fs = require('fs');

class AdvancedPDFParser {
  /**
   * 使用 pdf-parse 解析（适合文本密集型PDF）
   */
  async parseWithPdfParse(buffer) {
    try {
      const data = await pdfParse(buffer, {
        version: false,
        max: 0,
        normalizeWhitespace: false,
      });
      
      return {
        success: true,
        method: 'pdf-parse',
        text: data.text,
        pages: data.numpages,
        info: data.info,
        metadata: data.metadata
      };
    } catch (error) {
      throw new Error(`pdf-parse 解析失败: ${error.message}`);
    }
  }

  /**
   * 使用 pdf2json 解析（适合结构化PDF，如发票）
   */
  async parseWithPdf2json(buffer) {
    return new Promise((resolve, reject) => {
      const pdfParser = new pdf2json();
      
      pdfParser.on('pdfParser_dataError', (error) => {
        reject(new Error(`pdf2json 解析失败: ${error.message}`));
      });
      
      pdfParser.on('pdfParser_dataReady', (data) => {
        try {
          // 提取文本和位置信息
          const result = this.extractFromPdf2json(data);
          resolve({
            success: true,
            method: 'pdf2json',
            ...result
          });
        } catch (error) {
          reject(new Error(`pdf2json 数据处理失败: ${error.message}`));
        }
      });
      
      pdfParser.parseBuffer(buffer);
    });
  }

  /**
   * 从 pdf2json 数据中提取信息
   */
  extractFromPdf2json(data) {
    let text = '';
    const structuredData = {
      pages: [],
      forms: [],
      tables: []
    };

    if (data.Pages && data.Pages.length > 0) {
      data.Pages.forEach((page, pageIndex) => {
        const pageTexts = [];
        const pageData = {
          pageNumber: pageIndex + 1,
          texts: [],
          width: page.Width,
          height: page.Height
        };

        if (page.Texts) {
          page.Texts.forEach((textItem) => {
            if (textItem.R && textItem.R.length > 0) {
              textItem.R.forEach((run) => {
                if (run.T) {
                  const decodedText = decodeURIComponent(run.T);
                  pageTexts.push(decodedText);
                  
                  // 保存位置信息
                  pageData.texts.push({
                    text: decodedText,
                    x: textItem.x,
                    y: textItem.y,
                    width: textItem.w,
                    height: textItem.sw || 0
                  });
                }
              });
            }
          });
        }

        text += pageTexts.join(' ') + '\n';
        structuredData.pages.push(pageData);
      });
    }

    return {
      text: text.trim(),
      structured: structuredData,
      rawData: data
    };
  }

  /**
   * 智能解析 - 根据PDF类型选择最佳解析方法
   */
  async smartParse(buffer, options = {}) {
    const { parseType = 'general', priority = 'quality' } = options;
    
    console.log(`开始智能解析，类型: ${parseType}, 优先级: ${priority}`);
    
    try {
      // 对于发票等结构化文档，优先使用 pdf2json
      if (parseType === 'invoice' || parseType === 'structured') {
        console.log('使用 pdf2json 进行结构化解析');
        const result = await this.parseWithPdf2json(buffer);
        
        // 提取结构化信息
        if (parseType === 'invoice') {
          result.invoice = this.extractInvoiceData(result.structured);
        }
        
        return result;
      }
      
      // 对于一般文档，使用 pdf-parse
      console.log('使用 pdf-parse 进行文本解析');
      return await this.parseWithPdfParse(buffer);
      
    } catch (primaryError) {
      console.warn(`主要解析方法失败: ${primaryError.message}，尝试备用方法`);
      
      try {
        // 备用方法
        if (parseType === 'invoice') {
          return await this.parseWithPdfParse(buffer);
        } else {
          return await this.parseWithPdf2json(buffer);
        }
      } catch (secondaryError) {
        throw new Error(`所有解析方法都失败了: ${primaryError.message}, ${secondaryError.message}`);
      }
    }
  }

  /**
   * 从结构化数据中提取发票信息
   */
  extractInvoiceData(structured) {
    const invoice = {
      invoiceNumber: '',
      issueDate: '',
      buyerName: '',
      buyerTaxId: '',
      sellerName: '',
      sellerTaxId: '',
      totalAmount: '',
      taxAmount: '',
      goodsServices: []
    };

    // 遍历所有文本，查找关键字段
    structured.pages.forEach(page => {
      page.texts.forEach(textItem => {
        const text = textItem.text;
        
        // 发票号码
        const invoiceNumberMatch = text.match(/发票号码[：:]\s*([^\s]+)/);
        if (invoiceNumberMatch) {
          invoice.invoiceNumber = invoiceNumberMatch[1];
        }
        
        // 开票日期
        const dateMatch = text.match(/开票日期[：:]\s*(\d{4}[-/]\d{2}[-/]\d{2})/);
        if (dateMatch) {
          invoice.issueDate = dateMatch[1];
        }
        
        // 购买方名称
        const buyerMatch = text.match(/购买方.*?名称[：:]\s*([^\n\r]+)/);
        if (buyerMatch) {
          invoice.buyerName = buyerMatch[1].trim();
        }
        
        // 销售方名称
        const sellerMatch = text.match(/销售方.*?名称[：:]\s*([^\n\r]+)/);
        if (sellerMatch) {
          invoice.sellerName = sellerMatch[1].trim();
        }
        
        // 价税合计
        const totalMatch = text.match(/价税合计[：:]\s*[￥¥]?([\d,]+\.?\d*)/);
        if (totalMatch) {
          invoice.totalAmount = totalMatch[1];
        }
      });
    });

    return invoice;
  }
}

module.exports = AdvancedPDFParser; 