// ==UserScript==
// @name         Enhance ProgArchives Forum
// @description  A dark mode and a more readable style for the ProgArchives.com forum
// @version      1.0
// @match        https://www.progarchives.com/forum/*
// @run-at       document-start
// ==/UserScript==

// This file is both the extension's content script (see ../manifest.json) and a userscript for browsers
// without extension support -- keep @version/@match in sync with the manifest.
//
// The forum is Web Wiz Forums 11 with ProgArchives' "mac-prog" theme -- Web Wiz's stock stylesheet. Every
// colour here is set with !important, which wins over the theme's rules and over the inline styles and
// attributes the pages carry. The markup it relies on:
//
//  * .tableBorder -- a table with cellspacing="1" whose own background shows through as the grid lines
//  * tr.tableStatusBar, tr.tableLedger -- the navigation bars and a table's header row
//  * td.msgOddTableSide / msgEvenTableSide, msgOddTableTop / msgEvenTableTop, tr.msgOddTableRow /
//    msgEvenTableRow -- a post's author column, its header and its body rows
//  * div.msgBody, div.msgSignature, td.BBquote -- a post, a signature and a quote in a post
//  * .dropDownMenu and friends -- the menus that open from a member's name and "Post Options"
//
// Phones get another page (Web Wiz's mobile view, an XHTML Mobile document on mobile_default_style.css):
// one column, each post a .msgOddTableTop/.msgEvenTableTop header row -- name, date, Quote and Reply -- over
// its .msgBody row, and the navigation in one plain cell of links. The same class names colour it, so the
// dark theme holds; only the toggle needs another home there, and the classic view's text size is left out.
// It carries no viewport, and needs none: browsers take an XHTML Mobile doctype as a page made for phones
// and lay it out narrow themselves (Chromium at the device's width; WebKit, it appears, at 320px scaled up).
//
// It runs at document_start, before the page has painted, so a dark page never flashes white first. The
// stylesheet goes in straight away; the toggle and the fix-ups for colours members wrote into their posts
// wait for the page.
//
// The choice -- auto, dark or light -- lives in the forum's localStorage, where a userscript can keep it as
// well as the extension can. Auto follows the system's setting and changes with it.

(() => {
  const STORAGE_KEY = 'enhance-pa-theme'
  const CHOICES = ['auto', 'dark', 'light']
  const LABELS = { auto: 'Auto', dark: 'Dark', light: 'Light' }
  // already here: a second injection in the same world (the userscript run twice) leaves it be
  if (window.__enhancePaForumStyle) return
  window.__enhancePaForumStyle = true
  // the page's <html>, once there is one: a userscript run at document-start can come before it
  let root = null

  // The dark theme follows the forum's own stylesheet (css_styles/mac-prog (v11)/default_style.css, Web Wiz's
  // stock one): it names the classes that stylesheet colours, since nearly every one of them sets its own
  // black text and light background, and a rule on the cells alone would leave those inside them unreadable.
  const STYLE = `
    /* --- the readability tweaks, whichever the theme --- */
    /* the classic view only: the mobile one sets larger text of its own, which 14px would shrink */
    html[data-enhance-pa-theme]:not([data-enhance-pa-view=mobile]) .msgBody { font-size: 14px !important; line-height: 1.55 !important; }
    /* a word or a row of dashes longer than a phone is wide would otherwise push the post sideways */
    html[data-enhance-pa-theme] .msgBody { overflow-wrap: anywhere; }
    /* the forum caps a post's images at 750px, which is still wider than a phone */
    html[data-enhance-pa-theme] .msgBody img { max-width: 100% !important; height: auto !important; }
    /* the rows carry an inline height of 200px, which leaves a one-line post in a tall empty box */
    html[data-enhance-pa-theme] tr.msgOddTableRow, html[data-enhance-pa-theme] tr.msgEvenTableRow { height: auto !important; }
    /* border-box: the forum makes a quote 99.5% wide and puts its padding on top, which overhangs the post --
       by 9px at a phone's width, where the post cuts off the quote's right edge */
    html[data-enhance-pa-theme] .BBquote { border: 0 !important; border-left: 3px solid #b38f00 !important; padding: 6px 10px !important; box-sizing: border-box; }

    /* --- the dark theme --- */
    html[data-enhance-pa-theme=dark] {
      --pa-bg: #141417;
      --pa-row: #1b1b20;
      --pa-row-alt: #202026;
      --pa-raised: #2a2a31;
      --pa-bar: #22222a;
      --pa-ledger: #3b3552;
      --pa-line: #383842;
      --pa-text: #dddde2;
      --pa-muted: #9d9daa;
      --pa-link: #8fb4ff;
      --pa-visited: #c3a2ff;
      --pa-hover: #ff8f8f;
      --pa-accent: #ffcc33;
      color-scheme: dark;
    }
    html[data-enhance-pa-theme=dark], html[data-enhance-pa-theme=dark] body { background: var(--pa-bg) !important; color: var(--pa-text) !important; }

    /* text: every class the stylesheet sets black */
    html[data-enhance-pa-theme=dark] .text,
    html[data-enhance-pa-theme=dark] .smText,
    html[data-enhance-pa-theme=dark] a.smLink,
    html[data-enhance-pa-theme=dark] a.msgLink,
    html[data-enhance-pa-theme=dark] a.tLink,
    html[data-enhance-pa-theme=dark] .basicTable,
    html[data-enhance-pa-theme=dark] .tableRow,
    html[data-enhance-pa-theme=dark] .tableTopRow,
    html[data-enhance-pa-theme=dark] .tableBottomRow,
    html[data-enhance-pa-theme=dark] .evenTableRow,
    html[data-enhance-pa-theme=dark] .oddTableRow,
    html[data-enhance-pa-theme=dark] .hiddenTableRow,
    html[data-enhance-pa-theme=dark] .PMtableRow,
    html[data-enhance-pa-theme=dark] .PMmsgBody,
    html[data-enhance-pa-theme=dark] .msgBody,
    html[data-enhance-pa-theme=dark] .msgEvenTableRow,
    html[data-enhance-pa-theme=dark] .msgOddTableRow,
    html[data-enhance-pa-theme=dark] .msgAnswerTableRow,
    html[data-enhance-pa-theme=dark] .msgHiddenTableRow,
    html[data-enhance-pa-theme=dark] .msgOddTableSide,
    html[data-enhance-pa-theme=dark] .msgEvenTableSide,
    html[data-enhance-pa-theme=dark] .msgSignature,
    html[data-enhance-pa-theme=dark] .calDateCell,
    html[data-enhance-pa-theme=dark] .calTodayCell,
    html[data-enhance-pa-theme=dark] .BBquote,
    html[data-enhance-pa-theme=dark] .BBcode,
    html[data-enhance-pa-theme=dark] .lgText,
    html[data-enhance-pa-theme=dark] h1,
    html[data-enhance-pa-theme=dark] td,
    html[data-enhance-pa-theme=dark] th {
      color: var(--pa-text) !important;
    }
    html[data-enhance-pa-theme=dark] .smText,
    html[data-enhance-pa-theme=dark] .msgSignature,
    html[data-enhance-pa-theme=dark] .dropDownPermissions,
    html[data-enhance-pa-theme=dark] .cls_TextCopyright { color: var(--pa-muted) !important; }
    html[data-enhance-pa-theme=dark] .error, html[data-enhance-pa-theme=dark] .chatAlert { color: #ff6b6b !important; }
    html[data-enhance-pa-theme=dark] .highlight { background: #6b5a00 !important; color: #fff !important; }

    /* links */
    html[data-enhance-pa-theme=dark] a:link { color: var(--pa-link) !important; }
    html[data-enhance-pa-theme=dark] a:visited { color: var(--pa-visited) !important; }
    html[data-enhance-pa-theme=dark] a:hover, html[data-enhance-pa-theme=dark] a:visited:hover { color: var(--pa-hover) !important; }
    html[data-enhance-pa-theme=dark] .tableStatusBar a:link,
    html[data-enhance-pa-theme=dark] .tableStatusBar a:visited,
    html[data-enhance-pa-theme=dark] .msgOddTableTop a:link,
    html[data-enhance-pa-theme=dark] .msgOddTableTop a:visited,
    html[data-enhance-pa-theme=dark] .msgEvenTableTop a:link,
    html[data-enhance-pa-theme=dark] .msgEvenTableTop a:visited,
    html[data-enhance-pa-theme=dark] .postThanks,
    html[data-enhance-pa-theme=dark] .postOptions,
    html[data-enhance-pa-theme=dark] .dropDownMenu a:link,
    html[data-enhance-pa-theme=dark] .dropDownMenu a:visited,
    html[data-enhance-pa-theme=dark] .dropDownStatusBar a {
      color: var(--pa-text) !important;
    }

    /* tables: .tableBorder's own background is what shows between its cells as the grid */
    html[data-enhance-pa-theme=dark] .tableBorder { background: var(--pa-line) !important; border-color: var(--pa-line) !important; }
    html[data-enhance-pa-theme=dark] .tableBorder td { background-color: var(--pa-row); }
    html[data-enhance-pa-theme=dark] .basicTable, html[data-enhance-pa-theme=dark] .basicTable > tbody > tr > td { background: transparent !important; }
    html[data-enhance-pa-theme=dark] .tableLedger, html[data-enhance-pa-theme=dark] .tableLedger > td { background: var(--pa-ledger) !important; color: #fff !important; }
    html[data-enhance-pa-theme=dark] .tableLedger a:link, html[data-enhance-pa-theme=dark] .tableLedger a:visited, html[data-enhance-pa-theme=dark] .downDropParent { color: #fff !important; }
    html[data-enhance-pa-theme=dark] .tableLedger a:hover, html[data-enhance-pa-theme=dark] .tableLedger a:visited:hover { color: var(--pa-accent) !important; }
    html[data-enhance-pa-theme=dark] .tableSubLedger,
    html[data-enhance-pa-theme=dark] .tableSubLedger > td,
    html[data-enhance-pa-theme=dark] .tableSearchLedger,
    html[data-enhance-pa-theme=dark] .tableSearchLedger > td,
    html[data-enhance-pa-theme=dark] .tableTopRow,
    html[data-enhance-pa-theme=dark] .tableTopRow > td,
    html[data-enhance-pa-theme=dark] .tableBottomRow,
    html[data-enhance-pa-theme=dark] .tableBottomRow > td,
    html[data-enhance-pa-theme=dark] .calLedger,
    html[data-enhance-pa-theme=dark] .RTEtableTopRow,
    html[data-enhance-pa-theme=dark] .RTEtableBottomRow {
      background: var(--pa-raised) !important;
      color: var(--pa-text) !important;
    }
    html[data-enhance-pa-theme=dark] .tableSubLedger a:link,
    html[data-enhance-pa-theme=dark] .tableSubLedger a:visited,
    html[data-enhance-pa-theme=dark] .tableSearchLedger a:link,
    html[data-enhance-pa-theme=dark] .tableSearchLedger a:visited,
    html[data-enhance-pa-theme=dark] .calLedger a:link,
    html[data-enhance-pa-theme=dark] .calLedger a:visited {
      color: var(--pa-text) !important;
    }
    html[data-enhance-pa-theme=dark] .tableStatusBar, html[data-enhance-pa-theme=dark] .tableStatusBar > td { background: var(--pa-bar) !important; color: var(--pa-text) !important; }
    html[data-enhance-pa-theme=dark] .tableRow,
    html[data-enhance-pa-theme=dark] .tableRow > td,
    html[data-enhance-pa-theme=dark] .oddTableRow,
    html[data-enhance-pa-theme=dark] .oddTableRow > td,
    html[data-enhance-pa-theme=dark] .PMtableRow,
    html[data-enhance-pa-theme=dark] .PMtableRow > td,
    html[data-enhance-pa-theme=dark] .RTEtableRow,
    html[data-enhance-pa-theme=dark] .calDateCell,
    html[data-enhance-pa-theme=dark] .calEmptyDateCell,
    html[data-enhance-pa-theme=dark] .ChatTableRow {
      background-color: var(--pa-row) !important;
    }
    html[data-enhance-pa-theme=dark] .evenTableRow, html[data-enhance-pa-theme=dark] .evenTableRow > td { background-color: var(--pa-row-alt) !important; }
    html[data-enhance-pa-theme=dark] .hiddenTableRow, html[data-enhance-pa-theme=dark] .hiddenTableRow > td { background-color: #2e2a22 !important; }
    html[data-enhance-pa-theme=dark] .calTodayCell { background-color: var(--pa-row) !important; border-color: #ff6b6b !important; }
    html[data-enhance-pa-theme=dark] .errorTable { background: #3a1f1f !important; border-color: #a0522d !important; color: #ff9b9b !important; }

    /* posts */
    html[data-enhance-pa-theme=dark] .msgOddTableSide,
    html[data-enhance-pa-theme=dark] .msgOddTableTop,
    html[data-enhance-pa-theme=dark] .msgOddTableRow,
    html[data-enhance-pa-theme=dark] .msgOddTableRow > td { background: var(--pa-row) !important; }
    html[data-enhance-pa-theme=dark] .msgEvenTableSide,
    html[data-enhance-pa-theme=dark] .msgEvenTableTop,
    html[data-enhance-pa-theme=dark] .msgEvenTableRow,
    html[data-enhance-pa-theme=dark] .msgEvenTableRow > td,
    html[data-enhance-pa-theme=dark] .blogEntryTableTop,
    html[data-enhance-pa-theme=dark] .blogEntryTableRow {
      background: var(--pa-row-alt) !important;
    }
    html[data-enhance-pa-theme=dark] .msgAnswerTableTop { background: #1f2d27 !important; }
    html[data-enhance-pa-theme=dark] .msgOddTableTop, html[data-enhance-pa-theme=dark] .msgEvenTableTop { color: var(--pa-muted) !important; }
    html[data-enhance-pa-theme=dark] .msgSideProfile { color: var(--pa-accent) !important; }
    html[data-enhance-pa-theme=dark] .msgLineDevider { border-color: var(--pa-line) !important; }
    html[data-enhance-pa-theme=dark] .postSeparatorTableRow, html[data-enhance-pa-theme=dark] .postSeparatorTableRow > td { background: var(--pa-bg) !important; }
    html[data-enhance-pa-theme=dark] .avatar, html[data-enhance-pa-theme=dark] #avatar { border-color: var(--pa-line) !important; }
    html[data-enhance-pa-theme=dark] hr { background-color: var(--pa-line) !important; }
    /* .msgBody in front: the rule for members' own tables below would otherwise clear a quote too */
    html[data-enhance-pa-theme=dark] .msgBody .BBquote, html[data-enhance-pa-theme=dark] .BBquote, html[data-enhance-pa-theme=dark] .msgBody .BBcode, html[data-enhance-pa-theme=dark] .BBcode {
      background: var(--pa-raised) !important;
      border-color: #555 !important;
    }
    /* what members wrote into their posts: white tables, coloured backgrounds */
    html[data-enhance-pa-theme=dark] .msgBody [bgcolor], html[data-enhance-pa-theme=dark] .msgBody table, html[data-enhance-pa-theme=dark] .msgBody td:not(.BBquote):not(.BBcode) {
      background-color: transparent !important;
    }
    html[data-enhance-pa-theme=dark] .msgBody [style*="background"] { background-color: var(--pa-raised) !important; }

    /* menus */
    html[data-enhance-pa-theme=dark] .dropDownMenu,
    html[data-enhance-pa-theme=dark] .dropDownStatusBar,
    html[data-enhance-pa-theme=dark] .dropDownPermissions,
    html[data-enhance-pa-theme=dark] .dropDownTopicShare,
    html[data-enhance-pa-theme=dark] .dropDownSearch,
    html[data-enhance-pa-theme=dark] .dropDownTopicSearch,
    html[data-enhance-pa-theme=dark] .dropDownTopicRating,
    html[data-enhance-pa-theme=dark] .dropDownCalendar {
      background: var(--pa-raised) !important;
      border-color: var(--pa-line) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, .5) !important;
    }
    html[data-enhance-pa-theme=dark] .dropDownMenu a:hover, html[data-enhance-pa-theme=dark] .dropDownMenu a:visited:hover, html[data-enhance-pa-theme=dark] .dropDownStatusBar a:hover {
      background: var(--pa-ledger) !important;
      color: #fff !important;
    }

    /* buttons, page links and forms -- the stock buttons are sprites drawn for a light page */
    html[data-enhance-pa-theme=dark] .pageLink,
    html[data-enhance-pa-theme=dark] a.pageLink:link,
    html[data-enhance-pa-theme=dark] a.pageLink:visited,
    html[data-enhance-pa-theme=dark] a.smPageLink:link,
    html[data-enhance-pa-theme=dark] a.smPageLink:visited {
      background: var(--pa-raised) !important;
      border-color: var(--pa-line) !important;
      color: var(--pa-text) !important;
    }
    html[data-enhance-pa-theme=dark] .pageLink { background: var(--pa-ledger) !important; color: #fff !important; }
    html[data-enhance-pa-theme=dark] a.pageLink:hover, html[data-enhance-pa-theme=dark] a.smPageLink:hover { background: var(--pa-ledger) !important; color: #fff !important; }
    html[data-enhance-pa-theme=dark] .largeButton,
    html[data-enhance-pa-theme=dark] a.largeButton:link,
    html[data-enhance-pa-theme=dark] a.largeButton:visited,
    html[data-enhance-pa-theme=dark] a.tabButton:link,
    html[data-enhance-pa-theme=dark] a.tabButton:visited,
    html[data-enhance-pa-theme=dark] a.tabButtonActive:link,
    html[data-enhance-pa-theme=dark] a.tabButtonActive:visited {
      background: var(--pa-raised) !important;
      color: var(--pa-text) !important;
      border: 1px solid var(--pa-line) !important;
      border-radius: 3px;
      text-align: center;
      box-sizing: content-box;
    }
    html[data-enhance-pa-theme=dark] a.tabButtonActive:link, html[data-enhance-pa-theme=dark] a.tabButtonActive:visited { background: var(--pa-ledger) !important; color: #fff !important; }
    html[data-enhance-pa-theme=dark] .largeButton:hover, html[data-enhance-pa-theme=dark] a.largeButton:hover, html[data-enhance-pa-theme=dark] a.tabButton:hover { color: var(--pa-hover) !important; }
    html[data-enhance-pa-theme=dark] .tabTable { border-color: var(--pa-line) !important; }
    html[data-enhance-pa-theme=dark] input[type=text],
    html[data-enhance-pa-theme=dark] input[type=password],
    html[data-enhance-pa-theme=dark] input[type=search],
    html[data-enhance-pa-theme=dark] input:not([type]),
    html[data-enhance-pa-theme=dark] textarea,
    html[data-enhance-pa-theme=dark] select,
    html[data-enhance-pa-theme=dark] .WebWizRTEtextarea,
    html[data-enhance-pa-theme=dark] .RTEtextarea {
      background: var(--pa-row-alt) !important;
      color: var(--pa-text) !important;
      border: 1px solid var(--pa-line) !important;
    }
    html[data-enhance-pa-theme=dark] input[type=submit],
    html[data-enhance-pa-theme=dark] input[type=button],
    html[data-enhance-pa-theme=dark] input[type=reset],
    html[data-enhance-pa-theme=dark] button {
      background: var(--pa-raised) !important;
      color: var(--pa-text) !important;
      border: 1px solid var(--pa-line) !important;
      border-radius: 3px;
    }
    html[data-enhance-pa-theme=dark] .RTEtoolbar, html[data-enhance-pa-theme=dark] .WebWizRTEbuttonOver { background-color: var(--pa-raised) !important; }
    html[data-enhance-pa-theme=dark] .RTEmouseOver { background-color: var(--pa-ledger) !important; color: #fff !important; }

    /* the logo is a gif drawn for white, so it keeps a light plate of its own */
    html[data-enhance-pa-theme=dark] #logo { background: #fff; border-radius: 4px; padding: 4px; }

    /* the toggle, in the status bar */
    #enhance-pa-theme-toggle { cursor: pointer; white-space: nowrap; }
  `

  function readChoice() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return CHOICES.includes(stored) ? stored : 'auto'
    } catch {
      return 'auto'
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, choice)
    } catch {
      // private window or blocked storage: the choice lasts for this page only
    }
  }

  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')

  const themeOf = choice => choice === 'auto' ? (systemDark?.matches ? 'dark' : 'light') : choice

  // --- colours members wrote into their posts ---

  const parseRgb = value => {
    const match = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(value ?? '')
    return match ? match.slice(1, 4).map(Number) : null
  }

  // WCAG relative luminance, 0 (black) to 1 (white)
  const luminance = ([r, g, b]) => {
    const channel = c => {
      const s = c / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  /** [rgb] lifted to a lightness that reads on the dark background, keeping its hue. */
  function lighten([r, g, b]) {
    const [rf, gf, bf] = [r / 255, g / 255, b / 255]
    const max = Math.max(rf, gf, bf)
    const min = Math.min(rf, gf, bf)
    const l = (max + min) / 2
    const d = max - min
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
    let h = 0
    if (d !== 0) {
      if (max === rf) h = ((gf - bf) / d) % 6
      else if (max === gf) h = (bf - rf) / d + 2
      else h = (rf - gf) / d + 4
    }
    h = (h * 60 + 360) % 360
    return `hsl(${Math.round(h)}, ${Math.round(Math.min(s, 0.85) * 100)}%, ${Math.round(Math.max(l, 0.72) * 100)}%)`
  }

  const COLOURED = '.msgBody [color], .msgBody [style*="color"], .msgSignature [color], .msgSignature [style*="color"]'

  /**
   * On dark, lifts text a member coloured too dark to read -- navy, black, dark red -- and marks it so it
   * can be put back; on light, puts back what was lifted.
   */
  function fixMemberColours(theme) {
    for (const element of document.querySelectorAll(COLOURED)) {
      if (element.hasAttribute('data-enhance-pa-colour')) {
        element.style.removeProperty('color')
        const original = element.getAttribute('data-enhance-pa-colour')
        if (original) element.style.setProperty('color', original)
        element.removeAttribute('data-enhance-pa-colour')
      }
      if (theme !== 'dark') continue
      const rgb = parseRgb(getComputedStyle(element).color)
      if (rgb == null || luminance(rgb) >= 0.18) continue
      element.setAttribute('data-enhance-pa-colour', element.style.getPropertyValue('color'))
      element.style.setProperty('color', lighten(rgb), 'important')
    }
  }

  // --- applying it ---

  let choice = readChoice()
  let pageReady = false

  function apply() {
    const theme = themeOf(choice)
    root.setAttribute('data-enhance-pa-theme', theme)
    root.setAttribute('data-enhance-pa-choice', choice)
    if (!pageReady) return
    fixMemberColours(theme)
    const toggle = document.getElementById('enhance-pa-theme-toggle')
    if (toggle) {
      toggle.textContent = `${theme === 'dark' ? '☾' : '☀'} Theme: ${LABELS[choice]}`
      toggle.title = 'Click to switch between following the system, dark and light'
    }
  }

  /**
   * Where the toggle goes: the classic view's status bar, beside FAQ and Memberlist; or the mobile view's
   * navigation, which is a single cell of links (Forum Home ... Logout) with no status bar at all.
   */
  function toggleHost() {
    if (isMobileView()) {
      return document.querySelector('table.tableBorder td a[href^="default.asp"]')?.closest('td') ?? null
    }
    return document.querySelector('tr.tableStatusBar td div[style*="float:right"], tr.tableStatusBar td div[style*="float: right"]')
  }

  function addToggle() {
    // the forum's iframes (the quick search) follow the page and get no toggle of their own
    if (window.top !== window.self) return
    const bar = toggleHost()
    if (bar == null) return
    const toggle = document.createElement('a')
    toggle.id = 'enhance-pa-theme-toggle'
    toggle.href = '#'
    toggle.addEventListener('click', event => {
      event.preventDefault()
      choice = CHOICES[(CHOICES.indexOf(choice) + 1) % CHOICES.length]
      saveChoice(choice)
      apply()
    })
    bar.append('  ', toggle)
  }

  /**
   * Whether this is the view the forum serves to phones (Web Wiz's mobile view): an XHTML Mobile page on a
   * stylesheet of its own, one column of posts under a header each, and navigation in a single cell.
   */
  function isMobileView() {
    return /XHTML Mobile/i.test(document.doctype?.publicId ?? '')
      || document.querySelector('link[href*="mobile_default_style"]') != null
  }

  function start() {
    // Another copy already styling the page -- this extension beside the userscript, or beside AwesomeProg's
    // members' extension, which carries the same script: each runs in a world of its own, where the window
    // flag above cannot see the other, but the page's DOM they share. The first to start keeps the page.
    if (document.getElementById('enhance-pa-forum-style') != null) return
    root = document.documentElement
    // the doctype is there from the first moment, so the mobile view is known before the page paints
    root.setAttribute('data-enhance-pa-view', isMobileView() ? 'mobile' : 'classic')
    const style = document.createElement('style')
    style.id = 'enhance-pa-forum-style'
    style.textContent = STYLE
    ;(document.head ?? root).appendChild(style)
    apply()

    systemDark?.addEventListener?.('change', () => { if (choice === 'auto') apply() })
    // another tab switching the theme switches this one too
    window.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY) return
      choice = readChoice()
      apply()
    })

    const onReady = () => {
      pageReady = true
      // the stylesheet link, the other sign of the mobile view, is only certain to be there by now
      root.setAttribute('data-enhance-pa-view', isMobileView() ? 'mobile' : 'classic')
      addToggle()
      apply()
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady)
    else onReady()
  }

  if (document.documentElement != null) start()
  else {
    new MutationObserver((_, observer) => {
      if (document.documentElement == null) return
      observer.disconnect()
      start()
    }).observe(document, { childList: true })
  }
})()
