# TDS Mobile 컴포넌트 전체 레퍼런스
> 출처: https://tossmini-docs.toss.im/tds-mobile/
> 생성일: 2026-04-14

---

## 목차

### 파운데이션
- Colors
- Typography

### 단일 컴포넌트 (35개)
Badge | Board Row | Border | Bottom Info | Bottom Sheet | Bubble | Button | Checkbox | Grid List | Highlight | Icon Button | List Footer | List Header | Loader | Menu | Modal | Numeric Spinner | Paragraph | Post | Progress Bar | Progress Stepper | Rating | Result | Search Field | Segmented Control | Skeleton | Slider | Stepper | Switch | Tab | Table Row | Text Button | Toast | Tooltip | Top

### 그룹 컴포넌트 (8개)
- Agreement (V3, V4)
- Asset (이해하기, 활용하기, 래핑한 컴포넌트)
- BottomCTA (이해하기, Single, Double, FixedBottomCTA)
- Chart (Bar Chart)
- Dialog (이해하기, AlertDialog, ConfirmDialog)
- Keypad (Alphabet, Full Secure, Number)
- ListRow (이해하기, 영역 구성하기, ListRowLegacy)
- TextField (TextField, SplitTextField, TextArea)

### 유틸리티
- Overlay Extension (이해하기, useDialog, useToast, useBottomSheet)

---

## 1. Badge
> URL: https://tossmini-docs.toss.im/tds-mobile/components/badge/

Badge 컴포넌트는 항목의 상태를 빠르게 인식할 수 있도록 강조하는 데 사용돼요.

### 사용법

#### 크기 조정하기
size 속성: xsmall, small, medium, large

```jsx
<Badge size="xsmall" color="blue" variant="fill">xsmall</Badge>
<Badge size="small" color="blue" variant="fill">small</Badge>
<Badge size="medium" color="blue" variant="fill">medium</Badge>
<Badge size="large" color="blue" variant="fill">large</Badge>
```

#### 스타일
variant 속성: fill(채도 높음, 강렬), weak(채도 낮음, 부드러움)

```jsx
<Badge size="xsmall" color="blue" variant="fill">Badge</Badge>
<Badge size="xsmall" color="blue" variant="weak">Badge</Badge>
```

### 인터페이스 - BadgeProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| variant* | - | "fill" \| "weak" |
| size* | - | "xsmall" \| "small" \| "medium" \| "large" |
| color* | - | "blue" \| "teal" \| "green" \| "red" \| "yellow" \| "elephant" |

---

## 2. Board Row
> URL: https://tossmini-docs.toss.im/tds-mobile/components/board-row/

BoardRow는 제한된 공간에서 많은 정보를 깔끔하게 정리해 표시하는 컴포넌트예요. Q&A와 같은 정보를 표현할 때 사용하며, 아코디언 컴포넌트 역할.

### 사용법

```jsx
<BoardRow
  title="매도 환전이 무엇인가요?"
  prefix={<BoardRow.Prefix>Q</BoardRow.Prefix>}
  icon={<BoardRow.ArrowIcon />}
>
  <BoardRow.Text>주식 거래가 실시간이 아니기 때문에...</BoardRow.Text>
</BoardRow>
```

#### 패널 초기 열림: initialOpened 속성
#### 패널 외부 제어: isOpened + onOpen + onClose
#### 콘텐츠 영역: Post 컴포넌트 또는 BoardRow.Text 사용

### 인터페이스 - BoardRowProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| title* | - | React.ReactNode |
| initialOpened | false | boolean |
| isOpened | false | boolean |
| onOpen | - | () => void |
| onClose | - | () => void |
| prefix | - | React.ReactNode |
| icon | - | React.ReactNode |
| children | - | React.ReactNode |

---

## 3. Border
> URL: https://tossmini-docs.toss.im/tds-mobile/components/border/

Border 컴포넌트는 요소 간의 구분을 명확히 하고 싶을 때 사용. 리스트나 섹션을 구분하는 데 주로 사용.

### 사용법

```jsx
<Border variant="full" />      // 전체 너비 구분선
<Border variant="padding24" /> // 양쪽 24px 여백 구분선
<Border variant="height16" />  // 구간 나누기 (16px 높이)
```

### 인터페이스 - BorderProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| variant | "full" | "full" \| "padding24" \| "height16" |
| height | - | string |

---

## 4. Bottom Info
> URL: https://tossmini-docs.toss.im/tds-mobile/components/bottom-info/

BottomInfo 컴포넌트는 화면 하단에 중요한 정보나 주의사항을 표시. 법적 고지나 디스클레이머 안내에 유용. Post 컴포넌트와 함께 사용.

### 사용법

```jsx
<BottomInfo bottomGradient={`linear-gradient(${adaptive.greyBackground}, ${adaptive.blue100})`}>
  <Post.Ul paddingBottom={24} typography="t7">
    <Post.Li>대출기간 40년의 경우...</Post.Li>
  </Post.Ul>
</BottomInfo>
```

#### 그라디언트 조정: bottomGradient 속성
#### 그라디언트 없애기: bottomGradient="none"

### 인터페이스 - BottomInfoProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| bottomGradient | "linear-gradient(...)" | "none" \| "linear-gradient(${string})" |

---

## 5. Bottom Sheet
> URL: https://tossmini-docs.toss.im/tds-mobile/components/bottom-sheet/

BottomSheet 컴포넌트는 화면 하단에서 슬라이드 되어 나타나는 패널. 추가 설명을 보여주거나 특정 액션을 유도할 때 유용.

### 사용법

```jsx
<BottomSheet
  open={isOpen}
  onClose={() => setIsOpen(false)}
  header={<BottomSheet.Header>제목</BottomSheet.Header>}
  headerDescription={<BottomSheet.HeaderDescription>부제목</BottomSheet.HeaderDescription>}
  cta={<BottomSheet.CTA onClick={() => setIsOpen(false)}>확인</BottomSheet.CTA>}
>
  <Post.Paragraph>내용</Post.Paragraph>
</BottomSheet>
```

#### Double CTA: BottomSheet.DoubleCTA
#### 선택지: BottomSheet.Select
#### 포커스 유지: UNSAFE_disableFocusLock + disableDimmer

### 인터페이스 - BottomSheetProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| open* | - | boolean |
| header | - | any |
| headerDescription | - | any |
| cta | - | React.ReactNode |
| children | - | React.ReactNode |
| onClose | - | () => void |
| disableDimmer | false | boolean |
| hasTextField | false | boolean |
| expandBottomSheet | false | boolean |
| maxHeight | - | number (px) |
| expandedMaxHeight | - | number (px) |
| UNSAFE_disableFocusLock | - | boolean |
| UNSAFE_ignoreDimmerClick | - | boolean |

---

## 6. Bubble
> URL: https://tossmini-docs.toss.im/tds-mobile/components/bubble/

Bubble 컴포넌트는 대화형 UI에서 메시지를 표시. 색상과 말풍선 모양으로 나/상대방 구분.

### 사용법

```jsx
<Bubble background="grey" withTail>Hello</Bubble>  // 상대방
<Bubble background="blue" withTail>Hello</Bubble>  // 나
```

#### 꼬리: withTail={true|false}, grey=왼쪽, blue=오른쪽

### 인터페이스 - BubbleProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| background* | - | "blue" \| "grey" |
| withTail | true | boolean |
| children | - | React.ReactNode |

## 7. Button
> URL: https://tossmini-docs.toss.im/tds-mobile/components/button/

Button 컴포넌트는 사용자가 액션을 트리거할 때 사용. 폼 제출, 다이얼로그 열기, 삭제 등.

### 사용법

```jsx
<Button size="small">Small</Button>    // size: small, medium, large, xlarge
<Button color="primary" variant="fill">Primary</Button>  // fill: 강렬
<Button color="dark" variant="weak">Dark</Button>        // weak: 부드러움
<Button display="inline">Inline</Button>   // display: inline, block, full
<Button loading>로딩중</Button>
<Button disabled>비활성화</Button>
```

#### 색상 업데이트: CSS 변수 활용
- --button-color, --button-background-color, --button-disabled-opacity-color 등

### 인터페이스 - ButtonProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| as | 'button' | "button" \| "a" |
| color | 'primary' | "primary" \| "danger" \| "light" \| "dark" |
| variant | 'fill' | "fill" \| "weak" |
| display | 'inline' | "inline" \| "block" \| "full" |
| size | 'xlarge' | "small" \| "medium" \| "large" \| "xlarge" |
| loading | - | boolean |
| disabled | - | boolean |

---

## 8. Checkbox
> URL: https://tossmini-docs.toss.im/tds-mobile/components/checkbox/

Checkbox 컴포넌트는 하나 이상의 항목 선택. Circle/Line 두 가지 형태.

### 사용법

```jsx
<Checkbox.Circle defaultChecked={true} />  // 원형
<Checkbox.Line defaultChecked={true} />     // 라인형

// 외부 상태 관리
<Checkbox.Circle checked={checked} onCheckedChange={setChecked} />

// 라디오 버튼
<Checkbox.Circle inputType="radio" value="1" checked={checked === '1'} onChange={...} />
```

### 인터페이스 - CheckboxProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| inputType | 'checkbox' | "checkbox" \| "radio" |
| size | 24 | number |
| checked | - | boolean |
| onCheckedChange | - | (checked: boolean) => void |
| defaultChecked | - | boolean |
| disabled | - | boolean |

---

## 9. Grid List
> URL: https://tossmini-docs.toss.im/tds-mobile/components/grid-list/

GridList 컴포넌트는 그리드 형태로 아이템을 배치. 터치 시 확대 효과 제공.

### 사용법

```jsx
<GridList column={3}>  // column: 1, 2, 3
  <GridList.Item image={<img src="..." />}>아이템 1</GridList.Item>
</GridList>
```

### 인터페이스 - GridListProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| column | 3 | 1 \| 2 \| 3 |
| children | - | React.ReactNode |

---

## 10. Highlight
> URL: https://tossmini-docs.toss.im/tds-mobile/components/highlight/

Highlight 컴포넌트는 화면의 특정 영역을 강조. 열리면 강조 영역을 제외한 화면 전체가 어두워짐.

### 사용법

```jsx
<Highlight open padding={10} message="하이라이트 메시지" messageXAlignment="center">
  <div>하이라이팅될 아이템</div>
</Highlight>
```

### 인터페이스 - HighlightProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| open* | - | boolean |
| padding | 0 | number |
| delay | 0 | number (초) |
| message | - | string \| function |
| messageColor | colors.white | string |
| messageXAlignment | - | "left" \| "center" \| "right" |
| messageYAlignment | - | "top" \| "bottom" |
| onClick | - | () => void |

---

## 11. Icon Button
> URL: https://tossmini-docs.toss.im/tds-mobile/components/icon-button/

IconButton 컴포넌트는 아이콘으로 기능을 직관적으로 전달하면서 UI를 간결하게 유지.

### 사용법

```jsx
<IconButton
  src="https://static.toss.im/icons/svg/icon-search-bold-mono.svg"
  variant="clear"    // clear, fill, border
  color={adaptive.red500}
  bgColor={adaptive.greyOpacity100}
  iconSize={24}
  aria-label="검색하기"   // 필수!
/>
```

### 인터페이스 - IconButtonProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| aria-label* | - | string (필수) |
| variant | 'clear' | "fill" \| "clear" \| "border" |
| src | - | string |
| name | - | string |
| color | - | string |
| bgColor | adaptive.greyOpacity100 | string |
| iconSize | 24 | number |

---

## 12. List Footer
> URL: https://tossmini-docs.toss.im/tds-mobile/components/list-footer/

ListFooter 컴포넌트는 리스트 마지막에 "더 보기" 같은 기능 제공.

### 사용법

```jsx
<ListFooter icon="icon-plus-small-mono">더 보기</ListFooter>
<ListFooter border="indented" textColor={adaptive.grey600}>더 보기</ListFooter>
```

### 인터페이스 - ListFooterProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| border | full | "full" \| "indented" \| "none" |
| icon | - | string \| ReactElement |
| textColor | adaptive.blue500 | string |
| iconColor | adaptive.blue500 | string |
| children | - | string \| ReactElement |

---

## 13. List Header
> URL: https://tossmini-docs.toss.im/tds-mobile/components/list-header/

ListHeader 컴포넌트는 페이지나 섹션 상단에 배치. 제목, 설명, 상호작용 요소 제공.

### 사용법

```jsx
<ListHeader
  title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">타이틀</ListHeader.TitleParagraph>}
  right={<ListHeader.RightText typography="t7">악세사리</ListHeader.RightText>}
  description={<ListHeader.DescriptionParagraph>보조설명</ListHeader.DescriptionParagraph>}
  descriptionPosition="top"   // top | bottom
  rightAlignment="center"
/>
```

#### 제목 종류: TitleParagraph, TitleTextButton, TitleSelector
#### 오른쪽: RightText, RightArrow

### 인터페이스 - ListHeaderProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| title* | - | React.ReactNode |
| titleWidthRatio | 0.66 | number |
| description | undefined | React.ReactNode |
| descriptionPosition | 'top' | "top" \| "bottom" |
| right | undefined | React.ReactNode |
| rightAlignment | 'center' | "bottom" \| "center" |

---

## 14. Loader
> URL: https://tossmini-docs.toss.im/tds-mobile/components/loader/

Loader 컴포넌트는 콘텐츠 로드 중 시각적 피드백 제공.

### 사용법

```jsx
<Loader size="medium" type="primary" />  // size: small, medium, large
<Loader type="dark" />                    // type: primary, dark, light
<Loader label={'카드를\n불러오고있어요.'} />
```

### 인터페이스 - LoaderProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| size | 'medium' | "small" \| "medium" \| "large" |
| type | 'primary' | "primary" \| "dark" \| "light" |
| label | - | string |

---

## 15. Menu
> URL: https://tossmini-docs.toss.im/tds-mobile/components/menu/

Menu 컴포넌트는 드롭다운 메뉴로 항목을 선택/확인/변경.

### 사용법

```jsx
<Menu.Dropdown header={<Menu.Header>편집</Menu.Header>}>
  <Menu.DropdownItem>첫 번째 메뉴</Menu.DropdownItem>
  <Menu.DropdownItem right={<Menu.DropdownIcon name="icon-setting-mono" />}>두 번째</Menu.DropdownItem>
  <Menu.DropdownCheckItem checked={true}>체크 메뉴</Menu.DropdownCheckItem>
</Menu.Dropdown>

// 트리거로 열기
<Menu.Trigger open={open} onOpen={...} onClose={...} placement="bottom" dropdown={...}>
  <Button>클릭</Button>
</Menu.Trigger>
```

#### placement: top, bottom, left, right + -start, -end 조합

### 인터페이스 - MenuTriggerProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| open | - | boolean |
| defaultOpen | - | boolean |
| dropdown | - | React.ReactNode |
| placement | 'bottom-start' | "top" \| "bottom" \| "left" \| "right" + -start/-end |
| onOpen | - | () => void |
| onClose | - | () => void |

---

## 16. Modal
> URL: https://tossmini-docs.toss.im/tds-mobile/components/modal/

Modal 컴포넌트는 사용자의 주의가 필요한 중요한 내용 표시. 다른 콘텐츠 위에 나타남.

### 사용법

```jsx
<Modal open={open} onOpenChange={setOpen} onExited={() => alert('닫힘')}>
  <Modal.Overlay onClick={() => alert('오버레이 클릭')} />
  <Modal.Content style={{ padding: '32px 20px 20px 20px' }}>
    <p>내용</p>
    <Button onClick={() => setOpen(false)}>확인</Button>
  </Modal.Content>
</Modal>
```

### 인터페이스 - ModalProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| open | - | boolean |
| onOpenChange | - | (open: boolean) => void |
| onExited | - | () => void |
| portalContainer | document.body | HTMLElement |

## 21. Progress Stepper
> URL: https://tossmini-docs.toss.im/tds-mobile/components/progress-stepper/

ProgressStepper 컴포넌트는 프로그레스바와 스테퍼가 결합된 형태로, 작업의 진행 상태를 단계별로 시각적으로 표시.

### 사용법

```jsx
<ProgressStepper variant="compact" activeStepIndex={1}>
  <ProgressStep title="유심 신청" />
  <ProgressStep title="배송 완료" />
  <ProgressStep title="개통 완료" />
</ProgressStepper>

// icon 변형 + 완료 체크
<ProgressStepper variant="icon" activeStepIndex={2} checkForFinish>
  <ProgressStep title="첫 번째" />
  <ProgressStep title="두 번째" />
  <ProgressStep title="세 번째" />
</ProgressStepper>

// 단계별 아이콘 설정
<ProgressStep title="동해물과" icon={<Asset.Icon name="icon-home-mono" />} />
```

### 인터페이스 - ProgressStepperProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| variant* | - | "compact" \| "icon" |
| paddingTop | 'default' | "default" \| "wide" (24px) |
| activeStepIndex | 0 | number |
| checkForFinish | false | boolean (icon variant 전용) |

### ProgressStepProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| title | - | string |
| icon | - | React.ReactNode (icon variant 전용) |

---

## 22. Rating
> URL: https://tossmini-docs.toss.im/tds-mobile/components/rating/

Rating 컴포넌트는 사용자가 별점/평점을 제공하는 UI 요소. 읽기 전용 또는 상호작용 가능.

### 사용법

```jsx
// 상호작용
<Rating readOnly={false} value={3} max={5} size="large" aria-label="별점 평가" onValueChange={setValue} />

// 읽기 전용 + 형태
<Rating readOnly={true} value={5} max={5} size="medium" variant="full" />
<Rating readOnly={true} value={5} max={5} size="small" variant="compact" />
<Rating readOnly={true} value={5} max={5} size="tiny" variant="iconOnly" />

// 비활성화
<Rating readOnly={false} value={5} max={5} size="medium" disabled />
```

### 인터페이스 - RatingProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| readOnly* | - | boolean |
| value* | - | number |
| size* | - | "tiny" \| "small" \| "medium" \| "large" \| "big" |
| variant* | - | "full" \| "compact" \| "iconOnly" (readOnly=true 전용) |
| max | 5 | number |
| onValueChange | undefined | (value: number) => void |
| disabled | false | boolean |

---

## 23. Result
> URL: https://tossmini-docs.toss.im/tds-mobile/components/result/

Result 컴포넌트는 특정 작업의 결과(성공/에러)를 시각적으로 보여주는 페이지 컴포넌트.

### 사용법

```jsx
<Result
  figure={<Asset.Image src="..." frameShape={Asset.frameShape.CleanH60} />}
  title="라이브 쇼핑 준비 중"
  description="요금이 나오면 알림을 보내드릴게요."
  button={<Result.Button>재시도</Result.Button>}
/>
```

### 인터페이스 - ResultProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| figure | - | React.ReactNode |
| title | - | React.ReactNode |
| description | - | React.ReactNode |
| button | - | React.ReactNode |

---

## 24. Search Field
> URL: https://tossmini-docs.toss.im/tds-mobile/components/search-field/

SearchField 컴포넌트는 검색 입력창. 고정 기능과 검색어 삭제 기능 포함.

### 사용법

```jsx
<SearchField placeholder="검색어를 입력하세요" fixed takeSpace />
<SearchField placeholder="검색어를 입력하세요" onDeleteClick={() => alert('delete')} />
```

### 인터페이스 - SearchFieldProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| fixed | false | boolean |
| takeSpace | true | boolean |
| onDeleteClick | - | () => void |

---

## 25. Segmented Control
> URL: https://tossmini-docs.toss.im/tds-mobile/components/segmented-control/

SegmentedControl 컴포넌트는 여러 선택지 중 하나를 선택하는 UI 요소. Radio와 같은 역할.

### 사용법

```jsx
// 외부 상태 관리
<SegmentedControl value={value} onChange={setValue}>
  <SegmentedControl.Item value="1">아이템1</SegmentedControl.Item>
  <SegmentedControl.Item value="2">아이템2</SegmentedControl.Item>
</SegmentedControl>

// 내부 상태 관리
<SegmentedControl defaultValue="1">...</SegmentedControl>

// 스크롤 (아이템 많을 때)
<SegmentedControl defaultValue="1" alignment="fluid">...</SegmentedControl>
```

### 인터페이스 - SegmentedControlProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| children* | - | React.ReactNode |
| size | 'small' | "small" \| "large" |
| alignment | 'fixed' | "fixed" \| "fluid" |
| value | - | string |
| defaultValue | - | string |
| onChange | - | (v: string) => void |

---

## 26. Skeleton
> URL: https://tossmini-docs.toss.im/tds-mobile/components/skeleton/

Skeleton 컴포넌트는 데이터 로드 중 콘텐츠의 레이아웃을 임시로 보여주는 플레이스홀더.

### 사용법

```jsx
// 프리셋 패턴 사용
<Skeleton pattern="topListWithIcon" />

// 커스텀 패턴
<Skeleton custom={['title', 'subtitle', 'spacer(20)', 'card']} repeatLastItemCount={1} />

// 반복 + 배경색
<Skeleton pattern="listOnly" repeatLastItemCount={5} background="white" />
```

### 패턴 종류
topList, topListWithIcon, amountTopList, amountTopListWithIcon, subtitleList, subtitleListWithIcon, listOnly, listWithIconOnly, cardOnly

### 커스텀 타입
title, subtitle, list, listWithIcon, card, spacer(${number})

### 인터페이스 - SkeletonProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| pattern | topList | 9가지 프리셋 |
| custom | - | ("list" \| "title" \| "subtitle" \| "card" \| "listWithIcon" \| spacer)[] |
| repeatLastItemCount | 3 | number \| "infinite" |
| background | grey | "white" \| "grey" \| "greyOpacity100" |
| play | show | "show" \| "hide" |
| height | auto | string \| number |

---

## 27. Slider
> URL: https://tossmini-docs.toss.im/tds-mobile/components/slider/

Slider 컴포넌트는 막대를 좌우로 움직여서 원하는 숫자를 선택하는 컨트롤.

### 사용법

```jsx
<Slider value={value} onValueChange={setValue} />
<Slider color={adaptive.green500} value={value} onValueChange={setValue} />
<Slider value={value} minValue={100} maxValue={200}
  label={{ min: '100 만원', mid: '150 만원', max: '200 만원' }}
  onValueChange={setValue} />
<Slider value={value} tooltip={<SliderTooltip message={value} />} onValueChange={setValue} />
```

### 인터페이스 - SliderProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| value | - | number |
| defaultValue | - | number |
| minValue | 0 | number |
| maxValue | 100 | number |
| color | blue400 | string |
| label | - | { min, mid?, max } |
| tooltip | - | React.ReactNode |
| onValueChange | - | (value: number) => void |

---

## 28. Stepper
> URL: https://tossmini-docs.toss.im/tds-mobile/components/stepper/

Stepper 컴포넌트는 여러 단계를 시각적으로 보여주는 컴포넌트. 순차적 흐름 전달에 적합.

### 사용법

```jsx
<StepperRow
  left={<StepperRow.NumberIcon number={1} />}
  center={<StepperRow.Texts type="A" title="제목" description="설명" />}
  right={<StepperRow.RightArrow />}
/>
```

#### Texts type: A (t5+t6), B (t4+t6), C (t5+t7)
#### left: NumberIcon, Asset
#### right: RightArrow, Button
#### hideLine: 연결선 가리기

---

## 29. Switch
> URL: https://tossmini-docs.toss.im/tds-mobile/components/switch/

Switch 컴포넌트는 두 가지 상태(켜짐/꺼짐) 전환 토글. 설정/옵션 활성화에 사용.

### 사용법

```jsx
<Switch checked={isOn} onChange={() => setIsOn(prev => !prev)} />
<Switch checked disabled />
<Switch hasTouchEffect={false} checked={checked} onChange={...} />
```

### 인터페이스 - SwitchProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| checked | - | boolean |
| onChange | - | () => void |
| disabled | - | boolean |
| hasTouchEffect | true | boolean |
| aria-label | - | string (접근성 필수) |

---

## 30. Tab
> URL: https://tossmini-docs.toss.im/tds-mobile/components/tab/

Tab 컴포넌트는 여러 콘텐츠를 한 화면에서 효율적으로 전환.

### 사용법

```jsx
<Tab size="large" onChange={(index) => setSelected(index)}>
  <Tab.Item selected={selected === 0}>탭1</Tab.Item>
  <Tab.Item selected={selected === 1}>탭2</Tab.Item>
</Tab>

// 간격 조정
<Tab itemGap={36} onChange={...}>...</Tab>

// 스크롤 (아이템 4개 이상)
<Tab fluid onChange={...}>...</Tab>
```

### 인터페이스 - TabProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| size | - | "small" \| "large" |
| onChange | - | (index: number) => void |
| itemGap | - | number |
| fluid | false | boolean |

---

## 31. Table Row
> URL: https://tossmini-docs.toss.im/tds-mobile/components/table-row/

TableRow 컴포넌트는 데이터를 간결하게 좌우로 배치. 정보 제목과 내용을 나란히 배치.

### 사용법

```jsx
<TableRow align="space-between" left="김토스" right="받는 분" />
<TableRow align="left" left="김토스" right="받는 분" leftRatio={30} />
```

### 인터페이스 - TableRowProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| left* | - | React.ReactNode |
| right* | - | React.ReactNode |
| align* | - | "left" \| "space-between" |
| leftRatio | - | number |

---

## 32. Text Button
> URL: https://tossmini-docs.toss.im/tds-mobile/components/text-button/

TextButton 컴포넌트는 텍스트 형태의 버튼. ParagraphText 확장.

### 사용법

```jsx
<TextButton size="medium">텍스트 버튼</TextButton>
<TextButton size="xlarge" variant="arrow">화살표</TextButton>
<TextButton size="medium" variant="underline">밑줄</TextButton>
<TextButton size="medium" disabled>비활성화</TextButton>
```

### 인터페이스 - TextButtonProps
| 속성 | 기본값 | 타입 |
|------|--------|------|
| size* | - | "xsmall" \| "small" \| "medium" \| "large" \| "xlarge" \| "xxlarge" |
| variant | 'clear' | "arrow" \| "underline" \| "clear" |
| disabled | - | boolean |

---

## 33. Toast
> URL: https://tossmini-docs.toss.im/tds-mobile/components/toast/

Toast 컴포넌트는 작업 완료/이벤트 발생 시 피드백 알림. 자동으로 사라짐. overlay-extension 권장.

### 사용법

```jsx
<Toast position="top" open={open} text="토스트 메시지" duration={3000} onClose={() => setOpen(false)} />

// 아이콘
<Toast open={open} text="메시지" leftAddon={<Toast.Icon name="icn-success-color" />} />

// 버튼 (하단 전용)
<Toast position="bottom" open={open} text="메시지"
  button={<Toast.Button onClick={...}>실행취소</Toast.Button>} />
```

### 인터페이스 - ToastProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| open | - | boolean |
| text | - | string |
| position | - | "top" \| "bottom" |
| duration | - | number (ms) |
| onClose | - | () => void |
| leftAddon | - | React.ReactNode |
| button | - | React.ReactNode (bottom 전용) |

---

## 34. Tooltip
> URL: https://tossmini-docs.toss.im/tds-mobile/components/tooltip/

Tooltip 컴포넌트는 특정 요소에 포커스할 때 추가 정보 제공하는 말풍선.

### 사용법

```jsx
// 외부 관리
<Tooltip message="툴팁입니다." open={isOpen}>
  <Button onClick={() => setIsOpen(prev => !prev)}>Click Me</Button>
</Tooltip>

// 내부 관리
<Tooltip message="툴팁입니다." openOnHover>
  <Button>Hover Me</Button>
</Tooltip>
<Tooltip message="툴팁입니다." openOnFocus dismissible>
  <Button>Focus Me</Button>
</Tooltip>
```

### 인터페이스 - TooltipProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| message | - | string |
| open | - | boolean |
| defaultOpen | - | boolean |
| openOnHover | - | boolean |
| openOnFocus | - | boolean |
| dismissible | - | boolean |
| placement | - | "top" \| "bottom" |
| offset | - | number |

---

## 35. Top
> URL: https://tossmini-docs.toss.im/tds-mobile/components/top/

Top 컴포넌트는 다양한 레이아웃을 지원하는 페이지 상단 컴포넌트. 헤더/타이틀 영역 구성.

### 사용법

```jsx
<Top
  upperGap={0}
  lowerGap={0}
  title={<Top.TitleParagraph size={28}>동해물과 백두산이</Top.TitleParagraph>}
  right={<Top.RightButton>선택하기</Top.RightButton>}
/>

// 상단 에셋
<Top upper={<Top.UpperAssetContent content={<Asset.Lottie ... />} />} title={...} />

// 하단 버튼
<Top title={...} lower={<Top.LowerButton>왜 사용할 수 없나요?</Top.LowerButton>} />

// 하단 CTA 2개
<Top title={...} lower={
  <Top.LowerCTA type="2-button"
    leftButton={<Top.LowerCTAButton color="dark" variant="weak" display="block">채우기</Top.LowerCTAButton>}
    rightButton={<Top.LowerCTAButton display="block">보내기</Top.LowerCTAButton>}
  />
} />

// 우측 에셋
<Top title={...} right={<Top.RightAssetContent content={<Asset.Image ... />} />} />

// 타이틀: TitleParagraph, TitleTextButton, TitleSelector
// 서브타이틀: SubtitleParagraph, SubtitleTextButton, SubtitleSelector, SubtitleBadge
```

### 인터페이스 - TopProps (주요)
| 속성 | 기본값 | 타입 |
|------|--------|------|
| title | - | React.ReactNode |
| upper | - | React.ReactNode |
| lower | - | React.ReactNode |
| right | - | React.ReactNode |
| upperGap | - | number |
| lowerGap | - | number |
# 그룹 컴포넌트

## Agreement
> V3: https://tossmini-docs.toss.im/tds-mobile/components/Agreement/v3/
> V4: https://tossmini-docs.toss.im/tds-mobile/components/Agreement/v4/

Agreement 컴포넌트는 이용약관 동의 UI를 제공. V3, V4 두 가지 버전.

---

## Asset
> 이해하기: https://tossmini-docs.toss.im/tds-mobile/components/Asset/check-first/
> 활용하기: https://tossmini-docs.toss.im/tds-mobile/components/Asset/frame/
> 래핑한 컴포넌트: https://tossmini-docs.toss.im/tds-mobile/components/Asset/asset/

Asset 컴포넌트는 아이콘, 일러스트레이션 등의 에셋을 로드/표시하는 컴포넌트.

---

## BottomCTA
> 이해하기: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/check-first/
> Single: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Single/
> Double: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/Double/
> FixedBottomCTA: https://tossmini-docs.toss.im/tds-mobile/components/BottomCTA/fixed-bottom-cta/

BottomCTA 컴포넌트는 화면 하단에 고정되는 Call-to-Action 버튼 영역.
- Single: 버튼 1개
- Double: 버튼 2개 (좌/우)
- FixedBottomCTA: 스크롤에 관계없이 하단 고정

---

## Chart
> Bar Chart: https://tossmini-docs.toss.im/tds-mobile/components/Chart/bar-chart/

Chart 컴포넌트는 데이터 시각화를 위한 차트. Bar Chart 제공.

---

## Dialog
> 이해하기: https://tossmini-docs.toss.im/tds-mobile/components/Dialog/dialog/
> AlertDialog: https://tossmini-docs.toss.im/tds-mobile/components/Dialog/alert-dialog/
> ConfirmDialog: https://tossmini-docs.toss.im/tds-mobile/components/Dialog/confirm-dialog/

Dialog 컴포넌트는 사용자에게 확인/선택을 요구하는 대화 상자.
- AlertDialog: 알림용 (확인 버튼만)
- ConfirmDialog: 확인/취소 선택

---

## Keypad
> Alphabet: https://tossmini-docs.toss.im/tds-mobile/components/Keypad/alphabet-keypad/
> Full Secure: https://tossmini-docs.toss.im/tds-mobile/components/Keypad/full-secure-keypad/
> Number: https://tossmini-docs.toss.im/tds-mobile/components/Keypad/number-keypad/

Keypad 컴포넌트는 커스텀 키패드 UI를 제공.
- AlphabetKeypad: 알파벳 입력용
- FullSecureKeypad: 보안 키패드 (전체)
- NumberKeypad: 숫자 입력용

---

## ListRow
> 이해하기: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-overview/
> 영역 구성하기: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/list-row-components/
> ListRowLegacy: https://tossmini-docs.toss.im/tds-mobile/components/ListRow/ListRowLegacy/list-row-legacy/

ListRow 컴포넌트는 리스트 항목을 표시하는 핵심 컴포넌트. 다양한 영역(left, contents, right)으로 구성.

### 주요 사용법

```jsx
<ListRow
  contents={<ListRow.Texts type="1RowTypeA" top="제목" />}
  border="indented"
  onClick={() => {}}
/>

// 영역 구성
<ListRow
  left={<ListRow.Image src="..." />}
  contents={
    <ListRow.Texts type="2RowTypeA" top="메인 텍스트" bottom="서브 텍스트" />
  }
  right={<ListRow.RightArrow />}
/>
```

#### ListRow.Texts type 종류:
- 1RowTypeA: 1줄 기본
- 2RowTypeA: 2줄 (top + bottom)
- 3RowTypeA: 3줄

---

## TextField
> TextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-field/
> SplitTextField: https://tossmini-docs.toss.im/tds-mobile/components/TextField/split-text-field/
> TextArea: https://tossmini-docs.toss.im/tds-mobile/components/TextField/text-area/

TextField 컴포넌트는 텍스트 입력 필드.
- TextField: 기본 텍스트 입력
- SplitTextField: 분리된 입력 필드 (OTP 등)
- TextArea: 여러 줄 텍스트 입력

---

# 유틸리티

## Overlay Extension
> 이해하기: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/check-first/
> useDialog: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-dialog/
> useToast: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-toast/
> useBottomSheet: https://tossmini-docs.toss.im/tds-mobile/hooks/OverlayExtension/use-bottom-sheet/

Overlay Extension은 Dialog, Toast, BottomSheet을 프로그래매틱하게 호출하는 훅.

### useDialog
```jsx
const dialog = useDialog();
await dialog.open({ title: '확인', description: '삭제하시겠습니까?' });
```

### useToast
```jsx
const toast = useToast();
toast.open({ message: '저장되었습니다' });
```

### useBottomSheet
```jsx
const bottomSheet = useBottomSheet();
bottomSheet.open({ header: '옵션 선택', ... });
```

---

# 마이그레이션

## @toss-design-system에서 마이그레이션
> URL: https://tossmini-docs.toss.im/tds-mobile/migration/from-toss-design-system/

## v1에서 v2로 마이그레이션
> URL: https://tossmini-docs.toss.im/tds-mobile/migration/v2/