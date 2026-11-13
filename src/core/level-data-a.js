/* core/level-data-a.js
 * Curated starter vocabulary for levels A1 and A2 (5 stacks x 10 words each).
 *
 * Every row is: [type, germanGrammar, ...18 translations] and the translations are in LEVEL_LANGS order:
 *   en de es fr it pt nl pl sv tr ru uk uz ar hi zh ja ko
 * germanGrammar (used only when German is the language being learned):
 *   noun -> "article|plural" ("—" when there is no plural), verb -> "preterite|participleII",
 *   adj  -> "comparative|superlative" (or "" when not gradable), anything else -> "".
 * Portuguese is Brazilian. Words are dictionary forms. See level-stacks.js for how these are used and
 * src/core/__tests__/level-stacks.test.js for the checks every row must pass.
 */

export const A1 = [
  {
    emoji: "comet",
    names: { en: "Greetings & Basics", ru: "Приветствия и основы", uz: "Salomlashish va asoslar", de: "Begrüßung & Grundlagen" },
    rows: [
      ["other", "", "Hello", "Hallo", "hola", "bonjour", "ciao", "olá", "hallo", "cześć", "hej", "merhaba", "привет", "привіт", "salom", "مرحبا", "नमस्ते", "你好", "こんにちは", "안녕하세요"],
      ["other", "", "Goodbye", "Tschüss", "adiós", "au revoir", "arrivederci", "tchau", "tot ziens", "do widzenia", "hej då", "hoşça kal", "до свидания", "до побачення", "xayr", "مع السلامة", "अलविदा", "再见", "さようなら", "안녕히 가세요"],
      ["other", "", "Please", "Bitte", "por favor", "s'il vous plaît", "per favore", "por favor", "alsjeblieft", "proszę", "snälla", "lütfen", "пожалуйста", "будь ласка", "iltimos", "من فضلك", "कृपया", "请", "お願いします", "부탁합니다"],
      ["other", "", "Thank you", "Danke", "gracias", "merci", "grazie", "obrigado", "dank je", "dziękuję", "tack", "teşekkürler", "спасибо", "дякую", "rahmat", "شكرا", "धन्यवाद", "谢谢", "ありがとう", "감사합니다"],
      ["other", "", "Yes", "Ja", "sí", "oui", "sì", "sim", "ja", "tak", "ja", "evet", "да", "так", "ha", "نعم", "हाँ", "是", "はい", "네"],
      ["other", "", "No", "Nein", "no", "non", "no", "não", "nee", "nie", "nej", "hayır", "нет", "ні", "yo'q", "لا", "नहीं", "不", "いいえ", "아니요"],
      ["other", "", "Sorry", "Entschuldigung", "perdón", "pardon", "scusa", "desculpa", "sorry", "przepraszam", "förlåt", "özür dilerim", "извините", "вибачте", "kechirasiz", "آسف", "माफ़ कीजिए", "对不起", "すみません", "죄송합니다"],
      ["other", "", "How are you?", "Wie geht's?", "¿Cómo estás?", "Comment ça va ?", "Come stai?", "Como vai?", "Hoe gaat het?", "Jak się masz?", "Hur mår du?", "Nasılsın?", "Как дела?", "Як справи?", "Qalaysiz?", "كيف حالك؟", "आप कैसे हैं?", "你好吗？", "お元気ですか？", "어떻게 지내세요?"],
      ["noun", "der|Namen", "name", "Name", "nombre", "nom", "nome", "nome", "naam", "imię", "namn", "isim", "имя", "ім'я", "ism", "اسم", "नाम", "名字", "名前", "이름"],
      ["other", "", "Good night", "Gute Nacht", "buenas noches", "bonne nuit", "buonanotte", "boa noite", "goedenacht", "dobranoc", "god natt", "iyi geceler", "спокойной ночи", "на добраніч", "xayrli tun", "تصبح على خير", "शुभ रात्रि", "晚安", "おやすみなさい", "안녕히 주무세요"],
    ],
  },
  {
    emoji: "family",
    names: { en: "Family & People", ru: "Семья и люди", uz: "Oila va odamlar", de: "Familie & Menschen" },
    rows: [
      ["noun", "die|Mütter", "mother", "Mutter", "madre", "mère", "madre", "mãe", "moeder", "matka", "mamma", "anne", "мама", "мама", "ona", "أم", "माँ", "妈妈", "お母さん", "엄마"],
      ["noun", "der|Väter", "father", "Vater", "padre", "père", "padre", "pai", "vader", "ojciec", "pappa", "baba", "папа", "тато", "ota", "أب", "पिता", "爸爸", "お父さん", "아빠"],
      ["noun", "das|Kinder", "child", "Kind", "niño", "enfant", "bambino", "criança", "kind", "dziecko", "barn", "çocuk", "ребёнок", "дитина", "bola", "طفل", "बच्चा", "孩子", "子供", "아이"],
      ["noun", "der|Freunde", "friend", "Freund", "amigo", "ami", "amico", "amigo", "vriend", "przyjaciel", "vän", "arkadaş", "друг", "друг", "do'st", "صديق", "दोस्त", "朋友", "友達", "친구"],
      ["noun", "der|Männer", "man", "Mann", "hombre", "homme", "uomo", "homem", "man", "mężczyzna", "man", "adam", "мужчина", "чоловік", "erkak", "رجل", "आदमी", "男人", "男の人", "남자"],
      ["noun", "die|Frauen", "woman", "Frau", "mujer", "femme", "donna", "mulher", "vrouw", "kobieta", "kvinna", "kadın", "женщина", "жінка", "ayol", "امرأة", "औरत", "女人", "女の人", "여자"],
      ["noun", "die|Familien", "family", "Familie", "familia", "famille", "famiglia", "família", "familie", "rodzina", "familj", "aile", "семья", "родина", "oila", "عائلة", "परिवार", "家庭", "家族", "가족"],
      ["noun", "der|Lehrer", "teacher", "Lehrer", "profesor", "professeur", "insegnante", "professor", "leraar", "nauczyciel", "lärare", "öğretmen", "учитель", "вчитель", "o'qituvchi", "معلم", "शिक्षक", "老师", "先生", "선생님"],
      ["verb", "wohnte|gewohnt", "to live (reside)", "wohnen", "vivir", "habiter", "abitare", "morar", "wonen", "mieszkać", "bo", "yaşamak", "жить", "жити", "yashamoq", "يسكن", "रहना", "住", "住む", "살다"],
      ["verb", "liebte|geliebt", "to love", "lieben", "amar", "aimer", "amare", "amar", "houden van", "kochać", "älska", "sevmek", "любить", "любити", "sevmoq", "يحب", "प्यार करना", "爱", "愛する", "사랑하다"],
    ],
  },
  {
    emoji: "food",
    names: { en: "Food & Drink", ru: "Еда и напитки", uz: "Ovqat va ichimliklar", de: "Essen & Trinken" },
    rows: [
      ["noun", "das|—", "water", "Wasser", "agua", "eau", "acqua", "água", "water", "woda", "vatten", "su", "вода", "вода", "suv", "ماء", "पानी", "水", "水", "물"],
      ["noun", "das|Brote", "bread", "Brot", "pan", "pain", "pane", "pão", "brood", "chleb", "bröd", "ekmek", "хлеб", "хліб", "non", "خبز", "रोटी", "面包", "パン", "빵"],
      ["noun", "die|—", "milk", "Milch", "leche", "lait", "latte", "leite", "melk", "mleko", "mjölk", "süt", "молоко", "молоко", "sut", "حليب", "दूध", "牛奶", "牛乳", "우유"],
      ["noun", "der|Äpfel", "apple", "Apfel", "manzana", "pomme", "mela", "maçã", "appel", "jabłko", "äpple", "elma", "яблоко", "яблуко", "olma", "تفاحة", "सेब", "苹果", "りんご", "사과"],
      ["noun", "der|—", "coffee", "Kaffee", "café", "café", "caffè", "café", "koffie", "kawa", "kaffe", "kahve", "кофе", "кава", "qahva", "قهوة", "कॉफ़ी", "咖啡", "コーヒー", "커피"],
      ["noun", "das|—", "meat", "Fleisch", "carne", "viande", "carne", "carne", "vlees", "mięso", "kött", "et", "мясо", "м'ясо", "go'sht", "لحم", "मांस", "肉", "肉", "고기"],
      ["verb", "aß|gegessen", "to eat", "essen", "comer", "manger", "mangiare", "comer", "eten", "jeść", "äta", "yemek", "есть", "їсти", "yemoq", "يأكل", "खाना", "吃", "食べる", "먹다"],
      ["verb", "trank|getrunken", "to drink", "trinken", "beber", "boire", "bere", "beber", "drinken", "pić", "dricka", "içmek", "пить", "пити", "ichmoq", "يشرب", "पीना", "喝", "飲む", "마시다"],
      ["adj", "leckerer|am leckersten", "delicious", "lecker", "delicioso", "délicieux", "delizioso", "delicioso", "lekker", "pyszny", "god", "lezzetli", "вкусный", "смачний", "mazali", "لذيذ", "स्वादिष्ट", "好吃", "おいしい", "맛있다"],
      ["adj", "hungriger|am hungrigsten", "hungry", "hungrig", "hambriento", "affamé", "affamato", "faminto", "hongerig", "głodny", "hungrig", "aç", "голодный", "голодний", "och", "جائع", "भूखा", "饿", "お腹がすいた", "배고프다"],
    ],
  },
  {
    emoji: "orbit",
    names: { en: "Numbers & Time", ru: "Числа и время", uz: "Raqamlar va vaqt", de: "Zahlen & Zeit" },
    rows: [
      ["other", "", "one", "eins", "uno", "un", "uno", "um", "één", "jeden", "ett", "bir", "один", "один", "bir", "واحد", "एक", "一", "一", "하나"],
      ["other", "", "two", "zwei", "dos", "deux", "due", "dois", "twee", "dwa", "två", "iki", "два", "два", "ikki", "اثنان", "दो", "二", "二", "둘"],
      ["other", "", "three", "drei", "tres", "trois", "tre", "três", "drie", "trzy", "tre", "üç", "три", "три", "uch", "ثلاثة", "तीन", "三", "三", "셋"],
      ["other", "", "five", "fünf", "cinco", "cinq", "cinque", "cinco", "vijf", "pięć", "fem", "beş", "пять", "п'ять", "besh", "خمسة", "पाँच", "五", "五", "다섯"],
      ["other", "", "ten", "zehn", "diez", "dix", "dieci", "dez", "tien", "dziesięć", "tio", "on", "десять", "десять", "o'n", "عشرة", "दस", "十", "十", "열"],
      ["noun", "der|Tage", "day", "Tag", "día", "jour", "giorno", "dia", "dag", "dzień", "dag", "gün", "день", "день", "kun", "يوم", "दिन", "天", "日", "날"],
      ["noun", "die|Wochen", "week", "Woche", "semana", "semaine", "settimana", "semana", "week", "tydzień", "vecka", "hafta", "неделя", "тиждень", "hafta", "أسبوع", "सप्ताह", "星期", "週", "주"],
      ["noun", "das|Jahre", "year", "Jahr", "año", "an", "anno", "ano", "jaar", "rok", "år", "yıl", "год", "рік", "yil", "سنة", "साल", "年", "年", "해"],
      ["other", "", "today", "heute", "hoy", "aujourd'hui", "oggi", "hoje", "vandaag", "dzisiaj", "idag", "bugün", "сегодня", "сьогодні", "bugun", "اليوم", "आज", "今天", "今日", "오늘"],
      ["other", "", "tomorrow", "morgen", "mañana", "demain", "domani", "amanhã", "morgen", "jutro", "imorgon", "yarın", "завтра", "завтра", "ertaga", "غدا", "कल", "明天", "明日", "내일"],
    ],
  },
  {
    emoji: "home",
    names: { en: "Home & Everyday", ru: "Дом и быт", uz: "Uy va kundalik hayot", de: "Zuhause & Alltag" },
    rows: [
      ["noun", "das|Häuser", "house", "Haus", "casa", "maison", "casa", "casa", "huis", "dom", "hus", "ev", "дом", "будинок", "uy", "بيت", "घर", "房子", "家", "집"],
      ["noun", "das|Zimmer", "room", "Zimmer", "habitación", "chambre", "stanza", "quarto", "kamer", "pokój", "rum", "oda", "комната", "кімната", "xona", "غرفة", "कमरा", "房间", "部屋", "방"],
      ["noun", "die|Türen", "door", "Tür", "puerta", "porte", "porta", "porta", "deur", "drzwi", "dörr", "kapı", "дверь", "двері", "eshik", "باب", "दरवाज़ा", "门", "ドア", "문"],
      ["noun", "der|Tische", "table", "Tisch", "mesa", "table", "tavolo", "mesa", "tafel", "stół", "bord", "masa", "стол", "стіл", "stol", "طاولة", "मेज़", "桌子", "テーブル", "탁자"],
      ["noun", "das|Bücher", "book", "Buch", "libro", "livre", "libro", "livro", "boek", "książka", "bok", "kitap", "книга", "книга", "kitob", "كتاب", "किताब", "书", "本", "책"],
      ["verb", "hatte|gehabt", "to have", "haben", "tener", "avoir", "avere", "ter", "hebben", "mieć", "ha", "sahip olmak", "иметь", "мати", "ega bo'lmoq", "يملك", "रखना", "有", "持つ", "가지다"],
      ["verb", "war|gewesen", "to be", "sein", "ser", "être", "essere", "ser", "zijn", "być", "vara", "olmak", "быть", "бути", "bo'lmoq", "يكون", "होना", "是", "です", "이다"],
      ["verb", "ging|gegangen", "to go", "gehen", "ir", "aller", "andare", "ir", "gaan", "iść", "gå", "gitmek", "идти", "йти", "bormoq", "يذهب", "जाना", "去", "行く", "가다"],
      ["verb", "wollte|gewollt", "to want", "wollen", "querer", "vouloir", "volere", "querer", "willen", "chcieć", "vilja", "istemek", "хотеть", "хотіти", "xohlamoq", "يريد", "चाहना", "想要", "欲しい", "원하다"],
      ["adj", "größer|am größten", "big", "groß", "grande", "grand", "grande", "grande", "groot", "duży", "stor", "büyük", "большой", "великий", "katta", "كبير", "बड़ा", "大", "大きい", "크다"],
    ],
  },
];

export const A2 = [
  {
    emoji: "gem",
    names: { en: "Shopping & Money", ru: "Покупки и деньги", uz: "Xarid va pul", de: "Einkaufen & Geld" },
    rows: [
      ["noun", "das|Geschäfte", "shop", "Geschäft", "tienda", "magasin", "negozio", "loja", "winkel", "sklep", "butik", "mağaza", "магазин", "магазин", "do'kon", "متجر", "दुकान", "商店", "店", "가게"],
      ["noun", "der|Preise", "price", "Preis", "precio", "prix", "prezzo", "preço", "prijs", "cena", "pris", "fiyat", "цена", "ціна", "narx", "سعر", "कीमत", "价格", "値段", "가격"],
      ["noun", "das|—", "money", "Geld", "dinero", "argent", "soldi", "dinheiro", "geld", "pieniądze", "pengar", "para", "деньги", "гроші", "pul", "مال", "पैसा", "钱", "お金", "돈"],
      ["verb", "kaufte|gekauft", "to buy", "kaufen", "comprar", "acheter", "comprare", "comprar", "kopen", "kupować", "köpa", "satın almak", "покупать", "купувати", "sotib olmoq", "يشتري", "खरीदना", "买", "買う", "사다"],
      ["verb", "bezahlte|bezahlt", "to pay", "bezahlen", "pagar", "payer", "pagare", "pagar", "betalen", "płacić", "betala", "ödemek", "платить", "платити", "to'lamoq", "يدفع", "भुगतान करना", "付钱", "払う", "지불하다"],
      ["adj", "billiger|am billigsten", "cheap", "billig", "barato", "bon marché", "economico", "barato", "goedkoop", "tani", "billig", "ucuz", "дешёвый", "дешевий", "arzon", "رخيص", "सस्ता", "便宜", "安い", "싸다"],
      ["adj", "teurer|am teuersten", "expensive", "teuer", "caro", "cher", "caro", "caro", "duur", "drogi", "dyr", "pahalı", "дорогой", "дорогий", "qimmat", "غالي", "महँगा", "贵", "高い", "비싸다"],
      ["noun", "die|Taschen", "bag", "Tasche", "bolsa", "sac", "borsa", "bolsa", "tas", "torba", "väska", "çanta", "сумка", "сумка", "sumka", "حقيبة", "थैला", "包", "かばん", "가방"],
      ["noun", "die|Quittungen", "receipt", "Quittung", "recibo", "reçu", "ricevuta", "recibo", "bon", "paragon", "kvitto", "fiş", "чек", "чек", "chek", "إيصال", "रसीद", "收据", "レシート", "영수증"],
      ["adj", "", "open", "geöffnet", "abierto", "ouvert", "aperto", "aberto", "open", "otwarty", "öppen", "açık", "открытый", "відчинений", "ochiq", "مفتوح", "खुला", "开着", "開いている", "열려 있다"],
    ],
  },
  {
    emoji: "plane",
    names: { en: "Travel & Transport", ru: "Путешествия и транспорт", uz: "Sayohat va transport", de: "Reisen & Verkehr" },
    rows: [
      ["noun", "der|Züge", "train", "Zug", "tren", "train", "treno", "trem", "trein", "pociąg", "tåg", "tren", "поезд", "потяг", "poyezd", "قطار", "ट्रेन", "火车", "電車", "기차"],
      ["noun", "der|Bahnhöfe", "station", "Bahnhof", "estación", "gare", "stazione", "estação", "station", "dworzec", "station", "istasyon", "вокзал", "вокзал", "vokzal", "محطة", "स्टेशन", "车站", "駅", "역"],
      ["noun", "die|Fahrkarten", "ticket", "Fahrkarte", "billete", "billet", "biglietto", "bilhete", "kaartje", "bilet", "biljett", "bilet", "билет", "квиток", "chipta", "تذكرة", "टिकट", "票", "切符", "표"],
      ["noun", "der|Flughäfen", "airport", "Flughafen", "aeropuerto", "aéroport", "aeroporto", "aeroporto", "luchthaven", "lotnisko", "flygplats", "havalimanı", "аэропорт", "аеропорт", "aeroport", "مطار", "हवाई अड्डा", "机场", "空港", "공항"],
      ["noun", "das|—", "luggage", "Gepäck", "equipaje", "bagages", "bagaglio", "bagagem", "bagage", "bagaż", "bagage", "bagaj", "багаж", "багаж", "yuk", "أمتعة", "सामान", "行李", "荷物", "짐"],
      ["verb", "reiste|gereist", "to travel", "reisen", "viajar", "voyager", "viaggiare", "viajar", "reizen", "podróżować", "resa", "seyahat etmek", "путешествовать", "подорожувати", "sayohat qilmoq", "يسافر", "यात्रा करना", "旅行", "旅行する", "여행하다"],
      ["verb", "kam an|angekommen", "to arrive", "ankommen", "llegar", "arriver", "arrivare", "chegar", "aankomen", "przyjeżdżać", "anlända", "varmak", "прибывать", "прибувати", "yetib kelmoq", "يصل", "पहुँचना", "到达", "到着する", "도착하다"],
      ["verb", "fuhr ab|abgefahren", "to depart", "abfahren", "salir", "partir", "partire", "partir", "vertrekken", "odjeżdżać", "avgå", "kalkmak", "отправляться", "відправлятися", "jo'namoq", "يغادر", "रवाना होना", "出发", "出発する", "출발하다"],
      ["noun", "das|Hotels", "hotel", "Hotel", "hotel", "hôtel", "hotel", "hotel", "hotel", "hotel", "hotell", "otel", "отель", "готель", "mehmonxona", "فندق", "होटल", "酒店", "ホテル", "호텔"],
      ["noun", "die|Karten", "map", "Karte", "mapa", "carte", "mappa", "mapa", "kaart", "mapa", "karta", "harita", "карта", "карта", "xarita", "خريطة", "नक्शा", "地图", "地図", "지도"],
    ],
  },
  {
    emoji: "heart",
    names: { en: "Health & Body", ru: "Здоровье и тело", uz: "Salomatlik va tana", de: "Gesundheit & Körper" },
    rows: [
      ["noun", "der|Köpfe", "head", "Kopf", "cabeza", "tête", "testa", "cabeça", "hoofd", "głowa", "huvud", "baş", "голова", "голова", "bosh", "رأس", "सिर", "头", "頭", "머리"],
      ["noun", "die|Hände", "hand", "Hand", "mano", "main", "mano", "mão", "hand", "ręka", "hand", "el", "рука", "рука", "qo'l", "يد", "हाथ", "手", "手", "손"],
      ["noun", "das|Augen", "eye", "Auge", "ojo", "œil", "occhio", "olho", "oog", "oko", "öga", "göz", "глаз", "око", "ko'z", "عين", "आँख", "眼睛", "目", "눈"],
      ["noun", "der|Ärzte", "doctor", "Arzt", "médico", "médecin", "medico", "médico", "arts", "lekarz", "läkare", "doktor", "врач", "лікар", "shifokor", "طبيب", "डॉक्टर", "医生", "医者", "의사"],
      ["noun", "der|Schmerzen", "pain", "Schmerz", "dolor", "douleur", "dolore", "dor", "pijn", "ból", "smärta", "ağrı", "боль", "біль", "og'riq", "ألم", "दर्द", "疼痛", "痛み", "통증"],
      ["noun", "das|Medikamente", "medicine", "Medikament", "medicamento", "médicament", "farmaco", "medicamento", "medicijn", "lek", "medicin", "ilaç", "лекарство", "ліки", "dori", "دواء", "दवा", "药", "薬", "약"],
      ["adj", "kränker|am kränksten", "sick", "krank", "enfermo", "malade", "malato", "doente", "ziek", "chory", "sjuk", "hasta", "больной", "хворий", "kasal", "مريض", "बीमार", "生病", "病気の", "아프다"],
      ["adj", "gesünder|am gesündesten", "healthy", "gesund", "sano", "en bonne santé", "sano", "saudável", "gezond", "zdrowy", "frisk", "sağlıklı", "здоровый", "здоровий", "sog'lom", "صحي", "स्वस्थ", "健康", "健康な", "건강하다"],
      ["verb", "schlief|geschlafen", "to sleep", "schlafen", "dormir", "dormir", "dormire", "dormir", "slapen", "spać", "sova", "uyumak", "спать", "спати", "uxlamoq", "ينام", "सोना", "睡觉", "寝る", "자다"],
      ["adj", "müder|am müdesten", "tired", "müde", "cansado", "fatigué", "stanco", "cansado", "moe", "zmęczony", "trött", "yorgun", "усталый", "втомлений", "charchagan", "متعب", "थका हुआ", "累", "疲れた", "피곤하다"],
    ],
  },
  {
    emoji: "tree",
    names: { en: "Weather & Nature", ru: "Погода и природа", uz: "Ob-havo va tabiat", de: "Wetter & Natur" },
    rows: [
      ["noun", "das|—", "weather", "Wetter", "tiempo", "temps", "tempo", "tempo", "weer", "pogoda", "väder", "hava", "погода", "погода", "ob-havo", "طقس", "मौसम", "天气", "天気", "날씨"],
      ["noun", "der|—", "rain", "Regen", "lluvia", "pluie", "pioggia", "chuva", "regen", "deszcz", "regn", "yağmur", "дождь", "дощ", "yomg'ir", "مطر", "बारिश", "雨", "雨", "비"],
      ["noun", "die|Sonnen", "sun", "Sonne", "sol", "soleil", "sole", "sol", "zon", "słońce", "sol", "güneş", "солнце", "сонце", "quyosh", "شمس", "सूरज", "太阳", "太陽", "해"],
      ["noun", "der|—", "snow", "Schnee", "nieve", "neige", "neve", "neve", "sneeuw", "śnieg", "snö", "kar", "снег", "сніг", "qor", "ثلج", "बर्फ़", "雪", "雪", "눈"],
      ["adj", "kälter|am kältesten", "cold", "kalt", "frío", "froid", "freddo", "frio", "koud", "zimny", "kall", "soğuk", "холодный", "холодний", "sovuq", "بارد", "ठंडा", "冷", "寒い", "춥다"],
      ["adj", "heißer|am heißesten", "hot", "heiß", "caliente", "chaud", "caldo", "quente", "heet", "gorący", "het", "sıcak", "горячий", "гарячий", "issiq", "حار", "गरम", "热", "暑い", "덥다"],
      ["noun", "der|Bäume", "tree", "Baum", "árbol", "arbre", "albero", "árvore", "boom", "drzewo", "träd", "ağaç", "дерево", "дерево", "daraxt", "شجرة", "पेड़", "树", "木", "나무"],
      ["noun", "das|Meere", "sea", "Meer", "mar", "mer", "mare", "mar", "zee", "morze", "hav", "deniz", "море", "море", "dengiz", "بحر", "समुद्र", "海", "海", "바다"],
      ["noun", "der|Berge", "mountain", "Berg", "montaña", "montagne", "montagna", "montanha", "berg", "góra", "berg", "dağ", "гора", "гора", "tog'", "جبل", "पहाड़", "山", "山", "산"],
      ["noun", "die|Blumen", "flower", "Blume", "flor", "fleur", "fiore", "flor", "bloem", "kwiat", "blomma", "çiçek", "цветок", "квітка", "gul", "زهرة", "फूल", "花", "花", "꽃"],
    ],
  },
  {
    emoji: "star",
    names: { en: "Hobbies & Free Time", ru: "Хобби и досуг", uz: "Hobbi va bo'sh vaqt", de: "Hobbys & Freizeit" },
    rows: [
      ["noun", "die|—", "music", "Musik", "música", "musique", "musica", "música", "muziek", "muzyka", "musik", "müzik", "музыка", "музика", "musiqa", "موسيقى", "संगीत", "音乐", "音楽", "음악"],
      ["noun", "der|Filme", "film", "Film", "película", "film", "film", "filme", "film", "film", "film", "film", "фильм", "фільм", "film", "فيلم", "फ़िल्म", "电影", "映画", "영화"],
      ["noun", "der|—", "sport", "Sport", "deporte", "sport", "sport", "esporte", "sport", "sport", "sport", "spor", "спорт", "спорт", "sport", "رياضة", "खेल", "运动", "スポーツ", "스포츠"],
      ["noun", "das|Spiele", "game", "Spiel", "juego", "jeu", "gioco", "jogo", "spel", "gra", "spel", "oyun", "игра", "гра", "o'yin", "لعبة", "खेल", "游戏", "ゲーム", "게임"],
      ["verb", "spielte|gespielt", "to play", "spielen", "jugar", "jouer", "giocare", "jogar", "spelen", "grać", "spela", "oynamak", "играть", "грати", "o'ynamoq", "يلعب", "खेलना", "玩", "遊ぶ", "놀다"],
      ["verb", "las|gelesen", "to read", "lesen", "leer", "lire", "leggere", "ler", "lezen", "czytać", "läsa", "okumak", "читать", "читати", "o'qimoq", "يقرأ", "पढ़ना", "读", "読む", "읽다"],
      ["verb", "schwamm|geschwommen", "to swim", "schwimmen", "nadar", "nager", "nuotare", "nadar", "zwemmen", "pływać", "simma", "yüzmek", "плавать", "плавати", "suzmoq", "يسبح", "तैरना", "游泳", "泳ぐ", "수영하다"],
      ["verb", "tanzte|getanzt", "to dance", "tanzen", "bailar", "danser", "ballare", "dançar", "dansen", "tańczyć", "dansa", "dans etmek", "танцевать", "танцювати", "raqsga tushmoq", "يرقص", "नाचना", "跳舞", "踊る", "춤추다"],
      ["verb", "traf|getroffen", "to meet", "treffen", "encontrarse", "rencontrer", "incontrare", "encontrar", "ontmoeten", "spotykać", "träffa", "buluşmak", "встречать", "зустрічати", "uchrashmoq", "يقابل", "मिलना", "见面", "会う", "만나다"],
      ["noun", "die|Partys", "party", "Party", "fiesta", "fête", "festa", "festa", "feest", "impreza", "fest", "parti", "вечеринка", "вечірка", "ziyofat", "حفلة", "पार्टी", "派对", "パーティー", "파티"],
    ],
  },
];
