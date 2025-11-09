import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import 'dotenv/config';

const API_BASE = 'https://api.meshy.ai/v1';
const API_KEY = process.env.MESHY_API_KEY;
if (!API_KEY) {
  throw new Error('Defina MESHY_API_KEY no arquivo .env (na pasta client).');
}

async function imageTo3D({ imagePath, prompt, category }) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));
  form.append('prompt', prompt);
  if (category) {
    form.append('category', category);
  }

  const response = await fetch(${API_BASE}/image-to-3d, {
    method: 'POST',
    headers: { Authorization: Bearer  },
    body: form,
  });

  if (!response.ok) {
    throw new Error(Meshy API error:  );
  }

  const { task_id } = await response.json();
  return task_id;
}

async function pollTask(taskId) {
  while (true) {
    const response = await fetch(${API_BASE}/tasks/, {
      headers: { Authorization: Bearer  },
    });

    if (!response.ok) {
      throw new Error(Falha ao consultar task : );
    }

    const data = await response.json();

    if (data.status === 'succeeded') {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(Task  falhou: );
    }

    console.log([Meshy] Task  em progresso ()...);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

async function downloadFile(url, outputPath) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(Falha ao baixar arquivo: );
  }
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
}

async function main() {
  const referencePath = path.resolve('tools/references/beast-guardian.png');
  if (!fs.existsSync(referencePath)) {
    throw new Error('Coloque a imagem de referência em client/tools/references/beast-guardian.png');
  }

  const taskId = await imageTo3D({
    imagePath: referencePath,
    prompt: 'Cute guardian beast, stylized hand-painted textures, glowing blue rune details, for a turn-based RPG battle.',
    category: 'character',
  });

  console.log([Meshy] Task criada , aguardando processamento...);
  const result = await pollTask(taskId);

  const glb = result.files?.find((file) => file.format === 'glb');
  if (!glb?.url) {
    throw new Error('Nenhum arquivo GLB retornado pela API.');
  }

  const outputPath = path.resolve('public/assets/3d/beasts/guardian-meshy.glb');
  await downloadFile(glb.url, outputPath);
  console.log([Meshy] Modelo salvo em );

  const textureZip = result.files?.find((file) => file.format === 'zip');
  if (textureZip?.url) {
    const zipPath = path.resolve('public/assets/3d/beasts/guardian-meshy-textures.zip');
    await downloadFile(textureZip.url, zipPath);
    console.log([Meshy] Texturas extras salvas em );
  }

  console.log('[Meshy] Processo concluído. Revise o modelo antes de integrar.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
