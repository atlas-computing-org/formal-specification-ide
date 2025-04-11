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
        const vscode = acquireVsCodeApi();

        window.addEventListener("message", (event) => {
            if (event.data.origin === "extension") {
                const iframe = document.getElementById("devFrame");
                if (iframe && iframe.contentWindow) {
                    iframe.contentWindow.postMessage(
                        event.data,
                        "http://localhost:${process.env.WEBVIEW_PORT}"
                    );
                }
            } else if (event.data.origin === "webview") {
                vscode.postMessage(event.data)
            }
        });
    </script>
    </body>
</html>`