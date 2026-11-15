# Astronot Sağlık İzleme Uygulaması: Tasarım

Tarih: 2026-11-14 · Durum: uygulandı · Son değişiklik: 2026-11-15 (bölüm 15, ikinci tur)

Bu belgede "**Karar (ekip)**" ekibin konuşmada verdiği kararı, "**Karar (Claude)**" ekibin yapım yolunu bana bıraktığı ya da emin olmadığı yerde benim verdiğim kararı gösterir. İkinci türdekiler itiraza açıktır.

## 1. Amaç ve neden

Bursa NASA Space Apps Challenge 2026 için, 48 saatlik hackathon'da "Create Health Monitoring Software for Astronauts on Space Missions" görevine bir çözüm.

Uzun görevlerde astronot, sağlığındaki değişimi büyük ölçüde kendisi fark etmek zorunda. Uygulama üç işi yapar:

1. **Toplar:** astronot sağlık göstergelerini kısa bir günlük kayıtla girer.
2. **Değerlendirir:** hangi vücut bölgesinin ilgi istediğini bir bakışta gösterir.
3. **Yönlendirir:** o bölge için ne yapılacağını ve ne zaman yer ekibine haber verileceğini söyler.

Ekibin öne çıkardığı iki şey: uygulama güzel görünmeli ve içindeki her sağlık bilgisi NASA/CSA kaynağına dayanmalı.

## 2. Hedefler, hedef olmayanlar, karşı-hedefler

**Hedefler**

- Vücut haritası ana ekran: 11 vücut bölgesi ve tüm vücudu saran radyasyon katmanı.
- Sorun, olduğu yerde gösterilir: ilgili organ ya da kemik figürün üzerinde renk alır.
- Günlük ve haftalık kayıt; görev günü sayacı; kayıt serisi.
- Belirtiler gün gün saklanır; haftalık ve aylık değerlendirme uzun süren sorunu yakalar.
- Her bölge için: bulgular, uzayda ne olduğu, işaretlenebilir öneriler.
- Açıklamada sayılan altı gösterge (tansiyon, nabız, kan şekeri, vücut sıcaklığı, uyku saati, ruh hali) uygulamada girilebilir.
- İnternet ve sunucu olmadan çalışır.

**Hedef olmayanlar**

- Kamera ile ölçüm, cihaz ya da sensör bağlantısı.
- Sunucu, hesap, birden çok mürettebat, gerçek veri gönderimi. (İkinci turda "üsse bildirim" eklendi; simülasyondur, bkz. bölüm 15.)
- Rozet, seviye, puan tablosu. Oyunlaştırma yalnızca kayıt serisidir.
- Türkçe arayüz. Arayüz İngilizce.
- Telefon öncelikli yerleşim. Hedef dizüstü ve projeksiyon (1280 piksel ve üstü genişlik); daha dar ekranda bozulmaması yeterli.
- Teşhis koymak. Uygulama ilgi isteyen yeri gösterir ve kaynaktaki öneriyi aktarır. (İkinci turda kaynaklarda tarif edilen durumlar "Possible" diye adlandırılıyor; teşhis değildir, bkz. bölüm 15.)

**Karşı-hedefler** (çalışsa bile başarısızlık sayılır)

- Kaynağı gösterilemeyen bir sağlık iddiası ya da sayı.
- Ekibin kendi belirlediği bir eşiğin NASA değeri gibi sunulması.
- Simülasyon verisinin gerçek veri gibi görünmesi.
- Sunum sırasında internet yokken yazı tipinin ya da figürün bozulması.
- Herhangi bir projeye ait olabilecek genel bir "pano" görünümü.

## 3. Kısıtlar

- **Süre:** 48 saat; kalan süre belirsiz. Bölüm 11'deki öncelik sırası buna göre.
- **Kaynak kuralı (Karar, ekip):** sağlık içeriği yalnızca challenge'ın Resources sekmesindeki beş sayfadan ve onların doğrudan bağlandığı NASA/CSA sayfalarından gelir. 51 sayfanın metni `docs/sources/` klasöründe.
- **Kaynak kuralına istisna (Karar, ekip):** yalnızca figür çizimi için Wikimedia Commons'taki kamu malı çizimler kullanılır ve kaynak olarak belirtilir. Sağlık bilgisi için geçerli değildir.
- **Eşik yok:** kaynak sayfalarının hiçbirinde hayati bulgular için normal aralık ya da uyarı eşiği yok. Bölüm 7'deki bütün sınırlar ekibin ayarıdır.
- **Arayüz dili (Karar, ekip):** İngilizce.

## 4. Yaklaşımlar

| | Yol | Artısı | Eksisi |
|---|---|---|---|
| A | Sunucusuz tek sayfa uygulama: React, TypeScript, Vite; veri tarayıcıda; statik yayın | Bileşenler 12 bölgeyi ve ekranları yönetilebilir tutar; internet olmadan çalışır; yayınlaması kolay | Veri tek cihazda kalır |
| B | Düz HTML/CSS/JS, derleme adımı yok | Araç gerektirmez, taslaklar zaten böyle | Bu kadar ekran ve durum bileşensiz dağılır; paralel çalışmak zor |
| C | Sunuculu tam uygulama | Hesap, çoklu mürettebat, yer doktoru ekranı | 48 saat için fazla iş; sunucuya bağımlılık "Dünya'dan bağımsız" fikriyle çelişir |

**Seçilen: A. Karar (Claude).** Ekip web teknolojilerini istedi ve yapım yolunu bana bıraktı.

## 5. Ekranlar ve davranış

### 5.1 Vücut haritası (ana ekran)

İki sütun: solda figür (film gibi duran koyu bir panel), sağda seçili bölgenin paneli. Onaylanan taslak: `docs/mockups/lightbox-v4.html`.

- **Figür:** tarama görünümünde iskelet ve onu saran yumuşak vücut hattı. Köşelerde R ve L işaretleri, sol altta mürettebat, görev günü ve temel değer bilgisi, sağ altta sistem sayısı ve işaretli bölge sayısı.
- **Sorun yerinde yanar (Karar, ekip):** bir bölge "caution" ise ilgili organ ya da kemikler sarı, "warning" ise kırmızı olur ve yanında bölge adıyla durumu yazar. Normal bölgeler renk almaz.
- **Organlar (Karar, ekip):** sorun yokken görünmez. "Show organs" kutusu işaretlenince hepsi soluk olarak belirir. İşaretli bölgenin organı kutu kapalıyken de görünür.
- **Radyasyon:** figürü saran, gövdeye ortalanmış noktalı halka.
- **Yıldızlar (Karar, ekip):** arka planda sabit, seyrek noktalar; çoğu beyaz-mavi, birkaçı sarımsı, turuncu ya da mavi. Yazının arkasında daha kısık.
- **Etkileşim:** figürdeki organa ya da kemiğe ve sağ alttaki sistem listesindeki ada tıklamak o bölgeyi seçer. Klavyeyle de seçilebilir.
- **Seçili bölge yokken** sağ panel günün özetini gösterir: kaç bölge işaretli, bugünkü kayıt ve plan.

### 5.2 Bölge paneli

Radyoloji raporu düzeninde üç bölüm:

- **Findings:** o bölgenin göstergeleri, son değer ve temel değere göre fark; her gösterge için görev boyunca grafik.
- **Impression:** uzayda bu bölgeye ne olduğu (kaynak metni ve bağlantısı) ve hangi tehlikeden kaynaklandığı (beş tehlikeden biri ya da birkaçı).
- **Recommendation:** işaretlenebilir öneri listesi. Astronot bugün yapacaklarını işaretler ve "Add N to today's plan" ile günün planına ekler. **Karar (Claude):** işaretlenen önerinin günün planına girmesi benim yorumum; ekip yalnızca "onay kutusu gibi olsun" dedi.

Ek kurallar:

- **Organın işlevi (Karar, Claude):** yalnızca kaynakta geçiyorsa tek cümle olarak gösterilir; geçmiyorsa satır hiç görünmez.
- Her açıklama ve her öneri kaynak bağlantısı taşır.
- Öneriler arasında, bölge işaretliyse "Add to the next ground report" maddesi bulunur.

### 5.3 Günlük ve haftalık kayıt

Kısa bir adım adım form. Her göstergenin yanında "bu nedir, neden izleniyor" diye tek cümle (kaynaktan) ve nasıl girileceğine dair düz bir yönerge bulunur.

**Günlük**

1. Hayati bulgular: nabız, tansiyon (büyük ve küçük), vücut sıcaklığı, kan şekeri.
2. Uyku ve ruh hali: uyku saati, ruh hali (1–5), isteğe bağlı günlük notu.
3. Belirtiler: bölgelere göre gruplanmış işaret listesi (bölüm 6).
4. Beslenme ve egzersiz: su (litre), iştah (1–5), egzersiz süresi.
5. Radyasyon: dozimetre okuması.

**Haftalık**

- Tepki ve dikkat testi, görme testi (aşağıda).
- Boy ölçümü, kuvvet öz değerlendirmesi (1–5).

Uygulama sırası gelen kaydı ana ekranda hatırlatır.

**İki mini test (Karar, ekip; tasarım Claude)**

- **Tepki ve dikkat:** ekranda işaret belirince tuşa basılır; birkaç deneme, ortanca süre milisaniye olarak kaydedilir, erken basışlar sayılır. Yaklaşık 40 saniye.
- **Görme:** dört yönden birine dönük "E" harfi giderek küçülür; yön ok tuşlarıyla yanıtlanır. Sonuç, doğru okunan en küçük boydur.

İkisi de klinik test değildir; yalnızca astronotun kendi temel değeriyle, aynı ekranda karşılaştırma yapar. Bu, ekranda yazar.

### 5.4 Bugünün planı ve seri

- İşaretlenen öneriler günün planında onay kutulu maddeler olarak durur.
- **Seri:** günlük kaydın tamamlandığı ardışık gün sayısı. Başka oyunlaştırma yok.

### 5.5 Yer raporu

İşaretli bölgeleri, son değerleri ve temel değerden farkı özetleyen kısa bir metin üretir; kopyalanabilir ve indirilebilir. Gerçek gönderim yoktur. Mars görevinde raporun başında kaynaktaki gecikme bilgisi yer alır: tek yön 20 dakikaya kadar.

### 5.6 Görev ve temel değerler

- **Üç hazır görev (Karar, ekip):** Station, Moon, Mars. Seçim gün sayacını, iletişim gecikmesi satırını ve öne çıkan tehlikeleri değiştirir.

| Görev | Süre | İletişim satırı | Dayanak |
|---|---|---|---|
| Station | 180 gün | "Real-time support from the ground" | Kaynak: 4–6 aylık görevler, anlık destek |
| Moon | 30 gün | Satır gösterilmez | Süre ekibin ayarı; gecikme sayısı kaynaklarda yok |
| Mars | 1095 gün | "Up to 20 minutes one way" | Kaynak: yaklaşık üç yıl, tek yön 20 dakikaya kadar |

- **Temel değerler:** her göstergenin uçuş öncesi değeri. Demo profilinde hazır gelir; yeni profilde bir kez girilir.

### 5.7 Kaynaklar ve hakkında

Kullanılan bütün NASA/CSA sayfalarının listesi, figür çizimlerinin sahipleri ve lisansı, eşiklerin ekibin ayarı olduğu notu ve simülasyon açıklaması.

### 5.8 Belirti günlüğü ve dönemsel değerlendirme

**Karar (ekip):** her günün rahatsızlıkları gün gün kaydedilir; haftalık ve aylık toplam kontroller uzun süreli bir sorun olup olmadığına bakar. Ayrıntılar benim (Karar, Claude).

**Belirti günlüğü**

- Günlük kayıtta işaretlenen her belirti o günün tarihiyle saklanır; eski günler silinmez ve değiştirilmez.
- Listede olmayan bir rahatsızlık için serbest metin satırı vardır. Bu satır bir bölgeye bağlanmaz ve durumu değiştirmez; günlükte ve yer raporunda görünür.
- **Günlük görünümü:** satırlar belirtiler (bölgeye göre gruplu), sütunlar günler; belirtinin bildirildiği gün dolu görünür. Son 30 gün gösterilir, geriye gidilebilir.
- Bölge panelinin Findings bölümünde o bölgenin son 30 günlük belirti şeridi yer alır.

**Haftalık ve aylık değerlendirme**

- Her 7 ve her 30 görev gününde bir değerlendirme hazırlanır ve ana ekrandaki günün özetinde "Weekly review ready" ya da "Monthly review ready" diye duyurulur.
- Her bölge için gösterir: her belirtinin kaç gün bildirildiği, kaç günün caution ya da warning geçtiği, göstergelerin bu dönemki ortalaması ile önceki dönem ve temel değer.
- Uzun süreli kontrollerin kuralları bölüm 7'de. Bu kontrollerden biri tetiklenirse bölge işaretlenir, Findings'te nedeni yazar (örneğin "Reported on 4 of the last 7 days") ve öneri listesindeki "Add to the next ground report" maddesi işaretli gelir.

## 6. Bölgeler

| Bölge | Göstergeler | Figürde yanan | Tehlike | Ana kaynak sayfaları |
|---|---|---|---|---|
| Brain, mind & sleep | ruh hali, uyku saati, günlük notu, tepki testi | beyin | Isolation & confinement; Space radiation | risk-behavioral, risk-sleep, hazard-isolation |
| Eyes | görme belirtileri, görme testi | göz çukurları | Gravity fields | risk-sans, hazard-gravity |
| Inner ear & balance | bulantı, baş dönmesi, yön kaybı | şakak kemiği hizası | Gravity fields | risk-sensorimotor |
| Heart & vessels | nabız, tansiyon, bayılma hissi | kalp | Gravity fields | risk-cardiovascular, csa-body-infographic |
| Lungs & oxygen | baş ağrısı, kafa karışıklığı, uyku sorunu; uzay yürüyüşü sonrası belirti | akciğerler | Hostile/closed environments | risk-hypoxia, risk-decompression |
| Blood & immunity | vücut sıcaklığı; uçuk, döküntü, alerji, enfeksiyon | lenf düğümleri, dalak | Hostile/closed environments; Space radiation | risk-immune, hazard-environment |
| Bones | egzersiz süresi, beklenen kayıp | omurga, leğen, uyluk kemikleri | Gravity fields | risk-bone, hazard-gravity |
| Spine | boy | omurlar | Gravity fields | risk-bone, past-spinal-health |
| Muscles | egzersiz süresi, kuvvet öz değerlendirmesi | uyluk ve bacak kasları | Gravity fields | risk-fitness |
| Digestion & nutrition | iştah, kan şekeri | mide, bağırsak, karaciğer | Distance from Earth; Hostile/closed environments | risk-nutrition, hazard-distance |
| Kidneys | su tüketimi | böbrekler | Gravity fields | hazard-gravity |
| Radiation (whole body) | dozimetre okuması | halka | Space radiation | hazard-radiation, risk-radiation-cancer, csa-radiation |

Sayfa adları `docs/sources/` içindeki dosya adlarıdır.

- **Karar (Claude):** hangi göstergenin hangi bölgeye bağlandığı yer yer benim eşleştirmem (kan şekeri → Digestion, vücut sıcaklığı → Blood & immunity, su → Kidneys).
- **Karar (Claude):** her gösterge tek bir bölgenin durumunu belirler. Egzersiz süresi Bones'un durumunu belirler; Muscles'ta bilgi olarak görünür ama Muscles'ın durumu yalnızca kuvvet öz değerlendirmesinden gelir. Aksi halde tek bir eksik, iki bölgeyi birden işaretlerdi.
- Bones ve Spine ikisi de omurgayı yakar; ikisi birden işaretliyse omurga daha ağır olan durumun rengini alır.
- Göz ve iç kulak için çizim setinde organ yok; bunlar basit ışıklı işaretlerle gösterilir.

## 7. Durum mantığı

Üç durum: **Nominal** (renk yok), **Caution** (sarı, üçgen), **Warning** (kırmızı, kare). Durum hiçbir yerde yalnızca renkle anlatılmaz; şekil ve kelime de vardır.

Bir bölgenin durumu, göstergelerinin en ağır olanıdır. Karşılaştırma her zaman astronotun kendi temel değeriyle yapılır.

**Aşağıdaki bütün sınırlar ekibin ayarıdır, NASA değeri değildir (Karar, Claude).** Tek bir ayar dosyasında durur ve Hakkında ekranında böyle yazar.

| Gösterge | Karşılaştırılan | Caution | Warning |
|---|---|---|---|
| Nabız | son 3 günün ortalaması | temel değerden ±%15 | ±%25 |
| Tansiyon (büyük, küçük) | son 3 günün ortalaması | ±%10 | ±%20 |
| Kan şekeri | son 3 günün ortalaması | ±%15 | ±%30 |
| Vücut sıcaklığı | son ölçüm | +0,5 °C | +1,0 °C |
| Uyku saati | son 3 gecenin ortalaması | temel değerden 1 saat az | 2 saat az |
| Ruh hali (1–5) | son 3 günün ortalaması | 2,5 ve altı | 1,5 ve altı |
| Egzersiz | son 7 günün toplamı | hedefin %80'inin altı | %50'sinin altı |
| Su | son 3 günün ortalaması | temel değerin %80'inin altı | %60'ının altı |
| İştah (1–5) | son 3 günün ortalaması | 2,5 ve altı | 1,5 ve altı |
| Kuvvet öz değerlendirmesi | son kayıt | temel değerden 1 puan düşük | 2 puan düşük |
| Boy | son ölçüm | temel değerden %3'ten fazla artış | yok |
| Tepki süresi | son test | temel değerden %15 yavaş | %30 yavaş |
| Görme testi | son test | bir boy kötü | iki boy kötü |
| Belirti listesi | bugünkü işaretler | bir belirti | iki ya da daha çok, ya da "acil" işaretli tek belirti |
| Radyasyon | toplam | durum rengi yok | durum rengi yok |

**Uzun süreli kontroller** (bölüm 5.8). Bunlar da ekibin ayarıdır. Bir bölgenin durumu, günlük ve uzun süreli sonuçların en ağır olanıdır.

| Kontrol | Koşul | Sonuç | Etiket |
|---|---|---|---|
| Yinelenen belirti | aynı belirti son 7 günün 3'ünde ya da daha fazlasında | Caution | recurring |
| Süregelen belirti | aynı belirti son 30 günün 10'unda ya da daha fazlasında | Warning | persistent |
| Süregelen sapma | bir gösterge son 30 günün 15'inde ya da daha fazlasında caution ya da daha kötü | Warning | sustained |
| Yavaş kayma | haftalık ortalama üç hafta üst üste temel değerden uzaklaşıyor | Caution | trending |

- "Yavaş kayma" günlük sınırın içinde kalınsa bile tetiklenir; amacı tek tek günlerde görünmeyen gidişi yakalamaktır.
- **Yavaş kaymanın ayrıntısı (Karar, Claude):** son dört haftanın ortalamalarına bakılır; her hafta bir öncekinden daha uzakta olmalı ve dört haftadaki toplam kayma o göstergenin caution sınırının en az yarısı kadar olmalıdır. İkinci koşul rastgele dalgalanmanın uyarı üretmesini önler. Bir haftanın ortalaması için o haftada en az dört kayıt gerekir.
- **Egzersiz hedefi** kaynaktan: günde 1,5 saat, haftada 7 gün için 10,5 saat.
- **Beklenen kemik kaybı** kaynaktaki orandan hesaplanır: görev günü / 30 × (%1 ile %1,5). Bir aralık olarak gösterilir; ölçüm değildir ve ekranda "expected" diye geçer.
- **Radyasyon** için kaynaklarda sınır olmadığından yalnızca kayıt ve toplam gösterilir.
- **Eksik veri bölgeyi işaretlemez (Karar, Claude).** Kaydı girilmemiş gösterge "due" diye görünür ve hatırlatmaya girer; durumu değiştirmez.
- "Acil" belirti örneği: uzay yürüyüşünden sonra ağrı (kaynak: dekompresyon belirtisinde yürüyüş hızla sonlandırılır).

## 8. İçerik ve kaynak kuralı

- İçerik koddan ayrı, veri dosyalarında durur: bölgeler, göstergeler, belirtiler, açıklamalar, öneriler, kaynaklar.
- Her sağlık metni bir kaynak kimliği taşır; kaynak listesi başlık ve adresi tutar.
- **Zorunlu denetim:** kaynak kimliği olmayan ya da listede bulunmayan bir içerik maddesi testte hata verir. Arayüz etiketleri (düğme adları gibi) bunun dışındadır.
- Metinler kaynak sayfadaki ifadeye yakın tutulur; kaynakta olmayan bir sayı ya da iddia eklenmez.
- İçerik, `docs/sources/` içindeki metinlerden yazılır.

## 9. Görsel dil

Onaylanan yön: "Işıklı Kutu". Değerlerin tamamı `docs/mockups/lightbox-v4.tpl.html` içinde.

- **Renk:** koyu, mavimsi film zemini; kemik beyazı yazı; durum renkleri sarı ve kırmızı-turuncu. Renkler OKLCH ile tanımlı.
- **Yazı tipi:** başlık ve metin için Instrument Sans, sayılar ve film köşe yazıları için Martian Mono. İkisi de projeye gömülür, internetten yüklenmez.
- **Figür:**
  - Kemikler: Wikimedia Commons'taki kamu malı iskelet çizimi (Mariana Ruiz Villarreal; etiketsiz sürüm Mikael Häggström). Sağ kol, sol kolun aynasıdır.
  - Organlar: Mikael Häggström'ün kamu malı organ çizimleri.
  - Vücut hattı: ayrı çizim değil; iskelet ve kas hacimleri bir filtreyle büyütülüp yumuşatılır.
  - Ton: kemikler ve organlar film tonuna, işaretli olanlar sarı ya da kırmızıya çevrilir.
  - Özgün dosyalar `assets-source/` içinde; işleme tarifi `docs/mockups/build_v4.py`.
- **Hareket:** az ve amaçlı. Üzerine gelince hafif belirginleşme, uyarıdaki organda yavaş bir parlama, onay kutusunda kısa işaret. Hareket azaltma tercihi açıksa hepsi kapanır.
- **Erişilebilirlik:** metin karşıtlığı en az 4,5:1; görünür klavye odağı; durum için renk, şekil ve kelime birlikte.

## 10. Demo verisi

- "Simulated" etiketli hazır bir mürettebat profili; etiket her ekranda görünür.
- Sabit bir tohumla üretilir, her açılışta aynıdır: 47 günlük geçmiş, 180 günlük Station görevi.
- Kurgu: egzersiz geride (Bones: caution), su az (Kidneys: warning), son 7 günün 3'ünde uyku sorunu (Brain, mind & sleep: caution, recurring), diğer bölgeler normal. Görevin ilk günlerinde geçmiş bir uzay tutması kümesi günlükte görünür ama artık işaretli değildir.
- **Görev günü gerçek saate bağlı değildir (Karar, Claude).** Demo 47. günde başlar; "Advance one day" düğmesi günü ilerletir. Böylece sunum hangi gün yapılırsa yapılsın aynı görünür ve jüri zamanın geçişini görebilir.
- **Girilen kayıt demo geçmişine eklenir (Karar, Claude)** ve durumlar yeniden hesaplanır. Veri tarayıcıda saklanır; "Reset demo" başlangıç haline döndürür.

## 11. Öncelik sırası

Süre yetmezse aşağıdan yukarı kesilir.

- **P0:** vücut haritası ve figür; 12 bölgenin içeriği; bölge paneli; günlük ve uzun süreli durum mantığı; günlük kayıt ve gün gün belirti saklama; bölge panelindeki belirti şeridi; demo verisi; grafikler; kaynaklar ekranı.
- **P1:** haftalık ve aylık değerlendirme ekranı; belirti günlüğü görünümü; iki mini test; bugünün planı ve seri; yer raporu; görev seçimi; haftalık kayıt ve hatırlatma.
- **P2:** kas ve lenf çizimlerinin yerleştirilmesi; yeni profil ve temel değer girişi; hareket cilası.

## 12. Yapana bırakılanlar

- Dosya ve bileşen yapısı, durum yönetimi, test düzeni.
- Grafiklerin elle mi bir kitaplıkla mı çizileceği.
- Çizimlerin derleme sırasında nasıl işleneceği (taslaktaki tarif başlangıç noktasıdır).
- Figürün performansı için gereken sadeleştirme.
- Uygulamanın adı. Şimdilik "Crew Health".

## 13. Ekibe kalanlar

- Yayın için hesap (ör. GitHub Pages) ve deponun herkese açık olup olmayacağı.
- Space Apps teslim koşullarının kontrolü (depo, tanıtım, yapay zekâ kullanımı beyanı). Bu koşullar bu belgenin kaynakları arasında değil.

## 14. Başvuru dosyaları

- Onaylanan taslak: `docs/mockups/lightbox-v4.html`
- Taslak şablonu ve çizim işleme betiği: `docs/mockups/lightbox-v4.tpl.html`, `docs/mockups/build_v4.py`
- Kaynak sayfa metinleri: `docs/sources/` (51 dosya, her birinin başında adresi)
- Özgün çizimler: `assets-source/`

## 15. İkinci tur: zorunlu kayıt, belirti kontrolü, olası durumlar, yer bağlantısı

Ekibin 2026-11-15 isteği: uygulama "doktor gibi" çalışsın. Aşağıdaki dört karar ekibe soruldu ve ekip seçti; ayrıntılar benim.

### 15.1 Kararlar

- **Üsse bildirim simülasyondur (Karar, ekip).** Sunucu yok. Uygulamanın "gönderdiği" her mesaj Ground link ekranındaki kutuya yazılır ve "Simulated link" diye etiketlenir; cihazdan hiçbir şey çıkmaz. Mars görevinde kaynaktaki gecikme satırı gösterilir.
- **Yalnızca kaynaklardaki durumlar adlandırılır (Karar, ekip).** Belirti ve ölçümler, 51 sayfada tarif edilen durumlarla eşleştirilir ve "Possible: …" diye, kaynağı ve "teşhis değildir" notuyla söylenir. Kaynak kuralı aynen geçerlidir: her durumun `about` metni kaynak kimliği ve birebir alıntı taşır, test denetler. 17 durum `src/content/conditions.ts` içindedir.
- **Günlük kayıt zorunludur ve uygulamayı kilitler (Karar, ekip).** Yeni gün başlayınca beş adım bitene kadar diğer ekranlar kapalıdır; yalnızca belirti kontrolü ve görev ekranı açık kalır. Bütün ölçümler zorunludur. Demo, bugünün kaydı tamamlanmış olarak vücut haritasında açılır; kilit "Advance one day" sonrası görünür.
- **"Absürt değer" ayrı bir kritik sınırdır (Karar, ekip).** Tek bir okuma, temel değerden uyarı sınırının iki katı kadar uzaktaysa kritiktir (nabız ±%50, tansiyon ±%40, kan şekeri ±%60, ateş +2 °C, uyku 4 saat az, su temel değerin %20'si ve altı). Uygulama "yeniden ölç ya da onayla" der; onaylanan okuma hemen üsse bildirilir. Katsayı `src/content/thresholds.ts` içinde tek sayıdır (`CRITICAL_FACTOR`) ve bütün eşikler gibi ekibin ayarıdır.

### 15.2 Ne zaman üsse mesaj gider (Karar, Claude)

| Olay | Mesaj |
|---|---|
| Kritik okuma onaylandı | Hemen, o adım kaydedilirken |
| Günlük kayıt tamamlandı ve bir sistem warning | Kayıt tamamlanınca, warning olan sistemler tek mesajda |
| Belirti kontrolü ya da haftalık kayıt bir sistemi warning yaptı | Hemen |
| 7. ya da 30. günün kaydı tamamlandı ve değerlendirme yinelenen bir şey buldu | Haftalık ya da aylık değerlendirme mesajı |
| Gün, zorunlu kaydı yapılmadan bitti | Ertesi gün başlarken "Missed check-in" |

- Caution düzeyi astronota söylenir, üsse gitmez; bir sonraki değerlendirmeye girer.
- Aynı sistem aynı gün iki kez bildirilmez; warning sürdükçe her gün yeniden bildirilir.
- Kritik okuma kendi gününde, ortalamaya bakılmadan, warning sayılır.

### 15.3 Günlük kayıt sonucu ve belirti kontrolü (Karar, Claude)

- Günlük kayıt bitince uygulama ne bulduğunu söyler: ilgi isteyen sistemler, eşleşen olası durumlar, ne yapılacağı ve üsse ne gittiği.
- **Belirti kontrolü** istenen zaman açılır. Astronot belirtisini işaretler; uygulama aynı durumun kaynaktaki diğer belirtilerini sorar ve ayırt etmeye yarayan ölçümleri ister (örn. baş dönmesi hissinde tansiyon ve nabız, bulanık görmede görme testi). Ölçüm gerekmiyorsa doğrudan sonucu söyler. Girilen belirti ve ölçümler o günün kaydına eklenir; kontrol günlük kaydın bir adımı sayılmaz.
- Simülasyon profilinde "Fill with simulated readings" düğmesi adımı temel değere yakın okumalarla doldurur. Zorunlu on bir ölçümü sunumda elle yazmamak içindir; gerçek profilde yoktur.

### 15.4 Demo değişiklikleri (Karar, Claude)

- 47. günün kaydı tamamdır. Hikâyenin son haftası bugün biter: egzersiz 41–47. günler, su 45–47. günler, uyku sorunu 43, 45 ve 47. günler. Seri 13 gündür.
- Ground link kutusu, 47 günün kurallara göre üreteceği mesajlarla dolu gelir: 7. gün haftalık değerlendirme (uzay tutması), 35. gün "34. günün kaydı yapılmadı", 47. gün "Urgent: Kidneys".

### 15.5 Ağız sağlığı: iptal (Karar, ekip)

Ekip ağız sağlığını da istedi, sonra iptal etti. Kaynak sayfalarında diş ve diş eti hakkında hiçbir cümle yok; ağızla ilgili yalnızca uçuk ve tükürük örneği geçiyor. Uygulama 12 sistemle kalır; uçuk belirtisi Blood & immunity altındadır.
