(() => {
  "use strict";

  const ENHANCEMENT_RELEASE = "V015.38";
  document.documentElement.dataset.akigusaEnhancement = ENHANCEMENT_RELEASE;

  // A stale V015.34 DOM could contain the retired “今日の花” panel. Remove it
  // immediately and again after every React mutation. A CSS hard-hide is the
  // final safety net if an older cached observer tries to restore it.
  const removeRetiredFlowerPanel = () => {
    document.querySelectorAll(".aki-flower-panel").forEach((node) => node.remove());
  };
  removeRetiredFlowerPanel();

  // The old bundled refresh handler deleted caches while its service worker was
  // still controlling the page. Intercept the button first and use reset.html,
  // which unregisters the worker and clears only AKIGUSA caches. Learning data
  // in localStorage is never touched.
  let hardUpdateStarted = false;
  const openSafeUpdater = (event) => {
    const target = event.target instanceof Element ? event.target.closest(".page-refresh-button") : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (hardUpdateStarted) return;
    hardUpdateStarted = true;
    target.disabled = true;
    target.setAttribute("aria-busy", "true");
    const glyph = target.querySelector("span");
    if (glyph) glyph.textContent = "…";
    const updater = new URL("reset.html", document.baseURI);
    updater.searchParams.set("from", "refresh-button");
    updater.searchParams.set("release", ENHANCEMENT_RELEASE);
    updater.searchParams.set("open", String(Date.now()));
    window.location.assign(updater.href);
  };
  document.addEventListener("click", openSafeUpdater, true);

  // AKIGUSA V015.38: cache-consistent enhancement layer, richer all-day messages,
  // bottom study counter, scenic daily messages and rotating seasonal illustrations.

  const START_UTC = Date.UTC(2026, 6, 19);
  const DAY_MS = 86400000;
  const state = { messageShift: 0, radioFilter: "all", scheduled: false };

  const messages = [
    {
      key: "midnight", start: 0, end: 4, mark: "☾",
      variants: [
        { ja: "秋ちゃん、もう夜中だよ", vi: "Khuya lắm rồi đó, Aki-chan. Học xong câu này thì mình nghỉ nha.", zh: "秋ちゃん，已經很晚了。學完這一句就休息吧。" },
        { ja: "眠る前に、一つだけ復習しよう", vi: "Trước khi ngủ, mình ôn nhẹ một câu thôi nha.", zh: "睡前只要輕輕複習一句就好。" },
        { ja: "今日はここまででも大丈夫", vi: "Hôm nay học tới đây cũng được rồi. Nghỉ ngơi cho khỏe nha.", zh: "今天學到這裡也沒關係，好好休息吧。" },
        { ja: "夜中の勉強は、短くやさしく", vi: "Học khuya thì mình học ngắn và nhẹ thôi ha.", zh: "深夜學習就短一點、輕鬆一點吧。" }
      ]
    },
    {
      key: "dawn", start: 4, end: 6, mark: "☀",
      variants: [
        { ja: "朝が始まる前の、静かな時間だね", vi: "Trời còn sớm và yên tĩnh ha. Mình học một câu rồi bắt đầu ngày mới nhé.", zh: "天還很早，也很安靜。學一句再開始新的一天吧。" },
        { ja: "早起きできたね。まず一言だけ", vi: "Dậy sớm được rồi đó. Mình bắt đầu bằng một câu ngắn nha.", zh: "今天早起了呢。先從一句短句開始吧。" },
        { ja: "朝の空気と一緒に、日本語を一つ", vi: "Mình học một câu tiếng Nhật cùng không khí buổi sớm nha.", zh: "和清晨的空氣一起，學一句日文吧。" },
        { ja: "まだ眠かったら、聞くだけでもいいよ", vi: "Còn buồn ngủ thì chỉ nghe thôi cũng được nha.", zh: "如果還想睡，只聽一下也可以喔。" }
      ]
    },
    {
      key: "breakfast", start: 6, end: 8, mark: "✿",
      variants: [
        { ja: "おはよう。朝ご飯は食べた？", vi: "Chào buổi sáng. Ăn sáng chưa? Mình học một chút rồi ăn nha.", zh: "早安。吃早餐了嗎？先學一點再去吃吧。" },
        { ja: "今日の最初の日本語を声に出そう", vi: "Mình nói câu tiếng Nhật đầu tiên của hôm nay thành tiếng nhé.", zh: "把今天第一句日文說出聲吧。" },
        { ja: "朝は短い復習から始めよう", vi: "Buổi sáng mình bắt đầu bằng một phần ôn ngắn nha.", zh: "早上先從短短的複習開始吧。" },
        { ja: "焦らなくて大丈夫。朝の一歩から", vi: "Không cần vội đâu. Mình đi một bước nhỏ trong buổi sáng nha.", zh: "不用急，先踏出早晨的一小步就好。" }
      ]
    },
    {
      key: "start", start: 8, end: 10, mark: "☕",
      variants: [
        { ja: "学校や仕事の前に、一文だけ", vi: "Sắp đi học hoặc đi làm rồi ha. Mình học một câu trước khi bắt đầu nhé.", zh: "上學或上班前，先學一句吧。" },
        { ja: "移動中なら、耳で聞くだけでも十分", vi: "Đang di chuyển thì chỉ cần nghe bằng tai cũng đủ rồi nha.", zh: "如果正在移動，只用耳朵聽也很夠。" },
        { ja: "今日使えそうな言葉を一つ選ぼう", vi: "Mình chọn một từ có thể dùng ngay hôm nay nha.", zh: "選一個今天可能用得到的詞吧。" },
        { ja: "始まる前の三分を、日本語にしよう", vi: "Mình dành ba phút trước khi bắt đầu cho tiếng Nhật nhé.", zh: "把開始前的三分鐘留給日文吧。" }
      ]
    },
    {
      key: "late-morning", start: 10, end: 12, mark: "❋",
      variants: [
        { ja: "頭が動く時間。声に出してみよう", vi: "Giờ này đầu óc tỉnh rồi. Mình thử nói thành tiếng nha.", zh: "現在頭腦很清醒，試著說出聲吧。" },
        { ja: "一つ覚えたら、別の場面でも使ってみよう", vi: "Nhớ được một câu rồi thì mình thử dùng ở tình huống khác nhé.", zh: "記住一句後，再換個情境試著用吧。" },
        { ja: "今日はどの言葉を自分のものにする？", vi: "Hôm nay bạn muốn biến từ nào thành từ mình dùng được nè?", zh: "今天想把哪個詞真正變成自己會用的呢？" },
        { ja: "聞く、まねする、言ってみる", vi: "Mình nghe, bắt chước rồi tự nói thử nha.", zh: "先聽、模仿，再自己說說看。" }
      ]
    },
    {
      key: "lunch", start: 12, end: 14, mark: "🍵",
      variants: [
        { ja: "お昼だね。今日は何を食べる？", vi: "Đến giờ trưa rồi. Hôm nay ăn món gì vậy?", zh: "中午了。今天要吃什麼呢？" },
        { ja: "休憩しながら、一言だけ覚えよう", vi: "Vừa nghỉ trưa vừa nhớ một câu thôi nha.", zh: "午休時只記一句就好。" },
        { ja: "食べ物の日本語を一つ使ってみよう", vi: "Mình thử dùng một từ tiếng Nhật về món ăn nha.", zh: "試著用一個和食物有關的日文詞吧。" },
        { ja: "食べたあとは、少しだけ復習", vi: "Ăn xong mình ôn nhẹ một chút nhé.", zh: "吃完後再輕輕複習一下吧。" }
      ]
    },
    {
      key: "early-afternoon", start: 14, end: 16, mark: "🌿",
      variants: [
        { ja: "午後は、自分のペースで続けよう", vi: "Buổi chiều mình cứ học theo nhịp của mình nha.", zh: "下午照自己的步調繼續就好。" },
        { ja: "少し眠かったら、音声から始めよう", vi: "Hơi buồn ngủ thì mình bắt đầu bằng phần nghe nhé.", zh: "如果有點想睡，就從聽力開始吧。" },
        { ja: "一文だけでも、今日の積み重ねになる", vi: "Chỉ một câu thôi cũng là phần tích lũy của hôm nay đó.", zh: "即使只有一句，也是今天的累積。" },
        { ja: "迷った言葉を、もう一度見てみよう", vi: "Mình xem lại từ vừa thấy hơi phân vân nha.", zh: "再看一次剛才不太確定的詞吧。" }
      ]
    },
    {
      key: "late-afternoon", start: 16, end: 18, mark: "🌤",
      variants: [
        { ja: "もう少しで夕方。今日の一文を残そう", vi: "Sắp tới chiều tối rồi. Mình để lại một câu cho hôm nay nha.", zh: "快傍晚了，為今天留下一句吧。" },
        { ja: "疲れていたら、復習だけで大丈夫", vi: "Mệt rồi thì hôm nay chỉ ôn lại thôi cũng được nha.", zh: "如果累了，今天只複習也沒關係。" },
        { ja: "今日できたことを、一つ確かめよう", vi: "Mình kiểm tra một điều hôm nay đã làm được nhé.", zh: "確認一件今天已經會做的事吧。" },
        { ja: "帰る前に、日本語を一回だけ口に出そう", vi: "Trước khi về, mình nói một câu tiếng Nhật một lần nha.", zh: "回去前，把一句日文說出聲一次吧。" }
      ]
    },
    {
      key: "sunset", start: 18, end: 20, mark: "☀",
      variants: [
        { ja: "今日もおつかれさま。少しゆっくりしよう", vi: "Hôm nay bạn vất vả rồi. Giờ mình học chậm lại một chút nha.", zh: "今天辛苦了，接下來慢慢學就好。" },
        { ja: "夕ご飯の前に、一言だけ", vi: "Trước bữa tối, mình học một câu ngắn thôi nhé.", zh: "晚餐前先學一句短句吧。" },
        { ja: "ホーチミンも灯りが増える時間だね", vi: "Sài Gòn sắp lên đèn rồi ha. Mình nghe một bài nhẹ nhàng nhé.", zh: "胡志明市也漸漸亮起燈了。聽點輕鬆的音樂吧。" },
        { ja: "今日の言葉を、会話にしてみよう", vi: "Mình thử biến từ hôm nay thành một câu hội thoại nha.", zh: "把今天的詞試著變成一段對話吧。" }
      ]
    },
    {
      key: "evening", start: 20, end: 22, mark: "♪",
      variants: [
        { ja: "夜は、音楽と一緒にゆっくり学ぼう", vi: "Buổi tối mình vừa nghe nhạc vừa học thong thả nha.", zh: "晚上配著音樂慢慢學吧。" },
        { ja: "今日の復習を一つ終えたら十分", vi: "Tối nay ôn xong một phần là đủ rồi đó.", zh: "今晚完成一個複習就很足夠了。" },
        { ja: "一日の最後に、できたことを増やそう", vi: "Cuối ngày mình thêm một điều đã làm được nha.", zh: "在一天結束前，再增加一件會做的事吧。" },
        { ja: "ラジオを聞きながら、日本語を一つ", vi: "Mình vừa nghe radio vừa nhớ một câu tiếng Nhật nhé.", zh: "一邊聽廣播，一邊記一句日文吧。" }
      ]
    },
    {
      key: "late", start: 22, end: 24, mark: "☾",
      variants: [
        { ja: "遅い時間だね。無理はしないでね", vi: "Trễ rồi đó. Mình học vừa đủ thôi, đừng cố quá nha.", zh: "時間不早了，學剛剛好就好，別太勉強。" },
        { ja: "今日の最後は、やさしい復習にしよう", vi: "Phần cuối hôm nay mình ôn nhẹ thôi nhé.", zh: "今天最後就做輕鬆的複習吧。" },
        { ja: "一つできたら、今日は花丸", vi: "Làm được một phần là hôm nay đáng khen rồi đó.", zh: "完成一項，今天就值得一個大花圈。" },
        { ja: "眠る前に、今日覚えた言葉を思い出そう", vi: "Trước khi ngủ, mình nhớ lại một từ đã học hôm nay nha.", zh: "睡前想起今天學過的一個詞吧。" }
      ]
    }
  ];


  const extraMessages = {
    "midnight": [
        {
            "ja": "秋ちゃん、まだ起きてたんだね",
            "vi": "Aki-chan, giờ này còn thức ha.",
            "zh": "秋ちゃん，這個時間還醒著呀。"
        },
        {
            "ja": "今夜は静かだね",
            "vi": "Đêm nay yên ghê ha.",
            "zh": "今晚很安靜呢。"
        },
        {
            "ja": "まだ眠くない？",
            "vi": "Chưa buồn ngủ hả?",
            "zh": "還不睏嗎？"
        },
        {
            "ja": "一曲だけ聴いてから寝る？",
            "vi": "Nghe một bài nhẹ rồi ngủ nha?",
            "zh": "聽一首輕音樂再睡嗎？"
        },
        {
            "ja": "今日、何かいいことあった？",
            "vi": "Hôm nay có chuyện gì vui không?",
            "zh": "今天有什麼開心的事嗎？"
        },
        {
            "ja": "日本の景色を一枚だけ見ていく？",
            "vi": "Xem một cảnh Nhật Bản rồi nghỉ nha?",
            "zh": "看一張日本風景再休息嗎？"
        },
        {
            "ja": "明日は何から始めようか",
            "vi": "Mai mình bắt đầu bằng gì ha?",
            "zh": "明天想從什麼開始呢？"
        },
        {
            "ja": "目も少し休ませてね",
            "vi": "Nhớ cho mắt nghỉ chút nha.",
            "zh": "也讓眼睛休息一下喔。"
        }
    ],
    "dawn": [
        {
            "ja": "早いね、秋ちゃん",
            "vi": "Dậy sớm dữ ha, Aki-chan.",
            "zh": "秋ちゃん，今天好早呀。"
        },
        {
            "ja": "空が明るくなってきたかな",
            "vi": "Trời sắp sáng rồi ha.",
            "zh": "天空是不是快亮了呢？"
        },
        {
            "ja": "朝の静けさ、いいね",
            "vi": "Giờ này yên bình ghê.",
            "zh": "清晨這份安靜真不錯。"
        },
        {
            "ja": "まず水を一杯飲もうか",
            "vi": "Uống miếng nước trước nha.",
            "zh": "先喝一杯水吧。"
        },
        {
            "ja": "今日はどんな一日になるかな",
            "vi": "Không biết hôm nay sẽ có gì vui ha.",
            "zh": "不知道今天會有什麼開心的事呢。"
        },
        {
            "ja": "朝の音楽、何にする？",
            "vi": "Sáng nay nghe bài gì đây?",
            "zh": "今天早上想聽什麼歌？"
        },
        {
            "ja": "眠かったら、もう少し休んでもいいよ",
            "vi": "Còn buồn ngủ thì ngủ thêm chút cũng được nha.",
            "zh": "如果還睏，再休息一下也可以喔。"
        },
        {
            "ja": "朝の日本を一枚見ていく？",
            "vi": "Xem một cảnh Nhật Bản buổi sớm nha?",
            "zh": "要不要看一張清晨的日本風景？"
        }
    ],
    "breakfast": [
        {
            "ja": "朝はコーヒー？それともお茶？",
            "vi": "Sáng nay cà phê hay trà?",
            "zh": "早上喝咖啡還是茶？"
        },
        {
            "ja": "サイゴンも動き始める時間だね",
            "vi": "Sài Gòn bắt đầu đông rồi ha.",
            "zh": "西貢也開始熱鬧起來了呢。"
        },
        {
            "ja": "今日は学校？それとも仕事？",
            "vi": "Hôm nay đi học hay đi làm?",
            "zh": "今天去上課還是上班？"
        },
        {
            "ja": "外に出るなら水も忘れずにね",
            "vi": "Ra đường nhớ mang nước nha.",
            "zh": "要出門的話別忘了帶水喔。"
        },
        {
            "ja": "出かける前に日本語を一言だけ？",
            "vi": "Một câu Nhật trước khi đi nha?",
            "zh": "出門前來一句日文嗎？"
        },
        {
            "ja": "今朝は軽い音楽が合いそう？",
            "vi": "Sáng nay muốn nghe nhạc nhẹ không?",
            "zh": "今天早上適合聽點輕音樂嗎？"
        },
        {
            "ja": "秋ちゃん、朝は静かな方が好き？",
            "vi": "Aki-chan, buổi sáng thích yên tĩnh hay náo nhiệt?",
            "zh": "秋ちゃん，早上喜歡安靜還是熱鬧？"
        },
        {
            "ja": "気持ちいい朝になりますように",
            "vi": "Chúc buổi sáng dễ chịu nha.",
            "zh": "希望今天有個舒服的早晨。"
        }
    ],
    "start": [
        {
            "ja": "もう外に出た？",
            "vi": "Ra ngoài chưa?",
            "zh": "已經出門了嗎？"
        },
        {
            "ja": "今日は何から始める？",
            "vi": "Hôm nay mình bắt đầu bằng gì ha?",
            "zh": "今天想從什麼開始呢？"
        },
        {
            "ja": "道、混んでるかな",
            "vi": "Ngoài đường đông không ta?",
            "zh": "路上會不會很塞呢？"
        },
        {
            "ja": "ひと息ついたら始めよう",
            "vi": "Rảnh chút rồi mình học nha.",
            "zh": "有空喘口氣再開始吧。"
        },
        {
            "ja": "今日の気分は何点？",
            "vi": "Tâm trạng hôm nay mấy điểm?",
            "zh": "今天的心情打幾分？"
        },
        {
            "ja": "朝の一曲、選ぼうか",
            "vi": "Chọn một bài nhạc cho buổi sáng nha.",
            "zh": "選一首早晨的歌吧。"
        },
        {
            "ja": "今日は日本のどこを見てみる？",
            "vi": "Hôm nay muốn xem chỗ nào ở Nhật?",
            "zh": "今天想看看日本哪裡？"
        },
        {
            "ja": "今日はゆっくりでもいいよ",
            "vi": "Hôm nay đi chậm một chút cũng được nha.",
            "zh": "今天慢一點也沒關係喔。"
        }
    ],
    "late-morning": [
        {
            "ja": "ちょっと目を休める？",
            "vi": "Nghỉ mắt chút không?",
            "zh": "要讓眼睛休息一下嗎？"
        },
        {
            "ja": "お昼、何食べたい？",
            "vi": "Trưa nay muốn ăn gì?",
            "zh": "中午想吃什麼？"
        },
        {
            "ja": "今ちょうど集中できそう？",
            "vi": "Giờ này tập trung được chưa?",
            "zh": "現在感覺能專心了嗎？"
        },
        {
            "ja": "今日はカフェに行きたい気分？",
            "vi": "Muốn ghé cà phê không?",
            "zh": "今天有想去咖啡店嗎？"
        },
        {
            "ja": "今はどんな音楽が合いそう？",
            "vi": "Giờ này nghe nhạc gì hợp ta?",
            "zh": "現在適合聽什麼音樂呢？"
        },
        {
            "ja": "日本に行くなら、まずどこへ行く？",
            "vi": "Đi Nhật thì muốn tới đâu trước?",
            "zh": "去日本的話最想先去哪裡？"
        },
        {
            "ja": "少し伸びをしようか",
            "vi": "Vươn vai chút nha.",
            "zh": "伸個懶腰吧。"
        },
        {
            "ja": "今日はいいペースだね",
            "vi": "Nhịp hôm nay ổn đó.",
            "zh": "今天的節奏不錯呢。"
        }
    ],
    "lunch": [
        {
            "ja": "お昼ご飯、楽しんでね",
            "vi": "Ăn trưa ngon nha.",
            "zh": "午餐好好享受喔。"
        },
        {
            "ja": "今日はご飯？麺？",
            "vi": "Trưa nay ăn cơm hay bún?",
            "zh": "今天午餐吃飯還是麵？"
        },
        {
            "ja": "食べたら少し休もう",
            "vi": "Ăn xong nghỉ chút nha.",
            "zh": "吃完稍微休息一下吧。"
        },
        {
            "ja": "冷たい飲み物がほしい時間だね",
            "vi": "Giờ này làm ly nước mát ha?",
            "zh": "這時間很想來杯冰涼的飲料呢。"
        },
        {
            "ja": "お昼は画面を見ない時間も大事だよ",
            "vi": "Nghỉ trưa nhớ rời màn hình chút nha.",
            "zh": "午休也記得離開螢幕一下喔。"
        },
        {
            "ja": "今日のお昼、写真に残したい？",
            "vi": "Bữa trưa nay có muốn chụp hình không?",
            "zh": "今天的午餐想拍張照嗎？"
        },
        {
            "ja": "午後に聴く曲、先に選ぶ？",
            "vi": "Chọn sẵn một bài cho buổi chiều nha?",
            "zh": "先選一首下午要聽的歌嗎？"
        },
        {
            "ja": "日本でランチなら何を食べたい？",
            "vi": "Ở Nhật thì trưa muốn ăn món gì?",
            "zh": "如果在日本，午餐想吃什麼？"
        }
    ],
    "early-afternoon": [
        {
            "ja": "眠気、来た？",
            "vi": "Buồn ngủ chưa?",
            "zh": "開始想睡了嗎？"
        },
        {
            "ja": "午後のコーヒー、いる？",
            "vi": "Cà phê chiều không?",
            "zh": "下午要來杯咖啡嗎？"
        },
        {
            "ja": "外、暑そう？",
            "vi": "Ngoài trời nóng không?",
            "zh": "外面會不會很熱？"
        },
        {
            "ja": "ちょっと気分を変えようか",
            "vi": "Mình đổi không khí chút nha.",
            "zh": "換個心情一下吧。"
        },
        {
            "ja": "日本の景色を見て目を覚ます？",
            "vi": "Xem một cảnh Nhật Bản cho tỉnh nha?",
            "zh": "看張日本風景提提神嗎？"
        },
        {
            "ja": "午後はアコースティックが合いそう？",
            "vi": "Chiều nay nghe acoustic không?",
            "zh": "下午適合聽點木吉他嗎？"
        },
        {
            "ja": "今日は時間が早く過ぎるね",
            "vi": "Hôm nay trôi nhanh ha.",
            "zh": "今天時間過得真快呢。"
        },
        {
            "ja": "これが終わったら少し休もう",
            "vi": "Làm xong cái này rồi nghỉ chút nha.",
            "zh": "做完這個就休息一下吧。"
        }
    ],
    "late-afternoon": [
        {
            "ja": "そろそろ学校や仕事、終わる？",
            "vi": "Sắp tan học hay tan làm chưa?",
            "zh": "差不多要下課或下班了嗎？"
        },
        {
            "ja": "帰る？それともどこか寄る？",
            "vi": "Về nhà hay ghé đâu đó?",
            "zh": "要回家還是去哪裡晃一下？"
        },
        {
            "ja": "夕方の空、どんな感じ？",
            "vi": "Chiều nay trời nhìn sao rồi?",
            "zh": "傍晚的天空現在怎麼樣？"
        },
        {
            "ja": "この時間はバラードもいいね",
            "vi": "Một bài ballad cho lúc này ha?",
            "zh": "這個時間聽首抒情歌也不錯。"
        },
        {
            "ja": "今日の夜ご飯、何にする？",
            "vi": "Tối nay muốn ăn gì?",
            "zh": "今晚想吃什麼？"
        },
        {
            "ja": "きれいな景色を一枚見ていく？",
            "vi": "Mình xem lại một tấm hình đẹp nha?",
            "zh": "要不要看一張漂亮的風景？"
        },
        {
            "ja": "秋ちゃん、まだ元気ある？",
            "vi": "Aki-chan, còn năng lượng không?",
            "zh": "秋ちゃん，還有精神嗎？"
        },
        {
            "ja": "そろそろゆっくりする時間だね",
            "vi": "Sắp tới giờ chậm lại rồi ha.",
            "zh": "差不多到放慢步調的時間了。"
        }
    ],
    "sunset": [
        {
            "ja": "夕焼け、見えた？",
            "vi": "Có thấy trời chiều đẹp không?",
            "zh": "有看到漂亮的晚霞嗎？"
        },
        {
            "ja": "今日、何か心に残った？",
            "vi": "Hôm nay có gì đáng nhớ không?",
            "zh": "今天有什麼讓你印象深刻嗎？"
        },
        {
            "ja": "夜ご飯、何にする？",
            "vi": "Tối nay ăn gì đây?",
            "zh": "今晚吃什麼呢？"
        },
        {
            "ja": "少し散歩したい気分？",
            "vi": "Muốn đi dạo một chút không?",
            "zh": "想不想去散個步？"
        },
        {
            "ja": "アコースティックを一曲かける？",
            "vi": "Bật một bài acoustic nha?",
            "zh": "放一首木吉他音樂嗎？"
        },
        {
            "ja": "夜の日本の景色も見てみる？",
            "vi": "Xem cảnh Nhật Bản buổi tối ha?",
            "zh": "也看看日本的夜景嗎？"
        },
        {
            "ja": "今日はもう十分がんばったよ",
            "vi": "Hôm nay mình cố gắng đủ rồi.",
            "zh": "今天已經很努力了。"
        },
        {
            "ja": "今は家にいたい？外に出たい？",
            "vi": "Giờ này thích ở nhà hay ra ngoài?",
            "zh": "現在想待在家還是出去走走？"
        }
    ],
    "evening": [
        {
            "ja": "秋ちゃん、今夜は元気？",
            "vi": "Aki-chan, tối nay khỏe không?",
            "zh": "秋ちゃん，今晚精神好嗎？"
        },
        {
            "ja": "今夜はバラード聴く？",
            "vi": "Tối nay nghe ballad không?",
            "zh": "今晚要聽抒情歌嗎？"
        },
        {
            "ja": "勉強する？それとも景色だけ見る？",
            "vi": "Muốn học hay chỉ xem hình thôi?",
            "zh": "想學習，還是只看看風景？"
        },
        {
            "ja": "ラジオ、開いてみる？",
            "vi": "Có muốn mở radio không?",
            "zh": "要不要開廣播？"
        },
        {
            "ja": "今日一日、何点だった？",
            "vi": "Một ngày hôm nay chấm mấy điểm?",
            "zh": "今天一整天打幾分？"
        },
        {
            "ja": "明日、楽しみなことある？",
            "vi": "Mai có gì mong chờ không?",
            "zh": "明天有什麼期待的事嗎？"
        },
        {
            "ja": "日本の景色を見ながら旅の想像しようか",
            "vi": "Nhìn cảnh Nhật Bản rồi mơ chuyến đi nha.",
            "zh": "看著日本風景想像下一趟旅行吧。"
        },
        {
            "ja": "今夜はのんびりでいいよ",
            "vi": "Tối nay cứ thong thả thôi.",
            "zh": "今晚悠閒一點就好。"
        }
    ],
    "late": [
        {
            "ja": "もう家でゆっくりしてる？",
            "vi": "Giờ ở nhà nghỉ chưa?",
            "zh": "已經在家休息了嗎？"
        },
        {
            "ja": "お風呂、もう入った？",
            "vi": "Tắm xong chưa?",
            "zh": "洗好澡了嗎？"
        },
        {
            "ja": "明日は早起き？",
            "vi": "Mai dậy sớm không?",
            "zh": "明天要早起嗎？"
        },
        {
            "ja": "明日の準備、できた？",
            "vi": "Chuẩn bị đồ cho mai chưa?",
            "zh": "明天的東西準備好了嗎？"
        },
        {
            "ja": "ゆっくりした曲を一曲聴く？",
            "vi": "Nghe một bài chậm rồi nghỉ nha?",
            "zh": "聽一首慢歌再休息嗎？"
        },
        {
            "ja": "今日いちばん楽しかったことは？",
            "vi": "Hôm nay điều vui nhất là gì?",
            "zh": "今天最開心的事是什麼？"
        },
        {
            "ja": "寝る前にきれいな景色を見る？",
            "vi": "Xem một cảnh đẹp trước khi ngủ nha?",
            "zh": "睡前看一張漂亮的風景嗎？"
        },
        {
            "ja": "今日は長くやりすぎないでね",
            "vi": "Đừng học quá lâu nha.",
            "zh": "今天不要學太久喔。"
        }
    ]
};

  const scenicDailyMessagesVi = [
    "Aki-chan, tìm được nơi muốn đi chưa?",
    "Chỗ này đẹp ha, Aki-chan?",
    "Nhìn là muốn đi liền ha.",
    "Aki-chan thích cảnh này không?",
    "Một ngày nào đó mình tới đây nha.",
    "Chỗ này hợp để đi chậm chậm nè.",
    "Aki-chan muốn đi cùng ai vậy?",
    "Cảnh này nhìn bình yên ghê.",
    "Muốn đứng đây ngắm một lúc ha.",
    "Aki-chan, mình lưu chỗ này nha?",
    "Nhìn thôi cũng thấy mát rồi.",
    "Chỗ này chắc chụp hình đẹp lắm.",
    "Aki-chan có muốn ghé thử không?",
    "Cảnh hôm nay dễ thương ha.",
    "Một chuyến đi nhỏ cũng vui mà.",
    "Aki-chan thích núi hay biển hơn?",
    "Chỗ này hợp đi vào buổi sáng nè.",
    "Chiều ở đây chắc đẹp lắm ha.",
    "Nhìn cảnh này thấy nhẹ lòng ghê.",
    "Aki-chan, chỗ này được đó nha.",
    "Ước gì hôm nay đang ở đây ha.",
    "Đi Nhật rồi mình ghé chỗ này nha.",
    "Cảnh này làm mình muốn đi chơi ghê.",
    "Aki-chan, chọn một nơi cho lần tới nha.",
    "Có chỗ nào làm bạn rung động chưa?",
    "Nhìn là muốn xách balô lên đường rồi.",
    "Chỗ này chắc yên tĩnh lắm nè.",
    "Aki-chan muốn ngắm cảnh này lúc nào?",
    "Một ngày thư thả ở đây thì tuyệt ha.",
    "Cảnh này hợp nghe nhạc nhẹ ghê.",
    "Aki-chan, mình đi ngắm hoa nha?",
    "Đường này chắc đi bộ vui lắm.",
    "Chỗ này có vẻ rất Nhật ha.",
    "Aki-chan thích thành phố hay vùng quê?",
    "Mình thêm chỗ này vào danh sách nha.",
    "Cảnh đẹp làm hôm nay vui hơn chút ha.",
    "Chỗ này nhìn như trong phim vậy.",
    "Aki-chan, bạn muốn tới mùa nào?",
    "Mùa xuân ở đây chắc xinh lắm.",
    "Mùa thu ở đây chắc mê lắm ha.",
    "Nếu có thời gian, mình đi xa một chút nha.",
    "Chỗ này hợp một chuyến đi cuối tuần nè.",
    "Aki-chan, thấy nơi nào quen quen không?",
    "Ngắm cảnh rồi học một câu Nhật nha.",
    "Hôm nay mình du lịch bằng mắt trước ha.",
    "Một tấm hình, một nơi muốn đến.",
    "Aki-chan, cảnh này có đúng gu không?",
    "Có khi nơi đẹp nhất lại rất yên tĩnh.",
    "Chỗ này làm mình muốn đi tàu ghê.",
    "Aki-chan, đi chậm để ngắm kỹ nha.",
    "Nhìn cảnh này muốn uống cà phê ghê.",
    "Một ngày mát trời mà tới đây thì thích ha.",
    "Aki-chan, mình tìm thêm chỗ đẹp nha.",
    "Chỗ này đáng để nhớ tên đó.",
    "Nhật Bản còn nhiều nơi hay lắm nha.",
    "Aki-chan, hôm nay thích cảnh nào nhất?",
    "Cứ mỗi ngày khám phá một nơi nha.",
    "Biết đâu đây là điểm đến tiếp theo.",
    "Nhìn cảnh này rồi nghỉ một chút nha.",
    "Aki-chan, mai mình xem chỗ khác nữa nha."
];

  const heroScenes = {
    midnight: [
      { src: "./aki-hero-camellia-red-panda.webp", position: "center 38%", ja: "椿とレッサーパンダのそばで過ごす秋ちゃん", vi: "Aki-chan bên hoa trà và gấu trúc đỏ" },
      { src: "./aki-hero-cosmos.webp", position: "center 40%", ja: "コスモスに囲まれた秋ちゃん", vi: "Aki-chan giữa vườn hoa cosmos" }
    ],
    dawn: [
      { src: "./aki-hero-sakura.webp", position: "center 37%", ja: "桜の朝を楽しむ秋ちゃん", vi: "Aki-chan trong buổi sáng có hoa anh đào" },
      { src: "./aki-hero-hydrangea.webp", position: "center 38%", ja: "紫陽花と過ごす秋ちゃん", vi: "Aki-chan bên hoa cẩm tú cầu" }
    ],
    breakfast: [
      { src: "./aki-hero.webp", position: "center 35%", ja: "植物の多いカフェで過ごす秋ちゃん", vi: "Aki-chan trong quán cà phê nhiều cây xanh" },
      { src: "./aki-hero-sakura.webp", position: "center 37%", ja: "桜のそばで朝を迎える秋ちゃん", vi: "Aki-chan đón buổi sáng bên hoa anh đào" }
    ],
    start: [
      { src: "./aki-hero-fuji-travel.webp", position: "center 40%", ja: "富士山を眺める秋ちゃん", vi: "Aki-chan ngắm núi Phú Sĩ" },
      { src: "./aki-hero.webp", position: "center 35%", ja: "カフェで勉強を始める秋ちゃん", vi: "Aki-chan bắt đầu học ở quán cà phê" }
    ],
    "late-morning": [
      { src: "./aki-hero-sunflower.webp", position: "center 40%", ja: "ひまわりと一緒の秋ちゃん", vi: "Aki-chan bên hoa hướng dương" },
      { src: "./aki-hero-hydrangea.webp", position: "center 38%", ja: "紫陽花の季節を楽しむ秋ちゃん", vi: "Aki-chan tận hưởng mùa hoa cẩm tú cầu" }
    ],
    lunch: [
      { src: "./aki-hero.webp", position: "center 35%", ja: "カフェでひと休みする秋ちゃん", vi: "Aki-chan nghỉ một chút ở quán cà phê" },
      { src: "./aki-hero-fuji-travel.webp", position: "center 40%", ja: "旅先でひと休みする秋ちゃん", vi: "Aki-chan nghỉ chân trong chuyến đi" }
    ],
    "early-afternoon": [
      { src: "./aki-hero-sunflower.webp", position: "center 40%", ja: "明るいひまわりと秋ちゃん", vi: "Aki-chan bên những bông hướng dương rực rỡ" },
      { src: "./aki-hero-hydrangea.webp", position: "center 38%", ja: "花の中でゆっくり学ぶ秋ちゃん", vi: "Aki-chan học thong thả giữa những khóm hoa" }
    ],
    "late-afternoon": [
      { src: "./aki-hero-cosmos.webp", position: "center 40%", ja: "夕方のコスモスと秋ちゃん", vi: "Aki-chan bên hoa cosmos lúc chiều" },
      { src: "./aki-hero-fuji-travel.webp", position: "center 40%", ja: "旅の景色を眺める秋ちゃん", vi: "Aki-chan ngắm cảnh trong chuyến đi" }
    ],
    sunset: [
      { src: "./aki-hero-cosmos.webp", position: "center 40%", ja: "夕暮れの花と秋ちゃん", vi: "Aki-chan bên hoa lúc hoàng hôn" },
      { src: "./aki-hero-camellia-red-panda.webp", position: "center 38%", ja: "椿とレッサーパンダと秋ちゃん", vi: "Aki-chan cùng hoa trà và gấu trúc đỏ" }
    ],
    evening: [
      { src: "./aki-hero-camellia-red-panda.webp", position: "center 38%", ja: "花と動物に囲まれてくつろぐ秋ちゃん", vi: "Aki-chan thư giãn giữa hoa và các bạn thú" },
      { src: "./aki-hero-cosmos.webp", position: "center 40%", ja: "コスモスの中でくつろぐ秋ちゃん", vi: "Aki-chan thư giãn giữa vườn hoa cosmos" }
    ],
    late: [
      { src: "./aki-hero-camellia-red-panda.webp", position: "center 38%", ja: "静かな夜を過ごす秋ちゃん", vi: "Aki-chan trong một buổi tối yên tĩnh" },
      { src: "./aki-hero.webp", position: "center 35%", ja: "静かなカフェで過ごす秋ちゃん", vi: "Aki-chan trong quán cà phê yên tĩnh" }
    ]
  };

  const localSerial = (date) =>
    Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - START_UTC) / DAY_MS);

  const dayNumber = (date) => localSerial(date) + 1;

  const studyDuration = (date) => {
    const totalDays = dayNumber(date);
    if (totalDays < 1) return { totalDays, years: 0, daysInYear: 0 };
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    let years = date.getFullYear() - 2026;
    if (month < 6 || (month === 6 && dayOfMonth < 19)) years -= 1;
    years = Math.max(0, years);
    if (years === 0) return { totalDays, years: 0, daysInYear: totalDays };
    const anniversaryUtc = Date.UTC(2026 + years, 6, 19);
    const todayUtc = Date.UTC(date.getFullYear(), month, dayOfMonth);
    const daysInYear = Math.floor((todayUtc - anniversaryUtc) / DAY_MS) + 1;
    return { totalDays, years, daysInYear };
  };

  const parseProgressNumber = (text) => {
    const value = String(text || "").match(/\d+/);
    return value ? Number(value[0]) : 0;
  };

  const progressPools = {
    "zero": [
        {
            "ja": "今日は好きな入口から始めよう。かなでも教材でも大丈夫。",
            "vi": "Hôm nay bắt đầu từ phần mình thích nha. Kana hay giáo trình đều được.",
            "zh": "今天從自己喜歡的入口開始吧，かな或教材都可以。"
        },
        {
            "ja": "最初の一歩は小さくていいよ。",
            "vi": "Bước đầu nhỏ thôi cũng được nha.",
            "zh": "第一步小小的就好。"
        },
        {
            "ja": "今日は見るだけ、聞くだけからでもいいよ。",
            "vi": "Hôm nay chỉ xem hoặc chỉ nghe trước cũng được nha.",
            "zh": "今天只看看、只聽聽開始也可以。"
        },
        {
            "ja": "気になるところを一つ開いてみよう。",
            "vi": "Mở thử một phần mình thấy tò mò nha.",
            "zh": "打開一個自己好奇的內容看看吧。"
        }
    ],
    "complete": [
        {
            "ja": "基本コースはしっかり進んだね。今日は好きなところを復習しよう。",
            "vi": "Phần cơ bản đi rất xa rồi đó. Hôm nay ôn phần mình thích nha.",
            "zh": "基礎課程已經走得很扎實了，今天複習自己喜歡的部分吧。"
        },
        {
            "ja": "覚えた日本語を、自分の会話にしていこう。",
            "vi": "Mình biến tiếng Nhật đã học thành câu nói của chính mình nha.",
            "zh": "把學過的日文慢慢變成自己的對話吧。"
        },
        {
            "ja": "今日は苦手だったところだけ見直すのもいいね。",
            "vi": "Hôm nay chỉ xem lại phần từng thấy khó cũng hay đó.",
            "zh": "今天只回頭看看以前覺得難的部分也很好。"
        },
        {
            "ja": "ここまで来たら、好きな内容を楽しんで選ぼう。",
            "vi": "Đi tới đây rồi thì chọn phần mình thích để học vui nha.",
            "zh": "走到這裡了，就開心挑自己喜歡的內容吧。"
        }
    ],
    "lesson_only": [
        {
            "ja": "レッスンが進んでいるね。今日はかなも一行だけ触れてみる？",
            "vi": "Bài học đang tiến rồi đó. Hôm nay thử thêm một hàng kana nha?",
            "zh": "課程正在前進，今天也試著碰一行かな吧？"
        },
        {
            "ja": "会話に慣れてきたね。かなを少し足すともっと読みやすくなるよ。",
            "vi": "Hội thoại quen dần rồi. Thêm chút kana sẽ đọc dễ hơn nha.",
            "zh": "會話越來越熟了，再加一點かな會更容易閱讀。"
        },
        {
            "ja": "今日はレッスンを続けても、かなに寄り道してもいいよ。",
            "vi": "Hôm nay học tiếp bài cũng được, ghé qua kana chút cũng vui nha.",
            "zh": "今天繼續課程也可以，順路看看かな也不錯。"
        },
        {
            "ja": "会話の勢いをそのまま使っていこう。",
            "vi": "Giữ nhịp hội thoại này rồi đi tiếp nha.",
            "zh": "就用現在的會話節奏繼續吧。"
        }
    ],
    "kana_only": [
        {
            "ja": "かなが進んでいるね。短い会話でも使ってみよう。",
            "vi": "Kana đang tiến tốt rồi. Mình thử gặp những âm đó trong hội thoại ngắn nha.",
            "zh": "かな進度不錯，試著在短對話中遇見這些音吧。"
        },
        {
            "ja": "書ける文字が増えてきたね。今日は教材を一つ開いてみよう。",
            "vi": "Chữ viết được nhiều lên rồi. Hôm nay mở thử một bài học nha.",
            "zh": "會寫的字越來越多了，今天打開一課教材看看吧。"
        },
        {
            "ja": "かなだけの日があってもいいよ。",
            "vi": "Có ngày chỉ học kana thôi cũng được nha.",
            "zh": "有一天只學かな也很好。"
        },
        {
            "ja": "読める音が増えたら、景色の中の文字も楽しくなるね。",
            "vi": "Đọc được nhiều âm hơn thì gặp chữ ngoài đời cũng vui hơn đó.",
            "zh": "會讀的音越多，看到生活中的文字也會更有趣。"
        }
    ],
    "balanced": [
        {
            "ja": "かなとレッスン、両方進んでいるね。今日は気分で選ぼう。",
            "vi": "Kana và bài học đều đang tiến rồi. Hôm nay chọn theo tâm trạng nha.",
            "zh": "かな和課程都在前進，今天照心情選吧。"
        },
        {
            "ja": "いいバランスだね。今日は復習を一つ混ぜよう。",
            "vi": "Nhịp học khá cân bằng rồi. Hôm nay xen một phần ôn tập nha.",
            "zh": "目前的進度很平衡，今天加一個複習吧。"
        },
        {
            "ja": "今日は好きな方を先にやっていいよ。",
            "vi": "Hôm nay thích phần nào thì làm phần đó trước nha.",
            "zh": "今天喜歡哪一邊，就先學哪一邊吧。"
        },
        {
            "ja": "進み方が安定してきたね。焦らず続けよう。",
            "vi": "Nhịp học ổn dần rồi đó. Cứ từ từ tiếp tục nha.",
            "zh": "學習節奏越來越穩了，不急著繼續吧。"
        }
    ]
};

  const progressMessage = (day) => {
    const counters = [...document.querySelectorAll(".today-screen .progress-pills > span b")];
    const lessons = parseProgressNumber(counters[0]?.textContent);
    const kana = parseProgressNumber(counters[1]?.textContent);
    let key = "balanced";
    if (lessons === 0 && kana === 0) key = "zero";
    else if (lessons >= 51 && kana >= 20) key = "complete";
    else if (lessons > 0 && kana === 0) key = "lesson_only";
    else if (kana > 0 && lessons === 0) key = "kana_only";
    const pool = progressPools[key];
    const index = Math.abs(day * 3 + lessons + kana * 2) % pool.length;
    return pool[index];
  };


  const weekdayMessages = [
    [
        {
            "ja": "日曜日。今日はゆっくりでもいいよ。",
            "vi": "Chủ nhật rồi. Hôm nay chậm một chút cũng được nha.",
            "zh": "星期日了，今天慢一點也沒關係。"
        },
        {
            "ja": "日曜日。今日はどこか行きたい？",
            "vi": "Chủ nhật rồi. Hôm nay muốn đi đâu không?",
            "zh": "星期日了，今天想去哪裡嗎？"
        },
        {
            "ja": "日曜日。明日の前にのんびりしよう。",
            "vi": "Chủ nhật rồi. Trước tuần mới mình thư thả nha.",
            "zh": "星期日了，新的一週前先放鬆一下吧。"
        }
    ],
    [
        {
            "ja": "月曜日。まずは軽く始めよう。",
            "vi": "Thứ Hai rồi. Mình bắt đầu nhẹ thôi nha.",
            "zh": "星期一了，先輕鬆開始吧。"
        },
        {
            "ja": "月曜日。今週はどんな気分？",
            "vi": "Thứ Hai rồi. Tuần mới, tâm trạng sao?",
            "zh": "星期一了，這週心情怎麼樣？"
        },
        {
            "ja": "月曜日。今週やりたいことを一つ決めよう。",
            "vi": "Thứ Hai rồi. Chọn một điều muốn làm tuần này nha.",
            "zh": "星期一了，選一件這週想做的事吧。"
        }
    ],
    [
        {
            "ja": "火曜日。少しリズムが出てきたかな。",
            "vi": "Thứ Ba rồi. Nhịp bắt đầu ổn ha.",
            "zh": "星期二了，節奏開始穩了吧。"
        },
        {
            "ja": "火曜日。今日は少し気分を変えてみる？",
            "vi": "Thứ Ba rồi. Hôm nay đổi không khí chút không?",
            "zh": "星期二了，今天換個心情嗎？"
        },
        {
            "ja": "火曜日。今日も意外と早く過ぎそう。",
            "vi": "Thứ Ba rồi. Hôm nay chắc cũng trôi nhanh ha.",
            "zh": "星期二了，今天好像也會過得很快。"
        }
    ],
    [
        {
            "ja": "水曜日。もう週の真ん中だね。",
            "vi": "Thứ Tư rồi. Giữa tuần rồi đó.",
            "zh": "星期三了，已經到一週中間了。"
        },
        {
            "ja": "水曜日。半分まで来たね。",
            "vi": "Thứ Tư rồi. Mình đi hết nửa tuần rồi nha.",
            "zh": "星期三了，這週已經走一半了。"
        },
        {
            "ja": "水曜日。今日は無理しすぎないでね。",
            "vi": "Thứ Tư rồi. Hôm nay đừng ép mình quá nha.",
            "zh": "星期三了，今天別太勉強自己。"
        }
    ],
    [
        {
            "ja": "木曜日。週末が少し見えてきたね。",
            "vi": "Thứ Năm rồi. Gần cuối tuần rồi ha.",
            "zh": "星期四了，週末快看到了。"
        },
        {
            "ja": "木曜日。今日はどんな曲を聴きたい？",
            "vi": "Thứ Năm rồi. Hôm nay muốn nghe bài gì?",
            "zh": "星期四了，今天想聽什麼歌？"
        },
        {
            "ja": "木曜日。あと少し、ゆっくりいこう。",
            "vi": "Thứ Năm rồi. Thêm chút nữa thôi, cứ thong thả nha.",
            "zh": "星期四了，再一點點，慢慢來吧。"
        }
    ],
    [
        {
            "ja": "金曜日。やっと金曜日だね。",
            "vi": "Thứ Sáu rồi đó!",
            "zh": "星期五終於到了。"
        },
        {
            "ja": "金曜日。週末がもうすぐだね。",
            "vi": "Thứ Sáu rồi. Cuối tuần sắp tới nha.",
            "zh": "星期五了，週末快到了。"
        },
        {
            "ja": "金曜日。今夜は何をごほうびにする？",
            "vi": "Thứ Sáu rồi. Tối nay tự thưởng gì đây?",
            "zh": "星期五了，今晚想怎麼犒賞自己？"
        }
    ],
    [
        {
            "ja": "土曜日。今日は少し自由にいこう。",
            "vi": "Thứ Bảy rồi. Hôm nay tự do một chút nha.",
            "zh": "星期六了，今天自在一點吧。"
        },
        {
            "ja": "土曜日。今日はどこか行きたい？",
            "vi": "Thứ Bảy rồi. Hôm nay muốn đi đâu không?",
            "zh": "星期六了，今天想去哪裡嗎？"
        },
        {
            "ja": "土曜日。週末は楽しく触れるだけでも十分。",
            "vi": "Thứ Bảy rồi. Cuối tuần học vui thôi cũng đủ nha.",
            "zh": "星期六了，週末輕鬆學、開心接觸就很夠。"
        }
    ]
];

  const milestoneMessage = (day) => {
    const exact = {
      7: { ja: "7日目。最初の一週間、よく続いたね。", vi: "Ngày thứ 7 rồi. Mình đi hết tuần đầu tiên rồi đó, hay lắm nha.", zh: "第7天了，第一週走完了，很棒。" },
      14: { ja: "14日目。二週間分の言葉が積み重なったね。", vi: "Ngày thứ 14 rồi. Hai tuần tiếng Nhật đã tích lại thành một chặng nhỏ rồi nha.", zh: "第14天了，兩週的日文已經累積成一小段路。" },
      30: { ja: "30日目。ここまでの一か月を花丸にしよう。", vi: "Ngày thứ 30 rồi. Tròn một tháng, hôm nay tự thưởng mình một bông hoa nha.", zh: "第30天了，走完一個月，今天送自己一朵花吧。" },
      50: { ja: "50日目。短い一言が、もうたくさん集まったね。", vi: "Ngày thứ 50 rồi. Những câu ngắn mình học đã thành cả một kho nhỏ rồi đó.", zh: "第50天了，短短的一句句已經累積成不少內容。" },
      100: { ja: "100日目。百日分の積み重ね、おめでとう。", vi: "Ngày thứ 100 rồi. Chúc mừng mình đã đi cùng tiếng Nhật suốt 100 ngày nha.", zh: "第100天了，恭喜累積了一百天的日文。" }
    };
    if (exact[day]) return exact[day];
    if (day > 0 && day % 100 === 0) return { ja: `${day}日目。ここまで続けた日々が力になっているよ。`, vi: `Ngày thứ ${day} rồi. Những ngày mình duy trì tới đây đã thành sức mạnh rồi đó.`, zh: `第${day}天了，一路持續到現在的日子都已經變成力量。` };
    if (day > 0 && day % 30 === 0) return { ja: `${day}日目。今日までの積み重ねを一度ほめよう。`, vi: `Ngày thứ ${day} rồi. Hôm nay mình khen chính mình vì đã duy trì tới đây nha.`, zh: `第${day}天了，今天稱讚一下持續到現在的自己吧。` };
    return null;
  };

  const currentPeriod = (hour) =>
    messages.find((item) => hour >= item.start && hour < item.end) || messages[messages.length - 1];

  const make = (tag, className, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else node.setAttribute(key, value);
    }
    return node;
  };

  function updateDayCounter(now) {
    const screen = document.querySelector(".today-screen");
    if (!screen) return;
    let card = screen.querySelector(".aki-day-counter");
    if (!card) {
      card = make("section", "aki-day-counter aki-day-counter--bottom", {
        "aria-label": "学習開始日からの日数 / Số ngày từ khi bắt đầu học / 自開始學習起的天數"
      });
      card.innerHTML = `
        <span class="aki-day-counter__flower" aria-hidden="true">✿</span>
        <div class="aki-day-counter__copy">
          <small lang="ja">開始日 2026年7月19日</small>
          <strong lang="ja"></strong>
          <b lang="vi"></b>
          <em lang="zh-Hant"></em>
        </div>
      `;
    }
    // Always keep this counter as the final content block on the Today page.
    if (screen.lastElementChild !== card) screen.appendChild(card);

    const duration = studyDuration(now);
    const ja = card.querySelector("strong[lang='ja']");
    const vi = card.querySelector("b[lang='vi']");
    const zh = card.querySelector("em[lang='zh-Hant']");
    if (duration.totalDays >= 1) {
      if (duration.years >= 1) {
        ja.textContent = `AKIGUSAと学ぶ ${duration.years}年と${duration.daysInYear}日目`;
        vi.textContent = `Đã học cùng Akigusa ${duration.years} năm và ${duration.daysInYear} ngày`;
        zh.textContent = `和AKIGUSA一起學習 ${duration.years}年又${duration.daysInYear}天`;
      } else {
        ja.textContent = `AKIGUSAと学ぶ ${duration.totalDays}日目`;
        vi.textContent = `Ngày thứ ${duration.totalDays} học cùng Akigusa`;
        zh.textContent = `和AKIGUSA一起學習第${duration.totalDays}天`;
      }
      card.dataset.mode = "count";
      card.dataset.totalDays = String(duration.totalDays);
    } else {
      const remain = 1 - duration.totalDays;
      ja.textContent = `開始まであと ${remain}日`;
      vi.textContent = `Còn ${remain} ngày nữa sẽ bắt đầu`;
      zh.textContent = `距離開始還有${remain}天`;
      card.dataset.mode = "before";
    }
  }

  const dailyVariantIndex = (day, poolLength, salt = 0, shift = 0) => {
    if (!poolLength) return 0;
    // With the 12-message time pools, +5 walks through all 12 entries before
    // the same message can return at the same time of day.
    return Math.abs(day * 5 + salt * 11 + shift) % poolLength;
  };

  function updateGreeting(now) {
    const box = document.querySelector(".today-screen .time-greeting");
    if (!box) return;
    const period = currentPeriod(now.getHours());
    const periodIndex = messages.indexOf(period);
    const day = Math.max(1, dayNumber(now));
    const variantPool = period.variants.concat(extraMessages[period.key] || []);
    const index = dailyVariantIndex(day, variantPool.length, periodIndex, state.messageShift);
    const message = variantPool[index];

    box.className = `time-greeting time-greeting--${period.key} aki-time-greeting`;
    box.dataset.timePeriod = period.key;
    box.dataset.akiEnhanced = "true";

    const mark = box.querySelector(".time-greeting-mark");
    const ja = box.querySelector(".time-greeting-copy h2");
    const vi = box.querySelector(".time-greeting-vi");
    const zh = box.querySelector(".time-greeting-zh");
    if (mark) mark.textContent = period.mark;
    if (ja) ja.textContent = message.ja;
    if (vi) vi.textContent = message.vi;
    if (zh) zh.textContent = message.zh;

    let dayNote = box.querySelector(".aki-greeting-daynote");
    const milestone = milestoneMessage(day);
    const weekdayPool = weekdayMessages[now.getDay()];
    const weekdayIndex = Math.floor(Math.max(0, day - 1) / 7) % weekdayPool.length;
    const dayText = milestone || weekdayPool[weekdayIndex];
    if (!dayNote) {
      dayNote = make("p", "aki-greeting-daynote");
      box.querySelector(".time-greeting-copy")?.appendChild(dayNote);
    }
    dayNote.classList.toggle("is-milestone", Boolean(milestone));
    dayNote.innerHTML = `<span lang="ja"></span><strong lang="vi"></strong><small lang="zh-Hant"></small>`;
    dayNote.querySelector("[lang='ja']").textContent = dayText.ja;
    dayNote.querySelector("[lang='vi']").textContent = dayText.vi;
    dayNote.querySelector("[lang='zh-Hant']").textContent = dayText.zh;

    let progressNote = box.querySelector(".aki-greeting-progressnote");
    const progressText = progressMessage(day);
    if (!progressNote) {
      progressNote = make("p", "aki-greeting-progressnote");
      box.querySelector(".time-greeting-copy")?.appendChild(progressNote);
    }
    progressNote.innerHTML = `<span lang="ja"></span><strong lang="vi"></strong><small lang="zh-Hant"></small>`;
    progressNote.querySelector("[lang='ja']").textContent = progressText.ja;
    progressNote.querySelector("[lang='vi']").textContent = progressText.vi;
    progressNote.querySelector("[lang='zh-Hant']").textContent = progressText.zh;


    let controls = box.querySelector(".aki-greeting-controls");
    if (!controls) {
      controls = make("div", "aki-greeting-controls");
      controls.innerHTML = `
        <small class="aki-greeting-clock" aria-live="off"></small>
        <button type="button" class="aki-message-next">
          <span lang="ja">別のひとこと</span>
          <b lang="vi">Lời nhắn khác</b>
        </button>
      `;
      controls.querySelector("button").addEventListener("click", () => {
        state.messageShift += 1;
        updateGreeting(new Date());
      });
      box.querySelector(".time-greeting-copy")?.appendChild(controls);
    }
    const clock = controls.querySelector(".aki-greeting-clock");
    if (clock) {
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      clock.textContent = `${hh}:${mm} · ${period.start}:00–${period.end}:00`;
    }
  }


  function decorateRadio() {
    const page = document.querySelector(".rx-page");
    if (!page) return;

    const heading = page.querySelector(".rx-page-heading");
    if (heading && !page.querySelector(".aki-radio-intro")) {
      const intro = make("section", "aki-radio-intro");
      intro.innerHTML = `
        <div>
          <b lang="ja">日本・ベトナム・台湾の音楽を、その日の気分で。</b>
          <strong lang="vi">Chọn nhạc Nhật, Việt hoặc Đài Loan theo tâm trạng hôm nay.</strong>
          <small lang="zh-Hant">依照今天的心情，選擇日本、越南或台灣的音樂。</small>
        </div>
        <p>
          <span lang="ja">音が一時的に途切れた場合は、すぐ読み込み直さず数秒待ってから自動再接続します。</span>
          <b lang="vi">Khi âm thanh chập chờn, ứng dụng sẽ chờ vài giây rồi mới tự kết nối lại.</b>
        </p>
      `;
      heading.insertAdjacentElement("afterend", intro);
    }

    const grid = page.querySelector(".rx-station-grid");
    if (!grid) return;

    for (const card of grid.querySelectorAll(".rx-station-card")) {
      const name = card.querySelector("button strong")?.textContent?.trim() || "";
      const text = card.textContent || "";
      let region = "jp";
      let regionLabel = "NHẬT BẢN";
      if (/VOH|VOV3/.test(name)) {
        region = "vn";
        regionLabel = "VIỆT NAM";
      } else if (/ASIA FM|Classical FM|Taiwan Lounge/i.test(name)) {
        region = "tw";
        regionLabel = "ĐÀI LOAN";
      }
      card.dataset.akiRegion = region;
      card.dataset.akiRegionLabel = regionLabel;
      card.dataset.akiRelax = /Jazz|VOH FM 95\.6|VOV3|ASIA FM|Classical FM|Taiwan Lounge|軽|落ち着|ballad|thư giãn|nhẹ/i.test(text) ? "true" : "false";
      card.hidden = state.radioFilter === "all"
        ? false
        : state.radioFilter === "relax"
          ? card.dataset.akiRelax !== "true"
          : card.dataset.akiRegion !== state.radioFilter;
    }

    let filters = page.querySelector(".aki-radio-filters");
    if (!filters) {
      filters = make("div", "aki-radio-filters", {
        role: "group",
        "aria-label": "ラジオ局を地域・気分で絞り込む / Lọc đài theo khu vực hoặc tâm trạng"
      });
      const items = [
        ["all", "すべて", "Tất cả"],
        ["jp", "日本", "Nhật Bản"],
        ["vn", "ベトナム", "Việt Nam"],
        ["tw", "台湾", "Đài Loan"],
        ["relax", "リラックス", "Thư giãn"]
      ];
      for (const [value, ja, vi] of items) {
        const button = make("button", "", { type: "button", "data-filter": value });
        button.innerHTML = `<span lang="ja">${ja}</span><b lang="vi">${vi}</b>`;
        button.addEventListener("click", () => {
          state.radioFilter = value;
          decorateRadio();
        });
        filters.appendChild(button);
      }
      grid.insertAdjacentElement("beforebegin", filters);
    }
    for (const button of filters.querySelectorAll("button")) {
      const active = button.dataset.filter === state.radioFilter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    }
  }

  function decorateScenicDailyMessage(now = new Date()) {
    const scenicMain = document.querySelector(".scenic-day-viewer .scenic-main, .scenic-main");
    if (!scenicMain) return;
    let card = scenicMain.parentElement?.querySelector(":scope > .aki-scenic-daily-message");
    if (!card) {
      card = make("section", "aki-scenic-daily-message", {
        "aria-label": "Lời nhắn hôm nay cho Aki-chan"
      });
      card.innerHTML = `<span aria-hidden="true">✿</span><p lang="vi"></p>`;
      scenicMain.insertAdjacentElement("afterend", card);
    }
    const serial = Math.max(0, dayNumber(now) - 1);
    const message = scenicDailyMessagesVi[serial % scenicDailyMessagesVi.length];
    const p = card.querySelector("p[lang='vi']");
    if (p) p.textContent = message;
    card.dataset.akiDailyMessage = String((serial % scenicDailyMessagesVi.length) + 1);
  }

  function normalizeHero(now = new Date()) {
    const picture = document.querySelector(".today-screen .hero-picture");
    const image = picture?.querySelector(".hero-art");
    if (!picture || !image) return;
    picture.dataset.akiFullWidth = "true";
    image.removeAttribute("loading");

    const period = currentPeriod(now.getHours());
    const pool = heroScenes[period.key] || heroScenes.breakfast;
    const scene = pool[Math.abs(dayNumber(now) + now.getDay() + messages.indexOf(period)) % pool.length];
    if (image.getAttribute("src") !== scene.src) image.setAttribute("src", scene.src);
    image.setAttribute("alt", `${scene.ja} / ${scene.vi}`);
    image.style.objectPosition = scene.position;
    picture.style.backgroundImage = `url("${scene.src}")`;
    picture.style.backgroundPosition = scene.position;
    picture.dataset.akiHeroScene = scene.src.replace(/^\.\//, "").replace(/\.webp$/, "");
  }

  function applyAll() {
    const now = new Date();
    document.documentElement.dataset.akigusaEnhancement = ENHANCEMENT_RELEASE;
    updateDayCounter(now);
    updateGreeting(now);
    removeRetiredFlowerPanel();
    decorateRadio();
    decorateScenicDailyMessage(now);
    normalizeHero(now);
  }

  const observer = new MutationObserver(schedule);

  function run() {
    observer.disconnect();
    applyAll();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function schedule() {
    if (state.scheduled) return;
    state.scheduled = true;
    requestAnimationFrame(() => {
      state.scheduled = false;
      run();
    });
  }

  const start = () => {
    run();
    window.setInterval(run, 60000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") run();
    });
  };

  const reactIsReady = () => {
    const probes = [
      document.querySelector(".app-shell"),
      document.querySelector(".hero-card"),
      document.querySelector(".bottom-nav button")
    ].filter(Boolean);
    return probes.some((node) =>
      Object.keys(node).some((key) =>
        key.startsWith("__reactFiber$") ||
        key.startsWith("__reactProps$") ||
        key.startsWith("__reactContainer$")
      )
    );
  };

  const bootAfterHydration = (attempt = 0) => {
    if (reactIsReady() || attempt >= 40) {
      start();
      return;
    }
    window.setTimeout(() => bootAfterHydration(attempt + 1), 100);
  };

  const queueBoot = () => window.setTimeout(() => bootAfterHydration(), 150);
  if (document.readyState === "complete") {
    queueBoot();
  } else {
    window.addEventListener("load", queueBoot, { once: true });
  }
})();