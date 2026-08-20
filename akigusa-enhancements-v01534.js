(() => {
  "use strict";

  const START_UTC = Date.UTC(2026, 6, 19);
  const DAY_MS = 86400000;
  const state = { messageShift: 0, flowerShift: 0, radioFilter: "all", scheduled: false };

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

  const flowers = [
    { src: "./flower-ume-snow.webp", ja: "梅", vi: "Hoa mơ", zh: "梅花", lineJa: "寒い日にも、少しずつ前へ。", lineVi: "Dù ngày lạnh, mình vẫn tiến từng chút một nha.", lineZh: "即使天冷，也一點一點向前。" },
    { src: "./flower-morning-glory.webp", ja: "朝顔", vi: "Hoa bìm bìm", zh: "牽牛花", lineJa: "朝の一言を、大切にしよう。", lineVi: "Mình trân trọng câu đầu tiên của buổi sáng nhé.", lineZh: "珍惜早晨的第一句話吧。" },
    { src: "./flower-hydrangea.webp", ja: "紫陽花", vi: "Hoa cẩm tú cầu", zh: "繡球花", lineJa: "色が変わるように、学び方も変えていい。", lineVi: "Cách học có thể đổi theo mình, giống như màu hoa vậy.", lineZh: "就像花色會變，學習方式也可以調整。" },
    { src: "./flower-sunflower.webp", ja: "ひまわり", vi: "Hoa hướng dương", zh: "向日葵", lineJa: "今日できたことを、明るく見つけよう。", lineVi: "Mình nhìn vào điều hôm nay đã làm được nha.", lineZh: "看看今天已經做到的事吧。" },
    { src: "./flower-hanashobu.webp", ja: "花菖蒲", vi: "Hoa diên vĩ Nhật", zh: "花菖蒲", lineJa: "落ち着いて、一つずつ覚えよう。", lineVi: "Bình tĩnh học từng phần một nha.", lineZh: "靜下心來，一個一個記住吧。" },
    { src: "./flower-kiku-wreath.webp", ja: "菊", vi: "Hoa cúc", zh: "菊花", lineJa: "続けた日々が、きれいな輪になる。", lineVi: "Những ngày mình tiếp tục sẽ kết thành một vòng hoa đẹp.", lineZh: "持續的每一天，會連成美麗的花環。" },
    { src: "./flower-nanohana.webp", ja: "菜の花", vi: "Hoa cải vàng", zh: "油菜花", lineJa: "小さな言葉が、春の道をつくる。", lineVi: "Từng từ nhỏ sẽ mở ra một con đường mới nha.", lineZh: "一個個小詞，會鋪出新的道路。" },
    { src: "./flower-suisen.webp", ja: "水仙", vi: "Hoa thủy tiên", zh: "水仙花", lineJa: "静かな時間も、学びの味方。", lineVi: "Khoảng thời gian yên tĩnh cũng là bạn của việc học.", lineZh: "安靜的時間，也是學習的好夥伴。" },
    { src: "./sakura-sprig.webp", ja: "桜", vi: "Hoa anh đào", zh: "櫻花", lineJa: "一つ覚えるたび、花びらが増える。", lineVi: "Mỗi lần nhớ thêm một điều, mình lại có thêm một cánh hoa.", lineZh: "每記住一件事，就多一片花瓣。" },
    { src: "./wisteria-hang.webp", ja: "藤", vi: "Hoa tử đằng", zh: "紫藤", lineJa: "ゆっくりでも、下へ長く伸びていく。", lineVi: "Đi chậm cũng được, miễn là mình vẫn lớn lên từng ngày.", lineZh: "慢慢來也可以，每天都在成長。" },
    { src: "./autumn-flower-grass.webp", ja: "秋草", vi: "Hoa cỏ mùa thu", zh: "秋草", lineJa: "いろいろな学び方が、一つの景色になる。", lineVi: "Nhiều cách học khác nhau sẽ tạo thành một khung cảnh đẹp.", lineZh: "不同的學習方式，會成為一幅風景。" }
  ];

  const localSerial = (date) =>
    Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - START_UTC) / DAY_MS);

  const dayNumber = (date) => localSerial(date) + 1;

  const weekdayMessages = [
    { ja: "日曜日。今週できたことを一つ見つけよう。", vi: "Chủ nhật rồi. Mình nhìn lại một điều tuần này đã làm được nha.", zh: "星期日了，找一件這週已經做到的事吧。" },
    { ja: "月曜日。今週の最初の一歩を小さく始めよう。", vi: "Thứ Hai rồi. Mình bắt đầu tuần mới bằng một bước nhỏ thôi nha.", zh: "星期一了，用小小的一步開始新的一週吧。" },
    { ja: "火曜日。昨日の一言を、今日はもう一度使ってみよう。", vi: "Thứ Ba rồi. Mình thử dùng lại một câu của hôm qua hôm nay nha.", zh: "星期二了，把昨天的一句話今天再用一次吧。" },
    { ja: "水曜日。週の真ん中、今日は無理せず続けよう。", vi: "Thứ Tư, giữa tuần rồi. Hôm nay mình cứ học vừa sức nha.", zh: "星期三，來到一週中間了。今天照自己的步調繼續吧。" },
    { ja: "木曜日。覚えた言葉を、別の場面に広げてみよう。", vi: "Thứ Năm rồi. Mình thử đem từ đã học sang một tình huống khác nha.", zh: "星期四了，把會的詞換到另一個情境試試看吧。" },
    { ja: "金曜日。今週よく使った日本語を一つ残そう。", vi: "Thứ Sáu rồi. Mình chọn một câu tiếng Nhật dùng nhiều nhất tuần này nha.", zh: "星期五了，選一句這週最常用的日文留下來吧。" },
    { ja: "土曜日。少し長めに、楽しく触れてみてもいいね。", vi: "Thứ Bảy rồi. Hôm nay học vui thêm một chút cũng được nha.", zh: "星期六了，今天可以多享受一下學習。" }
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
    const hero = document.querySelector(".today-screen .hero-card");
    if (!hero) return;
    let card = document.querySelector(".today-screen .aki-day-counter");
    if (!card) {
      card = make("section", "aki-day-counter", {
        "aria-label": "学習開始日からの日数 / Số ngày từ khi bắt đầu học / 自開始學習起的天數"
      });
      card.innerHTML = `
        <span class="aki-day-counter__flower" aria-hidden="true">✿</span>
        <div class="aki-day-counter__copy">
          <small lang="ja">2026年7月19日から</small>
          <strong lang="ja"></strong>
          <b lang="vi"></b>
          <em lang="zh-Hant"></em>
        </div>
      `;
      hero.insertAdjacentElement("afterend", card);
    }
    const day = dayNumber(now);
    const ja = card.querySelector("strong[lang='ja']");
    const vi = card.querySelector("b[lang='vi']");
    const zh = card.querySelector("em[lang='zh-Hant']");
    if (day >= 1) {
      ja.textContent = `AKIGUSAと学ぶ ${day}日目`;
      vi.textContent = `Ngày thứ ${day} học cùng Akigusa`;
      zh.textContent = `從2026年7月19日起，第${day}天`;
      card.dataset.mode = "count";
    } else {
      const remain = 1 - day;
      ja.textContent = `開始まであと ${remain}日`;
      vi.textContent = `Còn ${remain} ngày nữa sẽ bắt đầu`;
      zh.textContent = `距離開始還有${remain}天`;
      card.dataset.mode = "before";
    }
  }

  function updateGreeting(now) {
    const box = document.querySelector(".today-screen .time-greeting");
    if (!box) return;
    const period = currentPeriod(now.getHours());
    const periodIndex = messages.indexOf(period);
    const day = Math.max(1, dayNumber(now));
    const index = (day + now.getDay() * 2 + periodIndex + state.messageShift) % period.variants.length;
    const message = period.variants[index];

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
    const dayText = milestone || weekdayMessages[now.getDay()];
    if (!dayNote) {
      dayNote = make("p", "aki-greeting-daynote");
      box.querySelector(".time-greeting-copy")?.appendChild(dayNote);
    }
    dayNote.classList.toggle("is-milestone", Boolean(milestone));
    dayNote.innerHTML = `<span lang="ja"></span><strong lang="vi"></strong><small lang="zh-Hant"></small>`;
    dayNote.querySelector("[lang='ja']").textContent = dayText.ja;
    dayNote.querySelector("[lang='vi']").textContent = dayText.vi;
    dayNote.querySelector("[lang='zh-Hant']").textContent = dayText.zh;

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

  function renderFlower(now) {
    const quick = document.querySelector(".today-screen .quick-grid");
    if (!quick) return;
    let panel = document.querySelector(".today-screen .aki-flower-panel");
    if (!panel) {
      panel = make("section", "aki-flower-panel", {
        "aria-label": "今日の花 / Hoa hôm nay / 今日之花"
      });
      panel.innerHTML = `
        <div class="aki-flower-panel__visual">
          <img class="aki-flower-panel__main" src="" alt="" decoding="async">
          <div class="aki-flower-panel__mini" aria-hidden="true"></div>
        </div>
        <div class="aki-flower-panel__copy">
          <span class="aki-flower-panel__kicker">✿ FLOWER OF THE DAY ✿</span>
          <h2><span lang="ja">今日の花</span><small lang="vi">Hoa hôm nay</small></h2>
          <h3><span lang="ja"></span><b lang="vi"></b><small lang="zh-Hant"></small></h3>
          <p lang="ja"></p>
          <strong lang="vi"></strong>
          <em lang="zh-Hant"></em>
          <button type="button" class="aki-flower-next">
            <span lang="ja">次の花</span><b lang="vi">Hoa tiếp theo</b>
          </button>
        </div>
      `;
      panel.querySelector(".aki-flower-next").addEventListener("click", () => {
        state.flowerShift += 1;
        renderFlower(new Date());
      });
      quick.insertAdjacentElement("afterend", panel);
    }
    const day = Math.max(1, dayNumber(now));
    const index = (day + state.flowerShift) % flowers.length;
    const flower = flowers[index];
    const img = panel.querySelector(".aki-flower-panel__main");
    img.src = flower.src;
    img.alt = `${flower.ja} / ${flower.vi} / ${flower.zh}`;
    panel.querySelector("h3 span[lang='ja']").textContent = flower.ja;
    panel.querySelector("h3 b[lang='vi']").textContent = flower.vi;
    panel.querySelector("h3 small[lang='zh-Hant']").textContent = flower.zh;
    panel.querySelector("p[lang='ja']").textContent = flower.lineJa;
    panel.querySelector(".aki-flower-panel__copy > strong[lang='vi']").textContent = flower.lineVi;
    panel.querySelector(".aki-flower-panel__copy > em[lang='zh-Hant']").textContent = flower.lineZh;

    const mini = panel.querySelector(".aki-flower-panel__mini");
    mini.replaceChildren();
    for (let offset = 1; offset <= 4; offset += 1) {
      const next = flowers[(index + offset) % flowers.length];
      const miniImg = make("img", "", { src: next.src, alt: "" });
      miniImg.loading = "lazy";
      mini.appendChild(miniImg);
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

  function normalizeHero() {
    const picture = document.querySelector(".today-screen .hero-picture");
    const image = picture?.querySelector(".hero-art");
    if (!picture || !image) return;
    picture.dataset.akiFullWidth = "true";
    image.removeAttribute("loading");
  }

  function applyAll() {
    const now = new Date();
    updateDayCounter(now);
    updateGreeting(now);
    renderFlower(now);
    decorateRadio();
    normalizeHero();
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