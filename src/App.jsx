import React, { useState, useEffect, useCallback, useMemo } from 'react';
import pagesData from './pages.json';
import aliasesData from './aliases.json';
import { updateSeo } from './seo';

const CORE_STYLES = [
  '/assets/3d882a730e-main.min.css',
  '/assets/e2fe397c88-google-fonts.css',
  '/assets/e0e87ecd47-menu-animation.min.css',
  '/assets/f5c28f7804-style.min.css',
  '/assets/aa279cd999-slick.min.css',
];

function normalizePath(rawPath) {
  if (!rawPath) return '/';
  let path = rawPath.split('?')[0].split('#')[0];
  if (!path.startsWith('/')) path = '/' + path;
  if (!path.endsWith('/') && !path.includes('.')) path = path + '/';

  if (aliasesData[path]) return aliasesData[path];
  if (aliasesData[rawPath]) return aliasesData[rawPath];
  if (pagesData[path]) return path;
  if (pagesData[rawPath]) return rawPath;

  // Trim trailing slash check
  const noSlash = path.endsWith('/') ? path.slice(0, -1) : path;
  if (pagesData[noSlash]) return noSlash;

  return path;
}

function ASTNode({ node, ctx }) {
  if (node == null) return null;
  if (typeof node === 'string') return node;

  const { tag, props = {}, children = [] } = node;

  // Clone props and normalize for React
  const cleanProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'enable-background') {
      cleanProps.enableBackground = value;
    } else if (key === 'xml:space') {
      cleanProps.xmlSpace = value;
    } else if (key === 'xmlns:xlink') {
      cleanProps.xmlnsXlink = value;
    } else if (key === 'itemid') {
      cleanProps.itemId = value;
    } else {
      cleanProps[key] = value;
    }
  }

  // Handle Mobile Popup Drawer
  if (cleanProps.id === 'ast-mobile-popup') {
    if (ctx.mobileOpen) {
      cleanProps.className = `${cleanProps.className || ''} active show`.trim();
    }
  }

  // Handle Mobile Toggle Button (hamburger)
  const isMobileMenuToggle =
    cleanProps.className &&
    (cleanProps.className.includes('main-header-menu-toggle') ||
      cleanProps.className.includes('ast-mobile-menu-trigger-outline'));
  if (tag === 'button' && isMobileMenuToggle && cleanProps.id !== 'menu-toggle-close') {
    const origClick = cleanProps.onClick;
    cleanProps.onClick = (e) => {
      if (origClick) origClick(e);
      e.preventDefault();
      ctx.setMobileOpen((prev) => !prev);
    };
  }

  // Handle Mobile Close Button and Overlay
  if (
    cleanProps.id === 'menu-toggle-close' ||
    (cleanProps.className && cleanProps.className.includes('ast-mobile-popup-overlay'))
  ) {
    const origClick = cleanProps.onClick;
    cleanProps.onClick = (e) => {
      if (origClick) origClick(e);
      e.preventDefault();
      ctx.setMobileOpen(false);
    };
  }

  // Handle Scroll to Top
  if (cleanProps.id === 'ast-scroll-top') {
    if (ctx.showScrollTop) {
      cleanProps.className = `${cleanProps.className || ''} ast-is-active`.trim();
      cleanProps.style = { ...cleanProps.style, display: 'block' };
    } else {
      cleanProps.style = { ...cleanProps.style, display: 'none' };
    }
    const origClick = cleanProps.onClick;
    cleanProps.onClick = (e) => {
      if (origClick) origClick(e);
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }

  // Handle Submenu Dropdown Toggles (especially for mobile language switcher)
  const isMenuToggle =
    (tag === 'button' && cleanProps.className?.includes('ast-menu-toggle')) ||
    (cleanProps.role === 'button' && cleanProps.className?.includes('dropdown-menu-toggle'));
  if (isMenuToggle) {
    const origClick = cleanProps.onClick;
    cleanProps.onClick = (e) => {
      if (origClick) origClick(e);
      e.preventDefault();
      e.stopPropagation();
      ctx.toggleSubmenu('pll_switcher');
    };
  }

  // Handle parent LI of expandable submenu
  if (tag === 'li' && cleanProps.className?.includes('menu-item-has-children')) {
    if (ctx.expandedSubmenus['pll_switcher']) {
      cleanProps.className = `${cleanProps.className || ''} ast-submenu-expanded`.trim();
    }
  }

  // Handle child UL sub-menu
  if (tag === 'ul' && cleanProps.className?.includes('sub-menu')) {
    if (ctx.expandedSubmenus['pll_switcher']) {
      cleanProps.style = { ...cleanProps.style, display: 'block', visibility: 'visible', opacity: 1 };
    }
  }

  // Handle Links
  if (tag === 'a' && cleanProps.href) {
    const href = cleanProps.href;
    const isLangToggle = href === '#pll_switcher';
    const isInternal = href.startsWith('/') && !href.startsWith('/assets/');

    const origClick = cleanProps.onClick;
    cleanProps.onClick = (e) => {
      if (origClick) origClick(e);
      if (isLangToggle) {
        e.preventDefault();
        ctx.toggleSubmenu('pll_switcher');
        return;
      }
      if (isInternal) {
        e.preventDefault();
        ctx.navigateTo(href);
      }
    };
  }

  const renderedChildren = children.map((child, idx) => (
    <ASTNode key={idx} node={child} ctx={ctx} />
  ));

  return React.createElement(tag, cleanProps, ...renderedChildren);
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Navigate helper
  const navigateTo = useCallback((targetPath) => {
    const resolved = normalizePath(targetPath);
    if (window.location.pathname !== resolved) {
      window.history.pushState({}, '', resolved);
    }
    setCurrentPath(resolved);
    setMobileOpen(false);
    setExpandedSubmenus({});
    window.scrollTo(0, 0);
  }, []);

  const toggleSubmenu = useCallback((key) => {
    setExpandedSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setMobileOpen(false);
      setExpandedSubmenus({});
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Responsive breakpoint handler matching Astra (921.99px)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 921.99px)');
    const updateBody = (matches) => {
      if (matches) {
        document.body.classList.add('ast-header-break-point');
        document.body.classList.remove('ast-desktop');
      } else {
        document.body.classList.remove('ast-header-break-point');
        document.body.classList.add('ast-desktop');
      }
    };
    updateBody(mq.matches);
    const handler = (e) => updateBody(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Sync mobile drawer body class
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('ast-popup-open', 'ast-mobile-popup-active');
    } else {
      document.body.classList.remove('ast-popup-open', 'ast-mobile-popup-active');
    }
  }, [mobileOpen]);

  // Retrieve current page data
  const page = pagesData[currentPath] || pagesData['/'];

  // Update document title, lang, and dynamic styles on route change
  useEffect(() => {
    if (!page) return;

    updateSeo(currentPath);
    if (page.lang) document.documentElement.lang = page.lang;

    // Synchronize body classes (preserving responsive & mobile classes)
    if (page.bodyClass) {
      const isMobile = window.innerWidth <= 921.99;
      const baseClasses = page.bodyClass.split(' ').filter(Boolean);
      document.body.className = baseClasses.join(' ');
      if (isMobile) {
        document.body.classList.add('ast-header-break-point');
      } else {
        document.body.classList.add('ast-desktop');
      }
      if (mobileOpen) {
        document.body.classList.add('ast-popup-open', 'ast-mobile-popup-active');
      }
    }

    // Dynamic styles injection: page-specific UAG link & inline CSS
    const pageLinks = page.styles.filter((s) => s.href && !CORE_STYLES.includes(s.href));
    const pageCss = page.styles.filter((s) => s.css).map((s) => s.css).join('\n');

    // Link tag
    let linkEl = document.getElementById('dynamic-page-link');
    if (pageLinks.length > 0) {
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'dynamic-page-link';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      linkEl.href = pageLinks[0].href;
    } else if (linkEl) {
      linkEl.remove();
    }

    // Inline style tag
    let styleEl = document.getElementById('dynamic-page-inline-style');
    if (pageCss) {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-page-inline-style';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = pageCss;
    } else if (styleEl) {
      styleEl.remove();
    }
  }, [currentPath, page, mobileOpen]);

  const ctx = useMemo(
    () => ({
      navigateTo,
      mobileOpen,
      setMobileOpen,
      expandedSubmenus,
      toggleSubmenu,
      showScrollTop,
    }),
    [navigateTo, mobileOpen, expandedSubmenus, toggleSubmenu, showScrollTop]
  );

  if (!page) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Page Not Found</h1>
        <p>The requested page could not be located.</p>
        <button onClick={() => navigateTo('/')}>Return to Homepage</button>
      </div>
    );
  }

  return (
    <>
      <div className="hfeed site" id="page">
        <ASTNode node={page.skip} ctx={ctx} />
        <ASTNode node={page.header} ctx={ctx} />
        <ASTNode node={page.content} ctx={ctx} />
        <ASTNode node={page.footer} ctx={ctx} />
      </div>
      <ASTNode node={page.mobile} ctx={ctx} />
      <ASTNode node={page.scrollTop} ctx={ctx} />
    </>
  );
}
