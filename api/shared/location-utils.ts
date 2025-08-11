import { z } from "zod";

// 위치 정보 파싱 결과 타입
export interface ParsedLocation {
  zoneName: string;        // 구역명 (예: "D")
  subZoneName: string;     // 세부구역명 (예: "101번 팔레트")
  floor: number;           // 층수 (기본값: 1)
  original: string;        // 원본 위치 문자열
  isValid: boolean;        // 파싱 성공 여부
}

// 위치 파싱 함수
export function parseLocation(location: string): ParsedLocation {
  if (!location || typeof location !== 'string') {
    return {
      zoneName: '',
      subZoneName: '',
      floor: 1,
      original: location || '',
      isValid: false
    };
  }

  const trimmedLocation = location.trim();
  
  // 새로운 유연한 위치 형식 패턴 매칭
  const patterns = [
    // 패턴 1: 이미 "구역"이 포함된 경우 - 그대로 사용
    /^(.+구역)$/,
    
    // 패턴 2: 숫자만 (예: "3", "12")
    /^(\d+)$/,
    
    // 패턴 3: 숫자-숫자 (예: "3-1", "12-5")
    /^(\d+-\d+)$/,
    
    // 패턴 4: 영문자만 (예: "A", "BC")
    /^([a-zA-Z]+)$/,
    
    // 패턴 5: 영문자-숫자 (예: "A-1", "BC-12")
    /^([a-zA-Z]+-\d+)$/,
    
    // 패턴 6: 영문자+숫자 (예: "A1", "BC12")
    /^([a-zA-Z]+\d+)$/,
    
    // 패턴 7: 한글 포함 (예: "창고1", "팔레트A")
    /^([가-힣]+.*)$/,
    
    // 패턴 8: 기타 모든 형식 (최후 패턴)
    /^(.+)$/
  ];

  for (const pattern of patterns) {
    const match = trimmedLocation.match(pattern);
    if (match) {
      let zoneName = match[1];
      
      if (pattern === patterns[0]) {
        // 패턴 1: 이미 "구역"이 포함된 경우 - 그대로 사용
        return {
          zoneName: zoneName,
          subZoneName: '',
          floor: 1,
          original: trimmedLocation,
          isValid: true
        };
      } else {
        // 패턴 2-8: "구역" 추가
        return {
          zoneName: `${zoneName}구역`,
          subZoneName: '',
          floor: 1,
          original: trimmedLocation,
          isValid: true
        };
      }
    }
  }

  // 패턴 매칭 실패 시 기본값 반환 (실제로는 패턴 8에서 모든 것을 잡아냄)
  return {
    zoneName: `${trimmedLocation}구역`,
    subZoneName: '',
    floor: 1,
    original: trimmedLocation,
    isValid: true
  };
}

// 위치 문자열 정규화 (표시용) - 원본 입력값을 그대로 반환
export function normalizeLocationDisplay(parsed: ParsedLocation): string {
  if (!parsed.isValid) {
    return parsed.original;
  }
  
  // 사용자 요구사항: 입력한 원본값을 그대로 표시
  const floorSuffix = parsed.floor > 1 ? ` (${parsed.floor}층)` : '';
  return `${parsed.original}${floorSuffix}`;
}

// 창고 레이아웃 생성을 위한 유틸리티
export function generateWarehouseLayoutData(parsed: ParsedLocation) {
  if (!parsed.isValid) return null;
  
  return {
    zoneName: parsed.zoneName,
    subZoneName: parsed.subZoneName || '',
    floors: Array.from({ length: parsed.floor }, (_, i) => i + 1)
  };
}

// 위치 검증 함수
export function validateLocation(location: string): { isValid: boolean; message?: string } {
  const parsed = parseLocation(location);
  
  if (!parsed.isValid) {
    return {
      isValid: false,
      message: `위치 형식을 인식할 수 없습니다: "${location}". 예시: "D-101번팔레트", "A구역-1-1층"`
    };
  }
  
  if (!parsed.zoneName) {
    return {
      isValid: false,
      message: `구역명이 필요합니다.`
    };
  }
  
  // 세부구역명은 선택사항으로 변경
  
  return { isValid: true };
}

// 테스트용 함수 (개발 시에만 사용)
export function testLocationParsing() {
  const testCases = [
    "3",           // 숫자만
    "3-1",         // 숫자-숫자  
    "3구역",       // 이미 구역 포함
    "A",           // 영문자만
    "A-1",         // 영문자-숫자
    "A1",          // 영문자+숫자
    "창고1",       // 한글+숫자
    "팔레트A",     // 한글+영문자
    "D-101번 팔레트", // 기존 복잡 형식
    "저장소"       // 한글만
  ];
  
  return testCases.map(location => ({
    input: location,
    parsed: parseLocation(location),
    display: normalizeLocationDisplay(parseLocation(location))
  }));
}