param([string]$Root, [string]$Out)
# Tres propuestas del capo inspirado en Tony Soprano (idle, verde).
# Igual en las tres: gordo, calvo con pelo solo a los lados, camisa de cuadros del color del jugador abierta
# sobre una camiseta blanca y la mano haciendo "el dedo" como en la foto.
# Lo que varía es la cara:  A: mirada seria de frente  ·  B: sonrisa de lado con cadena de oro  ·  C: ceño fruncido y mueca.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'S'='DDAA8C'; 'D'='B07E62'; 'K'='F0C8AE'; 'L'='B87560'; 'H'='3A2E28'; 'R'='2A201C'
        'W'='F0EBDF'; 'P'='000000'; 'O'='D9B54A'; 'E'='E8E0C8' }
# Cabeza 24 px: coronilla calva con brillo, pelo oscuro solo en los lados, cejas gruesas, párpados pesados, nariz ancha y papada.
$head = @(
  '........AAAAAAAA........',
  '......AAKKKSSSSSAA......',
  '.....AKKKSSSSSSSSSA.....',
  '....AKKSSSSSSSSSSSSA....',
  '...ASKSSSSSSSSSSSSSSA...',
  '...AHSSSSSSSSSSSSSSHA...',
  '..AHHSSSSSSSSSSSSSSHHA..',
  '..AHHRRRRSSSSSSRRRRHHA..',
  '..AHHSSSSSSSSSSSSSSHHA..',
  '..AHSAAAASSSSSSAAAASHA..',
  '.ASHSWPPWSSSSSSWPPWSHSA.',
  '.ADSSDDDDSSSSSSDDDDSSDA.',
  '.ADSSSSSSSSADSSSSSSSSDA.',
  '..ASSSSSSSSADSSSSSSSSA..',
  '..ASSSSSSSADDDASSSSSSA..',
  '..ASSSSSSAADDDAASSSSSA..',
  '..ASSSSSSSSSSSSSSSSSSA..',
  '..ASSSSSSAAAAAAASSSSSA..',
  '..ASSSSSSSLLLLLSSSSSSA..',
  '.ASSSSSSSSSSSSSSSSSSSSA.',
  '.ADSSSSSSSSKKSSSSSSSSDA.',
  '.ADDSSSSSSSSSSSSSSSSDDA.',
  '..ADDSSDDDDDDDDDDSSDDA..',
  '..ADDDSSSSSSSSSSSSDDDA..',
  '...AADDDDDDDDDDDDDDAA...',
  '.....AAAAAAAAAAAAAA.....'
)
# Dorso de la mano: dedo medio levantado, índice y anular doblados a los lados.
$hand = @(
  '....AA....',
  '...ASKA...',
  '...ASSA...',
  '...ASSA...',
  '.AAASSAAA.',
  'ASKASSAKSA',
  'ASSADDASSA',
  'ASSSSSSSSA',
  'ADSSSSSSDA',
  'ADSSSSSSDA',
  '.ADDDDDDA.'
)
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Dots($g, $pts, $hex) { foreach ($pt in $pts) { $g[$pt[0],$pt[1]] = C $hex } }
function Plaid($x, $y, $dark) {          # cuadros del color del jugador: rayas oscuras cada 4 px; más oscuro en los costados
  $vx = ($x % 4) -eq 0; $hy = ($y % 4) -eq 0
  $n = if ($vx -and $hy) { 2 } elseif ($vx -or $hy) { 1 } else { 0 }
  if ($dark) { $n++ }
  @('4E8A54','36613A','24422A','1A3020')[$n]
}
function Out-Of($g, $x, $y) { $x -lt 0 -or $x -gt 63 -or $y -lt 0 -or $y -gt 63 -or $g[$x,$y].A -lt 128 }
function Build($v) {
  $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $T } }
  # torso gordo con hombros caídos
  $w = @{ 30=12; 31=15; 32=17; 33=19; 34=20; 35=21 }
  for ($y=30; $y -le 59; $y++) { $hw = if ($w.ContainsKey($y)) { $w[$y] } elseif ($y -le 57) { 22 } else { 21 }
    for ($x=[int](32 - $hw); $x -le [int](31 + $hw); $x++) { $g[$x,$y] = C '4E8A54' } }
  for ($y=26; $y -le 31; $y++) { for ($x=26; $x -le 37; $x++) { $g[$x,$y] = C $(if ($x -le 27 -or $x -ge 36) { $P['D'] } else { $P['S'] }) } }   # cuello
  for ($y=30; $y -le 59; $y++) { for ($x=0; $x -lt 64; $x++) { if ((Hex $g[$x,$y]) -ne '4E8A54') { continue }
    $edge = (Out-Of $g ($x-1) $y) -or (Out-Of $g ($x+1) $y) -or (Out-Of $g $x ($y-1)) -or (Out-Of $g $x ($y+1))
    $side = (Out-Of $g ($x-3) $y) -or (Out-Of $g ($x+3) $y) -or $y -ge 57
    $g[$x,$y] = C $(if ($edge) { '000000' } else { Plaid $x $y $side }) } }
  for ($y=30; $y -le 40; $y++) { for ($x=22; $x -le 41; $x++) {                     # cuello abierto en V con la camiseta blanca
    if ((Hex $g[$x,$y]) -in @($P['S'],$P['D'],'000000') -and $y -lt 32) { continue }
    $half = (40 - $y) * 0.55 + 0.5; $dx = [math]::Abs($x - 31.5)
    if ($dx -le $half) { $g[$x,$y] = C $P['W'] } elseif ($dx -le $half + 1.5) { $g[$x,$y] = C '1A3020' }
  } }
  for ($x=27; $x -le 36; $x++) { $g[$x,31] = C $P['E'] }                             # ribete de la camiseta
  for ($y=41; $y -le 58; $y++) { $g[31,$y] = C '1A3020' }                            # tapeta y botones
  foreach ($y in 44,49,54) { $g[32,$y] = C $P['E'] }
  for ($y=40; $y -le 58; $y++) { $g[51,$y] = C '000000' }                            # brazo derecho colgando
  Paint $g $head 20 2
  # brazo izquierdo: manga de cuadros que sube delante del pecho hasta el puño
  for ($y=45; $y -le 59; $y++) { for ($x=13; $x -le 22; $x++) {
    $g[$x,$y] = C $(if ($x -eq 13 -or $x -eq 22 -or $y -eq 59) { '000000' } else { Plaid ($x+2) $y ($x -le 14) }) } }
  for ($x=14; $x -le 21; $x++) { $g[$x,45] = C '1A3020' }                            # puño de la manga
  Paint $g ($hand | % { $_.Replace('.',' ') }) 13 35
  if ($v -eq 'B') {                                                                  # mira de lado, sonrisa torcida y cadena de oro
    Dots $g @(@(25,12),@(26,12),@(35,12),@(36,12)) $P['W']; Dots $g @(@(27,12),@(28,12),@(37,12),@(38,12)) '000000'
    Dots $g @(@(34,19),@(35,19)) $P['S']; Dots $g @(@(34,18),@(35,18)) '000000'; Dots $g @(,@(36,17)) $P['D']
    Dots $g @(@(26,30),@(27,31),@(28,32),@(29,32),@(30,33),@(31,33),@(32,33),@(33,33),@(34,32),@(35,32),@(36,31),@(37,30)) $P['O']
  } elseif ($v -eq 'C') {                                                            # ceño fruncido y mueca
    Dots $g @(@(28,9),@(35,9)) $P['S']; Dots $g @(@(28,10),@(27,10),@(35,10),@(36,10)) $P['R']
    Dots $g @(@(29,19),@(35,19)) $P['S']; Dots $g @(@(28,20),@(36,20)) '000000'
  }
  $b = New-Object System.Drawing.Bitmap 64,64
  for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $px = $g[$x,$y]; $b.SetPixel($x, $y, $px) } }
  $b
}
foreach ($r in $head) { if ($r.Length -ne 24) { throw "fila mal: $r ($($r.Length))" } }
foreach ($r in $hand) { if ($r.Length -ne 10) { throw "mano mal: $r ($($r.Length))" } }
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @()
foreach ($v in 'A','B','C') { $b = Build $v; $b.Save((Join-Path $Out "idle_$v.png")); $imgs += $b }
$sheet = New-Object System.Drawing.Bitmap (3*384), 384
$sg = [System.Drawing.Graphics]::FromImage($sheet); $sg.InterpolationMode='NearestNeighbor'; $sg.PixelOffsetMode='Half'; $sg.Clear((C '3A3A3A'))
for ($i=0;$i -lt 3;$i++) { $sg.DrawImage($imgs[$i], 384*$i, 0, 384, 384) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
