// 全局文档存储
export interface DocumentData {
  content: string;
  chunks: string[];
  metadata: {
    filename: string;
    size: number;
    type: string;
    uploadTime: string;
  };
}

class DocumentStore {
  private store: { [filename: string]: DocumentData } = {};

  set(filename: string, data: DocumentData) {
    this.store[filename] = data;
  }

  get(filename: string): DocumentData | undefined {
    return this.store[filename];
  }

  getAll(): { [filename: string]: DocumentData } {
    return this.store;
  }

  delete(filename: string) {
    delete this.store[filename];
  }

  clear() {
    this.store = {};
  }

  getFileNames(): string[] {
    return Object.keys(this.store);
  }

  getTotalChunks(): number {
    return Object.values(this.store).reduce((sum, doc) => sum + doc.chunks.length, 0);
  }

  getAllChunks(): Array<{ filename: string; text: string }> {
    const allChunks: Array<{ filename: string; text: string }> = [];
    
    Object.entries(this.store).forEach(([filename, doc]) => {
      doc.chunks.forEach(chunk => {
        allChunks.push({ filename, text: chunk });
      });
    });
    
    return allChunks;
  }
}

// 单例模式
export const documentStore = new DocumentStore(); 