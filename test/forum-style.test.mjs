// Tests for scripts/forum-style.user.js, the forum's dark mode, against a made-up thread with the forum's
// real markup (fixtures/forum-thread.html).
//
//   npm install && npm test

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'

const script = readFileSync(new URL('../scripts/forum-style.user.js', import.meta.url), 'utf8')
const thread = readFileSync(new URL('./fixtures/forum-thread.html', import.meta.url), 'utf8')
const mobileThread = readFileSync(new URL('./fixtures/forum-thread-mobile.html', import.meta.url), 'utf8')

/**
 * The thread with the script run on it, the system in [systemDark] and [stored] as the saved choice.
 * Answers the window, a way to flip the system setting, and the toggle's text.
 */
async function load({ systemDark = false, stored = null, html = thread } = {}) {
  const dom = new JSDOM(html, { url: 'https://www.progarchives.com/forum/forum_posts.asp?TID=1', runScripts: 'outside-only' })
  const { window } = dom
  const listeners = []
  const query = { matches: systemDark, addEventListener: (type, fn) => listeners.push(fn) }
  window.matchMedia = () => query
  if (stored != null) window.localStorage.setItem('enhance-pa-theme', stored)
  window.eval(script)
  // the script runs as the page starts loading, as at document_start, and finishes once it has
  if (window.document.readyState === 'loading') {
    await new Promise(resolve => window.document.addEventListener('DOMContentLoaded', resolve))
  }
  const root = window.document.documentElement
  return {
    window,
    document: window.document,
    theme: () => root.getAttribute('data-enhance-pa-theme'),
    toggle: () => window.document.getElementById('enhance-pa-theme-toggle'),
    setSystemDark: dark => {
      query.matches = dark
      listeners.forEach(fn => fn())
    },
  }
}

test('with no choice made the theme follows the system, and changes with it', async () => {
  assert.equal((await load({ systemDark: false })).theme(), 'light')
  const page = await load({ systemDark: true })
  assert.equal(page.theme(), 'dark')
  page.setSystemDark(false)
  assert.equal(page.theme(), 'light')
})

test('a choice made overrides the system', async () => {
  assert.equal((await load({ systemDark: true, stored: 'light' })).theme(), 'light')
  const page = await load({ systemDark: false, stored: 'dark' })
  assert.equal(page.theme(), 'dark')
  page.setSystemDark(true)
  page.setSystemDark(false)
  assert.equal(page.theme(), 'dark', 'the system changing does not move a theme chosen by hand')
})

test('the toggle sits in the status bar and goes round auto, dark and light, remembering the choice', async () => {
  const page = await load({ systemDark: false })
  const toggle = page.toggle()
  assert.ok(toggle.closest('tr.tableStatusBar'), 'in the status bar')
  assert.match(toggle.textContent, /Theme: Auto/)

  toggle.click()
  assert.equal(page.theme(), 'dark')
  assert.match(toggle.textContent, /Theme: Dark/)
  assert.equal(page.window.localStorage.getItem('enhance-pa-theme'), 'dark')

  toggle.click()
  assert.equal(page.theme(), 'light')
  toggle.click()
  assert.match(toggle.textContent, /Theme: Auto/)
  assert.equal(page.window.localStorage.getItem('enhance-pa-theme'), 'auto')
})

test('the stylesheet goes in once, even when both the extension and the userscript run', async () => {
  const page = await load()
  page.window.eval(script)
  assert.equal(page.document.querySelectorAll('#enhance-pa-forum-style').length, 1)
  assert.equal(page.document.querySelectorAll('#enhance-pa-theme-toggle').length, 1)
})

test('a copy running in a world of its own -- another extension carrying this script -- leaves the page to the first', async () => {
  const page = await load({ stored: 'dark' })
  // what an isolated world sees: the same page, but none of the first copy's globals
  delete page.window.__enhancePaForumStyle
  page.window.eval(script)
  assert.equal(page.document.querySelectorAll('#enhance-pa-forum-style').length, 1)
  assert.equal(page.document.querySelectorAll('#enhance-pa-theme-toggle').length, 1)
  page.toggle().click() // dark → light, and only the one copy answers
  assert.equal(page.theme(), 'light')
})

test('a page with no status bar -- the quick search in its iframe -- is themed without a toggle', async () => {
  const page = await load({ stored: 'dark', html: '<html><body><form><input type="text"></form></body></html>' })
  assert.equal(page.theme(), 'dark')
  assert.equal(page.toggle(), null)
  assert.ok(page.document.getElementById('enhance-pa-forum-style'))
})

test('on dark, text a member coloured too dark to read is lifted, and put back on light', async () => {
  const page = await load({ stored: 'dark' })
  const darkRed = page.document.getElementById('darkred')
  assert.equal(darkRed.getAttribute('data-enhance-pa-colour'), 'rgb(139, 0, 0)', 'marked with the colour to put back')
  const [r, g, b] = darkRed.style.getPropertyValue('color').match(/\d+/g).map(Number)
  assert.ok(r > g && r > b && Math.min(r, g, b) > 100, `still red, but light: rgb(${r}, ${g}, ${b})`)
  assert.equal(darkRed.style.getPropertyPriority('color'), 'important')

  page.toggle().click() // dark → light
  assert.equal(darkRed.hasAttribute('data-enhance-pa-colour'), false)
  assert.equal(page.window.getComputedStyle(darkRed).color, 'rgb(139, 0, 0)', 'the member\'s own colour again')
})

test('light is left exactly as the member wrote it', async () => {
  const page = await load({ stored: 'light' })
  assert.equal(page.document.querySelectorAll('[data-enhance-pa-colour]').length, 0)
})

// --- the view the forum serves to phones ---

test('the mobile view is told apart from the classic one', async () => {
  assert.equal((await load({ html: mobileThread })).document.documentElement.getAttribute('data-enhance-pa-view'), 'mobile')
  assert.equal((await load()).document.documentElement.getAttribute('data-enhance-pa-view'), 'classic')
})

test('on the mobile view the toggle joins the navigation, which has no status bar', async () => {
  const page = await load({ html: mobileThread })
  const toggle = page.toggle()
  assert.ok(toggle, 'there is a toggle')
  assert.ok(toggle.closest('td').querySelector('a[href="default.asp"]'), 'beside Forum Home and the rest')
  toggle.click()
  assert.equal(page.theme(), 'dark')
})

test('the mobile view is themed like the classic one, and keeps its own text size', async () => {
  const page = await load({ html: mobileThread, stored: 'dark' })
  assert.equal(page.theme(), 'dark')
  const darkRed = page.document.getElementById('darkred')
  const [r, g, b] = darkRed.style.getPropertyValue('color').match(/\d+/g).map(Number)
  assert.ok(r > g && r > b && Math.min(r, g, b) > 100, `dark red lifted to a light red: rgb(${r}, ${g}, ${b})`)
  const post = page.document.getElementById('post1')
  assert.notEqual(page.window.getComputedStyle(post).fontSize, '14px', 'the classic view\'s 14px is not forced on it')

  const classic = await load({ stored: 'dark' })
  assert.equal(classic.window.getComputedStyle(classic.document.getElementById('post1')).fontSize, '14px')
})

test('a quote fits inside its post, counting its padding within its width', async () => {
  const page = await load({ html: mobileThread })
  const quote = page.document.querySelector('.BBquote')
  assert.equal(page.window.getComputedStyle(quote).boxSizing, 'border-box')
})

test('no viewport is added: the mobile doctype already has browsers lay the page out for a phone', async () => {
  for (const html of [mobileThread, thread]) {
    const page = await load({ html })
    assert.equal(page.document.querySelectorAll('meta[name="viewport"]').length, 0)
  }
})
