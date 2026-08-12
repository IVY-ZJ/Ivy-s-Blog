/* ============================================================
   login.js
   - Random vertical-Chinese poetry (60 uplifting lines)
   - Drag-to-target human verification
   - Theme toggle (light/dark, persisted)
   - Form submission → localStorage auth → redirect to index
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Anti-clickjacking (frame-buster) ---------- */
  (function frameBust() {
    if (window.self === window.top) return;
    try {
      window.top.location = window.self.location;
    } catch (e) {
      document.documentElement.style.display = "none";
      document.addEventListener("DOMContentLoaded", function () {
        document.body.style.display = "none";
      });
    }
  })();

  /* ----- Uplifting classical poems -----
     Format: [ 诗句行..., 作者 ] — last element is always the author.
     Each preceding element is one vertical line (column) of the poem,
     read right-to-left in vertical-rl layout.
     Author column uses the unified "朝代·作者《作品》" format. ----- */
  const POETRY = [
    [
      "长风破浪会有时",
      "直挂云帆济沧海",
      "唐·李白《行路难·其一》"
    ],
    [
      "会当凌绝顶",
      "一览众山小",
      "唐·杜甫《望岳》"
    ],
    [
      "海内存知己",
      "天涯若比邻",
      "唐·王勃《送杜少府之任蜀州》"
    ],
    [
      "落霞与孤鹜齐飞",
      "秋水共长天一色",
      "唐·王勃《滕王阁序》"
    ],
    [
      "莫愁前路无知己",
      "天下谁人不识君",
      "唐·高适《别董大二首·其一》"
    ],
    [
      "人生自古谁无死",
      "留取丹心照汗青",
      "宋·文天祥《过零丁洋》"
    ],
    [
      "沉舟侧畔千帆过",
      "病树前头万木春",
      "唐·刘禹锡《酬乐天扬州初逢席上见赠》"
    ],
    [
      "山重水复疑无路",
      "柳暗花明又一村",
      "宋·陆游《游山西村》"
    ],
    [
      "沾衣欲湿杏花雨",
      "吹面不寒杨柳风",
      "宋·志南《绝句》"
    ],
    [
      "明月松间照",
      "清泉石上流",
      "唐·王维《山居秋暝》"
    ],
    [
      "行到水穷处",
      "坐看云起时",
      "唐·王维《终南别业》"
    ],
    [
      "大漠孤烟直",
      "长河落日圆",
      "唐·王维《使至塞上》"
    ],
    [
      "天生我材必有用",
      "千金散尽还复来",
      "唐·李白《将进酒》"
    ],
    [
      "仰天大笑出门去",
      "我辈岂是蓬蒿人",
      "唐·李白《南陵别儿童入京》"
    ],
    [
      "两岸猿声啼不住",
      "轻舟已过万重山",
      "唐·李白《早发白帝城》"
    ],
    [
      "朝辞白帝彩云间",
      "千里江陵一日还",
      "唐·李白《早发白帝城》"
    ],
    [
      "飞流直下三千尺",
      "疑是银河落九天",
      "唐·李白《望庐山瀑布》"
    ],
    [
      "故人西辞黄鹤楼",
      "烟花三月下扬州",
      "唐·李白《黄鹤楼送孟浩然之广陵》"
    ],
    [
      "俱怀逸兴壮思飞",
      "欲上青天揽明月",
      "唐·李白《宣州谢朓楼饯别校书叔云》"
    ],
    [
      "渭城朝雨浥轻尘",
      "客舍青青柳色新",
      "唐·王维《送元二使安西》"
    ],
    [
      "红豆生南国",
      "春来发几枝",
      "唐·王维《相思》"
    ],
    [
      "人闲桂花落",
      "夜静春山空",
      "唐·王维《鸟鸣涧》"
    ],
    [
      "月出惊山鸟",
      "时鸣春涧中",
      "唐·王维《鸟鸣涧》"
    ],
    [
      "天街小雨润如酥",
      "草色遥看近却无",
      "唐·韩愈《早春呈水部张十八员外》"
    ],
    [
      "几处早莺争暖树",
      "谁家新燕啄春泥",
      "唐·白居易《钱塘湖春行》"
    ],
    [
      "接天莲叶无穷碧",
      "映日荷花别样红",
      "宋·杨万里《晓出净慈寺送林子方》"
    ],
    [
      "小荷才露尖尖角",
      "早有蜻蜓立上头",
      "宋·杨万里《小池》"
    ],
    [
      "春风又绿江南岸",
      "明月何时照我还",
      "宋·王安石《泊船瓜洲》"
    ],
    [
      "不畏浮云遮望眼",
      "自缘身在最高层",
      "宋·王安石《登飞来峰》"
    ],
    [
      "墙角数枝梅",
      "凌寒独自开",
      "宋·王安石《梅花》"
    ],
    [
      "何当共剪西窗烛",
      "却话巴山夜雨时",
      "唐·李商隐《夜雨寄北》"
    ],
    [
      "疏影横斜水清浅",
      "暗香浮动月黄昏",
      "宋·林逋《山园小梅》"
    ],
    [
      "莫道桑榆晚",
      "为霞尚满天",
      "唐·刘禹锡《酬乐天咏老见示》"
    ],
    [
      "我劝天公重抖擞",
      "不拘一格降人才",
      "清·龚自珍《己亥杂诗·其五》"
    ],
    [
      "落红不是无情物",
      "化作春泥更护花",
      "清·龚自珍《己亥杂诗·其五》"
    ],
    [
      "海纳百川有容乃大",
      "壁立千仞无欲则刚",
      "清·林则徐《自勉联》"
    ],
    [
      "千磨万击还坚劲",
      "任尔东西南北风",
      "清·郑板桥《竹石》"
    ],
    [
      "大漠沙如雪",
      "燕山月似钩",
      "唐·李贺《马诗二十三首·其五》"
    ],
    [
      "男儿何不带吴钩",
      "收取关山五十州",
      "唐·李贺《南园十三首·其五》"
    ],
    [
      "一年好景君须记",
      "最是橙黄橘绿时",
      "宋·苏轼《赠刘景文》"
    ],
    [
      "竹外桃花三两枝",
      "春江水暖鸭先知",
      "宋·苏轼《惠崇春江晚景·其一》"
    ],
    [
      "欲把西湖比西子",
      "淡妆浓抹总相宜",
      "宋·苏轼《饮湖上初晴后雨》"
    ],
    [
      "水光潋滟晴方好",
      "山色空蒙雨亦奇",
      "宋·苏轼《饮湖上初晴后雨》"
    ],
    [
      "但愿人长久",
      "千里共婵娟",
      "宋·苏轼《水调歌头·明月几时有》"
    ],
    [
      "一点浩然气",
      "千里快哉风",
      "宋·苏轼《水调歌头·黄州快哉亭赠张偓佺》"
    ],
    [
      "不识庐山真面目",
      "只缘身在此山中",
      "宋·苏轼《题西林壁》"
    ],
    [
      "横看成岭侧成峰",
      "远近高低各不同",
      "宋·苏轼《题西林壁》"
    ],
    [
      "欲穷千里目",
      "更上一层楼",
      "唐·王之涣《登鹳雀楼》"
    ],
    [
      "老骥伏枥",
      "志在千里",
      "汉·曹操《龟虽寿》"
    ],
    [
      "野旷天低树",
      "江清月近人",
      "唐·孟浩然《宿建德江》"
    ],
    [
      "气蒸云梦泽",
      "波撼岳阳城",
      "唐·孟浩然《望洞庭湖赠张丞相》"
    ],
    [
      "绿树村边合",
      "青山郭外斜",
      "唐·孟浩然《过故人庄》"
    ],
    [
      "江流天地外",
      "山色有无中",
      "唐·王维《汉江临泛》"
    ],
    [
      "草枯鹰眼疾",
      "雪尽马蹄轻",
      "唐·王维《观猎》"
    ],
    [
      "千里莺啼绿映红",
      "水村山郭酒旗风",
      "唐·杜牧《江南春》"
    ],
    [
      "借问酒家何处有",
      "牧童遥指杏花村",
      "唐·杜牧《清明》"
    ],
    [
      "停车坐爱枫林晚",
      "霜叶红于二月花",
      "唐·杜牧《山行》"
    ],
    [
      "远上寒山石径斜",
      "白云生处有人家",
      "唐·杜牧《山行》"
    ],
    [
      "南朝四百八十寺",
      "多少楼台烟雨中",
      "唐·杜牧《江南春》"
    ],
    [
      "二十四桥明月夜",
      "玉人何处教吹箫",
      "唐·杜牧《寄扬州韩绰判官》"
    ],
    [
      "青山意气峥嵘似",
      "为我归来妩媚生",
      "宋·辛弃疾《沁园春·再到期思卜筑》"
    ],
    [
      "出门一笑",
      "月落江横",
      "数峰天远",
      "宋·张炎《烛影摇红·隔窗闻歌》"
    ],
    [
      "此身天地一虚舟",
      "何处江山不自由",
      "明·陈献章《舫子》"
    ],
    [
      "白云来往青山在",
      "对酒开怀",
      "元·张可久《殿前欢·次酸斋韵》"
    ],
    [
      "即今江海一归客",
      "他日云霄万里人",
      "唐·高适《送桂阳孝廉》"
    ],
    [
      "莫愁千里路",
      "自有到来风",
      "唐·钱珝《江行无题一百首》"
    ],
    [
      "少年负壮气",
      "奋烈自有时",
      "唐·李白《少年行二首》"
    ],
    [
      "一笑出门去",
      "千里落花风",
      "宋·辛弃疾《水调歌头·我饮不须劝》"
    ],
    [
      "时人不识凌云木",
      "直待凌云始道高",
      "唐·杜荀鹤《小松》"
    ],
    [
      "闲云野鹤无常住",
      "何处江天不可飞",
      "唐·贯休《喻世明言·卷二十一》"
    ],
    [
      "一生大笑能几回",
      "斗酒相逢须醉倒",
      "唐·岑参《凉州馆中与诸判官夜集》"
    ],
    [
      "须知少日拏云志",
      "曾许人间第一流",
      "清·吴庆坻《题三十小象》"
    ],
    [
      "人间岁月堂堂去",
      "劝君快上青云路",
      "宋·辛弃疾《菩萨蛮·送曹君之庄所》"
    ],
    [
      "天宽地大得自由",
      "如此足矣何多求",
      "宋·王炎《薄薄酒》"
    ],
    [
      "芳林新叶催陈叶",
      "流水前波让后波",
      "唐·刘禹锡《乐天见示伤微之敦诗晦叔三君子皆有深分因成是诗以寄》"
    ],
    [
      "唤起一天明月",
      "照我满怀冰雪",
      "浩荡百川流",
      "宋·辛弃疾《水调歌头·和马叔度游月波楼》"
    ],
    [
      "一枝先破玉溪春",
      "更无花态度",
      "全有雪精神",
      "宋·辛弃疾《临江仙·探梅》"
    ],
    [
      "闲眠尽日无人到",
      "自有春风为扫门",
      "唐·李涉《竹里》"
    ],
    [
      "一路缘溪花覆水",
      "不妨闲看不妨行",
      "唐·雍陶《春行武关作》"
    ],
    [
      "松风庭院昼沉沉",
      "颇惬浮生习静心",
      "明·谢复《祠中偶题》"
    ],
    [
      "我是天公度外人",
      "看山看水自由身",
      "宋·陆游《独游城西诸僧舍》"
    ],
    [
      "浮云出处元无定",
      "得似浮云也自由",
      "宋·辛弃疾《鹧鸪天·欲上高楼去避愁》"
    ],
    [
      "须信百年俱是梦",
      "天地阔",
      "且徜徉",
      "元·邵亨贞《江城子·癸丑岁季夏下浣》"
    ],
    [
      "花满渚",
      "酒满瓯",
      "万顷波中得自由",
      "五代·李煜《渔父》"
    ],
    [
      "休对故人思故国",
      "且将新火试新茶",
      "诗酒趁年华",
      "宋·苏轼《望江南·超然台作》"
    ],
    [
      "大鹏一日同风起",
      "扶摇直上九万里",
      "唐·李白《上李邕》"
    ],
    [
      "穷且益坚",
      "不坠青云之志",
      "唐·王勃《滕王阁序》"
    ],
    [
      "雄关漫道真如铁",
      "而今迈步从头越",
      "毛泽东《忆秦娥·娄山关》"
    ],
    [
      "自古逢秋悲寂寥",
      "我言秋日胜春朝",
      "唐·刘禹锡《秋词》"
    ],
    [
      "兴酣落笔摇五岳",
      "诗成笑傲凌沧洲",
      "唐·李白《江上吟》"
    ],
    [
      "白日放歌须纵酒",
      "青春作伴好还乡",
      "唐·杜甫《闻官军收河南河北》"
    ],
    [
      "谁道人生无再少",
      "门前流水尚能西",
      "休将白发唱黄鸡",
      "宋·苏轼《浣溪沙·游蕲水清泉寺》"
    ]
  ];

  // Prevent last session's couplet from re-showing on every load
  function pickPoetry() {
    let pick;
    let guard = 0;
    do {
      pick = POETRY[Math.floor(Math.random() * POETRY.length)];
      guard++;
    } while (
      guard < 5 &&
      sessionStorage.getItem("ivy-last-couplet") === pick[0] &&
      POETRY.length > 1
    );
    sessionStorage.setItem("ivy-last-couplet", pick[0]);
    return pick;
  }

  /* ----- Six SVG shape variants (56x56 viewBox) ----- */
  const SHAPES = [
    // 1. Moon (crescent)
    `<path d="M36 10a18 18 0 1 0 16 26a14 14 0 0 1-16-26Z" fill="#5ac8fa" stroke="#007aff" stroke-width="1.5" stroke-linejoin="round"/>`,
    // 2. Sun (with rays)
    `<circle cx="28" cy="28" r="11" fill="#ffcc00" stroke="#ff9500" stroke-width="1.5"/>
     <g stroke="#ff9500" stroke-width="2" stroke-linecap="round">
       <line x1="28" y1="6" x2="28" y2="12"/>
       <line x1="28" y1="44" x2="28" y2="50"/>
       <line x1="6" y1="28" x2="12" y2="28"/>
       <line x1="44" y1="28" x2="50" y2="28"/>
       <line x1="12.6" y1="12.6" x2="16.8" y2="16.8"/>
       <line x1="39.2" y1="39.2" x2="43.4" y2="43.4"/>
       <line x1="12.6" y1="43.4" x2="16.8" y2="39.2"/>
       <line x1="39.2" y1="16.8" x2="43.4" y2="12.6"/>
     </g>`,
    // 3. Heart (friendly, keeps six variants for randomness)
    `<path d="M28 46C19 38 11 31 11 22.5C11 17.5 15 14 20 14C23.5 14 26.5 16 28 18.5C29.5 16 32.5 14 36 14C41 14 45 17.5 45 22.5C45 31 37 38 28 46Z"
            fill="#ff2d55" stroke="#ff3b30" stroke-width="1.5" stroke-linejoin="round"/>`,
    // 4. Snowflake (six-fold)
    `<g stroke="#5ac8fa" stroke-width="2" stroke-linecap="round" fill="none">
       <line x1="28" y1="6" x2="28" y2="50"/>
       <line x1="9.6" y1="17" x2="46.4" y2="39"/>
       <line x1="9.6" y1="39" x2="46.4" y2="17"/>
       <path d="M28 14l-3 3M28 14l3 3"/>
       <path d="M28 42l-3-3M28 42l3-3"/>
       <path d="M14 22l1 4M14 22l4-1"/>
       <path d="M42 34l-1-4M42 34l-4 1"/>
       <path d="M14 34l4 1M14 34l-1 4"/>
       <path d="M42 22l-4-1M42 22l1-4"/>
     </g>`,
    // 5. Star (five-point)
    `<path d="M28 6l6.5 13.2L48 21l-10.5 10.2L40 44.5L28 38l-12 6.5l2.5-13.3L8 21l13.5-1.8Z"
            fill="#ff9500" stroke="#ff3b30" stroke-width="1.5" stroke-linejoin="round"/>`,
    // 6. Leaf (with vein)
    `<path d="M10 46c0-20 16-36 36-36c0 20-16 36-36 36Z" fill="#34c759" stroke="#1f8a3b" stroke-width="1.5" stroke-linejoin="round"/>
     <path d="M14 42C22 32 32 22 44 14" stroke="#1f8a3b" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
  ];

  // Build same SVG twice — once for the piece (full color), once for the target (ghost outline)
  function shapeSVG(idx, ghost) {
    const inner = SHAPES[idx];
    if (!ghost) return `<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
    // Ghost: remove fills, keep strokes muted
    const ghostInner = inner
      .replace(/fill="(?!none)([^"]+)"/g, 'fill="none"')
      .replace(/stroke="(?!none)([^"]+)"/g, 'stroke="currentColor" stroke-dasharray="3 3"');
    return `<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">${ghostInner}</svg>`;
  }

  /* ----- Poetry render ----- */
  function renderPoetry() {
    const couplet = document.getElementById("poetry-couplet");
    const author = document.getElementById("poetry-author");
    const picked = pickPoetry();
    if (!couplet || !author || !picked.length) return;

    // Last element is the author; everything before it is a poem line.
    const who = picked[picked.length - 1];
    const lines = picked.slice(0, -1);

    couplet.innerHTML = "";
    lines.forEach((text) => {
      const span = document.createElement("span");
      span.className = "poetry-line";
      span.textContent = text || "";
      couplet.appendChild(span);
    });

    author.textContent = who;
    author.title = who; // hover tooltip for long attributions

    // Scale poem text so long lines / long poems still fit the fixed-size panel.
    requestAnimationFrame(fitPoetryText);
  }

  /* Resize the poem text so a long line / long poem still fits the fixed-height panel. */
  function fitPoetryText() {
    const rail = document.querySelector(".poetry-rail");
    const couplet = document.querySelector(".poetry-couplet");
    if (!rail || !couplet) return;

    // Mobile uses the horizontal layout; clear any inline size set on desktop.
    if (window.innerWidth <= 720) {
      couplet.style.fontSize = "";
      return;
    }

    // Reset to baseline and measure against the rail's inner height.
    couplet.style.fontSize = "";
    const avail = rail.clientHeight - 52; // minus vertical padding (26px × 2)
    const contentH = couplet.scrollHeight;
    if (!contentH || contentH <= avail) return;

    const baseSize = 22;
    const scale = avail / contentH;
    const newSize = Math.max(14, Math.floor(baseSize * scale));
    if (newSize < baseSize) couplet.style.fontSize = newSize + "px";
  }

  function bindPoetryFlip() {
    const btn = document.getElementById("poetry-flip");
    const rail = document.querySelector(".poetry-rail");
    if (!btn || !rail) return;
    // The whole glass card rotates; will-change keeps the blurred backdrop cached
    // on its own layer, so the flip is smooth with no position jitter.
    rail.addEventListener("animationend", () => rail.classList.remove("flipping"));
    btn.addEventListener("click", () => {
      rail.classList.remove("flipping");
      void rail.offsetWidth; // restart animation
      rail.classList.add("flipping");
      setTimeout(renderPoetry, 300);
    });
  }

  /* Refit poem text when the viewport crosses between desktop and mobile. */
  function bindPoetryResize() {
    let lastDesktop = window.innerWidth > 720;
    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const isDesktop = window.innerWidth > 720;
        if (isDesktop !== lastDesktop) {
          lastDesktop = isDesktop;
          fitPoetryText();
        }
      }, 120);
    });
  }

  /* ----- Theme toggle (persists across pages via localStorage) ----- */
  function applyTheme(theme) {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function initTheme() {
    const saved = localStorage.getItem("Ivy-theme");
    if (saved === "dark" || saved === "light") applyTheme(saved);

    const btn = document.querySelector("[data-login-theme]");
    if (btn) {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const isDark = current === "dark";
        const next = isDark ? "light" : "dark";
        applyTheme(next);
        localStorage.setItem("Ivy-theme", next);
      });
    }
  }

  /* ----- Drag verification ----- */
  function initCaptcha() {
    const track = document.getElementById("captcha-track");
    const piece = document.getElementById("captcha-piece");
    const target = document.getElementById("captcha-target");
    const tether = document.getElementById("captcha-tether");
    const status = document.getElementById("captcha-status");
    const pieceSVG = document.getElementById("captcha-piece-svg");
    const targetSVG = document.getElementById("captcha-target-svg");
    if (!track || !piece || !target || !tether || !status) return;

    const PIECE_SIZE = 56;
    const TOLERANCE = 14; // px from piece centre to target centre

    let offsetX = 0;       // current piece translation (px)
    let maxX = 0;          // max translation
    let targetX = 0;       // target center x within track
    let dragging = false;
    let startX = 0;
    let verified = false;
    let shapeIndex = 0;

    function refresh() {
      // Reset state
      verified = false;
      dragging = false;
      offsetX = 0;
      piece.classList.remove("dragging", "success", "shake");
      track.classList.remove("dragging", "shake");
      target.classList.remove("matched");
      status.classList.remove("ok", "err");
      status.textContent = "按住图形，拖到右侧虚线轮廓中";
      piece.style.transform = `translate(0, -50%)`;
      piece.setAttribute("aria-valuenow", "0");
      tether.style.width = "0px";

      // Choose a random shape (avoid same as last)
      let next;
      do { next = Math.floor(Math.random() * SHAPES.length); }
      while (next === shapeIndex && SHAPES.length > 1);
      shapeIndex = next;
      pieceSVG.innerHTML = shapeSVG(shapeIndex, false);
      targetSVG.innerHTML = shapeSVG(shapeIndex, true);

      // Compute target x within track — right region with safe margin
      const trackW = track.clientWidth;
      maxX = Math.max(40, trackW - PIECE_SIZE - 12); // piece can move at most this far
      // Target position: between 60% and 86% of track
      const ratio = 0.6 + Math.random() * 0.26;
      targetX = Math.round(trackW * ratio);
      target.style.setProperty("--target-x", targetX + "px");
    }

    function setStatus(text, cls) {
      status.textContent = text;
      status.classList.remove("ok", "err");
      if (cls) status.classList.add(cls);
    }

    function onDown(e) {
      if (verified) return;
      dragging = true;
      track.classList.add("dragging");
      piece.classList.add("dragging");
      const point = pointFromEvent(e);
      const rect = piece.getBoundingClientRect();
      startX = point.x - rect.left;
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging || verified) return;
      const point = pointFromEvent(e);
      const rect = track.getBoundingClientRect();
      let next = point.x - rect.left - startX;
      // piece.x relative to track
      next = Math.max(0, Math.min(maxX, next));
      offsetX = next;
      piece.style.transform = `translate(${next}px, -50%)`;
      piece.setAttribute("aria-valuenow", String(Math.round(next)));
      tether.style.width = (next + PIECE_SIZE / 2 - 8) + "px"; // tether from piece center to target
    }

    function onUp() {
      if (!dragging || verified) return;
      dragging = false;
      track.classList.remove("dragging");
      piece.classList.remove("dragging");

      // piece center within track
      const pieceCenter = offsetX + PIECE_SIZE / 2;
      const diff = Math.abs(pieceCenter - targetX);
      if (diff <= TOLERANCE) {
        // Snap to target
        const snap = targetX - PIECE_SIZE / 2;
        offsetX = snap;
        piece.style.transform = `translate(${snap}px, -50%)`;
        piece.classList.add("success");
        target.classList.add("matched");
        verified = true;
        tether.style.width = (snap + PIECE_SIZE / 2 - 8) + "px";
        setStatus("验证通过 ✓", "ok");
        enableLogin();
        hapticOk();
      } else {
        // Shake + reset
        track.classList.add("shake");
        piece.classList.add("shake");
        setStatus("还差一点，再试一次", "err");
        setTimeout(() => {
          track.classList.remove("shake");
          piece.classList.remove("shake");
          offsetX = 0;
          piece.style.transform = `translate(0, -50%)`;
          piece.setAttribute("aria-valuenow", "0");
          tether.style.width = "0px";
          setStatus("按住图形，拖到右侧虚线轮廓中");
        }, 520);
        hapticErr();
      }
    }

    // Keyboard support — arrow keys nudge piece
    function onKey(e) {
      if (verified) return;
      let step = e.shiftKey ? 24 : 8;
      if (e.key === "ArrowRight") {
        offsetX = Math.min(maxX, offsetX + step);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        offsetX = Math.max(0, offsetX - step);
        e.preventDefault();
      } else {
        return;
      }
      piece.style.transform = `translate(${offsetX}px, -50%)`;
      piece.setAttribute("aria-valuenow", String(Math.round(offsetX)));
      // Auto-check when close enough (debounced via timeout)
      clearTimeout(piece._kbdTimer);
      piece._kbdTimer = setTimeout(() => {
        const pieceCenter = offsetX + PIECE_SIZE / 2;
        const diff = Math.abs(pieceCenter - targetX);
        if (diff <= TOLERANCE) onUp();
      }, 80);
    }

    function pointFromEvent(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function hapticOk() {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
    }
    function hapticErr() {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([10, 30, 10]);
    }

    // Pointer events (preferred), with touch + mouse fallback
    piece.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    piece.addEventListener("keydown", onKey);

    // Refresh button
    const refreshBtn = document.querySelector("[data-captcha-refresh]");
    if (refreshBtn) refreshBtn.addEventListener("click", () => { refresh(); disableLogin(); });

    // Recompute on resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(refresh, 120);
    });

    // Expose for tests / external use
    refresh();
    window.__ivyCaptcha = {
      refresh,
      isVerified: () => verified
    };
  }

  /* ----- Login submit ----- */
  // Stronger email check: local part + domain + 2+ letter TLD (per email spec,
  // rejects bare TLDs, trailing dots, spaces, and single-char suffixes).
  function isValidEmail(value) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value);
  }

  // Enable the login button only when captcha is verified AND username + email are valid.
  function canLogin() {
    const cap = window.__ivyCaptcha;
    if (!cap || !cap.isVerified()) return false;
    const form = document.getElementById("login-form");
    if (!form) return false;
    const username = (form.querySelector("#username").value || "").trim();
    const email = (form.querySelector("#email").value || "").trim();
    return !!username && isValidEmail(email);
  }
  function syncLoginBtn() {
    const btn = document.getElementById("btn-login");
    if (btn) btn.disabled = !canLogin();
  }
  function enableLogin() { syncLoginBtn(); }
  function disableLogin() {
    const btn = document.getElementById("btn-login");
    if (btn) btn.disabled = true;
  }

  function showToast(msg, kind) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.remove("err", "ok");
    if (kind) t.classList.add(kind);
    t.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // Tiny non-crypto hash for local demo passwords (NOT for production).
  // Real auth must run server-side. This is only an obfuscation layer.
  async function hashPassword(pwd, salt) {
    const enc = new TextEncoder();
    const data = enc.encode(salt + ":" + pwd);
    if (window.crypto && window.crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback: simple djb2-like
    let h = 5381;
    for (let i = 0; i < data.length; i++) h = ((h << 5) + h + data[i]) | 0;
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }

  function initForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    // Restore remembered username + email
    const rememberedUser = localStorage.getItem("ivy-remember-username");
    if (rememberedUser) {
      const u = form.querySelector("#username");
      if (u) u.value = rememberedUser;
    }
    const remembered = localStorage.getItem("ivy-remember-email");
    if (remembered) {
      const u = form.querySelector("#email");
      const r = form.querySelector("#remember");
      if (u) u.value = remembered;
      if (r) r.checked = true;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-login");

      // Honeypot: a bot that filled the hidden field gets a fake spinner and
      // is silently dropped — no login, no clue it was detected.
      const hp = form.querySelector("#hp-field");
      if (hp && hp.value.trim() !== "") {
        btn.classList.add("loading");
        btn.disabled = true;
        await new Promise((r) => setTimeout(r, 1500));
        btn.classList.remove("loading");
        btn.disabled = false;
        return;
      }

      // Client-side rate limit: throttle rapid automated submissions.
      const RL_KEY = "ivy-login-attempts";
      const now = Date.now();
      let attempts = [];
      try { attempts = JSON.parse(localStorage.getItem(RL_KEY) || "[]"); } catch (err) { attempts = []; }
      attempts = attempts.filter((t) => now - t < 60000); // keep last 60s
      if (attempts.length >= 8) {
        showToast("操作过于频繁，请稍后再试", "err");
        return;
      }
      attempts.push(now);
      try { localStorage.setItem(RL_KEY, JSON.stringify(attempts)); } catch (err) {}

      const username = (form.querySelector("#username").value || "").trim();
      const email = (form.querySelector("#email").value || "").trim();
      const remember = form.querySelector("#remember").checked;

      // Require all three: username + valid email + verified captcha.
      if (!username) {
        showToast("请输入用户名", "err");
        return;
      }
      if (!isValidEmail(email)) {
        showToast("邮箱格式不正确，请检查后缀（如 you@example.com）", "err");
        return;
      }
      const cap = window.__ivyCaptcha;
      if (!cap || !cap.isVerified()) {
        showToast("请先完成拖动验证", "err");
        return;
      }

      btn.classList.add("loading");
      btn.disabled = true;

      // Demo auth: any well-formed username/email passes.
      // Hash a synthetic salt; we don't actually compare server-side.
      const salt = "ivy-personal-blog-2026";
      const hash = await hashPassword(email, salt);

      // Simulate a tiny delay so the spinner shows
      await new Promise((r) => setTimeout(r, 480));

      const session = {
        username,
        email,
        hash,
        loggedAt: Date.now(),
        // Demo: bypass real verification
        verified: true
      };
      localStorage.setItem("ivy-session", JSON.stringify(session));
      if (remember) {
        localStorage.setItem("ivy-remember-username", username);
        localStorage.setItem("ivy-remember-email", email);
      } else {
        localStorage.removeItem("ivy-remember-username");
        localStorage.removeItem("ivy-remember-email");
      }

      btn.classList.remove("loading");
      showToast(`欢迎，${username}`, "ok");
      setTimeout(() => {
        // Send back to wherever the visitor came from, default to home
        const back = new URLSearchParams(location.search).get("back") || "index.html";
        location.href = back;
      }, 700);
    });

    // Live gate: keep the button disabled until username + email + captcha are all set.
    const uEl = form.querySelector("#username");
    const eEl = form.querySelector("#email");
    if (uEl) uEl.addEventListener("input", syncLoginBtn);
    if (eEl) eEl.addEventListener("input", syncLoginBtn);
    syncLoginBtn();
  }

  /* ----- If already logged in, skip login page ----- */
  function maybeSkipIfLoggedIn() {
    const sess = localStorage.getItem("ivy-session");
    if (!sess) return;
    try {
      const s = JSON.parse(sess);
      // 30-day TTL
      if (s && s.loggedAt && Date.now() - s.loggedAt < 30 * 24 * 3600 * 1000) {
        const back = new URLSearchParams(location.search).get("back") || "index.html";
        location.replace(back);
      }
    } catch (_) { /* ignore */ }
  }

  /* ----- Boot ----- */
  document.addEventListener("DOMContentLoaded", () => {
    maybeSkipIfLoggedIn();
    initTheme();
    renderPoetry();
    bindPoetryFlip();
    bindPoetryResize();
    initCaptcha();
    initForm();
  });
})();