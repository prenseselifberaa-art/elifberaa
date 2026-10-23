# elifberaa

Elif Beraa Çığrıkçı'nın kişisel portföy sayfasının statik sürümü.
Tasarım ve içerik, sahibinin kendi portföy sayfasından birebir alınmıştır;
sayfa Vercel üzerinde yayınlanır.

- Canlı adres: `https://elifberaa.vercel.app`
- Kaynak: bu depo (`main` dalı)
- Teknoloji: saf HTML + CSS + vanilla JS; derleme adımı yok
- Bağımlılık: yok (fontlar ve ikonlar depoda yerel)

## Yapı

```
elifberaa/
├── index.html              # yayınlanan sayfa (scripts/build.mjs üretir)
├── src/                    # sayfa iskeleti parçaları (desktop, mobile, overlay)
├── assets/                 # Tailwind çıktısı, fontlar, site.css, app.js, data.js
├── images/avatar.jpg
├── logo/                   # ikon maskeleri
├── files/                  # CV (PDF)
├── scripts/build.mjs       # index.html'i src/ parçalarından üretir
├── docs/                   # kopyalama notları ve davranış şartnamesi
└── vercel.json             # başlıklar, önbellek, cleanUrls
```

## Yerel çalıştırma

```bash
python3 -m http.server 4174
# http://127.0.0.1:4174/
```

`index.html` içeriğini değiştirmek için önce `src/` parçalarını düzenleyin,
sonra:

```bash
node scripts/build.mjs
```

## Davranış

- Masaüstünde (>= 1000 px) bento ızgara, altında tek sütun liste düzeni.
- Her karta tıklamak soru görünümünü açar; soruya yerel bilgi tabanından yanıt
  verilir (harici yapay zekâ servisi yoktur).
- `?q=...` bağlantısı doğrudan soru görünümünü açar.
- Escape veya sol üstteki düğme sayfaya döner.
- Arka planda imleci ve dokunmayı izleyen akışkan (fluid) animasyonu vardır.
- Tek dokunuşluk segment düğmesi (mobilde sağ üstte, masaüstünde sağ altta):
  Fluid, Prenses ve Off; masaüstünde 1/2/3 tuşları da çalışır. Seçim yalnızca tarayıcıda saklanır, hiçbir yere
  gönderilmez. Mobilde akışkan boya kartların üzerine çarpılır, kedi kartların
  önünde gezer; ikisi de tıklamayı engellemez.
- Masaüstünde de boya kartların üzerine hafifçe çarpılır; fare durunca arka plan
  kendi kendine yumuşak bir iz bırakır.
- Prenses seçilince boş arka planda fare imleci gizlenir, imlecin yerini küçük
  taçlı kedi alır; kartların üzerinde kedi kaybolur ve normal imleç görünür,
  böylece tıklamak kolay kalır.
- Tüm animasyonlar duvar kağıdı gibi içeriğin arkasındadır; kartların ve
  butonların üzerine taşmaz.
- Profil fotoğrafında dönen pastel çerçeve, periyodik ışık süpürmesi, hover'da
  hafif zoom ve mobilde nefes alma animasyonu vardır.
- Butonlarda ayrı mikro animasyon: üzerine gelince pembe ışık süpürmesi ve hafif
  kalkma, basınca küçülme, CTA'larda nabız ve tıklamada yıldız kıvılcımı.
- `prefers-reduced-motion` açıkken animasyon varsayılan olarak kapalıdır;
  ziyaretçi isterse düğmeden açabilir.

Ayrıntılar: `docs/CLONE-NOTES.md` ve `docs/SPEC-APP.md`.

## Gizli değerler

Depoda hiçbir token, parola veya ortam değeri yoktur. Yayın kimlik bilgileri
depo dışında, sahibinin makinesinde tutulur.
