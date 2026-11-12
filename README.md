# 찾아줘

학교에서 발견한 분실물을 등록하고, 이름으로 검색하고, 정보를 수정하는 웹앱입니다. 관리자 화면에서는 반환 상태 변경과 삭제도 할 수 있습니다. 데이터는 `data/findit.sqlite` 파일에 저장됩니다.

## 준비물

- Node.js 22.5 이상 (현재 Node.js 24가 설치되어 있다면 사용 가능)
- 인터넷 연결 (Express 설치 시 필요)

## 설치 및 실행

프로젝트 폴더에서 아래 명령을 순서대로 실행하세요.

```powershell
npm install
$env:ADMIN_PASSWORD = "원하는관리자비밀번호"
$env:SESSION_SECRET = "길고임의의문자열"
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 일반 화면을 볼 수 있습니다. 관리자 화면은 [http://localhost:3000/admin/login](http://localhost:3000/admin/login)에서 설정한 관리자 비밀번호로 로그인하세요.

서버를 중지하려면 터미널에서 `Ctrl+C`를 누릅니다. 다시 실행할 때도 `npm start`를 사용하세요. SQLite 파일은 프로젝트의 `data` 폴더에 남으므로, 서버를 재시작해도 등록한 정보가 유지됩니다.

## 주요 API

- `GET /api/items` — 전체 목록 조회
- `GET /api/items?search=우산` — 물건 이름 검색
- `POST /api/items` — 분실물 등록 (이름, 발견 장소, 보관 장소 필수)
- `PUT /api/items/:id` — 일반 정보 수정
- `PUT /api/admin/items/:id` — 관리자 전용 정보 및 반환 상태 수정
- `DELETE /api/admin/items/:id` — 관리자 전용 삭제
- `POST /api/admin/login` — 관리자 로그인
- `POST /api/admin/logout` — 관리자 로그아웃

Node.js 내장 `node:sqlite`와 Express를 사용합니다. 관리자 비밀번호와 세션 암호는 서버를 실행하는 터미널에서 환경 변수로 설정하며, 서버가 실행 중인 동안 그 터미널을 닫지 마세요. 배포할 때는 반드시 강한 비밀번호와 세션 암호를 설정하고 HTTPS를 사용하세요.
