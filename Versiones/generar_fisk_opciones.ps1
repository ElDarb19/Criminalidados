param([string]$Root, [string]$Out)
# Tres propuestas de "Sr. Fisk" (guiño a Kingpin; idle, verde), dibujado desde cero porque es mucho más grande que el Mafioso.
# Igual en las tres (fiel a la referencia del cómic): gigante de hombros a hombros, cabeza calva ovalada, traje blanco cruzado
# con botones dobles y pañuelo en el bolsillo, camisa blanca y corbatín del color del jugador (lo único que cambia por color).
# Lo que varía es la cara (rasgos, no gestos):
#  A: ojos pequeños y juntos bajo una frente pesada, nariz ancha y chata, boca fina y larga
#  B: ojos hundidos en sombra, nariz larga, boca pequeña y papada
#  C: ojos separados y entrecerrados con bolsas, nariz de botón, labios gruesos caídos y cachetes
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'S'='E0B49A'; 'D'='B8866C'; 'K'='F4D4C0'; 'L'='B07060'; 'W'='F0EBDF'; 'E'='9A6A54'
        'U'='E8E4DA'; 'V'='C8C2B4'; 'X'='F6F2EA'; 'H'='F2F2F2'; 'I'='D4D4D4'; 'F'='36613A'; 'G'='24422A'; 'B'='8A8678'; 'Q'='A0A0A8' }
# Cabeza ovalada (más alta que ancha), 24 px simétrica: se escribe la mitad izquierda y se refleja.
$half = @(
  '........AAAA',
  '......AAKKKS',
  '.....AKKKSSS',
  '....AKKSSSSS',
  '...AKKSSSSSS',
  '...ASKSSSSSS',
  '..ASSSSSSSSS',
  '..ASSSSSSSSS',
  '..ASSSSSSSSS',
  '.ASSSSSSSSSS',
  '.ASSSSSSSSSS',
  '.ADSSSSSSSSS',
  '.ADSSSSSSSSS',
  '.ADSSSSSSSSS',
  '.ADSSSSSSSSS',
  '.ADSSSSSSSSS',
  '.ADSSSSSSSSS',
  '..ADSSSSSSSS',
  '..ADSSSSSSSS',
  '..ADDSSSSSSS',
  '...ADSSSSSSS',
  '...ADDSSSSSS',
  '....ADDSSSSS',
  '.....ADDDDDD',
  '......AAAAAA'
)
$head = $half | ForEach-Object { $a = $_.ToCharArray(); [array]::Reverse($a); $_ + (-join $a) }
# Caras (coordenadas absolutas; la cabeza va en col 20, fila 2, con el centro entre las cols 31 y 32).
$faces = @{
  A = @(@(12, 25, 'EEEEE    EEEEE'), @(13, 26, 'DDDD    DDDD'), @(14, 26, 'WAA      AAW'),
        @(16, 31, 'DD'), @(17, 30, 'DDDD'), @(18, 29, 'ADDDDA'), @(19, 29, 'AA  AA'),
        @(21, 27, 'AAAAAAAAAA'), @(22, 29, 'LLLLLL'))
  B = @(@(12, 25, 'DDDDD    DDDDD'), @(13, 25, 'EEEEE    EEEEE'), @(14, 25, 'EWAAE    EAAWE'), @(15, 25, ' DDD      DDD'),
        @(15, 31, 'DD'), @(16, 31, 'DD'), @(17, 31, 'DD'), @(18, 30, 'ADDA'), @(19, 30, 'AAAA'),
        @(22, 30, 'AAAA'), @(23, 31, 'LL'), @(25, 26, 'DDDDDDDDDDDD'))
  C = @(@(13, 23, 'EEEE        EEEE'), @(14, 23, 'AAAA        AAAA'), @(15, 23, 'DDDD        DDDD'), @(16, 24, 'DD          DD'),
        @(18, 30, 'DAAD'),
        @(21, 28, 'AAAAAAAA'), @(22, 27, 'ALLLLLLLLA'), @(23, 28, 'AAAAAAAA'),
        @(22, 22, 'D'), @(23, 22, 'DD'), @(24, 23, 'D'), @(22, 41, 'D'), @(23, 40, 'DD'), @(24, 40, 'D'))
}
$bow = @('AA    AA', 'AFFAAFFA', 'AFFGGFFA', 'AFFAAFFA', 'AA    AA')
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Ops($g, $ops) { foreach ($o in $ops) { Paint $g @($o[2]) $o[1] $o[0] } }
function Build($v) {
  $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $T } }
  $w = @{ 26=10; 27=14; 28=18; 29=21; 30=23; 31=25; 32=26; 33=27; 34=28 }                                       # gigante: hombros casi de borde a borde
  for ($y=26; $y -le 60; $y++) { $hw = if ($w.ContainsKey($y)) { $w[$y] } else { 29 }
    for ($x=[math]::Max(0, [int](32 - $hw)); $x -le [math]::Min(63, [int](31 + $hw)); $x++) { $g[$x,$y] = C $P['U'] } }
  $in = { param($x, $y) $x -ge 0 -and $x -le 63 -and $y -ge 0 -and $y -le 63 -and $g[$x,$y].A -ge 128 }
  $edge = @(); for ($y=26; $y -le 60; $y++) { for ($x=0; $x -lt 64; $x++) { if (-not (& $in $x $y)) { continue }
    if (-not ((& $in ($x-1) $y) -and (& $in ($x+1) $y) -and (& $in $x ($y-1)) -and (& $in $x ($y+1)))) { $edge += ,@($x,$y) }
    elseif (-not ((& $in ($x-3) $y) -and (& $in ($x+3) $y)) -or $y -ge 58) { $g[$x,$y] = C $P['V'] } } }
  foreach ($e in $edge) { $g[$e[0],$e[1]] = C '000000' }
  for ($y=44; $y -le 59; $y++) { $g[13,$y] = C $P['V']; $g[50,$y] = C $P['V'] }                  # brazos a los lados
  for ($y=27; $y -le 42; $y++) { $hv = (42 - $y) * 0.4 + 1                                         # camisa en V con solapas anchas
    for ($x=18; $x -le 45; $x++) { $dx = [math]::Abs($x - 31.5)
      if ($dx -le $hv) { $g[$x,$y] = C $(if ($dx -ge $hv - 1) { $P['I'] } else { $P['H'] }) }
      elseif ($dx -le $hv + 1) { $g[$x,$y] = C '000000' } elseif ($dx -le $hv + 4) { $g[$x,$y] = C $P['X'] } } }
  for ($y=43; $y -le 59; $y++) { $g[34,$y] = C '000000' }                                          # saco cruzado
  foreach ($y in 46, 52) { foreach ($x in 27, 40) { $g[$x,$y] = C $P['B'] } }                       # botones dobles
  Paint $g @('AAAAA', 'AQHQA') 41 37                                                               # pañuelo en el bolsillo
  Paint $g ($bow | ForEach-Object { $_.Replace(' ', ' ') }) 28 28                                  # corbatín del color del jugador
  Paint $g $head 20 2
  Ops $g $faces[$v]
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $px = $g[$x,$y]; $b.SetPixel($x, $y, $px) } }
  $b
}
foreach ($r in $head) { if ($r.Length -ne 24) { throw "fila mal: $r ($($r.Length))" } }
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
$sheet = New-Object System.Drawing.Bitmap (3*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
for ($i=0;$i -lt 3;$i++) { $sg.DrawImage($imgs[$i], 384*$i, 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
