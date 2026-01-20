// JSON verisini normalize et - farklı formatları standart formata dönüştür
const normalizeJsonData = (data) => {
    // Başlık: title (object veya string) -> baslik
    let baslik = data.baslik;
    if (!baslik && data.title) {
        if (typeof data.title === 'object') {
            baslik = data.title.improved || data.title.original || '';
        } else {
            baslik = data.title;
        }
    }

    // Açıklama: description -> aciklama
    const aciklama = data.aciklama || data.description || '';

    // Etiketler: tags (array veya string) -> etiketler
    let etiketler = data.etiketler;
    if (!etiketler && data.tags) {
        if (Array.isArray(data.tags)) {
            etiketler = data.tags.join(', ');
        } else {
            etiketler = data.tags;
        }
    }

    // Kısa içerik: shortContent -> kisaIcerik
    const kisaIcerik = data.kisaIcerik || data.shortContent || '';

    // Detaylı içerik: detailedContent -> icerik
    const icerik = data.icerik || data.detailedContent || '';

    return {
        baslik,
        aciklama,
        etiketler,
        kisaIcerik,
        icerik,
        // Orijinal veriyi de sakla
        _original: data
    };
};

module.exports = { normalizeJsonData };
