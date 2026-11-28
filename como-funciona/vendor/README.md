# Renderizador Inkworks

`inkworks.js` contém o kit de renderização e as dependências vendorizadas do
[Inkworks](https://github.com/Moh4696/inkworks-skill/tree/8769b7d4191088a94448294d7bd28ae84d34906c),
sob as licenças em [LICENSES.txt](LICENSES.txt).

Para reproduzir o pacote, copie `kit/js/kit.js` e os arquivos `three.module.js` e
`addons/controls/OrbitControls.js` de `kit/vendor/three/` para uma pasta temporária.
Nos dois módulos que importam `three`, aponte o import para
`./three.module.js`. Em `kit.js`, aponte OrbitControls para
`./OrbitControls.js`. Empacote `kit.js` com esbuild usando os parâmetros
`--bundle --minify --format=esm` e preserve os avisos de licença.
