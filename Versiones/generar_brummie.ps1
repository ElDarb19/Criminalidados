param([string]$Root, [string[]]$Colors = @('Color_G'))
# Genera "El Brummie" (inspirado en Peaky Blinders): assets/characters/Brummie/<Color>/<pose>.png
# Base: assets/characters/Brummie/Color_G/idle.png (retocado a mano por Darb; no se sobrescribe).
# Por defecto solo hace el verde (-Colors Color_G); cuando Darb retoque las poses verdes se pasan todos los colores.
#  · idle de los demás colores: misma imagen con la camisa del color del jugador.
#  · poses: cada pose del Mafioso del mismo color, cambiando al Mafioso por el Brummie (los objetos se conservan).
#    Se borra el sombrero del Mafioso (el Brummie lleva su gorra plana) y cada pose tiene su gesto propio.
#  · poses retocadas a mano en Color_G ($handmade): se respetan y solo se recolorean para los demás colores.
# Uso: powershell -ExecutionPolicy Bypass -File generar_brummie.ps1 -Root <carpeta del juego> [-Colors Color_R,Color_B,...]
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
          Z=(C '#AC3232'); S=(C '#E0BBA0'); L=(C '#B88C70'); X=(C '#3A2A20')       # S piel, L su sombra, X cejas
          P=(C '#4A4A4E'); J=(C '#2C2C30'); U=(C '#7E520E'); O=(C '#E05A20'); V=(C '#7F558F'); R=(C '#950C28') }   # gorra, puro, brasa, moretón y sangre
function Paint($bmp, $ops, $dx, $dy) {
  foreach ($o in $ops) { for ($i = 0; $i -lt $o[2].Length; $i++) { $ch = [string]$o[2][$i]; $x = $o[1] + $i + $dx; $y = $o[0] + $dy
    if ($x -lt 0 -or $x -ge 64 -or $y -lt 0 -or $y -ge 64 -or $ch -eq ' ') { continue }
    if ($ch -eq '.') { $bmp.SetPixel($x, $y, $T) } else { $bmp.SetPixel($x, $y, $pal[$ch]) } } }
}

# ---- idle por color: corbata verde del retoque -> color del jugador ----
$green = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Brummie\Color_G\idle.png')
function ShirtMap($tc) {                       # el Brummie solo cambia la corbata (verde 36613A = color del jugador)
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
# raw: pose propia dibujada sobre la del Mafioso · wipe: hasta esa fila se tapan con el Brummie las heridas del Mafioso (caerían fuera de su cara).
# Cara del idle del Brummie: gorra filas 2-11, cejas fila 13 (cols 26-29 y 34-37), ojos fila 14 (26-29 y 34-37),
# nariz filas 16-18, boca fila 20 (29-34) y labio fila 21.
$poses = @{
  exp_boxes   = @{ d=@(14, 0) }
  exp_cover   = @{ d=@(15, 0) }
  exp_getaway = @{ d=@(0, 0); raw=$true; fx=@(@(23, 29, '.PPPPP.'), @(24, 29, 'JJJJJJJ'), @(25, 29, 'SASSSAS'), @(26, 29, 'SSSLSSS'), @(27, 29, 'SSAAASS'), @(28, 29, '.SSSSS.')) }   # coche del Mafioso con el Brummie (mini) al volante
  exp_grenade = @{ d=@(14, 0) }
  exp_vault   = @{ d=@(15, 0) }
  maf_harvest = @{ d=@(14, 0); fx=@(@(20, 29, 'SAAAAA'), @(19, 35, 'A')) }                                 # media sonrisa al cobrar
  rpg_sniper  = @{ d=@(14, 0); fx=@(@(14, 26, 'AAAA'), @(15, 26, 'SSSS')) }                                # cierra un ojo para apuntar
  rpg_tommy   = @{ d=@(14, 0); fx=@(@(14, 29, 'X'), @(14, 34, 'X'), @(20, 29, 'WAWWAW')) }                   # ceño y dientes apretados
  rpg_doctor  = @{ d=@(14, 0); wipe=27; fx=@(@(12, 29, 'X'), @(12, 34, 'X'), @(20, 29, 'LIIIIL'), @(16, 25, 'VVVVV'), @(17, 26, 'VVV')) }   # dolorido y con el ojo morado
  rpg_rat     = @{ d=@(0, 0); fx=@(@(14, 25, 'ANNNNAAAANNNNA'), @(15, 25, 'ANKNNA  ANKNNA'), @(16, 26, 'AAAA    AAAA')) }   # gafas oscuras
  maf_raid    = @{ d=@(0, 0); fx=@(@(14, 29, 'X'), @(14, 34, 'X'), @(20, 29, 'WAWWAW')) }                   # furioso
  pok_cheat   = @{ d=@(-2, 0); keepx=27; fx=@(@(14, 34, 'AAAA'), @(15, 34, 'SSSS'), @(12, 26, 'XXXX'), @(13, 26, 'SSSS')) }   # guiño y ceja arriba
  lose        = @{ d=@(0, 0); wipe=30; fx=@(@(14, 26, 'AAAA'), @(15, 26, 'SSSS'), @(14, 34, 'AAAA'), @(15, 34, 'SSSS'),   # ojos cerrados
                                    @(16, 25, 'VVVV'), @(19, 32, 'R'), @(21, 32, 'R'), @(22, 32, 'R'),                  # ojo morado y nariz sangrando
                                    @(16, 27, 'T'), @(17, 27, 'T'), @(16, 36, 'T'), @(17, 36, 'T'),                     # lágrimas
                                    @(9, 43, 'T'), @(10, 43, 'T')) }                                                     # sudor
  win         = @{ d=@(0, 0); keep=@('FBF236', 'AC3232', '90593F', '3E281D'); wipe=26; fx=@(@(12, 34, 'XXXX'), @(13, 34, 'SSSS'), @(20, 29, 'AWWWWA'), @(20, 35, 'WWWO')) }   # ceja arriba, sonrisa y cigarrillo (el humo del Mafioso se queda)
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

# Poses retocadas a mano por Darb en Color_G: no se regeneran; se copian a los demás colores cambiando solo la camisa.
$handmade = 'idle', 'lose', 'rpg_doctor', 'rpg_rat', 'rpg_tommy'
function Recolor($from, $to, $map) {
  $out = New-Object System.Drawing.Bitmap $from
  for ($y = 0; $y -lt 64; $y++) { for ($x = 0; $x -lt 64; $x++) { $p = $out.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = & $hex $p; if ($map.ContainsKey($k)) { $out.SetPixel($x, $y, $map[$k]) } } }
  $out.Save($to, [System.Drawing.Imaging.ImageFormat]::Png); $out.Dispose()
}

foreach ($key in $Colors) {
  $tc = C $cols[$key]
  $src = Join-Path $Root "assets\characters\Mafioso\$key"; $dir = Join-Path $Root "assets\characters\Brummie\$key"
  New-Item -ItemType Directory -Force $dir | Out-Null
  $me = MakeIdle $tc
  $base = New-Object System.Drawing.Bitmap (Join-Path $src 'idle.png')
  foreach ($n in $handmade) { if ($key -ne 'Color_G') { Recolor (Join-Path $Root "assets\characters\Brummie\Color_G\$n.png") (Join-Path $dir "$n.png") (ShirtMap $tc) } }
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
