param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "Don Vito" (guiño a El Padrino): assets/characters/Vito/<Color>/<pose>.png
# Base: assets/characters/Vito/Color_G/idle.png (opción A retocada a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con la rosa de la solapa del color del jugador (lo único que cambia).
#  · poses: de cada pose del Mafioso se borra al Mafioso (quedan solo los objetos) y se dibuja a Don Vito detrás de ellos.
#    Los objetos que le taparían la cabeza se corren ($poses.o) o se completan, y nunca se salen del cuadro.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: la limusina Lincoln de 1941 con faldón trasero y Don Vito al volante; carrocería del color del jugador.
# Uso: powershell -ExecutionPolicy Bypass -File generar_vito.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); S=(C '#D0A080'); D=(C '#A87858'); L=(C '#9A5A48'); H=(C '#9A9A9A'); R=(C '#4A4440'); M=(C '#5A5048')
          W=(C '#F0EBDF'); T=(C '#9CC7E0'); V=(C '#6A3A5A'); Z=(C '#950C28'); P=(C '#E8D0A0'); G=(C '#1C2A24'); Q=(C '#6E8F80') }
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: rosa verde del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Vito\Color_G\idle.png')
function ShirtMap($tc) {
  if ((& $hex $tc) -eq '36613A') { return @{} }
  @{ '4E8A54'=(Mix $tc (C '#FFFFFF') 0.18); '36613A'=$tc; '24422A'=(Mix $tc (C '#000000') 0.33) }
}
function MakeIdle($tc) {
  $b = New-Object System.Drawing.Bitmap $green; $map = ShirtMap $tc
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $b.SetPixel($x, $y, $map[$k]) } } }
  , $b
}

# ---- gestos (coordenadas del idle de Don Vito; se desplazan con la pose) ----
# Cara del idle: ojos fila 13 (cols 26-28 y 35-37), nariz filas 14-18, boca abierta filas 19-21 (29-36) y labio fila 22.
$teeth = @(@(20, 29, 'AWWWWWWA'), @(21, 29, 'AAAAAAAA'))
# d: desplazamiento del Mafioso en su pose (Don Vito va en el mismo lugar) · o: corrimiento de los objetos para que no tapen la cabeza
# keep: rectángulo x0,y0,x1,y1 donde solo queda la ficha del póker · mirror: columna central de la ficha, para completarla
# wipe: borra entera la cabeza del Mafioso · clear: rectángulo x0,y0,x1,y1 que se vacía (el humo del puro del Mafioso)
$poses = @{
  exp_boxes   = @{ d=14; f=14 }
  exp_cover   = @{ d=15; f=15; o=-19 }                                                                    # el poste se corre para no taparle la cara
  exp_grenade = @{ d=14; f=14 }
  exp_vault   = @{ d=15; f=15 }
  maf_harvest = @{ d=14; f=14; fx=@(@(11, 26, 'RRR'), @(11, 35, 'RRR')) }                                  # cejas alzadas al cobrar
  rpg_sniper  = @{ d=14; f=14; fx=@(@(12, 26, 'SSS'), @(13, 26, 'AAA')) }                                  # cierra un ojo para apuntar
  rpg_tommy   = @{ d=14; f=14; fx=$teeth }                                                                 # dientes apretados
  rpg_doctor  = @{ d=14; f=14; wipe=$true; fx=@(@(14, 35, 'VVV'), @(15, 35, 'VV'), @(8, 31, 'PPPP'), @(7, 32, 'PP'), @(9, 32, 'PP')) }   # moretón y curita en la frente
  rpg_rat     = @{ d=0; f=0; fx=@(@(12, 25, 'AAAAA    AAAAA'), @(13, 24, 'AGGGGGAAAAGGGGGA'), @(14, 24, 'AGQGGG    GQGGGA'), @(15, 25, 'AAAAA    AAAAA')) }   # lentes oscuros
  maf_raid    = @{ d=0; f=0; fx=$teeth }                                                                  # furioso
  pok_cheat   = @{ d=-2; f=0; o=-5; keep=@(8, 14, 25, 32); mirror=17; fx=@(@(12, 35, 'SSS'), @(13, 35, 'AAA'), @(11, 25, 'RRRR')) }   # guiño y ceja arriba
  lose        = @{ d=0; f=0; fx=@(@(13, 26, 'AAA'), @(13, 35, 'AAA'), @(14, 25, 'VVV'),                      # ojos cerrados y ojo morado
                                  @(22, 32, 'Z'), @(23, 32, 'Z'),                                                # sangre en la boca
                                  @(14, 27, 'T'), @(15, 27, 'T'), @(16, 44, 'T'), @(17, 44, 'T')) }             # lágrima y sudor
  win         = @{ d=0; f=0; clear=@(42, 0, 63, 36); fx=@(@(12, 26, 'SSS'), @(13, 26, 'AAA'), @(12, 35, 'SSS'), @(13, 35, 'AAA')) }   # ojos cerrados, satisfecho (él no fuma: sin el humo del Mafioso)
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

# ---- coche: la limusina Lincoln de 1941 de la película (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches: techo alto con tres ventanillas, capó largo con parrilla
# cromada vertical, guardabarros delantero redondo con faro encima, guardabarros trasero con faldón que tapa media rueda,
# estribo, moldura y parachoques cromados, ruedas de banda blanca y Don Vito al volante.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $glass = C '#2A3A44'; $chrome = C '#D8D8D8'
  $pts = { param($a) [System.Drawing.Point[]]($a | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }) }
  $fill = { param($gr, $c, $a) $gr.FillPolygon((New-Object System.Drawing.SolidBrush $c), (& $pts $a)) }
  & $fill $g $body  @(@(20,33),@(23,26),@(27,23),@(50,23),@(55,26),@(59,33),@(61,36),@(62,44),@(8,44),@(4,40),@(5,36),@(20,34))   # cabina alta, capó y maletero
  & $fill $g $body  @(@(1,45),@(2,40),@(6,36),@(13,34),@(20,35),@(25,40),@(27,45))                          # guardabarros delantero
  & $fill $g $glass @(@(21,33),@(25,26),@(28,25),@(28,33))                                                  # parabrisas
  & $fill $g $glass @(@(30,25),@(38,25),@(38,33),@(30,33))                                                  # tres ventanillas
  & $fill $g $glass @(@(40,25),@(48,25),@(48,33),@(40,33))
  & $fill $g $glass @(@(50,25),@(53,26),@(56,33),@(50,33))
  $g.Dispose()
  for ($x = 1; $x -le 62; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  foreach ($cx in 14, 51) { $cy = 47                                                                       # ruedas de banda blanca
    for ($y = $cy - 7; $y -le [math]::Min(63, $cy + 7); $y++) { for ($x = $cx - 7; $x -le $cx + 7; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 6.4) { continue }
      $c = if ($d -le 0.5) { C '#B0302A' } elseif ($d -le 1.5) { C '#8A8A8A' } elseif ($d -le 2.6) { C '#C8C8C8' } elseif ($d -le 4.6) { C '#EEEEEE' } else { C '#141414' }
      $b.SetPixel($x, $y, $c) } } }
  $g = [System.Drawing.Graphics]::FromImage($b); $g.SmoothingMode = 'None'
  & $fill $g $body @(@(41,46),@(43,39),@(49,36),@(56,36),@(60,39),@(62,46))                                # faldón trasero que tapa media rueda
  & $fill $g (C '#2A2A2A') @(@(26,44),@(42,44),@(42,46),@(26,46))                                          # estribo
  $g.Dispose()
  $pen = New-Object System.Drawing.Pen $dark, 1; $gg = [System.Drawing.Graphics]::FromImage($b)          # curvas de los guardabarros
  $gg.DrawLines($pen, (& $pts @(@(2,40),@(6,36),@(13,34),@(20,35),@(25,40),@(27,44))))
  $gg.DrawLines($pen, (& $pts @(@(41,45),@(43,39),@(49,36),@(56,36),@(60,39),@(62,45)))); $gg.Dispose()
  for ($y = 24; $y -le 43; $y++) { $b.SetPixel(39, $y, $dark); $b.SetPixel(49, $y, $dark) }                 # puertas
  $b.SetPixel(36, 36, $chrome); $b.SetPixel(46, 36, $chrome)                                               # manijas
  for ($x = 21; $x -le 60; $x++) { $b.SetPixel($x, 38, $chrome) }; for ($x = 26; $x -le 42; $x++) { $b.SetPixel($x, 44, $chrome) }   # moldura y canto del estribo
  for ($y = 37; $y -le 44; $y++) { $b.SetPixel(3, $y, $chrome); $b.SetPixel(4, $y, (C '#8A8A8A')); $b.SetPixel(5, $y, $chrome) }      # parrilla vertical
  foreach ($pt in @(@(7,35),@(8,35),@(7,36),@(8,36))) { $b.SetPixel($pt[0], $pt[1], (C '#F2E6A0')) }; $b.SetPixel(9, 35, $chrome)     # faro sobre el guardabarros
  for ($x = 0; $x -le 6; $x++) { $b.SetPixel($x, 46, $chrome) }; $b.SetPixel(2, 45, $chrome); $b.SetPixel(5, 45, $chrome)            # parachoques con defensas
  for ($x = 59; $x -le 63; $x++) { $b.SetPixel($x, 45, $chrome) }
  $b.SetPixel(61, 37, (C '#AC3232'))                                                                       # piloto trasero
  $mini = @(@(26, 32, 'AAAA'), @(27, 31, 'AHHHHA'), @(28, 31, 'AHSSSA'), @(29, 31, 'ASASSA'), @(30, 31, 'ASSSSA'), @(31, 31, 'AMMMSA'), @(32, 31, 'ASSSSA'))   # Don Vito al volante
  Paint $b $mini 0 0
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}
# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la rosa.
$handmade = @('idle')
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Vito\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Vito\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
  foreach ($n in $poses.Keys) {
    if ($handmade -contains $n) { continue }
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $out = New-Object System.Drawing.Bitmap $f
    # 1) fuera el Mafioso (sus colores, o la cabeza entera con wipe); los objetos se quedan
    if ($cfg.clear) { for ($y = $cfg.clear[1]; $y -le $cfg.clear[3]; $y++) { for ($x = $cfg.clear[0]; $x -le $cfg.clear[2]; $x++) { $out.SetPixel($x, $y, $T) } } }
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
    if ($cfg.rot) {                                                                                     # objeto girado rot grados a la izquierda y llevado a su centro "at"
      $pts = @(); for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($out.GetPixel($x, $y).A -ge 128) { $pts += ,@($x, $y) } } }
      $cx = ($pts | % { $_[0] } | Measure-Object -Average).Average; $cy = ($pts | % { $_[1] } | Measure-Object -Average).Average
      $tx = if ($cfg.at) { $cfg.at[0] } else { $cx }; $ty = if ($cfg.at) { $cfg.at[1] } else { $cy }
      $ca = [math]::Cos($cfg.rot * [math]::PI / 180); $sa = [math]::Sin($cfg.rot * [math]::PI / 180)
      $rt = New-Object System.Drawing.Bitmap 64, 64
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {                                   # se recorre el destino para no dejar huecos
        $dx = $x - $tx; $dy = $y - $ty; $sx = [int][math]::Round($cx + $dx * $ca - $dy * $sa); $sy = [int][math]::Round($cy + $dx * $sa + $dy * $ca)
        if ($sx -lt 0 -or $sx -ge 64 -or $sy -lt 0 -or $sy -ge 64) { continue }
        $p = $out.GetPixel($sx, $sy); if ($p.A -ge 128) { $rt.SetPixel($x, $y, $p) } } }
      foreach ($q in $pts) { $dx = $q[0] - $cx; $dy = $q[1] - $cy                                       # ninguna punta del objeto puede quedar fuera del cuadro
        $nx = $tx + $dx * $ca + $dy * $sa; $ny = $ty - $dx * $sa + $dy * $ca
        if ($nx -lt -0.5 -or $nx -ge 63.5 -or $ny -lt -0.5 -or $ny -ge 63.5) { throw "${n}: el objeto girado se sale del cuadro" } }
      $out.Dispose(); $out = $rt }
    if ($cfg.o) {                                                                                       # objetos corridos (sin salirse del cuadro)
      $mv = New-Object System.Drawing.Bitmap 64, 64
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
        $nx = $x + $cfg.o; if ($nx -lt 0 -or $nx -ge 64) { throw "${n}: el objeto se sale del cuadro" }; $mv.SetPixel($nx, $y, $p) } }
      $out.Dispose(); $out = $mv }
    if ($cfg.front) {                                                                                   # 2) objeto por delante: Don Vito primero y el objeto encima
      $obj = $out; $out = New-Object System.Drawing.Bitmap 64, 64
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $r = $me.GetPixel($x, $y); $px = $x + $cfg.f; if ($r.A -ge 128 -and $px -ge 0 -and $px -lt 64) { $out.SetPixel($px, $y, $r) } } }
      if ($cfg.fx) { Paint $out $cfg.fx $cfg.f 0 }
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $obj.GetPixel($x, $y); if ($p.A -ge 128) { $out.SetPixel($x, $y, $p) } } }
      $obj.Dispose()
    } else {
      # 2) Don Vito detrás de los objetos
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $r = $me.GetPixel($x, $y); if ($r.A -lt 128) { continue }
        $px = $x + $cfg.f; if ($px -lt 0 -or $px -ge 64) { continue }
        if ($out.GetPixel($px, $y).A -lt 128) { $out.SetPixel($px, $y, $r) } } }
      if ($cfg.fx) { Paint $out $cfg.fx $cfg.f 0 }
    }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
  }
  $base.Dispose(); $me.Dispose()
}
$green.Dispose()
"ok"
