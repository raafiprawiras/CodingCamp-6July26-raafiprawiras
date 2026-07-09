/**
 * main.js — Global JavaScript
 * Website Profil Desa Wisata "Nepal van Java"
 *
 * Handles:
 * 1. Sticky Header Scroll Effect (padding-only, transparent stays transparent)
 * 2. Mobile Navigation Toggle
 * 3. Language Switcher (ID/EN) — Dictionary-based, no page reload
 */

/* ============================================================
   1. STICKY HEADER — Hanya ubah padding, bukan warna background
   ============================================================ */
const header = document.getElementById('main-header');
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            header.classList.add('header-scrolled');
            header.classList.add('nav-adapt');
        } else {
            header.classList.remove('header-scrolled');
            header.classList.remove('nav-adapt');
        }
    }, { passive: true });
}

/* ============================================================
   2. MOBILE NAVIGATION TOGGLE
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('primary-navigation');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.toggle('nav-open');
            mobileToggle.setAttribute('aria-expanded', isOpen);
        });

        // Tutup menu jika klik di luar
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
                navMenu.classList.remove('nav-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ============================================================
       3. LANGUAGE SWITCHER — Kamus Terjemahan (ID / EN)
       ============================================================ */
    const translations = {
        id: {
            // Navbar
            nav_home: 'Beranda',
            nav_profil: 'Profil',
            nav_destinasi: 'Destinasi',
            nav_kuliner: 'Kuliner',
            nav_homestay: 'Homestay',
            nav_galeri: 'Galeri',
            nav_kontak: 'Kontak',

            // Hero Section
            hero_tagline: 'Desa Wisata • Magelang, Jawa Tengah',
            hero_title: 'Surga Tersembunyi di Lereng Sumbing',
            hero_subtitle: 'Merasakan kemegahan panorama gunung, lautan awan, dan pemukiman bertumpuk ikonik yang dijuluki "Nepal van Java".',
            hero_cta_primary: 'Jelajahi Destinasi',
            hero_cta_ghost: 'Rencanakan Trip',
            scroll_text: 'Scroll',

            // Highlights Strip
            hl_title1: '1.620 mdpl',
            hl_desc1: 'Pemukiman tertinggi di lereng Gunung Sumbing',
            hl_title2: 'Sunrise Magis',
            hl_desc2: 'Lautan awan setiap pagi yang tak tertandingi',
            hl_title3: '100+ Homestay',
            hl_desc3: 'Penginapan nyaman di tengah panorama pegunungan',
            hl_title4: 'Akses Mudah',
            hl_desc4: 'Hanya 2 jam dari Yogyakarta dan Semarang',

            // Sticky Story Section
            story_tagline: 'DUSUN BUTUH',
            story_title: 'Menyentuh Awan di 1.620 mdpl',
            story_p1: 'Dusun Butuh merupakan pemukiman tertinggi di lereng Gunung Sumbing, Kaliangkrik, Magelang. Terhampar indah pada elevasi 1.620 meter di atas permukaan laut, dusun ini menawarkan pemandangan magis pemukiman penduduk yang bertumpuk rapi di lereng bukit, menyerupai arsitektur eksotis khas negara Nepal.',
            story_p2: 'Setiap pagi, kabut tipis dan lautan awan berarak perlahan menyelimuti atap-atap rumah warga, menciptakan sensasi luar biasa seolah Anda sedang berdiri di atas awan. Udara pegunungan yang sangat bersih dan dingin berpadu harmonis dengan kehangatan senyuman ramah penduduk lokal yang menyambut setiap langkah perjalanan Anda.',
            story_p3: 'Bukan sekadar destinasi wisata, tempat ini adalah pelarian sempurna dari hiruk-pikuk kehidupan kota. Di sini, Anda dapat kembali menyatu dengan alam, menikmati hijaunya ladang sayur berundak, menghirup aroma kopi arabika khas Kaliangkrik, dan menemukan kedamaian yang sejati.',

            // Floating Bento Destinations
            bento_tagline: 'EKSPLORASI',
            bento_title: 'Jelajahi Sudut Dusun',
            bento_dest1_title: 'Sunrise Point Sumbing',
            bento_dest1_desc: 'Menyaksikan detik-detik terbitnya matahari di atas lautan awan yang magis.',
            bento_dest2_title: 'Lembah Sumbing',
            bento_dest2_desc: 'Perkebunan sayur hijau berundak asri yang memanjakan mata.',
            bento_dest3_title: 'Teras Nepal',
            bento_dest3_desc: 'Sudut pandang terbaik menikmati lanskap rumah bertumpuk Dusun Butuh.',
            dest_link: 'Lihat Detail →',
            bento_see_all: 'Lihat Semua Destinasi →',
            bento_cat_viewpoint: 'Panorama',
            bento_cat_nature: 'Alam',
            bento_cat_iconic: 'Ikonik',
            story_cta: 'Baca Selengkapnya →',

            // Testimonials
            testi_tagline: 'CERITA PENGUNJUNG',
            testi_title: 'Kata Mereka yang Sudah Merasakan',
            testi_q1: '"Pemandangan pagi hari di sini benar-benar di luar kata-kata. Kabut yang menyelimuti desa saat sunrise adalah pengalaman paling magis yang pernah kami rasakan dalam perjalanan kami di Indonesia."',
            testi_q2: '"Nepal van Java memang bukan nama yang berlebihan. Rumah-rumah bertumpuk di lereng bukit, diselimuti awan setiap pagi — persis seperti foto-foto di Nepal. Homestay-nya bersih dan penduduknya sangat ramah!"',
            testi_q3: '"Saya sudah keliling berbagai desa wisata di Jawa Tengah, dan Dusun Butuh adalah yang paling mengesankan. Udaranya segar, pemandangannya spektakuler, dan kopi lokalnya luar biasa nikmat."',
            testi_name1: 'Rina Kusuma',
            testi_from1: 'Yogyakarta',
            testi_name2: 'Bima Arfan',
            testi_from2: 'Jakarta',
            testi_name3: 'Dewi Santoso',
            testi_from3: 'Semarang',

            // Impact & CTA
            stat_spot: 'Spot Ikonik',
            stat_homestay: 'Homestay',
            stat_elevation: 'Elevasi',
            stat_pollution: 'Polusi',
            cta_title: 'Siap Merasakan Petualangan Cinematic Anda?',
            cta_desc: 'Rencanakan kunjungan Anda sekarang dan abadikan momen tak terlupakan di atas awan lereng Gunung Sumbing.',
            cta_button: 'Rencanakan Perjalanan',
            cta_wa: 'Chat WhatsApp',

            // Footer
            footer_desc: 'Menikmati pesona eksotis Dusun Butuh, lereng Gunung Sumbing. Harmoni alam dan budaya di satu tempat.',
            footer_title_links: 'Tautan Cepat',
            footer_title_contact: 'Kontak & Lokasi',
            footer_address: 'Dusun Butuh, Kaliangkrik, Magelang, Jawa Tengah 56153',
            footer_hours_title: 'Jam Kunjungan',
            footer_hours_text: 'Setiap hari, 05.00 – 18.00 WIB',
            footer_copyright: '© 2026 Desa Wisata Nepal van Java. Hak Cipta Dilindungi.',
            footer_credits: 'Dusun Butuh Pariwisata & Pertanian',
        },
        en: {
            // Navbar
            nav_home: 'Home',
            nav_profil: 'Profile',
            nav_destinasi: 'Destinations',
            nav_kuliner: 'Cuisine',
            nav_homestay: 'Homestay',
            nav_galeri: 'Gallery',
            nav_kontak: 'Contact',

            // Hero Section
            hero_tagline: 'Tourism Village • Magelang, Central Java',
            hero_title: 'A Hidden Paradise on Sumbing\'s Slopes',
            hero_subtitle: 'Experience the grandeur of mountain panoramas, seas of clouds, and iconic stacked settlements dubbed "Nepal van Java".',
            hero_cta_primary: 'Explore Destinations',
            hero_cta_ghost: 'Plan My Trip',
            scroll_text: 'Scroll',

            // Highlights Strip
            hl_title1: '1,620 masl',
            hl_desc1: 'Highest settlement on the slopes of Mount Sumbing',
            hl_title2: 'Magical Sunrise',
            hl_desc2: 'An unrivaled sea of clouds every morning',
            hl_title3: '100+ Homestays',
            hl_desc3: 'Comfortable lodging amid mountain panoramas',
            hl_title4: 'Easy Access',
            hl_desc4: 'Only 2 hours from Yogyakarta and Semarang',

            // Sticky Story Section
            story_tagline: 'BUTUH HAMLET',
            story_title: 'Touching the Clouds at 1,620 masl',
            story_p1: 'Butuh Hamlet is the highest settlement on the slopes of Mount Sumbing, Kaliangkrik, Magelang. Spread beautifully at an elevation of 1,620 meters above sea level, this hamlet offers a magical view of residential houses stacked neatly on the hillside, resembling the exotic architecture of Nepal.',
            story_p2: 'Every morning, light mist and a sea of clouds slowly drift over the residents\' roofs, creating an extraordinary sensation as if you are standing above the clouds. The clean, crisp mountain air blends harmoniously with the warm smiles of the local residents who welcome your every step.',
            story_p3: 'More than just a tourist destination, this place is a perfect escape from the hustle and bustle of city life. Here, you can reconnect with nature, enjoy the lush terraced vegetable fields, breathe in the aroma of Kaliangkrik\'s signature Arabica coffee, and find true peace.',

            // Floating Bento Destinations
            bento_tagline: 'EXPLORATION',
            bento_title: 'Explore the Village Corners',
            bento_dest1_title: 'Sumbing Sunrise Point',
            bento_dest1_desc: 'Witness the magical sunrise over the sea of clouds.',
            bento_dest2_title: 'Sumbing Valley',
            bento_dest2_desc: 'Beautiful lush terraced vegetable plantations that soothe the eyes.',
            bento_dest3_title: 'Nepal Terrace',
            bento_dest3_desc: 'The best vantage point to enjoy the stacked house landscape of Dusun Butuh.',
            dest_link: 'View Details →',
            bento_see_all: 'See All Destinations →',
            bento_cat_viewpoint: 'Viewpoint',
            bento_cat_nature: 'Nature',
            bento_cat_iconic: 'Iconic',
            story_cta: 'Read More →',

            // Testimonials
            testi_tagline: 'VISITOR STORIES',
            testi_title: 'Words from Those Who Experienced It',
            testi_q1: '"The morning view here is truly beyond words. The mist enveloping the village during sunrise was the most magical experience we\'ve ever had on our travels in Indonesia."',
            testi_q2: '"Nepal van Java is definitely not an exaggeration. Houses stacked on the hillside, covered in clouds every morning — just like photos of Nepal. The homestays are clean and the locals are incredibly friendly!"',
            testi_q3: '"I\'ve visited many tourism villages in Central Java, and Dusun Butuh is the most impressive. The air is fresh, the views are spectacular, and the local coffee is extraordinarily delicious."',
            testi_name1: 'Rina Kusuma',
            testi_from1: 'Yogyakarta',
            testi_name2: 'Bima Arfan',
            testi_from2: 'Jakarta',
            testi_name3: 'Dewi Santoso',
            testi_from3: 'Semarang',

            // Impact & CTA
            stat_spot: 'Iconic Spots',
            stat_homestay: 'Homestays',
            stat_elevation: 'Elevation',
            stat_pollution: 'Pollution',
            cta_title: 'Ready to Experience Your Cinematic Adventure?',
            cta_desc: 'Plan your visit now and capture unforgettable moments above the clouds on the slopes of Mount Sumbing.',
            cta_button: 'Plan Your Journey',
            cta_wa: 'Chat on WhatsApp',

            // Footer
            footer_desc: 'Enjoy the exotic charm of Dusun Butuh on the slopes of Mount Sumbing. A harmony of nature and culture in one place.',
            footer_title_links: 'Quick Links',
            footer_title_contact: 'Contact & Location',
            footer_address: 'Dusun Butuh, Kaliangkrik, Magelang, Central Java 56153',
            footer_hours_title: 'Visiting Hours',
            footer_hours_text: 'Every day, 05:00 – 18:00 WIB',
            footer_copyright: '© 2026 Nepal van Java Tourism Village. All Rights Reserved.',
            footer_credits: 'Dusun Butuh Tourism & Agriculture',
        }
    };

    let currentLang = 'id'; // Default bahasa Indonesia

    /**
     * Fungsi untuk menerapkan terjemahan ke semua elemen dengan data-lang-key
     * @param {string} lang - Kode bahasa ('id' atau 'en')
     */
    function applyTranslation(lang) {
        const dict = translations[lang];
        if (!dict) return;

        // Temukan semua elemen dengan atribut data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (dict[key] !== undefined) {
                if (el.classList.contains('rolling-link')) {
                    const text = dict[key];
                    el.innerHTML = `
                        <span class="rolling-text-wrap">
                            <span class="rolling-text-front">${text}</span>
                            <span class="rolling-text-back">${text}</span>
                        </span>
                    `;
                } else {
                    el.textContent = dict[key];
                }
            }
        });

        // Update atribut lang pada <html>
        document.documentElement.lang = lang;

        // Update visual tombol aktif
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeBtn = document.getElementById(`lang-${lang}`);
        if (activeBtn) activeBtn.classList.add('active');

        currentLang = lang;
    }

    // Event listener untuk tombol bahasa
    const btnEn = document.getElementById('lang-en');
    const btnId = document.getElementById('lang-id');

    if (btnEn) {
        btnEn.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentLang !== 'en') applyTranslation('en');
        });
    }

    if (btnId) {
        btnId.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentLang !== 'id') applyTranslation('id');
        });
    }

    // Inisialisasi default (bahasa Indonesia)
    applyTranslation('id');

    /* ============================================================
       4. HERO PARALLAX SCROLL EFFECT
       ============================================================ */
    const heroContent = document.querySelector('.cinematic-hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            // Fade out
            const opacity = Math.max(0, 1 - (scrolled / 500));
            // Scale down slightly
            const scale = Math.max(0.95, 1 - (scrolled / 2000));
            // Move down slightly for parallax effect
            const translateY = scrolled * 0.4;
            
            heroContent.style.opacity = opacity;
            heroContent.style.transform = `translateY(${translateY}px) scale(${scale})`;
            
            if (opacity === 0) {
                heroContent.style.pointerEvents = 'none';
            } else {
                heroContent.style.pointerEvents = 'auto';
            }

            // Fade scroll indicator faster
            if (scrollIndicator) {
                const indicatorOpacity = Math.max(0, 1 - (scrolled / 200));
                scrollIndicator.style.opacity = indicatorOpacity;
            }
        }, { passive: true });
    }
    /* ============================================================
       5. SCROLL ANIMATION (FADE IN UP)
       ============================================================ */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target); // Hanya animasi sekali
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });
});
