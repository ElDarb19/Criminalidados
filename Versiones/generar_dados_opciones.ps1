param([string]$Root, [string]$Out, [string]$Color = 'Color_R')
# Tres propuestas de juego de dados decorativo (solo cambia cómo se ve, nunca el resultado), en un color.
# Cada dado del juego se arma igual que hoy (sombra + color del jugador + contorno + número) y la decoración va encima,
# así el color del jugador sigue mandando para saber de quién es la tirada.
#  A: Oro       — contorno exterior dorado y números de oro.
#  B: Casino    — franjas blancas por dentro del borde, como una ficha de póker.
#  C: Balazo    — dado de plomo (color más metálico) con un agujero de bala y grietas en una esquina.
Add-Type -AssemblyName System.Drawing
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
function Mix($a, $b, [double]$t) { [System.Drawing.Color]::FromArgb($a.A, [int]($a.R + ($b.R - $a.R) * $t), [int]($a.G + ($b.G - $a.G) * $t), [int]($a.B + ($b.B - $a.B) * $t)) }
$T = [System.Drawing.Color]::Transparent
$dice = @{ D4=4; D6=6; D8=8; D12=12; D20=20 }
function Load($p) { if (Test-Path $p) { New-Object System.Drawing.Bitmap $p } else { $null } }
function Over($dst, $src) {                        # pega una capa encima (respeta su transparencia)
  if (-not $src) { return }
  for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { $s = $src.GetPixel($x, $y); if ($s.A -eq 0) { continue }
    $d = $dst.GetPixel($x, $y); $a = $s.A / 255
    $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb([math]::Max($d.A, $s.A), [int]($d.R + ($s.R - $d.R) * $a), [int]($d.G + ($s.G - $d.G) * $a), [int]($d.B + ($s.B - $d.B) * $a))) } }
}
function Mask($bmp) { $m = New-Object 'bool[,]' 48, 48; for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { $m[$x, $y] = $bmp.GetPixel($x, $y).A -ge 128 } }; , $m }
function Erode($m) { $r = New-Object 'bool[,]' 48, 48
  for ($y = 1; $y -lt 47; $y++) { for ($x = 1; $x -lt 47; $x++) { $r[$x, $y] = $m[$x, $y] -and $m[($x-1), $y] -and $m[($x+1), $y] -and $m[$x, ($y-1)] -and $m[$x, ($y+1)] } }; , $r }
function Build($die, $style) {
  $n = $dice[$die]; $dir = Join-Path $Root "assets\$die"
  $base = Load "$dir\Capa 0.png"; $col = Load "$dir\$Color.png"; $sh = Load "$dir\Sombra.png"; $num = Load "$dir\$n.png"
  $out = New-Object System.Drawing.Bitmap 48, 48
  $c = New-Object System.Drawing.Bitmap $col
  if ($style -eq 'C') { for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { $p = $c.GetPixel($x, $y); if ($p.A -gt 0) { $c.SetPixel($x, $y, (Mix $p (C '#7A8088') 0.55)) } } } }   # plomo
  if ($n -gt 6) { Over $out $sh }; Over $out $c
  $m = Mask $col; $all = Mask $base; for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { $all[$x, $y] = $all[$x, $y] -or $m[$x, $y] } }
  if ($style -eq 'B') {                                                       # franjas de ficha de casino por dentro del borde
    $e2 = Erode (Erode $m); $e3 = Erode $e2; $cx = 23.5; $cy = 23.5
    for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { if (-not ($e2[$x, $y] -and -not $e3[$x, $y])) { continue }
      $ang = [math]::Atan2($y - $cy, $x - $cx); if ([math]::Floor(($ang + [math]::PI) / [math]::PI * 8) % 2 -eq 0) { $out.SetPixel($x, $y, (C '#F2F2F2')) } } }
  }
  if ($style -eq 'C-old') {
    $hx = 16; $hy = 30
    foreach ($pt in @(@(-5,-2),@(-4,-1),@(-3,-1),@(4,1),@(5,2),@(6,2),@(-1,4),@(-1,5),@(0,6),@(2,-4),@(3,-5),@(3,-6))) { $x = $hx + $pt[0]; $y = $hy + $pt[1]; if ($m[$x, $y]) { $out.SetPixel($x, $y, (C '#2A2A2E')) } }
    for ($y = $hy - 4; $y -le $hy + 4; $y++) { for ($x = $hx - 4; $x -le $hx + 4; $x++) { $d = [math]::Sqrt(($x - $hx) * ($x - $hx) + ($y - $hy) * ($y - $hy))
      if ($d -le 1.5) { $out.SetPixel($x, $y, (C '#000000')) } elseif ($d -le 2.6 -and $m[$x, $y]) { $out.SetPixel($x, $y, (C '#C8CCD2')) } } }
  }
  Over $out $base
  if ($style -eq 'A') {                                                       # contorno exterior de oro
    for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { if (-not $all[$x, $y]) { continue }
      $edge = $x -eq 0 -or $y -eq 0 -or $x -eq 47 -or $y -eq 47 -or -not ($all[($x-1), $y] -and $all[($x+1), $y] -and $all[$x, ($y-1)] -and $all[$x, ($y+1)])
      if ($edge) { $out.SetPixel($x, $y, $(if ($y -lt 24) { C '#E8C860' } else { C '#B8922E' })) } } }
  }
  if ($style -eq 'B') {                                                       # franjas de ficha de casino por dentro del borde (sobre la silueta entera)
    $e2 = Erode (Erode $all); $e4 = Erode (Erode $e2); $cx = 23.5; $cy = 23.5
    for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { if (-not ($e2[$x, $y] -and -not $e4[$x, $y])) { continue }
      $ang = [math]::Atan2($y - $cy, $x - $cx); if ([math]::Floor(($ang + [math]::PI) / [math]::PI * 6) % 2 -eq 0) { $out.SetPixel($x, $y, (C '#F2F2F2')) } } }
  }
  if ($style -eq 'C') {                                                       # agujero de bala con grietas, abajo a la izquierda de la cara
    $hx = 15; $hy = 31
    foreach ($ray in @(@(-1,0,7), @(1,1,6), @(0,1,6), @(1,-1,7), @(-1,-1,5), @(1,0,5))) { for ($k = 4; $k -le $ray[2]; $k++) { $x = $hx + $ray[0] * $k; $y = $hy + $ray[1] * $k
      if ($x -ge 0 -and $x -lt 48 -and $y -ge 0 -and $y -lt 48 -and $all[$x, $y]) { $out.SetPixel($x, $y, (C '#E8ECF0')) } } }
    for ($y = $hy - 4; $y -le $hy + 4; $y++) { for ($x = $hx - 4; $x -le $hx + 4; $x++) { $d = [math]::Sqrt(($x - $hx) * ($x - $hx) + ($y - $hy) * ($y - $hy))
      if ($d -le 2.2) { $out.SetPixel($x, $y, (C '#000000')) } elseif ($d -le 3.4) { $out.SetPixel($x, $y, $(if (($x + $y) % 2) { C '#5A5E66' } else { C '#C8CCD2' })) } } }
  }  $nn = New-Object System.Drawing.Bitmap $num
  if ($style -eq 'A') { for ($y = 0; $y -lt 48; $y++) { for ($x = 0; $x -lt 48; $x++) { $p = $nn.GetPixel($x, $y); if ($p.A -gt 0 -and $p.R -gt 200 -and $p.G -gt 200) { $nn.SetPixel($x, $y, (C '#F2D16B')) } } } }
  Over $out $nn
  , $out
}
New-Item -ItemType Directory -Force $Out | Out-Null
$styles = @('-', 'A', 'B', 'C'); $names = @{ '-'='Actual'; A='A - Oro'; B='B - Casino'; C='C - Balazo' }
$order = 'D4', 'D6', 'D8', 'D12', 'D20'
$sc = 4; $cell = 48 * $sc + 12
$sheet = New-Object System.Drawing.Bitmap (150 + $cell * 5), ($cell * 4)
$g = [System.Drawing.Graphics]::FromImage($sheet); $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'; $g.Clear((C '#3A332A'))
$font = New-Object System.Drawing.Font 'Arial', 16, ([System.Drawing.FontStyle]::Bold)
for ($r = 0; $r -lt 4; $r++) { $st = $styles[$r]
  $g.DrawString($names[$st], $font, [System.Drawing.Brushes]::White, 8, $r * $cell + $cell / 2 - 12)
  for ($i = 0; $i -lt 5; $i++) { $b = Build $order[$i] $(if ($st -eq '-') { '' } else { $st })
    if ($st -ne '-') { New-Item -ItemType Directory -Force (Join-Path $Out $st) | Out-Null; $b.Save((Join-Path $Out "$st\$($order[$i]).png")) }
    $g.DrawImage($b, 150 + $i * $cell + 6, $r * $cell + 6, 48 * $sc, 48 * $sc); $b.Dispose() } }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
