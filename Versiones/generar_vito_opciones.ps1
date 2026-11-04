param([string]$Root, [string]$Out)
# Tres propuestas de "Don Vito" (guiño a El Padrino; idle, verde) a partir del Mafioso verde.
# Igual en las tres (fiel a la foto): esmoquin negro, camisa blanca, pajarita negra y una rosa en la solapa del color del jugador
# (lo único que cambia por color), pelo gris peinado hacia atrás con entradas, bigote fino y mandíbula ancha con cachetes caídos.
# Lo que varía es la cara (rasgos), siempre con su mueca de boca caída y labio inferior salido:
#  A: párpados pesados y comisuras hacia abajo  ·  B: una ceja alzada y boca fruncida  ·  C: ojos casi cerrados, bigote más poblado y papada.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'S'='D0A080'; 'D'='A87858'; 'K'='E2B898'; 'L'='9A5A48'; 'H'='9A9A9A'; 'I'='C4C4C4'; 'R'='4A4440'; 'M'='5A5048'
        'W'='ECE6DA'; 'P'='000000'; 'F'='4E8A54'; 'G'='36613A'; 'N'='24422A'; 'E'='1E3A1E'; 'B'='F2F2F2'; 'J'='D4D4D4' }
# Cabeza 24 px simétrica: se escribe la mitad izquierda y se refleja. Más ancha abajo que arriba (mandíbula y cachetes).
$half = @(
  '.......AAAAA',
  '.....AAHHHHH',
  '....AHHHIHHH',
  '...AHHIHHHHH',
  '...AHHHHHHHH',
  '...AHHSSSSSS',
  '...AHSSSSSSS',
  '..AHSSSSSSSS',
  '..AHSRRRRSSS',
  '..ADSSSSSSSS',
  '..ADSDWPPSSS',
  '..ADSSDDDSSS',
  '.ADSSSSSSSAD',
  '.ADSSSSSSAAD',
  '.ADSSSSSSDDD',
  '.ADSSSSMMMMM',
  '.ADSSSSSSAAA',
  'ADSSSSSSALLL',
  'ADSSSSSSSDDD',
  'ADDSSSSSSSSS',
  'ADDSSSSSSSSS',
  '.ADDSSSSSSSS',
  '.ADDDSSSSSSS',
  '..ADDDDDDDDD',
  '...AAAAAAAAA'
)
$head = $half | ForEach-Object { $a = $_.ToCharArray(); [array]::Reverse($a); $_ + (-join $a) }
# Caras (coordenadas absolutas; la cabeza va en col 20, fila 3). Ojos fila 13, bigote fila 18, boca fila 19, labio fila 20.
$faces = @{
  A = @(@(12, 25, 'AAAA'), @(12, 35, 'AAAA'), @(21, 27, 'A'), @(21, 36, 'A'))                 # párpados pesados, comisuras caídas
  B = @(@(10, 34, 'RRRR'), @(11, 34, 'SSSS'), @(19, 29, 'SAAAAS'), @(20, 29, 'SLLLLS'), @(18, 24, 'D'), @(18, 39, 'D'))   # ceja alzada, boca fruncida
  C = @(@(13, 25, 'DAAA'), @(13, 35, 'AAAD'), @(17, 27, 'MMMMMMMMMM'), @(21, 27, 'A'), @(21, 36, 'A'), @(26, 26, 'DDDDDDDDDDDD'))   # ojos casi cerrados, bigote poblado, papada
}
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
# El saco negro del Mafioso ya es un esmoquin; la camisa queda blanca; la corbata se vuelve camisa (con pliegues) y arriba va la pajarita.
$map = @{ 'FFFFFF'=$P['B']; 'E2DEDE'=$P['J']; 'DADADA'=$P['J']; 'A06346'=$P['S']; '945D44'=$P['D']; '7B4E38'=$P['D'] }
$bow = @('AA    AA', 'ARRAARRA', 'ARRRRRRA', 'ARRAARRA', 'AA    AA')      # pajarita negra (R gris muy oscuro para que se lea)
$rose = @('.AAAA.', 'AFFGFA', 'AFGNFA', 'AGFFGA', '.AAAA.', '...AE.', '..AE..')   # rosa del color del jugador con su tallo
function Build($v) {
  $g = Grid $base
  for ($y=0; $y -le 27; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }                   # fuera sombrero y cara del Mafioso
  for ($y=28; $y -lt 64; $y++) { for ($x=0;$x -lt 64;$x++) { $c = $g[$x,$y]; if ($c.A -lt 128) { continue }
    $k = Hex $c
    if ($k -eq '36613A') { $g[$x,$y] = C $(if ($y % 3 -eq 0) { $P['J'] } else { $P['B'] }) }         # donde iba la corbata: pechera blanca con pliegues
    elseif ($map.ContainsKey($k)) { $g[$x,$y] = C $map[$k] } } }
  for ($y=34; $y -le 56; $y++) { foreach ($x in 31, 32) { if ($g[$x,$y].A -ge 128 -and (Hex $g[$x,$y]) -eq '000000') { $g[$x,$y] = C $P['B'] } } }   # sin el contorno de la corbata
  foreach ($y in 40, 45, 50) { $g[31,$y] = C '000000' }                                              # botones de la pechera
  Paint $g $bow 28 31
  Paint $g $rose 39 36
  Paint $g $head 20 3
  foreach ($o in $faces[$v]) { Paint $g @($o[2]) $o[1] $o[0] }
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $px = $g[$x,$y]; $b.SetPixel($x, $y, $px) } }
  $b
}
foreach ($r in $head) { if ($r.Length -ne 24) { throw "fila mal: $r ($($r.Length))" } }
$base = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_G\idle.png')
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
$sheet = New-Object System.Drawing.Bitmap (3*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
for ($i=0;$i -lt 3;$i++) { $sg.DrawImage($imgs[$i], 384*$i, 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
