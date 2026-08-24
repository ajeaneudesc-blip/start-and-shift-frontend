/**
 * Test de bout en bout du parcours client, contre l'API réelle.
 *
 *   npm run e2e            # http://localhost:3000 par défaut
 *   API=http://... npm run e2e
 *
 * Rejoue tout ce que fait l'app : inscription, diagnostic sauvegardé au fil de
 * l'eau, stratégie, ouverture de conversation, envoi de message, réception
 * temps réel par WebSocket, commandes et modèles.
 *
 * Aucune dépendance : `fetch` et `WebSocket` sont fournis par Node (≥ 22).
 *
 * Chaque exécution crée un compte jetable. Sur une base de développement c'est
 * sans conséquence ; ne pas le lancer contre la production.
 */

const API = process.env.API ?? 'http://localhost:3000';
const WS = API.replace(/^http/, 'ws') + '/ws';

/** Compte du backoffice utilisé pour vérifier la réception temps réel. */
const STAFF_PHONE = '+22890000001';

const resultats = [];
let echecs = 0;

function verifier(nom, ok, detail = '') {
  resultats.push({ nom, ok, detail });
  if (!ok) echecs++;
  const marque = ok ? '  ok  ' : 'ECHEC ';
  console.log(`${marque} ${nom}${detail ? ` — ${detail}` : ''}`);
}

async function appel(methode, chemin, { token, body } = {}) {
  const r = await fetch(API + chemin, {
    method: methode,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const texte = await r.text();
  let json = null;
  try {
    json = texte ? JSON.parse(texte) : null;
  } catch {
    /* réponse non-JSON : json reste null */
  }
  return { status: r.status, body: json };
}

/**
 * Les huit réponses, dans les termes exacts attendus par le calcul de
 * stratégie du serveur. Ne pas reformuler : la correspondance est faite au
 * caractère près.
 */
const REPONSES = [
  'Prestation (je vends du savoir-faire)',
  'Au marché',
  'Des restaurateurs du quartier et des vendeuses',
  ['Bouche-à-oreille', 'WhatsApp'],
  'Ils manquent de temps — je livre en une heure et je conseille chaque commande',
  '2 000 à 10 000 F',
  'Asseoir ma notoriété',
  ['Proche', 'Moderne'],
];

/** Ce que le calcul serveur doit produire à partir de REPONSES. */
const ATTENDU = {
  pos: 'Prestation de service, au marché. Je livre en une heure et je conseille chaque commande.',
  diff: 'Je livre en une heure et je conseille chaque commande — c\'est la phrase à répéter partout.',
  action1: 'Répéter la même image partout, sans jamais la changer.',
  ton: 'un ton direct, comme une conversation ; des formes simples et beaucoup de vide.',
};

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Franchit les deux temps de POST /api/auth/session/{request,verify}. Le
 * fournisseur SMS "local" ne délivre rien : /session/dev-otp (actif seulement
 * en dev, avec SMS_PROVIDER=local) est le seul moyen de récupérer le code sans
 * lire les logs serveur — voir backend/src/routes/auth.ts.
 */
async function connexion(phone, extra = {}) {
  const demande = await appel('POST', '/api/auth/session/request', { body: { phone, ...extra } });
  if (demande.status !== 200) return demande;

  const devOtp = await appel('GET', `/api/auth/session/dev-otp?phone=${encodeURIComponent(phone)}`);
  if (!devOtp.body?.code) throw new Error(`pas de code dev-otp pour ${phone} — SMS_PROVIDER local et NODE_ENV=development ?`);

  return appel('POST', '/api/auth/session/verify', {
    body: { sessionToken: demande.body.sessionToken, otp: devOtp.body.code },
  });
}

async function main() {
  const suffixe = String(Date.now()).slice(-7);
  const phone = `+2289${suffixe}`;

  console.log(`\nParcours complet — compte jetable ${phone}\n`);

  // ── 1. Inscription ─────────────────────────────────────────────────────────
  const inscription = await connexion(phone, { firstName: 'Test', pseudo: `test.${suffixe}` });
  verifier('inscription', inscription.status === 201, `statut ${inscription.status}`);
  const token = inscription.body?.token;
  if (!token) throw new Error('pas de token : impossible de continuer');

  const moi = await appel('GET', '/api/me', { token });
  verifier('le token est accepté', moi.status === 200 && moi.body?.user?.phone === phone);

  // ── 2. Diagnostic, sauvegardé au fil de l'eau ──────────────────────────────
  const vide = await appel('GET', '/api/diagnostic', { token });
  verifier('diagnostic vide au départ', vide.body?.answers === null);

  for (let i = 1; i <= REPONSES.length; i++) {
    const partiel = await appel('PUT', '/api/diagnostic', {
      token,
      body: { answers: REPONSES.slice(0, i) },
    });
    if (partiel.status !== 200) {
      verifier(`sauvegarde de la réponse ${i}`, false, `statut ${partiel.status}`);
      break;
    }
    const doitEtreFini = i === REPONSES.length;
    if (partiel.body.complete !== doitEtreFini) {
      verifier(`complétude après ${i} réponses`, false, `complete=${partiel.body.complete}`);
      break;
    }
  }
  verifier('les 8 réponses sont sauvegardées une à une', true);

  const relu = await appel('GET', '/api/diagnostic', { token });
  verifier(
    'les tableaux imbriqués survivent à l\'aller-retour',
    JSON.stringify(relu.body?.answers?.[3]) === JSON.stringify(REPONSES[3]),
  );

  // ── 3. Stratégie ───────────────────────────────────────────────────────────
  const strat = await appel('POST', '/api/strategy', { token });
  verifier('génération de la stratégie', strat.status === 200, `statut ${strat.status}`);
  verifier('positionnement conforme', strat.body?.pos === ATTENDU.pos, strat.body?.pos);
  verifier('différenciateur conforme', strat.body?.diff === ATTENDU.diff);
  verifier('ton conforme', strat.body?.ton === ATTENDU.ton, strat.body?.ton);
  verifier('première action conforme', strat.body?.actions?.[0] === ATTENDU.action1);
  verifier('trois actions', strat.body?.actions?.length === 3);
  verifier(
    'productMarketing jamais renvoyé au client',
    !('productMarketing' in (strat.body ?? {})),
  );

  // ── 4. Conversation, et son idempotence ────────────────────────────────────
  const conv1 = await appel('POST', '/api/conversations', { token, body: {} });
  verifier('ouverture de la conversation', conv1.status === 201 && conv1.body?.created === true);

  const conv2 = await appel('POST', '/api/conversations', { token, body: {} });
  verifier(
    'un second appel ne crée pas de doublon',
    conv2.status === 200 && conv2.body?.created === false && conv2.body?.id === conv1.body?.id,
  );

  const convId = conv1.body.id;

  // Le fil fige le diagnostic et la stratégie du moment, pour que le backoffice
  // voie le contexte tel qu'il était même si le client refait son diagnostic.
  const ouverte = await appel('GET', `/api/conversations/${convId}`, { token });
  const ctx = ouverte.body?.diagContext;
  verifier(
    'le contexte du diagnostic est figé à l\'ouverture',
    Boolean(ctx) &&
      ctx.resume === ATTENDU.pos &&
      Array.isArray(ctx.answers) &&
      ctx.answers.length === 8 &&
      typeof ctx.capturedAt === 'string',
    ctx ? `capturé le ${ctx.capturedAt}` : 'diagContext absent',
  );
  verifier(
    'le contexte figé n\'emporte pas productMarketing',
    Boolean(ctx) && !('productMarketing' in ctx),
  );

  // ── 5. Messages, dont le temps réel ────────────────────────────────────────
  // Le JWT ne va jamais dans l'URL du socket : GET /api/ws-ticket échange le
  // token contre un ticket à usage unique, valable 30 s — voir
  // backend/src/routes/wsTicket.ts.
  const ticketReq = await appel('GET', '/api/ws-ticket', { token });
  const ws = new WebSocket(`${WS}?ticket=${encodeURIComponent(ticketReq.body?.ticket ?? '')}`);
  const ouvert = await new Promise((resolve) => {
    ws.addEventListener('open', () => resolve(true));
    ws.addEventListener('error', () => resolve(false));
    setTimeout(() => resolve(false), 8000);
  });
  verifier('WebSocket ouvert', ouvert);

  const envoi = await appel('POST', `/api/conversations/${convId}/messages`, {
    token,
    body: { text: 'Bonjour, test automatique', from: 'client' },
  });
  verifier('envoi d\'un message client', envoi.status === 201);

  // Horodatage client : ce qui permet la file d'attente hors ligne.
  const passe = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
  const differe = await appel('POST', `/api/conversations/${convId}/messages`, {
    token,
    body: { text: 'Message écrit hors ligne', from: 'client', sentAt: passe },
  });
  verifier(
    'l\'heure de rédaction est conservée',
    differe.body?.msg?.createdAt?.slice(0, 13) === passe.slice(0, 13),
    differe.body?.msg?.createdAt,
  );

  // Réponse de l'équipe : le client doit la recevoir sans recharger.
  const staff = await connexion(STAFF_PHONE);
  const staffToken = staff.body?.token;

  const recu = new Promise((resolve) => {
    const onMsg = (e) => {
      try {
        const p = JSON.parse(e.data);
        if (p.type === 'conv:msg' && p.msg?.from === 'equipe') {
          ws.removeEventListener('message', onMsg);
          resolve(p.msg);
        }
      } catch {
        /* trame ignorée */
      }
    };
    ws.addEventListener('message', onMsg);
    setTimeout(() => resolve(null), 8000);
  });

  await appel('POST', `/api/conversations/${convId}/messages`, {
    token: staffToken,
    body: { text: 'Bien reçu, je regarde votre identité.', from: 'equipe' },
  });

  const pousse = await recu;
  verifier('réponse de l\'équipe reçue en direct', pousse !== null, pousse?.text);

  ws.send(JSON.stringify({ type: 'conv:read', convId }));
  await attendre(600);
  const detail = await appel('GET', `/api/conversations/${convId}`, { token });
  verifier('conv:read remet le fil à lu', detail.body?.unread === false);
  verifier('l\'historique est complet', detail.body?.messages?.length === 3,
    `${detail.body?.messages?.length} messages`);

  ws.close();

  // ── 6. Commandes et modèles ────────────────────────────────────────────────
  const commandes = await appel('GET', '/api/orders', { token });
  verifier('lecture des commandes', commandes.status === 200 && Array.isArray(commandes.body?.items));

  const modeles = await appel('GET', '/api/templates', { token });
  const tousPublies = (modeles.body?.items ?? []).every((t) => t.state === 'PUBLIE');
  verifier('un client ne voit que les modèles publiés', modeles.status === 200 && tousPublies,
    `${modeles.body?.items?.length} modèles`);

  // ── 7. Révocation de session ───────────────────────────────────────────────
  await appel('DELETE', '/api/auth/session', { token });
  const apres = await appel('GET', '/api/me', { token });
  verifier('la déconnexion révoque le token immédiatement', apres.status === 401);

  // ── Bilan ──────────────────────────────────────────────────────────────────
  console.log(`\n${resultats.length - echecs}/${resultats.length} vérifications passées`);
  if (echecs) {
    console.log('\nÉchecs :');
    for (const r of resultats.filter((x) => !x.ok)) console.log(`  - ${r.nom} ${r.detail}`);
  }
  process.exit(echecs ? 1 : 0);
}

main().catch((e) => {
  console.error('\nInterrompu :', e.message);
  process.exit(1);
});
