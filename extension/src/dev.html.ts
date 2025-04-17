export const devLandingPage = `
<!DOCTYPE html>
<html>
    <body>
        <iframe
            id="devFrame"
            src="http://localhost:${process.env.WEBVIEW_PORT}"
            style="width: 100vw; height: 100vh; border: 0; margin: 0; padding: 0"
        >
            <p>This would be a really weird error to get.</p>
        </iframe>
    <script>
        if (typeof acquireVsCodeApi !== 'function') {
            throw new Error('acquireVsCodeApi is not defined');
        }
        
        // apparently, this can't happen inside the iframe
        const vscode = acquireVsCodeApi();

        // the webview is going to tell us when it's ready to receive messages
        let webViewIsLoaded = false
        // until then, we'll queue them up
        const messageQueue = []

        const sendMessageToWebView = (message) => {
            const iframe = document.getElementById("devFrame");
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