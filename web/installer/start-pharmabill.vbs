' PharmaBill Launcher
' Starts the Node.js server silently in the background, then opens the browser.

Dim installDir, nodeExe, launcherJs, WshShell

installDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
nodeExe    = installDir & "\node\node.exe"
launcherJs = installDir & "\launcher.js"

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = installDir

' Start node server hidden (window style 0 = hidden, bWaitOnReturn = False)
WshShell.Run """" & nodeExe & """ """ & launcherJs & """", 0, False

' Give the server a few seconds to start
WScript.Sleep 8000

' Open the app in the default browser
WshShell.Run "http://localhost:3000"
