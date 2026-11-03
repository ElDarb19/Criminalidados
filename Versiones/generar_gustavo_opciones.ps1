param([string]$Root, [string]$Out)
# Tres propuestas de "Gustavo" (guiño a Gustavo Fring; idle, verde) a partir del Mafioso verde.
# Igual en las tres (fiel a la foto): traje gris, camisa celeste, corbata del color del jugador (lo único que cambia por color),
# pelo muy corto con entradas y lentes redondos de montura fina.
# Lo que varía:  A: serio de frente  ·  B: ajustándose el nudo de la corbata, como en la foto, con reloj  ·  C: sonrisa cortés y pin dorado en la solapa.
Add-Type -AssemblyName System.Drawing
function C($h) { [System.Drawing.Color]::FromArgb(255, [Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }
function Hex($c) { '{0:X2}{1:X2}{2:X2}' -f $c.R,$c.G,$c.B }
$T = [System.Drawing.Color]::Transparent
# Solo letras mayúsculas (las claves de PowerShell no distinguen mayúsculas).
$P = @{ 'A'='000000'; 'S'='7A4E38'; 'D'='5E3A28'; 'K'='94654A'; 'L'='5A3428'; 'H'='1E1A18'; 'R'='241A16'
        'W'='E8E4DA'; 'P'='000000'; 'O'='A89868'; 'Y'='D9B54A'; 'G'='6E7276'; 'M'='C0C0C0' }
# Cabeza 24 px simétrica: se escribe la mitad izquierda y se refleja.
$half = @(
  '......AAAAAA',
  '....AAHHHHHH',
  '...AHHHHHHHH',
  '..AHHHHSSSSS',
  '..AHHSSSSSSS',
  '..AHSSSSSSSS',
  '..ASSRRRRSSS',
  '.ASSSOOOOSSS',
  'ADSSOWPPWOOO',
  'ADSSOSSSSOSS',
  '.ASSSOOOOSSS',
  '..ASSSSSSSSD',
  '..ASSSSSSSAD',
  '..ASSSSSSAAD',
  '..ADSSSSSSSS',
  '..ADSSSSSAAA',
  '..ADSSSSSSLL',
  '...ADSSSSSSS',
  '...ADDSSSSSS',
  '....ADDSSSSS',
  '.....ADDDDDD',
  '......AAAAAA'
)
$head = $half | ForEach-Object { $a = $_.ToCharArray(); [array]::Reverse($a); $_ + (-join $a) }
function Paint($g, $rows, $col, $row) {
  for ($i=0; $i -lt $rows.Count; $i++) { $r = $rows[$i]
    for ($j=0; $j -lt $r.Length; $j++) { $ch = [string]$r[$j]; if ($ch -eq ' ') { continue }
      $g[($col + $j),($row + $i)] = if ($ch -eq '.') { $T } else { C $P[$ch] } } }
}
function Dots($g, $pts, $hex) { foreach ($pt in $pts) { $g[$pt[0],$pt[1]] = C $hex } }
function Grid($bmp) { $g = New-Object 'object[,]' 64,64; for ($y=0;$y -lt 64;$y++){ for($x=0;$x -lt 64;$x++){ $g[$x,$y] = $bmp.GetPixel($x,$y) } }; ,$g }
# Saco negro del Mafioso -> traje gris; camisa blanca -> celeste; cuello -> piel nueva. La corbata verde se queda.
$map = @{ '151515'='6E7276'; '252525'='8A8E92'; '0C0C0C'='52565A'
          'FFFFFF'='C8DCEC'; 'E2DEDE'='A8C0D4'; 'DADADA'='A8C0D4'; 'CAC2C2'='90A8BC'
          'A06346'=$P['S']; '945D44'=$P['D']; '7B4E38'=$P['D'] }
function Build($v) {
  $g = Grid $base
  for ($y=0; $y -le 26; $y++) { for ($x=0;$x -lt 64;$x++) { $g[$x,$y] = $T } }                   # fuera sombrero y cara del Mafioso
  for ($y=27; $y -lt 64; $y++) { for ($x=0;$x -lt 64;$x++) { $c = $g[$x,$y]; if ($c.A -lt 128) { continue }
    $k = Hex $c
    if ($y -ge 35 -and ($k -eq 'FFFFFF' -or $k -eq 'E2DEDE' -or $k -eq 'DADADA' -or $k -eq 'CAC2C2') -and [math]::Abs($x - 31.5) -gt (42 - $y) * 0.7 + 1.5) {
      $g[$x,$y] = C $(if ([math]::Abs($x - 31.5) -le (42 - $y) * 0.7 + 2.5) { '000000' } else { '7E8286' }) }   # saco gris cerrado (deja la camisa en V)
    elseif ($map.ContainsKey($k)) { $g[$x,$y] = C $map[$k] } } }
  for ($y=44; $y -le 56; $y++) { if ($g[31,$y].A -ge 128 -and (Hex $g[31,$y]) -ne '000000') { $g[31,$y] = C '000000' } }   # cierre del saco
  Dots $g @(@(32,46),@(32,51)) '2A2A2A'                                                            # botones
  Paint $g $head 20 5
  if ($v -eq 'B') {                                                                                # mano en el nudo de la corbata, manga gris y reloj
    for ($i=0; $i -le 11; $i++) { $cx = 27 - $i; $cy = 35 + $i                                      # antebrazo en diagonal hacia abajo a la izquierda
      for ($x=$cx-3; $x -le $cx+3; $x++) { $g[$x,$cy] = C $(if ($x -eq $cx-3 -or $x -eq $cx+3) { '000000' } elseif ($x -eq $cx+2) { '6E7276' } else { '9A9EA2' }) } }
    Dots $g @(@(26,34),@(27,34),@(28,34),@(26,35),@(27,35)) 'A8C0D4'                                # puño de la camisa
    Dots $g @(@(25,36),@(26,36),@(24,37)) '2A2A2A'; Dots $g @(,@(25,36)) $P['M']                    # reloj
    Paint $g @('.AAAA.', 'ASKSSA', 'ASSKSA', 'ADSSDA', '.AAAA.') 28 30                              # mano pellizcando el nudo
  } elseif ($v -eq 'C') {                                                                          # sonrisa cortés y pin dorado
    Dots $g @(@(29,20),@(34,20)) '000000'; Dots $g @(@(30,21),@(31,21),@(32,21),@(33,21)) '000000'
    Dots $g @(@(30,20),@(31,20),@(32,20),@(33,20)) $P['S']
    Dots $g @(@(24,36),@(25,36),@(24,37),@(25,37)) $P['Y']
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
