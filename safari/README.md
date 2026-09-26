# Enhance ProgArchives Forum for Safari

Safari takes web extensions only inside an app. This directory is that app, for iPhone, iPad and Mac: a single
screen telling people how to turn the extension on, and the extension itself. The extension is not copied in.
Both extension targets bundle the repository's own `manifest.json`, `scripts/` and `icons/`, so Safari runs
exactly what Chrome and Firefox run.

| | |
| --- | --- |
| `project.yml` | The [XcodeGen](https://github.com/yonaskolb/XcodeGen) spec: an app and its extension for iOS, and the same for macOS. |
| `App/` | The app: `EnhanceProgArchivesForumApp.swift`, `ContentView.swift` (the setup steps; on the Mac it also shows whether the extension is on, and opens Safari's settings at it), the icons in `Assets.xcassets`. |
| `Extension/` | The extension bundle's `Info.plist` and the native handler Safari requires, which has nothing to do. |
| `AppStore/` | The listing text for App Store Connect (`listing.md`) and the screenshots, at the sizes it asks for. |

The iOS and macOS apps share one bundle identifier, `com.mikeenregalia.enhance-pa-forum` (the extension is
`….extension`). That makes them one App Store product with one listing, bought once for both ("universal
purchase").

## Building

You need Xcode 16 or newer and XcodeGen (`brew install xcodegen`).

```sh
cd safari
xcodegen generate
open EnhanceProgArchivesForum.xcodeproj
```

The Xcode project is generated, and ignored by git; change `project.yml` and generate it again.

- **Mac:** run the *App-macOS* scheme. The app opens, says whether the extension is on, and *Open Safari
  Settings…* takes you to it. Turn it on, then open a forum thread in Safari and allow the extension on
  www.progarchives.com when Safari asks. If Safari does not list a development build, turn on *Show features
  for web developers* in Safari's *Advanced* settings, then *Develop › Allow Unsigned Extensions* (Safari
  forgets that each time it quits).
- **iPhone or iPad:** run the *App-iOS* scheme on a device or a simulator, then turn the extension on in
  Settings › Apps › Safari › Extensions (Settings › Safari › Extensions before iOS 18), allow it on
  www.progarchives.com, and open the forum in Safari.

## Publishing on the App Store

Once:

1. In [App Store Connect](https://appstoreconnect.apple.com), *Apps* › *+* › *New App*. Tick **both iOS and
   macOS**, so both platforms share the one record. Name: *Enhance ProgArchives Forum*, bundle ID
   `com.mikeenregalia.enhance-pa-forum`, SKU e.g. `enhance-pa-forum`. If the bundle ID is not offered yet,
   build once in Xcode with automatic signing, which registers it, or add it under *Certificates,
   Identifiers & Profiles*.
2. Fill in the listing from `AppStore/listing.md`, for iOS and for macOS: the text, the screenshots from
   `AppStore/screenshots/`, category, age rating, price (free), and *App Privacy*: **Data Not Collected**.

For every version:

1. In Xcode, pick the *App-iOS* scheme with *Any iOS Device* as the destination, then *Product* › *Archive*,
   and in the Organizer *Distribute App* › *App Store Connect*. Do the same with *App-macOS* and *Any Mac*.
2. In App Store Connect, add the uploaded build to the iOS version and the macOS version, and submit both for
   review.

Keep `MARKETING_VERSION` in `project.yml` equal to `version` in `manifest.json`, and raise
`CURRENT_PROJECT_VERSION` for every upload; App Store Connect takes each build number once.
