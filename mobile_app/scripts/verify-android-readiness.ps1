$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$googleServices = Join-Path $root "android\app\google-services.json"
$firebaseEnv = Join-Path $root "firebase_push.env"

function Write-Status($Label, $Ok, $Detail) {
  $prefix = if ($Ok) { "[OK]" } else { "[MISSING]" }
  Write-Host "$prefix $Label - $Detail"
}

function Get-CommandPath($Name) {
  try {
    return (Get-Command $Name -ErrorAction Stop).Source
  } catch {
    return $null
  }
}

$flutterPath = Get-CommandPath "flutter"
$adbPath = Get-CommandPath "adb"
$hasGoogleServices = Test-Path $googleServices
$hasFirebaseEnv = Test-Path $firebaseEnv

$flutterDetail = if ($null -ne $flutterPath) { $flutterPath } else { "Install Flutter and add it to PATH." }
$adbDetail = if ($null -ne $adbPath) { $adbPath } else { "Install Android platform-tools or Android Studio and add adb to PATH." }
$googleServicesDetail = if ($hasGoogleServices) { $googleServices } else { "Download it from Firebase Console and place it in mobile_app/android/app." }
$firebaseEnvDetail = if ($hasFirebaseEnv) { $firebaseEnv } else { "Create it from firebase_push.env.example before flutter run." }

Write-Status "Flutter SDK" ($null -ne $flutterPath) $flutterDetail
Write-Status "ADB" ($null -ne $adbPath) $adbDetail
Write-Status "google-services.json" $hasGoogleServices $googleServicesDetail
Write-Status "firebase_push.env" $hasFirebaseEnv $firebaseEnvDetail

if ($hasFirebaseEnv) {
  $envContent = Get-Content $firebaseEnv -Raw
  $requiredKeys = @(
    "MOBILE_FIREBASE_PROJECT_ID",
    "MOBILE_FIREBASE_MESSAGING_SENDER_ID",
    "MOBILE_FIREBASE_ANDROID_APP_ID"
  )

  foreach ($key in $requiredKeys) {
    $present = $envContent -match "(?m)^\s*$key\s*="
    $detail = if ($present) { "Configured" } else { "Add this key to firebase_push.env" }
    Write-Status $key $present $detail
  }
}

if ($null -ne $flutterPath) {
  Write-Host ""
  Write-Host "Running flutter doctor..."
  flutter doctor -v
}

if ($null -ne $adbPath) {
  Write-Host ""
  Write-Host "Connected Android devices:"
  adb devices
}

Write-Host ""
Write-Host "Suggested next command:"
Write-Host "flutter run --dart-define-from-file=firebase_push.env"
