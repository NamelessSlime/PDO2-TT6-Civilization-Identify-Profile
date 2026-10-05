# 예시 파일 (examples)

`index.html`과 같은 위치의 `examples` 폴더에 `.json` 파일을 넣으면 예시 탭에 자동으로 나타납니다.

- 파일 하나가 예시 하나입니다. 배열로 여러 개를 한 파일에 넣어도 됩니다.
- 표시 순서는 파일 이름 순서입니다. 앞에 `01-`, `02-`처럼 번호를 붙이세요.
  **첫 번째 파일**은 홈 화면 미리보기와 편집 화면의 회색 예시 문구에도 쓰입니다.
- 이름이 `_` 또는 `.`으로 시작하는 파일과 `index.json`은 예시로 읽지 않습니다. (`_template.json`은 양식 견본)
- 자동 감지 방법: ① 서버가 폴더 목록을 보여 주면 그 목록, ② GitHub Pages(`*.github.io`)면 GitHub API로 폴더 목록,
  ③ 둘 다 안 되면 `examples/index.json`(파일 이름 배열)을 사용합니다.
- 파일을 더블클릭해서(`file://`) 열면 브라우저가 파일을 읽지 못합니다. GitHub Pages나 로컬 서버를 쓰세요.

## 항목

| 키 | 의미 |
| --- | --- |
| `n` | 문명 이름 |
| `w` | 세계관 이름 |
| `t` | 분류 태그 (소설, 게임 등) |
| `pd` | PDO2 선택 `[Principle, Direction, Operator, Objective]` 각 축에서 몇 번째 유형인지(0부터). Principle 0=M 1=P 2=A, Direction 0=I 1=O, Operator 0=C 1=I, Objective 0=S 1=E |
| `l` | TT6 단계 14개(0은 —). 순서: Ma Me St El Bi Mn Qu Nu Sp Te Ca Ae Mg An |
| `img` | 대표 이미지 주소(없으면 빈 문자열) |
| `why` | 판정 근거. `pdo`는 문자열, `nat` `ext` `mag` `ano`는 `[["표기","이유"], ...]` |
| `src` | 출처·한계 설명 |
