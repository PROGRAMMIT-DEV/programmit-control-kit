#define MyAppName "PROGRAMMIT Control"

#ifndef MyVersion
  #define MyVersion "0.0.0"
#endif

#ifndef RepoRoot
  #define RepoRoot "..\.."
#endif

[Setup]
AppId={{A5BD359E-63DE-4E17-9078-64E489725B74}
AppName={#MyAppName}
AppVersion={#MyVersion}
AppPublisher=PROGRAMMIT
DefaultDirName={localappdata}\PROGRAMMIT Control
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputDir={#RepoRoot}\dist
OutputBaseFilename=Programmit-Control-v{#MyVersion}-Windows
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
UninstallDisplayName=PROGRAMMIT Control v{#MyVersion}

[Dirs]
Name: "{%USERPROFILE}\.config\opencode\agents"
Name: "{%USERPROFILE}\.config\opencode\plugins"
Name: "{%USERPROFILE}\.programmit\bin"

[Files]
Source: "{#RepoRoot}\.opencode\agents\programmit-control.md"; DestDir: "{%USERPROFILE}\.config\opencode\agents"; Flags: ignoreversion
Source: "{#RepoRoot}\.opencode\agents\programmit-fast.md"; DestDir: "{%USERPROFILE}\.config\opencode\agents"; Flags: ignoreversion
Source: "{#RepoRoot}\.opencode\plugins\programmit-auto-memory.ts"; DestDir: "{%USERPROFILE}\.config\opencode\plugins"; Flags: ignoreversion

Source: "{#RepoRoot}\brain-template\bin\programmit-auto-memory"; DestDir: "{%USERPROFILE}\.programmit\bin"; DestName: "programmit-auto-memory.py"; Flags: ignoreversion
Source: "{#RepoRoot}\packaging\windows\programmit-auto-memory.cmd"; DestDir: "{%USERPROFILE}\.programmit\bin"; Flags: ignoreversion

Source: "{#RepoRoot}\VERSION"; DestDir: "{%USERPROFILE}\.programmit"; DestName: "version"; Flags: ignoreversion
