# Store listing: Enhance ProgArchives Forum

What to paste into the Chrome Web Store dashboard and the addons.mozilla.org Developer Hub, field by field.
The screenshots are in `screenshots/`, all 1280×800, in the order to upload them. The thread in them is made
up, shown on the forum's own stylesheet.

## Both stores

**Name:** Enhance ProgArchives Forum

**Summary** (Chrome's 132-character limit, AMO's 250):

> A dark mode and a more readable style for the ProgArchives.com forum. Unofficial, not affiliated with ProgArchives.

**Description:**

> Enhance ProgArchives Forum gives the ProgArchives.com forum a dark mode and a more readable style.
>
> **Dark, light or automatic.** The theme follows your system setting, or you choose: the Theme link in the
> forum's own menu bar goes round Auto, Dark and Light, and remembers your choice. The dark page never flashes
> white while it loads.
>
> **Members' colours stay readable.** Text a member coloured too dark to read on a dark background is
> lightened, keeping its hue, and put back when you switch to light.
>
> **Easier to read in any theme.** Slightly larger text with more line spacing, no more tall empty boxes
> around one-line posts, and images, long words and quotes kept inside the post.
>
> **On your phone too.** The forum's pages for phones get the same dark theme, with the switch beside the links
> at the top.
>
> No account, no permissions, no data collected: the extension runs only on the forum's pages and sends
> nothing anywhere.
>
> Enhance ProgArchives Forum is not made by or affiliated with ProgArchives.

**Category:** Chrome: *Make Chrome Yours › Functionality & UI*. AMO: *Appearance*, plus *Social &
Communication* if it allows a second.

**Homepage:** https://github.com/MikeEnRegalia/enhance-pa

**Support email:** the one the developer account is registered with.

## Chrome Web Store: the Privacy tab

**Single purpose:**

> A dark mode and a more readable style for the ProgArchives.com forum.

**Permission justifications:** the extension asks for no permissions. Its one host access is the content
script's:

- *Host permission, `https://www.progarchives.com/forum/*`* (the content script): Restyles the forum's pages
  and adds the theme switch to them. It runs on no other site, and on no ProgArchives page outside the forum.

**Remote code:** No, I am not using remote code.

**Data usage:** tick nothing: it collects no user data. Then tick all three certifications. With no data
collected, no privacy policy is needed.

## Notes for the reviewers

Chrome calls this *Test instructions*, AMO *Notes to Reviewer*.

> No account is needed. Open any forum thread, for example
> https://www.progarchives.com/forum/forum_posts.asp?TID=137744. The theme follows the system setting, and the
> "Theme: Auto" link at the right of the forum's top menu bar cycles through Auto, Dark and Light. The choice
> is kept in the forum's own localStorage. On a phone, the forum serves a different page, and the switch sits
> beside the links at the top.
>
> The one script is shipped as written: nothing is minified, bundled or loaded from elsewhere.
> The source is at https://github.com/MikeEnRegalia/enhance-pa, under the Apache License 2.0.
