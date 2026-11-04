param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "Sr. Fisk" (guiño a Kingpin): assets/characters/Fisk/<Color>/<pose>.png
# Base: assets/characters/Fisk/Color_G/idle.png (opción B retocada a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con el corbatín del color del jugador (lo único que cambia).
#  · poses: de cada pose del Mafioso se borra al Mafioso (quedan solo los objetos) y se dibuja a Fisk detrás de ellos.
#    Fisk es casi el doble de ancho, así que junto a un objeto se corre menos que el Mafioso ($poses.f) y el objeto le queda delante.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: limusina larga de los años 40 con banda blanca y Fisk al volante; carrocería del color del jugador.
# Uso: powershell -ExecutionPolicy Bypass -File generar_fisk.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); S=(C '#E0B49A'); D=(C '#B8866C'); K=(C '#F4D4C0'); L=(C '#B07060'); E=(C '#9A6A54'); W=(C '#F0EBDF')
          T=(C '#9CC7E0'); V=(C '#7F558F'); Z=(C '#950C28'); P=(C '#E8D0A0'); G=(C '#1C2A24'); Q=(C '#6E8F80')
          U=(C '#7E520E'); O=(C '#E05A20'); X=(C '#E8E4DA') }
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: corbatín verde del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Fisk\Color_G\idle.png')
function ShirtMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '36613A'=$tc; '24422A'=(Mix $tc (C '#000000') 0.33) }
}
function MakeIdle($tc) {
  $b = New-Object System.Drawing.Bitmap $green; $map = ShirtMap $tc
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $b.SetPixel($x, $y, $map[$k]) } } }
  , $b
}

# ---- gestos (coordenadas del idle de Fisk; se desplazan con la pose) ----
# Cara del idle: párpados fila 12, ojos fila 14 (cols 25-29 y 35-39), nariz filas 15-19, boca fila 22 (30-33).
$smile = @(@(21, 29, 'A    A'), @(22, 30, 'WWWW'), @(23, 30, 'AAAA'))
$teeth = @(@(21, 30, 'AAAA'), @(22, 30, 'WAWA'), @(23, 30, 'AAAA'))
# d: desplazamiento del Mafioso en su pose · f: desplazamiento de Fisk (menos, porque es enorme) · o: corrimiento de los objetos para que no tapen la cabeza · keep: rectángulo x0,y0,x1,y1 donde solo queda la ficha del póker (sus colores y su contorno) · mirror: columna central de la ficha; su mitad derecha (tapada por la cara del Mafioso) se completa reflejando la izquierda · wipe: borra entera la cabeza del Mafioso (con heridas)
$poses = @{
  exp_boxes   = @{ d=14; f=9 }
  exp_cover   = @{ d=15; f=10; o=-19 }                                                                    # el poste se corre para no taparle la cara
  exp_grenade = @{ d=14; f=9 }
  exp_vault   = @{ d=15; f=10 }
  maf_harvest = @{ d=14; f=9; fx=$smile }                                                                      # sonrisa al cobrar
  rpg_sniper  = @{ d=14; f=9; fx=@(@(13, 25, 'SSSS'), @(14, 25, 'DAAAA')) }                                      # cierra un ojo para apuntar
  rpg_tommy   = @{ d=14; f=9; fx=$teeth }                                                                      # dientes apretados
  rpg_doctor  = @{ d=14; f=9; wipe=$true; fx=@(@(15, 35, 'VVVV'), @(16, 36, 'VV'), @(6, 30, 'PPPP'), @(5, 31, 'PP'), @(7, 31, 'PP')) }   # moretón y curita en la calva
  rpg_rat     = @{ d=0; f=0; fx=@(@(13, 24, 'AGGGGGAAAAAGGGGGA'), @(14, 24, 'AGQGGG     GQGGGA'), @(15, 25, 'AAAAA     AAAAA')) }   # lentes oscuros
  maf_raid    = @{ d=0; f=0; fx=$teeth }                                                                       # furioso
  pok_cheat   = @{ d=-2; f=0; o=-5; keep=@(8, 14, 25, 32); mirror=17; fx=@(@(13, 35, 'SSSS'), @(14, 35, 'AAAAE'), @(11, 25, 'DDDD')) }        # guiño y ceja arriba
  lose        = @{ d=0; f=0; fx=@(@(14, 25, 'DAAAD'), @(14, 35, 'DAAAD'), @(13, 24, 'VVVVV'), @(15, 24, 'VVVV'),   # ojos cerrados y ojo morado
                                  @(20, 31, 'Z'), @(21, 31, 'Z'), @(23, 31, 'Z'), @(24, 31, 'Z'),                    # nariz sangrando
                                  @(15, 27, 'T'), @(16, 27, 'T'), @(15, 37, 'T'), @(16, 37, 'T'), @(6, 42, 'T'), @(7, 42, 'T')) }   # lágrimas y sudor
  win         = @{ d=0; f=0; fx=($smile + @(@(21, 35, 'AAAAAA'), @(22, 34, 'AUUUUOA'), @(23, 35, 'AAAAAA'))) }    # sonrisa con puro (el humo es del Mafioso)
}
# ---- colores del Mafioso (para reconocerlo dentro de cada pose) ----
$idleHex = @{}
foreach ($k in $cols.Keys) { $m = New-Object System.Drawing.Bitmap (Join-Path $Root "assets\characters\Mafioso\$k\idle.png")
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $m.GetPixel($x, $y); if ($p.A -ge 128) { $idleHex[(& $hex $p)] = 1 } } }; $m.Dispose() }
'0F0F0F','161616','90593F','3E281D','FBF236','AC3232','FFFFFF' | ForEach-Object { $idleHex[$_] = 1 }      # sombras, puro y dientes del Mafioso
$mafHex = @{ 'A06346'=1; '945D44'=1; '7B4E38'=1; '3E281D'=1; '90593F'=1; '151515'=1; '252525'=1; '0C0C0C'=1; '0F0F0F'=1; '161616'=1; 'FFFFFF'=1; 'E2DEDE'=1; 'DADADA'=1 }   # piel, bigote, saco y camisa del Mafioso
$hatHex = @{ '0C0C0C'=1; '252525'=1; '151515'=1; '000000'=1; '0F0F0F'=1; '161616'=1 }
$ties = $cols.Values | ForEach-Object { C $_ }
function IsChar($pc, $ph) {
  if ($idleHex.ContainsKey($ph)) { return $true }
  foreach ($t in $ties) { if ([math]::Abs($pc.R - $t.R) + [math]::Abs($pc.G - $t.G) + [math]::Abs($pc.B - $t.B) -le 30) { return $true } }
  $false
}

# ---- coche: limusina de los años 40 (Fisk no cabe en un coche normal) ----
# Vista lateral mirando a la izquierda como los demás coches: capó largo con figura dorada, techo bajo, moldura cromada,
# ruedas de banda blanca y Fisk al volante, calvo y de traje blanco.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $glass = C '#2A3A44'; $chrome = C '#D8D8D8'
  $pts = { param($a) [System.Drawing.Point[]]($a | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }) }
  $fill = { param($c, $a) $g.FillPolygon((New-Object System.Drawing.SolidBrush $c), (& $pts $a)) }
  & $fill $body  @(@(1,38),@(4,35),@(20,34),@(25,27),@(50,27),@(56,33),@(62,36),@(62,47),@(1,47))        # carrocería
  & $fill $glass @(@(26,34),@(29,29),@(39,29),@(39,34))                                                   # ventanillas
  & $fill $glass @(@(41,29),@(49,29),@(53,34),@(41,34))
  $g.Dispose()
  for ($x = 1; $x -le 62; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  for ($y = 29; $y -le 46; $y++) { $b.SetPixel(40, $y, $dark) }                                           # puerta
  $b.SetPixel(37, 37, $chrome)                                                                             # manija
  for ($x = 2; $x -le 61; $x++) { $b.SetPixel($x, 41, $chrome) }                                          # moldura cromada
  foreach ($x in 9, 11, 13, 15, 17) { for ($y = 36; $y -le 38; $y++) { $b.SetPixel($x, $y, $dark) } }     # rejillas del capó
  for ($y = 42; $y -le 46; $y++) { $b.SetPixel(0, $y, $chrome); $b.SetPixel(1, $y, $chrome); $b.SetPixel(62, $y, $chrome); $b.SetPixel(63, $y, $chrome) }   # parachoques
  $b.SetPixel(2, 38, (C '#F2E6A0')); $b.SetPixel(3, 38, (C '#F2E6A0'))                                    # faro
  $b.SetPixel(4, 33, (C '#D9B54A')); $b.SetPixel(4, 34, (C '#D9B54A'))                                    # figura dorada del capó
  $b.SetPixel(61, 38, (C '#AC3232')); $b.SetPixel(61, 39, (C '#AC3232'))                                  # piloto trasero
  foreach ($cx in 13, 50) { $cy = 47                                                                       # pasos de rueda y ruedas de banda blanca
    for ($y = $cy - 8; $y -le [math]::Min(63, $cy + 8); $y++) { for ($x = $cx - 8; $x -le $cx + 8; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 7.5 -or $x -lt 0 -or $x -gt 63) { continue }
      $c = if ($d -gt 6.5) { if ($y -le $cy) { C '#0A0A0A' } else { $null } } elseif ($d -le 1) { C '#5A5A5A' } elseif ($d -le 3) { C '#C8C8C8' } elseif ($d -le 4.6) { C '#EEEEEE' } else { C '#141414' }
      if ($c) { $b.SetPixel($x, $y, $c) } } } }
  $mini = @(@(29, 31, 'AAAA'), @(30, 30, 'AKKSSA'), @(31, 29, 'ASSSSSSA'), @(32, 29, 'ASASSASA'), @(33, 29, 'ASSSSSSA'), @(34, 29, 'XXSAASXX'))   # Fisk al volante
  Paint $b $mini 0 0
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo el corbatín.
$handmade = 'idle', 'lose', 'rpg_rat', 'rpg_tommy', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Fisk\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Fisk\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $out = New-Object System.Drawing.Bitmap $f
    # 1) fuera el Mafioso (sus colores, o la cabeza entera con wipe); los objetos se quedan
    $orig = New-Object System.Drawing.Bitmap $out
    $isObj = { param($x, $y) if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64) { return $false }; $q = $orig.GetPixel($x, $y); $q.A -ge 128 -and (& $hex $q) -ne '000000' -and -not $mafHex.ContainsKey((& $hex $q)) }
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $px = $x + $cfg.d; if ($px -lt 0 -or $px -ge 64) { continue }
      $inKeep = $cfg.keep -and $px -ge $cfg.keep[0] -and $px -le $cfg.keep[2] -and $y -ge $cfg.keep[1] -and $y -le $cfg.keep[3]
      $pc = $out.GetPixel($px, $y); if ($pc.A -lt 128) { continue }
      $ic = $base.GetPixel($x, $y); $ph = & $hex $pc
      $hat = $y -le 22 -and $x -ge 18 -and $x -le 46 -and $hatHex.ContainsKey($ph)                         # sombrero (también ladeado)
      if ($inKeep) { $keepIt = (& $isObj $px $y) -or ($ph -eq '000000' -and ((& $isObj ($px-1) $y) -or (& $isObj ($px+1) $y) -or (& $isObj $px ($y-1)) -or (& $isObj $px ($y+1))))
        if (-not $keepIt) { $out.SetPixel($px, $y, $T) }; continue }   # en la ficha solo quedan sus colores y su contorno
      if ($hat -or ($ic.A -ge 128 -and (($cfg.wipe -and $y -le 26) -or $pc.ToArgb() -eq $ic.ToArgb() -or (IsChar $pc $ph)))) { $out.SetPixel($px, $y, $T) }
    } }
    if ($cfg.mirror) { $c0 = $cfg.mirror; for ($y = $cfg.keep[1]; $y -le $cfg.keep[3]; $y++) { for ($x = $c0 + 1; $x -le 2 * $c0 - $cfg.keep[0]; $x++) {
      $out.SetPixel($x, $y, $out.GetPixel(2 * $c0 - $x, $y)) } } }
    if ($cfg.o) {                                                                                       # objetos corridos (sin salirse del cuadro)
      $mv = New-Object System.Drawing.Bitmap 64, 64
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
        $nx = $x + $cfg.o; if ($nx -lt 0 -or $nx -ge 64) { throw "${n}: el objeto se sale del cuadro" }; $mv.SetPixel($nx, $y, $p) } }
      $out.Dispose(); $out = $mv }
    # 2) Fisk detrás de los objetos
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $r = $me.GetPixel($x, $y); if ($r.A -lt 128) { continue }
      $px = $x + $cfg.f; if ($px -lt 0 -or $px -ge 64) { continue }
      if ($out.GetPixel($px, $y).A -lt 128) { $out.SetPixel($px, $y, $r) } } }
    if ($cfg.fx) { Paint $out $cfg.fx $cfg.f 0 }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$green.Dispose()
"ok"
