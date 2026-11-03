param([string]$Root, [string]$Out)
# Tres propuestas del capo secreto (logro "Juicio Final"): mitad Mafioso, mitad Bot. Idle en verde.
#  A: solo la cabeza partida (izquierda Mafioso, derecha Bot) con borde de piel rasgada; cuerpo del Mafioso.
#  B: partido de arriba abajo: cabeza y cuerpo, mitad traje con corbata y mitad chasis del Bot.
#  C: estilo Terminator: cara del Mafioso con la piel arrancada en el lado derecho, metal y ojo rojo; cuerpo del Mafioso.
#  D (elegida): la cara de la C con el cuerpo del Bot. El ojo queda rojo siempre; el cuerpo cambia con el color del jugador.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$maf = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_G\idle.png')
$bot = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Bot\Color_G\idle.png')
$skin = @{ 'A06346'=1; '945D44'=1; '7B4E38'=1; 'CAC2C2'=1 }        # piel y ojos del Mafioso
$flesh = C '9E2F28'; $fleshD = C '6E1C18'
$red = @{ '36613A'=(C 'B01818'); 'A5B8A6'=(C 'FF6A5A'); 'FFFFFF'=(C 'FFD0C8') }   # ojo verde del Bot -> rojo
# borde rasgado: desplazamiento de la costura por fila
$jag = @(0,1,0,-1,0,1,1,0,-1,0,0,1,0,-1,-1,0)
function Build($v) {
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0; $y -lt 64; $y++) { for ($x=0; $x -lt 64; $x++) {
    $m = $maf.GetPixel($x,$y); $o = $bot.GetPixel($x,$y); $px = $m
    $seam = 32 + $jag[$y % 16]
    if ($v -eq 'A') { if ($y -le 28 -and $y -ge 18 -and $x -ge $seam) { $px = $o } elseif ($y -lt 18 -and $x -ge 32) { $px = $o } }
    elseif ($v -eq 'B') { $s2 = if ($y -ge 18 -and $y -le 28) { $seam } else { 32 }; if ($x -ge $s2) { $px = $o } }
    elseif ($v -eq 'C' -or $v -eq 'D') {                                          # parche arrancado: mejilla y ojo derechos
      $inPatch = $y -ge 19 -and $y -le 26 -and $x -ge (34 + $jag[$y % 16]) -and $x -le 40
      if ($inPatch) { $px = $o; $k = Hex $o; if ($red.ContainsKey($k)) { $px = $red[$k] } }
    }
    if ($v -eq 'D' -and $y -ge 28) { $px = $o }                    # cuerpo del Bot
    $b.SetPixel($x, $y, $px)
  } }
  # piel rasgada a lo largo del corte (solo sobre la piel del Mafioso)
  for ($y=18; $y -le 28; $y++) {
    $edge = if ($v -eq 'C' -or $v -eq 'D') { 33 + $jag[$y % 16] } else { 31 + $jag[$y % 16] }
    if (($v -eq 'C' -or $v -eq 'D') -and ($y -lt 19 -or $y -gt 26)) { continue }
    $p = $b.GetPixel($edge, $y); if ($p.A -ge 128 -and $skin.ContainsKey((Hex $p))) { $b.SetPixel($edge, $y, $(if ($y % 3) { $flesh } else { $fleshD })) }
  }
  if ($v -eq 'C' -or $v -eq 'D') { foreach ($x in 34..40) { $p = $b.GetPixel($x, 27); if ($p.A -ge 128 -and $skin.ContainsKey((Hex $p))) { $b.SetPixel($x, 27, $flesh) } } }   # borde inferior del parche
  if ($v -eq 'A' -or $v -eq 'B') {                                                # el ojo del Bot brilla en rojo: guiño a Terminator
    for ($y=19; $y -le 22; $y++) { for ($x=33; $x -le 40; $x++) { $k = Hex ($b.GetPixel($x,$y)); if ($red.ContainsKey($k)) { $b.SetPixel($x, $y, $red[$k]) } } }
  }
  $b
}
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C','D') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
$sheet = New-Object System.Drawing.Bitmap (4*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
for ($i=0;$i -lt 4;$i++) { $sg.DrawImage($imgs[$i], 384*$i, 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
