param([string]$Root, [string]$Out)
# Tres propuestas de "Sr. Montana" (guiño a Scarface; idle, verde) a partir del Mafioso verde.
# Igual en las tres (fiel a la foto): saco blanco, camisa de cuello ancho abierta del color del jugador con el pecho al aire
# y cadenas de oro, pañuelo del color del jugador en el bolsillo izquierdo del pecho, pelo oscuro peinado hacia su derecha
# y la cicatriz que cruza la ceja y el ojo hasta el cachete. Lo que cambia por color: la camisa y el pañuelo.
# Lo que varía es la cara (rasgos):  A: ojos entrecerrados y boca fina  ·  B: mirada de lado y media sonrisa  ·  C: ceño fruncido y mueca con dientes.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'S'='C08A68'; 'D'='9A6A4E'; 'K'='D4A080'; 'L'='8A5040'; 'H'='2A1C14'; 'J'='4A3428'; 'R'='1E140E'
        'W'='E8E4DA'; 'P'='000000'; 'Y'='D9B54A'; 'X'='A84848'; 'F'='4E8A54'; 'G'='36613A'; 'N'='24422A' }
# Cabeza alargada y estrecha (20 px de ancho, 27 de alto), como en la foto de referencia. No es simétrica: el pelo
# va peinado hacia su derecha (el lado izquierdo de la imagen), al lado contrario de la cicatriz.
$head = @(
  '.....AAAAAAAAAA.....',
  '...AAHHHHHHHHHHAA...',
  '..AHHHJHHHHHHJHHHA..',
  '.AHHJJHHHHHHHHHJHHA.',
  '.AHJHHHHHHHHHHHHHHA.',
  'AHHHHHHHHHHSSSSSHHA.',
  'AHHHHHHHSSSSSSSSSHA.',
  'AHHHHSSSSSSSSSSSSHA.',
  '.AHHSSSSSSSSSSSSSHA.',
  '.AHSSRRRRSSSRRRRSSA.',
  '.ADSSSSSSSSSSSSSSDA.',
  '.ADSWPPWSSSWPPWSSDA.',
  '.ADSDDDDSSSDDDDSSDA.',
  '.ADSSSSSSDSSSSSSSDA.',
  '.ADSSSSSSDSSSSSSSDA.',
  '.ADSSSSSADDSSSSSSDA.',
  '.ADSSSSAADDASSSSSDA.',
  '..ADSSSSSSSSSSSSDA..',
  '..ADSSSSSSSSSSSSDA..',
  '..ADSSSAAAAASSSSDA..',
  '..ADSSSSLLLSSSSSDA..',
  '..ADSSSSSSSSSSSSDA..',
  '...ADSSSSSSSSSSDA...',
  '...ADDSSSSSSSSDDA...',
  '....ADDSSSSSSDDA....',
  '.....AADDDDDDAA.....',
  '.......AAAAAA.......'
)
# Cicatriz en diagonal (de arriba a la izquierda hacia abajo a la derecha), del lado derecho de la imagen:
# corta la ceja, cruza el ojo y baja al cachete.
$scar = @(@(33,10), @(34,11), @(34,12), @(35,13), @(35,14), @(36,15), @(36,16), @(37,17), @(37,18), @(38,19))
$faces = @{
  A = @(@(12, 26, 'AAAA'), @(12, 33, 'AAAA'), @(13, 26, 'DWPW'), @(13, 33, 'WPWD'))                                       # ojos entrecerrados, boca fina
  B = @(@(13, 26, 'WWPP'), @(13, 33, 'WWPP'), @(20, 34, 'A'), @(21, 34, 'S'))                                             # mira de lado, media sonrisa
  C = @(@(11, 30, 'S'), @(12, 30, 'R'), @(11, 34, 'S'), @(12, 34, 'R'), @(21, 29, 'AWWWA'), @(22, 30, 'LLL'))              # ceño fruncido y dientes
}
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Dots($g, $pts, $hex) { foreach ($pt in $pts) { $g[$pt[0],$pt[1]] = C $hex } }
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
# Saco negro del Mafioso -> blanco; camisa blanca y corbata -> camisa del color del jugador; cuello -> piel nueva.
$map = @{ '151515'='E8E4DA'; '252525'='F6F2EA'; '0C0C0C'='C8C2B4'
          'FFFFFF'=$P['F']; 'E2DEDE'=$P['G']; 'DADADA'=$P['G']; 'CAC2C2'=$P['N']; '36613A'=$P['F']
          'A06346'=$P['S']; '945D44'=$P['D']; '7B4E38'=$P['D'] }
function Build($v) {
  $g = Grid $base
  for ($y=0; $y -le 26; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }                   # fuera sombrero y cara del Mafioso
  for ($y=27; $y -lt 64; $y++) { for ($x=0;$x -lt 64;$x++) { $c = $g[$x,$y]; if ($c.A -lt 128) { continue }
    $k = Hex $c; $dx = [math]::Abs($x - 31.5); $hw = (46 - $y) * 0.45 + 2.5
    if ($y -ge 32 -and $k -in @('FFFFFF', 'E2DEDE', 'DADADA', 'CAC2C2', '36613A') -and $dx -gt $hw) {             # saco blanco cerrado: la camisa solo se ve en la V
      $g[$x,$y] = C $(if ($dx -le $hw + 1) { '000000' } elseif ($dx -le $hw + 3) { 'F6F2EA' } else { 'E8E4DA' }) }
    elseif ($map.ContainsKey($k)) { $g[$x,$y] = C $map[$k] } } }
  for ($y=30; $y -le 44; $y++) { $hv = (45 - $y) * 0.3 + 0.5                                       # pecho al aire en V
    for ($x=26; $x -le 37; $x++) { $dx = [math]::Abs($x - 31.5)
      if ($dx -le $hv) { $g[$x,$y] = C $(if ($dx -ge $hv - 0.6) { $P['D'] } else { $P['S'] }) } elseif ($dx -le $hv + 1 -and $g[$x,$y].A -ge 128) { $g[$x,$y] = C $P['N'] } } }
  for ($y=44; $y -le 62; $y++) { $hw = (46 - $y) * 0.45 + 2.5                                  # la camisa sigue lisa bajo el pecho (sin la corbata del Mafioso)
    for ($x=26; $x -le 37; $x++) { if ([math]::Abs($x - 31.5) -le $hw - 1 -and $g[$x,$y].A -ge 128 -and $g[$x,($y+1)].A -ge 128) { $g[$x,$y] = C $P['F'] } } }
  for ($y=47; $y -le 62; $y++) { for ($x=27; $x -le 36; $x++) { if ($g[$x,$y].A -ge 128 -and $g[$x,($y+1)].A -ge 128 -and $g[($x-1),$y].A -ge 128 -and $g[($x+1),$y].A -ge 128) {   # saco cerrado abajo
    $g[$x,$y] = C $(if ($x -eq 31) { '000000' } else { 'E8E4DA' }) } } }
  Dots $g @(@(29,33),@(30,34),@(31,35),@(32,35),@(33,34),@(34,33)) $P['Y']                         # cadenas de oro
  Dots $g @(@(29,36),@(30,37),@(31,38),@(32,38),@(33,37),@(34,36)) $P['Y']; Dots $g @(@(31,39),@(32,39)) $P['Y']
  Paint $g @('AAAAAA', 'AFGFGA', '.AFGA.', '..AA..') 39 39                                                      # pañuelo en el bolsillo izquierdo
  Paint $g $head 22 2
  Dots $g $scar $P['X']
  foreach ($o in $faces[$v]) { Paint $g @($o[2]) $o[1] $o[0] }
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $px = $g[$x,$y]; $b.SetPixel($x, $y, $px) } }
  $b
}
foreach ($r in $head) { if ($r.Length -ne 20) { throw "fila mal: $r ($($r.Length))" } }
$base = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_G\idle.png')
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
$sheet = New-Object System.Drawing.Bitmap (3*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
for ($i=0;$i -lt 3;$i++) { $sg.DrawImage($imgs[$i], 384*$i, 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
