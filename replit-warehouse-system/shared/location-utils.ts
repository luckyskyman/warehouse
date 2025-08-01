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
  
  // 다양한 위치 형식 패턴 매칭
  const patterns = [
    // 패턴 1: "d-101번 팔레트", "D-102", "f-23"
    /^([a-zA-Z])-(.+)$/,
    
    // 패턴 2: "D구역-A-1-1층", "A구역-B-2-3층"
    /^([a-zA-Z])구역-([^-]+)-(\d+)-(\d+)층$/,
    
    // 패턴 3: "D구역-101번팔레트", "A구역-창고1"
    /^([a-zA-Z])구역-(.+)$/,
    
    // 패턴 4: "D-101-2" (구역-세부구역-층수)
    /^([a-zA-Z])-([^-]+)-(\d+)$/,
    
    // 패턴 5: "A1", "B2" (구역+숫자)
    /^([a-zA-Z])(\d+)$/,
    
    // 패턴 6: "D101번팔레트", "F23"
    /^([a-zA-Z])(.+)$/
  ];

  for (const pattern of patterns) {
    const match = trimmedLocation.match(pattern);
    if (match) {
      const zoneName = match[1].toUpperCase();
      
      if (pattern === patterns[1]) {
        // 패턴 2: "D구역-A-1-1층"
        return {
          zoneName,
          subZoneName: `${match[2]}-${match[3]}`,
          floor: parseInt(match[4]) || 1,
          original: trimmedLocation,
          isValid: true
        };
      } else if (pattern === patterns[3]) {
        // 패턴 4: "D-101-2"
        return {
          zoneName,
          subZoneName: match[2],
          floor: parseInt(match[3]) || 1,
          original: trimmedLocation,
          isValid: true
        };
      } else {
        // 나머지 패턴들
        return {
          zoneName,
          subZoneName: match[2] || match[1] + (match[2] || ''),
          floor: 1,
          original: trimmedLocation,
          isValid: true
        };
      }
    }
  }

  // 패턴 매칭 실패 시 기본값 반환
  return {
    zoneName: '',
    subZoneName: trimmedLocation,
    floor: 1,
    original: trimmedLocation,
    isValid: false
  };
}

// 위치 문자열 정규화 (표시용)
export function normalizeLocationDisplay(parsed: ParsedLocation): string {
  if (!parsed.isValid) {
    return parsed.original;
  }
  
  const floorSuffix = parsed.floor > 1 ? ` (${parsed.floor}층)` : '';
  return `${parsed.zoneName}구역-${parsed.subZoneName}${floorSuffix}`;
}

// 창고 레이아웃 생성을 위한 유틸리티
export function generateWarehouseLayoutData(parsed: ParsedLocation) {
  if (!parsed.isValid) return null;
  
  return {
    zoneName: parsed.zoneName,
    subZoneName: parsed.subZoneName,
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
  
  if (!parsed.zoneName || parsed.zoneName.length !== 1) {
    return {
      isValid: false,
      message: `구역명이 올바르지 않습니다. 단일 알파벳을 사용해주세요: "${parsed.zoneName}"`
    };
  }
  
  if (!parsed.subZoneName) {
    return {
      isValid: false,
      message: `세부구역명이 필요합니다.`
    };
  }
  
  return { isValid: true };
}

// 테스트용 함수 (개발 시에만 사용)
export function testLocationParsing() {
  const testCases = [
    "d-101번 팔레트",
    "D-102",
    "f-23",
    "D구역-A-1-1층", 
    "A구역-B-2-3층",
    "D구역-101번팔레트",
    "A구역-창고1",
    "D-101-2",
    "A1",
    "B2",
    "D101번팔레트",
    "F23"
  ];
  
  return testCases.map(location => ({
    input: location,
    parsed: parseLocation(location),
    display: normalizeLocationDisplay(parseLocation(location))
  }));
}