param([string]$Root, [string]$Out)
# Tres propuestas del capo inspirado en Peaky Blinders (idle, verde) a partir del Mafioso verde.
# Igual en las tres (fiel a la foto): gorra plana de espiga, abrigo negro, chaleco gris de espiga con cadena de reloj,
# camisa blanca con alfiler en el cuello y corbata del color del jugador (lo único que cambia por color).
# Lo que varía es la cara:  A: afeitado, pálido y ojos azules  ·  B: barba de dos días y cigarrillo  ·  C: cicatriz y mirada sombría.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'G'='4A4A4E'; 'N'='65676D'; 'Q'='2C2C30'; 'U'='5A4A40'
        'S'='E0BBA0'; 'D'='B88C70'; 'K'='F0D2BC'; 'R'='3A2A20'; 'W'='F0EBDF'; 'B'='4F9FD6'; 'P'='000000'; 'L'='A8705A'
        'C'='EEEEEE'; 'E'='E05A20'; 'Y'='9A9A9A'; 'X'='C77F6E'; 'Z'='C9A48C'; 'O'='D9B54A' }
$head = @(
  '.....AAAAAAAAAAAAA......',
  '...AAGGNGGGGNGGGGGAA....',
  '..AGGGGGGNGGGGGGNGGGA...',
  '.AGGNGGGGGGGGNGGGGGGGA..',
  '.AGGGGGNGGGGGGGGGNGGGGA.',
  'AQGGGGGGGGGGGGGGGGGGGGQA',
  'AQQQQQQQQQQQQQQQQQQQQQQA',
  '.AAAAAAAAAAAAAAAAAAAAAA.',
  '..AUDDDDDDDDDDDDDDDDUA..',
  '..AUSRRRRSSSSSSRRRRSUA..',
  '..AUSWBPWSSSSSSWPBWSUA..',
  '..AUSDDDDSSSSSSDDDDSUA..',
  '..AUSSSSSSSADSSSSSSSUA..',
  '..AUKSSSSSSADSSSSSSKUA..',
  '..AUDSSSSSAAAASSSSSDUA..',
  '..AUDSSSSSSSSSSSSSSDUA..',
  '..AUDSSSSAAAAAASSSSDUA..',
  '..AUDSSSSSLLLLSSSSSDUA..',
  '...ADSSSSSSSSSSSSSSDA...',
  '....ADSSSSSKKSSSSSDA....',
  '.....ADDSSSSSSSSDDA.....',
  '......AADDDDDDDDAA......',
  '........AAAAAAAA........'
)
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Dots($g, $pts, $ch) { foreach ($pt in $pts) { $g[$pt[0],$pt[1]] = C $P[$ch] } }
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
function Build($v) {
  $g = Grid $base
  for ($y=0; $y -le 26; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }                   # fuera sombrero y cara del Mafioso
  for ($y=27; $y -lt 64; $y++) { for ($x=0;$x -lt 64;$x++) { $c = $g[$x,$y]; if ($c.A -lt 128) { continue }
    $k = Hex $c
    if ($k -eq 'A06346') { $g[$x,$y] = C $P['S'] } elseif ($k -eq '945D44' -or $k -eq '7B4E38') { $g[$x,$y] = C $P['D'] }   # cuello con la piel nueva
    elseif ($y -ge 35 -and ($k -eq 'FFFFFF' -or $k -eq 'E2DEDE' -or $k -eq 'DADADA') -and [math]::Abs($x - 31.5) -gt (40 - $y) + 1.5) {
      $g[$x,$y] = C @('55575C','45474C','6A6C72')[(($x + 2 * $y) % 3)] }                         # chaleco gris de espiga (deja la camisa en V)
  } }
  Dots $g @(@(28,33),@(35,33)) 'O'                                                                 # alfiler del cuello
  Dots $g @(@(26,45),@(27,46),@(28,47),@(29,48),@(30,48)) 'O'; Dots $g @(,@(29,49)) 'Y'            # cadena del reloj
  Paint $g $head 20 4
  if ($v -eq 'B') {                                                                                # barba de dos días y cigarrillo
    Dots $g @(@(25,20),@(27,21),@(36,21),@(38,20),@(29,22),@(31,23),@(33,23),@(35,22),@(26,22),@(37,22)) 'Z'
    Dots $g @(@(35,20),@(36,21),@(37,21),@(38,22)) 'C'; Dots $g @(,@(39,22)) 'E'                   # cigarrillo caído en la comisura
    Dots $g @(@(43,20),@(42,19),@(43,18),@(43,17),@(42,16),@(43,15)) 'Y'                               # humo
  } elseif ($v -eq 'C') {                                                                          # cicatriz en la mejilla y ceño más duro
    Dots $g @(@(25,14),@(26,15),@(26,16),@(27,17),@(27,18)) 'X'
    Dots $g @(@(26,13),@(27,13),@(28,13),@(35,13),@(36,13),@(37,13)) 'R'
    Dots $g @(@(25,21),@(38,21),@(28,22),@(35,22)) 'Z'
  }
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
