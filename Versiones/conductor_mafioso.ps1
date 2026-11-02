param([string]$Root)
# Dibuja al Mafioso al volante en su coche de escape: assets/characters/Mafioso/<Color>/exp_getaway.png
# (fedora, bigote y corbata de su color en la ventanilla delantera). Se puede ejecutar varias veces:
# primero restaura el cristal y luego dibuja al conductor.
# Uso: powershell -ExecutionPolicy Bypass -File conductor_mafioso.ps1 -Root <carpeta del juego>
Add-Type -AssemblyName System.Drawing
$cols = @{ Color_R='#A81515'; Color_B='#264385'; Color_G='#36613A'; Color_P='#F78DD1'; Color_Pu='#913CB9'; Color_W='#D9D9D9' }   # = colores de los dados
function C([string]$h) { [System.Drawing.ColorTranslator]::FromHtml($h) }
# Cristal original de la ventanilla delantera (filas 24-28, columnas 29-37): B = vidrio, E = reflejo.
$glass = @('BBBBBBBBB', 'BBEEBBBEB', 'BEEBBBEEB', 'EEBBBEEBB', 'BBBBBEBBB')
$driver = @(@(24, 31, 'CCCCC'), @(25, 30, 'CCCCCCC'), @(26, 31, 'EAEAE'), @(27, 31, 'FAAAF'), @(28, 31, 'JJXJJ'))
foreach ($k in $cols.Keys) {
  $f = Join-Path $Root "assets\characters\Mafioso\$k\exp_getaway.png"
  $src = New-Object System.Drawing.Bitmap $f; $b = New-Object System.Drawing.Bitmap $src; $src.Dispose()
  $pal = @{ B=(C '#151515'); E=(C '#212121'); A=(C '#000000'); C=(C '#2E2E2E'); F=(C '#7B4E38'); J=(C '#FFFFFF'); X=(C $cols[$k]) }
  for ($r = 0; $r -lt 5; $r++) { for ($i = 0; $i -lt 9; $i++) { $b.SetPixel(29 + $i, 24 + $r, $pal[[string]$glass[$r][$i]]) } }
  $pal['E'] = C '#A06346'                                                     # en el conductor, E = piel
  foreach ($o in $driver) { for ($i = 0; $i -lt $o[2].Length; $i++) { $b.SetPixel($o[1] + $i, $o[0], $pal[[string]$o[2][$i]]) } }
  $b.Save($f, [System.Drawing.Imaging.ImageFormat]::Png); $b.Dispose()
}
"ok"
