/** @typedef {{ id: string; label: string; scores: Record<string, number> }} Choice */
/** @typedef {{ id: string; text: string; choices: Choice[] }} Question */
/** @typedef {{ id: string; name: string; tagline: string; summary: string; detail: string; traits: string[]; tips: string[] }} TypeDef */

/** @type {TypeDef[]} */
export const TYPES = [
  {
    id: "observer",
    name: "隅の観測者",
    tagline: "参加はしている。存在感はしていない。",
    summary:
      "場の熱量を測りながら、最適な離席タイミングを常に計算しているタイプです。",
    detail:
      "あなたは言動の少なさで会話コストを抑え、観察で情報を集める戦略を取りがちです。悪気はなく、ただ「巻き込まれたくない」という本能が強いだけ。実は状況把握は鋭く、あとから的確な一言を放つこともあります。",
    traits: ["端の席が落ち着く", "名前を覚えられるが呼び合わない", "退勤・退散が早い"],
    tips: ["「聞き役」として価値を言語化すると楽になる", "途中参加は許可を取ると気が楽"],
  },
  {
    id: "logic",
    name: "正論の番人",
    tagline: "空気より整合性。ただし味方は少ない。",
    summary:
      "話の筋が通らないと黙っていられず、結果として場を冷やすことがあるタイプです。",
    detail:
      "あなたは論理・ルール・公平性に敏感で、「それ違うよね」が口から出やすい傾向があります。悪意ではなく秩序への愛。ただし人間関係は感情と曖昧さも燃料にするので、正論だけだとエンジンが止まることも。",
    traits: ["説明が長くなりがち", "冗談の境界線がシビア", "議論は得意、雑談は消耗"],
    tips: ["指摘の前に「聞きたい」宣言を一句", "結論は後で DM でも伝えられる"],
  },
  {
    id: "ghost",
    name: "透明人間",
    tagline: "在籍しているのに、在席が証明されない。",
    summary:
      "挨拶・相槌・リアクションが最小限で、気づけば会話から抜けているタイプです。",
    detail:
      "あなたは社会生活の「演出」を極力カットし、必要なときだけスイッチを入れます。疲れやすいわけではなく、刺激の処理コストが高い側。一度信頼できる相手ができると、意外と饒舌になることも。",
    traits: ["既読はするが返信が遅い", "盛り上げ役は任されたくない", "映画の一人席が好き"],
    tips: ["定型リアクションを3つストック", "「今日は低パワー」と先に言う"],
  },
  {
    id: "homer",
    name: "帰巣本能 MAX",
    tagline: "義務は果たす。あとは布団。",
    summary:
      "イベントの秒数を心の中でカウントし、終了合図に反応するタイプです。",
    detail:
      "あなたにとってオフは回復の聖域。長時間の同席やアフターは体力より先にメンタルが枯渇します。社会不適合というより、充電方式が一人時間寄り。計画的に撤退ルートを確保できるのは才能です。",
    traits: ["終了時刻を最初に聞く", "途中退席に罪悪感と安堵が同時", "在宅リモート適性高"],
    tips: ["最初から退出時刻を宣言", "移動中の一人時間をスケジュールに入れる"],
  },
  {
    id: "digital",
    name: "文字入力が本音",
    tagline: "対面は低 FPS。チャットは高速。",
    summary:
      "口頭よりテキストのほうが人格が出る。オンラインで復活するタイプです。",
    detail:
      "あなたはリアルタイム同期型コミュニケーションが苦手で、推敲できる非同期が得意です。映像会議のカメラオフ派だったり、長文 DM では機敏だったり。社会は対面偏重なので損した気になることもありますが、環境が変われば強みになります。",
    traits: ["電話よりメール", "スタンプで感情補完", "通話アプリにプレッシャー"],
    tips: ["口頭はメモを見ながら", "「あとで文字で送る」と言って実際送る"],
  },
  {
    id: "tense",
    name: "緊張の結晶体",
    tagline: "心拍数は上がる。表情は固まる。",
    summary:
      "初対面・評価・自己紹介で性能が半分になるタイプです。",
    detail:
      "あなたは「見られている」感覚に過敏で、緊張が態度に出やすい。準備はしているのに本番で詰まる、というパターンも。慣れた相手・慣れた場なら別人級に動けるので、適応不能ではなくスイッチの立ち上がりが遅いだけです。",
    traits: ["声が小さくなる", "直前まで台本リハ", "褒められると困る"],
    tips: ["質問を1つだけ持っていく", "深呼吸より「足裏を感じる」が効くことも"],
  },
  {
    id: "blunt",
    name: "空気の彫刻刀",
    tagline: "愛想笑いは少ない。本音は多い。",
    summary:
      "場の温度に合わせるより、自分の基準で反応してしまうタイプです。",
    detail:
      "あなたは「空気を読む」より「空気を編集したい」側寄り。毒舌でもなく、ただ忖度コストを払いたくない。率直さは信頼にもなりますが、タイミングを外すと孤立しがち。意図は伝わっていないことがあるので、一文だけ柔らかくする技術が効きます。",
    traits: ["笑顔疲れ", "テンション乗せが苦手", "本音が顔に出る"],
    tips: ["否定的なときは理由を一文添える", "沈黙を怖がらない相手を探す"],
  },
  {
    id: "silent",
    name: "沈黙の深海魚",
    tagline: "頭の中では完結している。口の外には出ない。",
    summary:
      "考えすぎて発言タイミングを逃し、結果「何も言わなかった人」になるタイプです。",
    detail:
      "あなたは言葉を選びすぎて、会話のテンポから脱落します。後から「あのとき言えばよかった」は山ほど。落ち着いた議論や書き込みでは急に頭角を現すタイプでもあります。",
    traits: ["相槌はするが展開しない", "グループLINEは読むだけ", "噛み合わせ雑談が難"],
    tips: ["「一個だけ言う」と宣言してから話す", "短い文でいい、長く整えなくていい"],
  },
];

/** @type {Question[]} */
export const QUESTIONS = [
  {
    id: "q01",
    text: "飲み会・打ち上げの誘いが来たとき、いちばん近いのは？",
    choices: [
      { id: "a", label: "断り理由の文案が頭を占拠する", scores: { homer: 2, tense: 1 } },
      { id: "b", label: "行くが、最初から出口を考える", scores: { observer: 2, homer: 1 } },
      { id: "c", label: "行っても会話に入れず端で微笑む", scores: { ghost: 2, observer: 1 } },
      { id: "d", label: "チャットなら参加できるが対面は遠慮", scores: { digital: 2, tense: 1 } },
    ],
  },
  {
    id: "q02",
    text: "エレベーターで上司と二人きりになったら？",
    choices: [
      { id: "a", label: "軽い挨拶だけして、あとは無言", scores: { ghost: 2, silent: 1 } },
      { id: "b", label: "昨日の天気など無難な話をする", scores: { tense: 2, ghost: 1 } },
      { id: "c", label: "仕事の話は筋が気になってつい指摘", scores: { logic: 2, blunt: 1 } },
      { id: "d", label: "階数が表示されるのをじっと見る", scores: { homer: 1, silent: 2 } },
    ],
  },
  {
    id: "q03",
    text: "自分の名前を初対面の輪で呼ばれたとき？",
    choices: [
      { id: "a", label: "「はい」と短く応じて話題を返さない", scores: { silent: 2, ghost: 1 } },
      { id: "b", label: "大きめに応えて場を明るくしようとするが空回り", scores: { tense: 2, blunt: 1 } },
      { id: "c", label: "他の人の名前を覚えようとするが呼べない", scores: { observer: 2, silent: 1 } },
      { id: "d", label: "名前の綴りや読みを確認したくなる", scores: { logic: 2, digital: 1 } },
    ],
  },
  {
    id: "q04",
    text: "グループで冗談が飛び交っているとき？",
    choices: [
      { id: "a", label: "笑うが、ツッコミはしない", scores: { ghost: 2, observer: 1 } },
      { id: "b", label: "冗談の論理破綻が気になって静かになる", scores: { logic: 2, blunt: 1 } },
      { id: "c", label: "面白いと思っても言葉が出てこない", scores: { silent: 2, tense: 1 } },
      { id: "d", label: "後からチャットでいいツッコミを思いつく", scores: { digital: 2, silent: 1 } },
    ],
  },
  {
    id: "q05",
    text: "チームチャットで @全体 されたとき？",
    choices: [
      { id: "a", label: "既読だけして、返信は熟考後", scores: { digital: 2, silent: 1 } },
      { id: "b", label: "すぐ返すが文面を何度も直す", scores: { tense: 2, digital: 1 } },
      { id: "c", label: "誰かが返すのを待ち、最小限だけ足す", scores: { observer: 2, ghost: 1 } },
      { id: "d", label: "曖昧な指示だと指摘したくなる", scores: { logic: 2, blunt: 1 } },
    ],
  },
  {
    id: "q06",
    text: "休日の予定が「特になし」のとき？",
    choices: [
      { id: "a", label: "それが最高の休息", scores: { homer: 2, ghost: 1 } },
      { id: "b", label: "誘いがなければ一人で充電", scores: { digital: 2, homer: 1 } },
      { id: "c", label: "暇なのでSNS巡回、投稿はしない", scores: { observer: 2, digital: 1 } },
      { id: "d", label: "予定が空くと不安になる", scores: { tense: 2, silent: 1 } },
    ],
  },
  {
    id: "q07",
    text: "会議で自分の意見が通らなかったとき？",
    choices: [
      { id: "a", label: "議事録に正しい形で残そうとする", scores: { logic: 2, digital: 1 } },
      { id: "b", label: "諦めて次から話さない", scores: { silent: 2, ghost: 1 } },
      { id: "c", label: "その場では言わず、後で個別に伝える", scores: { digital: 2, observer: 1 } },
      { id: "d", label: "表情に不満が出ていると言われる", scores: { blunt: 2, logic: 1 } },
    ],
  },
  {
    id: "q08",
    text: "初対面の人と名刺交換（または自己紹介）のとき？",
    choices: [
      { id: "a", label: "名刺より QR やリンクのほうが楽", scores: { digital: 2, homer: 1 } },
      { id: "b", label: "声が震える／背中に汗", scores: { tense: 2, silent: 1 } },
      { id: "c", label: "相手の肩書きより話の矛盾が気になる", scores: { logic: 2, observer: 1 } },
      { id: "d", label: "自己紹介後、話題が続かない", scores: { ghost: 2, silent: 1 } },
    ],
  },
  {
    id: "q09",
    text: "「空気読んで」と言われた経験は？",
    choices: [
      { id: "a", label: "多い。何を読めばいいか分からなかった", scores: { blunt: 2, logic: 1 } },
      { id: "b", label: "読みすぎて疲弊したことがある", scores: { tense: 2, observer: 1 } },
      { id: "c", label: "読もうとしたが、結局黙った", scores: { silent: 2, ghost: 1 } },
      { id: "d", label: "そもそもその場に居なかった", scores: { homer: 2, digital: 1 } },
    ],
  },
  {
    id: "q10",
    text: "電話が突然かかってきたら？",
    choices: [
      { id: "a", label: "折り返しよりメッセージを希望", scores: { digital: 2, tense: 1 } },
      { id: "b", label: "出るが頭が真っ白になりやすい", scores: { tense: 2, silent: 1 } },
      { id: "c", label: "基本出ない。ログを確認してから", scores: { ghost: 2, homer: 1 } },
      { id: "d", label: "用件を最初に聞き、短く終わらせたい", scores: { blunt: 2, logic: 1 } },
    ],
  },
  {
    id: "q11",
    text: "集合写真・記念撮影のとき？",
    choices: [
      { id: "a", label: "端か後列を選ぶ", scores: { observer: 2, ghost: 1 } },
      { id: "b", label: "笑顔の作り方が分からない", scores: { tense: 2, blunt: 1 } },
      { id: "c", label: "できるだけ写らない方向を探す", scores: { homer: 1, ghost: 2 } },
      { id: "d", label: "撮影より解散時刻が気になる", scores: { homer: 2, observer: 1 } },
    ],
  },
  {
    id: "q12",
    text: "約束の時間について？",
    choices: [
      { id: "a", label: "自分は守る。相手の遅れは記録する", scores: { logic: 2, tense: 1 } },
      { id: "b", label: "早めに着くが、その間がつらい", scores: { tense: 2, observer: 1 } },
      { id: "c", label: "遅れそうなら事前に連絡、対面は苦手", scores: { digital: 2, tense: 1 } },
      { id: "d", label: "「もう帰れる？」と思うタイミングを覚えている", scores: { homer: 2, blunt: 1 } },
    ],
  },
  {
    id: "q13",
    text: "礼儀・マナー違反を見たとき？",
    choices: [
      { id: "a", label: "黙って観察する", scores: { observer: 2, silent: 1 } },
      { id: "b", label: "指摘したくなるが飲み込む", scores: { logic: 2, silent: 1 } },
      { id: "c", label: "言ってしまい、空気が凍る", scores: { blunt: 2, logic: 1 } },
      { id: "d", label: "距離を取って関わらない", scores: { homer: 1, ghost: 2 } },
    ],
  },
  {
    id: "q14",
    text: "褒められたときの反応に近いのは？",
    choices: [
      { id: "a", label: "「そんなことないです」と否定", scores: { tense: 2, silent: 1 } },
      { id: "b", label: "話題を変えたい", scores: { ghost: 2, blunt: 1 } },
      { id: "c", label: "素直に喜べず、後で一人で照れる", scores: { silent: 2, digital: 1 } },
      { id: "d", label: "褒め言葉の定義を聞きたくなる", scores: { logic: 2, observer: 1 } },
    ],
  },
  {
    id: "q15",
    text: "新しい職場・学校・コミュニティに入った直後？",
    choices: [
      { id: "a", label: "全員の人間関係マップを暗黙で作る", scores: { observer: 2, logic: 1 } },
      { id: "b", label: "最初の一週間で限界が来る", scores: { tense: 2, homer: 1 } },
      { id: "c", label: "自己紹介スレで長文を書く方", scores: { digital: 2, logic: 1 } },
      { id: "d", label: "輪に入れず、ひとりランチが増える", scores: { ghost: 2, homer: 1 } },
    ],
  },
  {
    id: "q16",
    text: "「また来週も！」と言われたときの内心？",
    choices: [
      { id: "a", label: "来週は別の用事を探す", scores: { homer: 2, blunt: 1 } },
      { id: "b", label: "笑って頷くが未定", scores: { ghost: 2, observer: 1 } },
      { id: "c", label: "正直まだ余裕がない", scores: { tense: 2, silent: 1 } },
      { id: "d", label: "カレンダーに入れてから考える", scores: { digital: 1, logic: 2 } },
    ],
  },
];

export const QUIZ_META = {
  title: "社会不適合タイプ診断",
  disclaimer:
    "娯楽・自己分析用の診断です。医学的・心理学的な評価ではありません。「社会不適合」という言葉も、ここではユーモアを交えた比喩として使っています。",
  shareBaseUrl: "https://tools.atohs.me/shakai-futekigo/",
};