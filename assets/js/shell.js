/* ─────────────────────────────────────────────────────────────────────────
   Portfolio shell — shared React components for nav, footer, language
   toggle and cursor dot. Loaded as type="text/babel" so JSX is supported.
   Exposes everything on `window.PortfolioShell` so each page's inline
   script can pull the components it needs without re-defining them.
   Requires: React, ReactDOM, GSAP, and the createContext/useContext hooks.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  const { useState, useEffect, useLayoutEffect, useRef, useCallback, useContext, createContext } = React;

  /* ── i18n ────────────────────────────────────────────────────────────── */
  const TRANSLATIONS = {
    en: {
      nav: { work: 'Work', about: 'About', downloadResume: 'Download resume', cta: "Let's talk" },

      heroMeta: 'Ricardo Martínez · Product Designer',
      heroTabs: { developers: 'Developers', everyone: 'For everyone', recruiters: 'Recruiters' },
      hero: {
        developers: {
          titleWords: ['Design', 'that', { em: 'speaks', color: 'var(--color-forest)' }, 'your', 'language'],
          bodyWords:  ['I', 'think', 'in', 'components,', 'write', 'in', 'tokens,', 'and',
                       'hand', 'off', 'specs', 'that', 'map', 'directly', 'to', 'your',
                       'stack.', 'Less', 'interpretation,', 'fewer', 'surprises.'],
          cta: 'See how I work',
        },
        everyone: {
          titleWords: ['I', 'design', 'products', { em: 'people', color: 'var(--color-forest)' }, 'understand.'],
          bodyWords:  ['Hey', 'there,', "I'm", 'a', 'product', 'designer', 'who', 'loves',
                       'solving', 'problems', 'and', 'creating', 'meaningful', 'products',
                       'with', 'a', 'holistic', 'approach.'],
          cta: 'View work',
        },
        recruiters: {
          titleWords: ['6', 'years', { em: 'shipping', color: 'var(--color-forest)' }, 'real', 'products'],
          bodyWords:  ['Senior', 'product', 'designer,', 'available', 'in', '2026.', 'Led',
                       'design', 'at', 'B2B', 'SaaS', 'startups,', 'built', 'systems',
                       'from', 'scratch,', 'and', 'shipped', 'products', 'used', 'daily',
                       'by', 'thousands.'],
          cta: 'Download resume',
        },
      },

      sideSectionEyebrow: 'Side projects',
      sideSectionTitle:   'Things I build in',
      sideSectionTitleEm: 'free time.',

      workMarquee:   "Things I've",
      workMarqueeEm: 'shipped',
      workCursor:    { read: 'Read', caseStudy: 'case study' },

      sideProjects: {
        storytelling: {
          meta: 'Side project', keyword: 'Crafting',
          title: 'presentations that persuade and stick',
          desc:  'Exploring how narrative structure and visual design combine to create presentations that communicate with impact.',
          cta:   'Read story',
          tags:  ['Presentations', 'Narrative Design'],
          modalTitleKeyword: 'Talk / Workshop',
          modalTitleRest:    'Effective communication',
          modalDesc: "My client ran a recurring event, four hours of back-to-back presentations several times a year. I saw potential to make it more dynamic, so I organised a session and prepared a talk for around 100 people on how to communicate with clarity through slides. One of the most out-of-my-comfort-zone things I've done — and one of the most rewarding.",
        },
        depot: {
          meta: 'Side project', keyword: 'Innovating',
          title: 'the sale of construction materials',
          desc:  'A fresh approach to an unsexy category — making it easier for professionals to find, compare, and order construction materials online.',
          cta:   'Read story',
          tags:  ['E-commerce', 'B2B'],
          modalTitleKeyword: '', modalTitleRest: '', modalDesc: '',
        },
      },

      aboutEyebrow: '§ About',
      aboutPhotoPill: 'Madrid, ES',
      aboutQuoteHtml: "I believe the best products are built by putting <em>people first</em> and carefully balancing user needs, business goals and technical realities to create experiences that are <em>useful, consistent and sustainable</em> over time.",
      aboutP1: "Driven by curiosity, I ask a lot of questions to deeply understand challenges and uncover opportunities. I hold myself to high standards and thrive where I can learn and grow alongside others.",
      aboutP2Html: "I focus on the balance between user needs, business goals and development realities — making sure the products I design are <em>consistent</em>, useful and sustainable over time.",
      aboutP3: "Outside of work I climb, run trails and learn from friends who do things very differently to me. It tends to make the work better too.",
      aboutPrinciplesTitle: 'Principles',
      principles: [
        { idx: '01', word: 'Holistic',    sub: 'People-first thinking'        },
        { idx: '02', word: 'Useful',      sub: 'Problem-led, not feature-led' },
        { idx: '03', word: 'Sustainable', sub: 'Designed to adapt'            },
        { idx: '04', word: 'Scalable',    sub: 'Built to grow'                },
      ],

      backgroundEyebrow: '§ Background',
      backgroundTitle:   'A few stops',
      backgroundTitleEm: 'along the way.',
      careerLabel:    'Career',
      educationLabel: 'Education',

      keysHint:    '← → Arrow keys · ESC to close',
      embedHint:   'Click inside · use arrows or click to advance',
      getInTouch:  'Get in touch',
      noSlides:    'No slides yet',
      loadingPdf:  'Loading PDF…',

      footer: {
        eyebrow: "§ Let's talk",
        headingHtml: 'Have something <em>complex</em> to ship?',
        sub:     "I take on a few engagements at a time. Tell me about the problem — I'll reply within a working day.",
        cta:     'Start a conversation',
        location: 'Location',
        madrid: 'Madrid, ES',
        remote: 'Open to remote',
        localTime: 'Local time',
        findMe: 'Find me',
        status: 'Status',
        available: 'Available · 2026',
        linkedin: 'LinkedIn',
        resume: 'Resume PDF',
        copyright: '© 2026 Ricardo Martínez',
        tagline: 'Designed & built with care',
      },
    },

    es: {
      nav: { work: 'Trabajo', about: 'Sobre mí', downloadResume: 'Descargar CV', cta: 'Hablemos' },

      heroMeta: 'Ricardo Martínez · Diseñador de producto',
      heroTabs: { developers: 'Desarrolladores', everyone: 'Para todos', recruiters: 'Reclutadores' },
      hero: {
        developers: {
          titleWords: ['Diseño', 'que', { em: 'habla', color: 'var(--color-forest)' }, 'tu', 'idioma'],
          bodyWords:  ['Pienso', 'en', 'componentes,', 'escribo', 'en', 'tokens', 'y',
                       'entrego', 'specs', 'que', 'mapean', 'directamente', 'a', 'tu',
                       'stack.', 'Menos', 'interpretación,', 'menos', 'sorpresas.'],
          cta: 'Cómo trabajo',
        },
        everyone: {
          titleWords: ['Diseño', 'productos', 'que', 'la', { em: 'gente', color: 'var(--color-forest)' }, 'entiende.'],
          bodyWords:  ['Hola,', 'soy', 'un', 'diseñador', 'de', 'producto', 'al', 'que',
                       'le', 'apasiona', 'resolver', 'problemas', 'y', 'crear',
                       'productos', 'con', 'sentido', 'y', 'visión', 'holística.'],
          cta: 'Ver trabajos',
        },
        recruiters: {
          titleWords: ['6', 'años', { em: 'enviando', color: 'var(--color-forest)' }, 'productos', 'reales'],
          bodyWords:  ['Diseñador', 'de', 'producto', 'senior,', 'disponible', 'en', '2026.',
                       'He', 'liderado', 'diseño', 'en', 'startups', 'B2B,', 'construido',
                       'sistemas', 'desde', 'cero,', 'y', 'lanzado', 'productos', 'usados',
                       'a', 'diario', 'por', 'miles', 'de', 'personas.'],
          cta: 'Descargar CV',
        },
      },

      sideSectionEyebrow: 'Proyectos paralelos',
      sideSectionTitle:   'Cosas que creo en',
      sideSectionTitleEm: 'mi tiempo libre.',

      workMarquee:   'Lo que he',
      workMarqueeEm: 'lanzado',
      workCursor:    { read: 'Leer', caseStudy: 'caso de estudio' },

      sideProjects: {
        storytelling: {
          meta: 'Proyecto paralelo', keyword: 'Diseñando',
          title: 'presentaciones que persuaden y se recuerdan',
          desc:  'Explorando cómo la estructura narrativa y el diseño visual se combinan para crear presentaciones que comunican con impacto.',
          cta:   'Leer historia',
          tags:  ['Presentaciones', 'Diseño narrativo'],
          modalTitleKeyword: 'Charla / Workshop',
          modalTitleRest:    'Comunicación efectiva',
          modalDesc: 'Mi cliente organizaba un evento recurrente: cuatro horas de presentaciones seguidas varias veces al año. Vi el potencial de hacerlo más dinámico, así que organicé una sesión y preparé una charla para unas 100 personas sobre cómo comunicar con claridad a través de slides. Una de las cosas más fuera de mi zona de confort que he hecho — y una de las más gratificantes.',
        },
        depot: {
          meta: 'Proyecto paralelo', keyword: 'Innovando',
          title: 'la venta de materiales de construcción',
          desc:  'Una mirada fresca a una categoría poco glamurosa — facilitando a los profesionales encontrar, comparar y pedir materiales de construcción online.',
          cta:   'Leer historia',
          tags:  ['E-commerce', 'B2B'],
          modalTitleKeyword: '', modalTitleRest: '', modalDesc: '',
        },
      },

      aboutEyebrow: '§ Sobre mí',
      aboutPhotoPill: 'Madrid, ES',
      aboutQuoteHtml: 'Creo que los mejores productos se construyen poniendo a las <em>personas primero</em> y equilibrando cuidadosamente las necesidades del usuario, los objetivos de negocio y las realidades técnicas para crear experiencias <em>útiles, coherentes y sostenibles</em> en el tiempo.',
      aboutP1: 'Movido por la curiosidad, hago muchas preguntas para entender a fondo los retos y descubrir oportunidades. Me exijo altos estándares y me crezco en entornos donde puedo aprender junto a otros.',
      aboutP2Html: 'Me enfoco en el equilibrio entre necesidades del usuario, objetivos de negocio y realidades de desarrollo — asegurándome de que los productos que diseño sean <em>coherentes</em>, útiles y sostenibles en el tiempo.',
      aboutP3: 'Fuera del trabajo escalo, corro por la montaña y aprendo de amigos que hacen cosas muy distintas a mí. Tiende a hacer mejor el trabajo también.',
      aboutPrinciplesTitle: 'Principios',
      principles: [
        { idx: '01', word: 'Holístico',  sub: 'Centrado en las personas'           },
        { idx: '02', word: 'Útil',       sub: 'Guiado por el problema, no la feature' },
        { idx: '03', word: 'Sostenible', sub: 'Diseñado para adaptarse'            },
        { idx: '04', word: 'Escalable',  sub: 'Construido para crecer'             },
      ],

      backgroundEyebrow: '§ Trayectoria',
      backgroundTitle:   'Algunas paradas',
      backgroundTitleEm: 'por el camino.',
      careerLabel:    'Carrera',
      educationLabel: 'Educación',

      keysHint:    '← → Flechas · ESC para cerrar',
      embedHint:   'Haz clic dentro · usa flechas o clic para avanzar',
      getInTouch:  'Contactar',
      noSlides:    'Aún no hay slides',
      loadingPdf:  'Cargando PDF…',

      footer: {
        eyebrow: '§ Hablemos',
        headingHtml: '¿Tienes algo <em>complejo</em> que lanzar?',
        sub:     'Acepto pocos proyectos a la vez. Cuéntame el problema — respondo en un día laborable.',
        cta:     'Empezar una conversación',
        location: 'Ubicación',
        madrid: 'Madrid, ES',
        remote: 'Abierto a remoto',
        localTime: 'Hora local',
        findMe: 'Encuéntrame',
        status: 'Estado',
        available: 'Disponible · 2026',
        linkedin: 'LinkedIn',
        resume: 'CV en PDF',
        copyright: '© 2026 Ricardo Martínez',
        tagline: 'Diseñado y construido con cariño',
      },
    },
  };

  const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

  /* LangProvider listens to a custom event so several React roots on the
     same page (e.g. nav + footer mounted separately on case-study pages)
     stay in sync when the user toggles the language.                      */
  const LANG_EVENT = 'portfolio-lang-changed';
  function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(() => {
      try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; }
    });
    useEffect(() => {
      const onChange = (e) => setLangState(e.detail);
      window.addEventListener(LANG_EVENT, onChange);
      return () => window.removeEventListener(LANG_EVENT, onChange);
    }, []);
    const setLang = useCallback((next) => {
      setLangState(next);
      try { localStorage.setItem('lang', next); } catch (e) {}
      window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: next }));
    }, []);
    return (
      <LanguageContext.Provider value={{ lang, setLang }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  function useT() {
    const { lang, setLang } = useContext(LanguageContext);
    const t = useCallback((key) => {
      const walk = (obj) => key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
      const v = walk(TRANSLATIONS[lang]);
      return v != null ? v : (walk(TRANSLATIONS.en) != null ? walk(TRANSLATIONS.en) : key);
    }, [lang]);
    return { t, lang, setLang };
  }

  /* ── Icons ───────────────────────────────────────────────────────────── */
  const ArrowRight = ({ cls = 'la-icon' }) => (
    <svg className={cls} width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  function Isologo() {
    return (
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="96" height="96" rx="24" fill="#02734A" />
        <path d="M56.1656 24C59.6261 24 62.5589 24.6172 64.9633 25.8531C67.3902 27.0666 69.1428 28.8087 70.2215 31.0783C71.3226 33.3255 71.5698 36.0109 70.9631 39.1345C70.4687 41.7861 69.3229 44.1349 67.5251 46.1798C65.7499 48.2247 63.4237 49.8309 60.5475 50.9994C59.5677 51.3929 58.5354 51.7194 57.4523 51.9831L61.0529 63.1683C61.4349 64.4267 61.8058 65.4043 62.1653 66.1009C62.5248 66.775 62.8958 67.2468 63.2777 67.5164C63.6597 67.7635 64.0754 67.8872 64.5247 67.8872C64.974 67.8872 65.3784 67.7749 65.7379 67.5503C66.1198 67.3031 66.4908 66.9321 66.8503 66.4379C66.9626 66.2806 67.1091 66.1798 67.2889 66.1348C67.4685 66.0674 67.6256 66.0561 67.7604 66.1009C67.9625 66.1683 68.0862 66.3141 68.1312 66.5385C68.1986 66.7408 68.1653 66.9776 68.0305 67.2472C67.4462 68.6403 66.4686 69.7864 65.0979 70.6852C63.7271 71.5616 62.1762 72 60.4458 72C59.5021 72 58.6594 71.7974 57.9179 71.393C57.1989 70.9885 56.5589 70.3028 55.9971 69.3366C55.4353 68.3478 54.9066 66.9994 54.4122 65.2915L50.9258 52.7799C50.8412 52.7815 50.7563 52.7846 50.6712 52.7857C48.7027 52.7857 46.9844 52.596 45.5157 52.2212L45.9484 50.6073C45.9721 50.614 45.9954 50.622 46.0191 50.6286C47.2326 50.9657 48.5477 51.134 49.9635 51.134C52.6149 51.1339 54.9069 50.6176 56.8394 49.5839C58.7945 48.5502 60.3901 47.0782 61.626 45.1681C62.8619 43.258 63.7273 41.0109 64.2217 38.4267C64.761 35.5503 64.7154 33.1683 64.0862 31.2806C63.457 29.3705 62.3672 27.9432 60.8167 26.9994C59.2661 26.0557 57.367 25.5839 55.1199 25.5839C54.0904 25.584 53.2394 25.6911 52.5669 25.9054L53.079 24H56.1656Z" fill="white" />
        <path d="M47.4646 27.7497C47.3469 27.9855 47.2436 28.2405 47.1577 28.5165C46.9105 29.5052 46.5615 30.8196 46.1121 32.4599C45.6627 34.0777 45.1577 35.9095 44.5959 37.9543C44.0566 39.9767 43.4717 42.123 42.8426 44.3926C42.3357 46.2697 41.8293 48.1549 41.3225 50.0477C41.3307 50.051 41.3395 50.0531 41.3477 50.0564L40.8985 51.6945C40.8941 51.6929 40.8893 51.6923 40.8849 51.6907C40.3494 53.7484 39.8341 55.7205 39.3368 57.6062C38.7975 59.6286 38.3144 61.4601 37.8874 63.1006C37.483 64.7185 37.1796 66.0108 36.9774 66.9771C36.8201 67.5837 36.8316 68.0555 37.0113 68.3926C37.191 68.7297 37.4944 68.9436 37.9213 69.0335L40.5838 69.4382C40.8984 69.5281 41.1352 69.6403 41.2925 69.7751C41.4496 69.9099 41.5278 70.0899 41.5278 70.3144C41.5277 70.584 41.4155 70.7971 41.1909 70.9544C40.9886 71.1117 40.6853 71.1906 40.2808 71.1906H25.0447C24.6629 71.1906 24.3935 71.123 24.2362 70.9883C24.0789 70.831 24 70.6398 24 70.4151C24.0001 70.1457 24.1011 69.9324 24.303 69.7751C24.5053 69.6178 24.7754 69.5056 25.1124 69.4382L27.5726 69.0674C28.1568 68.9775 28.618 68.775 28.9551 68.4604C29.3146 68.1233 29.5952 67.6401 29.7974 67.011C30.0671 66.0672 30.4266 64.7862 30.876 63.1683C31.3254 61.5279 31.8313 59.6736 32.3931 57.6062C32.9773 55.5389 33.5841 53.3592 34.2132 51.0672C34.8425 48.775 35.4605 46.4824 36.0673 44.1902C36.674 41.8982 37.2475 39.7185 37.7868 37.6512C38.3485 35.5839 38.8316 33.7295 39.2361 32.0891C39.663 30.4489 39.9778 29.1458 40.1801 28.1796C40.3149 27.5504 40.3035 27.0892 40.1462 26.797C40.0113 26.4826 39.6851 26.2694 39.1683 26.1571L36.5398 25.7185C36.2027 25.6286 35.9659 25.5164 35.8311 25.3816C35.6964 25.2468 35.6297 25.0783 35.6297 24.8762C35.6297 24.6065 35.7419 24.3926 35.9666 24.2353C36.1913 24.0781 36.4949 24 36.8767 24H48.4928L47.4646 27.7497Z" fill="white" />
      </svg>
    );
  }

  /* ── Language toggle ─────────────────────────────────────────────────── */
  function LangToggle() {
    const { lang, setLang } = useT();
    return (
      <div className="lang-toggle" role="group" aria-label="Language">
        <button className={`lang-toggle-btn${lang === 'es' ? ' is-active' : ''}`}
                onClick={() => setLang('es')} aria-pressed={lang === 'es'}>ES</button>
        <button className={`lang-toggle-btn${lang === 'en' ? ' is-active' : ''}`}
                onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
      </div>
    );
  }

  /* ── Nav ─────────────────────────────────────────────────────────────── */
  const NAV_ITEMS = [
    { labelKey: 'nav.work',           type: 'scroll',   target: 'work'  },
    { labelKey: 'nav.about',          type: 'scroll',   target: 'about' },
    { labelKey: 'nav.downloadResume', type: 'download', href: 'assets/Ricardo_Martinez_CV.pdf' },
  ];

  function Nav({ active = null, onNavigate = () => {}, homeHref = 'index.html' }) {
    const { t } = useT();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navRef = useRef(null), wrapRef = useRef(null), itemsRef = useRef(null), burgerRef = useRef(null);

    useLayoutEffect(() => {
      const ctx = gsap.context(() => {
        gsap.from(navRef.current, { autoAlpha: 0, y: -8, duration: 0.5, delay: 0.8, ease: 'power2.out' });
      });
      return () => ctx.revert();
    }, []);

    useEffect(() => {
      const onScroll = () => setScrolled(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
      const wrap = wrapRef.current, items = itemsRef.current, burger = burgerRef.current;
      if (!wrap || !items || !burger) return;
      const targetW = menuOpen ? items.scrollWidth : 0;
      gsap.to(wrap,   { width: targetW, duration: 0.45, ease: 'power3.inOut', overwrite: true });
      gsap.to(burger, { opacity: menuOpen ? 0 : 1, width: menuOpen ? 0 : 44,
                        duration: menuOpen ? 0.25 : 0.30, ease: 'power2.inOut', overwrite: true });
      const itemEls = items.querySelectorAll('.nav-item');
      gsap.to(itemEls, {
        opacity: menuOpen ? 1 : 0, x: menuOpen ? 0 : 10,
        duration: 0.30, ease: 'power2.out',
        stagger: menuOpen ? 0.04 : { each: 0.02, from: 'end' },
        delay: menuOpen ? 0.10 : 0, overwrite: true,
      });
    }, [menuOpen]);

    const scrollToId = (id) => {
      /* Same-page scroll if the target exists; otherwise navigate home with hash */
      const el = document.getElementById(id);
      if (el) {
        if (window.smoothScrollTo) {
          const content = document.getElementById('smooth-content');
          const offsetTop = el.getBoundingClientRect().top - (content ? content.getBoundingClientRect().top : 0);
          window.smoothScrollTo(offsetTop);
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        window.location.href = `${homeHref}#${id}`;
      }
    };

    const handleItem = (item) => {
      onNavigate(item.labelKey);
      if (item.type === 'download') return;
      scrollToId(item.target);
      setMenuOpen(false);
    };

    const goHome = (e) => {
      /* On the home page (the only one with #smooth-content) smooth-scroll to
         the top. Anywhere else, let the anchor navigate to homeHref.         */
      const onHome = !!document.getElementById('smooth-content');
      if (onHome) {
        e.preventDefault();
        scrollToId('top');
      }
    };

    return ReactDOM.createPortal(
      <nav ref={navRef} className={`nav${scrolled ? ' is-scrolled' : ''}`} aria-label="Primary">
        <a className="nav-pill nav-logo" href={homeHref} onClick={goHome}>
          <span className="nav-logo-mark"><Isologo /></span>
          <span className="nav-brand-text">Ricardo<em>Martínez</em></span>
          <span className="nav-dot" />
        </a>

        <div className="nav-pill nav-menu">
          <div className="nav-menu-trigger"
               onMouseEnter={() => setMenuOpen(true)}
               onMouseLeave={() => setMenuOpen(false)}>
            <button ref={burgerRef} className="nav-burger" aria-label="Open menu"
                    onClick={() => setMenuOpen(o => !o)}>
              <span /><span />
            </button>
            <div ref={wrapRef} className="nav-items-wrap">
              <div ref={itemsRef} className="nav-items">
                {NAV_ITEMS.map((item, i) => {
                  const cls = `nav-item${active === item.labelKey ? ' is-active' : ''}`;
                  const style = { '--i': i };
                  if (item.type === 'download') {
                    return (
                      <a key={item.labelKey} className={cls} style={style}
                         href={item.href} target="_blank" rel="noopener noreferrer"
                         onClick={() => handleItem(item)}>
                        <span>{t(item.labelKey)}</span>
                      </a>
                    );
                  }
                  return (
                    <a key={item.labelKey} className={cls} style={style}
                       href={`${document.getElementById(item.target) ? '' : homeHref}#${item.target}`}
                       onClick={e => { e.preventDefault(); handleItem(item); }}>
                      <span>{t(item.labelKey)}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
          <LangToggle />
          <a className="nav-cta" href="mailto:ricardomartinezing1@gmail.com">
            <span>{t('nav.cta')}</span>
            <span className="nav-cta-arrow"><ArrowRight /></span>
          </a>
        </div>
      </nav>,
      document.body
    );
  }

  /* ── Footer ──────────────────────────────────────────────────────────── */
  function Footer() {
    const { t } = useT();
    const [time, setTime] = useState('');
    const btnRef = useRef(null);

    useEffect(() => {
      const tick = () => setTime(
        new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }, []);

    useEffect(() => {
      const btn = btnRef.current;
      if (!btn) return;
      let xTo, yTo, cleanup = () => {};
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
        yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
        const RADIUS = 90;
        const onMove = (e) => {
          const r = btn.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dx = e.clientX - cx, dy = e.clientY - cy;
          if (Math.hypot(dx, dy) < RADIUS) { xTo(dx * 0.4); yTo(dy * 0.4); }
          else { xTo(0); yTo(0); }
        };
        const onLeave = () => { xTo(0); yTo(0); };
        window.addEventListener('mousemove', onMove);
        btn.addEventListener('mouseleave', onLeave);
        cleanup = () => {
          window.removeEventListener('mousemove', onMove);
          btn.removeEventListener('mouseleave', onLeave);
          gsap.set(btn, { x: 0, y: 0 });
        };
      });
      return () => { mm.revert(); cleanup(); };
    }, []);

    return (
      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="gf">
            <span className="t-label t-label-dark" style={{ marginBottom: 24, display: 'block' }}>{t('footer.eyebrow')}</span>
            <h2 className="t-h1 on-dark" dangerouslySetInnerHTML={{ __html: t('footer.headingHtml') }} />
            <p className="t-lead lead-dark" style={{ marginTop: 12, maxWidth: '50ch' }}>{t('footer.sub')}</p>
            <div className="footer-cta">
              <a ref={btnRef} className="btn btn-primary" href="mailto:ricardomartinezing1@gmail.com"
                 style={{ display: 'inline-flex', willChange: 'transform' }}>
                {t('footer.cta')}
              </a>
            </div>
          </div>
          <div className="footer-grid gf">
            <div>
              <span className="footer-col-label">{t('footer.location')}</span>
              <p style={{ font: '400 16px var(--font-sans)', color: 'var(--color-white)', margin: '0 0 4px' }}>{t('footer.madrid')}</p>
              <p style={{ font: '400 13px var(--font-sans)', color: 'rgba(245,245,240,.5)', margin: 0 }}>{t('footer.remote')}</p>
            </div>
            <div>
              <span className="footer-col-label">{t('footer.localTime')}</span>
              <p className="footer-clock">{time}</p>
              <p style={{ font: '400 12px var(--font-mono)', color: 'rgba(245,245,240,.4)', margin: '4px 0 0' }}>Europe/Madrid</p>
            </div>
            <div>
              <span className="footer-col-label">{t('footer.findMe')}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="https://www.linkedin.com/in/ricardo-marting/" target="_blank" rel="noopener noreferrer" className="footer-col-link">{t('footer.linkedin')} <ArrowRight /></a>
                <a href="assets/Ricardo_Martinez_CV.pdf" target="_blank" rel="noopener noreferrer" className="footer-col-link">{t('footer.resume')} <ArrowRight /></a>
              </div>
            </div>
            <div>
              <span className="footer-col-label">{t('footer.status')}</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span className="status-dot" />
                <span style={{ font: '500 15px var(--font-sans)', color: 'var(--color-white)' }}>{t('footer.available')}</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom gf">
            <span>{t('footer.copyright')}</span>
            <span>{t('footer.tagline')}</span>
          </div>
        </div>
      </footer>
    );
  }

  /* ── CursorDot ───────────────────────────────────────────────────────── */
  function CursorDot() {
    const dotRef = useRef(null);
    useLayoutEffect(() => {
      const dot = dotRef.current;
      if (!dot) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      const xTo = gsap.quickTo(dot, 'x', { duration: 0.35, ease: 'power3' });
      const yTo = gsap.quickTo(dot, 'y', { duration: 0.35, ease: 'power3' });
      const onMove = (e) => { xTo(e.clientX); yTo(e.clientY); };
      const onLeave = () => gsap.to(dot, { autoAlpha: 0, duration: 0.2 });
      const onEnter = () => gsap.to(dot, { autoAlpha: 1, duration: 0.2 });
      window.addEventListener('mousemove', onMove);
      document.addEventListener('mouseleave', onLeave);
      document.addEventListener('mouseenter', onEnter);
      return () => {
        window.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseleave', onLeave);
        document.removeEventListener('mouseenter', onEnter);
      };
    }, []);
    return ReactDOM.createPortal(
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />,
      document.body
    );
  }

  /* ── Expose ──────────────────────────────────────────────────────────── */
  window.PortfolioShell = {
    TRANSLATIONS,
    LanguageContext,
    LanguageProvider,
    useT,
    ArrowRight,
    Isologo,
    LangToggle,
    Nav,
    NAV_ITEMS,
    Footer,
    CursorDot,
  };
})();
