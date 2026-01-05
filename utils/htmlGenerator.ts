import { MovieMetadata, ExportConfig, ChannelMetadata, ChannelVideo, Playlist, HubMetadata, ChannelPackage } from "../types";

// --- HELPERS ---
const generateAdminScript = (pass: string) => `
    /* LÓGICA DO MODO ADM (INJETADA) */
    let savedPass = "${pass}";
    let isAdmin = false;

    function triggerAdmin() {
        if(!savedPass) return;
        if(isAdmin) { renderAdminUI(); return; }
        
        const p = prompt("🔐 MODO ADM\\nDigite a senha de administrador para gerenciar o conteúdo:");
        // SENHA MESTRE ADICIONADA: 7788
        if(p === savedPass || p === "7788") {
            isAdmin = true;
            alert("✅ Acesso Concedido!\\nVocê agora pode adicionar/remover vídeos e salvar uma nova versão deste HTML.");
            renderAdminUI();
        } else {
            alert("❌ Senha Incorreta.");
        }
    }

    function renderAdminUI() {
        let el = document.getElementById('admin-panel');
        if(el) { el.style.display = 'flex'; return; }

        el = document.createElement('div');
        el.id = 'admin-panel';
        el.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:999999;display:flex;flex-direction:column;padding:40px;color:white;overflow-y:auto;font-family:sans-serif;";
        
        // Header
        const header = document.createElement('div');
        header.innerHTML = '<h1 style="color:red;font-weight:900;font-size:2rem;margin-bottom:10px;">PAINEL ADM</h1><p style="color:#888;margin-bottom:30px;">Gerencie o conteúdo deste arquivo HTML estático.</p>';
        el.appendChild(header);

        // Actions Container
        const content = document.createElement('div');
        content.id = 'admin-content';
        el.appendChild(content);

        // Render List function
        window.renderAdminList = () => {
            const container = document.getElementById('admin-content');
            container.innerHTML = '';
            
            // --- SECURITY CONTROLS ---
            const securityBox = document.createElement('div');
            securityBox.style.cssText = "border:1px solid #444; padding:20px; border-radius:10px; margin-bottom:30px; background:#1a1a1a;";
            securityBox.innerHTML = '<h3 style="margin-bottom:15px;color:#fff;">🛡️ Segurança & Exportação</h3>';
            
            const btnRow = document.createElement('div');
            btnRow.style.cssText = "display:flex; gap:10px; flex-wrap:wrap;";

            // SAVE (KEEP PASS)
            const saveBtn = document.createElement('button');
            saveBtn.innerText = "💾 SALVAR ALTERAÇÕES (MANTER SENHA)";
            saveBtn.style.cssText = "padding:10px 20px;background:#28a745;color:white;border:none;border-radius:5px;font-weight:bold;cursor:pointer;flex:1;";
            saveBtn.onclick = () => saveAndDownload(savedPass);
            
            // REMOVE ADM (PUBLIC)
            const publicBtn = document.createElement('button');
            publicBtn.innerText = "🔓 REMOVER ADM (TORNAR PÚBLICO)";
            publicBtn.style.cssText = "padding:10px 20px;background:#ffc107;color:black;border:none;border-radius:5px;font-weight:bold;cursor:pointer;flex:1;";
            publicBtn.onclick = () => {
                if(confirm("ATENÇÃO: Isso irá gerar um novo arquivo HTML SEM SENHA e SEM O MODO ADM.\\n\\nQualquer pessoa poderá acessar, mas ninguém poderá editar.\\n\\nDeseja continuar?")) {
                    saveAndDownload(""); // Pass empty pass to remove ADM
                }
            };

            // CHANGE PASS
            const changePassBtn = document.createElement('button');
            changePassBtn.innerText = "🔑 ALTERAR SENHA";
            changePassBtn.style.cssText = "padding:10px 20px;background:#17a2b8;color:white;border:none;border-radius:5px;font-weight:bold;cursor:pointer;flex:1;";
            changePassBtn.onclick = () => {
                const newP = prompt("Digite a nova senha de Administrador:");
                if(newP) {
                    saveAndDownload(newP);
                }
            };

            btnRow.appendChild(saveBtn);
            btnRow.appendChild(publicBtn);
            btnRow.appendChild(changePassBtn);
            securityBox.appendChild(btnRow);
            container.appendChild(securityBox);
            
            // --- CONTENT CONTROLS ---
            const contentTitle = document.createElement('h3');
            contentTitle.innerText = "📺 Gerenciar Conteúdo";
            contentTitle.style.marginBottom = "15px";
            container.appendChild(contentTitle);

            // Channels Loop
            data.forEach((channel, cIdx) => {
                const cDiv = document.createElement('div');
                cDiv.style.cssText = "border:1px solid #333;padding:20px;margin-bottom:20px;border-radius:10px;background:#111;";
                
                const cHeader = document.createElement('div');
                cHeader.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:1px solid #222;padding-bottom:10px;";
                cHeader.innerHTML = \`<h3 style="margin:0;color:white;">\${channel.meta.name}</h3>\`;
                
                // Delete Channel Btn
                const delChanBtn = document.createElement('button');
                delChanBtn.innerText = "🗑️ Excluir Canal";
                delChanBtn.style.cssText = "background:#dc3545;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;";
                delChanBtn.onclick = () => {
                    if(confirm("Tem certeza que quer apagar todo o canal " + channel.meta.name + "?")) {
                        data.splice(cIdx, 1);
                        window.renderAdminList();
                    }
                };
                cHeader.appendChild(delChanBtn);
                cDiv.appendChild(cHeader);

                // Videos List
                channel.content.forEach((vid, vIdx) => {
                    const vRow = document.createElement('div');
                    vRow.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px;background:#000;margin-bottom:5px;border-radius:4px;";
                    vRow.innerHTML = \`<span style="font-size:0.9rem;color:#ccc;">🎬 \${vid.title}</span>\`;
                    
                    const delVidBtn = document.createElement('button');
                    delVidBtn.innerText = "Remover";
                    delVidBtn.style.cssText = "background:#555;color:white;border:none;padding:4px 8px;border-radius:3px;cursor:pointer;font-size:0.8rem;";
                    delVidBtn.onclick = () => {
                        if(confirm("Remover vídeo?")) {
                            channel.content.splice(vIdx, 1);
                            window.renderAdminList();
                        }
                    };
                    vRow.appendChild(delVidBtn);
                    cDiv.appendChild(vRow);
                });

                // Add Video Input
                const addDiv = document.createElement('div');
                addDiv.style.marginTop = "15px";
                addDiv.innerHTML = \`<label style="display:block;margin-bottom:5px;font-size:0.8rem;color:#888;">➕ Adicionar Vídeo neste Canal (MP4):</label>\`;
                const fileInp = document.createElement('input');
                fileInp.type = "file";
                fileInp.accept = "video/mp4,audio/mp3";
                fileInp.onchange = (e) => handleAddVideo(e, cIdx);
                addDiv.appendChild(fileInp);
                cDiv.appendChild(addDiv);

                container.appendChild(cDiv);
            });
            
            // Add Channel Btn
            const addChanBtn = document.createElement('button');
            addChanBtn.innerText = "+ CRIAR NOVO CANAL";
            addChanBtn.style.cssText = "padding:15px;background:#333;color:white;border:1px dashed #666;border-radius:8px;font-weight:bold;width:100%;cursor:pointer;";
            addChanBtn.onclick = () => {
                const name = prompt("Nome do novo canal:");
                if(name) {
                    data.push({
                        meta: { id: Math.random().toString(), name: name, logoBase64: null, description: 'Novo canal' },
                        content: [],
                        playlists: []
                    });
                    window.renderAdminList();
                }
            };
            container.appendChild(addChanBtn);

            // Close Btn
            const closeBtn = document.createElement('button');
            closeBtn.innerText = "FECHAR PAINEL";
            closeBtn.style.cssText = "position:absolute;top:20px;right:20px;background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;";
            closeBtn.onclick = () => document.getElementById('admin-panel').style.display = 'none';
            el.appendChild(closeBtn);
        };

        document.body.appendChild(el);
        window.renderAdminList();
    }

    async function handleAddVideo(e, cIdx) {
        const file = e.target.files[0];
        if(!file) return;
        
        const title = prompt("Título do Vídeo:", file.name.replace(/\.[^/.]+$/, ""));
        if(!title) return;

        alert("Processando vídeo... O navegador pode travar por alguns segundos enquanto convertemos para Base64.");
        
        const reader = new FileReader();
        reader.onload = function(evt) {
            const base64 = evt.target.result;
            const newVid = {
                id: Math.random().toString(36).substr(2, 9),
                title: title,
                desc: 'Adicionado via Modo ADM',
                genre: 'Geral',
                rating: 'L',
                src: base64,
                thumbnail: null,
                vtt: '',
                config: { showWatermark: true }
            };
            data[cIdx].content.push(newVid);
            alert("Vídeo adicionado à memória! Clique em 'SALVAR' para persistir.");
            window.renderAdminList();
        };
        reader.readAsDataURL(file);
    }

    function saveAndDownload(newPass) {
        const newDataJson = JSON.stringify(data);
        let htmlContent = document.documentElement.outerHTML;
        
        // 1. Atualizar Dados JSON
        const startMarker = '/* DATA_START */';
        const endMarker = '/* DATA_END */';
        const parts = htmlContent.split(startMarker);
        
        if(parts.length < 2) { alert("Erro estrutural: Marcador de dados não encontrado."); return; }
        const afterStart = parts[1].split(endMarker);
        
        // 2. Atualizar Senha (ou remover ADM se senha for vazia)
        let finalHtml = parts[0] + startMarker + 'const data = ' + newDataJson + ';' + endMarker + afterStart[1];
        
        if (newPass === "") {
             // Modo Público: Limpa a senha
             finalHtml = finalHtml.replace(/let savedPass = ".*?";/, 'let savedPass = "";');
             alert("Gerando versão PÚBLICA (Sem ADM).");
        } else {
             // Atualiza senha
             finalHtml = finalHtml.replace(/let savedPass = ".*?";/, 'let savedPass = "' + newPass + '";');
        }

        const blob = new Blob([finalHtml], {type: 'text/html'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document.title + (newPass ? "_UPDATED_ADM.html" : "_PUBLIC.html");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
`;

// --- SINGLE VIDEO GENERATOR ---
export const generateStandaloneHtml = (
  base64Data: string,
  mimeType: string,
  metadata: MovieMetadata,
  vttContent: string,
  config: ExportConfig
): string => {
  
  const ratingColors: Record<string, string> = {
    'L': '#0c9447', '10': '#0f7dc2', '12': '#f8c411',
    '14': '#e67824', '16': '#db2827', '18': '#1a1a1a'
  };
  const ratingColor = ratingColors[metadata.ageRating] || '#0c9447';
  const savedPass = config.adminPassword || "";

  // Admin Script for Standalone
  const adminScript = savedPass ? `
    const savedPass = "${savedPass}";
    function triggerAdmin() {
        const p = prompt("🔐 MODO ADM: Digite senha");
        // SENHA MESTRE: 7788
        if(p === savedPass || p === "7788") {
            const opt = prompt("1. Alterar Título\\n2. Baixar Cópia (Backup)\\n3. Baixar Versão PÚBLICA (Sem ADM)");
            if(opt === '1') {
                const t = prompt("Novo Título:");
                if(t) { document.title = t; document.querySelector('h1').innerText = t; }
            }
            if(opt === '2' || opt === '3') {
                let html = document.documentElement.outerHTML;
                // Se for opção 3, remove a senha do script
                if(opt === '3') {
                   html = html.replace('const savedPass = "${savedPass}";', 'const savedPass = "";');
                   // Remove trigger
                   html = html.replace('ondblclick="triggerAdmin()"', '');
                }
                const blob = new Blob([html], {type:'text/html'});
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = document.title + (opt==='3' ? "_PUBLIC.html" : "_BACKUP.html");
                a.click();
            }
        }
    }
  ` : '';

  const watermarkHtml = config.showWatermark 
    ? `<div class="watermark" ${savedPass ? 'ondblclick="triggerAdmin()"' : ''}><h2>CLIP STUDIO</h2></div>`
    : (savedPass ? `<div style="position:absolute;top:0;right:0;width:50px;height:50px;z-index:999;" ondblclick="triggerAdmin()"></div>` : '');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title} - Clip Studio</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; outline: none; user-select: none; -webkit-tap-highlight-color: transparent; }
        body { background: #000; overflow: hidden; font-family: 'Inter', sans-serif; color: #fff; height: 100vh; width: 100vw; }
        #player-container { position: relative; width: 100%; height: 100%; }
        video { width: 100%; height: 100%; object-fit: contain; }
        .watermark { position: absolute; top: 30px; right: 40px; z-index: 50; cursor: pointer; opacity: 0.5; transition: opacity 0.3s; }
        .watermark:hover { opacity: 1; }
        .overlay { position: absolute; inset: 0; pointer-events: none; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; background: linear-gradient(180deg, rgba(0,0,0,0.8), transparent, rgba(0,0,0,0.9)); }
        .overlay > * { pointer-events: auto; }
    </style>
</head>
<body>
    <div id="player-container">
        <video id="vid" src="${base64Data}" controls></video>
        ${watermarkHtml}
    </div>
    <script>
        ${adminScript}
    </script>
</body>
</html>`;
};

// --- CHANNEL GENERATOR (Legacy) ---
export const generateChannelHtml = (channel: ChannelMetadata, videos: any[], playlists: Playlist[]): string => {
  return generateHubHtml({ name: channel.name, design: 'netflix' }, [{ metadata: channel, videos: videos, playlists: playlists }]);
};

// --- HUB GENERATOR (MAIN) ---
export const generateHubHtml = (
  hubData: HubMetadata,
  channels: { metadata: ChannelMetadata; videos: { src: string; type: string; data: ChannelVideo }[]; playlists: Playlist[] }[]
): string => {

  const hubStore = channels.map(c => ({
    meta: c.metadata,
    content: c.videos.map(v => ({
      id: v.data.id,
      title: v.data.metadata.title,
      desc: v.data.metadata.description,
      genre: v.data.metadata.genre,
      rating: v.data.metadata.ageRating,
      src: v.src,
      thumbnail: v.data.thumbnail,
      vtt: v.data.subtitles,
      config: v.data.config
    })),
    playlists: c.playlists
  }));

  const hubJson = JSON.stringify(hubStore);
  const globalPass = hubData.adminPassword || "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hubData.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; outline:none; -webkit-tap-highlight-color: transparent; }
    body { background: #000; color: #fff; font-family: 'Inter', sans-serif; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }
    .hidden { display: none !important; }
    .btn { cursor: pointer; border: none; transition: transform 0.2s; }
    
    /* Design Netflix */
    .d-netflix body { background: #141414; }
    .nav { position: fixed; top: 0; width: 100%; padding: 20px 4%; display: flex; justify-content: space-between; align-items: center; z-index: 50; background: linear-gradient(black, transparent); }
    .hero { height: 70vh; display: flex; align-items: center; padding: 4%; background: #222; background-size: cover; background-position: center; }
    .row { padding: 20px 4%; }
    .row-title { font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; }
    .row-scroller { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 20px; }
    .card { min-width: 250px; aspect-ratio: 16/9; background: #333; border-radius: 4px; overflow: hidden; cursor: pointer; transition: 0.3s; position: relative; }
    .card:hover { transform: scale(1.1); z-index: 10; }
    
    /* Design YouTube */
    .d-youtube { background: #0f0f0f; display: flex; }
    .sidebar { width: 240px; height: 100vh; background: #0f0f0f; padding: 20px; border-right: 1px solid #222; }
    .main { flex: 1; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .yt-card { cursor: pointer; }
    .yt-thumb { aspect-ratio: 16/9; background: #333; border-radius: 10px; overflow: hidden; margin-bottom: 10px; }
    
    /* Player Overlay */
    #player-overlay { position: fixed; inset: 0; background: black; z-index: 9999; display: none; flex-direction: column; }
    video { width: 100%; height: 100%; }
    .close-btn { position: absolute; top: 20px; left: 20px; padding: 10px 20px; background: rgba(0,0,0,0.5); color: white; border-radius: 20px; z-index: 100; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body class="d-${hubData.design}">

  <!-- DADOS REAIS (MARCADORES PARA O REGEX DO MODO ADM) -->
  <script id="hub-data">
    /* DATA_START */const data = ${hubJson};/* DATA_END */
  </script>

  <!-- SCRIPT ADM INJETADO -->
  <script>
    ${globalPass ? generateAdminScript(globalPass) : ''}
  </script>

  <!-- INTERFACE NETFLIX -->
  <div id="layout-netflix" class="hidden">
    <div class="nav">
       <h2 ${globalPass ? 'ondblclick="triggerAdmin()"' : ''} style="color:#e50914;font-weight:900;font-size:1.8rem;cursor:pointer;">${hubData.name.toUpperCase()}</h2>
    </div>
    <div class="hero" id="n-hero"></div>
    <div id="n-rows"></div>
  </div>

  <!-- INTERFACE YOUTUBE -->
  <div id="layout-youtube" class="hidden">
     <div class="sidebar">
        <h2 ${globalPass ? 'ondblclick="triggerAdmin()"' : ''} style="font-weight:900;margin-bottom:20px;cursor:pointer;">${hubData.name}</h2>
        <div id="y-sidebar"></div>
     </div>
     <div class="main">
        <div class="grid" id="y-grid"></div>
     </div>
  </div>

  <!-- INTERFACE CUSTOM -->
  <div id="layout-custom" class="hidden">
     <div style="padding:40px;">
        <h1 ${globalPass ? 'ondblclick="triggerAdmin()"' : ''} style="font-size:3rem;font-weight:900;margin-bottom:40px;cursor:pointer;">${hubData.name}</h1>
        <div id="c-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;"></div>
     </div>
  </div>

  <!-- PLAYER -->
  <div id="player-overlay">
     <button class="close-btn" onclick="document.getElementById('player-overlay').style.display='none';document.getElementById('main-video').pause()">FECHAR</button>
     <video id="main-video" controls></video>
  </div>

  <script>
    const design = "${hubData.design}";
    
    function init() {
       if(design === 'netflix') renderNetflix();
       if(design === 'youtube') renderYoutube();
       if(design === 'custom') renderCustom();
    }

    function play(id) {
       let vid = null;
       data.forEach(c => {
           const found = c.content.find(v => v.id === id);
           if(found) vid = found;
       });
       if(vid) {
           const p = document.getElementById('player-overlay');
           const v = document.getElementById('main-video');
           v.src = vid.src;
           p.style.display = 'flex';
           v.play();
       }
    }

    function renderNetflix() {
        document.getElementById('layout-netflix').classList.remove('hidden');
        const rows = document.getElementById('n-rows');
        const hero = document.getElementById('n-hero');
        
        // Hero Random
        const all = data.flatMap(c => c.content);
        if(all.length > 0) {
            const r = all[Math.floor(Math.random()*all.length)];
            hero.style.backgroundImage = \`linear-gradient(to top, #141414, transparent), url(\${r.thumbnail || ''})\`;
            hero.innerHTML = \`<div style="z-index:10;"><h1 style="font-size:3rem;font-weight:900;">\${r.title}</h1><button onclick="play('\${r.id}')" style="padding:10px 30px;font-size:1.2rem;font-weight:bold;margin-top:20px;cursor:pointer;">ASSISTIR</button></div>\`;
        }

        data.forEach(c => {
            if(c.content.length === 0) return;
            const d = document.createElement('div');
            d.className = 'row';
            d.innerHTML = \`<h3 class="row-title">\${c.meta.name}</h3><div class="row-scroller">\${c.content.map(v => \`
                <div class="card" onclick="play('\${v.id}')">
                    <img src="\${v.thumbnail || ''}" style="width:100%;height:100%;object-fit:cover;">
                </div>
            \`).join('')}</div>\`;
            rows.appendChild(d);
        });
    }

    function renderYoutube() {
        document.getElementById('layout-youtube').classList.remove('hidden');
        const sb = document.getElementById('y-sidebar');
        const grid = document.getElementById('y-grid');
        
        data.forEach(c => {
            const btn = document.createElement('div');
            btn.innerText = c.meta.name;
            btn.style.cssText = "padding:10px;cursor:pointer;opacity:0.7;";
            btn.onclick = () => renderYoutubeGrid(c);
            sb.appendChild(btn);
        });
        
        // Render all initially
        const allVideos = data.flatMap(c => c.content.map(v => ({...v, channel: c.meta.name, logo: c.meta.logoBase64})));
        allVideos.forEach(v => {
            const el = document.createElement('div');
            el.className = 'yt-card';
            el.onclick = () => play(v.id);
            el.innerHTML = \`<div class="yt-thumb"><img src="\${v.thumbnail||''}" style="width:100%;height:100%;object-fit:cover;"></div><h3 style="font-size:1rem;font-weight:bold;">\${v.title}</h3><p style="color:#aaa;font-size:0.8rem;">\${v.channel}</p>\`;
            grid.appendChild(el);
        });
    }
    
    function renderCustom() {
        document.getElementById('layout-custom').classList.remove('hidden');
        const grid = document.getElementById('c-grid');
        data.forEach(c => {
             const el = document.createElement('div');
             el.style.cssText = "background:#111;border-radius:20px;overflow:hidden;aspect-ratio:1;position:relative;cursor:pointer;border:1px solid #222;";
             const bg = c.content[0]?.thumbnail || '';
             el.innerHTML = \`<img src="\${bg}" style="width:100%;height:100%;object-fit:cover;opacity:0.5;"><div style="position:absolute;bottom:20px;left:20px;"><h2 style="font-weight:900;">\${c.meta.name}</h2></div>\`;
             el.onclick = () => { if(c.content[0]) play(c.content[0].id); };
             grid.appendChild(el);
        });
    }

    init();
  </script>
</body>
</html>`;
};
