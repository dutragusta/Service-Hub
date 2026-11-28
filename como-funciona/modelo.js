import { makeKit, THREE } from './vendor/inkworks.js';

export function criarModelo(canvas) {
  const kit = makeKit(canvas);
  const { renderer, scene, camera, controls, part, toon, M } = kit;
  const vinho = '#a32b45';
  const bronze = '#8a5a28';
  const ativo = toon(vinho);
  const pendente = toon(bronze);
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const posicoes = [-3.45, -1.15, 1.15, 3.45];
  const grupos = posicoes.map((x) => {
    const grupo = new THREE.Group();
    grupo.position.x = x;
    scene.add(grupo);
    return grupo;
  });

  function caixa(grupo, tamanho, posicao, material = M.alloy) {
    const objeto = part(new THREE.BoxGeometry(...tamanho), material);
    objeto.position.set(...posicao);
    grupo.add(objeto);
    return objeto.children[0];
  }

  const bases = grupos.map((grupo) => {
    caixa(grupo, [1.87, .22, 1.68], [0, .11, 0], M.steel);
    caixa(grupo, [1.57, .18, 1.39], [0, .30, 0], M.alloy);
    return caixa(grupo, [.63, .15, .05], [0, .30, .71], M.dark);
  });

  caixa(grupos[0], [1.16, .72, .19], [0, .86, 0]);
  caixa(grupos[0], [.16, .21, .17], [-.31, .53, 0]);
  for (const [x, largura] of [[0, .76], [-.12, .52]]) {
    caixa(grupos[0], [largura, .06, .035], [x, x === 0 ? .97 : .78, .11], M.dark);
  }
  caixa(grupos[1], [1.04, 1.19, .19], [0, 1, 0]);
  caixa(grupos[1], [.53, .19, .23], [0, 1.61, 0], M.steel);
  for (const y of [.68, .95, 1.22]) {
    caixa(grupos[1], [.11, .11, .035], [-.32, y, .11], M.dark);
    caixa(grupos[1], [.48, .07, .035], [.09, y, .11], M.steel);
  }
  caixa(grupos[2], [1.21, .51, .56], [0, .65, 0], M.steel);
  caixa(grupos[2], [1.21, .47, .56], [0, 1.17, 0]);
  for (const y of [.65, 1.17]) caixa(grupos[2], [.41, .075, .06], [0, y, .30], M.dark);

  caixa(grupos[3], [1.01, 1.17, .19], [0, .99, 0]);
  caixa(grupos[3], [.67, .065, .035], [0, .88, .11], M.steel);
  caixa(grupos[3], [.47, .065, .035], [-.09, .68, .11], M.dark);
  const selo = part(new THREE.CylinderGeometry(.23, .23, .09, 12).rotateX(Math.PI / 2), ativo);
  selo.position.set(.17, 1.25, .13);
  grupos[3].add(selo);

  const trilho = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-3.45, .04, 0), new THREE.Vector3(3.45, .04, 0),
  ]);
  scene.add(new THREE.Line(trilho, kit.lineMat));
  const marcador = part(new THREE.SphereGeometry(.14, 14, 10), ativo);
  marcador.position.set(posicoes[0], .18, 1.13);
  scene.add(marcador);
  const referencia = new THREE.Vector3(0, .62, 0);
  const direcao = new THREE.Vector3(3.2, 5, 11.5).normalize();
  controls.target.copy(referencia);
  controls.enableDamping = false;
  controls.enableZoom = false;
  controls.minPolarAngle = .67;
  controls.maxPolarAngle = 1.48;
  controls.minAzimuthAngle = -.41;
  controls.maxAzimuthAngle = .42;

  let animacao;
  let aspecto;
  function renderizar() {
    if (!canvas.hidden) renderer.render(scene, camera);
  }

  function enquadrar() {
    const { clientWidth: largura, clientHeight: altura } = canvas;
    if (!largura || !altura) return;
    aspecto = largura / altura;
    camera.aspect = aspecto;
    camera.updateProjectionMatrix();
    camera.position.copy(direcao).multiplyScalar(Math.max(9.8, 17.6 / aspecto)).add(referencia);
    camera.lookAt(referencia);
    renderer.setSize(largura, altura, false);
    kit.outlineMat.uniforms.uPx.value = 1.3 / altura;
    controls.update();
    renderizar();
  }

  controls.addEventListener('change', renderizar);
  new ResizeObserver(enquadrar).observe(canvas);

  return {
    atualizar(indice, aguardando) {
      cancelAnimationFrame(animacao);
      const material = aguardando ? pendente : ativo;
      bases.forEach((base, i) => { base.material = i === indice ? material : M.dark; });
      selo.children[0].material = aguardando ? pendente : ativo;
      marcador.children[0].material = material;
      const inicial = marcador.position.x;
      const destino = posicoes[indice];
      if (!aspecto) enquadrar();
      if (reduzido.matches || inicial === destino) {
        marcador.position.x = destino;
        renderizar();
        return;
      }
      const inicio = performance.now();
      function mover(agora) {
        const progresso = Math.min(1, (agora - inicio) / 410);
        marcador.position.x = THREE.MathUtils.lerp(inicial, destino, 1 - (1 - progresso) ** 3);
        renderizar();
        if (progresso < 1) animacao = requestAnimationFrame(mover);
      }
      animacao = requestAnimationFrame(mover);
    },
  };
}
