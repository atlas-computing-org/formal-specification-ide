export const devLandingPage = `
<!DOCTYPE html>
<html>
<body>
    <iframe
        id="devFrame"
        src="http://localhost:${process.env.WEBVIEW_PORT}"
        style="width: 100vw; height: 100vh; border: 0; margin: 0; padding: 0;">
        <p>This would be a really weird error to get.</p>
    </iframe>
</body>
</html>
`