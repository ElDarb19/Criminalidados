param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "Sr. Montana" (guiño a Scarface): assets/characters/Montana/<Color>/<pose>.png
# Base: assets/characters/Montana/Color_G/idle.png (opción A retocada a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con la camisa y el pañuelo del color del jugador (lo único que cambia).
#  · poses: de cada pose del Mafioso se borra al Mafioso (quedan solo los objetos) y se dibuja a Montana detrás de ellos.
#    Los objetos que le taparían la cabeza se corren ($poses.o) o se completan, y nunca se salen del cuadro.
#  · rpg_tommy: la mueca de la película (un ojo cerrado y los dientes apretados); win: un habano cubano.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
#  · coche: el Cadillac convertible de los 60 con aletas traseras y asientos de cebra; carrocería del color del jugador.
# Uso: powershell -ExecutionPolicy Bypass -File generar_montana.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
Add-Type -AssemblyName System.Drawing
$Colors = @($Colors | ForEach-Object { $_ -split ',' } | Where-Object { $_ })      # admite 'Color_R,Color_B' desde la línea de comandos
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9'; Color_Y='#D9A520' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$T = [System.Drawing.Color]::Transparent
# Solo mayúsculas: las claves de PowerShell no distinguen mayúsculas de minúsculas.
$pal = @{ A=(C '#000000'); S=(C '#C08A68'); D=(C '#9A6A4E'); L=(C '#8A5040'); H=(C '#2A1C14'); R=(C '#1E140E'); W=(C '#F0EBDF')
          I=(C '#E8E4DA'); C=(C '#E8E4DA'); T=(C '#9CC7E0'); V=(C '#6A3A5A'); Z=(C '#950C28'); P=(C '#E8D0A0'); G=(C '#1C2A24'); Q=(C '#6E8F80')
          U=(C '#6A3E1A'); M=(C '#D9B54A'); O=(C '#E05A20'); B=(C '#EEEEEE') }    # U habano, M su anillo dorado, B rayas claras de la cebra
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: camisa y pañuelo verdes del retoque -> tonos del color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Montana\Color_G\idle.png')
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

# ---- gestos (coordenadas del idle de Montana; se desplazan con la pose) ----
# Cara del idle: cejas fila 12, párpados fila 13 (cols 26-29 y 33-36), ojos fila 14, boca fila 21 (30-33) y labio fila 22.
$smile = @(@(20, 29, 'A    A'), @(21, 30, 'WWWW'), @(22, 30, 'AAAA'))
$teeth = @(@(20, 29, 'AAAAAA'), @(21, 29, 'AWAWAW'), @(22, 29, 'AAAAAA'))
# d: desplazamiento del Mafioso en su pose (Montana va en el mismo lugar) · rot: grados que se gira el objeto a la izquierda · at: dónde queda su centro · front: el objeto va por delante del personaje · o: corrimiento de los objetos para que no tapen la cabeza
# keep: rectángulo x0,y0,x1,y1 donde solo queda la ficha del póker · mirror: columna central de la ficha, para completarla · wipe: borra entera la cabeza del Mafioso
$poses = @{
  exp_boxes   = @{ d=14; f=14 }
  exp_cover   = @{ d=15; f=15; o=-19 }                                                                    # el poste se corre para no taparle la cara
  exp_grenade = @{ d=14; f=14 }
  exp_vault   = @{ d=15; f=15 }
  maf_harvest = @{ d=14; f=14; fx=$smile }                                                                 # sonrisa al cobrar
  rpg_sniper  = @{ d=14; f=14; fx=@(@(13, 26, 'SSSS'), @(14, 26, 'DAAA')) }                                 # cierra un ojo para apuntar
  rpg_tommy   = @{ d=14; f=0; rot=90; at=@(31, 43); front=$true; fx=($teeth + @(@(13, 26, 'SSSS'), @(14, 26, 'DAAA'), @(12, 30, 'R'), @(12, 33, 'R'))) }   # la mueca de la película: un ojo cerrado y los dientes apretados
  rpg_doctor  = @{ d=14; f=14; wipe=$true; fx=@(@(15, 33, 'VVV'), @(16, 34, 'VV'), @(10, 31, 'PPPP'), @(9, 32, 'PP'), @(11, 32, 'PP')) }   # moretón y curita en la frente
  rpg_rat     = @{ d=0; f=0; fx=@(@(13, 25, 'AGGGGAAAGGGGA'), @(14, 25, 'AGQGG   GQGGA'), @(15, 26, 'AAAA   AAAA')) }   # lentes oscuros
  maf_raid    = @{ d=0; f=0; fx=$teeth }                                                                  # furioso
  pok_cheat   = @{ d=-2; f=0; o=-5; keep=@(8, 14, 25, 32); mirror=17; fx=@(@(13, 33, 'SSSS'), @(14, 33, 'AAAA'), @(11, 27, 'RRRR'), @(12, 27, 'SSSS')) }   # guiño y ceja arriba
  lose        = @{ d=0; f=0; fx=@(@(14, 26, 'DAAA'), @(14, 33, 'AAAD'), @(15, 26, 'VVV'),                    # ojos cerrados y ojo morado
                                  @(19, 31, 'Z'), @(20, 31, 'Z'), @(22, 31, 'Z'), @(23, 31, 'Z'),               # nariz sangrando
                                  @(15, 28, 'T'), @(16, 28, 'T'), @(18, 42, 'T'), @(19, 42, 'T')) }             # lágrima y sudor
  win         = @{ d=0; f=0; fx=($smile + @(@(19, 34, 'AAAAAAAA'), @(20, 34, 'UUMUUUUO'), @(21, 34, 'UUMUUUUO'), @(22, 34, 'AAAAAAAA'))) }   # sonrisa con un habano cubano (el humo es del Mafioso)
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

# ---- coche: el Cadillac convertible de los 60 de la película (easter egg) ----
# Vista lateral mirando a la izquierda como los demás coches: largo y bajo, capota abierta, parabrisas cromado,
# aletas traseras, asientos de cebra, ruedas de banda blanca y Montana al volante con su saco blanco.
function MakeCar($tc, $to) {
  $b = New-Object System.Drawing.Bitmap 64, 64; $g = [System.Drawing.Graphics]::FromImage($b)
  $g.SmoothingMode = 'None'; $g.PixelOffsetMode = 'None'; $g.Clear($T)
  $body = $tc; $lite = Mix $tc (C '#FFFFFF') 0.3; $dark = Mix $tc (C '#000000') 0.35
  $chrome = C '#D8D8D8'
  $pts = { param($a) [System.Drawing.Point[]]($a | ForEach-Object { New-Object System.Drawing.Point $_[0], $_[1] }) }
  $fill = { param($c, $a) $g.FillPolygon((New-Object System.Drawing.SolidBrush $c), (& $pts $a)) }
  & $fill $body @(@(1,39),@(3,36),@(57,36),@(62,31),@(63,33),@(63,46),@(1,46))                            # carrocería con la aleta trasera
  & $fill (C '#9CC7E0') @(@(24,35),@(28,28),@(30,28),@(27,35))                                            # parabrisas
  $g.Dispose()
  for ($y = 28; $y -le 35; $y++) { $b.SetPixel([int](28 - ($y - 28) * 4 / 7), $y, $chrome) }              # marco del parabrisas
  for ($y = 29; $y -le 35; $y++) { for ($x = 38; $x -le 48; $x++) {                                       # respaldo de cebra
    if ($y -eq 29 -and ($x -eq 38 -or $x -eq 48)) { continue }
    $b.SetPixel($x, $y, $(if ((($x + $y) % 3) -eq 0) { $pal['A'] } else { $pal['B'] })) } }
  for ($x = 1; $x -le 62; $x++) { for ($y = 0; $y -lt 64; $y++) { $p = $b.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    if ($p.ToArgb() -eq $body.ToArgb()) { $b.SetPixel($x, $y, $lite) }; break } }                         # brillo en el borde superior
  for ($x = 2; $x -le 62; $x++) { $b.SetPixel($x, 40, $chrome) }                                          # moldura cromada
  for ($y = 37; $y -le 45; $y++) { $b.SetPixel(36, $y, $dark) }; $b.SetPixel(33, 38, $chrome)               # puerta y manija
  for ($y = 40; $y -le 45; $y++) { $b.SetPixel(0, $y, $chrome); $b.SetPixel(1, $y, $chrome) }              # parachoques
  $b.SetPixel(2, 37, (C '#F2E6A0')); $b.SetPixel(3, 37, (C '#F2E6A0'))                                    # faro
  $b.SetPixel(62, 33, (C '#AC3232')); $b.SetPixel(62, 34, (C '#AC3232'))                                  # piloto de la aleta
  foreach ($cx in 13, 51) { $cy = 46                                                                       # pasos de rueda y ruedas de banda blanca
    for ($y = $cy - 8; $y -le [math]::Min(63, $cy + 8); $y++) { for ($x = $cx - 8; $x -le $cx + 8; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy))
      if ($d -gt 7.5 -or $x -lt 0 -or $x -gt 63) { continue }
      $c = if ($d -gt 6.5) { if ($y -le $cy) { C '#0A0A0A' } else { $null } } elseif ($d -le 1) { C '#5A5A5A' } elseif ($d -le 3) { C '#C8C8C8' } elseif ($d -le 4.6) { C '#EEEEEE' } else { C '#141414' }
      if ($c) { $b.SetPixel($x, $y, $c) } } } }
  $mini = @(@(26, 31, 'AAAA'), @(27, 30, 'AHHHHA'), @(28, 30, 'HHSSSA'), @(29, 30, 'ASASSA'), @(30, 30, 'ASSSSA'), @(31, 30, 'ASAASA'),
            @(32, 31, 'ASSA'), @(33, 29, 'ACCSSCCA'), @(34, 29, 'CCCSSCCC'), @(35, 29, 'CCCCCCCC'))                     # Montana al volante
  Paint $b $mini 0 0
  $o = New-Object System.Drawing.Bitmap $b                                                                   # contorno negro
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { if ($b.GetPixel($x, $y).A -ge 128) { continue }
    foreach ($n in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $n[0]; $ny = $y + $n[1]
      if ($nx -ge 0 -and $nx -lt 64 -and $ny -ge 0 -and $ny -lt 64 -and $b.GetPixel($nx, $ny).A -ge 128) { $o.SetPixel($x, $y, $pal['A']); break } } } }
  $o.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $o.Dispose(); $b.Dispose()
}

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la camisa y el pañuelo.
$handmade = 'idle', 'lose', 'rpg_doctor', 'rpg_rat', 'win'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Montana\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  if ($handmade -notcontains 'exp_getaway') { MakeCar $tc (Join-Path $dir 'exp_getaway.png') }
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Montana\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
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
    if ($cfg.front) {                                                                                   # 2) objeto por delante: Montana primero y el objeto encima
      $obj = $out; $out = New-Object System.Drawing.Bitmap 64, 64
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $r = $me.GetPixel($x, $y); $px = $x + $cfg.f; if ($r.A -ge 128 -and $px -ge 0 -and $px -lt 64) { $out.SetPixel($px, $y, $r) } } }
      if ($cfg.fx) { Paint $out $cfg.fx $cfg.f 0 }
      for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $obj.GetPixel($x, $y); if ($p.A -ge 128) { $out.SetPixel($x, $y, $p) } } }
      $obj.Dispose()
    } else {
      # 2) Montana detrás de los objetos
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
