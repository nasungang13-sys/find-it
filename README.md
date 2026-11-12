# 찾아줘

학교에서 발견한 분실물을 등록하고, 이름으로 검색하고, 정보를 수정하는 웹앱입니다. 관리자 화면에서는 반환 상태 변경과 삭제도 할 수 있습니다. `DATABASE_URL`이 설정되어 있으면 PostgreSQL을, 없으면 `data/findit.sqlite`의 기존 SQLite 데이터를 사용합니다. 프론트엔드 파일도 Express가 함께 제공합니다.

## 준비물

- Node.js 22.5 이상 (현재 Node.js 24가 설치되어 있다면 사용 가능)
- 인터넷 연결 (Express 설치 시 필요)

## 로컬 설치 및 실행

Node.js 22.5 이상이 필요합니다. PowerShell에서 프로젝트 폴더로 이동한 뒤 아래 명령을 실행하세요.

```powershell
npm install
$env:ADMIN_PASSWORD = "강한관리자비밀번호"
$env:SESSION_SECRET = "충분히길고임의의임의문자열"
npm start
```

`DATABASE_URL`을 설정하지 않으면 기존 `data/findit.sqlite` 파일을 그대로 사용합니다. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 일반 화면을 볼 수 있습니다. 관리자 화면은 [http://localhost:3000/admin/login](http://localhost:3000/admin/login)에서 설정한 관리자 비밀번호로 로그인하세요.

서버를 중지하려면 터미널에서 `Ctrl+C`를 누릅니다. SQLite 파일은 프로젝트의 `data` 폴더에 남으므로, SQLite로 실행할 때 서버를 다시 시작해도 등록한 정보가 유지됩니다.

## Render 배포

Render의 Web Service 설정:

- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Environment:** `Node`

Render Web Service의 Environment에 다음 변수를 추가하세요.

- `DATABASE_URL` — Render PostgreSQL의 Internal Database URL을 입력합니다. 이 값은 비밀로 관리하고 코드에 넣지 마세요.
- `ADMIN_PASSWORD` — 관리 화면에 사용할 강한 관리자 비밀번호입니다.
- `SESSION_SECRET` — 길고 예측하기 어려운 무작위 문자열입니다.
- `NODE_ENV` — `production`으로 설정합니다.
- `PORT` — Render가 자동으로 지정하므로 직접 설정하지 않아도 됩니다.

서버는 `0.0.0.0`과 `process.env.PORT`에서 요청을 받습니다. PostgreSQL 연결에 성공하면 `items` 테이블을 자동 생성합니다. Render의 PostgreSQL을 선택하면 SQLite의 기존 데이터가 자동으로 복사되지는 않으므로 필요한 데이터는 별도로 이전해야 합니다.

## 주요 API

- `GET /api/items` — 전체 목록 조회
- `GET /api/items?search=우산` — 물건 이름 검색
- `POST /api/items` — 분실물 등록 (이름, 발견 장소, 보관 장소 필수)
- `PUT /api/items/:id` — 일반 정보 수정
- `PUT /api/admin/items/:id` — 관리자 전용 정보 및 반환 상태 수정
- `DELETE /api/admin/items/:id` — 관리자 전용 삭제
- `POST /api/admin/login` — 관리자 로그인
- `POST /api/admin/logout` — 관리자 로그아웃

Express가 `public`의 일반 화면과 `/admin` 화면 파일을 함께 제공합니다. PostgreSQL은 `pg`, 로컬 SQLite는 Node.js 내장 `node:sqlite`를 사용합니다. 관리자 비밀번호와 세션 암호는 환경 변수로만 설정하세요. 배포 환경에서는 HTTPS와 강한 비밀번호, 무작위 세션 암호를 사용하세요.
