# Meshy AI - Pipeline de Importação

1. **Configurar chave**: editar o arquivo .env nesta pasta e definir MESHY_API_KEY=... (não commitar!).
2. **Referência**: colocar a imagem base em client/tools/references/beast-guardian.png (pode renomear o arquivo e ajustar o script).
3. **Gerar modelo**:
   `ash
   cd client
   node tools/meshy-generate.js
   `
   O script faz upload para o Meshy, monitora a task e baixa o GLB em public/assets/3d/beasts/guardian-meshy.glb.
4. **Opcional**: se for preciso outro nome/categoria, edite o prompt e caminho dentro do script.
5. **Integração**: após baixar o GLB, atualize o código do jogo para usar o novo arquivo e ajuste rotação/escala conforme necessário.

> Gere uma nova chave no Meshy após cada teste para manter a segurança.
