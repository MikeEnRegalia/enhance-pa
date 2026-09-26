import Foundation

// Safari requires every web extension to name a native handler, which answers the messages the extension's
// scripts send with browser.runtime.sendNativeMessage. This extension sends none -- it asks for no
// nativeMessaging permission -- so the handler answers anything that arrives with nothing.
final class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        context.completeRequest(returningItems: [], completionHandler: nil)
    }
}
