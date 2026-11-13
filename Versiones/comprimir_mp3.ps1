param([string]$In, [string]$Out, [int]$Kbps = 96)
# Recodifica un mp3 con el codificador de Windows (Media Foundation vía WinRT), sin programas extra.
# Uso (desde la carpeta del juego):
#   powershell -ExecutionPolicy Bypass -File Versiones\comprimir_mp3.ps1 -In C:\ruta\cancion.mp3 -Out C:\ruta\assets\audios\musica\rpg.mp3
# Opcional: -Kbps 96 (por defecto). Las rutas deben ser completas.
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Transcoding.MediaTranscoder, Windows.Media.Transcoding, ContentType = WindowsRuntime]
$null = [Windows.Media.MediaProperties.MediaEncodingProfile, Windows.Media.MediaProperties, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncActionWithProgress`1' })[0]
$src = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($In)) ([Windows.Storage.StorageFile])
$dir = Await ([Windows.Storage.StorageFolder]::GetFolderFromPathAsync((Split-Path $Out))) ([Windows.Storage.StorageFolder])
$dst = Await ($dir.CreateFileAsync((Split-Path $Out -Leaf), [Windows.Storage.CreationCollisionOption]::ReplaceExisting)) ([Windows.Storage.StorageFile])
$prof = [Windows.Media.MediaProperties.MediaEncodingProfile]::CreateMp3([Windows.Media.MediaProperties.AudioEncodingQuality]::Medium)
$prof.Audio.Bitrate = [uint32]($Kbps * 1000)
$tr = New-Object Windows.Media.Transcoding.MediaTranscoder
$prep = Await ($tr.PrepareFileTranscodeAsync($src, $dst, $prof)) ([Windows.Media.Transcoding.PrepareTranscodeResult])
if (-not $prep.CanTranscode) { throw "No se puede: $($prep.FailureReason)" }
$t = $asTaskAction.MakeGenericMethod([double]).Invoke($null, @($prep.TranscodeAsync())); $t.Wait(-1) | Out-Null
"ok $Out $((Get-Item $Out).Length)"
