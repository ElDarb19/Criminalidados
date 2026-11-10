param([string]$Root, [string]$Out)
# Tres propuestas de logo/icono (dado con sombrero de mafioso), a partir de los sprites del juego: los dados de assets/D*
# y el sombrero del Mafioso. Se arma en 128x128 de pixel art y se agranda x4 (512x512, como el icono actual).
#  A: el icono de hoy (D20 rojo en el aro dorado) con el sombrero ladeado
#  B: D6 rojo con sombrero, puro en la comisura y humo
#  C: D20 blanco con sombrero de cinta dorada, agujero de bala y cinta con el nombre
Add-Type -AssemblyName System.Drawing
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
$T = [System.Drawing.Color]::Transparent
function Px($b, $x, $y, $c) { if ($x -ge 0 -and $y -ge 0 -and $x -lt $b.Width -and $y -lt $b.Height) { $b.SetPixel($x, $y, $c) } }
function Over($dst, $src, $ox, $oy, $s) {          # pega un sprite escalado s veces (vecino más cercano)
  for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) { $p = $src.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    for ($j = 0; $j -lt $s; $j++) { for ($i = 0; $i -lt $s; $i++) { Px $dst ($ox + $x * $s + $i) ($oy + $y * $s + $j) $p } } } }
}
function Die($sides, $color, $val) {               # dado 48x48 con sus capas
  $d = Join-Path $Root "assets\D$sides"; $b = New-Object System.Drawing.Bitmap 48, 48
  $layers = @(); if ($sides -gt 6) { $layers += 'Sombra' }; $layers += $color, 'Capa 0', "$val"
  foreach ($l in $layers) { $s = New-Object System.Drawing.Bitmap (Join-Path $d "$l.png"); Over $b $s 0 0 1; $s.Dispose() }
  , $b
}
function Hat($band) {                              # sombrero del Mafioso (filas 7-17, cols 20-43) con la cinta del color pedido
  $m = New-Object System.Drawing.Bitmap (Join-Path $Root 'assets\characters\Mafioso\Color_R\idle.png')
  $keep = @('000000', '151515', '252525', '0C0C0C', '0F0F0F', '161616')
  $h = New-Object System.Drawing.Bitmap 26, 11
  for ($y = 7; $y -le 17; $y++) { for ($x = 19; $x -le 44; $x++) { $p = $m.GetPixel($x, $y); if ($p.A -lt 128) { continue }
    $k = '{0:X2}{1:X2}{2:X2}' -f $p.R, $p.G, $p.B; if ($keep -notcontains $k) { continue }
    $c = if (($y -eq 13 -or $y -eq 14) -and $k -ne '000000' -and $band) { C $band } elseif (($y -eq 13 -or $y -eq 14) -and $band -and $x -gt 21 -and $x -lt 42) { C $band } else { $p }
    $h.SetPixel($x - 19, $y - 7, $c) } }
  $m.Dispose()
  $o = New-Object System.Drawing.Bitmap 28, 13
  for ($y = 0; $y -lt 11; $y++) { for ($x = 0; $x -lt 26; $x++) { if ($h.GetPixel($x, $y).A -lt 128) { continue }
    foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) { $nx = $x + $d[0]; $ny = $y + $d[1]; if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge 26 -or $ny -ge 11 -or $h.GetPixel($nx, $ny).A -lt 128) { $o.SetPixel($nx + 1, $ny + 1, (C '#9a8a6a')) } } } }
  for ($y = 0; $y -lt 11; $y++) { for ($x = 0; $x -lt 26; $x++) { $p = $h.GetPixel($x, $y); if ($p.A -ge 128) { $o.SetPixel($x + 1, $y + 1, $p) } } }
  $h.Dispose(); , $o
}
function Tilt($src, $k) {                          # ladea un sprite (las filas de arriba se corren a la derecha)
  $w = $src.Width + 6; $b = New-Object System.Drawing.Bitmap $w, $src.Height
  for ($y = 0; $y -lt $src.Height; $y++) { $dx = [int][math]::Round(($src.Height - 1 - $y) * $k)
    for ($x = 0; $x -lt $src.Width; $x++) { $p = $src.GetPixel($x, $y); if ($p.A -ge 128) { Px $b ($x + $dx) $y $p } } }
  , $b
}
function Ring($b, $cx, $cy, $r, $c) { for ($y = 0; $y -lt 128; $y++) { for ($x = 0; $x -lt 128; $x++) { $d = [math]::Sqrt(($x - $cx) * ($x - $cx) + ($y - $cy) * ($y - $cy)); if ([math]::Abs($d - $r) -le .9) { Px $b $x $y $c } } } }
function Fill($b, $c) { for ($y = 0; $y -lt 128; $y++) { for ($x = 0; $x -lt 128; $x++) { $b.SetPixel($x, $y, $c) } } }

function Build($v) {
  $b = New-Object System.Drawing.Bitmap 128, 128; Fill $b (C '#0b0a08')
  switch ($v) {
    'A' { Ring $b 64 64 58 (C '#c9a44a')
          $d = Die 20 'Color_R' 20; Over $b $d 16 30 2
          $h = Tilt (Hat '#a81515') .35; Over $b $h 13 4 3 }
    'B' {
          $d = Die 6 'Color_R' 6; Over $b $d 10 30 2
          $h = Tilt (Hat '#c9a44a') .3; Over $b $h 6 0 3
          for ($x = 98; $x -le 114; $x++) { foreach ($y in 76..80) { Px $b $x $y (C $(if ($y -eq 76 -or $y -eq 80) { '#000000' } else { '#7a4a2a' })) } }   # puro
          foreach ($y in 77..79) { Px $b 103 $y (C '#c9a44a'); Px $b 104 $y (C '#c9a44a'); Px $b 114 $y (C '#e05a20'); Px $b 115 $y (C '#ffb02e'); Px $b 116 $y (C '#000000') }
          foreach ($pt in @(@(115,74),@(116,72),@(116,70),@(115,68),@(114,66),@(115,64),@(116,62),@(117,60))) { Px $b $pt[0] $pt[1] (C '#bdbdbd'); Px $b ($pt[0] + 1) $pt[1] (C '#bdbdbd'); Px $b ($pt[0] + 2) $pt[1] (C '#8a8a8a') } }
    'C' { Ring $b 64 60 54 (C '#c9a44a'); Ring $b 64 60 51 (C '#6b5220')
          $d = Die 20 'Color_W' 20; Over $b $d 16 24 2
          $h = Tilt (Hat '#a81515') .35; Over $b $h 13 (-2) 3
          $hx = 44; $hy = 88                                                                       # agujero de bala
          for ($y = $hy - 5; $y -le $hy + 5; $y++) { for ($x = $hx - 5; $x -le $hx + 5; $x++) { $dd = [math]::Sqrt(($x - $hx) * ($x - $hx) + ($y - $hy) * ($y - $hy))
            if ($dd -le 2.4) { Px $b $x $y (C '#000000') } elseif ($dd -le 3.6) { Px $b $x $y (C $(if (($x + $y) % 2) { '#5a5e66' } else { '#c8ccd2' })) } } }
          for ($y = 100; $y -le 115; $y++) { for ($x = 10; $x -le 117; $x++) {                    # cinta para el nombre
            $edge = $y -eq 100 -or $y -eq 115 -or $x -eq 10 -or $x -eq 117; Px $b $x $y (C $(if ($edge) { '#c9a44a' } else { '#1d1810' })) } }
          foreach ($x in 4..9) { for ($y = 103 + (9 - $x); $y -le 112 - (9 - $x); $y++) { Px $b $x $y (C '#6b5220') } }
          foreach ($x in 118..123) { for ($y = 103 + ($x - 118); $y -le 112 - ($x - 118); $y++) { Px $b $x $y (C '#6b5220') } } }
  }
  $big = New-Object System.Drawing.Bitmap 512, 512; $g = [System.Drawing.Graphics]::FromImage($big)
  $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'; $g.DrawImage($b, 0, 0, 512, 512)
  if ($v -eq 'C') {                                                                                # nombre en dorado, sin suavizado (pixel art)
    $g.TextRenderingHint = 'SingleBitPerPixelGridFit'
    $f = New-Object System.Drawing.Font 'Georgia', 34, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
    $g.DrawString('CRIMINAL DICE', $f, (New-Object System.Drawing.SolidBrush (C '#e8c860')), (New-Object System.Drawing.RectangleF 40, 402, 432, 60), $sf)
  }
  $g.Dispose(); $b.Dispose(); , $big
}
New-Item -ItemType Directory -Force $Out | Out-Null
$imgs = @(); foreach ($v in 'A', 'B', 'C') { $i = Build $v; $i.Save((Join-Path $Out "logo_$v.png")); $imgs += $i }
$sheet = New-Object System.Drawing.Bitmap (3 * 400), 400; $g = [System.Drawing.Graphics]::FromImage($sheet); $g.Clear((C '#3a3a3a')); $g.InterpolationMode = 'NearestNeighbor'
for ($i = 0; $i -lt 3; $i++) { $g.DrawImage($imgs[$i], $i * 400 + 6, 6, 388, 388) }
$sheet.Save((Join-Path $Out 'preview.png'))
"ok"
