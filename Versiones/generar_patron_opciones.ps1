param([string]$Root, [string]$Out)
# Tres propuestas de "El Patrón" (idle, verde) a partir del Mafioso verde.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
# Las claves de los hashtables de PowerShell no distinguen mayúsculas: las minúsculas se guardan con prefijo "_".
$P = @{
  'A'='000000'; 'H'='151515'; '_h'='34302C'; 'S'='A06346'; '_s'='7B4E38'; '_k'='B57A58';
  'M'='0A0A0A'; '_m'='2C2C2C'; 'L'='7A3F2E'; 'W'='CAC2C2'; 'P'='000000'; 'Y'='E0BC4E'; '_y'='A7832E'
}
function Key($ch) { if ($ch -cmatch '[a-z]') { '_' + $ch } else { $ch } }
$base = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_G\idle.png')
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent

$head = @(
  '......AA.AAA.AA.....',
  '....AAhHAhHHAHhAA...',
  '...AHHHHhHHHHHHhHA..',
  '..AHhHHHHHhHHhHHHHA.',
  '.AHHHhHHhHHHHHHhHHHA',
  '.AHhHHHHHHhHHhHHHhHA',
  'AHHHHhHHhHHHHHHHHHHA',
  'AHhHHHHHHHHHhHHHhHHA',
  'AHHHHhHHHHHHHSSSHHHA',
  'AHhHHHHHHHHSSSSSSHhA',
  'AHHHHHhHHSSSSSSSSSHA',
  'AHHhHHHSSSSSSSSSSSHA',
  'AHHHAAAASSSSAAAASSHA',
  'AHHSSWPWSSSSWPWSSSHA',
  'AHSSSsSSSSSSSSsSSSHA',
  'ASSkSSSSsSSsSSSSkSSA',
  'ASSSSSSSsAAsSSSSSSSA',
  'ASSSSMMMMMMMMMMSSSSA',
  'ASSSMMmMMMMMMmMMSSSA',
  'ASSSMMSLLLLLLSMMSSSA',
  'AsSSSMSSSSSSSSMSSSsA',
  '.AsSSSSSSSSSSSSSSsA.',
  '..AssSSSSSSSSSSssA..',
  '...AAssssssssssAA...'
)
$hairB = @(                            # más volumen y rizos, el mechón cae a la derecha de su cara
  '.....AA.AAA.AAA.AA....',
  '...AAHhAHhHAHhHAHhAA..',
  '..AHhHHHhHHHhHHHhHHA..',
  '.AHHHhHHHhHHHhHHHhHHA.',
  'AHhHHHhHHHhHHHhHHHhHHA',
  'AHHHhHHHhHHHhHHHhHHHHA',
  'AHhHHHhHHHhHHHhHHHhHHA',
  'AHHHhHHHhHHHhHHHhHHhHA',
  'AHhHHHHHhHHHHHSSSHHHHA',
  'AHHHhHHHHHHHSSSSSSHhHA',
  'AHhHHHHhHHSSSSSSSSSHHA',
  'AHHHhHHHSSSSSSSSSSSHhA',
  '.AHhHHSSSSSSSSSSSSSHA.'
)
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) {
    $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) {
      $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $x = $col + $j; $y = $row + $i
      $g[$x,$y] = if ($ch -eq '.') { $T } else { C $P[(Key $ch)] }
    }
  }
}
function Fatten($g, $y0, $y1) {        # barriga: ensancha 1 px por lado entre esas filas
  for ($y=$y0; $y -le $y1; $y++) {
    for ($x=0; $x -le 25; $x++) { $g[$x,$y] = $g[($x+1),$y] }
    for ($x=63; $x -ge 38; $x--) { $g[$x,$y] = $g[($x-1),$y] }
  }
}
function Chain($g) {                   # piel del pecho abierta con cadena de oro
  for ($y=31; $y -le 40; $y++) { for ($x=28; $x -le 35; $x++) { $px = $g[$x,$y]; if ((Hex $px) -eq '36613A') { $g[$x,$y] = C $P['S'] } } }
  foreach ($pt in @(@(29,34),@(30,35),@(31,36),@(32,36),@(33,35),@(34,34))) { $g[$pt[0],$pt[1]] = C $P['Y'] }
  $g[31,37] = C $P['_y']; $g[32,37] = C $P['Y']; $g[31,38] = C $P['Y']; $g[32,38] = C $P['_y']
}
function Shirt($g, $hex) {             # sin corbata: tapa sus bordes y dibuja la tapeta con botones
  for ($y=33; $y -le 40; $y++) { for ($x=30; $x -le 33; $x++) { $px = $g[$x,$y]; if ((Hex $px) -eq '000000') { $g[$x,$y] = C $P['S'] } } }
  for ($y=41; $y -le 54; $y++) {
    foreach ($x in 29, 34) { $px = $g[$x,$y]; if ((Hex $px) -eq '000000') { $g[$x,$y] = C $hex } }
    $g[31,$y] = C '2F5634'
  }
  foreach ($y in 43, 47, 51) { $g[32,$y] = C 'E8E0C8' }
}
function Remap($g, $map) { for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $c=$g[$x,$y]; if ($c.A -lt 128) { continue }; $k = Hex $c; if ($map.ContainsKey($k)) { $g[$x,$y] = C $map[$k] } } } }
function Build($variant) {
  $g = Grid $base
  for ($y=7; $y -le 27; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }      # fuera sombrero y cara
  Fatten $g 38 55; Fatten $g 41 52
  if ($variant -eq 'B') {               # camisa verde abierta, sin saco
    Chain $g
    Remap $g @{ '151515'='36613A'; '252525'='4E8A54'; '0C0C0C'='26472A'; 'FFFFFF'='41744A'; 'E2DEDE'='36613A'; 'DADADA'='36613A'; '36613A'='41744A' }
    Shirt $g '41744A'
  } elseif ($variant -eq 'C') {         # saco negro, camisa verde abierta, cadena
    Chain $g
    Remap $g @{ 'FFFFFF'='4E8A54'; 'E2DEDE'='41744A'; 'DADADA'='41744A'; '36613A'='4E8A54' }
    Shirt $g '4E8A54'
  }
  Paint $g $head 22 6
  if ($variant -eq 'B') { Paint $g $hairB 21 5 }
  Paint $g @('AS','As') 20 19; Paint $g @('A') 21 21
  Paint $g @('SA','sA') 42 19; Paint $g @('A') 42 21
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $px = $g[$x,$y]; $b.SetPixel($x, $y, $px) } }
  $b
}
foreach ($r in $head) { if ($r.Length -ne 20) { throw "fila mal: $r ($($r.Length))" } }
foreach ($r in $hairB) { if ($r.Length -ne 22) { throw "fila mal: $r ($($r.Length))" } }
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
# hoja de vista previa x6 con el Mafioso original a la izquierda
$sheet = New-Object System.Drawing.Bitmap (4*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
$sg.DrawImage($base, 0, 0, 384, 384)
for ($i=0;$i -lt 3;$i++) { $sg.DrawImage($imgs[$i], 384*($i+1), 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
