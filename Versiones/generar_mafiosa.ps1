param([string]$Root)
# Genera el personaje Mafiosa a partir del Mafioso: assets/characters/Mafiosa/<Color>/<pose>.png
# usando como base assets/characters/Mafioso/<Color>/<pose>.png.
# Cabeza: fedora con cinta y pluma del color del jugador, bob ondulado, labios rojos y perlas.
# Cuerpo: vestido negro satinado con cinturón del color del jugador bajo el abrigo.
# También crea su coche de escape: un sedán de lujo de dos tonos con parrilla dorada y banda blanca.
# Uso: powershell -ExecutionPolicy Bypass -File generar_mafiosa.ps1 -Root <carpeta del juego>
Add-Type -AssemblyName System.Drawing
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb(255, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$hex = { param($p) '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B }
$fixed = @{ A=(C '#000000'); B=(C '#151515'); E=(C '#A06346'); F=(C '#7B4E38'); G=(C '#CAC2C2'); H=(C '#945D44')
            R=(C '#3B2418'); S=(C '#5E3B27'); P=(C '#A3243B'); W=(C '#EEE9DD'); V=(C '#B9B2A4')
            K=(C '#26232B'); L=(C '#3D3944'); N=(C '#15131A')                    # satén negro: base, brillo, sombra
            Q=(C '#C9A24A'); D=(C '#2A2A2E'); T=(C '#1C1C20')                    # dorado y negro charol del coche
            I=(C '#9CC7E0') }                                                    # lágrimas

# ---- Cabeza: bob con ondas, flequillo de lado, cejas finas, labios rojos (filas 18-28, columnas 20-43). ----
# Cada fila = mechón izquierdo (6) + cara (12); el mechón derecho es el izquierdo en espejo. '.' = vacío.
$side = @{ 18='AARSRR'; 19='.ARRSR'; 20='ARRSRR'; 21='ARSRRR'; 22='.ARSRR'; 23='.ARRSR'; 24='ARRSRR'; 25='ARSRRR'; 26='.ARSRR'; 27='..ARSR'; 28='...ARS' }
$face = @{ 18='RRSSRRRRRRRR'; 19='SRRRREEEEEER'; 20='EAAAEEEEAAAE'; 21='EGAGEEEEGAGE'; 22='FEEEEFFEEEEF'; 23='FEEEEEEEEEEF'
           24='AFEEPPPPEEFA'; 25='RAFEEPPEEFAR'; 26='RRAFEEEEFARR'; 27='RRRAEEEEARRR'; 28='SRRAHHHHARRS' }
$head = foreach ($r in 18..28) { , @($r, 20, ($side[$r] + $face[$r] + -join $side[$r][5..0])) }
$head += @(
  @(29, 27, 'FHHHHHHHHF'),                                                     # escote
  @(30, 28, 'W......W'), @(31, 29, 'WV..VW'), @(32, 31, 'WW'),                 # collar de perlas
  @(13, 25, 'XXXXXXXXXXXXXX'), @(14, 25, 'ZZZZZZZZZZZZZZ'),                    # cinta del sombrero
  @(2, 40, 'AYA'), @(3, 39, 'AYYXA'), @(4, 38, 'AYXYXA'), @(5, 38, 'AYXXZA'), @(6, 37, 'AYXZA'), @(7, 37, 'AXXZA'), @(8, 37, 'AXZA'), @(9, 37, 'XZA'), @(10, 37, 'X'), @(11, 37, 'X'), @(12, 37, 'X')   # pluma
)
function Paint($bmp, $ops, $dx, $dy, $pal) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}
$base = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_R\idle.png')
$shirt = @{ 'FFFFFF'=1; 'E2DEDE'=1; 'DADADA'=1; 'A81515'=1 }
function MakeIdle($pal) {
  $b = New-Object System.Drawing.Bitmap $base
  for ($y = 29; $y -lt 64; $y++) {                                             # camisa y corbata -> vestido negro con cinturón
    $lo = -1; $hi = -1
    for ($x = 0; $x -lt 64; $x++) { $p = $base.GetPixel($x, $y); if ($p.A -ge 128 -and $shirt.ContainsKey((& $hex $p))) { if ($lo -lt 0) { $lo = $x }; $hi = $x } }
    if ($lo -lt 0) { continue }
    for ($x = $lo; $x -le $hi; $x++) {
      if ($y -le 32 -and -not $shirt.ContainsKey((& $hex ($base.GetPixel($x, $y))))) { continue }   # cuello y escote se respetan
      $ch = if ($y -eq 44) { 'X' } elseif ($x -eq $lo) { 'L' } elseif ($x -eq $hi) { 'N' } else { 'K' }
      $b.SetPixel($x, $y, $pal[$ch])
    }
  }
  Paint $b $head 0 0 $pal
  , $b
}

# ---- Poses: el personaje de cada pose es el idle desplazado (dx, dy) junto a un objeto. ----
# Ella reemplaza al Mafioso (respetando los objetos por delante) y cada pose tiene su pequeño gesto.
$heart = { param($x, $y) @(@($y, $x, '.AA AA.'.Replace('.', ' ')), @(($y + 1), $x, 'APWAPPA'), @(($y + 2), $x, 'APPPPPA'), @(($y + 3), ($x + 1), 'APPPA'), @(($y + 4), ($x + 2), 'APA'), @(($y + 5), ($x + 3), 'A')) }
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0) }
  rpg_sniper  = @{ d=@(14, 0) }
  rpg_tommy   = @{ d=@(14, 0) }
  rpg_doctor  = @{ d=@(14, 0) }                                                                         # moretón y sangre del original se conservan
  rpg_rat     = @{ d=@(0, 0); hat=$true }                                                               # sombrero calado hasta los ojos
  maf_raid    = @{ d=@(0, 0); fx=@(@(21, 29, 'A'), @(21, 34, 'A'), @(24, 30, 'EPPE'), @(25, 31, 'EE')) }                 # ceño fruncido y labios tensos
  pok_cheat   = @{ d=@(-2, 0); hat=$true; fx=@(@(21, 27, 'AAA'), @(24, 30, 'EPPP'), @(23, 33, 'P')) }                    # guiño pícaro y media sonrisa
  lose        = @{ d=@(0, 0); hat=$true; nofeather=$true; clean=$true                                                                 # llorando, rímel corrido, sombrero roto
                   fx=@(@(20, 27, 'EAA'), @(21, 27, 'AAA'),                                                                # ceja triste y ojo cerrado
                        @(22, 27, 'A I'), @(23, 27, 'A I'), @(24, 27, 'A I'), @(25, 28, 'A'), @(26, 29, 'I'),             # lágrimas y rímel corrido
                        @(22, 35, 'AI'), @(23, 36, 'I'), @(24, 36, 'I'),                                                   # lágrima bajo el ala
                        @(24, 30, 'EPPE'), @(25, 30, 'PEEP'),                                                              # boca triste
                        @(8, 27, '..'), @(9, 26, '.AA'), @(10, 31, 'L'), @(11, 30, 'LL'),                                  # copa rasgada y raspada
                        @(12, 39, 'AXA'), @(13, 40, 'AXZA'), @(14, 41, 'AXZA'), @(15, 42, 'AYA'), @(16, 43, 'A')) }       # pluma rota y caída
  win         = @{ d=@(0, 0); clear=@(38, 8, 63, 28)                                                                       # guiño y beso al aire
                   fx=@(@(20, 27, 'EEE'), @(21, 27, 'AAA'), @(24, 30, 'EPPE'), @(25, 30, 'EPPE')) + (& $heart 44 14) + @(@(8, 52, 'PP PP'), @(9, 52, 'PPPPP'), @(10, 53, 'PPP'), @(11, 54, 'P')) }
}
$idleHex = @{}; for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $base.GetPixel($x, $y); if ($p.A -ge 128) { $idleHex[(& $hex $p)] = 1 } } }
'0F0F0F','161616','90593F','3E281D','FBF236','AC3232','FFFFFF' | ForEach-Object { $idleHex[$_] = 1 }      # sombras, puro y dientes del Mafioso
$cols.Values | ForEach-Object { $idleHex[$_.TrimStart('#').ToUpper()] = 1 }                             # corbatas de todos los colores
$hatHex = @{ '0C0C0C'=1; '252525'=1; '151515'=1; '000000'=1; '0F0F0F'=1; '161616'=1 }
$hurtHex = @{ '7F558F'=1; '80408B'=1; '950C28'=1; '831414'=1 }                   # moretón y sangre del Mafioso (las poses con clean los quitan)
$ties = $cols.Values | ForEach-Object { C $_ }
function IsChar($pc, $ph) {                     # color del Mafioso (incluye tonos casi iguales a la corbata, que el dibujo original tiene sueltos)
  if ($idleHex.ContainsKey($ph)) { return $true }
  foreach ($t in $ties) { if ([math]::Abs($pc.R - $t.R) + [math]::Abs($pc.G - $t.G) + [math]::Abs($pc.B - $t.B) -le 30) { return $true } }
  $false
}

# ---- Coche de escape: sedán de lujo de dos tonos (carrocería de su color, guardabarros negro charol),
# parrilla y adorno dorados, neumáticos de banda blanca y ella al volante con su pluma. ----
$carOver = @(
  @(28, 12, 'QQ'), @(27, 13, 'Q'),                                                                      # adorno del capó
  @(24, 35, 'Y'), @(25, 34, 'X'), @(25, 30, 'AAAA'), @(26, 29, 'AXXXXA'), @(27, 30, 'REEER'), @(28, 30, 'REPER')   # ella al volante
)
function RestoreGlass($bmp) {                   # cristal original de la ventanilla delantera (filas 24-28, columnas 29-37)
  $g = @('BBBBBBBBB', 'BBEEBBBEB', 'BEEBBBEEB', 'EEBBBEEBB', 'BBBBBEBBB'); $c = @{ B=(C '#151515'); E=(C '#212121') }
  for ($r = 0; $r -lt 5; $r++) { for ($i = 0; $i -lt 9; $i++) { $bmp.SetPixel(29 + $i, 24 + $r, $c[[string]$g[$r][$i]]) } }
}
function MakeCar($from, $to, $tc, $pal) {
  $src = New-Object System.Drawing.Bitmap $from; $out = New-Object System.Drawing.Bitmap $src
  $body = '{0:X2}{1:X2}{2:X2}' -f $tc.R, $tc.G, $tc.B
  $xs = @(); for ($x = 0; $x -lt 64; $x++) { if ((& $hex $src.GetPixel($x, 42)) -eq 'CECECE') { $xs += $x } }
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
    $p = $src.GetPixel($x, $y); if ($p.A -lt 128) { continue }; $hx = & $hex $p
    if ($hx -eq $body -and $x -ge 12 -and $x -le 21 -and $y -ge 32 -and $y -le 35) { $out.SetPixel($x, $y, $pal['Q']) }   # parrilla dorada
    elseif ($hx -eq $body -and $y -eq 37 -and $x -ge 22) { $out.SetPixel($x, $y, $pal['Q']) }                              # moldura dorada
    elseif ($hx -eq 'CECECE') { $out.SetPixel($x, $y, $pal['W']) }                                                         # banda blanca
    elseif ($hx -eq '5F5F5F') { $out.SetPixel($x, $y, $pal['D']) } elseif ($hx -eq '4A4949') { $out.SetPixel($x, $y, $pal['T']) }   # charol negro
  } }
  foreach ($half in 0, 1) {                                                                             # tapacubos dorados
    $grp = if ($half -eq 0) { $xs | Where-Object { $_ -lt 32 } } else { $xs | Where-Object { $_ -ge 32 } }
    if ($grp) { $cx = [int][math]::Floor((($grp | Measure-Object -Minimum).Minimum + ($grp | Measure-Object -Maximum).Maximum) / 2)
      foreach ($yy in 44, 45) { $out.SetPixel($cx, $yy, $pal['Q']); $out.SetPixel($cx + 1, $yy, $pal['Q']) } }
  }
  RestoreGlass $out                                                       # quita al Mafioso del volante antes de sentarla a ella
  Paint $out $carOver 0 0 $pal
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $src.Dispose(); $out.Dispose()
}

# Poses retocadas a mano en Color_Pu: no se regeneran; se copian a los demás colores cambiando solo los tonos del jugador.
$handmade = 'lose', 'pok_cheat', 'rpg_doctor'
$refKey = 'Color_Pu'
function Shades($tc) { @{ X=$tc; Y=(Mix $tc (C '#FFFFFF') 0.55); U=(Mix $tc (C '#FFFFFF') 0.25); Z=(Mix $tc (C '#000000') 0.35) } }
function Recolor($from, $to, $tc) {
  $a = Shades (C $cols[$refKey]); $b2 = Shades $tc; $map = @{}
  foreach ($s in 'X', 'Y', 'U', 'Z') { $map[(& $hex $a[$s])] = $b2[$s] }
  $src = New-Object System.Drawing.Bitmap $from; $out = New-Object System.Drawing.Bitmap $src; $src.Dispose()
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in 'Color_R','Color_B','Color_G','Color_P','Color_Pu','Color_W') {
  $tc = C $cols[$key]; $pal = $fixed.Clone()
  $sh = Shades $tc; foreach ($s in $sh.Keys) { $pal[$s] = $sh[$s] }
  $me = MakeIdle $pal
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Mafiosa\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me.Save((Join-Path $dir 'idle.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  MakeCar (Join-Path $src 'exp_getaway.png') (Join-Path $dir 'exp_getaway.png') $tc $pal
  foreach ($n in $poses.Keys) {
    $f = Join-Path $src "$n.png"; if (-not (Test-Path $f)) { continue }
    if ($handmade -contains $n) {
      if ($key -ne $refKey) { Recolor (Join-Path $Root "assets\characters\Mafiosa\$refKey\$n.png") (Join-Path $dir "$n.png") $tc }
      continue
    }
    $cfg = $poses[$n]; $dx = $cfg.d[0]; $dy = $cfg.d[1]
    $pose = New-Object System.Drawing.Bitmap $f; $out = New-Object System.Drawing.Bitmap $pose
    if ($cfg.clear) { for ($y = $cfg.clear[1]; $y -le $cfg.clear[3]; $y++) { for ($x = $cfg.clear[0]; $x -le $cfg.clear[2]; $x++) {
      $px = $x + $dx; $py = $y + $dy; if ($base.GetPixel($x, $y).A -lt 128 -and $px -ge 0 -and $px -lt 64 -and $py -ge 0 -and $py -lt 64) { $out.SetPixel($px, $py, [System.Drawing.Color]::Transparent) } } } }
    for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) {
      $r = $me.GetPixel($x, $y); $ic = $base.GetPixel($x, $y)
      $px = $x + $dx; $py = $y + $dy; if ($px -lt 0 -or $px -ge 64 -or $py -lt 0 -or $py -ge 64) { continue }
      $pc = $out.GetPixel($px, $py)
      if ($ic.A -lt 128) { if ($r.A -ge 128 -and $pc.A -lt 128 -and -not ($cfg.nofeather -and $y -le 12)) { $out.SetPixel($px, $py, $r) }; continue }   # pelo y pluma: solo sobre fondo vacío
      if ($pc.A -lt 128) { continue }                                                                       # el personaje está recortado aquí
      $ph = & $hex $pc
      if ($cfg.hat -and $y -le 22 -and $pc.ToArgb() -ne $ic.ToArgb() -and $hatHex.ContainsKey($ph)) { continue }   # conserva el sombrero ladeado
      if ($pc.ToArgb() -eq $ic.ToArgb() -or (IsChar $pc $ph) -or ($cfg.clean -and $hurtHex.ContainsKey($ph))) { if ($r.A -ge 128) { $out.SetPixel($px, $py, $r) } else { $out.SetPixel($px, $py, [System.Drawing.Color]::Transparent) } }
      # cualquier otro color (objetos, moretones, sangre) se queda
    } }
    if ($cfg.fx) { Paint $out $cfg.fx $dx $dy $pal }
    $out.Save((Join-Path $dir "$n.png"), [System.Drawing.Imaging.ImageFormat]::Png); $pose.Dispose(); $out.Dispose()
  }
  $me.Dispose()
}
$base.Dispose()
"ok"
