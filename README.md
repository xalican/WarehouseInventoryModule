# ERP Depo ve Stok Hareketleri Modülü (YM-02)

Bu proje, ERP sistemlerindeki malzeme yönetimi (stok) modülünün sadeleştirilmiş ve yüksek performanslı bir fullstack uygulamasıdır. Malzeme kartları ve depo tanımları üzerinden stok giriş, çıkış ve depolar arası transfer hareketlerinin kaydedildiği; her hareketin stok bakiyesini güncellediği ve anlık stok durumunun raporlanabildiği modern bir web yazılımıdır.

---

## 🚀 Öne Çıkan Özellikler

- **Gelişmiş Stok Hareket Yönetimi**: Giriş, Çıkış ve Depolar Arası Transfer işlemleri.
- **Atomik İşlemler (Transactions)**: Transfer hareketlerinin kaynak ve hedef depo kayıtları tek bir `DbTransaction` ile yürütülür.
- **Negatif Bakiye Engeli**: Çıkış ve transfer işlemlerinde anlık stok kontrolü yapılır; stok yetersizse sunucu tarafında işlem engellenir.
- **Yürüyen Bakiye (Kartoteks / Running Total)**: Seçilen malzemenin tarih sıralı tüm hareketleri ve her satırdaki anlık yürüyen bakiyesi hesaplanır.
- **Kritik Stok Uyarısı**: Kritik stok seviyesinin altına düşen malzemeler anlık stok durum tablosunda otomatik renklendirilir ve uyarılır.
- **İptal Mekanizması**: Fiziksel silme yapılmadan fişler `IsIptal = true` işaretlenir ve stok bakiyesi ters işlemle otomatik düzeltilir.
- **Rol Tabanlı Yetkilendirme (RBAC)**: 4 farklı kullanıcı rolü (`Admin`, `DepoSorumlusu`, `DepoPersoneli`, `Goruntuleyici`).
- **Excel/CSV Dışa Aktarım**: Stok durum tablosu, kartoteks defteri ve grup özet raporları Excel olarak indirilebilir.

---

## 🛠️ Teknoloji Yığını

| Katman | Teknoloji / Kütüphane | Açıklama |
| :--- | :--- | :--- |
| **Backend** | .NET 8 Web API (C#) | Katmanlı Mimari (API, Application, Infrastructure, Domain) |
| **ORM & Veritabanı** | EF Core 9 + Pomelo MySQL | MySQL 8.0+, Code-First Yaklaşımı ve Otomatik Seed Scripti |
| **Kimlik Doğrulama** | JWT (Bearer Token) + BCrypt | 60 Dakika Geçerli Token, Güvenli Salted Hashleme |
| **Loglama & Doküman** | Serilog + Swashbuckle Swagger | Dosya ve Konsol Loglama, OpenAPI Dokümantasyonu |
| **Frontend** | React 18 + Vite | Fonksiyonel Bileşenler ve Custom Hooklar |
| **UI Kütüphanesi** | Material UI (MUI) v6 | Kurumsal Dark/Light Uyumlu Temiz Arayüz Bileşenleri |
| **Veri Erişimi (FE)** | Axios + React Query | Interceptor ile Bearer Token Ekleme ve 401 Yönetimi |
| **Dışa Aktarım** | SheetJS (XLSX) | İstemci Tarafında Dinamik Excel Rapor Oluşturma |

---

## 🔑 Hazır Test Kullanıcıları ve Rol Yetkileri

Veritabanı otomatik başlatıldığında (Seed Data) aşağıdaki test kullanıcıları hazır olarak yüklenir:

| Kullanıcı Adı | Parola | Rol | Yetki Özeti |
| :--- | :--- | :--- | :--- |
| **admin** | `Admin123!` | Admin | Tüm sistem yönetimi, tanım ekleme, fiş girme, fiş iptal etme, kullanıcı yönetimi. |
| **sorumlu** | `Sorumlu123!` | Depo Sorumlusu | Malzeme ve depo tanımlarını yönetir, fiş girer, fiş iptal edebilir. |
| **personel** | `Personel123!` | Depo Personeli | Giriş, çıkış ve transfer fişi girer; stok durumu ve hareket defterini görüntüler. |
| **goruntuleyici** | `Goruntuleyici123!` | Görüntüleyici | Yalnızca stok durumu, kartoteks ve raporları görüntüler (Yazma/Silme yetkisi yok). |

---

## 📁 Proje Kurulumu ve Çalıştırma Adımları

### 1. Ön Gereksinimler
- .NET 8.0 SDK (`dotnet --version` >= 8.0.423)
- Node.js (`node -v` >= 18.0)
- MySQL 8.0 Servisi (`MySQL80` servisi çalışır durumda olmalıdır)

### 2. Veritabanı Bağlantısı
`DepoStok.API/appsettings.json` dosyasındaki MySQL bağlantı dizesini kendi veritabanı kullanıcı adı ve parolanıza göre güncelleyin:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=DepoStokDb;User=root;Password=root;"
}
```

### 3. Backend'i Başlatma (.NET 8 Web API)
```bash
cd DepoStok.API
dotnet run --urls http://localhost:5078
```
*Backend ilk başladığında veritabanını (`DepoStokDb`), tabloları ve 105 malzeme, 4 depo, 300+ test hareketini otomatik olarak yükleyecektir.*

- **Swagger API Dokümantasyonu**: [http://localhost:5078/swagger](http://localhost:5078/swagger)

### 4. Frontend'i Başlatma (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- **Web Uygulaması Arayüzü**: [http://localhost:5173](http://localhost:5173)

---

## 🛡️ Uygulanan Güvenlik Kontrol Listesi

- [x] **Kimlik Doğrulama**: JWT (Bearer Token) ile oturum yönetimi. Süresi dolan istekler `401 Unauthorized` döner.
- [x] **Parola Yönetimi**: Parolalar `BCrypt.Net` ile salt'lı olarak hash'lenir. API cevaplarında asla geri dönmez.
- [x] **Rol Tabanlı Yetkilendirme**: Sunucu tarafında `[Authorize(Roles = "...")]` nitelikleri ile zorunlu kontrol.
- [x] **IDOR & Yatay Yetki Koruması**: Kullanıcı ID'si istemciden gelen değerden değil, doğrudan JWT Claim üzerinden okunur.
- [x] **Girdi Doğrulaması**: Miktar, fiyat, boş alan ve tip kontrolleri sunucu tarafında doğrulanır.
- [x] **SQL Injection Koruması**: Tüm sorgular Entity Framework Core LINQ parametrik sorguları ile çalıştırılır.
- [x] **XSS Koruması**: React varsayılan HTML kaçış mekanizması korunmuştur.
- [x] **Hata Yönetimi**: Kullanıcıya teknik yığın izi (stack trace) sızdırılmaz; tüm detaylar Serilog dosyalarına yazılır.
- [x] **Veri Silme Güvenliği**: Fiziksel silme yerine `IsIptal = true` veya pasife alma uygulanır.

---

## 📊 Kapanış Sunumu Akış Önerisi (15-20 Dakika)

1. **Giriş ve Proje Özeti (2 dk)**: ERP Malzeme/Stok modülünün amacı ve ana veri ile hareket verisi ayrımının açıklanması.
2. **Mimari ve Veri Modeli (3 dk)**: Katmanlı .NET 8 Web API, React Vite arayüzü ve MySQL ilişkisel şemasının tanıtılması.
3. **Canlı Demo Gösterimi (8 dk)**:
   - **Giriş Ekranı**: Hızlı demo butonları ile farklı rollerde giriş.
   - **Stok Durumu**: Malzeme x Depo kırılımı ve kritik stok renklendirmesi.
   - **Stok Fiş Girişi**: Giriş yapma, çıkış yaparken yetersiz stok hatasını tetikleme ve transfer işlemi.
   - **Kartoteks (Hareket Defteri)**: Yürüyen bakiye (Running total) değişimini ve Excel indirmeyi gösterme.
   - **İptal İşlemi**: Yanlış fişin iptal edilmesi ve bakiyenin otomatik düzelmesi.
4. **Güvenlik Önlemleri ve Karşılaşılan Zorluklar (3 dk)**: Eşzamanlı stok çıkışlarında negatif bakiye engelleme ve JWT claims yönetimi.
5. **Gelecek Faz (Next Phase) Önerileri (2 dk)**: Barkod/QR okuyucu entegrasyonu, Parti/Lot takibi ve FIFO maliyetlendirme.
