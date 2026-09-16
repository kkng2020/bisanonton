/**
 * BISA NONTON - Main Application Logic
 * Memuat katalog film, menangani filter, pencarian, dan hero highlight.
 */

let allMovies = [];
let currentFilter = 'all';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  fetchMovies();
  setupFilterTabs();
  setupSearch();
  setupScrollHandler();
  setupPlayerModalSync();

  // Sinkronkan progress tontonan secara realtime jika ada perubahan di player
  window.addEventListener('storage', () => {
    renderCatalog();
  });
});

// Katalog bawaan untuk rendering instan 0ms pada kunjungan pertama di semua perangkat
const DEFAULT_CATALOG_FALLBACK = [
  {
    "id": "mov_1789452458213_h6mud",
    "title": "Minions & Monsters (2026)",
    "description": "Minions & Monsters (2026), minions mencari makhluk menakutkan untuk film monster mereka di Hollywood 1920-an. Mereka bertemu dengan makhluk hijau yang tak terduga dan harus menyelamatkan bumi dari kekacauan monster yang mereka lepas.",
    "cover_url": "https://m.media-amazon.com/images/M/MV5BYzBjMDg4YjctYzg3ZS00ZDFmLWI1YjctM2RkZGVjZWEyYWQ0XkEyXkFqcGc@._V1_.jpg",
    "backdrop_url": "https://m.media-amazon.com/images/M/MV5BYzBjMDg4YjctYzg3ZS00ZDFmLWI1YjctM2RkZGVjZWEyYWQ0XkEyXkFqcGc@._V1_.jpg",
    "type": "movie",
    "year": 2026,
    "genre": "Animation",
    "stream_url": "https://stream.playcdn.de/playlist/743dbbdc501809c146833430c66de467/3/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789452238453_ry1kw",
    "title": "Colony (2026)",
    "description": "Dalam film Colony (2026), seorang profesor bernama Se Jeong menghadiri konferensi bioteknologi yang berubah menjadi bencana ketika virus mutasi cepat dilepaskan. Ketika wabah menyebar dan orang yang terinfeksi mulai berubah, otoritas memblokir seluruh fasilitas. Se Jeong harus bertahan hidup dan mencari cara untuk menghentikan wabah tersebut sebelum terlambat.",
    "cover_url": "https://m.media-amazon.com/images/M/MV5BNzI5YWViNGUtNGRiMy00OThhLWIwOGUtZjkyZDk2NjliODY2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "backdrop_url": "https://m.media-amazon.com/images/M/MV5BNzI5YWViNGUtNGRiMy00OThhLWIwOGUtZjkyZDk2NjliODY2XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "type": "movie",
    "year": 2026,
    "genre": "Zombie, Horror",
    "stream_url": "https://stream.playcdn.de/playlist/376543dc6374ddd87ece2c873c4e17ab/2/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789451336107_73io3",
    "title": "Mutiny (2026)",
    "description": "Mutiny - Setelah menyaksikan pembunuhan bos miliardernya dan dijebak sebagai pelakunya, Cole Reed nekat menaiki kapal kargo dalam misi sendirian untuk membalas dendam. Namun di tengah perjalanannya, ia justru membongkar sebuah konspirasi internasional yang jauh lebih besar dan berbahaya.",
    "cover_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNELfbfZB5Iy3rGEb_tN6zO_vJk8dQ-aG5wzZjRXZWfbmOE9mBC5lvFa4i&s=10",
    "backdrop_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNELfbfZB5Iy3rGEb_tN6zO_vJk8dQ-aG5wzZjRXZWfbmOE9mBC5lvFa4i&s=10",
    "type": "movie",
    "year": 2026,
    "genre": "Action",
    "stream_url": "https://stream.playcdn.de/playlist/f076a7a7d091ec197c1bfb71d211183d/1/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789151489454_kzynr",
    "title": "Avengers: Age of Ultron (2015)",
    "description": "Malam tahun baru di London berubah menjadi mimpi buruk ketika sebuah permainan provokatif berujung pembunuhan. Setiap orang memiliki versi cerita yang berbeda, dan kebohongan merajut jebakan maut. Siapa pembunuhnya? Dan bisakah kamu mempercayai siapa pun—bahkan dirimu sendiri?",
    "cover_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUSOEFU_BzggUQZyN2SRbnsEdnhfxVTaFE-kGpjqJ9rGV6L57cAjtM5TA&s=10",
    "backdrop_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUSOEFU_BzggUQZyN2SRbnsEdnhfxVTaFE-kGpjqJ9rGV6L57cAjtM5TA&s=10",
    "type": "movie",
    "year": 2015,
    "genre": "Sci-Fi",
    "stream_url": "https://stream.playcdn.de/playlist/939521bfedc9b8c88957e5810ed25da6/4/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789151030740_h86zz",
    "title": "Avengers: Endgame (2019)",
    "description": "Kekalahan pahit melawan Thanos meninggalkan luka yang dalam, tapi para Avengers takkan menyerah. Dengan sisa kekuatan dan sekutu yang tersisa, mereka merencanakan misi terakhir—mengembalikan semua yang hilang dan mengalahkan tirani sang Mad Titan.",
    "cover_url": "https://ew.com/thmb/hMTF50f7PJOlTX_bbSCH1ENLSZw=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/endgame-poster-2000-513c47c947ae462da2bb7941c7bbc14f.jpg",
    "backdrop_url": "https://ew.com/thmb/hMTF50f7PJOlTX_bbSCH1ENLSZw=/2000x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/endgame-poster-2000-513c47c947ae462da2bb7941c7bbc14f.jpg",
    "type": "movie",
    "year": 2019,
    "genre": "Sci-Fi",
    "stream_url": "https://stream.playcdn.de/playlist/153ea0ec867efae5398835a787407b6d/4/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789150948037_d6y8a",
    "title": "Avengers: Infinity War (2018)",
    "description": "Thanos, sang Penghancur, bangkit dengan misi mengumpulkan semua Infinity Stones untuk menghancurkan alam semesta. Para Avengers harus bersatu seperti never before, mengorbankan segalanya untuk menghentikannya.",
    "cover_url": "https://m.media-amazon.com/images/I/A1t8xCe9jwL.jpg",
    "backdrop_url": "https://m.media-amazon.com/images/I/A1t8xCe9jwL.jpg",
    "type": "movie",
    "year": 2018,
    "genre": "Sci-Fi",
    "stream_url": "https://stream.playcdn.de/playlist/3c263196bf30ea494572b60e30045587/4/480.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789139783079_1wr1a",
    "title": "Mayday (2026)",
    "description": "Mayday - Misi pengintaian rahasia Letnan Troy Brennan di atas wilayah Uni Soviet berujung kekacauan saat pesawatnya jatuh di hutan belantara Rusia.",
    "cover_url": "https://m.media-amazon.com/images/M/MV5BM2VmYWEzM2UtODNjZi00YTk1LWEzZjEtNzY4OGU0YTdkNmJmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "backdrop_url": "https://m.media-amazon.com/images/M/MV5BM2VmYWEzM2UtODNjZi00YTk1LWEzZjEtNzY4OGU0YTdkNmJmXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "type": "movie",
    "year": 2026,
    "genre": "Favorit",
    "stream_url": "https://stream.playcdn.de/playlist/e30393245917ce0b10d6c6b4d0d2c68e/1/0.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789139332468_p70pd",
    "title": "Moana (2026)",
    "description": "Moana - Seorang remaja perempuan yang pemberani bernama Moana meninggalkan pulaunya untuk pertama kalinya dan berlayar mengarungi samudra bersama seorang manusia setengah dewa yang bisa berubah wujud bernama Maui.",
    "cover_url": "https://instagram.fcgk27-2.fna.fbcdn.net/v/t51.82787-15/656288754_18569216155049007_7726964422300676605_n.webp?_nc_cat=105&ig_cache_key=Mzg1OTMwNzA5MzY4MTA0OTI1Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMiJ9&_nc_ohc=sDJKMjz-KNsQ7kNvwEayG_v&_nc_oc=Adop9bWq8OZEXtLITHf9p0n76WYxW3Cp8NbxhBprhxQhqCEqrrjSTCmpybSE2mCfGfM&_nc_zt=23&_nc_ht=instagram.fcgk27-2.fna&_nc_gid=4VUgzmouQ6ADcNAseo1e1w&_nc_ss=7b689&oh=00_AQIANZeQvjWmkzwJJo8WB8PJWfucaGEeWa2z0-fHLvI8Nw&oe=6AA9FE73",
    "backdrop_url": "https://instagram.fcgk27-2.fna.fbcdn.net/v/t51.82787-15/656288754_18569216155049007_7726964422300676605_n.webp?_nc_cat=105&ig_cache_key=Mzg1OTMwNzA5MzY4MTA0OTI1Mg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6IkNBUk9VU0VMX0lURU0ueHBpZHMuMTQ0MC5zZHIucmVndWxhcl9waG90by5DMiJ9&_nc_ohc=sDJKMjz-KNsQ7kNvwEayG_v&_nc_oc=Adop9bWq8OZEXtLITHf9p0n76WYxW3Cp8NbxhBprhxQhqCEqrrjSTCmpybSE2mCfGfM&_nc_zt=23&_nc_ht=instagram.fcgk27-2.fna&_nc_gid=4VUgzmouQ6ADcNAseo1e1w&_nc_ss=7b689&oh=00_AQIANZeQvjWmkzwJJo8WB8PJWfucaGEeWa2z0-fHLvI8Nw&oe=6AA9FE73",
    "type": "movie",
    "year": 2026,
    "genre": "Favorit",
    "stream_url": "https://stream.playcdn.de/playlist/d1c03ae96f93f573e323669704e04abb/1/0.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789137923128_vr3cg",
    "title": "The Last Sunrise (2026)",
    "description": "The Last Sunrise - Seorang wanita muda asal Amerika yang memiliki kendala kesehatan menemukan kisah romansa tak terduga dengan pria lokal yang karismatik saat menghabiskan musim panas di Majorca.",
    "cover_url": "https://i0.wp.com/streamingmovienight.com/wp-content/uploads/2026/07/the-last-sunrise-LSUN_2026_Static2x3_Close_2000x3000_EVRGRN_PV_FINAL_en-US_KAPS_rgb_optimized.webp?resize=683%2C1024&ssl=1",
    "backdrop_url": "https://i0.wp.com/streamingmovienight.com/wp-content/uploads/2026/07/the-last-sunrise-LSUN_2026_Static2x3_Close_2000x3000_EVRGRN_PV_FINAL_en-US_KAPS_rgb_optimized.webp?resize=683%2C1024&ssl=1",
    "type": "movie",
    "year": 2026,
    "genre": "Romance",
    "stream_url": "https://stream.playcdn.de/playlist/4b3288344ca8a9d740f85bc5187a847a/1/0.m3u8?x=1",
    "episodes": []
  },
  {
    "id": "mov_1789134949248_lsoog",
    "title": "A Bona Fide Killer - Season 1",
    "description": "A Bona Fide Killer adalah serial drama Korea (drakor) tahun 2026 yang menceritakan tentang seorang ibu rumah tangga biasa yang diam-diam menjalani kehidupan ganda sebagai penembak jitu atau pembunuh bayaran legendaris berjuluk \"Kingfisher\"",
    "cover_url": "https://m.media-amazon.com/images/M/MV5BMzFhZWI5Y2ItODFmNS00MzA3LWE0NGItOGEzNzVhOGEwM2M1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "backdrop_url": "https://m.media-amazon.com/images/M/MV5BMzFhZWI5Y2ItODFmNS00MzA3LWE0NGItOGEzNzVhOGEwM2M1XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    "type": "series",
    "year": 2026,
    "genre": "Action, Korean",
    "stream_url": "",
    "episodes": [
      { "id": "ep-1789451885951-0", "title": "Episode 1", "stream_url": "https://stream.playcdn.de/playlist/f6d90656d4868a0eddebc7674872ea9a/3/480.m3u8?x=1", "episode_number": 1 },
      { "id": "ep-1789451885951-1", "title": "Episode 2", "stream_url": "https://stream.playcdn.de/playlist/5329cfd44b363b69c117afbcadb491f2/3/480.m3u8?x=1", "episode_number": 2 },
      { "id": "ep-1789451885951-2", "title": "Episode 3", "stream_url": "https://stream.playcdn.de/playlist/4315171679d0c7b7897dd2712b47e8c0/3/480.m3u8?x=1", "episode_number": 3 },
      { "id": "ep-1789451885951-3", "title": "Episode 4", "stream_url": "https://stream.playcdn.de/playlist/cd38e61bf15b580aa59122abd28f5090/3/480.m3u8?x=1", "episode_number": 4 },
      { "id": "ep-1789451885951-4", "title": "Episode 5", "stream_url": "https://stream.playcdn.de/playlist/3a409c2057d85064b10b2b4abd811814/3/480.m3u8?x=1", "episode_number": 5 },
      { "id": "ep-1789451885951-5", "title": "Episode 6", "stream_url": "https://stream.playcdn.de/playlist/cf705e4898b7359bdc6482998d85e9f6/3/480.m3u8?x=1", "episode_number": 6 },
      { "id": "ep-1789451885951-6", "title": "Episode 7", "stream_url": "https://stream.playcdn.de/playlist/c081b206a7b8982b77b26ba9c291a654/3/0.m3u8?x=1", "episode_number": 7 },
      { "id": "ep-1789451885951-8", "title": "Episode 8", "stream_url": "https://stream.playcdn.de/playlist/0f24e7083c3570da8f6f40adadd24acd/3/0.m3u8?x=1", "episode_number": 8 },
      { "id": "ep-1789451885951-9", "title": "Episode 9", "stream_url": "https://stream.playcdn.de/playlist/df606e81c59d782aeb1f58039b4b7464/1/0.m3u8?x=1", "episode_number": 9 },
      { "id": "ep-1789451885951-10", "title": "Episode 10", "stream_url": "https://stream.playcdn.de/playlist/292f52e35d13eda8cf92cce0ec7cd013/1/0.m3u8?x=1", "episode_number": 10 },
      { "id": "ep-1789451885951-11", "title": "Episode 11", "stream_url": "https://stream.playcdn.de/playlist/ba4d3a53703d4ee69dc6eae006af9ac1/1/0.m3u8?x=1", "episode_number": 11 },
      { "id": "ep-1789451885951-12", "title": "Episode 12", "stream_url": "https://stream.playcdn.de/playlist/18d54f49d01d00bfdf1ff0cb985f05b6/1/0.m3u8?x=1", "episode_number": 12 }
    ]
  }
];

// Helper: Urutkan daftar film berdasarkan tahun rilis secara menurun (terbaru ke terlama)
function sortMoviesByYear(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const yearA = parseInt(a.year, 10) || 0;
    const yearB = parseInt(b.year, 10) || 0;
    if (yearB !== yearA) return yearB - yearA;
    return (a.title || '').localeCompare(b.title || '');
  });
}

// Helper: Cari film unggulan untuk Hero (utamakan genre 'Favorit' atau item pertama)
function getFeaturedMovie(movies) {
  if (!Array.isArray(movies) || movies.length === 0) return null;
  const fav = movies.find(m => (m.genre && m.genre.toLowerCase().includes('favorit')) || m.featured);
  return fav || movies[0];
}

// Variabel Kontrol Hero Video Preview & Audio
let heroHls = null;
let heroVideoEl = null;
let heroPosterEl = null;
let heroSoundToggle = null;
let heroSoundIcon = null;
let heroSoundLabel = null;
let isHeroMuted = true;
let heroVolumeFadeInterval = null;
let heroClipStart = 1800; // menit 30 (1800 detik)
let heroClipEnd = 1920;   // menit 32 (1920 detik)
let currentFeaturedMovie = null;

function initHeroElements() {
  heroVideoEl = document.getElementById('heroVideoLayer');
  heroPosterEl = document.getElementById('heroPosterLayer');
  heroSoundToggle = document.getElementById('heroSoundToggle');
  heroSoundIcon = document.getElementById('heroSoundIcon');
  heroSoundLabel = document.getElementById('heroSoundLabel');

  if (heroSoundToggle) {
    heroSoundToggle.onclick = (e) => {
      e.stopPropagation();
      toggleHeroAudio();
    };
  }

  // Interaksi klik di banner hero (kecuali tombol kontrol) memicu audio jika user ingin dengar
  const heroBanner = document.getElementById('heroBanner');
  if (heroBanner) {
    heroBanner.onclick = (e) => {
      if (e.target.closest('#heroPlayBtn') || e.target.closest('#heroSoundToggle') || e.target.closest('#heroScrollDown')) {
        return;
      }
      // Jika sedang menampilkan cover gambar (video tidak aktif), klik memutar kembali cuplikan
      if (heroVideoEl && !heroVideoEl.classList.contains('active')) {
        if (typeof window.restartHeroClip === 'function') {
          window.restartHeroClip();
        }
        fadeHeroAudioIn();
      } else if (isHeroMuted) {
        fadeHeroAudioIn();
      }
    };
  }
}

function updateHeroSoundUI(isUnmuted) {
  if (!heroSoundIcon || !heroSoundLabel) return;
  if (isUnmuted) {
    heroSoundIcon.textContent = '🔊';
    heroSoundLabel.textContent = 'Suara (50%)';
    if (heroSoundToggle) heroSoundToggle.title = 'Matikan Suara Cuplikan';
  } else {
    heroSoundIcon.textContent = '🔇';
    heroSoundLabel.textContent = 'Suara (0%)';
    if (heroSoundToggle) heroSoundToggle.title = 'Nyalakan Suara Cuplikan (Volume 50%)';
  }
}

// Fade in suara video hingga volume default 50% (0.5)
function fadeHeroAudioIn() {
  if (!heroVideoEl) return;
  clearInterval(heroVolumeFadeInterval);
  heroVideoEl.muted = false;
  isHeroMuted = false;
  updateHeroSoundUI(true);

  let currentVol = heroVideoEl.volume || 0;
  const targetVol = 0.5; // Default 50% sesuai permintaan
  const step = 0.1;

  heroVolumeFadeInterval = setInterval(() => {
    if (currentVol < targetVol) {
      currentVol = Math.min(targetVol, currentVol + step);
      heroVideoEl.volume = currentVol;
    } else {
      clearInterval(heroVolumeFadeInterval);
    }
  }, 90);
}

// Fade out suara video
function fadeHeroAudioOut(muteAtEnd = true) {
  if (!heroVideoEl) return;
  clearInterval(heroVolumeFadeInterval);
  let currentVol = heroVideoEl.volume || 0.5;
  const step = 0.1;

  heroVolumeFadeInterval = setInterval(() => {
    if (currentVol > 0.05) {
      currentVol = Math.max(0, currentVol - step);
      heroVideoEl.volume = currentVol;
    } else {
      heroVideoEl.volume = 0;
      if (muteAtEnd) {
        heroVideoEl.muted = true;
        isHeroMuted = true;
        updateHeroSoundUI(false);
      }
      clearInterval(heroVolumeFadeInterval);
    }
  }, 70);
}

function toggleHeroAudio() {
  if (!heroVideoEl) return;
  // Jika saat ini sedang di cover gambar (video tidak aktif), putar kembali cuplikan dan nyalakan suaranya
  if (!heroVideoEl.classList.contains('active')) {
    if (typeof window.restartHeroClip === 'function') {
      window.restartHeroClip();
    }
    fadeHeroAudioIn();
    return;
  }

  if (isHeroMuted || heroVideoEl.muted || heroVideoEl.volume === 0) {
    fadeHeroAudioIn();
  } else {
    fadeHeroAudioOut(true);
  }
}

// Muat preview video background HLS di latar belakang banner hero (menit 30-32)
function loadHeroVideoPreview(item) {
  if (!heroVideoEl) return;

  // Bersihkan instance HLS sebelumnya jika ada
  if (heroHls) {
    heroHls.destroy();
    heroHls = null;
  }

  heroVideoEl.pause();
  heroVideoEl.removeAttribute('src');
  heroVideoEl.classList.remove('active');
  heroVideoEl.muted = true;
  heroVideoEl.volume = 0;
  isHeroMuted = true;
  updateHeroSoundUI(false);

  let rawStreamUrl = null;
  if (item.type === 'series' && Array.isArray(item.episodes) && item.episodes.length > 0) {
    rawStreamUrl = item.episodes[0].stream_url;
  } else {
    rawStreamUrl = item.stream_url;
  }

  if (!rawStreamUrl) return;

  let streamUrl = rawStreamUrl.trim();
  if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
    streamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;
  }

  let isTransitioningToPoster = false;
  let heroLoopTimeout = null;

  const fadeToPosterAndRest = () => {
    if (isTransitioningToPoster) return;
    isTransitioningToPoster = true;

    // 1. Fade out video & fade in poster cover gambar secara mulus
    heroVideoEl.classList.remove('active');
    if (heroPosterEl) heroPosterEl.classList.remove('fade-out');

    // 2. Fade out audio cuplikan
    fadeHeroAudioOut(true);

    // 3. Setelah transisi CSS fade-out (1.5s), jeda pemutaran video
    setTimeout(() => {
      heroVideoEl.pause();
    }, 1500);

    // 4. Tampilkan cover gambar beberapa saat (7 detik), kemudian putar cuplikan kembali
    clearTimeout(heroLoopTimeout);
    heroLoopTimeout = setTimeout(() => {
      const playerModal = document.getElementById('playerModal');
      const isPlayerOpen = playerModal && playerModal.classList.contains('active');
      const scrollY = window.scrollY || window.pageYOffset;
      if (!isPlayerOpen && scrollY < 300) {
        restartHeroClip();
      } else {
        isTransitioningToPoster = false;
      }
    }, 7000);
  };

  const restartHeroClip = () => {
    clearTimeout(heroLoopTimeout);
    isTransitioningToPoster = false;
    heroVideoEl.currentTime = heroClipStart;
    heroVideoEl.play().catch(err => {
      console.warn('Hero preview autoplay ditunda browser:', err);
    });
  };

  window.restartHeroClip = restartHeroClip;

  const startClipPlayback = () => {
    // Selalu kunci default tepat di menit 30:00 (1800 detik) hingga menit 32:00 (1920 detik)
    heroClipStart = 1800;
    heroClipEnd = 1920;

    // Hanya sesuaikan jika durasi film benar-benar sudah valid dan kurang dari 32 menit (< 1950 detik)
    const dur = heroVideoEl.duration;
    if (dur && !isNaN(dur) && isFinite(dur) && dur > 0 && dur < 1950) {
      if (dur > 200) {
        heroClipStart = Math.floor(dur * 0.35);
        heroClipEnd = Math.min(dur - 5, heroClipStart + 120);
      } else {
        heroClipStart = Math.max(0, Math.floor(dur * 0.1));
        heroClipEnd = Math.max(15, dur - 1);
      }
    }

    heroVideoEl.currentTime = heroClipStart;

    heroVideoEl.play().catch(err => {
      console.warn('Hero preview autoplay ditunda browser:', err);
    });

    // Pantau progres cuplikan secara ketat
    heroVideoEl.ontimeupdate = () => {
      if (isTransitioningToPoster) return;

      const current = heroVideoEl.currentTime || 0;

      // 1. Tampilkan video (fade-in) dan sembunyikan poster HANYA setelah detik video benar-benar berada di sekitar menit 30
      if (current >= heroClipStart - 2 && !heroVideoEl.classList.contains('active')) {
        heroVideoEl.classList.add('active');
        if (heroPosterEl) heroPosterEl.classList.add('fade-out');
      }

      // 2. Jika browser sempat memutar dari detik 0 di awal, paksa lompat ke menit 30 tanpa memicu fade-out
      if (current < heroClipStart - 5 && current > 0) {
        heroVideoEl.currentTime = heroClipStart;
        return;
      }

      // 3. Ketika telah mencapai menit 32 (1920 detik), fade out dan kembali ke cover gambar
      if (current >= heroClipEnd) {
        fadeToPosterAndRest();
      }
    };
  };

  if (window.Hls && Hls.isSupported()) {
    heroHls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      startPosition: 1800, // Langsung minta segmen di detik 1800 (menit 30:00) ke server CDN
      maxBufferLength: 20
    });
    heroHls.loadSource(streamUrl);
    heroHls.attachMedia(heroVideoEl);

    heroHls.on(Hls.Events.MANIFEST_PARSED, () => {
      heroVideoEl.currentTime = 1800;
      startClipPlayback();
    });

    heroHls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        console.warn('Hero preview HLS error:', data.type);
        if (heroHls) {
          heroHls.destroy();
          heroHls = null;
        }
      }
    });
  } else if (heroVideoEl.canPlayType('application/vnd.apple.mpegurl')) {
    heroVideoEl.src = streamUrl;
    heroVideoEl.addEventListener('loadedmetadata', () => {
      heroVideoEl.currentTime = 1800;
      startClipPlayback();
    }, { once: true });
  }
}

// Mengambil daftar film dari API (dengan Stale-While-Revalidate agar instan 0ms)
async function fetchMovies() {
  const grid = document.getElementById('moviesGrid');

  // 1. Tampilkan data dari cache lokal jika ada (langsung muncul 0 detik, diurutkan tahun)
  let hasRendered = false;
  try {
    const cached = localStorage.getItem('bisanonton_catalog_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allMovies = sortMoviesByYear(parsed);
        renderHero(getFeaturedMovie(allMovies));
        renderCatalog();
        hasRendered = true;
      }
    }
  } catch (e) { }

  // 2. Jika belum ada cache sama sekali di localStorage, render dari default fallback instan 0 detik
  if (!hasRendered && Array.isArray(DEFAULT_CATALOG_FALLBACK) && DEFAULT_CATALOG_FALLBACK.length > 0) {
    allMovies = sortMoviesByYear(DEFAULT_CATALOG_FALLBACK);
    renderHero(getFeaturedMovie(allMovies));
    renderCatalog();
    hasRendered = true;
  }

  // 3. Fetch data terbaru dari server di background (Stale-While-Revalidate)
  try {
    const res = await fetch('/api/movies');
    const result = await res.json();

    if (result.success && Array.isArray(result.data) && result.data.length > 0) {
      const sortedNew = sortMoviesByYear(result.data);
      const currentJson = JSON.stringify(allMovies);
      const newJson = JSON.stringify(sortedNew);
      if (currentJson !== newJson || !hasRendered) {
        allMovies = sortedNew;
        renderHero(getFeaturedMovie(allMovies));
        renderCatalog();
      }
      // Simpan ke cache browser untuk kunjungan berikutnya
      try {
        localStorage.setItem('bisanonton_catalog_cache', JSON.stringify(sortedNew));
      } catch (e) { }
    } else if (!hasRendered) {
      showErrorState('Gagal memuat data koleksi.');
    }
  } catch (error) {
    console.error('Error fetching movies:', error);
    if (!hasRendered) {
      showErrorState('Tidak dapat terhubung ke server backend.');
    }
  }
}

// Render Hero Highlight Banner (100vh Fullscreen Edge-to-Edge)
function renderHero(featuredMovie) {
  const heroBanner = document.getElementById('heroBanner');
  if (!featuredMovie) {
    heroBanner.style.display = 'none';
    return;
  }

  currentFeaturedMovie = featuredMovie;
  initHeroElements();

  const bgImage = featuredMovie.backdrop_url || featuredMovie.cover_url;
  if (bgImage && heroPosterEl) {
    heroPosterEl.style.backgroundImage = `url('${bgImage}')`;
    heroPosterEl.classList.remove('fade-out');
  }

  document.getElementById('heroBadge').textContent = featuredMovie.type === 'series' ? '🔥 Serial Pilihan' : '⭐ Film Favorit';
  document.getElementById('heroTitle').textContent = featuredMovie.title;
  document.getElementById('heroYear').textContent = featuredMovie.year || '2026';
  document.getElementById('heroGenre').textContent = featuredMovie.genre || 'Favorit';
  document.getElementById('heroDesc').textContent = featuredMovie.description || 'Nonton film pilihan favorit berkualitas tinggi.';

  const playBtn = document.getElementById('heroPlayBtn');
  // Hapus listener lama jika ada
  const newPlayBtn = playBtn.cloneNode(true);
  playBtn.parentNode.replaceChild(newPlayBtn, playBtn);

  newPlayBtn.addEventListener('click', () => {
    // Matikan preview saat modal player utama dibuka
    if (heroVideoEl) {
      heroVideoEl.pause();
      fadeHeroAudioOut(true);
    }
    if (window.playerInstance) {
      window.playerInstance.open(featuredMovie);
    }
  });

  heroBanner.style.display = 'flex';

  // Muat preview video background cuplikan menit 30-32
  loadHeroVideoPreview(featuredMovie);
}

// Render Katalog Kartu Film
function renderCatalog() {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = '';

  // Filter berdasarkan tipe dan search query
  const filtered = allMovies.filter(item => {
    const matchType = currentFilter === 'all' || item.type === currentFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q ||
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.genre && item.genre.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q));

    return matchType && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Tidak Ada Film Ditemukan</h3>
        <p style="margin-top: 0.5rem; color: var(--text-dim);">Coba kata kunci lain atau periksa filter kategori yang dipilih.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('article');
    card.className = 'movie-card';

    const isSeries = item.type === 'series';
    const epCount = isSeries && Array.isArray(item.episodes) ? `${item.episodes.length} Ep` : '';
    const badgeText = isSeries ? `SERIAL ${epCount ? '• ' + epCount : ''}` : 'FILM';
    const badgeClass = isSeries ? 'badge-series' : 'badge-movie';
    const defaultCover = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

    // Cek apakah ada riwayat tontonan tersimpan di localStorage
    let progressHtml = '';
    try {
      const saved = localStorage.getItem(`bisanonton_progress_${item.id}`);
      if (saved) {
        const progData = JSON.parse(saved);
        if (progData && progData.percent && progData.percent >= 2 && progData.percent <= 92) {
          const epLabel = progData.episodeTitle ? `${progData.episodeTitle} • ` : (typeof progData.episodeIndex === 'number' ? `Ep ${progData.episodeIndex + 1} • ` : '');
          progressHtml = `
            <div class="card-progress-bar" title="Ditonton ${epLabel}${progData.percent}%">
              <div class="card-progress-fill" style="width: ${progData.percent}%"></div>
            </div>
          `;
        }
      }
    } catch (e) { }

    card.innerHTML = `
      <div class="card-poster">
        <span class="card-badge ${badgeClass}">${badgeText}</span>
        <img src="${item.cover_url || defaultCover}" alt="${item.title}" loading="lazy" onerror="this.src='${defaultCover}'">
        <div class="card-overlay">
          <div class="card-play-btn">▶</div>
        </div>
        ${progressHtml}
      </div>
      <div class="card-info">
        <h3 class="card-title" title="${item.title}">${item.title}</h3>
        <div class="card-meta">
          <span>${item.year || ''}</span>
          <span>${item.genre || ''}</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      // Pause hero video preview saat user membuka film
      if (heroVideoEl) {
        heroVideoEl.pause();
        fadeHeroAudioOut(true);
      }
      if (window.playerInstance) {
        window.playerInstance.open(item);
      }
    });

    grid.appendChild(card);
  });
}

// Setup Tab Filter (Semua, Film, Serial)
function setupFilterTabs() {
  const tabs = document.querySelectorAll('.filter-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-type');
      renderCatalog();
    });
  });
}

// Setup Search Input (Terletak di baris header katalog)
function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  let debounceTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      renderCatalog();
    }, 180);
  });
}

// Setup Scroll Handler (Navbar Reveal & Auto-Pause Hero Preview)
function setupScrollHandler() {
  const navbar = document.getElementById('mainNavbar');
  const heroBanner = document.getElementById('heroBanner');
  const scrollDownBtn = document.getElementById('heroScrollDown');

  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      const catalog = document.getElementById('catalogSection');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY || window.pageYOffset;

    // 1. Tampilkan navbar saat scroll ke bawah (> 80px)
    if (navbar) {
      if (scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // 2. Pause hero preview saat keluar dari viewport (hemat performa & baterai)
    if (heroVideoEl && heroBanner) {
      const heroHeight = heroBanner.offsetHeight || window.innerHeight;
      if (scrollY > heroHeight * 0.7) {
        if (!heroVideoEl.paused) {
          heroVideoEl.pause();
          fadeHeroAudioOut(true);
        }
      } else {
        // Kembali ke area atas: resume preview jika modal player tidak sedang dibuka
        const playerModal = document.getElementById('playerModal');
        const isPlayerOpen = playerModal && playerModal.classList.contains('active');
        if (heroVideoEl.paused && !isPlayerOpen) {
          heroVideoEl.play().catch(() => { });
        }
      }
    }
  }, { passive: true });
}

// Sinkronisasi dengan Modal Player agar preview hero otomatis resume saat player ditutup
function setupPlayerModalSync() {
  const playerCloseBtn = document.getElementById('playerCloseBtn');
  if (playerCloseBtn) {
    playerCloseBtn.addEventListener('click', () => {
      setTimeout(() => {
        const scrollY = window.scrollY || window.pageYOffset;
        if (heroVideoEl && scrollY < 300) {
          heroVideoEl.play().catch(() => { });
        }
      }, 400);
    });
  }
}

function showErrorState(message) {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <h3>Terjadi Kesalahan</h3>
      <p style="margin-top: 0.5rem; color: var(--text-dim);">${message}</p>
    </div>
  `;
}
