; PharmaBill Installer Script
; Requires Inno Setup 6: https://jrsoftware.org/isdl.php
; Before compiling:
;   1. Run build.bat to produce the ..\dist\ folder
;   2. Download Node.js LTS Windows ZIP from https://nodejs.org/en/download
;      and extract it into installer\node\  (so node\node.exe exists)

[Setup]
AppName=PharmaBill
AppVersion=1.0.0
AppPublisher=PharmaBill
AppComments=Pharmacy Billing System
DefaultDirName={autopf}\PharmaBill
DefaultGroupName=PharmaBill
OutputDir=Output
OutputBaseFilename=PharmaBill-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
; Logo shown on the left panel of the installer wizard
WizardImageFile=..\assets\logo big.png
WizardImageStretch=yes
; Small logo shown in the top-right corner of interior pages
WizardSmallImageFile=..\assets\logo.png
; Icon for the setup .exe itself — place a logo.ico in assets\ to enable
; SetupIconFile=..\assets\logo.ico
PrivilegesRequired=admin
SetupMutex=PharmaBillSetupMutex
CloseApplications=no
UninstallDisplayName=PharmaBill
; Allow running the installer over an existing installation (update in-place)
; without requiring the old version to be uninstalled first.
AppId={{B7F3A2C1-4D5E-4F6A-8B9C-0D1E2F3A4B5C}
AppVersion=1.0.0
VersionInfoVersion=1.0.0
DirExistsWarning=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Next.js standalone app — always overwrite so updates take effect
Source: "..\dist\app\*"; DestDir: "{app}\app"; Flags: ignoreversion recursesubdirs createallsubdirs
; App icon (used by shortcuts)
Source: "..\assets\logo.ico";           DestDir: "{app}\assets"; Flags: ignoreversion
; Launcher files
Source: "..\dist\launcher.js";           DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\start-pharmabill.vbs";  DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\stop-pharmabill.bat";   DestDir: "{app}"; Flags: ignoreversion
Source: "..\dist\debug-launcher.bat";    DestDir: "{app}"; Flags: ignoreversion
; Bundled portable Node.js
Source: "node\*"; DestDir: "{app}\node"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Desktop shortcut
Name: "{commondesktop}\PharmaBill";       Filename: "{sys}\wscript.exe"; Parameters: """{app}\start-pharmabill.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\assets\logo.ico"; Comment: "Start PharmaBill"
; Start Menu shortcuts
Name: "{group}\Start PharmaBill";         Filename: "{sys}\wscript.exe"; Parameters: """{app}\start-pharmabill.vbs"""; WorkingDir: "{app}"; IconFilename: "{app}\assets\logo.ico"; Comment: "Start PharmaBill"
Name: "{group}\Stop PharmaBill";          Filename: "{app}\stop-pharmabill.bat";  WorkingDir: "{app}"; Comment: "Stop PharmaBill server"
Name: "{group}\Uninstall PharmaBill";     Filename: "{uninstallexe}"

[UninstallRun]
; Kill the Node server on uninstall
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM node.exe"; Flags: runhidden; RunOnceId: "KillNode"

[Code]
var
  DbPage:    TWizardPage;
  DbServer:  TEdit;
  DbDatabase:TEdit;
  DbUser:    TEdit;
  DbPassword:TEdit;
  DbTrust:   TCheckBox;

  AuthPage:    TWizardPage;
  AuthUser:    TEdit;
  AuthPass:    TEdit;
  AuthConfirm: TEdit;

  IsUpgrade: Boolean;  { True when .env already exists — skip DB/auth pages }

{ ---- Simple random string for SESSION_SECRET ---- }
function RandomStr(Len: Integer): string;
var
  I: Integer;
  Pool: string;
begin
  Pool   := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  Result := '';
  for I := 1 to Len do
    Result := Result + Pool[Random(Length(Pool)) + 1];
end;

{ ---- Helper: create a label on a custom page surface ---- }
procedure AddLabel(Page: TWizardPage; Caption: string; Left, Top: Integer);
var
  Lbl: TLabel;
begin
  Lbl := TLabel.Create(Page);
  Lbl.Caption  := Caption;
  Lbl.Left     := Left;
  Lbl.Top      := Top;
  Lbl.AutoSize := True;
  Lbl.Parent   := Page.Surface;
end;

procedure InitializeWizard;
begin
  { Detect upgrade: if .env already exists in the target dir, skip config pages }
  IsUpgrade := FileExists(ExpandConstant('{app}\.env'));

  { ======== DATABASE PAGE ======== }
  DbPage := CreateCustomPage(wpSelectDir,
    'Database Configuration',
    'Enter your SQL Server connection details.');

  AddLabel(DbPage, 'SQL Server address (e.g. localhost  or  .\SQLEXPRESS):', 0, 0);
  DbServer := TEdit.Create(DbPage);
  DbServer.Left := 0; DbServer.Top := 18; DbServer.Width := 380;
  DbServer.Text := 'localhost';
  DbServer.Parent := DbPage.Surface;

  AddLabel(DbPage, 'Database name:', 0, 52);
  DbDatabase := TEdit.Create(DbPage);
  DbDatabase.Left := 0; DbDatabase.Top := 70; DbDatabase.Width := 380;
  DbDatabase.Text := 'pharmabill';
  DbDatabase.Parent := DbPage.Surface;

  AddLabel(DbPage, 'SQL Server login username:', 0, 104);
  DbUser := TEdit.Create(DbPage);
  DbUser.Left := 0; DbUser.Top := 122; DbUser.Width := 380;
  DbUser.Text := 'sa';
  DbUser.Parent := DbPage.Surface;

  AddLabel(DbPage, 'SQL Server login password:', 0, 156);
  DbPassword := TEdit.Create(DbPage);
  DbPassword.Left := 0; DbPassword.Top := 174; DbPassword.Width := 380;
  DbPassword.PasswordChar := '*';
  DbPassword.Parent := DbPage.Surface;

  DbTrust := TCheckBox.Create(DbPage);
  DbTrust.Left    := 0;
  DbTrust.Top     := 208;
  DbTrust.Width   := 420;
  DbTrust.Height  := 20;
  DbTrust.Caption := 'Trust Server Certificate  (recommended for local SQL Server / SQL Express)';
  DbTrust.Checked := True;
  DbTrust.Parent  := DbPage.Surface;

  { ======== APP LOGIN PAGE ======== }
  AuthPage := CreateCustomPage(DbPage.ID,
    'App Login Credentials',
    'Set the username and password used to log into PharmaBill.');

  AddLabel(AuthPage, 'Username:', 0, 0);
  AuthUser := TEdit.Create(AuthPage);
  AuthUser.Left := 0; AuthUser.Top := 18; AuthUser.Width := 300;
  AuthUser.Text := 'admin';
  AuthUser.Parent := AuthPage.Surface;

  AddLabel(AuthPage, 'Password (min 4 characters):', 0, 56);
  AuthPass := TEdit.Create(AuthPage);
  AuthPass.Left := 0; AuthPass.Top := 74; AuthPass.Width := 300;
  AuthPass.PasswordChar := '*';
  AuthPass.Parent := AuthPage.Surface;

  AddLabel(AuthPage, 'Confirm password:', 0, 112);
  AuthConfirm := TEdit.Create(AuthPage);
  AuthConfirm.Left := 0; AuthConfirm.Top := 130; AuthConfirm.Width := 300;
  AuthConfirm.PasswordChar := '*';
  AuthConfirm.Parent := AuthPage.Surface;
end;

{ ---- Skip DB/auth config pages on upgrade ---- }
function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
  if IsUpgrade then begin
    if (PageID = DbPage.ID) or (PageID = AuthPage.ID) then
      Result := True;
  end;
end;

{ ---- Validate inputs before allowing Next (only on fresh install) ---- }
function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
  if IsUpgrade then Exit;  { nothing to validate on upgrade }

  if CurPageID = DbPage.ID then begin
    if Trim(DbServer.Text) = '' then begin
      MsgBox('Please enter the SQL Server address.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if Trim(DbDatabase.Text) = '' then begin
      MsgBox('Please enter the database name.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if Trim(DbUser.Text) = '' then begin
      MsgBox('Please enter the SQL Server username.', mbError, MB_OK);
      Result := False; Exit;
    end;
  end;

  if CurPageID = AuthPage.ID then begin
    if Trim(AuthUser.Text) = '' then begin
      MsgBox('Please enter a username for the app login.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if Length(AuthPass.Text) < 4 then begin
      MsgBox('Password must be at least 4 characters.', mbError, MB_OK);
      Result := False; Exit;
    end;
    if AuthPass.Text <> AuthConfirm.Text then begin
      MsgBox('Passwords do not match. Please re-enter.', mbError, MB_OK);
      Result := False; Exit;
    end;
  end;
end;

{ ---- Write .env only on fresh install; leave it untouched on upgrade ---- }
procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvFile: string;
  Lines: TArrayOfString;
  TrustVal: string;
begin
  if CurStep = ssPostInstall then begin
    EnvFile := ExpandConstant('{app}\.env');

    { Upgrade: .env already exists — do not overwrite it }
    if FileExists(EnvFile) then Exit;

    if DbTrust.Checked then TrustVal := 'true' else TrustVal := 'false';

    SetArrayLength(Lines, 10);
    Lines[0] := 'DB_SERVER='    + DbServer.Text;
    Lines[1] := 'DB_DATABASE='  + DbDatabase.Text;
    Lines[2] := 'DB_USER='      + DbUser.Text;
    Lines[3] := 'DB_PASSWORD='  + DbPassword.Text;
    Lines[4] := 'DB_ENCRYPT=false';
    Lines[5] := 'DB_TRUST_CERT=' + TrustVal;
    Lines[6] := 'SESSION_SECRET=' + RandomStr(32);
    Lines[7] := 'AUTH_USERNAME=' + AuthUser.Text;
    Lines[8] := 'AUTH_PASSWORD=' + AuthPass.Text;
    Lines[9] := 'PORT=3000';

    SaveStringsToFile(EnvFile, Lines, False);
  end;
end;
