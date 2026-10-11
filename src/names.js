// Representative everyday fictional names, assembled from familiar local components.
// This is an editorial selection, not a claim of a universal #1 name in each language.
// Native spelling/order is retained. No random generation: each slot is reproducible.
const group = (code, label, family, given, options={}) => ({code,label,family:family.split('|'),given:given.split('|'),...options});
export const NAME_LANGUAGES = Object.freeze([
  group('ja','日本語','佐藤|鈴木|高橋|田中|渡辺|伊藤','太郎|健一|大輔|由美|美咲|直子',{familyFirst:true,separator:''}),
  group('en','英語','Smith|Johnson|Brown|Williams|Jones|Wilson','John|James|Michael|Mary|Sarah|Emily'),
  group('zh','中国語','王|李|张|刘|陈|杨','伟|磊|强|芳|娜|敏',{familyFirst:true,separator:''}),
  group('ko','韓国語','김|이|박|최|정|강','민수|지훈|영수|지영|수진|서연',{familyFirst:true,separator:''}),
  group('es','スペイン語','García|Rodríguez|González|Fernández|López|Martínez','José|Juan|Antonio|María|Ana|Carmen'),
  group('fr','フランス語','Martin|Bernard|Dubois|Thomas|Robert|Petit','Jean|Pierre|Michel|Marie|Nathalie|Isabelle'),
  group('de','ドイツ語','Müller|Schmidt|Schneider|Fischer|Weber|Meyer','Michael|Thomas|Peter|Maria|Sabine|Anna'),
  group('pt','ポルトガル語','Silva|Santos|Oliveira|Souza|Pereira|Costa','José|João|Antônio|Maria|Ana|Francisca'),
  group('it','イタリア語','Rossi|Russo|Ferrari|Esposito|Bianchi|Romano','Giuseppe|Antonio|Marco|Maria|Anna|Francesca'),
  group('ru','ロシア語','Иванов|Петров|Смирнов|Кузнецов|Попов|Соколов','Александр|Сергей|Дмитрий|Елена|Ольга|Татьяна',{femaleFamily:['Иванова','Петрова','Смирнова','Кузнецова','Попова','Соколова']}),
  group('ar','アラビア語','أحمد|علي|حسن|إبراهيم|محمود|مصطفى','محمد|أحمد|علي|فاطمة|عائشة|مريم'),
  group('hi','ヒンディー語','शर्मा|वर्मा|गुप्ता|सिंह|कुमार|पटेल','राजेश|अमित|संजय|सुनीता|पूजा|अनीता'),
  group('bn','ベンガル語','ইসলাম|রহমান|হোসেন|আহমেদ|খান|আলী','মোহাম্মদ|মোস্তফা|হাসান|ফাতেমা|আয়েশা|মরিয়ম'),
  group('ur','ウルドゥー語','احمد|خان|حسین|علی|ملک|محمود','محمد|احمد|علی|فاطمہ|عائشہ|مریم'),
  group('id','インドネシア語','Santoso|Wijaya|Susanto|Saputra|Hidayat|Setiawan','Budi|Agus|Eko|Siti|Dewi|Sri'),
  group('tr','トルコ語','Yılmaz|Kaya|Demir|Şahin|Çelik|Yıldız','Mehmet|Mustafa|Ahmet|Fatma|Ayşe|Emine'),
  group('vi','ベトナム語','Nguyễn|Trần|Lê|Phạm|Hoàng|Phan','Văn An|Văn Minh|Văn Hùng|Thị Lan|Thị Mai|Thị Hoa',{familyFirst:true}),
  group('th','タイ語','แซ่ตั้ง|แซ่ลิ้ม|แซ่ลี|แซ่โง้ว|แซ่เฮ้ง|แซ่โค้ว','สมชาย|สมศักดิ์|สมบัติ|สมหญิง|สุภาพร|พรทิพย์'),
  group('fa','ペルシャ語','رضایی|محمدی|حسینی|احمدی|کریمی|موسوی','علی|محمد|حسین|فاطمه|زهرا|مریم'),
  group('sw','スワヒリ語','Juma|Ali|Hassan|Mohamed|Abdallah|Said','Hamisi|Juma|Hassan|Asha|Fatuma|Zainab'),
  group('fil','フィリピノ語','dela Cruz|Garcia|Reyes|Ramos|Mendoza|Santos','Juan|Jose|Pedro|Maria|Ana|Rosa'),
  group('nl','オランダ語','de Jong|Jansen|de Vries|van den Berg|Bakker|Visser','Jan|Johannes|Pieter|Maria|Anna|Johanna'),
  group('pl','ポーランド語','Nowak|Kowalski|Wiśniewski|Wójcik|Kowalczyk|Kamiński','Jan|Piotr|Andrzej|Anna|Maria|Katarzyna',{femaleFamily:['Nowak','Kowalska','Wiśniewska','Wójcik','Kowalczyk','Kamińska']}),
  group('uk','ウクライナ語','Шевченко|Коваленко|Бондаренко|Ткаченко|Кравченко|Савченко','Олександр|Андрій|Сергій|Олена|Наталія|Тетяна'),
  group('el','ギリシャ語','Παπαδόπουλος|Παππάς|Παπαγεωργίου|Οικονόμου|Νικολάου|Γεωργίου','Γιώργος|Γιάννης|Δημήτρης|Μαρία|Ελένη|Κατερίνα',{femaleFamily:['Παπαδοπούλου','Παππά','Παπαγεωργίου','Οικονόμου','Νικολάου','Γεωργίου']}),
  group('he','ヘブライ語','כהן|לוי|מזרחי|פרץ|ביטון|דוד','דוד|משה|יוסף|שרה|רחל|מרים'),
  group('ro','ルーマニア語','Popescu|Ionescu|Popa|Pop|Radu|Dumitru','Ion|Gheorghe|Andrei|Maria|Elena|Ana'),
  group('sv','スウェーデン語','Andersson|Johansson|Karlsson|Nilsson|Eriksson|Larsson','Lars|Anders|Johan|Anna|Maria|Eva'),
  group('fi','フィンランド語','Korhonen|Virtanen|Mäkinen|Nieminen|Mäkelä|Hämäläinen','Matti|Juhani|Antti|Maria|Anna|Liisa'),
  group('cs','チェコ語','Novák|Svoboda|Novotný|Dvořák|Černý|Procházka','Jan|Jiří|Petr|Marie|Jana|Eva',{femaleFamily:['Nováková','Svobodová','Novotná','Dvořáková','Černá','Procházková']}),
  group('hu','ハンガリー語','Nagy|Kovács|Tóth|Szabó|Horváth|Varga','István|László|József|Mária|Erzsébet|Katalin',{familyFirst:true}),
  group('ms','マレー語','Ahmad|Hassan|Ibrahim|Ismail|Abdullah|Yusof','Muhammad|Ahmad|Ali|Siti|Nur|Aminah',{patronymic:true}),
]);
export function creditName(index) {
  const lang=NAME_LANGUAGES[index % NAME_LANGUAGES.length];
  const variation=Math.floor(index/NAME_LANGUAGES.length);
  // Interleave men/women instead of grouping by gender within departments.
  const givenIndex=[0,3,1,4,2,5][Math.floor(variation/6)%6];
  const familyIndex=variation%6;
  const first=lang.given[givenIndex];
  const last=(givenIndex>=3&&lang.femaleFamily?lang.femaleFamily:lang.family)[familyIndex];
  if(lang.patronymic)return `${first} ${givenIndex>=3?'binti':'bin'} ${last}`;
  return (lang.familyFirst?[last,first]:[first,last]).join(lang.separator ?? ' ');
}
