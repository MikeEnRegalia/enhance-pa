import SwiftUI
#if os(macOS)
import SafariServices
#endif

/// The app's one screen: what the extension does, and how to turn it on in Safari. The extension does
/// all its work in Safari; nothing here talks to it.
struct ContentView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image("Logo")
                    .resizable()
                    .frame(width: 96, height: 96)
                    .accessibilityHidden(true)

                Text("Enhance ProgArchives Forum")
                    .font(.title2.bold())
                    .multilineTextAlignment(.center)

                Text("A dark mode and a more readable style for the ProgArchives.com forum, in Safari.")
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                SetupSteps()

                Text("Unofficial: not made by or affiliated with ProgArchives. No account, and no data collected.")
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
            }
            .padding(24)
            .frame(maxWidth: 480)
            .frame(maxWidth: .infinity)
        }
        #if os(macOS)
        .frame(width: 480, height: 520)
        #endif
    }
}

#if os(iOS)
/// On iPhone and iPad an app cannot open Safari's settings, so it says where they are.
private struct SetupSteps: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Turn it on").font(.headline)
            Step(number: 1, text: "Open the Settings app, then Apps › Safari › Extensions (on iOS 17 and earlier, Safari › Extensions).")
            Step(number: 2, text: "Tap Enhance ProgArchives Forum and turn it on.")
            Step(number: 3, text: "Under Permissions, allow it on www.progarchives.com.")
            Step(number: 4, text: "Open the forum in Safari. The theme follows your phone's setting; the Theme link beside the forum's links at the top switches between Auto, Dark and Light.")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
    }
}
#endif

#if os(macOS)
/// On the Mac the app can tell whether Safari has the extension on, and open Safari's settings at it.
private struct SetupSteps: View {
    private let extensionID = Bundle.main.object(forInfoDictionaryKey: "ExtensionBundleIdentifier") as? String ?? ""
    @State private var enabled: Bool?
    @State private var problem: String?

    var body: some View {
        VStack(spacing: 12) {
            switch enabled {
            case true?:
                Label("The extension is on in Safari.", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                Text("Open the forum in Safari. If Safari asks, allow the extension on www.progarchives.com.")
                    .multilineTextAlignment(.center)
            case false?:
                Label("The extension is off in Safari.", systemImage: "exclamationmark.circle")
                Text("Turn it on in Safari's settings, under Extensions, and allow it on www.progarchives.com.")
                    .multilineTextAlignment(.center)
            case nil:
                Text("Turn it on in Safari's settings, under Extensions.")
                    .multilineTextAlignment(.center)
            }
            Button("Open Safari Settings…", action: openSafariSettings)
                .buttonStyle(.borderedProminent)
            if let problem {
                Text(problem).font(.footnote).foregroundStyle(.red)
            }
        }
        .onAppear(perform: refresh)
        // coming back from Safari's settings: show what was changed there
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in refresh() }
    }

    private func refresh() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionID) { state, _ in
            DispatchQueue.main.async { enabled = state?.isEnabled }
        }
    }

    private func openSafariSettings() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionID) { error in
            DispatchQueue.main.async {
                if let error {
                    problem = "Could not open Safari's settings: \(error.localizedDescription)"
                } else {
                    NSApplication.shared.terminate(nil)
                }
            }
        }
    }
}
#endif

private struct Step: View {
    let number: Int
    let text: String

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 10) {
            Text("\(number)")
                .font(.subheadline.bold())
                .frame(width: 22, height: 22)
                .background(Circle().fill(Color.accentColor.opacity(0.2)))
            Text(text)
        }
    }
}
