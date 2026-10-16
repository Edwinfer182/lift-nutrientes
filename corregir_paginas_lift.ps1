# LIFT NUTRIENTES - Ajustar paginas movidas a la raiz del repositorio.
# Guardar este script en la raiz de lift-nutrientes y ejecutarlo desde ahi.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$products = Join-Path $root 'productos'
$assets = Join-Path $root 'catalogo\assets'
if (-not (Test-Path $products -PathType Container)) { throw 'No existe la carpeta productos junto al script. Copia el script a la raiz de lift-nutrientes.' }
foreach ($required in @('producto.css','productos-data.js','producto.js')) {
  if (-not (Test-Path (Join-Path $assets $required))) { throw "Falta catalogo/assets/$required. No se ha modificado ningun archivo." }
}
$files = @(Get-ChildItem -LiteralPath $products -Filter '*.html' -File)
if ($files.Count -eq 0) { throw 'No hay archivos HTML en productos.' }
$utf8 = New-Object System.Text.UTF8Encoding($false)
$changed = 0
foreach ($file in $files) {
  $html = [System.IO.File]::ReadAllText($file.FullName)
  $updated = $html
  # Las referencias al catalogo deben ser absolutas para funcionar desde /productos/.
  $updated = $updated.Replace('../assets/producto.css', '/catalogo/assets/producto.css')
  $updated = $updated.Replace('../assets/productos-data.js', '/catalogo/assets/productos-data.js')
  $updated = $updated.Replace('../assets/producto.js', '/catalogo/assets/producto.js')
  # Conserva enlaces entre productos ./otro-producto.html; cambia solo regreso al catalogo.
  $updated = $updated.Replace("'../?", "'/catalogo/?")
  $updated = $updated.Replace('"../?', '"/catalogo/?')
  $updated = $updated.Replace("'../#", "'/catalogo/#")
  $updated = $updated.Replace('"../#', '"/catalogo/#')
  $updated = $updated.Replace("'../'", "'/catalogo/'")
  $updated = $updated.Replace('"../"', '"/catalogo/"')
  # URLs de producto y catalogo en canonical, JSON-LD y OpenGraph.
  $updated = $updated.Replace('https://lift-nutrientes.vercel.app/catalogo/productos/', 'https://supgo.co/productos/')
  $updated = $updated.Replace('https://lift-nutrientes.vercel.app/catalogo/', 'https://supgo.co/catalogo/')
  if ($updated -cne $html) {
    [System.IO.File]::WriteAllText($file.FullName, $updated, $utf8)
    $changed++
  }
}
Write-Host "LISTO: $changed de $($files.Count) paginas actualizadas." -ForegroundColor Green
Write-Host 'Revisa los cambios en GitHub Desktop antes de Commit y Push.'
Read-Host 'Presiona Enter para cerrar'
