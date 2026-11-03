param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera el capo secreto "T-800" (logro Juicio Final): assets/characters/Terminator/<Color>/<pose>.png
# Base: assets/characters/Terminator/Color_G/idle.png (cara del Mafioso con la piel arrancada y ojo rojo + cuerpo del Bot).
#  · poses: cada pose del Bot del mismo color, cambiando al Bot por el T-800 (los objetos y el coche del Bot se conservan).
#  · otros colores: el cuerpo toma los tonos del Bot de ese color (comparando píxel a píxel los idle del Bot); el ojo sigue rojo.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean.
# Por defecto solo hace el verde. Uso: powershell -ExecutionPolicy Bypass -File generar_terminator.ps1 -Root <carpeta> [-Colors 'Color_R,Color_B,...']
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
$pal = @{ A=(C '#000000'); R=(C '#B01818'); O=(C '#FF6A5A'); G=(C '#3A3A3A'); S=(C '#A06346'); K=(C '#7B4E38'); H=(C '#151515'); M=(C '#0A0A0A'); I=(C '#8A8F98') }
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- tonos del Bot por color: verde -> color X (mismas posiciones del idle del Bot) ----
$botG = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Bot\Color_G\idle.png')
function BodyMap($key) {
  if ($key -eq 'Color_G') { return @{} }
  $bx = New-Object System.Drawing.Bitmap (Join-Path $Root "assets\characters\Bot\$key\idle.png"); $m = @{}
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $a = $botG.GetPixel($x, $y); $b = $bx.GetPixel($x, $y)
    if ($a.A -ge 128 -and $b.A -ge 128 -and $a.ToArgb() -ne $b.ToArgb()) { $m[(& $hex $a)] = $b } } }
  $bx.Dispose(); $m
}
function Recolor($bmp, $map, $fromRow) {         # solo del cuello hacia abajo (fila 28) para que el ojo rojo no cambie
  for ($y = $fromRow; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $bmp.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $bmp.SetPixel($x, $y, $map[$k]) } } }
}

# ---- gestos (coordenadas del idle; se desplazan con la pose) ----
# Ojo rojo en filas 19-22 (cols 35-39). raw: se usa la pose del Bot tal cual y solo se pinta fx encima.
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_getaway = @{ d=@(0, 0); raw=$true; fx=@(@(14, 44, '.....'), @(15, 44, '.....'), @(16, 44, '.....'), @(17, 44, '.....'), @(18, 44, '.....'), @(19, 44, '.....'),   # sin antena
                                    @(24, 29, '.HHHHH.'), @(25, 29, 'HHHHHHH'), @(26, 29, 'SASSIRI'), @(27, 29, 'SSKSIII'), @(28, 29, 'SMMMIII')) }   # el T-800 (mini) al volante del coche del Bot
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0) }
  maf_raid    = @{ d=@(0, 0) }
  pok_cheat   = @{ d=@(-2, 0) }
  rpg_doctor  = @{ d=@(14, 0) }
  rpg_rat     = @{ d=@(0, 0) }
  rpg_sniper  = @{ d=@(14, 0) }
  rpg_tommy   = @{ d=@(14, 0) }
  lose        = @{ d=@(0, 0); eye='G' }        # derrotado: el ojo se apaga
  win         = @{ d=@(0, 0) }
}

# ---- colores del Bot (para reconocerlo dentro de cada pose) ----
$cols = 'Color_R','Color_B','Color_G','Color_P','Color_Pu','Color_W','Color_Y'
$idleHex = @{}
foreach ($k in $cols) { $m = New-Object System.Drawing.Bitmap (Join-Path $Root "assets\characters\Bot\$k\idle.png")
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $m.GetPixel($x, $y); if ($p.A -ge 128) { $idleHex[(& $hex $p)] = 1 } } }; $m.Dispose() }

$handmade = 'idle', 'maf_raid', 'win'
foreach ($key in $Colors) {
  $src = Join-Path $Root "assets\characters\Bot\$key"; $dir = Join-Path $Root "assets\characters\Terminator\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $map = BodyMap $key
  $me = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Terminator\Color_G\idle.png'); Recolor $me $map 28
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  foreach ($n in $handmade) { if ($key -ne 'Color_G') {
    $h = New-Object System.Drawing.Bitmap (Join-Path $Root "assets\characters\Terminator\Color_G\$n.png"); Recolor $h $map 28
    $h.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $h.Dispose() } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $out = New-Object System.Drawing.Bitmap $f
    if ($cfg.raw) { if ($cfg.fx) { Paint $out $cfg.fx 0 0 }; $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose(); continue }
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $r = $me.GetPixel($x, $y); $ic = $base.GetPixel($x, $y)
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py)
      if ($ic.A -lt 128) { if ($r.A -ge 128 -and $pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }
      if ($pc.A -lt 128) { continue }
      if ($pc.ToArgb() -eq $ic.ToArgb() -or $idleHex.ContainsKey((& $hex $pc))) { if ($r.A -ge 128) { $out.SetPixel($px, $py, $r) } else { $out.SetPixel($px, $py, $T) } }
    } }
    for ($y = 0; $y -le 6; $y++) { for ($x = 29; $x -le 36; $x++) { $px = $x + $dx                     # el T-800 no lleva antena: fuera restos (también la apagada de 'lose')
      if ($px -ge 0 -and $px -lt 64 -and $me.GetPixel($x, $y).A -lt 128) { $out.SetPixel($px, $y, $T) } } }
    if ($cfg.eye) { for ($y = 19; $y -le 22; $y++) { for ($x = 33; $x -le 40; $x++) { $px = $x + $dx; $p = $out.GetPixel($px, $y + $dy)
      if ($p.A -ge 128 -and @('B01818','FF6A5A','FFD0C8') -contains (& $hex $p)) { $out.SetPixel($px, $y + $dy, $pal[$cfg.eye]) } } } }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$botG.Dispose()
"ok"
