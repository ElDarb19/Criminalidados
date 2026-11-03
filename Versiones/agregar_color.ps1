param([string]$Root, [string]$Key = 'Color_Y', [string]$Hex = 'D9A520')
# Crea un color de jugador nuevo para los personajes base (Mafioso, Mafiosa, Bot) y los dados, partiendo del verde.
# Los píxeles "del color del jugador" son los que cambian entre las versiones verde, roja y azul; solo esos se pintan
# con el color nuevo, conservando sus luces y sombras (misma luminosidad relativa). Lo demás se copia igual.
# Los personajes de la tienda (Patron, Tony, Brummie, Terminator) se hacen después con sus propios generadores.
# Uso: powershell -ExecutionPolicy Bypass -File agregar_color.ps1 -Root <carpeta del juego> [-Key Color_Y -Hex D9A520]
Add-Type -AssemblyName System.Drawing
function HSL($col) {                                      # nombres largos: en PowerShell $g y $G son la misma variable
  [double]$rr = $col.R / 255; [double]$gg = $col.G / 255; [double]$bb = $col.B / 255
  [double]$mx = [math]::Max($rr, [math]::Max($gg, $bb)); [double]$mn = [math]::Min($rr, [math]::Min($gg, $bb)); [double]$lum = ($mx + $mn) / 2
  if ($mx -eq $mn) { return ,@([double]0, [double]0, $lum) }
  [double]$dd = $mx - $mn
  [double]$sat = if ($lum -gt .5) { $dd / (2 - $mx - $mn) } else { $dd / ($mx + $mn) }
  [double]$hue = 0
  if ($mx -eq $rr) { $hue = (($gg - $bb) / $dd) % 6 } elseif ($mx -eq $gg) { $hue = ($bb - $rr) / $dd + 2 } else { $hue = ($rr - $gg) / $dd + 4 }
  [double]$deg = (($hue * 60) + 360) % 360                 # (la coma pesa más que %: se calcula aparte)
  ,@($deg, $sat, $lum)
}
function FromHSL([double]$hue, [double]$sat, [double]$lum, [int]$alpha) {
  [double]$cc = (1 - [math]::Abs(2 * $lum - 1)) * $sat; [double]$xx = $cc * (1 - [math]::Abs((($hue / 60) % 2) - 1)); [double]$mm = $lum - $cc / 2
  $seg = [int][math]::Floor($hue / 60)
  $rgb = switch ($seg) { 0 { @($cc, $xx, 0) } 1 { @($xx, $cc, 0) } 2 { @(0, $cc, $xx) } 3 { @(0, $xx, $cc) } 4 { @($xx, 0, $cc) } default { @($cc, 0, $xx) } }
  $to = { param($v) [int][math]::Max(0, [math]::Min(255, [math]::Round(($v + $mm) * 255))) }
  [System.Drawing.Color]::FromArgb($alpha, (& $to $rgb[0]), (& $to $rgb[1]), (& $to $rgb[2]))
}
$BASEG = HSL ([System.Drawing.ColorTranslator]::FromHtml('#36613A')); $BASEY = HSL ([System.Drawing.ColorTranslator]::FromHtml('#' + $Hex))
$cache = @{}
function Shift($c) {                                       # tono verde -> mismo tono en el color nuevo
  $k = $c.ToArgb(); if ($cache.ContainsKey($k)) { return $cache[$k] }
  $p = HSL $c
  $lum = if ($p[2] -le $BASEG[2]) { $p[2] * $BASEY[2] / $BASEG[2] } else { $BASEY[2] + ($p[2] - $BASEG[2]) * (1 - $BASEY[2]) / (1 - $BASEG[2]) }
  $sat = [math]::Min(1, $p[1] * $BASEY[1] / [math]::Max(.01, $BASEG[1]))
  $n = FromHSL $BASEY[0] $sat ([math]::Min(.97, $lum)) $c.A; $cache[$k] = $n; $n
}
function Make($gPath, $rPath, $bPath, $out) {
  $g = New-Object System.Drawing.Bitmap $gPath; $r = New-Object System.Drawing.Bitmap $rPath; $b = New-Object System.Drawing.Bitmap $bPath
  $o = New-Object System.Drawing.Bitmap $g.Width, $g.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $g.Height; $y++) { for ($x = 0; $x -lt $g.Width; $x++) { $p = $g.GetPixel($x, $y)
    if ($p.A -gt 0 -and $p.ToArgb() -ne $r.GetPixel($x, $y).ToArgb() -and $p.ToArgb() -ne $b.GetPixel($x, $y).ToArgb()) { $p = Shift $p }
    $o.SetPixel($x, $y, $p) } }
  $g.Dispose(); $r.Dispose(); $b.Dispose(); $o.Save($out, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose()
}
foreach ($ch in 'Mafioso', 'Mafiosa', 'Bot') {
  $base = Join-Path $Root "assets\characters\$ch"; $dir = Join-Path $base $Key; New-Item -ItemType Directory -Force $dir | Out-Null
  foreach ($f in Get-ChildItem (Join-Path $base 'Color_G\*.png')) { Make $f.FullName (Join-Path $base "Color_R\$($f.Name)") (Join-Path $base "Color_B\$($f.Name)") (Join-Path $dir $f.Name) }
}
foreach ($d in 'D4', 'D6', 'D8', 'D12', 'D20') {
  $base = Join-Path $Root "assets\$d"; Make (Join-Path $base 'Color_G.png') (Join-Path $base 'Color_R.png') (Join-Path $base 'Color_B.png') (Join-Path $base "$Key.png")
}
"ok"
