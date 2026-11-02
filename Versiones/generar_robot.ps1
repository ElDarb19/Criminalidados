param([string]$Root)
# Genera el personaje Bot a partir del Mafioso: assets/characters/Bot/<Color>/<pose>.png
# usando como base assets/characters/Mafioso/<Color>/<pose>.png.
# Conserva el sombrero y la gabardina (el disfraz) y convierte lo demás en robot:
# cara de metal con visor y rejilla, pecho de placas con núcleo de energía y luces del color del jugador.
# También crea su propio coche de escape (exp_getaway). Los objetos comunes a todos (mapa, maletín,
# billetes, monedas, fichas) viven en assets/characters/None/ y no se generan aquí.
# Uso: powershell -ExecutionPolicy Bypass -File generar_robot.ps1 -Root <carpeta del juego>
Add-Type -AssemblyName System.Drawing
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$metal = @{ A=(C '#000000'); M=(C '#8A8F98'); N=(C '#5E636B'); O=(C '#C9CED6'); D=(C '#3E4249'); W=(C '#FFFFFF') }
$skin = @{ 'A06346'='M'; '7B4E38'='N'; '945D44'='N'; 'CAC2C2'='O' }               # piel -> metal
$shirt = @{ 'FFFFFF'=1; 'E2DEDE'=1; 'DADADA'=1; 'A81515'=1 }                       # camisa y corbata
# Retoques: fila, columna inicial, píxeles. X = color del jugador, Y = su brillo, W = blanco, '.' = no tocar.
$over = @(
  @(2, 31, 'AA'), @(3, 30, 'AYXA'), @(4, 30, 'AXXA'), @(5, 31, 'AA'), @(6, 31, 'ON'), @(7, 31, 'ON'),   # antena que asoma por el sombrero
  @(19, 23, 'ANAAAAAAAAAAAAAANA'),                                                                     # visor
  @(20, 23, 'ANAAXYXAAAAXYXAANA'),
  @(21, 23, 'ANAAXXXAAAAXXXAANA'),
  @(22, 24, 'AAMMOMMNNMMOMMAA'),
  @(23, 25, 'AOMMMMMMMMMMOA'),                                                                         # remaches
  @(24, 25, 'ANMAAAAAAAAMNA'),                                                                         # rejilla de altavoz (boca)
  @(25, 26, 'ANAMAMMAMANA'),
  @(26, 26, 'ANAAAAAAAANA'),
  @(27, 27, 'ANNMMMMNNA'),
  @(33, 26, 'AAAAAAAAAAAA'),                                                                           # borde superior de la placa
  @(36, 28, 'NAAAAAAN'),                                                                               # núcleo de energía
  @(37, 28, 'AAXYYXAA'),
  @(38, 28, 'AXYWWYXA'),
  @(39, 28, 'AXYWWYXA'),
  @(40, 28, 'AAXYYXAA'),
  @(41, 28, 'NAAAAAAN'),
  @(43, 30, 'AAAA'), @(44, 30, 'AYXA'), @(45, 30, 'AXXA'),                                             # luces indicadoras
  @(46, 30, 'AAAA'), @(47, 30, 'AYXA'), @(48, 30, 'AXXA'), @(49, 30, 'AAAA'),
  @(51, 29, 'ODDDDO'), @(53, 29, 'ODDDDO')                                                             # rejillas de ventilación
)
$base = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_R\idle.png')
$W = $base.Width; $H = $base.Height
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }

# ---- Poses: el personaje de cada pose es el idle desplazado (dx, dy) junto a un objeto. ----
# El robot reemplaza al jefe (respetando los objetos que quedan por delante) y se adaptan los gestos.
$star = { param($x, $y) @(@(($y - 2), $x, 'X'), @(($y - 1), $x, 'Y'), @($y, ($x - 2), 'XYWYX'), @(($y + 1), $x, 'Y'), @(($y + 2), $x, 'X')) }
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0) }
  rpg_sniper  = @{ d=@(14, 0) }
  rpg_tommy   = @{ d=@(14, 0) }
  maf_raid    = @{ d=@(0, 0); fx=@(@(20, 27, 'XYA'), @(20, 34, 'AYX')) }                                  # ojos inclinados de enojo
  pok_cheat   = @{ d=@(-2, 0); hat=$true }                                                                 # sombrero ladeado: un ojo a la sombra
  rpg_rat     = @{ d=@(0, 0); hat=$true; fx=@(@(22, 27, 'AXYA'), @(22, 33, 'AYXA')) }                      # sombrero hasta los ojos, mirada que asoma
  rpg_doctor  = @{ d=@(14, 0); fx=@(@(20, 34, 'XZA'), @(21, 34, 'ZAA'), @(18, 42, '.Y.'), @(19, 42, 'YWY'), @(20, 42, '.Y.')) }   # visor dañado y chispa
  lose        = @{ d=@(0, 0); hat=$true; off=$true; fx=@(@(20, 27, 'ZAZ'), @(21, 27, 'AZA'), @(22, 29, 'A'), @(23, 30, 'A')) }   # luces apagadas y ojo roto
  win         = @{ d=@(0, 0); clear=@(38, 8, 63, 28)                                                       # sin puro ni humo: ojos felices y chispas de energía
                   fx=@(@(20, 27, 'AWA'), @(21, 27, 'YAY'), @(20, 34, 'AWA'), @(21, 34, 'YAY'), @(1, 29, 'Y..Y')) + (& $star 50 16) + (& $star 17 13) + @(@(22, 56, 'Y'), @(23, 55, 'YWY'), @(24, 56, 'Y')) }
}
$idleHex = @{}; for ($y = 0; $y -lt $H; $y++) { for ($x = 0; $x -lt $W; $x++) { $p = $base.GetPixel($x, $y); if ($p.A -ge 128) { $idleHex[(& $hex $p)] = 1 } } }
# Colores de gestos del jefe (sombra del sombrero, piel en sombra, puro, dientes): se sustituyen por el robot.
'0F0F0F','161616','90593F','3E281D','FBF236','AC3232','FFFFFF' | ForEach-Object { $idleHex[$_] = 1 }
$cols.Values | ForEach-Object { $idleHex[$_.TrimStart('#').ToUpper()] = 1 }         # corbatas de todos los colores
$hurt = @{ '7F558F'='A'; '80408B'='A'; '950C28'='Q'; '831414'='Q' }                  # moretones -> grietas · sangre -> aceite
$hatHex = @{ '0C0C0C'=1; '252525'=1; '151515'=1; '000000'=1; '0F0F0F'=1; '161616'=1 }
function Paint($bmp, $ops, $dx, $dy, $pal) {
  foreach ($o in $ops) { for ($j = 0; $j -lt $o[2].Length; $j++) { $ch = [string]$o[2][$j]; $x = $o[1] + $j + $dx; $y = $o[0] + $dy
    if ($ch -ne '.' -and $x -ge 0 -and $x -lt 64 -and $y -ge 0 -and $y -lt 64) { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

function MakeRobot($pal) {
  $b = New-Object System.Drawing.Bitmap $W, $H
  for ($y = 0; $y -lt $H; $y++) {
    $lo = -1; $hi = -1                                    # tramo de camisa/corbata en esta fila
    if ($y -ge 33) { for ($x = 0; $x -lt $W; $x++) { $p = $base.GetPixel($x, $y); if ($p.A -ge 128 -and $shirt.ContainsKey((& $hex $p))) { if ($lo -lt 0) { $lo = $x }; $hi = $x } } }
    for ($x = 0; $x -lt $W; $x++) {
      $p = $base.GetPixel($x, $y); if ($p.A -lt 128) { continue }
      $hx = & $hex $p
      if ($lo -ge 0 -and $x -ge $lo -and $x -le $hi) { $b.SetPixel($x, $y, $pal[$(if ($x -eq $lo) { 'O' } elseif ($x -eq $hi) { 'N' } else { 'M' })]) }   # placa de pecho
      elseif ($skin.ContainsKey($hx)) { $b.SetPixel($x, $y, $pal[$skin[$hx]]) }
      elseif ($hx -eq 'FFFFFF') { $b.SetPixel($x, $y, $pal['O']) }              # cuello de la camisa -> hombreras
      elseif ($hx -eq 'E2DEDE' -or $hx -eq 'DADADA') { $b.SetPixel($x, $y, $pal['M']) }
      elseif ($hx -eq 'A81515') { $b.SetPixel($x, $y, $pal['N']) }
      else { $b.SetPixel($x, $y, $p) }
    }
  }
  Paint $b $over 0 0 $pal
  , $b
}

# ---- Coche de escape del robot: el sedán del Mafioso convertido en un bólido de acero. ----
# Carrocería metálica con parrilla, franja y faros encendidos del color del jugador, tapacubos luminosos,
# antena en el techo y el robot al volante con los ojos brillando.
$carOver = @(
  @(15, 45, 'AA'), @(16, 44, 'AYXA'), @(17, 44, 'AXXA'), @(18, 45, 'AA'), @(19, 45, 'ON'),            # antena
  @(24, 31, 'DDDDD'), @(25, 30, 'DDDDDDD'), @(26, 31, 'MYMYM'), @(27, 31, 'MMMMM'), @(28, 31, 'NANAN')   # el robot al volante
)
function MakeCar($from, $to, $tc, $pal) {
  $src = New-Object System.Drawing.Bitmap $from; $out = New-Object System.Drawing.Bitmap $src
  $body = '{0:X2}{1:X2}{2:X2}' -f $tc.R, $tc.G, $tc.B
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
    $p = $src.GetPixel($x, $y); if ($p.A -lt 128) { continue }; $hx = & $hex $p
    if ($hx -eq $body) {
      $ch = if ($y -le 23) { 'X' }                                       # franja luminosa sobre las ventanas
            elseif ($x -ge 12 -and $x -le 21 -and $y -ge 32 -and $y -le 35) { 'X' }   # parrilla encendida
            elseif ($y -eq 37 -and $x -ge 22) { 'X' }                    # franja lateral
            elseif ($y -le 31) { 'O' } elseif ($y -ge 39) { 'N' } else { 'M' }
      $out.SetPixel($x, $y, $pal[$ch])
    }
    elseif ($hx -eq 'F7F5DC' -or $hx -eq 'F3F0B6') { $out.SetPixel($x, $y, $pal[$(if ($hx -eq 'F7F5DC') { 'W' } else { 'Y' })]) }   # faros
    elseif ($hx -eq 'A71820' -or $hx -eq 'A81516') { $out.SetPixel($x, $y, $pal['X']) }                                              # luz trasera
  } }
  foreach ($run in 0, 1) {                                                # tapacubos: el centro de cada rueda se enciende
    $xs = @(); for ($x = 0; $x -lt 64; $x++) { if ((& $hex $src.GetPixel($x, 42)) -eq 'CECECE') { $xs += $x } }
    $grp = if ($run -eq 0) { $xs | Where-Object { $_ -lt 32 } } else { $xs | Where-Object { $_ -ge 32 } }
    if ($grp) { $cx = [int][math]::Floor((($grp | Measure-Object -Minimum).Minimum + ($grp | Measure-Object -Maximum).Maximum) / 2)
      foreach ($yy in 44, 45) { $out.SetPixel($cx, $yy, $pal['Y']); $out.SetPixel($cx + 1, $yy, $pal['X']) } }
  }
  Paint $out $carOver 0 0 $pal
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $src.Dispose(); $out.Dispose()
}

foreach ($k in 'Color_R','Color_B','Color_G','Color_P','Color_Pu','Color_W') {
  $tc = C $cols[$k]; $pal = $metal.Clone(); $pal['X'] = $tc; $pal['Y'] = Mix $tc (C '#FFFFFF') 0.55; $pal['Z'] = Mix $tc (C '#000000') 0.6; $pal['Q'] = C '#2B2B33'
  # Luces apagadas (derrota): sin brillo, pero teñidas de su color para que se siga reconociendo de quién es.
  $offPal = $pal.Clone(); $dark = C '#1E1E22'; $offPal['X'] = Mix $tc $dark 0.45; $offPal['Y'] = Mix $tc $dark 0.35; $offPal['W'] = Mix $tc $dark 0.3; $offPal['Z'] = Mix $tc $dark 0.65
  $lit = MakeRobot $pal; $off = MakeRobot $offPal
  $src = Join-Path $Root "assets\characters\Mafioso\$k"; $dir = Join-Path $Root "assets\characters\Bot\$k"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $lit.Save((Join-Path $dir 'idle.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  MakeCar (Join-Path $src 'exp_getaway.png') (Join-Path $dir 'exp_getaway.png') $tc $pal

  foreach ($n in $poses.Keys) {
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $b = if ($cfg.off) { $off } else { $lit }; $pl = if ($cfg.off) { $offPal } else { $pal }
    $pose = New-Object System.Drawing.Bitmap $f; $out = New-Object System.Drawing.Bitmap $pose
    if ($cfg.clear) { for ($y = $cfg.clear[1]; $y -le $cfg.clear[3]; $y++) { for ($x = $cfg.clear[0]; $x -le $cfg.clear[2]; $x++) {
      $px = $x + $dx; $py = $y + $dy; if ($base.GetPixel($x, $y).A -lt 128 -and $px -ge 0 -and $px -lt 64 -and $py -ge 0 -and $py -lt 64) { $out.SetPixel($px, $py, [System.Drawing.Color]::Transparent) } } } }
    for ($y = 0; $y -lt $H; $y++) { for ($x = 0; $x -lt $W; $x++) {
      $r = $b.GetPixel($x, $y); if ($r.A -lt 128) { continue }
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py); $ic = $base.GetPixel($x, $y)
      if ($ic.A -lt 128) { if ($pc.A -lt 128) { $out.SetPixel($px, $py, $r) }; continue }    # partes nuevas del robot (antena): solo sobre fondo vacío
      if ($pc.A -lt 128) { continue }                                                         # el personaje está recortado aquí
      $ph = & $hex $pc
      if ($hurt.ContainsKey($ph)) { $out.SetPixel($px, $py, $pl[$hurt[$ph]]) }
      elseif ($cfg.hat -and $y -le 22 -and $pc.ToArgb() -ne $ic.ToArgb() -and $hatHex.ContainsKey($ph)) { }   # conserva el sombrero ladeado
      elseif ($pc.ToArgb() -eq $ic.ToArgb() -or $idleHex.ContainsKey($ph)) { $out.SetPixel($px, $py, $r) }
      # cualquier otro color es un objeto delante del personaje: se queda
    } }
    if ($cfg.fx) { Paint $out $cfg.fx $dx $dy $pl }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $pose.Dispose(); $out.Dispose()
  }
  $lit.Dispose(); $off.Dispose()
}
$base.Dispose()
"ok"
