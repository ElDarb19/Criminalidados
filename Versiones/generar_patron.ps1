param([string]$Root)
# Genera "El Patrón" en todos los colores: assets/characters/Patron/<Color>/<pose>.png
# Base: assets/characters/Patron/Color_G/idle.png (retocado a mano por Darb; no se sobrescribe).
#  · idle de los demás colores: misma imagen con la camisa del color del jugador.
#  · poses: cada pose del Mafioso del mismo color, cambiando al Mafioso por el Patrón (los objetos se conservan).
#    Como el Patrón no lleva sombrero, se borra el del Mafioso y cada pose tiene su gesto propio.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: Porsche 911 RSR IROC (1974) dibujado por código, del color del jugador y con él al volante.
# Uso: powershell -ExecutionPolicy Bypass -File generar_patron.ps1 -Root <carpeta del juego>
Add-Type -AssemblyName System.Drawing
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); D=(C '#C5937A'); F=(C '#B87A5C'); I=(C '#7A3F2E'); W=(C '#EEE9DD'); T=(C '#9CC7E0'); E=(C '#CAC2C2')
          N=(C '#1C2A24'); K=(C '#6E8F80'); M=(C '#0A0A0A'); H=(C '#151515'); B=(C '#151515'); G=(C '#212121'); Y=(C '#34302C')
          U=(C '#5A3A20'); V=(C '#8E5C34'); Q=(C '#D9B54A'); O=(C '#B08850'); R=(C '#7A5A30'); S=(C '#2E6B35'); P=(C '#5FA066'); Z=(C '#AC3232'); J=(C '#5A524A') }
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: camisa verde del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Patron\Color_G\idle.png')
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
# Cara del idle: cejas fila 18 (cols 26-29 y 34-37), ojos fila 19 (27-29 y 34-36), bigote filas 23-25, labios fila 25 (29-34).
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0); fx=@(@(25, 29, 'DWWWWD')) }                                                # sonríe al cobrar
  rpg_sniper  = @{ d=@(14, 0); fx=@(@(19, 27, 'AAA')) }                                                   # cierra un ojo para apuntar
  rpg_tommy   = @{ d=@(14, 0); fx=@(@(19, 29, 'A'), @(19, 34, 'A'), @(25, 29, 'WAWWAW')) }                 # ceño y dientes apretados
  rpg_doctor  = @{ d=@(14, 0); fx=@(@(17, 29, 'A'), @(17, 34, 'A'), @(25, 29, 'DIIIID')) }                 # dolorido (moretón y sangre del original se conservan)
  rpg_rat     = @{ d=@(0, 0); fx=@(@(19, 25, 'ANNNNAAAANNNNA'), @(20, 25, 'ANKNNA  ANKNNA'), @(21, 26, 'AAAA    AAAA'), @(25, 29, 'DDDIII')) }   # gafas oscuras y media sonrisa
  maf_raid    = @{ d=@(0, 0); fx=@(@(19, 29, 'A'), @(19, 34, 'A'), @(25, 29, 'WAWWAW')) }                  # furioso
  pok_cheat   = @{ d=@(-2, 0); keepx=27; fx=@(@(19, 34, 'AAA'), @(17, 26, 'AAAA'), @(18, 26, 'DDDD'), @(25, 29, 'DDIIII'), @(26, 34, 'I')) }   # guiño (la ficha tapa su lado izquierdo), ceja arriba y sonrisa torcida
  lose        = @{ d=@(0, 0); fx=@(@(17, 29, 'A'), @(17, 34, 'A'), @(18, 29, 'D'), @(18, 34, 'D'),
                                    @(19, 27, 'AAA'), @(19, 34, 'AAA'), @(20, 28, 'T'), @(21, 28, 'T'), @(20, 35, 'T'),         # ojos cerrados y lágrimas
                                    @(25, 29, 'DIIIID'), @(26, 29, 'I'), @(26, 34, 'I'),                                       # boca triste
                                    @(15, 38, 'T'), @(16, 38, 'T')) }                                                           # sudor
  win         = @{ d=@(0, 0); keep=@('FBF236', 'AC3232', '90593F', '3E281D'); fx=@(@(18, 34, 'DDDD'), @(17, 34, 'AAAA'), @(25, 29, 'WWWWWW'), @(26, 34, 'AUVQVZ'), @(27, 35, 'AAAAA')) }   # puro, ceja arriba y gran sonrisa
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

# ---- coche: Porsche 911 RSR IROC (1974), el que tuvo Escobar (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches: alerón "cola de ballena", aletas anchas,
# franja negra lateral, panel blanco del piloto en la puerta, llantas de 5 radios y él al volante.
function MakePorsche($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $pts = @(@(2,44),@(2,39),@(5,37),@(10,36),@(16,35),@(22,34),@(28,28),@(38,27),@(44,29),@(50,33),@(54,33),@(56,31),@(62,30),@(62,33),@(60,35),@(61,37),@(61,44),@(57,45),@(7,45)) | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }
  $g.FillPolygon((New-Object System.Drawing.SolidBrush $body), [System.Drawing.Point[]]$pts)
  $win = @(@(24,33),@(29,29),@(37,28),@(43,30),@(46,33)) | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }
  $g.FillPolygon((New-Object System.Drawing.SolidBrush (C '#1E2A30')), [System.Drawing.Point[]]$win)
  $g.Dispose()
  $W = 64
  $isBody = { param($x, $y) $p = $b.GetPixel($x, $y); $p.A -ge 128 -and $p.ToArgb() -eq $body.ToArgb() }
  for ($x = 0; $x -lt $W; $x++) { for ($y = 0; $y -lt 64; $y++) { if (& $isBody $x $y) { $b.SetPixel($x, $y, $lite); break } } }   # brillo en el borde superior
  for ($y = 44; $y -le 45; $y++) { for ($x = 0; $x -lt $W; $x++) { if (& $isBody $x $y) { $b.SetPixel($x, $y, $dark) } } }   # bajos en sombra
  for ($y = 28; $y -le 33; $y++) { $b.SetPixel(38, $y, $body) }                                          # pilar entre ventanillas
  foreach ($xy in @(@(26,32),@(27,31),@(39,29),@(40,30))) { $b.SetPixel($xy[0], $xy[1], (C '#4A6070')) }  # reflejos del cristal
  for ($x = 21; $x -le 42; $x++) { $b.SetPixel($x, 41, $pal['B']); $b.SetPixel($x, 42, $pal['B']) }   # franja lateral negra (la de "PORSCHE")
  foreach ($x in 23, 26, 29, 32, 35, 38) { $b.SetPixel($x, 41, $dark) }                                  # letras caladas, apenas insinuadas
  for ($y = 36; $y -le 37; $y++) { for ($x = 27; $x -le 37; $x++) { $b.SetPixel($x, $y, $pal['W']) } }   # panel blanco del piloto
  foreach ($x in 28, 29, 31, 32, 34, 36) { $b.SetPixel($x, 37, $pal['B']) }
  $b.SetPixel(42, 36, $pal['W']); $b.SetPixel(43, 36, $pal['Z']); $b.SetPixel(44, 36, (C '#264385'))     # insignia IROC
  # ruedas: hueco, neumático y llanta de 5 radios
  foreach ($cx in 13, 50) { $cy = 46
    for ($y = $cy - 7; $y -le $cy + 7; $y++) { for ($x = $cx - 7; $x -le $cx + 7; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($y -lt 0 -or $y -ge 64) { continue }
      if ($d -le 6.4) { $c = if ($d -le 0.8) { C '#8A8A8A' } elseif ($d -le 3.6) { $a = ([math]::Atan2($y - $cy, $x - $cx) / (2 * [math]::PI) * 5 + 5.25) % 1; if ($a -lt .34) { C '#C8C8C8' } else { C '#262626' } } elseif ($d -le 4.5) { C '#BDBDBD' } else { C '#141414' }; $b.SetPixel($x, $y, $c) }   # llanta Fuchs: 5 radios plateados
      elseif ($d -le 7.4 -and $y -le $cy -and (& $isBody $x $y -or $b.GetPixel($x, $y).ToArgb() -eq $dark.ToArgb())) { $b.SetPixel($x, $y, (C '#101010')) }   # paso de rueda
      elseif ($d -le 8.5 -and $y -lt $cy - 3 -and (& $isBody $x $y)) { $b.SetPixel($x, $y, $lite) }                                                      # aleta ensanchada
    } } }
  $b.SetPixel(7, 36, (C '#F2E6A0')); $b.SetPixel(8, 36, (C '#F2E6A0'))                                    # faro
  $b.SetPixel(3, 40, (C '#E07A1F'))                                                                         # intermitente
  $b.SetPixel(61, 38, $pal['Z']); $b.SetPixel(61, 39, $pal['Z'])                                            # piloto trasero
  for ($x = 2; $x -le 8; $x++) { $b.SetPixel($x, 44, (C '#2A2A2A')) }                                       # spoiler delantero
  Paint $b @(@(29, 30, 'YJYJY'), @(30, 30, 'JDDDY'), @(31, 30, 'DADDJ'), @(32, 30, 'MMMDD'), @(33, 31, 'DDD')) 0 0   # él al volante (pelo con brillo para que se vea sobre el cristal)
  # contorno negro alrededor de todo lo dibujado
  $o = New-Object System.Drawing.Bitmap $b
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la camisa.
$handmade = 'idle', 'pok_cheat', 'rpg_rat', 'rpg_tommy', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in 'Color_R','Color_B','Color_G','Color_P','Color_Pu','Color_W') {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Patron\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  MakePorsche $tc (Join-Path $dir 'exp_getaway.png')
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Patron\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
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
      if ($ic.A -lt 128 -and -not $hat) { if ($r.A -ge 128 -and $pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }   # pelo y barriga: solo sobre fondo vacío
      if ($pc.A -lt 128) { continue }                                                                       # el personaje está recortado aquí
      if ($hat -or $pc.ToArgb() -eq $ic.ToArgb() -or (IsChar $pc $ph $cfg.keep)) { if ($r.A -ge 128) { $out.SetPixel($px, $py, $r) } else { $out.SetPixel($px, $py, $T) } }
      # cualquier otro color (objetos, moretones, sangre, humo) se queda
    } }
    if ($cfg.fx) { Paint $out $cfg.fx $dx $dy }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$green.Dispose()
"ok"
