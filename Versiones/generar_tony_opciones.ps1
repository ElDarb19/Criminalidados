param([string]$Root, [string]$Out)
# Tres propuestas de "El Gordo Tony" (idle, verde) a partir del Mafioso verde.
#  A: fiel a Los Simpson (piel amarilla, saco pizarra) · B: piel humana, saco pizarra · C: piel amarilla, saco negro noir y revólver en el cinto.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Las claves de los hashtables no distinguen mayúsculas: solo se usan letras mayúsculas.
$SKIN = @{
  'Y' = @{ 'S'='F2CE2E'; 'D'='C9A11A'; 'K'='FBE07A'; 'L'='DDB523' };      # amarillo Simpson
  'H' = @{ 'S'='C48C66'; 'D'='93603F'; 'K'='D9A684'; 'L'='A87454' }       # piel humana
}
$BASEP = @{ 'A'='000000'; 'H'='8E8E8E'; 'I'='B4B4B4'; 'G'='565656'; 'B'='2E2A26'; 'W'='F0EBDF'; 'P'='000000'; 'M'='3A1E14' }
# Cabeza 24 px: tupé gris peinado hacia atrás, patillas oscuras, cejas gruesas, párpados caídos, nariz grande, mandíbula ancha y ceño.
$head = @(
  '.......AAAAAAAA.........',
  '.....AAIIIHHHHHAAA......',
  '....AIIHHHGGHHHHHHAA....',
  '...AIHHHHHIIIIGGHHHHA...',
  '...AHHHGIIHHHHHHGGHHHA..',
  '..AHHHHHGGHHHHHHHHGGHA..',
  '..AGHHHHHHGGGHHHHHHGGA..',
  '..AGKSSSSSSSSSSSSSSSGA..',
  '..AGSSSSSSSSSSSSSSSSGA..',
  '..AGSBBBBBSSSSBBBBBSGA..',
  '.ASGSLLLLLSSSSLLLLLSGSA.',
  '.ADGSWWPPWSSSSWPPWWSGDA.',
  '.ASGSDDDDDSSSSDDDDDSGSA.',
  '..ASSSSSSSSADSSSSSSSSA..',
  '..ASSSSSSSADDDASSSSSSA..',
  '..ASSSSSSADDDDDASSSSSA..',
  '..ASSSSSSAAAAAAASSSSSA..',
  '.ASSSSSSSSSSSSSSSSSSSSA.',
  '.ASSSSSSAAAAAAAAAASSSSA.',
  '.ASSSSSASDDDDDDDDSASSSA.',
  'ADSSSSSSSSSSSSSSSSSSSSDA',
  'ADSSSSSSSSSSKKKKSSSSSSDA',
  'ADDSSSSSSSSSSSSSSSSSSDDA',
  '.ADDSSSSSSSSSSSSSSSSDDA.',
  '..ADDDSSSSSSSSSSSSDDDA..',
  '...ADDDDDDDDDDDDDDDDA...',
  '....AAAAAAAAAAAAAAAA....'
)
function Paint($g, $rows, $col, $row, $pal) {
  for ($i=0; $i -lt $rows.Count; $i++) {
    $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) {
      $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $pal[$ch] }
    }
  }
}
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
function Fatten($g, $y0, $y1) {
  for ($y=$y0; $y -le $y1; $y++) {
    for ($x=0; $x -le 25; $x++) { $g[$x,$y] = $g[($x+1),$y] }
    for ($x=63; $x -ge 38; $x--) { $g[$x,$y] = $g[($x-1),$y] }
  }
}
function Remap($g, $map) { for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$g[$x,$y]; if ($c.A -lt 128) { continue }; $k = Hex $c; if ($map.ContainsKey($k)) { $g[$x,$y] = C $map[$k] } } } }
function Polo($g) {                     # polo cerrado del color del jugador: cuello, tapeta corta y dos botones
  for ($y=29; $y -le 56; $y++) { for ($x=27; $x -le 36; $x++) { $px = $g[$x,$y]; if ($px.A -gt 128 -and (Hex $px) -eq '000000' -and $y -ge 31 -and $x -ge 29 -and $x -le 34) { $g[$x,$y] = C '4E8A54' } } }
  for ($y=34; $y -le 43; $y++) { $g[31,$y] = C '2F5634' }
  $g[32,37] = C 'E8E0C8'; $g[32,41] = C 'E8E0C8'
}
function Cigar($g) {                    # puro en la comisura derecha, con brasa y humo
  foreach ($x in 37..46) { $g[$x,18] = C '000000'; $g[$x,20] = C '000000' }
  foreach ($x in 37..45) { $g[$x,19] = C '7A4A2A' }
  $g[40,19] = C '4E2E18'; $g[42,19] = C 'C9A44A'                          # anillo dorado
  $g[46,19] = C 'E05A20'; $g[47,19] = C '000000'
  foreach ($pt in @(@(48,17),@(49,16),@(49,15),@(48,14),@(48,13),@(49,12),@(50,11),@(50,10))) { $g[$pt[0],$pt[1]] = C 'BDBDBD' }
}
function Gun($g) {                      # culata del revólver asomando del cinto, como en la imagen
  $rows = @('.AAAA','AWWWA','AWGGA','.AWGA','.AWGA','.AAAA')
  $pal = @{ 'A'='000000'; 'W'='C8C8C8'; 'G'='6E6E6E' }
  Paint $g $rows 25 45 $pal
}
function Build($v) {
  $g = Grid $base
  for ($y=0; $y -le 27; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }      # fuera sombrero y cabeza
  Fatten $g 36 56; Fatten $g 40 54; Fatten $g 44 52                                 # bien gordo
  $neck = @{ 'A06346'='S'; '945D44'='D'; '7B4E38'='D' }                         # el cuello del Mafioso, con la piel nueva
  $shirt = @{ 'FFFFFF'='4E8A54'; 'E2DEDE'='41744A'; 'DADADA'='41744A'; '36613A'='4E8A54' }
  if ($v -ne 'C') { foreach ($k in @{ '151515'='38334C'; '252525'='4B4566'; '0C0C0C'='262235' }.GetEnumerator()) { $shirt[$k.Key] = $k.Value } }
  Remap $g $shirt
  Polo $g
  $pal = $BASEP.Clone(); $sk = if ($v -eq 'B') { $SKIN['H'] } else { $SKIN['Y'] }
  foreach ($k in $sk.Keys) { $pal[$k] = $sk[$k] }
  $nm = @{}; foreach ($k in $neck.Keys) { $nm[$k] = $pal[$neck[$k]] }; Remap $g $nm
  Paint $g $head 20 1 $pal
  Cigar $g
  if ($v -eq 'C') { Gun $g }
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
