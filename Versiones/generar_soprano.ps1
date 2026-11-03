param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera el capo inspirado en Tony Soprano: assets/characters/Soprano/<Color>/<pose>.png
# Base: assets/characters/Soprano/Color_G/idle.png (opción C retocada a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con los cuadros de la camisa en el color del jugador.
#  · poses: cada pose del Mafioso del mismo color, cambiando al Mafioso por el Soprano (los objetos se conservan).
#    Como no lleva sombrero, se borra el del Mafioso y cada pose tiene su gesto propio; en "win" hace el dedo de la foto.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: la Chevrolet Suburban del 99 de la serie, más grande que los demás coches.
# Uso: powershell -ExecutionPolicy Bypass -File generar_soprano.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); S=(C '#DDAA8C'); D=(C '#B07E62'); K=(C '#F0C8AE'); L=(C '#B87560'); H=(C '#3A2E28'); R=(C '#2A201C')
          W=(C '#F0EBDF'); T=(C '#9CC7E0'); V=(C '#7F558F'); Z=(C '#950C28'); P=(C '#E8D0A0'); G=(C '#1C2A24'); Q=(C '#6E8F80')
          U=(C '#7E520E'); O=(C '#E05A20'); E=(C '#4E8A54'); F=(C '#36613A'); J=(C '#24422A'); N=(C '#1A3020') }                   # E F J N: cuadros de la manga (verde)
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: cuadros verdes del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Soprano\Color_G\idle.png')
function ShirtMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '4E8A54'=(Mix $tc (C '#FFFFFF') 0.18); '36613A'=$tc; '24422A'=(Mix $tc (C '#000000') 0.33); '1A3020'=(Mix $tc (C '#000000') 0.52) }
}
function MakeIdle($tc) {
  $b = New-Object System.Drawing.Bitmap $green; $map = ShirtMap $tc
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $b.SetPixel($x, $y, $map[$k]) } } }
  , $b
}

# ---- gestos (coordenadas del idle; se desplazan con la pose) ----
# Cara del idle: cejas filas 9-10, ojos filas 11-12 (cols 25-28 y 35-38), nariz filas 14-17,
# boca fila 19 (30-34) con las comisuras caídas en la fila 20 (28 y 36).
$smile = @(@(18, 29, 'A     A'), @(19, 29, 'SWWWWWS'), @(20, 28, 'SSAAAAASS'))
$teeth = @(@(19, 29, 'AWAWAWA'), @(20, 28, 'SSAAAAASS'))
# Mano haciendo el dedo (como en la foto) con la manga de cuadros subiendo delante del pecho.
$finger = @(@(35, 17, 'AA'), @(36, 16, 'ASKA'), @(37, 16, 'ASSA'), @(38, 16, 'ASSA'), @(39, 14, 'AAASSAAA'),
            @(40, 13, 'ASKASSAKSA'), @(41, 13, 'ASSADDASSA'), @(42, 13, 'ASSSSSSSSA'), @(43, 13, 'ADSSSSSSDA'), @(44, 13, 'ADSSSSSSDA'),
            @(45, 13, 'ANNNNNNNNA'))
foreach ($y in 46..58) { $row = 'A'; foreach ($x in 14..21) { $row += if ((($x + 2) % 4) -eq 0 -and ($y % 4) -eq 0) { 'J' } elseif ((($x + 2) % 4) -eq 0 -or ($y % 4) -eq 0) { 'F' } else { 'E' } }; $finger += , @($y, 13, ($row + 'A')) }
$finger += , @(59, 13, 'AAAAAAAAAA')
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0); fx=$smile }                                                                 # sonríe al cobrar
  rpg_sniper  = @{ d=@(14, 0); fx=@(@(11, 25, 'SSSS'), @(12, 25, 'AAAA')) }                                  # cierra un ojo para apuntar
  rpg_tommy   = @{ d=@(14, 0); fx=$teeth }                                                                 # dientes apretados
  rpg_doctor  = @{ d=@(14, 0); wipe=26; fx=@(@(13, 24, 'VVVVV'), @(14, 25, 'VVV'), @(4, 31, 'P'), @(5, 29, 'PPPPP'), @(6, 31, 'P')) }   # ojo morado y curita en la calva
  rpg_rat     = @{ d=@(0, 0); fx=@(@(11, 24, 'AGGGGAAAAAAGGGGA'), @(12, 24, 'AGQGGA    AGQGGA'), @(13, 25, 'AAAA      AAAA')) }   # gafas oscuras
  maf_raid    = @{ d=@(0, 0); fx=$teeth }                                                                  # furioso
  pok_cheat   = @{ d=@(-2, 0); keepx=27; fx=@(@(11, 35, 'SSSS'), @(12, 35, 'AAAA'), @(8, 25, 'RRRR'), @(9, 25, 'SSS'), @(10, 27, 'SS')) }   # guiño y ceja arriba
  lose        = @{ d=@(0, 0); wipe=30; fx=@(@(11, 25, 'SSSS'), @(12, 25, 'AAAA'), @(11, 35, 'SSSS'), @(12, 35, 'AAAA'),   # ojos cerrados
                                    @(13, 24, 'VVVVV'), @(14, 25, 'VVV'), @(18, 32, 'Z'), @(21, 32, 'Z'), @(22, 32, 'Z'),   # ojo morado y nariz sangrando
                                    @(13, 26, 'T'), @(14, 26, 'T'), @(13, 37, 'T'), @(14, 37, 'T'), @(7, 42, 'T'), @(8, 42, 'T')) }   # lágrimas y sudor
  win         = @{ d=@(0, 0); fx=($smile + $finger + @(@(18, 37, 'AAAAA'), @(19, 36, 'AUUUUOA'), @(20, 37, 'AAAAA'))) }   # sonrisa, puro (el humo es del Mafioso) y el dedo de la foto
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

# ---- coche: la Chevrolet Suburban del 99 de la serie (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches, pero más grande: carrocería alta y cuadrada del color del jugador,
# defensa tubular negra delante, vidrios traseros polarizados, barras en el techo, faldón gris, moldura cromada
# y el Soprano al volante.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $glass = C '#2A3A44'; $tint = C '#12181C'; $chrome = C '#C8C8C8'; $clad = C '#6E6E6E'
  $pts = { param($a) [System.Drawing.Point[]]($a | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }) }
  $fill = { param($c, $a) $g.FillPolygon((New-Object System.Drawing.SolidBrush $c), (& $pts $a)) }
  & $fill $body  @(@(2,33),@(16,31),@(23,21),@(61,21),@(62,24),@(62,47),@(2,47))                         # carrocería
  & $fill $glass @(@(18,31),@(24,23),@(34,23),@(34,31))                                                   # ventanilla del conductor
  & $fill $tint  @(@(36,23),@(46,23),@(46,31),@(36,31))                                                   # vidrios polarizados
  & $fill $tint  @(@(48,23),@(60,23),@(60,31),@(48,31))
  & $fill $clad  @(@(2,43),@(62,43),@(62,47),@(2,47))                                                     # faldón gris
  $g.Dispose()
  for ($x = 2; $x -le 62; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  for ($x = 26; $x -le 59; $x++) { $b.SetPixel($x, 19, (C '#2A2A2A')) }                                   # barras del techo
  foreach ($x in 27, 43, 58) { $b.SetPixel($x, 20, (C '#2A2A2A')) }
  for ($y = 23; $y -le 42; $y++) { $b.SetPixel(35, $y, $dark); $b.SetPixel(47, $y, $dark) }               # puertas
  $b.SetPixel(32, 33, $chrome); $b.SetPixel(44, 33, $chrome); $b.SetPixel(56, 33, $chrome)                  # manijas
  for ($x = 3; $x -le 61; $x++) { $b.SetPixel($x, 38, $chrome) }                                          # moldura cromada
  for ($x = 2; $x -le 62; $x++) { $b.SetPixel($x, 43, (C '#4A4A4A')) }
  for ($y = 25; $y -le 30; $y++) { $b.SetPixel(61, $y, (C '#AC3232')); $b.SetPixel(62, $y, (C '#AC3232')) }   # calavera trasera
  $b.SetPixel(16, 28, $dark); $b.SetPixel(17, 28, $dark); $b.SetPixel(17, 29, $dark)                     # espejo
  foreach ($pt in @(@(3,35),@(4,35),@(3,36),@(4,36))) { $b.SetPixel($pt[0], $pt[1], (C '#F2E6A0')) }        # faro
  for ($y = 37; $y -le 41; $y++) { $b.SetPixel(2, $y, $chrome); $b.SetPixel(3, $y, (C '#8A8A8A')) }       # parrilla
  for ($y = 30; $y -le 46; $y++) { $b.SetPixel(0, $y, (C '#1A1A1A')); $b.SetPixel(1, $y, (C '#1A1A1A')) }    # defensa tubular
  foreach ($y in 33, 40) { for ($x = 0; $x -le 4; $x++) { $b.SetPixel($x, $y, (C '#1A1A1A')) } }
  for ($x = 22; $x -le 42; $x++) { $b.SetPixel($x, 48, (C '#2A2A2A')) }                                   # estribo
  foreach ($cx in 13, 51) { $cy = 47                                                                       # pasos de rueda y ruedas
    for ($y = $cy - 8; $y -le [math]::Min(63, $cy + 8); $y++) { for ($x = $cx - 8; $x -le $cx + 8; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 8 -or $x -lt 0 -or $x -gt 63) { continue }
      $c = if ($d -gt 6.5) { if ($y -le $cy) { C '#0A0A0A' } else { $null } } elseif ($d -le 1) { C '#5A5A5A' } elseif ($d -le 4) { $a = ([math]::Atan2($y - $cy, $x - $cx) / (2 * [math]::PI) * 6 + 6) % 1; if ($a -lt .4) { C '#8A8A8A' } else { C '#C8C8C8' } } else { C '#141414' }
      if ($c) { $b.SetPixel($x, $y, $c) } } } }
  $mini = @(@(24, 26, 'AAAA'), @(25, 25, 'AKSSSA'), @(26, 25, 'HSSSSH'), @(27, 25, 'HASASH'), @(28, 25, 'ASSSSA'), @(29, 25, 'ASAASA'), @(30, 25, 'ADSSDA'))   # el Soprano al volante
  Paint $b $mini 0 0
  for ($x = 24; $x -le 31; $x++) { $b.SetPixel($x, 31, $(if ($x % 2) { $lite } else { $body })) }          # hombro de cuadros
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la camisa.
$handmade = 'idle', 'rpg_tommy', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Soprano\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Soprano\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $out = New-Object System.Drawing.Bitmap $f
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $r = $me.GetPixel($x, $y); $ic = $base.GetPixel($x, $y)
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py); $ph = & $hex $pc
      $hat = $y -le 22 -and $x -ge 18 -and $x -le 46 -and (-not $cfg.keepx -or $px -ge $cfg.keepx) -and $pc.A -ge 128 -and $hatHex.ContainsKey($ph)   # sombrero del Mafioso (también ladeado)
      if ($ic.A -lt 128 -and -not $hat) { if ($r.A -ge 128 -and $pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }   # cabeza y barriga: solo sobre fondo vacío
      if ($pc.A -lt 128) { continue }                                                                       # el personaje está recortado aquí
      if ($hat -or $pc.ToArgb() -eq $ic.ToArgb() -or (IsChar $pc $ph $cfg.keep) -or ($cfg.wipe -and $y -le $cfg.wipe -and $r.A -ge 128)) { if ($r.A -ge 128) { $out.SetPixel($px, $py, $r) } else { $out.SetPixel($px, $py, $T) } }
      # cualquier otro color (objetos, moretones, sangre, humo) se queda
    } }
    if ($cfg.fx) { Paint $out $cfg.fx $dx $dy }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$green.Dispose()
"ok"
