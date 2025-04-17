
This is the code for the extension itself. The code for the embedded web app is in /webview.

## How to run this

To run this, you can open vscode debug mode with command+shift+D. Click "Run Extension" in the debug panel.

This will open another vscode window in developer mode. In the new window, open the command panel with command+P. Then, type "> Start Spec Mapper" in the command panel to launch the extension.

If you change the code in /webview, that should immediately update the extension. If you change the code in /extension, you will need to reload the debugger.

If this doesn't work
- Make sure you have up to date /.vscode/launch.json and /.vscode/tasks.json
