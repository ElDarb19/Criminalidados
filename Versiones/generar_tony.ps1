param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "El Gordo Tony": assets/characters/Tony/<Color>/<pose>.png
# Base: assets/characters/Tony/Color_G/idle.png (retocado a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con la camisa del color del jugador.
#  · poses: cada pose del Mafioso del mismo color, cambiando al Mafioso por Tony (los objetos se conservan).
#    Como Tony no lleva sombrero, se borra el del Mafioso y cada pose tiene su gesto propio (siempre con su puro).
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: el convertible de Tony en Los Simpson. MakeCar lo dibujó; ahora se usa el verde retocado por Darb recoloreado.
# Uso: powershell -ExecutionPolicy Bypass -File generar_tony.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); D=(C '#C5937A'); F=(C '#B87A5C'); I=(C '#7A3F2E'); W=(C '#EEE9DD'); T=(C '#9CC7E0'); E=(C '#CAC2C2')
          N=(C '#1C2A24'); K=(C '#6E8F80'); M=(C '#0A0A0A'); H=(C '#151515'); B=(C '#151515'); G=(C '#212121'); Y=(C '#34302C')
          Z=(C '#AC3232'); S=(C '#F2CE2E'); L=(C '#C9A11A'); X=(C '#2E2A26')       # S piel amarilla, L su sombra, X cejas
          C=(C '#8E8E8E'); Q=(C '#B4B4B4'); U=(C '#7E520E'); O=(C '#E05A20'); V=(C '#7F558F'); R=(C '#950C28') }   # pelo gris, puro, brasa, moretón y sangre
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: camisa verde del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Tony\Color_G\idle.png')
function ShirtMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '4E8A54'=(Mix $tc (C '#FFFFFF') 0.18); '41744A'=(Mix $tc (C '#FFFFFF') 0.05); '2F5634'=(Mix $tc (C '#000000') 0.22) }
}
function MakeIdle($tc) {
  $b = New-Object System.Drawing.Bitmap $green; $map = ShirtMap $tc
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $b.SetPixel($x, $y, $map[$k]) } } }
  , $b
}

# ---- gestos (coordenadas del idle; se desplazan con la pose) ----
# raw: pose propia dibujada sobre la del Mafioso · wipe: hasta esa fila se tapan con Tony las heridas del Mafioso (caerían fuera de su cara).
# Cara del idle de Tony: cejas fila 11 (cols 25-30 y 32-38), ojos filas 12-13 (26-29 y 34-37), nariz filas 14-17,
# boca fila 20 (29-34) con el puro desde la col 35. El puro se conserva en todas las poses.
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0); fx=@(@(20, 29, 'AWWWWA')) }                                                 # sonríe al cobrar
  rpg_sniper  = @{ d=@(14, 0); fx=@(@(12, 26, 'AAAA'), @(13, 26, 'SSS')) }                                  # cierra un ojo para apuntar
  rpg_tommy   = @{ d=@(14, 0); fx=@(@(12, 29, 'X'), @(12, 34, 'X'), @(20, 29, 'WAWWAW')) }                   # ceño y dientes apretados
  rpg_doctor  = @{ d=@(14, 0); wipe=26; fx=@(@(10, 29, 'X'), @(10, 34, 'X'), @(20, 29, 'LIIIIL'), @(13, 25, 'VVVVV'), @(14, 26, 'VVV')) }   # dolorido y con el ojo morado
  rpg_rat     = @{ d=@(0, 0); fx=@(@(12, 25, 'ANNNNAAAANNNNA'), @(13, 25, 'ANKNNA  ANKNNA'), @(14, 26, 'AAAA    AAAA')) }   # gafas oscuras
  maf_raid    = @{ d=@(0, 0); fx=@(@(12, 29, 'X'), @(12, 34, 'X'), @(20, 29, 'WAWWAW')) }                   # furioso
  pok_cheat   = @{ d=@(-2, 0); keepx=27; fx=@(@(12, 34, 'AAAA'), @(13, 34, 'SSSS'), @(10, 25, 'XXXXXX'), @(11, 25, 'SSSSSS')) }   # guiño y ceja arriba
  lose        = @{ d=@(0, 0); wipe=30; fx=@(@(11, 25, 'V'), @(13, 25, 'VVVVV'), @(14, 25, 'VVV'), @(18, 31, 'R'), @(19, 31, 'R'), @(21, 31, 'R'), @(22, 31, 'R'),   # ojo morado y nariz sangrando
                                    @(12, 26, 'AAAA'), @(13, 26, 'SSS'), @(12, 34, 'AAAA'), @(13, 35, 'SSS'),          # ojos cerrados
                                    @(14, 27, 'T'), @(15, 27, 'T'), @(14, 36, 'T'), @(15, 36, 'T'),                     # lágrimas
                                    @(9, 43, 'T'), @(10, 43, 'T')) }                                                     # sudor
  win         = @{ d=@(0, 0); keep=@('FBF236', 'AC3232', '90593F', '3E281D'); fx=@(@(10, 32, 'XXXXXXX'), @(11, 32, 'SSSSSSS'), @(20, 29, 'WWWWWW'), @(21, 29, 'AIIIIA')) }   # ceja arriba y gran sonrisa
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

# ---- coche: el convertible de los años 30 del Gordo Tony en Los Simpson (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches: capó largo con parrilla cromada y figura en la punta,
# guardabarros curvos con estribo, capota granate, ruedas de banda blanca, placa "001" y Tony al volante con su puro.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $top = C '#7A1E2A'; $topd = C '#5A1520'; $chrome = C '#D8D8D8'; $glass = C '#1E2A30'
  $poly = { param($brush, $pts) $g.FillPolygon((New-Object System.Drawing.SolidBrush $brush), [System.Drawing.Point[]]($pts | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] })) }
  & $poly $top   @(@(31,31),@(33,25),@(37,23),@(48,22),@(54,23),@(58,27),@(59,31))                       # capota
  & $poly $body  @(@(30,31),@(48,31),@(56,33),@(60,37),@(61,44),@(30,44))                                # cabina y cola
  & $poly $body  @(@(6,34),@(30,32),@(30,44),@(6,44))                                                    # capó
  & $poly $glass @(@(32,31),@(33,26),@(42,26),@(42,31))                                                  # ventanilla del conductor
  & $poly $body  @(@(3,46),@(4,41),@(8,37),@(14,36),@(20,37),@(24,40),@(27,46))                          # guardabarros delantero
  & $poly $body  @(@(38,46),@(40,40),@(45,37),@(52,37),@(57,40),@(59,46))                                # guardabarros trasero
  $pen = New-Object System.Drawing.Pen $dark, 1                                                            # curva de los guardabarros
  $g.DrawLines($pen, [System.Drawing.Point[]](@(@(4,41),@(8,37),@(14,36),@(20,37),@(24,40),@(27,45)) | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }))
  $g.DrawLines($pen, [System.Drawing.Point[]](@(@(38,45),@(40,40),@(45,37),@(52,37),@(57,40),@(59,45)) | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }))
  $g.Dispose()
  $isBody = { param($x, $y) $p = $b.GetPixel($x, $y); $p.A -ge 128 -and $p.ToArgb() -eq $body.ToArgb() }
  for ($x = 0; $x -lt 64; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  for ($x = 6; $x -le 29; $x++) { if (& $isBody $x 43) { $b.SetPixel($x, 43, $dark) } }                  # sombra bajo el capó
  for ($y = 32; $y -le 44; $y++) { $b.SetPixel(30, $y, $dark) }                                           # unión capó-cabina
  for ($y = 32; $y -le 44; $y++) { $b.SetPixel(43, $y, $dark) }; $b.SetPixel(41, 35, $chrome)             # puerta y manija
  foreach ($x in 17, 19, 21, 23, 25, 27) { for ($y = 34; $y -le 35; $y++) { $b.SetPixel($x, $y, $dark) } }   # rejillas del capó
  for ($y = 25; $y -le 31; $y++) { $b.SetPixel([int](33 - ($y - 25) / 3), $y, $chrome) }                 # marco del parabrisas
  for ($y = 25; $y -le 30; $y++) { for ($x = 54; $x -le 55; $x++) { if ($b.GetPixel($x, $y).ToArgb() -eq $top.ToArgb()) { $b.SetPixel($x, $y, $topd) } } }   # costura de la capota
  for ($x = 47; $x -le 51; $x++) { $b.SetPixel($x, 25, (C '#9CC7E0')); $b.SetPixel($x, 26, (C '#9CC7E0')) }   # ventanilla de la capota
  for ($x = 31; $x -le 58; $x++) { if ($b.GetPixel($x, 31).ToArgb() -eq $top.ToArgb()) { $b.SetPixel($x, 31, $topd) } }
  for ($y = 34; $y -le 43; $y++) { $b.SetPixel(4, $y, $chrome); $b.SetPixel(5, $y, (C '#8A8A8A')); $b.SetPixel(6, $y, $chrome) }   # parrilla
  foreach ($pt in @(@(7,36),@(8,36),@(7,37),@(8,37))) { $b.SetPixel($pt[0], $pt[1], $chrome) }; $b.SetPixel(7, 37, (C '#F2E6A0'))   # faro
  $b.SetPixel(6, 32, (C '#D9B54A')); $b.SetPixel(6, 33, (C '#D9B54A')); $b.SetPixel(7, 33, (C '#AC3232'))   # figura del capó
  for ($x = 1; $x -le 5; $x++) { $b.SetPixel($x, 45, $chrome) }; for ($x = 60; $x -le 62; $x++) { $b.SetPixel($x, 44, $chrome) }   # parachoques
  for ($x = 24; $x -le 40; $x++) { $b.SetPixel($x, 45, (C '#2A2A2A')); $b.SetPixel($x, 46, (C '#2A2A2A')) }   # estribo
  for ($x = 57; $x -le 59; $x++) { $b.SetPixel($x, 40, (C '#F2CE2E')); $b.SetPixel($x, 41, (C '#F2CE2E')) }; $b.SetPixel(58, 41, (C '#000000'))   # placa "001"
  $b.SetPixel(60, 38, (C '#AC3232'))                                                                          # piloto trasero
  foreach ($cx in 14, 49) { $cy = 47                                                                          # ruedas de banda blanca y radios
    for ($y = $cy - 7; $y -le [math]::Min(63, $cy + 7); $y++) { for ($x = $cx - 7; $x -le $cx + 7; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 6.4) { continue }
      $c = if ($d -le 1) { C '#5A5A5A' } elseif ($d -le 3.8) { $a = ([math]::Atan2($y - $cy, $x - $cx) / (2 * [math]::PI) * 8 + 8) % 1; if ($a -lt .4) { C '#8A8A8A' } else { C '#C8C8C8' } } elseif ($d -le 5) { C '#EEEEEE' } else { C '#141414' }
      $b.SetPixel($x, $y, $c) } } }
  $mini = @(@(26, 34, '.QCCQ'), @(27, 34, 'CCQCC'), @(28, 34, 'SASAS'), @(29, 34, 'SSLSS'), @(30, 34, 'SAAUUO'))   # Tony al volante
  Paint $b $mini 0 0
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Carrocería del coche verde (retocado por Darb) -> tonos del color del jugador (los mismos que usa MakeCar).
function CarMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '36613A'=$tc; '233F26'=(Mix $tc (C '#000000') 0.35); '729075'=(Mix $tc (C '#FFFFFF') 0.3) }
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la camisa.
$handmade = 'idle', 'exp_getaway', 'lose', 'pok_cheat', 'rpg_doctor', 'rpg_rat', 'rpg_sniper', 'rpg_tommy', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Tony\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Tony\Color_G\$n.png") (Join-Path $dir "$n.png") $(if ($n -eq 'exp_getaway') { CarMap $tc } else { ShirtMap $tc }) } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $out = New-Object System.Drawing.Bitmap $f
    if ($cfg.raw) { Paint $out $cfg.fx 0 0; $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose(); continue }   # pose propia sobre la del Mafioso
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $r = $me.GetPixel($x, $y); $ic = $base.GetPixel($x, $y)
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py); $ph = & $hex $pc
      $hat = $y -le 22 -and $x -ge 18 -and $x -le 46 -and (-not $cfg.keepx -or $px -ge $cfg.keepx) -and $pc.A -ge 128 -and $hatHex.ContainsKey($ph)   # sombrero del Mafioso (también ladeado)
      if ($ic.A -lt 128 -and -not $hat) { if ($r.A -ge 128 -and $pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }   # pelo y barriga: solo sobre fondo vacío
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
