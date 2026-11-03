param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "Gustavo" (guiño a Gustavo Fring): assets/characters/Gustavo/<Color>/<pose>.png
# Base: assets/characters/Gustavo/Color_G/idle.png (opción A retocada a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con la corbata del color del jugador (lo único que cambia).
#  · poses: cada pose del Mafioso del mismo color, cambiando al Mafioso por Gustavo (los objetos se conservan).
#    Como no lleva sombrero, se borra el del Mafioso y cada pose tiene su gesto propio.
#  · lose: media cara convertida en calavera quemada y el saco chamuscado, como en la explosión de la serie.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: el Volvo V70 familiar de la serie, carrocería del color del jugador.
# Uso: powershell -ExecutionPolicy Bypass -File generar_gustavo.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); S=(C '#7A4E38'); D=(C '#5E3A28'); L=(C '#5A3428'); H=(C '#1E1A18'); R=(C '#241A16'); O=(C '#A89868')
          W=(C '#E8E4DA'); T=(C '#9CC7E0'); V=(C '#4A2A40'); P=(C '#E8D0A0'); G=(C '#1C2A24'); Q=(C '#6E8F80')
          B=(C '#D8CCA8'); C=(C '#A89878'); Z=(C '#950C28'); X=(C '#5E0A18'); N=(C '#2A1A14') }   # B C hueso, Z X carne quemada, N carbón
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: corbata verde del retoque -> color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Gustavo\Color_G\idle.png')
function ShirtMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '36613A'=$tc }
}
function MakeIdle($tc) {
  $b = New-Object System.Drawing.Bitmap $green; $map = ShirtMap $tc
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $b.SetPixel($x, $y, $map[$k]) } } }
  , $b
}

# ---- gestos (coordenadas del idle; se desplazan con la pose) ----
# Cara del idle: cejas fila 11 (cols 25-28 y 35-38), ojos fila 13 dentro de los lentes (filas 12-15),
# boca fila 21 (29-34) con labio en la fila 22 (30-33). El lado izquierdo de la imagen es el que se quema en "lose".
$teeth = @(@(21, 29, 'AWAWAW'), @(22, 30, 'AAAA'))
$burnFace = @(                                                                   # media calavera (cols 22-32), el resto de la cara queda igual
  @(7, 22, 'ANNXZZS'), @(8, 22, 'ANXZBBZX'), @(9, 22, 'AXZBBBBZ'), @(10, 22, 'AZBBBBBBZ'), @(11, 22, 'AZBCCCCBBZ'),
  @(12, 21, 'AZBAAAAABBZ'), @(13, 21, 'AZBAAAAAABZ'), @(14, 21, 'AZBAAAAAABX'), @(15, 21, 'AZBCAAAACBZ'), @(16, 21, 'AZZBBBBBBBZ'),
  @(17, 21, 'AZBCBAABCZ'), @(18, 22, 'AZBBAABZ'), @(19, 22, 'AXZBBBBZ'), @(20, 22, 'AXZCBBBZ'), @(21, 22, 'AXZBWAWA'),
  @(22, 23, 'AXBWAWZ'), @(23, 23, 'AXZCCBZ'), @(24, 24, 'AXZZZX'), @(25, 25, 'AXXXXX'), @(27, 27, 'ZXZ'), @(28, 26, 'XZNZ'))
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0); fx=@(@(20, 28, 'A      A'), @(21, 29, 'AWWWWA'), @(22, 30, 'AAAA')) }          # sonrisa contenida al cobrar
  rpg_sniper  = @{ d=@(14, 0); fx=@(,@(13, 25, 'DAAD')) }                                                    # cierra un ojo para apuntar
  rpg_tommy   = @{ d=@(14, 0); fx=$teeth }                                                                   # dientes apretados
  rpg_doctor  = @{ d=@(14, 0); wipe=26; fx=@(@(14, 35, 'VVVV'), @(15, 35, 'VV'), @(8, 29, 'PPPPP'), @(7, 31, 'P'), @(9, 31, 'P')) }   # moretón y curita
  rpg_rat     = @{ d=@(0, 0); fx=@(@(13, 25, 'GGGG'), @(13, 35, 'GGGG'), @(14, 25, 'GQGG'), @(14, 35, 'GQGG')) }   # lentes oscuros
  maf_raid    = @{ d=@(0, 0); fx=$teeth }                                                                    # furioso
  pok_cheat   = @{ d=@(-2, 0); keepx=27; fx=@(@(13, 35, 'DAAD'), @(10, 25, 'RRRR'), @(11, 25, 'SSSS')) }     # guiño y ceja arriba
  lose        = @{ d=@(0, 0); wipe=30; burn=$true; fx=$burnFace }                                             # media cara calavera
  win         = @{ d=@(0, 0); clear=@(44, 0, 63, 30); fx=@(@(20, 28, 'A      A'), @(21, 29, 'WWWWWW'), @(22, 29, 'AAAAAA')) }   # sonrisa; sin el humo del puro del Mafioso
}
# ---- colores del Mafioso (para reconocerlo dentro de cada pose) ----
$idleHex = @{}
foreach ($k in $cols.Keys) { $m = New-Object System.Drawing.Bitmap (Join-Path $Root "assets\characters\Mafioso\$k\idle.png")
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $m.GetPixel($x, $y); if ($p.A -ge 128) { $idleHex[(& $hex $p)] = 1 } } }; $m.Dispose() }
'0F0F0F','161616','90593F','3E281D','FBF236','AC3232','FFFFFF' | ForEach-Object { $idleHex[$_] = 1 }      # sombras, puro y dientes del Mafioso
$hatHex = @{ '0C0C0C'=1; '252525'=1; '151515'=1; '000000'=1; '0F0F0F'=1; '161616'=1 }
$ties = $cols.Values | ForEach-Object { C $_ }
function IsChar($pc, $ph, $keep) {
  if ($keep -and $keep -contains $ph) { return $false }
  if ($idleHex.ContainsKey($ph)) { return $true }
  foreach ($t in $ties) { if ([math]::Abs($pc.R - $t.R) + [math]::Abs($pc.G - $t.G) + [math]::Abs($pc.B - $t.B) -le 30) { return $true } }
  $false
}
# Saco y cuello chamuscados del lado quemado (el izquierdo de la imagen).
$suit = @{ '7E8286'=1; '6E7276'=1; '8A8E92'=1; '52565A'=1; 'C8DCEC'=1; 'A8C0D4'=1; '90A8BC'=1; '7A4E38'=1; '5E3A28'=1 }
function Burn($bmp) {
  for ($y = 27; $y -le 50; $y++) { for ($x = 14; $x -le 31; $x++) { $p = $bmp.GetPixel($x, $y); if ($p.A -lt 128 -or -not $suit.ContainsKey((& $hex $p))) { continue }
    $edge = 31 - [int](($y - 27) * 0.3)                                       # la quemadura se estrecha hacia abajo
    if ($x -gt $edge) { continue }
    $n = ($x * 7 + $y * 13) % 6
    $ch = if ($y -le 30) { @('Z', 'X', 'Z', 'N', 'X', 'Z')[$n] } elseif ($n -le 2) { 'N' } elseif ($n -eq 3) { 'X' } elseif ($n -eq 4 -and $y -le 42) { 'Z' } else { $null }
    if ($ch) { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- coche: el Volvo V70 familiar de la serie (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches: familiar largo y bajo, capó en cuña, techo recto con barras plateadas,
# portón trasero casi vertical con calaveras rojas altas, rines plateados y Gustavo al volante con sus lentes.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $glass = C '#2A3A44'; $chrome = C '#C8C8C8'
  $pts = { param($a) [System.Drawing.Point[]]($a | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }) }
  $fill = { param($c, $a) $g.FillPolygon((New-Object System.Drawing.SolidBrush $c), (& $pts $a)) }
  & $fill $body  @(@(2,40),@(6,37),@(18,35),@(26,27),@(58,26),@(61,30),@(62,46),@(2,47))                 # carrocería
  & $fill $glass @(@(21,35),@(28,29),@(38,29),@(38,35))                                                   # ventanillas
  & $fill $glass @(@(40,29),@(49,29),@(49,35),@(40,35))
  & $fill $glass @(@(51,29),@(57,29),@(59,32),@(59,35),@(51,35))
  $g.Dispose()
  for ($x = 2; $x -le 62; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  for ($x = 30; $x -le 57; $x++) { $b.SetPixel($x, 24, (C '#9A9A9A')) }                                   # barras del techo
  foreach ($x in 31, 56) { $b.SetPixel($x, 25, (C '#9A9A9A')) }
  for ($y = 29; $y -le 44; $y++) { $b.SetPixel(39, $y, $dark); $b.SetPixel(50, $y, $dark) }               # puertas
  $b.SetPixel(36, 37, $chrome); $b.SetPixel(47, 37, $chrome)                                              # manijas
  for ($x = 4; $x -le 61; $x++) { $b.SetPixel($x, 42, $dark) }                                            # moldura lateral
  for ($x = 2; $x -le 62; $x++) { foreach ($y in 45, 46) { $b.SetPixel($x, $y, $dark) } }                 # faldón
  for ($y = 29; $y -le 40; $y++) { $b.SetPixel(60, $y, (C '#AC3232')); $b.SetPixel(61, $y, (C '#AC3232')) }   # calaveras altas
  foreach ($pt in @(@(3,40),@(4,40),@(5,40),@(4,41),@(5,41))) { $b.SetPixel($pt[0], $pt[1], (C '#F2E6A0')) }   # faro
  for ($y = 42; $y -le 46; $y++) { $b.SetPixel(2, $y, (C '#2A2A2A')); $b.SetPixel(3, $y, (C '#2A2A2A')) }    # parachoques
  $b.SetPixel(20, 33, $dark); $b.SetPixel(21, 33, $dark)                                                  # espejo
  foreach ($cx in 14, 50) { $cy = 47                                                                       # pasos de rueda y rines plateados
    for ($y = $cy - 8; $y -le [math]::Min(63, $cy + 8); $y++) { for ($x = $cx - 8; $x -le $cx + 8; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 7.5 -or $x -lt 0 -or $x -gt 63) { continue }
      $c = if ($d -gt 6.5) { if ($y -le $cy) { C '#0A0A0A' } else { $null } } elseif ($d -le 1) { C '#6A6A6A' } elseif ($d -le 4.2) { $a = ([math]::Atan2($y - $cy, $x - $cx) / (2 * [math]::PI) * 5 + 5) % 1; if ($a -lt .35) { C '#7A7A7A' } else { C '#D8D8D8' } } else { C '#141414' }
      if ($c) { $b.SetPixel($x, $y, $c) } } } }
  $mini = @(@(29, 30, 'AAAA'), @(30, 29, 'AHHHHA'), @(31, 29, 'ASSSSA'), @(32, 29, 'OSOOSO'), @(33, 29, 'ASSSSA'), @(34, 29, 'ASAASA'))   # Gustavo al volante
  Paint $b $mini 0 0
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la corbata.
$handmade = 'idle', 'pok_cheat', 'rpg_sniper', 'rpg_tommy', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Gustavo\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Gustavo\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $out = New-Object System.Drawing.Bitmap $f
    if ($cfg.clear) { for ($y = $cfg.clear[1]; $y -le $cfg.clear[3]; $y++) { for ($x = $cfg.clear[0]; $x -le $cfg.clear[2]; $x++) { $out.SetPixel($x, $y, $T) } } }
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $r = $me.GetPixel($x, $y); $ic = $base.GetPixel($x, $y)
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py); $ph = & $hex $pc
      $hat = $y -le 22 -and $x -ge 18 -and $x -le 46 -and (-not $cfg.keepx -or $px -ge $cfg.keepx) -and $pc.A -ge 128 -and $hatHex.ContainsKey($ph)   # sombrero del Mafioso (también ladeado)
      if ($ic.A -lt 128 -and -not $hat) { if ($r.A -ge 128 -and $pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }   # cabeza: solo sobre fondo vacío
      if ($pc.A -lt 128) { continue }                                                                       # el personaje está recortado aquí
      if ($hat -or $pc.ToArgb() -eq $ic.ToArgb() -or (IsChar $pc $ph $cfg.keep) -or ($cfg.wipe -and $y -le $cfg.wipe -and $r.A -ge 128)) { if ($r.A -ge 128) { $out.SetPixel($px, $py, $r) } else { $out.SetPixel($px, $py, $T) } }
      # cualquier otro color (objetos, moretones, sangre, humo) se queda
    } }
    if ($cfg.burn) { Burn $out }
    if ($cfg.fx) { Paint $out $cfg.fx $dx $dy }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$green.Dispose()
"ok"
