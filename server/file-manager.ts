import { promises as fs } from 'fs';
import path from 'path';
import { storage } from './storage';

export interface FileCleanupResult {
  deletedFiles: string[];
  savedSpace: number;
  errors: string[];
}

export interface FileCleanupOptions {
  maxAgeInDays?: number;
  maxSizeInMB?: number;
  categories?: string[];
  dryRun?: boolean;
}

export class FileManager {
  private attachedAssetsDir: string;

  constructor() {
    this.attachedAssetsDir = path.resolve('attached_assets');
  }

  // 자동 파일 정리
  async autoCleanup(options: FileCleanupOptions = {}): Promise<FileCleanupResult> {
    const {
      maxAgeInDays = 30,
      maxSizeInMB = 100,
      categories = ['evidence', 'temp'],
      dryRun = false
    } = options;

    const result: FileCleanupResult = {
      deletedFiles: [],
      savedSpace: 0,
      errors: []
    };

    try {
      const files = await storage.getFiles();
      const now = new Date();
      const maxAgeMs = maxAgeInDays * 24 * 60 * 60 * 1000;
      const maxSizeBytes = maxSizeInMB * 1024 * 1024;

      for (const file of files) {
        const shouldDelete = this.shouldDeleteFile(file, {
          now,
          maxAgeMs,
          maxSizeBytes,
          categories
        });

        if (shouldDelete) {
          if (!dryRun) {
            try {
              await this.deleteFile(file.id);
              result.deletedFiles.push(file.id);
              result.savedSpace += file.size;
            } catch (error) {
              result.errors.push(`${file.id}: ${error.message}`);
            }
          } else {
            result.deletedFiles.push(`[DRY RUN] ${file.id}`);
            result.savedSpace += file.size;
          }
        }
      }

      console.log(`[자동 정리] ${result.deletedFiles.length}개 파일 정리, ${this.formatBytes(result.savedSpace)} 절약`);
      
    } catch (error) {
      result.errors.push(`자동 정리 실패: ${error.message}`);
    }

    return result;
  }

  // 파일 삭제 조건 판단
  private shouldDeleteFile(file: any, criteria: any): boolean {
    const fileAge = criteria.now.getTime() - new Date(file.uploadDate).getTime();
    
    // 카테고리 체크
    if (!criteria.categories.includes(file.category)) {
      return false;
    }

    // 나이 체크
    const isOld = fileAge > criteria.maxAgeMs;
    
    // 크기 체크
    const isLarge = file.size > criteria.maxSizeBytes;

    // 임시 파일은 더 짧은 주기로 삭제
    if (file.category === 'temp') {
      const tempMaxAge = 24 * 60 * 60 * 1000; // 1일
      return fileAge > tempMaxAge;
    }

    // 증거자료는 나이 또는 크기 조건 만족시 삭제 후보
    if (file.category === 'evidence') {
      return isOld || isLarge;
    }

    return false;
  }

  // 개별 파일 삭제
  private async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.attachedAssetsDir, filename);
    await fs.unlink(filePath);
  }

  // 중복 파일 찾기 (매우 보수적인 접근)
  async findDuplicateFiles(): Promise<{ duplicates: any[], totalSize: number }> {
    try {
      const files = await storage.getFiles();
      const duplicates: any[] = [];
      let totalSize = 0;

      // 타임스탬프 제거 후 기본명으로 그룹핑
      const baseNameGroups = new Map<string, any[]>();
      
      files.forEach(file => {
        const baseName = this.removeTimestamp(file.originalName);
        console.log(`파일 처리: ${file.originalName} -> 기본명: ${baseName}`);
        
        // 너무 짧거나 일반적인 파일명은 제외 (조건 완화)
        if (baseName.length > 5 && !baseName.match(/^(image|file|document)$/)) {
          if (!baseNameGroups.has(baseName)) {
            baseNameGroups.set(baseName, []);
          }
          baseNameGroups.get(baseName)!.push(file);
        }
      });

      // 같은 기본명의 파일이 2개 이상인 경우만 처리
      baseNameGroups.forEach((group, baseName) => {
        if (group.length > 1) {
          // 업로드 날짜 순으로 정렬 (최신이 먼저)
          group.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
          
          // 가장 최신 파일을 제외하고 나머지는 중복으로 처리
          for (let i = 1; i < group.length; i++) {
            const duplicate = group[i];
            duplicates.push(duplicate);
            totalSize += duplicate.size;
          }
          
          console.log(`중복 그룹 발견: ${baseName} - ${group.length}개 파일, 최신 보존: ${group[0].originalName}`);
        }
      });

      console.log(`중복 파일 검색 완료: ${duplicates.length}개 발견, ${Math.round(totalSize/1024)}KB`);
      return { duplicates, totalSize };
    } catch (error) {
      console.error('중복 파일 검색 오류:', error);
      return { duplicates: [], totalSize: 0 };
    }
  }

  // 타임스탬프만 제거 (나머지는 그대로 유지)
  private removeTimestamp(filename: string): string {
    return filename.replace(/_\d{10,}/g, ''); // 타임스탬프만 제거 (_1234567890 형태)
  }

  // 깨끗한 파일명 추출 (확장자, 타임스탬프, 특수문자 제거)
  private getCleanFileName(filename: string): string {
    return filename
      .toLowerCase()
      .replace(/\.\w+$/, '') // 확장자 제거
      .replace(/_\d{10,}/g, '') // 타임스탬프 제거 (_1234567890 형태)
      .replace(/[_\-\s]+/g, '') // 언더스코어, 하이픈, 공백 제거
      .replace(/[^\w가-힣]/g, ''); // 특수문자 제거, 한글/영숫자만 유지
  }

  // 파일명 유사성으로 그룹핑
  private groupBySimilarNames(files: any[]): any[][] {
    const groups: any[][] = [];
    
    for (const file of files) {
      const baseName = this.getCleanFileName(file.originalName);
      let foundGroup = false;
      
      for (const group of groups) {
        const groupBaseName = this.getCleanFileName(group[0].originalName);
        if (baseName === groupBaseName) { // 정확히 같은 경우만
          group.push(file);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groups.push([file]);
      }
    }
    
    return groups;
  }

  // 문자열 유사도 계산 (Levenshtein distance 기반)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  // Levenshtein distance 알고리즘
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // 파일 백업
  async backupFiles(targetFiles: string[]): Promise<string> {
    const backupDir = path.join(this.attachedAssetsDir, 'backups');
    const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(backupDir, backupName);

    try {
      // 백업 디렉토리 생성
      await fs.mkdir(backupPath, { recursive: true });

      // 파일들 복사
      for (const filename of targetFiles) {
        const sourcePath = path.join(this.attachedAssetsDir, filename);
        const targetPath = path.join(backupPath, filename);
        await fs.copyFile(sourcePath, targetPath);
      }

      // 백업 메타데이터 저장
      const metadata = {
        createdAt: new Date().toISOString(),
        files: targetFiles,
        totalFiles: targetFiles.length
      };
      
      await fs.writeFile(
        path.join(backupPath, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`[백업 완료] ${backupName}: ${targetFiles.length}개 파일`);
      return backupName;
      
    } catch (error) {
      console.error(`[백업 실패] ${error.message}`);
      throw error;
    }
  }

  // 파일 시스템 상태 조회
  async getFileSystemStatus(): Promise<{
    totalFiles: number;
    totalSize: number;
    categoryBreakdown: Record<string, { count: number; size: number }>;
    oldestFile: any;
    newestFile: any;
    largestFile: any;
  }> {
    const files = await storage.getFiles();
    
    const status = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      categoryBreakdown: {} as Record<string, { count: number; size: number }>,
      oldestFile: null as any,
      newestFile: null as any,
      largestFile: null as any
    };

    // 카테고리별 분류
    for (const file of files) {
      if (!status.categoryBreakdown[file.category]) {
        status.categoryBreakdown[file.category] = { count: 0, size: 0 };
      }
      status.categoryBreakdown[file.category].count++;
      status.categoryBreakdown[file.category].size += file.size;
    }

    // 특별한 파일들 찾기
    if (files.length > 0) {
      status.oldestFile = files.reduce((oldest, file) => 
        new Date(file.uploadDate) < new Date(oldest.uploadDate) ? file : oldest
      );
      
      status.newestFile = files.reduce((newest, file) => 
        new Date(file.uploadDate) > new Date(newest.uploadDate) ? file : newest
      );
      
      status.largestFile = files.reduce((largest, file) => 
        file.size > largest.size ? file : largest
      );
    }

    return status;
  }

  // 바이트를 읽기 쉬운 형태로 변환
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 싱글톤 인스턴스
export const fileManager = new FileManager();