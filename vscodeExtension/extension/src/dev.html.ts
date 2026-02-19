export const devLandingPage = `
<!DOCTYPE html>
<html>
    <body style="margin: 0; padding: 0;">
        <div style="position: relative; width: 100vw; height: 100vh;">
            <iframe
                id="devFrame"
                src="http://localhost:${process.env.WEBVIEW_PORT}"
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; margin: 0; padding: 0"
            >
                <p>This would be a really weird error to get.</p>
            </iframe>
        </div>
        <script>

            const iframe = document.getElementById("devFrame");

            let vscode;
            try {
                vscode = acquireVsCodeApi();
            } catch (error) {
                console.error("Error acquiring VSCode API:", error);
            }

            // const notifyVscode = (message, level = "info") => {
            //     vscode.postMessage({
            //         command: "notifyVscode",
            //         body: {
            //             message: message,
            //             level: level
            //         }
            //     })
            // }

            // the webview is going to tell us when it's ready to receive messages
            let webViewIsLoaded = false
            // until then, we'll queue them up
            const messageQueue = []

            const sendMessageToWebView = (message) => {
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(
                        message,
                        "http://localhost:${process.env.WEBVIEW_PORT}"
                    );
                }
            }

            window.addEventListener("message", (event) => {
                if (event.data.origin === "extension") {

                    // this is a message from the extension to the webview
                    // we need to forward it to the iframe

                    if (!webViewIsLoaded) {
                        messageQueue.push(event.data)
                    } else {
                        sendMessageToWebView(event.data)
                    }

                } else if (event.data.origin === "webview") {

                    // this is a message from the webview to the extension
                    // we need to send it to the vscode 
                    
                    if (event.data.command === "webViewIsLoaded") {
                        webViewIsLoaded = true
                        messageQueue.forEach(sendMessageToWebView)
                        messageQueue = []
                    }

                    vscode.postMessage(event.data)
                }
            });
        </script>
    </body>
</html>`