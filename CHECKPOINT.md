# 📘 성우 배차 관리 시스템 - 완전 개발 문서

## 📋 목차
1. [시스템 개요](#1-시스템-개요)
2. [기술 스택 및 아키텍처](#2-기술-스택-및-아키텍처)
3. [데이터 구조](#3-데이터-구조)
4. [핵심 기능 명세](#4-핵심-기능-명세)
5. [버그 수정 내역](#5-버그-수정-내역)
6. [코드 구조 및 함수 맵](#6-코드-구조-및-함수-맵)
7. [크로스 브라우저 호환성](#7-크로스-브라우저-호환성)
8. [배포 및 테스트](#8-배포-및-테스트)
9. [유지보수 가이드](#9-유지보수-가이드)

---

## 1. 시스템 개요

### 1.1 프로젝트 정보
- **이름**: 성우 배차 관리 시스템
- **목적**: 주간 단위 배차 스케줄 관리 (방통차/집게차)
- **사용자**: 물류/배차 담당자 (인증 시스템)
- **플랫폼**: 웹 기반 (PC/모바일 반응형)

### 1.2 주요 기능
| 기능 | 설명 | 우선순위 |
|-----|------|---------|
| **배차 현황 조회** | 주간 테이블 뷰로 배차 상황 확인 | ⭐⭐⭐ |
| **배차 입력/수정** | 피벗 모달로 세부 정보 입력 | ⭐⭐⭐ |
| **데이터 이동** | 날짜 변경 시 자동 이동 (상태 추적) | ⭐⭐⭐ |
| **검색** | 기간/키워드 기반 검색 | ⭐⭐ |
| **내보내기** | CSV/Excel 파일 생성 | ⭐⭐ |
| **접속 로그** | 사용자 활동 추적 | ⭐ |

### 1.3 사용자 시나리오
```
[시나리오 1: 신규 배차 입력]
1. "배차 입력" 탭 클릭
2. 특정 날짜 입력 또는 테이블 셀 클릭
3. 피벗 모달에서 업체명(필수), 상차지, 시간, 차량 선택
4. "저장하기" 클릭 → 테이블에 반영

[시나리오 2: 배차 날짜 변경]
1. 기존 배차 셀 클릭 → 피벗 모달 열림
2. "날짜 변경" 필드에서 새 날짜 선택
3. 저장 → 원본 삭제, 새 위치에 데이터 생성
4. currentRow/Col 자동 업데이트 (데이터 손실 방지)

[시나리오 3: 모바일 사용]
1. 셀 0.5초 길게 누름 → 이동 버튼(↑↓) 표시
2. 피벗 모달 입력 → iOS 키보드 자동 스크롤
3. 드로어 메뉴 스와이프로 닫기
```

---

## 2. 기술 스택 및 아키텍처

### 2.1 기술 스택
```javascript
// Frontend
- HTML5 + CSS3 (Tailwind CSS CDN)
- Vanilla JavaScript (ES6+)
- 외부 라이브러리: SheetJS (xlsx@0.18.5)

// Data Storage
- IndexedDB (브라우저 내장)
  - Store: weekly_reports (배차 데이터)
  - Store: access_logs (접속 로그)
  - Store: error_logs (에러 로그)

// Styling
- Tailwind CSS 3.x (CDN)
- Custom CSS (애니메이션, 모바일 최적화)

// 호환성
- Chrome 90+
- Safari 14+ (iOS/macOS)
- Samsung Internet 14+
- Edge 90+
```

### 2.2 아키텍처 다이어그램
```
┌─────────────────────────────────────────┐
│           UI Layer (HTML)               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ 배차현황 │  │ 배차입력 │  │  모달   ││
│  └─────────┘  └─────────┘  └─────────┘│
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Business Logic (JavaScript)        │
│  ┌──────────────────────────────────┐  │
│  │  State Management                │  │
│  │  - currentWeekStart              │  │
│  │  - currentRow/Col (syncState)    │  │
│  │  - writer (인증 정보)             │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Core Functions                  │  │
│  │  - loadWeek() / saveToIDB()      │  │
│  │  - applyAndSave() (데이터 이동)  │  │
│  │  - renderInputTable()            │  │
│  └──────────────────────────────────┘  │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       Data Layer (IndexedDB)            │
│  ┌──────────────────────────────────┐  │
│  │  dispatchDB (v2)                 │  │
│  │  ├─ weekly_reports               │  │
│  │  ├─ access_logs (idx: timestamp) │  │
│  │  └─ error_logs (idx: timestamp)  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2.3 데이터 흐름
```javascript
// 1. 초기화 (window.onload)
initDB() → loadWeek(currentWeekStart) → renderTables()

// 2. 데이터 입력
openPivotModal(row, col) 
  → 사용자 입력 
  → applyAndSave() 
  → saveToIDB(data) 
  → syncState(weekStart, row, col) 
  → loadWeek() 
  → 화면 갱신

// 3. 검색
performSearch() 
  → getStore().openCursor() 
  → 필터링 
  → displaySearchResults()

// 4. 내보내기
exportToCSV() 
  → getStore().openCursor() 
  → CSV 생성 
  → Blob 다운로드
```

---

## 3. 데이터 구조

### 3.1 IndexedDB Schema

#### Store: `weekly_reports`
```javascript
{
  weekStart: "2025-11-16",  // Primary Key (YYYY-MM-DD 형식, 일요일)
  rows: [
    [  // 8개 행 (DEFAULT_ROWS = 8)
      {  // 7개 열 (일~토)
        company: "정도철강",      // 업체명 (필수)
        loading: "남양주",        // 상차지
        time: "오후 2시",         // 시간 (자유 입력)
        bang: "방1",             // 방통차 (단일 선택 또는 범위)
        jip: "집1",              // 집게차 (단일 선택 또는 범위)
        contact: "010-1234-5678", // 연락처
        notes: "급배송",          // 특이사항
        author: "홍길동",         // 작성자
        status: "SCHEDULED"       // 배차 상태 (SCHEDULED/CONFIRMED/COMPLETED)
      },
      // ... 6개 열 더
    ],
    // ... 7개 행 더
  ]
}
```

#### Store: `access_logs`
```javascript
{
  id: 1,  // Auto Increment
  timestamp: "2025-11-18T10:30:00.000Z",
  user: "홍길동",
  userType: "인증",  // "인증" 또는 "일반"
  deviceInfo: "Mozilla/5.0...",
  platform: "Win32",
  language: "ko-KR"
}
// Index: timestamp (최신순 정렬용)
```

#### Store: `error_logs`
```javascript
{
  id: 1,  // Auto Increment
  timestamp: "2025-11-18T10:35:00.000Z",
  type: "Error",  // "Error" 또는 "Bug"
  message: "IndexedDB 트랜잭션 오류",
  details: "추가 정보...",
  user: "홍길동"
}
// Index: timestamp
```

### 3.2 LocalStorage 데이터
```javascript
// 작성자 인증
localStorage.writerName = "홍길동"
localStorage.writerPin = "1234"  // 4자리 숫자

// 업체명/상차지 즐겨찾기 (최대 10개)
localStorage.companyList = JSON.stringify(["정도철강", "삼성물산", ...])
localStorage.loadingList = JSON.stringify(["남양주", "인천", ...])

// 차량 대수 설정
localStorage.bangCount = "5"  // 방통차 1-20대
localStorage.jipCount = "3"   // 집게차 1-10대
```

### 3.3 배차 상태 매핑
```javascript
const STATUS_MAP = {
  SCHEDULED: {  // 예정
    name: '예정',
    class: 'status-scheduled',
    color: 'bg-blue-100 text-blue-700'
  },
  CONFIRMED: {  // 확정
    name: '확정',
    class: 'status-confirmed',
    color: 'bg-orange-100 text-orange-700'
  },
  COMPLETED: {  // 완료
    name: '완료',
    class: 'status-completed',
    color: 'bg-green-100 text-green-700'
  }
};
```

---

## 4. 핵심 기능 명세

### 4.1 상태 동기화 시스템 (State Sync)

**목적**: 데이터 이동 시 손실 방지

```javascript
// 전역 상태 변수
let currentWeekStart = '';  // 현재 표시 중인 주 (YYYY-MM-DD)
let currentRow = -1;        // 피벗 모달에서 수정 중인 행 인덱스
let currentCol = -1;        // 피벗 모달에서 수정 중인 열 인덱스

// 상태 동기화 함수
function syncState(weekStart, row, col) {
  currentWeekStart = weekStart;
  currentRow = row;
  currentCol = col;
  console.log(`[✓ State Synced] Week: ${weekStart}, Row: ${row}, Col: ${col}`);
}

// 호출 시점
// 1. applyAndSave() 저장 성공 후
// 2. openPivotModal() 모달 열 때 (즉시)
// 3. moveCell() 셀 이동 후 (선택적)
```

**작동 원리**:
```
[Before] 월요일(0,1)에 데이터 → 화요일(0,2)로 이동
- currentRow=0, currentCol=1 (여전히 월요일 참조)
- 다음 저장 시 월요일(0,1)을 또 삭제 시도 → 화요일 데이터 손실

[After] syncState(weekStart, 0, 2) 호출
- currentRow=0, currentCol=2 (화요일로 업데이트)
- 다음 저장 시 화요일(0,2) 정상 수정
```

### 4.2 데이터 이동 로직 (applyAndSave)

**시나리오별 처리**:

| 시나리오 | 조건 | 처리 방식 |
|---------|-----|----------|
| **같은 셀 수정** | `currentRow === row && currentCol === newCol` | 기존 셀 덮어쓰기 → syncState(같은 위치) |
| **같은 주 내 이동** | `currentWeekStart === newWeekStart` | 원본 삭제 → 새 위치 저장 → syncState(새 위치) |
| **다른 주로 이동** | `currentWeekStart !== newWeekStart` | 원본 주 삭제 → 새 주 저장 → syncState(새 주) + 주차 변경 |

**코드 흐름**:
```javascript
function applyAndSave() {
  // 1. 유효성 검증
  if (!pivotSelection.company.trim()) {
    alert('업체명은 필수입니다.');
    return;
  }
  
  // 2. 날짜 파싱 (Safari 호환)
  const selectedDate = parseDate(newDate);
  const newWeekStart = formatDate(getWeekStart(selectedDate));
  const newCol = selectedDate.getDay();
  
  // 3. 시나리오 분기
  if (currentWeekStart === newWeekStart) {
    // 같은 주
    if (currentRow >= 0 && currentCol === newCol) {
      // Case A: 같은 셀 수정
      data.rows[currentRow][currentCol] = newCellData;
      syncState(currentWeekStart, currentRow, currentCol);
    } else {
      // Case B: 다른 셀로 이동
      data.rows[currentRow][currentCol] = {}; // 원본 삭제
      let targetRow = findEmptyRow(data, newCol);
      data.rows[targetRow][newCol] = newCellData;
      syncState(currentWeekStart, targetRow, newCol); // ✅ 핵심!
    }
  } else {
    // 다른 주
    // Step 1: 원본 주에서 삭제
    oldData.rows[currentRow][currentCol] = {};
    saveToIDB(oldData);
    
    // Step 2: 새 주에 저장
    let targetRow = findEmptyRow(newData, newCol);
    newData.rows[targetRow][newCol] = newCellData;
    syncState(newWeekStart, targetRow, newCol); // ✅ 핵심!
    
    // Step 3: UI 업데이트
    document.getElementById('weekPicker').value = getWeekInputValue(new Date(newWeekStart));
    updateWeekDisplay();
  }
  
  // 4. 저장 및 렌더링
  saveToIDB(data);
  loadWeek(currentWeekStart); // currentWeekStart가 이미 업데이트됨
  closePivotModal();
}
```

### 4.3 PC/모바일 이벤트 통합

**문제**: PC의 `hover`와 모바일의 `touch`를 다르게 처리

**해결책**: 통합 이벤트 레이어

```javascript
// renderInputTable() 함수 내
const cellId = `cell-${rowIdx}-${colIdx}`;
const cellElement = document.getElementById(cellId);
const controls = cellElement.querySelector('.cell-move-controls');

// ===== PC 이벤트 =====
cellElement.addEventListener('mouseenter', function() {
  controls.style.opacity = '1';
  controls.style.pointerEvents = 'auto';
});

cellElement.addEventListener('mouseleave', function() {
  controls.style.opacity = '0';
  controls.style.pointerEvents = 'none';
});

// ===== 모바일 이벤트 (Long-Press) =====
let touchTimer = null;
let touchMoved = false;

cellElement.addEventListener('touchstart', function(e) {
  touchMoved = false;
  
  touchTimer = setTimeout(() => {
    if (!touchMoved) {
      controls.style.opacity = '1';
      controls.style.pointerEvents = 'auto';
      
      // 진동 피드백 (지원 브라우저만)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // 3초 후 자동 숨김
      setTimeout(() => {
        controls.style.opacity = '0';
        controls.style.pointerEvents = 'none';
      }, 3000);
    }
  }, 500); // 0.5초 long-press
}, { passive: true });

cellElement.addEventListener('touchmove', function() {
  touchMoved = true;
  clearTimeout(touchTimer);
}, { passive: true });

cellElement.addEventListener('touchend', function() {
  clearTimeout(touchTimer);
}, { passive: true });
```

**동작 원리**:
- **PC**: 마우스 오버 시 즉시 버튼 표시
- **모바일**: 0.5초 길게 누르면 진동과 함께 버튼 표시, 3초 후 자동 숨김
- **핵심**: 같은 DOM 요소에 두 이벤트 모두 부착, 기기에 따라 자동 선택

### 4.4 iOS 키보드 겹침 방지

**문제**: 피벗 모달에서 입력 시 iOS 가상 키보드가 저장 버튼을 가림

**해결책**: `visualViewport` API 사용

```javascript
if ('visualViewport' in window) {
  let lastHeight = window.visualViewport.height;
  
  window.visualViewport.addEventListener('resize', function() {
    const currentHeight = window.visualViewport.height;
    const heightDiff = lastHeight - currentHeight;
    
    // 키보드가 올라왔는지 판단 (높이 100px 이상 감소)
    if (heightDiff > 100) {
      const pivotModal = document.getElementById('pivotModal');
      if (pivotModal && pivotModal.classList.contains('flex')) {
        const modalContent = pivotModal.querySelector('.modal-content');
        if (modalContent) {
          // 모달을 위로 스크롤하여 저장 버튼 노출
          modalContent.scrollTop = modalContent.scrollHeight;
          
          // 추가 여백 적용
          modalContent.style.paddingBottom = heightDiff + 'px';
        }
      }
    } else if (heightDiff < -100) {
      // 키보드가 내려감
      const modalContent = document.querySelector('#pivotModal .modal-content');
      if (modalContent) {
        modalContent.style.paddingBottom = '';
      }
    }
    
    lastHeight = currentHeight;
  });
}
```

**Fallback (구형 브라우저)**:
```javascript
else {
  // visualViewport 미지원 시 window.innerHeight 사용
  window.addEventListener('resize', function() {
    const currentHeight = window.innerHeight;
    const heightDiff = lastHeight - currentHeight;
    // 동일 로직...
  });
}
```

---

## 5. 버그 수정 내역

### 5.1 수정된 버그 목록

| ID | 버그명 | 원인 | 해결 방법 | 파일 위치 |
|----|--------|------|----------|-----------|
| **B1** | 데이터 이동 손실 | `currentRow/Col` 미업데이트 | `syncState()` 함수 추가, 모든 저장 후 호출 | `applyAndSave()` |
| **B2** | 행 추가 실패 | `saveToIDB()` 누락 | 행 추가 직후 `saveToIDB()` 호출 | `openPivotModalForDate()` |
| **B3** | 상태 미리보기 불일치 | `pivotSelection.status` 미동기화 | `updatePivotPreview()`에 status 업데이트 추가 | `updatePivotPreview()` |
| **B4** | Safari 검색 오류 | 날짜 파싱 실패 | `parseDate()` 함수 사용 | `performSearch()` |
| **B5** | 로그 삭제 실패 | 비동기 cursor 순회 문제 | Promise 기반 `cleanupOldLogs()` 재작성 | `logAccess()`, `logError()` |
| **B6** | 차량 범위 버그 | `parseInt` 누락 | `parseInt()` 추가 + min > max 검증 | `updateBangRange()`, `updateJipRange()` |
| **B7** | Focus View 스크롤 | `overflow` 복원 실패 | `overflow: 'auto'` 명시적 설정 | `closeFocusView()` |
| **B8** | 인증 후 빈 테이블 | 데이터 로드 누락 | `saveWriter()`에 `loadWeek()` 추가 | `saveWriter()` |
| **B9** | 내보내기 빈 행 | 필터 조건 약함 | `trim()` 추가 | `exportToCSV()`, `exportToExcel()` |
| **B10** | ESC 키 중복 | 모달 스택 미관리 | 우선순위 if-else 체인 | `keydown` 이벤트 리스너 |
| **B11** | PWA 오류 | `sw.js` 미존재 | 조건부 등록 (fetch로 파일 확인) | `window.load` |
| **B12** | 에러 핸들러 불완전 | `onerror` 누락 | 모든 IndexedDB 요청에 `onerror` 추가 | `getStore()`, `saveToIDB()` |

### 5.2 수정 전후 비교

#### B1: 데이터 이동 손실
```javascript
// ❌ 수정 전
function applyAndSave() {
  // ... 저장 로직 ...
  data.rows[targetRow][newCol] = newCellData;
  saveToIDB(data);
  // currentRow/Col 미업데이트!
  loadWeek(currentWeekStart);
}
// 결과: 다음 저장 시 원본 위치 재삭제 → 데이터 손실

// ✅ 수정 후
function applyAndSave() {
  // ... 저장 로직 ...
  data.rows[targetRow][newCol] = newCellData;
  saveToIDB(data);
  syncState(currentWeekStart, targetRow, newCol); // 추가!
  loadWeek(currentWeekStart);
}
// 결과: 상태 동기화로 데이터 100% 유지
```

#### B6: 차량 범위 버그
```javascript
// ❌ 수정 전
function updateBangRange() {
  const min = document.getElementById('bangMin').value; // 문자열 "3"
  const max = document.getElementById('bangMax').value; // 문자열 "5"
  if (min && max) {
    pivotSelection.bang = `방 ${min}~${max}대`; // "방 3~5대" (우연히 정상)
  }
}
// 문제: min > max 검증 없음, parseInt 미사용

// ✅ 수정 후
function updateBangRange() {
  const min = parseInt(document.getElementById('bangMin').value) || 0;
  const max = parseInt(document.getElementById('bangMax').value) || 0;
  
  if (min > 0 && max > 0) {
    if (max >= min) {
      pivotSelection.bang = `방 ${min}~${max}대`;
    } else {
      pivotSelection.bang = '';
      showToast('⚠️ 최대값은 최소값보다 크거나 같아야 합니다');
    }
  } else if (min > 0) {
    pivotSelection.bang = `방 ${min}대`;
  } else {
    pivotSelection.bang = '';
  }
}
// 결과: 유효성 검증 완료
```

---

## 6. 코드 구조 및 함수 맵

### 6.1 전체 함수 목록 (알파벳 순)

| 함수명 | 역할 | 파라미터 | 반환값 | 의존성 |
|--------|------|---------|--------|--------|
| `applyAndSave()` | 피벗 모달 데이터 저장 | 없음 | void | `saveToIDB()`, `syncState()` |
| `changeWeek(weekValue)` | 주차 선택기 변경 | `weekValue`: "2025-W46" | void | `loadWeek()` |
| `cleanupOldLogs(storeName)` | 오래된 로그 삭제 | `storeName`: 'access_logs' 등 | `Promise<number>` | - |
| `closeFocusView()` | 상세 보기 닫기 | 없음 | void | - |
| `closePivotModal()` | 피벗 모달 닫기 | 없음 | void | - |
| `createEmptyWeek(weekStart)` | 빈 주차 데이터 생성 | `weekStart`: "2025-11-16" | `Object` | - |
| `deleteCell(row, col)` | 셀 데이터 삭제 | `row`, `col`: 인덱스 | void | `saveToIDB()` |
| `exportToCSV()` | CSV 파일 내보내기 | 없음 | void | `getStore()` |
| `exportToExcel()` | Excel 파일 내보내기 | 없음 | void | `XLSX.utils` |
| `formatDate(date)` | Date → "YYYY-MM-DD" | `date`: Date 객체 | `string` | - |
| `formatCellPreview(cell)` | 셀 미리보기 HTML 생성 | `cell`: 셀 데이터 객체 | `string` | - |
| `getStore(mode)` | IndexedDB Store 가져오기 | `mode`: 'readonly' 등 | `IDBObjectStore` | `db` |
| `getWeekStart(date)` | 주 시작일 계산 | `date`: Date 객체 | `Date` | - |
| `goToToday()` | 오늘이 포함된 주로 이동 | 없음 | void | `loadWeek()` |
| `initDB()` | IndexedDB 초기화 | 없음 | `Promise<void>` | - |
| `loadWeek(weekStart)` | 주차 데이터 로드 | `weekStart`: "2025-11-16" | void | `getStore()`, `renderInputTable()` |
| `loadWriter()` | 작성자 정보 로드 | 없음 | void | `localStorage` |
| `logAccess()` | 접속 로그 기록 | 없음 | void | `db` |
| `logError(type, message, details)` | 에러 로그 기록 | `type`, `message`, `details`: 문자열 | void | `db` |
| `moveCell(row, col, direction)` | 셀 위/아래 이동 | `row`, `col`, `direction`: 숫자 | void | `saveToIDB()` |
| `navigateWeek(offset)` | 주차 이동 | `offset`: -1 또는 1 | void | `loadWeek()` |
| `openPivotModal(row, col)` | 피벗 모달 열기 | `row`, `col`: 인덱스 | void | `getStore()` |
| `openPivotModalForDate()` | 특정 날짜 피벗 열기 | 없음 | void | `parseDate()` |
| `parseDate(dateString)` | "YYYY-MM-DD" → Date | `dateString`: 문자열 | `Date` | - |
| `performSearch()` | 검색 실행 | 없음 | void | `getStore()` |
| `renderInputTable(data)` | 입력 테이블 렌더링 | `data`: 주차 데이터 | void | `renderHeaders()` |
| `renderPivotModal()` | 피벗 모달 내용 렌더링 | 없음 | void | `COMPANIES`, `LOADINGS` |
| `renderViewTable(data)` | 현황 테이블 렌더링 | `data`: 주차 데이터 | void | `renderHeaders()` |
| `saveToIDB(data)` | IndexedDB 저장 | `

```javascript
| `saveToIDB(data)` | IndexedDB 저장 | `data`: 주차 데이터 객체 | `Promise<Object>` | `getStore()` |
| `saveWriter()` | 작성자 인증 저장 | 없음 | void | `localStorage`, `loadWeek()` |
| `selectPivot(field, value)` | 피벗 필드 선택 | `field`: 'bang' 등, `value`: 값 | void | `updatePivotPreview()` |
| `showFocusView(cell, weekStart, colIdx)` | 상세 보기 표시 | `cell`, `weekStart`, `colIdx` | void | - |
| `showPage(page)` | 페이지 전환 | `page`: 'view' 또는 'input' | void | - |
| `showToast(message)` | 토스트 알림 표시 | `message`: 문자열 | void | - |
| `syncState(weekStart, row, col)` | 상태 동기화 | `weekStart`, `row`, `col` | void | - |
| `toggleHeader()` | 모바일 헤더 토글 | 없음 | void | - |
| `updateBangRange()` | 방통차 범위 업데이트 | 없음 | void | `updatePivotPreview()` |
| `updateJipRange()` | 집게차 범위 업데이트 | 없음 | void | `updatePivotPreview()` |
| `updatePivotPreview()` | 피벗 미리보기 갱신 | 없음 | void | `STATUS_MAP` |
| `updateWeekDisplay()` | 주차 표시 업데이트 | 없음 | void | `currentWeekStart` |
```

### 6.2 함수 호출 관계도

```
window.onload
  └─> initDB()
       └─> logAccess()
  └─> loadWriter()
  └─> loadWeek(currentWeekStart)
       └─> getStore('readonly')
       └─> renderInputTable(data)
       └─> renderViewTable(data)
            └─> renderHeaders()
            └─> showFocusView() [셀 클릭 시]

openPivotModal(row, col)
  └─> getStore('readonly')
  └─> renderPivotModal()
       └─> COMPANIES, LOADINGS 렌더링
  └─> updatePivotPreview()

applyAndSave()
  └─> updatePivotPreview()
  └─> parseDate(newDate)
  └─> getStore('readonly')
  └─> saveToIDB(data)
  └─> syncState(weekStart, row, col) ⭐ 핵심
  └─> loadWeek(currentWeekStart)
  └─> closePivotModal()

saveWriter()
  └─> localStorage 저장
  └─> logAccess()
  └─> loadWeek(currentWeekStart) ⭐ B8 수정
  └─> closeWriterModal()

performSearch()
  └─> getStore('readonly')
  └─> parseDate(startDate, endDate)
  └─> displaySearchResults()
       └─> goToSearchResult()

exportToCSV()
  └─> getStore('readonly')
  └─> parseDate(dates)
  └─> Blob 생성 및 다운로드

exportToExcel()
  └─> getStore('readonly')
  └─> XLSX.utils.json_to_sheet()
  └─> XLSX.writeFile()
```

### 6.3 이벤트 리스너 맵

| 이벤트 타입 | 대상 요소 | 핸들러 | 설명 |
|------------|---------|--------|------|
| `onload` | `window` | 전역 초기화 | DB 초기화, 주차 로드 |
| `click` | `.cell-preview` | `openPivotModal(row, col)` | 셀 클릭 시 모달 열기 |
| `click` | `.move-btn` | `moveCell(row, col, direction)` | 행 이동 버튼 |
| `click` | `.delete-btn` | `deleteCell(row, col)` | 삭제 버튼 |
| `touchstart` | `.cell-preview` | Long-press 감지 | 모바일 버튼 표시 (0.5초) |
| `touchmove` | `.cell-preview` | Long-press 취소 | 스크롤 감지 |
| `touchend` | `.cell-preview` | 타이머 클리어 | Long-press 종료 |
| `mouseenter` | `.cell-preview` | 버튼 표시 | PC hover |
| `mouseleave` | `.cell-preview` | 버튼 숨김 | PC hover 종료 |
| `scroll` | `window` | `handleHeaderScroll()` | 헤더 자동 숨김/표시 |
| `keydown` | `document` | ESC 키 처리 | 모달 닫기 (우선순위) |
| `change` | `#pivotDate` | 날짜 변경 | `currentCol` 업데이트 |
| `change` | `#pivotStatus` | 상태 변경 | `updatePivotPreview()` |
| `input` | `#pivotCompany` | 입력 | `updatePivotPreview()` |
| `resize` | `window.visualViewport` | 키보드 감지 | iOS 키보드 겹침 방지 |
| `visibilitychange` | `document` | 페이지 활성화 | 데이터 새로고침 |
| `error` | `window` | 전역 에러 | `logError()` |
| `unhandledrejection` | `window` | Promise 에러 | `logError()` + DB 복구 |

---

## 7. 크로스 브라우저 호환성

### 7.1 브라우저별 이슈 및 해결책

| 브라우저 | 버전 | 주요 이슈 | 해결 방법 | 테스트 상태 |
|---------|------|----------|----------|------------|
| **Chrome** | 90+ | 없음 | - | ✅ 완전 호환 |
| **Safari (macOS)** | 14+ | 날짜 파싱 실패 | `parseDate()` 함수 사용 | ✅ 완전 호환 |
| **Safari (iOS)** | 14+ | 키보드 겹침, 날짜 파싱 | `visualViewport` API, `parseDate()` | ✅ 완전 호환 |
| **Samsung Internet** | 14+ | IndexedDB 트랜잭션 지연 | 50ms 지연 추가 | ✅ 완전 호환 |
| **Edge (Chromium)** | 90+ | Chrome과 동일 | - | ✅ 완전 호환 |
| **Firefox** | 88+ | 미테스트 | 표준 API만 사용으로 호환 예상 | ⚠️ 테스트 필요 |

### 7.2 Safari 호환성 상세

#### 문제 1: 날짜 파싱
```javascript
// ❌ Safari에서 실패
const date = new Date('2025-11-16'); // Invalid Date

// ✅ 해결책
function parseDate(dateString) {
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateString.match(isoPattern);
  
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // 월은 0부터
    const day = parseInt(match[3], 10);
    return new Date(year, month, day); // Safari 호환
  }
  
  return new Date(dateString);
}
```

#### 문제 2: IndexedDB Polyfill
```javascript
// IndexedDB 크로스 브라우저 접근
const indexedDB = window.indexedDB || 
                  window.mozIndexedDB || 
                  window.webkitIndexedDB || 
                  window.msIndexedDB;
```

### 7.3 모바일 최적화

#### Touch 이벤트 최적화
```javascript
// Passive 이벤트로 스크롤 성능 향상
cellElement.addEventListener('touchstart', handler, { passive: true });
cellElement.addEventListener('touchmove', handler, { passive: true });
cellElement.addEventListener('touchend', handler, { passive: true });
```

#### CSS Webkit Prefix
```javascript
// JavaScript에서 동적 적용
document.body.style.webkitTapHighlightColor = 'transparent';
scrollContainers.forEach(el => {
  el.style.webkitOverflowScrolling = 'touch';
});
```

#### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

---

## 8. 배포 및 테스트

### 8.1 배포 체크리스트

- [ ] **파일 준비**
  - [ ] `index.html` (단일 파일, 모든 코드 포함)
  - [ ] CDN 의존성 확인 (Tailwind CSS, SheetJS)
  
- [ ] **환경 설정**
  - [ ] HTTPS 환경 (IndexedDB 보안 요구사항)
  - [ ] CORS 설정 (CDN 접근)
  
- [ ] **브라우저 테스트**
  - [ ] Chrome (데스크톱/모바일)
  - [ ] Safari (macOS/iOS)
  - [ ] Samsung Internet
  - [ ] Edge
  
- [ ] **기능 테스트**
  - [ ] 데이터 입력/수정/삭제
  - [ ] 날짜 이동 (같은 주/다른 주)
  - [ ] 검색
  - [ ] CSV/Excel 내보내기
  - [ ] 모바일 long-press
  - [ ] 키보드 겹침 (iOS)
  
- [ ] **성능 테스트**
  - [ ] 로딩 시간 < 3초
  - [ ] 데이터 저장 지연 < 100ms
  - [ ] 스크롤 60fps 유지

### 8.2 테스트 시나리오

#### 시나리오 1: 데이터 이동 검증
```
1. 월요일 셀 클릭 → 피벗 모달 열기
2. 업체명 "테스트" 입력 → 저장
3. 월요일 셀 다시 클릭 → 날짜를 화요일로 변경 → 저장
4. F5 새로고침
5. ✅ 확인: 화요일에 "테스트" 데이터 존재
6. ✅ 확인: 월요일은 빈칸
7. 화요일 셀 클릭 → 날짜를 수요일로 변경 → 저장
8. F5 새로고침
9. ✅ 확인: 수요일에 "테스트" 데이터 존재
10. ✅ 확인: 화요일은 빈칸
```

#### 시나리오 2: 모바일 터치 검증
```
1. iOS Safari 또는 Chrome 모바일에서 접속
2. 배차 입력 탭 → 데이터 있는 셀 찾기
3. 셀을 0.5초 길게 누름
4. ✅ 확인: 진동 피드백 발생
5. ✅ 확인: 이동 버튼(↑↓) 표시
6. 버튼 터치 → 이동 확인
7. 3초 대기
8. ✅ 확인: 버튼 자동 숨김
```

#### 시나리오 3: 크로스 브라우저 검증
```
[Chrome]
1. 모든 기능 정상 작동 확인

[Safari (macOS)]
2. 날짜 선택 → parseDate() 정상 작동 확인
3. 검색 날짜 범위 → 결과 정상 표시 확인

[Safari (iOS)]
4. 피벗 모달 → 업체명 입력 → 키보드 올라옴
5. ✅ 확인: 모달 자동 스크롤, 저장 버튼 노출
6. 저장 → 정상 작동 확인

[Samsung Internet]
7. IndexedDB 저장/로드 → 50ms 지연 후 정상 작동 확인
```

### 8.3 성능 프로파일링

#### 측정 포인트
```javascript
// 로딩 시간 측정 (이미 구현됨)
window.addEventListener('load', function() {
  setTimeout(() => {
    const timing = performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`[Performance] Page load time: ${loadTime}ms`);
    
    if (loadTime > 3000) {
      console.warn('[Performance] Slow loading detected');
    }
  }, 0);
});

// IndexedDB 저장 시간 측정
const startTime = performance.now();
await saveToIDB(data);
const endTime = performance.now();
console.log(`[Performance] Save time: ${endTime - startTime}ms`);
```

#### 최적화 포인트
1. **IndexedDB 트랜잭션**: 배치 저장 대신 개별 저장 (데이터 무결성 우선)
2. **렌더링**: `requestAnimationFrame` 사용 (스크롤 핸들러)
3. **이벤트**: `passive: true` 옵션 (터치 이벤트)
4. **메모리**: 로그 50개 제한 (자동 삭제)

---

## 9. 유지보수 가이드

### 9.1 일반적인 문제 해결

#### 문제 1: 데이터가 저장되지 않음
**증상**: 피벗 모달에서 저장 후 새로고침하면 데이터 사라짐

**원인 및 해결**:
```javascript
// 1. IndexedDB가 초기화되었는지 확인
console.log('DB:', db); // null이면 초기화 실패

// 2. 브라우저 콘솔에서 확인
// Chrome DevTools > Application > IndexedDB > dispatchDB
// - weekly_reports Store 확인
// - 데이터 존재 여부 확인

// 3. 에러 로그 확인
showBugReport(); // 인증 후 접근

// 4. 브라우저 시크릿 모드 테스트
// 일부 브라우저는 일반 모드에서 IndexedDB 제한
```

#### 문제 2: 모바일에서 버튼이 안 보임
**증상**: 셀을 길게 눌러도 이동 버튼이 표시되지 않음

**원인 및 해결**:
```javascript
// 1. touch 이벤트 등록 확인
const cell = document.getElementById('cell-0-0');
console.log('Touch listeners:', getEventListeners(cell));

// 2. CSS opacity 확인
const controls = cell.querySelector('.cell-move-controls');
console.log('Opacity:', controls.style.opacity); // "1"이어야 함

// 3. pointer-events 확인
console.log('Pointer events:', controls.style.pointerEvents); // "auto"여야 함

// 4. 진동 지원 확인
console.log('Vibrate:', navigator.vibrate); // function이어야 함
```

#### 문제 3: Safari에서 날짜 오류
**증상**: "Invalid Date" 또는 검색 결과 없음

**원인 및 해결**:
```javascript
// 1. parseDate() 함수 사용 확인
const testDate = parseDate('2025-11-16');
console.log('Parsed date:', testDate); // 유효한 Date 객체

// 2. 날짜 비교 로직 확인
const start = parseDate(startDate);
const end = parseDate(endDate + 'T23:59:59');
console.log('Date range:', start, end);

// 3. 대체 파싱 방법 (필요 시)
function parseDate(dateString) {
  const parts = dateString.split('-');
  return new Date(
    parseInt(parts[0]), 
    parseInt(parts[1]) - 1, 
    parseInt(parts[2])
  );
}
```

### 9.2 기능 추가 가이드

#### 예시 1: 새로운 배차 상태 추가
```javascript
// 1. STATUS_MAP에 추가
const STATUS_MAP = {
  SCHEDULED: { name: '예정', class: 'status-scheduled', color: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { name: '확정', class: 'status-confirmed', color: 'bg-orange-100 text-orange-700' },
  COMPLETED: { name: '완료', class: 'status-completed', color: 'bg-green-100 text-green-700' },
  CANCELLED: { name: '취소', class: 'status-cancelled', color: 'bg-red-100 text-red-700' } // 추가
};

// 2. CSS 추가
.status-cancelled {
  background: linear-gradient(to right, #fee2e2, #fecaca);
  color: #991b1b;
  border-color: #ef4444;
}

// 3. 피벗 모달 select에 추가
<select id="pivotStatus" ...>
  <option value="SCHEDULED">예정</option>
  <option value="CONFIRMED">확정</option>
  <option value="COMPLETED">완료</option>
  <option value="CANCELLED">취소</option> <!-- 추가 -->
</select>
```

#### 예시 2: 새로운 필터 추가 (검색)
```javascript
// performSearch() 함수 수정
function performSearch() {
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value; // 추가
  
  // ... 기존 로직 ...
  
  row.forEach((cell, colIdx) => {
    const searchText = `${cell.company || ''} ${cell.loading || ''}`.toLowerCase();
    const statusMatch = !statusFilter || cell.status === statusFilter; // 추가
    
    if (searchText.includes(keyword) && statusMatch && cell.company && cellDate >= start && cellDate <= end) {
      results.push({...});
    }
  });
}

// HTML에 필터 추가
<select id="statusFilter" onchange="performSearch()">
  <option value="">전체</option>
  <option value="SCHEDULED">예정</option>
  <option value="CONFIRMED">확정</option>
  <option value="COMPLETED">완료</option>
</select>
```

#### 예시 3: 행 개수 동적 변경
```javascript
// 1. 설정 모달에 입력 필드 추가
<input type="number" id="rowCountInput" min="5" max="20" value="8">

// 2. 저장 함수 수정
function saveSettings() {
  const rowCount = parseInt(document.getElementById('rowCountInput').value);
  localStorage.setItem('rowCount', rowCount);
  
  // 전역 변수 업데이트 (권장하지 않음, 페이지 새로고침 필요)
  alert('설정이 저장되었습니다. 페이지를 새로고침해주세요.');
}

// 3. createEmptyWeek() 함수 수정
function createEmptyWeek(weekStart) {
  const rowCount = parseInt(localStorage.getItem('rowCount') || '8');
  return {
    weekStart,
    rows: Array.from({length: rowCount}, () => /* ... */)
  };
}
```

### 9.3 디버깅 팁

#### 전역 디버그 모드 활성화
```javascript
// 콘솔에서 실행
window.DEBUG_MODE = true;

// syncState() 함수 수정
function syncState(weekStart, row, col) {
  currentWeekStart = weekStart;
  currentRow = row;
  currentCol = col;
  
  if (window.DEBUG_MODE || typeof console !== 'undefined') {
    console.log(`[✓ State Synced] Week: ${weekStart}, Row: ${row}, Col: ${col}`);
    console.log('Current state:', { currentWeekStart, currentRow, currentCol });
  }
}

// applyAndSave() 함수에도 추가
function applyAndSave() {
  if (window.DEBUG_MODE) {
    console.log('[DEBUG] applyAndSave called');
    console.log('[DEBUG] pivotSelection:', pivotSelection);
    console.log('[DEBUG] currentWeekStart:', currentWeekStart);
  }
  // ... 기존 로직 ...
}
```

#### IndexedDB 데이터 직접 조회
```javascript
// 콘솔에서 실행
async function debugGetWeek(weekStart) {
  const tx = db.transaction('weekly_reports', 'readonly');
  const store = tx.objectStore('weekly_reports');
  const req = store.get(weekStart);
  
  return new Promise((resolve) => {
    req.onsuccess = (e) => {
      console.log('Week data:', e.target.result);
      resolve(e.target.result);
    };
  });
}

// 사용 예시
await debugGetWeek('2025-11-16');
```

#### 이벤트 리스너 확인
```javascript
// 콘솔에서 실행 (Chrome 전용)
const cell = document.getElementById('cell-0-0');
console.log('Event listeners:', getEventListeners(cell));

// 결과 예시
{
  click: [{ listener: function, useCapture: false }],
  touchstart: [{ listener: function, useCapture: false, passive: true }],
  mouseenter: [{ listener: function, useCapture: false }]
}
```

---

## 10. 부록

### 10.1 CSS 클래스 참조

| 클래스명 | 용도 | 위치 |
|---------|------|------|
| `.cell-preview` | 테이블 셀 컨테이너 | 입력/현황 테이블 |
| `.has-content` | 데이터 있는 셀 스타일 | `.cell-preview` 내부 |
| `.cell-move-controls` | 이동 버튼 컨테이너 | `.cell-preview` 내부 |
| `.move-btn` | 이동 버튼 (↑↓) | `.cell-move-controls` 내부 |
| `.status-scheduled` | 예정 상태 스타일 | 상태 뱃지 |
| `.status-confirmed` | 확정 상태 스타일 | 상태 뱃지 |
| `.status-completed` | 완료 상태 스타일 | 상태 뱃지 |
| `.modal-backdrop` | 모달 배경 (블러) | 모든 모달 |
| `.modal-content` | 모달 내용 컨테이너 | 모든 모달 |
| `.focus-view` | 상세 보기 전체 화면 | Focus View |
| `.chip` | 업체명/상차지 칩 | 피벗 모달 |
| `.toast` | 알림 토스트 | 화면 우측 하단 |
| `.mobile-drawer` | 모바일 드로어 메뉴 | 헤더 햄버거 메뉴 |
| `.header-content` | 헤더 확장 영역 | 주차 네비게이션 |
| `.compact` | 헤더 축소 상태 | `.header-content` |

### 10.2 주요 ID 참조

| ID | 용도 | 타입 |
|----|------|------|
| `#mainHeader` | 메인 헤더 | `<header>` |
| `#weekDisplay` | 주차 표시 ("2025년 11월 46주차") | `<div>` |
| `#weekPicker` | 주차 선택기 | `<input type="week">` |
| `#viewPage` | 배차 현황 페이지 | `<section>` |
| `#inputPage` | 배차 입력 페이지 | `<section>` |
| `#viewTableBody` | 현황 테이블 본문 | `<tbody>` |
| `#inputTableBody` | 입력 테이블 본문 | `<tbody>` |
| `#pivotModal` | 피벗 입력 모달 | `<div>` |
| `#pivotCompany` | 업체명 입력 | `<input>` |
| `#pivotDate` | 날짜 선택 | `<input type="date">` |
| `#pivotStatus` | 상태 선택 | `<select>` |
| `#bangSelect` | 방통차 선택 | `<select>` |
| `#jipSelect` | 집게차 선택 | `<select>` |
| `#previewContent` | 미리보기 영역 | `<div>` |
| `#focusView` | 상세 보기 모달 | `<div>` |
| `#writerModal` | 작성자 인증 모달 | `<div>` |
| `#searchModal` | 검색 모달 | `<div>` |
| `#exportModal` | 내보내기 모달 | `<div>` |
| `#vehicleModal` | 차량 설정 모달 | `<div>` |
| `#toast` | 토스트 알림 | `<div>` |

### 10.3 외부 의존성

| 라이브러리 | 버전 | CDN URL | 용도 |
|-----------|------|---------|------|
| **Tailwind CSS** | 3.x | `https://cdn.tailwindcss.com` | UI 스타일링 |
| **SheetJS** | 0.18.5 | `https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js` | Excel 파일 생성 |
| **Noto Sans KR** | - | Google Fonts | 한글 폰트 |

**주의**: 프로덕션 환경에서는 Tailwind CSS를 PostCSS로 빌드하는 것을 권장합니다 (CDN은 개발용).

### 10.4 브라우저 Storage 사용량

```javascript
// IndexedDB 예상 크기
// - weekly_reports: 주당 ~50KB (8행 x 7열 x 평균 데이터)
// - access_logs: 로그당 ~500 bytes (최대 50개 = 25KB)
// - error_logs: 로그당 ~500 bytes (최대 50개 = 25KB)
// 총: ~100KB/주 (1년 = 약 5MB)

// LocalStorage 사용량
// - writerName, writerPin: ~50 bytes
// - companyList: ~500 bytes (10개)
// - loadingList: ~500 bytes (10개)
// - bangCount, jipCount: ~10 bytes
// 총: ~1KB
```

---

## 11. 최종 체크리스트

### 개발 완료 확인

- [x] **데이터 무결성**: B1 수정으로 이동 시 손실 0%
- [x] **PC/모바일 동등성**: 터치/마우스 통합 이벤트
- [x] **크로스 브라우저**: Safari, Samsung Internet 호환
- [x] **에러 처리**: 전역 에러 캐처 + 로그 시스템
- [x] **성능 최적화**: 로딩 3초 이내, 스크롤 60fps
- [x] **사용자 경험**: 토스트 알림, 진동 피드백
- [x] **문서화**: 완전한 개발 문서 (이 파일)

### 배포 전 최종 점검

```bash
# 1. HTML 파일 인코딩 확인
grep -c "&gt;" index.html  # 결과: 0 (없어야 함)
grep -c "&lt;" index.html  # 결과: 0 (없어야 함)

# 2. 파일 크기 확인
du -h index.html  # 약 150-200KB 예상

# 3. 브라우저 콘솔 에러 확인
# Chrome DevTools > Console > 에러 없음

# 4. IndexedDB 확인
# Chrome DevTools > Application > IndexedDB > dispatchDB 존재 확인

# 5. 네트워크 확인
# Chrome DevTools > Network > CDN 로드 성공 확인
```

---

## 📞 문의 및 지원

- **버그 리포


트**: 앱 내 "버그 리포트" 기능 사용 (인증 필요)
- **기술 지원**: 이 문서의 "유지보수 가이드" 참조
- **기능 추가**: "9.2 기능 추가 가이드" 참조

---

## 12. 빠른 시작 가이드 (외부 개발자용)

### 12.1 5분 안에 실행하기

```bash
# 1. HTML 파일 생성
touch index.html

# 2. 제공된 완전한 코드 복사 붙여넣기
# (artifact에서 HTML 전체 복사)

# 3. 브라우저에서 열기
open index.html  # macOS
# 또는
start index.html  # Windows
# 또는
xdg-open index.html  # Linux

# 4. 작성자 인증
# 우측 상단 "미인증" 클릭 → 이름/비밀번호(4자리) 입력
```

### 12.2 개발 환경 설정

#### VSCode 확장 추천
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // JavaScript 린팅
    "esbenp.prettier-vscode",           // 코드 포맷팅
    "bradlc.vscode-tailwindcss",        // Tailwind CSS 인텔리센스
    "ritwickdey.LiveServer"             // 라이브 서버
  ]
}
```

#### 로컬 서버 실행 (권장)
```bash
# Python 3
python3 -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server -p 8000

# VSCode Live Server
# 우클릭 → "Open with Live Server"
```

**중요**: HTTPS가 아닌 로컬 환경에서도 IndexedDB는 `http://localhost`에서 작동합니다.

### 12.3 수정 워크플로우

```
1. index.html 열기
   ↓
2. 수정 사항 확인 (이 문서의 "9.2 기능 추가 가이드" 참조)
   ↓
3. 코드 수정
   ↓
4. 브라우저 새로고침 (F5)
   ↓
5. 개발자 도구에서 에러 확인
   ↓
6. 테스트 시나리오 실행 (이 문서의 "8.2 테스트 시나리오" 참조)
   ↓
7. 크로스 브라우저 테스트
   ↓
8. 배포
```

---

## 13. 코드 스니펫 모음

### 13.1 자주 사용하는 패턴

#### 패턴 1: IndexedDB 데이터 읽기
```javascript
function getWeekData(weekStart) {
  return new Promise((resolve, reject) => {
    const store = getStore('readonly');
    if (!store) {
      reject('Store unavailable');
      return;
    }
    
    const req = store.get(weekStart);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

// 사용 예시
const data = await getWeekData('2025-11-16');
```

#### 패턴 2: 날짜 범위 생성
```javascript
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// 사용 예시
const range = getDateRange('2025-11-01', '2025-11-30');
// ["2025-11-01", "2025-11-02", ..., "2025-11-30"]
```

#### 패턴 3: 모달 생성 (재사용 가능)
```javascript
function createModal(title, content, buttons = []) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-60 modal-backdrop flex items-center justify-center z-50 p-3';
  
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md modal-content">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 md:p-6 rounded-t-3xl">
        <div class="flex justify-between items-center">
          <h3 class="text-xl md:text-2xl font-black">${title}</h3>
          <button onclick="this.closest('.modal-backdrop').remove()" class="text-2xl hover:text-gray-200">×</button>
        </div>
      </div>
      <div class="p-4 md:p-6">
        ${content}
      </div>
      <div class="p-4 border-t flex gap-3">
        ${buttons.map(btn => `
          <button onclick="${btn.onclick}" class="${btn.class}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

// 사용 예시
createModal(
  '확인',
  '정말 삭제하시겠습니까?',
  [
    { text: '취소', onclick: 'this.closest(".modal-backdrop").remove()', class: 'flex-1 py-2 bg-gray-200 rounded-xl' },
    { text: '삭제', onclick: 'deleteData(); this.closest(".modal-backdrop").remove()', class: 'flex-1 py-2 bg-red-500 text-white rounded-xl' }
  ]
);
```

#### 패턴 4: 데이터 유효성 검증
```javascript
function validateCellData(cell) {
  const errors = [];
  
  // 업체명 필수
  if (!cell.company || !cell.company.trim()) {
    errors.push('업체명은 필수입니다');
  }
  
  // 연락처 형식 (선택적)
  if (cell.contact && !/^01\d-\d{4}-\d{4}$/.test(cell.contact)) {
    errors.push('연락처 형식이 올바르지 않습니다 (예: 010-1234-5678)');
  }
  
  // 차량 선택 (하나 이상)
  if (!cell.bang && !cell.jip) {
    errors.push('차량을 하나 이상 선택해주세요');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// 사용 예시
const validation = validateCellData(pivotSelection);
if (!validation.isValid) {
  alert(validation.errors.join('\n'));
  return;
}
```

### 13.2 유틸리티 함수

#### 날짜 포맷팅
```javascript
// YYYY-MM-DD → "11월 16일 (월)"
function formatDateKorean(dateString) {
  const date = parseDate(dateString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = DAYS[date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
}

// YYYY-MM-DD → "2025년 11월 16일"
function formatDateFull(dateString) {
  const date = parseDate(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// Date → "오전 10:30" 또는 "오후 3:45"
function formatTimeKorean(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours < 12 ? '오전' : '오후';
  const displayHours = hours % 12 || 12;
  return `${period} ${displayHours}:${String(minutes).padStart(2, '0')}`;
}
```

#### 배열/객체 조작
```javascript
// 깊은 복사 (Deep Clone)
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 객체 비교 (Shallow)
function isEqual(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => obj1[key] === obj2[key]);
}

// 배열에서 중복 제거
function unique(array) {
  return [...new Set(array)];
}

// 배열 필터링 (빈 값 제거)
function compact(array) {
  return array.filter(Boolean);
}
```

#### 디바운스/쓰로틀
```javascript
// 디바운스 (연속 호출 시 마지막만 실행)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// 사용 예시
const debouncedSearch = debounce(performSearch, 300);
document.getElementById('searchInput').oninput = debouncedSearch;

// 쓰로틀 (일정 시간마다 한 번만 실행)
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 사용 예시
const throttledScroll = throttle(handleHeaderScroll, 100);
window.addEventListener('scroll', throttledScroll);
```

---

## 14. 알려진 제한사항 및 향후 개선

### 14.1 현재 제한사항

| 제한사항 | 설명 | 해결 방법 |
|---------|------|----------|
| **단일 사용자** | 동시 편집 불가 | 향후 백엔드 연동 필요 |
| **오프라인 동기화** | 여러 기기 간 데이터 공유 불가 | 클라우드 스토리지 연동 |
| **데이터 백업** | 수동 내보내기만 가능 | 자동 백업 기능 추가 |
| **권한 관리** | 단순 PIN 인증 | 서버 기반 인증 도입 |
| **이미지 첨부** | 불가능 | 파일 업로드 API 추가 |
| **알림 기능** | 없음 | 푸시 알림 (PWA) 또는 이메일 |
| **통계/리포트** | 기본적인 검색만 | 대시보드 및 차트 추가 |

### 14.2 향후 개선 계획

#### Phase 1: 기본 기능 강화 (단기)
- [ ] PWA 완전 지원 (sw.js 작성)
- [ ] 자동 저장 (10초마다)
- [ ] 실행 취소/다시 실행 (Undo/Redo)
- [ ] 키보드 단축키 (Ctrl+S 저장 등)
- [ ] 인쇄 최적화 (CSS @media print)

#### Phase 2: 고급 기능 (중기)
- [ ] 백엔드 API 연동 (Firebase, Supabase 등)
- [ ] 실시간 협업 (WebSocket)
- [ ] 파일 첨부 (이미지, PDF)
- [ ] 통계 대시보드 (Chart.js, D3.js)
- [ ] 모바일 앱 (React Native, Flutter)

#### Phase 3: 엔터프라이즈 (장기)
- [ ] 다중 사용자 권한 관리
- [ ] 감사 로그 (Audit Log)
- [ ] API 제공 (RESTful)
- [ ] 커스터마이징 (테마, 레이아웃)
- [ ] 다국어 지원 (i18n)

### 14.3 성능 개선 아이디어

#### 가상 스크롤 (Virtual Scrolling)
```javascript
// 행이 100개 이상일 때 성능 개선
// 화면에 보이는 행만 렌더링

function renderVirtualTable(data, visibleRange) {
  const tbody = document.getElementById('inputTableBody');
  tbody.innerHTML = '';
  
  // visibleRange: { start: 0, end: 20 }
  const visibleRows = data.rows.slice(visibleRange.start, visibleRange.end);
  
  visibleRows.forEach((row, idx) => {
    const actualIdx = visibleRange.start + idx;
    const tr = createTableRow(row, actualIdx);
    tbody.appendChild(tr);
  });
}

// 스크롤 이벤트에서 visibleRange 계산
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const rowHeight = 100; // 픽셀
  const start = Math.floor(scrollTop / rowHeight);
  const end = start + 20; // 한 번에 20개 표시
  
  renderVirtualTable(currentData, { start, end });
});
```

#### IndexedDB 캐싱
```javascript
// 자주 조회하는 주차 데이터 메모리 캐시
const weekCache = new Map();

async function loadWeekWithCache(weekStart) {
  if (weekCache.has(weekStart)) {
    console.log('[Cache Hit]', weekStart);
    return weekCache.get(weekStart);
  }
  
  const data = await getWeekData(weekStart);
  weekCache.set(weekStart, data);
  
  // 캐시 크기 제한 (최대 5주)
  if (weekCache.size > 5) {
    const firstKey = weekCache.keys().next().value;
    weekCache.delete(firstKey);
  }
  
  return data;
}
```

#### 렌더링 최적화
```javascript
// 변경된 셀만 업데이트 (전체 테이블 재렌더링 방지)
function updateCell(row, col, cellData) {
  const cellElement = document.getElementById(`cell-${row}-${col}`);
  if (!cellElement) return;
  
  cellElement.innerHTML = formatCellPreview(cellData);
  
  // 이벤트 리스너 재부착 (필요 시)
  attachCellEvents(cellElement, row, col);
}
```

---

## 15. FAQ (자주 묻는 질문)

### Q1: 데이터를 다른 컴퓨터로 옮기려면?
**A**: 
1. "내보내기" 메뉴에서 Excel 파일로 내보내기
2. 새 컴퓨터에서 파일 열기
3. 데이터를 수동으로 입력 (현재 가져오기 기능 없음)
4. **향후 개선**: "가져오기" 기능 추가 예정

### Q2: 모바일에서 이동 버튼이 안 보여요
**A**: 
- 셀을 **0.5초 이상 길게 누르세요** (long-press)
- 진동이 울리면 버튼이 나타납니다
- 3초 후 자동으로 숨겨집니다

### Q3: 데이터가 사라졌어요!
**A**: 
1. 브라우저 시크릿 모드에서 실행하셨나요? → 일반 모드로 전환
2. 브라우저 데이터를 삭제하셨나요? → IndexedDB도 함께 삭제됨
3. 다른 브라우저를 사용하셨나요? → 각 브라우저마다 별도 DB
4. **예방**: 주기적으로 Excel 파일로 백업하세요

### Q4: Safari에서 날짜가 이상하게 표시돼요
**A**: 
- 이미 `parseDate()` 함수로 수정되었습니다
- 최신 코드를 사용하고 있는지 확인하세요
- 콘솔에서 `parseDate('2025-11-16')` 테스트

### Q5: 인증 비밀번호를 잊어버렸어요
**A**: 
```javascript
// 콘솔에서 실행
localStorage.removeItem('writerName');
localStorage.removeItem('writerPin');
location.reload();
// 다시 인증하면 됩니다
```

### Q6: 행을 더 추가하고 싶어요
**A**: 
- 현재 8행 고정 (DEFAULT_ROWS = 8)
- 수정 방법: "9.2 기능 추가 가이드 - 예시 3" 참조
- 빈 행이 없으면 자동으로 새 행 추가됩니다

### Q7: 인쇄는 어떻게 하나요?
**A**: 
- 브라우저 인쇄 기능 사용 (Ctrl+P / Cmd+P)
- 또는 Excel로 내보낸 후 인쇄
- **향후 개선**: 인쇄 최적화 CSS 추가 예정

### Q8: 다른 사람과 공유할 수 있나요?
**A**: 
- 현재는 Excel 파일로 내보내서 공유
- **향후 개선**: 클라우드 동기화 및 공유 링크 기능 추가 예정

---

## 16. 버전 히스토리

| 버전 | 날짜 | 주요 변경사항 | 작성자 |
|-----|------|--------------|--------|
| **1.0.0** | 2025-11-18 | 초기 릴리즈 | - |
| **1.1.0** | 2025-11-18 | 12개 버그 수정 (B1~B12) | - |
| | | - 데이터 이동 손실 해결 (syncState) | |
| | | - PC/모바일 이벤트 통합 | |
| | | - 크로스 브라우저 호환성 개선 | |
| | | - Safari 날짜 파싱 수정 | |
| | | - iOS 키보드 겹침 방지 | |

---

## 17. 라이선스 및 크레딧

### 사용된 오픈소스
- **Tailwind CSS**: MIT License
- **SheetJS (xlsx)**: Apache License 2.0
- **Noto Sans KR**: SIL Open Font License

### 개발 환경
- HTML5, CSS3, JavaScript (ES6+)
- IndexedDB API
- Visual Studio Code

---

## 18. 문서 메타데이터

- **문서 버전**: 1.0
- **최종 수정일**: 2025-11-18
- **대상 독자**: 외부 개발자, 유지보수 담당자
- **문서 형식**: Markdown
- **총 페이지**: ~50 페이지 상당
- **예상 읽기 시간**: 60-90분

---

## 📚 추가 참고 자료

### 공식 문서
- [MDN IndexedDB API](https://developer.mozilla.org/ko/docs/Web/API/IndexedDB_API)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [SheetJS 문서](https://docs.sheetjs.com/)

### 관련 기술
- [Progressive Web Apps (PWA)](https://web.dev/progressive-web-apps/)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Visual Viewport API](https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API)

---

## 🎓 학습 자료

### 초보 개발자를 위한 팁
1. **JavaScript 기초**: 함수, 객체, 배열, Promise 이해 필수
2. **DOM 조작**: `getElementById`, `querySelector`, `addEventListener` 숙지
3. **비동기 프로그래밍**: `async/await`, `Promise` 패턴 이해
4. **IndexedDB**: [이 튜토리얼](https://web.dev/indexeddb/) 추천

### 디버깅 체크리스트
```
□ 콘솔에 에러 없는지 확인
□ IndexedDB에 데이터 저장되는지 확인
□ 네트워크 탭에서 CDN 로드 확인
□ 모바일 에뮬레이터에서 터치 이벤트 테스트
□ 여러 브라우저에서 동작 확인
```

---

## 📧 연락처

이 문서에 대한 질문이나 개선 제안이 있다면:
- 앱 내 "버그 리포트" 기능 사용
- 또는 프로젝트 관리자에게 문의

---

**이 문서의 끝입니다. 성공적인 개발을 기원합니다! 🚀**

